#!/usr/bin/env node
/* Local Judge0-API shim — speaks the subset of the Judge0 CE submissions API that
   bulk-grow-test-cases.js and backfill-solutions.mjs use, but runs code with the
   machine's own runtimes (python3 / node / javac+java / g++). No Docker, no key,
   no rate limit. Point the scripts at it with `--judge0 http://localhost:2358`.

   Endpoint: POST /submissions?base64_encoded=false&wait=true
   Body:     { language_id, source_code, stdin, cpu_time_limit, wall_time_limit }
   Response: { stdout, stderr, compile_output, message, time, status:{id,description} }

   Judge0 status ids used: 3 Accepted · 5 TLE · 6 Compilation Error · 11 Runtime Error. */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const PORT = Number(process.env.PORT || 2358);
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'j0local-'));
let seq = 0;

const ACCEPT = { id: 3, description: 'Accepted' };
const TLE = { id: 5, description: 'Time Limit Exceeded' };
const CE = { id: 6, description: 'Compilation Error' };
const RE = { id: 11, description: 'Runtime Error (NZEC)' };

// language_id -> how to build+run in a per-request dir
const LANGS = {
  71: { // Python 3
    file: 'main.py',
    run: () => ({ cmd: 'python3', args: ['main.py'] }),
  },
  63: { // JavaScript (Node)
    file: 'main.js',
    run: () => ({ cmd: 'node', args: ['main.js'] }),
  },
  62: { // Java — Judge0 convention: public class Main in Main.java
    file: 'Main.java',
    detectFile: (src) => {
      const m = src.match(/public\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_$][\w$]*)/);
      return m ? `${m[1]}.java` : 'Main.java';
    },
    compile: (dir, file) => ({ cmd: 'javac', args: [file], cwd: dir }),
    run: (dir, file) => ({ cmd: 'java', args: [file.replace(/\.java$/, '')] }),
  },
  54: { // C++ (g++)
    file: 'main.cpp',
    compile: (dir) => ({ cmd: 'g++', args: ['-O2', '-std=c++17', '-o', 'main', 'main.cpp'], cwd: dir }),
    run: () => ({ cmd: './main', args: [] }),
  },
};

function runOnce(cmd, args, cwd, stdin, wallMs) {
  return new Promise((resolve) => {
    let stdout = '', stderr = '', done = false;
    const t0 = Date.now();
    let child;
    try {
      child = spawn(cmd, args, { cwd, env: process.env });
    } catch (e) {
      return resolve({ timedOut: false, code: 127, stdout: '', stderr: String(e.message), ms: 0 });
    }
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try { child.kill('SIGKILL'); } catch {}
      resolve({ timedOut: true, code: null, stdout, stderr, ms: Date.now() - t0 });
    }, wallMs);
    child.stdout.on('data', (d) => { stdout += d; if (stdout.length > 2_000_000) { try { child.kill('SIGKILL'); } catch {} } });
    child.stderr.on('data', (d) => { stderr += d; if (stderr.length > 1_000_000) { try { child.kill('SIGKILL'); } catch {} } });
    child.on('error', (e) => { if (done) return; done = true; clearTimeout(timer); resolve({ timedOut: false, code: 127, stdout, stderr: stderr || String(e.message), ms: Date.now() - t0 }); });
    child.on('close', (code) => { if (done) return; done = true; clearTimeout(timer); resolve({ timedOut: false, code, stdout, stderr, ms: Date.now() - t0 }); });
    if (stdin != null) { try { child.stdin.write(stdin); } catch {} }
    try { child.stdin.end(); } catch {}
  });
}

async function execSubmission(body) {
  const lang = LANGS[body.language_id];
  if (!lang) return { status: { id: 13, description: 'Internal Error' }, message: `unsupported language_id ${body.language_id}` };
  const src = String(body.source_code || '');
  const wallMs = Math.round((Number(body.wall_time_limit) || 10) * 1000);
  const dir = path.join(ROOT, `s${++seq}`);
  fs.mkdirSync(dir, { recursive: true });
  try {
    const file = lang.detectFile ? lang.detectFile(src) : lang.file;
    fs.writeFileSync(path.join(dir, file), src);
    if (lang.compile) {
      const c = lang.compile(dir, file);
      const r = spawnSync(c.cmd, c.args, { cwd: c.cwd || dir, encoding: 'utf8', timeout: 30000 });
      if (r.error || r.status !== 0) {
        const out = (r.stderr || '') + (r.stdout || '') + (r.error ? r.error.message : '');
        return { status: CE, compile_output: out.slice(0, 4000), stdout: '', stderr: '' };
      }
    }
    const run = lang.run(dir, file);
    const res = await runOnce(run.cmd, run.args, dir, body.stdin, wallMs);
    if (res.timedOut) return { status: TLE, stdout: res.stdout, stderr: res.stderr, time: (res.ms / 1000).toFixed(3) };
    if (res.code !== 0) return { status: RE, stdout: res.stdout, stderr: (res.stderr || `exit ${res.code}`).slice(0, 4000), time: (res.ms / 1000).toFixed(3) };
    return { status: ACCEPT, stdout: res.stdout, stderr: res.stderr, time: (res.ms / 1000).toFixed(3) };
  } finally {
    fs.rm(dir, { recursive: true, force: true }, () => {});
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/about') || req.url.startsWith('/health'))) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ shim: 'judge0-local', ok: true }));
  }
  if (req.method !== 'POST' || !req.url.startsWith('/submissions')) {
    res.writeHead(404); return res.end('not found');
  }
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 8_000_000) req.destroy(); });
  req.on('end', async () => {
    let body;
    try { body = JSON.parse(raw); } catch { res.writeHead(400); return res.end('bad json'); }
    try {
      const out = await execSubmission(body);
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: { id: 13, description: 'Internal Error' }, message: String(e && e.message) }));
    }
  });
});

server.listen(PORT, () => {
  const have = (c) => spawnSync(c, ['--version'], { encoding: 'utf8' }).status === 0 || spawnSync(c, ['-version'], { encoding: 'utf8' }).status === 0;
  console.log(`judge0-local listening on http://localhost:${PORT}`);
  console.log(`runtimes: python3=${have('python3')} node=${have('node')} javac=${have('javac')} g++=${have('g++')}`);
  console.log(`workdir: ${ROOT}`);
});
