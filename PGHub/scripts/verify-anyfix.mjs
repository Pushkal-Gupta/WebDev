#!/usr/bin/env node
// verify-anyfix.mjs — verify the return_type "Any"->concrete fix end-to-end.
// Samples problems whose return_type is now a concrete scalar/list type and that
// carry non-stub python + java + cpp solutions, then grades the EXISTING java+cpp
// against the stored test_cases via Judge0 (wrapWithDriver + buildStdin +
// compareOutputSmart). Reports compile + pass per language. Read-only on the DB.
//
// Usage: node scripts/verify-anyfix.mjs [--n 20] [--cases 8]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(SUPA_URL, SVC);

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const N = Number(arg('n', 20));
const CASES = Number(arg('cases', 8));
const JUDGE0 = 'https://ce.judge0.com';
const LANG_ID = { python: 71, javascript: 63, java: 62, cpp: 54 };
const CONCRETE = new Set(['int', 'bool', 'str', 'List[int]', 'List[List[int]]', 'List[str]', 'List[bool]', 'float', 'double', 'long']);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function isStub(code) {
  if (!code || !code.trim()) return true;
  const body = code.split('\n').map(l => l.trim()).filter(l =>
    l && !l.startsWith('#') && !l.startsWith('import ') && !l.startsWith('from ') &&
    !l.startsWith('class ') && !l.startsWith('def ') && !l.startsWith('using ') &&
    !l.startsWith('#include') && l !== '{' && l !== '}' && l !== '};');
  if (body.length === 0) return true;
  return body.every(s => s === 'pass' || s === '...' || s === 'return' || /^return\s+(None|null|\{\}|\[\])/.test(s));
}
const codeOf = (entry) => typeof entry === 'string' ? entry : entry?.code;

async function judgeRun(source, langId, stdin) {
  const url = `${JUDGE0}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ language_id: langId, source_code: source, stdin, cpu_time_limit: 6, wall_time_limit: 10 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text().catch(() => '')).slice(0, 80)}`);
      const data = await res.json();
      const status = (data?.status?.description || '').toLowerCase();
      return {
        status,
        stdout: (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, ''),
        stderr: data.stderr || '',
        compile_output: data.compile_output || '',
      };
    } catch (e) {
      lastErr = e;
      await sleep(600 * attempt * attempt);
    }
  }
  throw lastErr;
}

// Grade one language: returns {compile, pass, total, ran, detail}
async function gradeLang(problem, lang) {
  const code = codeOf(problem.solutions?.[lang]);
  if (!code || isStub(code)) return { skip: 'no/stub solution' };
  let wrapped;
  try {
    wrapped = wrapWithDriver(code, lang, problem.method_name, problem.params, problem.return_type);
  } catch (e) {
    return { compile: false, pass: 0, total: 0, ran: 0, detail: `wrap error: ${e.message.slice(0, 60)}` };
  }
  const cases = (problem.test_cases || []).slice(0, CASES);
  if (cases.length === 0) return { skip: 'no test cases' };
  let pass = 0, ran = 0, compileFail = false, compileMsg = '';
  const orderIns = ORDER_INSENSITIVE.has(problem.id);
  for (const tc of cases) {
    const stdin = buildStdin(tc.inputs) + '\n';
    let r;
    try { r = await judgeRun(wrapped, LANG_ID[lang], stdin); }
    catch (e) { await sleep(800); continue; }
    if ((r.compile_output || '').match(/error|Error/) && r.status.includes('compilation')) {
      compileFail = true; compileMsg = (r.compile_output || '').slice(0, 120); break;
    }
    if (r.status === 'accepted' || r.status === '') {
      ran++;
      if (compareOutputSmart(r.stdout, tc.expected, { orderInsensitive: orderIns })) pass++;
    } else if (r.status.includes('compilation')) {
      compileFail = true; compileMsg = (r.compile_output || r.stderr || '').slice(0, 120); break;
    } else {
      ran++; // runtime error counts as ran-but-failed
    }
    await sleep(350);
  }
  if (compileFail) return { compile: false, pass: 0, total: cases.length, ran: 0, detail: compileMsg };
  return { compile: true, pass, total: cases.length, ran, detail: '' };
}

async function main() {
  // Fetch candidates: concrete return_type, non-stub py+java+cpp, has test cases.
  const out = [];
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions, test_cases')
      .order('id', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const r of data) {
      if (!CONCRETE.has(r.return_type)) continue;
      if (!r.method_name || !Array.isArray(r.params) || r.params.length === 0) continue;
      if (!Array.isArray(r.test_cases) || r.test_cases.length < 2) continue;
      const py = codeOf(r.solutions?.python), ja = codeOf(r.solutions?.java), cp = codeOf(r.solutions?.cpp);
      if (!py || isStub(py) || !ja || isStub(ja) || !cp || isStub(cp)) continue;
      out.push(r);
    }
    if (data.length < PAGE) break;
    page++;
  }
  console.log(`candidate pool: ${out.length} problems with concrete return_type + non-stub py/java/cpp`);

  // Sample across return types for variety.
  const byType = {};
  for (const p of out) (byType[p.return_type] ||= []).push(p);
  const sample = [];
  const types = Object.keys(byType);
  let ti = 0;
  while (sample.length < Math.min(N, out.length)) {
    const t = types[ti % types.length];
    const bucket = byType[t];
    if (bucket && bucket.length) sample.push(bucket.shift());
    ti++;
    if (ti > types.length * N) break;
  }
  console.log(`sampling ${sample.length} problems\n`);

  const results = [];
  for (const p of sample) {
    const java = await gradeLang(p, 'java');
    const cpp = await gradeLang(p, 'cpp');
    results.push({ id: p.id, rt: p.return_type, java, cpp });
    const fmt = (x) => x.skip ? `skip(${x.skip})` : (x.compile ? `compile✓ ${x.pass}/${x.total}` : `COMPILE✗ ${x.detail}`);
    console.log(`[${p.return_type.padEnd(14)}] ${p.id.padEnd(42)} java:${fmt(java)}  | cpp:${fmt(cpp)}`);
  }

  // Summary
  let jc = 0, jp = 0, cc = 0, cp = 0, jtot = 0, ctot = 0;
  const repairs = [];
  for (const r of results) {
    if (!r.java.skip) { jtot++; if (r.java.compile) jc++; if (r.java.compile && r.java.pass === r.java.total) jp++; }
    if (!r.cpp.skip) { ctot++; if (r.cpp.compile) cc++; if (r.cpp.compile && r.cpp.pass === r.cpp.total) cp++; }
    if ((r.java.compile && r.java.pass < r.java.total) || (r.cpp.compile && r.cpp.pass < r.cpp.total))
      repairs.push(r.id);
  }
  console.log(`\n=== SUMMARY ===`);
  console.log(`java: ${jc}/${jtot} compiled, ${jp}/${jtot} fully passed`);
  console.log(`cpp:  ${cc}/${ctot} compiled, ${cp}/${ctot} fully passed`);
  console.log(`compile-but-fail (need repair): ${repairs.join(', ') || '(none)'}`);
  fs.writeFileSync('/tmp/anyfix-results.json', JSON.stringify(results, null, 2));
  console.log(`\nfull results -> /tmp/anyfix-results.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
