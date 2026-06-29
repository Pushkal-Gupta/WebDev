// Local-execution grader: runs driver-wrapped solutions on the HOST toolchain
// (python3 / node / javac+java / clang++) instead of Judge0. We AUTHOR every
// solution here, so sandboxing buys nothing — local exec is faster, native
// (no amd64-on-arm64 isolate emulation), and has no rate limit. Drop-in for the
// Judge0 `run()` shape: returns { ok, stdout, status, err }.
//
// Used by the solution-authoring / verify-prune / mutation drives whenever
// LOCAL_EXEC=1 (or Judge0 is unreachable). Multi-language: py/js/java/cpp.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart } from './sol-batches/grade-helpers.mjs';

// Apple clang lacks GCC's <bits/stdc++.h>; ship a shim and add it to the include path.
const CPP_SHIM_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cpp-shim');

const clean = (s) => (s || '').replace(/\r\n/g, '\n').replace(/\n+$/, '');

function execRun(cmd, args, stdin, timeoutMs) {
  const r = spawnSync(cmd, args, { input: stdin, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 1 << 26 });
  if (r.error) {
    const to = r.error.code === 'ETIMEDOUT';
    return { ok: false, stdout: clean(r.stdout), status: to ? 'Time Limit Exceeded' : 'Runtime Error', err: String(r.error.message).slice(0, 200) };
  }
  if (r.status !== 0 || r.signal) {
    return { ok: false, stdout: clean(r.stdout), status: r.signal === 'SIGTERM' ? 'Time Limit Exceeded' : 'Runtime Error (NZEC)', err: clean(r.stderr).slice(0, 300) };
  }
  return { ok: true, stdout: clean(r.stdout), status: 'Accepted' };
}

// language_id ints accepted too (71/63/62/54) so callers that pass Judge0 ids still work
const LANG_OF = { 71: 'python', 63: 'javascript', 62: 'java', 54: 'cpp', python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp' };

// Compile/prepare ONCE per identical (lang, source) and reuse across all that
// program's test cases — cpp/java compile is the dominant cost. LRU-capped so a
// long sweep doesn't accumulate temp dirs. Transparent to callers: runLocal keeps
// the same signature, it's just fast on the 2nd..Nth identical source.
const PREP_CACHE = new Map(); // key -> { ok, error, cmd, args, dir }
const PREP_CAP = 48;
const rmDir = (d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ } };
process.on('exit', () => { for (const v of PREP_CACHE.values()) if (v.dir) rmDir(v.dir); });

function prepare(lang, source) {
  const key = lang + ':' + crypto.createHash('sha1').update(source).digest('hex');
  const hit = PREP_CACHE.get(key);
  if (hit) { PREP_CACHE.delete(key); PREP_CACHE.set(key, hit); return hit; } // LRU touch
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-'));
  let res;
  if (lang === 'python') { const f = path.join(dir, 'sol.py'); fs.writeFileSync(f, source); res = { ok: true, cmd: 'python3', args: [f], dir }; }
  else if (lang === 'javascript') { const f = path.join(dir, 'sol.js'); fs.writeFileSync(f, source); res = { ok: true, cmd: 'node', args: ['--stack-size=4000', f], dir }; }
  else if (lang === 'java') {
    const f = path.join(dir, 'Main.java'); fs.writeFileSync(f, source);
    const c = spawnSync('javac', ['-d', dir, f], { encoding: 'utf8', timeout: 40000 });
    res = c.status !== 0 ? { ok: false, error: clean(c.stderr).slice(0, 400), status: 'Compilation Error', dir }
      : { ok: true, cmd: 'java', args: ['-cp', dir, '-Xss64m', 'Main'], dir };
  } else if (lang === 'cpp') {
    const f = path.join(dir, 'sol.cpp'); const bin = path.join(dir, 'sol.bin'); fs.writeFileSync(f, source);
    const c = spawnSync('clang++', ['-O2', '-std=c++17', '-w', `-I${CPP_SHIM_DIR}`, '-o', bin, f], { encoding: 'utf8', timeout: 90000 });
    res = c.status !== 0 ? { ok: false, error: clean(c.stderr).slice(0, 400), status: 'Compilation Error', dir }
      : { ok: true, cmd: bin, args: [], dir };
  } else { rmDir(dir); return { ok: false, error: 'unsupported lang', status: 'unsupported lang' }; }
  PREP_CACHE.set(key, res);
  while (PREP_CACHE.size > PREP_CAP) { const [k, v] = PREP_CACHE.entries().next().value; PREP_CACHE.delete(k); if (v.dir) rmDir(v.dir); }
  return res;
}

export function runLocal(langOrId, source, stdin, { timeoutMs = 8000 } = {}) {
  const lang = LANG_OF[langOrId];
  if (!lang) return { ok: false, status: 'unsupported lang', err: String(langOrId) };
  const p = prepare(lang, source);
  if (!p.ok) return { ok: false, stdout: '', status: p.status || 'Compilation Error', err: p.error || '' };
  return execRun(p.cmd, p.args, stdin, timeoutMs);
}

// Grade one language's code against a problem's cases. Returns
// { ok, pass, n, firstFail:{at,status,got,want,inputs} | null }.
export function gradeLang(lang, code, problem, cases, { timeoutMs = 8000, cmpOpts = {} } = {}) {
  let wrapped;
  try { wrapped = wrapWithDriver(code, lang, problem.method_name, problem.params, problem.return_type); }
  catch (e) { return { ok: false, reason: 'wrap', err: String(e).slice(0, 120), pass: 0, n: 0, firstFail: null }; }
  let pass = 0, n = 0;
  for (const c of cases) {
    n++;
    const r = runLocal(lang, wrapped, buildStdin(c.inputs) + '\n', { timeoutMs });
    if (!r.ok || !compareOutputSmart(r.stdout, c.expected, cmpOpts)) {
      return { ok: false, pass, n, firstFail: { at: n, status: r.status, got: r.stdout, want: c.expected, inputs: c.inputs, err: r.err } };
    }
    pass++;
  }
  return { ok: n > 0, pass, n, firstFail: null };
}

export const LANG_IDS = { python: 71, javascript: 63, java: 62, cpp: 54 };
