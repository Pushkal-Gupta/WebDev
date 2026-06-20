#!/usr/bin/env node
// Verify each (problem, language) solution in RICH_CONTENT actually runs and
// passes its first few test cases through Judge0. Picks 3 test cases per
// problem (small, medium, edge). Prints a pass/fail matrix.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL_S = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_S || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL_S, SVC);

const { RICH_CONTENT } = await import(path.join(__dirname, '..', 'src', 'content', 'problemContent.js'));
const { wrapWithDriver, buildStdin, compareOutput } = await import(path.join(__dirname, '..', 'src', 'lib', 'driverCode.js'));

const LANG_ID = { python: 71, javascript: 63, java: 62, cpp: 54, c: 50, go: 60 };
const LANGS = ['python', 'javascript', 'java', 'cpp', 'c', 'go'];
const JUDGE0 = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

async function judge0Run(language, code, stdin) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 45000);
      const r = await fetch(JUDGE0, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language_id: LANG_ID[language], source_code: code, stdin }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!r.ok) {
        if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 2000 * (attempt + 1))); continue; }
        return { status: 'http_error', output: `HTTP ${r.status}` };
      }
      const d = await r.json();
      const id = d.status?.id;
      if (id === 6) return { status: 'compile_error', output: (d.compile_output || '').slice(0, 800) };
      if (id === 5) return { status: 'time_limit', output: 'TLE' };
      if (id === 3) return { status: 'success', output: (d.stdout || '').replace(/\r/g, '').trim() };
      return { status: 'runtime_error', output: ((d.stderr || d.compile_output || d.message || '') + '').slice(0, 800) };
    } catch (e) {
      if (attempt === 2) return { status: 'fetch_error', output: e.message };
      await new Promise(s => setTimeout(s, 2000 * (attempt + 1)));
    }
  }
  return { status: 'fetch_error', output: 'exhausted retries' };
}

const slugs = Object.keys(RICH_CONTENT);
console.log(`Verifying ${slugs.length} problems x ${LANGS.length} languages...\n`);

const { data: probs } = await sb.from('PGcode_problems')
  .select('id, method_name, params, return_type, test_cases')
  .in('id', slugs);
const byId = Object.fromEntries(probs.map(p => [p.id, p]));

function pickCases(tcs, n = 10) {
  const arr = (tcs || []).filter(c => Array.isArray(c.inputs));
  if (arr.length <= n) return arr;
  const step = Math.max(1, Math.floor(arr.length / n));
  const picked = [];
  for (let i = 0; i < n && i * step < arr.length; i++) picked.push(arr[i * step]);
  if (picked[picked.length - 1] !== arr[arr.length - 1]) picked.push(arr[arr.length - 1]);
  return picked;
}

const results = {};
let total = 0, passed = 0;

for (const slug of slugs) {
  const meta = byId[slug];
  const rich = RICH_CONTENT[slug];
  if (!meta || !rich) { console.log(`SKIP ${slug}: missing meta or rich`); continue; }
  if (!Array.isArray(meta.test_cases) || meta.test_cases.length === 0) {
    console.log(`SKIP ${slug}: no test cases`);
    continue;
  }
  results[slug] = {};
  const cases = pickCases(meta.test_cases);
  console.log(`\n=== ${slug} (${cases.length} test cases) ===`);
  for (const lang of LANGS) {
    const sol = rich.solutions?.[lang];
    if (!sol?.code) { results[slug][lang] = 'no_code'; console.log(`  ${lang.padEnd(11)} -- no solution`); total++; continue; }
    let wrapped;
    try {
      wrapped = wrapWithDriver(sol.code, lang, meta.method_name, meta.params, meta.return_type);
    } catch (e) {
      results[slug][lang] = 'wrap_error';
      console.log(`  ${lang.padEnd(11)} XX wrap error: ${e.message.slice(0, 100)}`);
      total++;
      continue;
    }
    let allPassed = true;
    let lastErr = '';
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const stdin = buildStdin(tc.inputs);
      const res = await judge0Run(lang, wrapped, stdin);
      if (res.status !== 'success') {
        allPassed = false;
        lastErr = `case ${i + 1}/${cases.length} ${res.status}: ${res.output.slice(0, 200)}`;
        break;
      }
      if (!compareOutput(res.output, tc.expected)) {
        allPassed = false;
        lastErr = `case ${i + 1}/${cases.length} WA: expected=${tc.expected} got=${res.output.slice(0, 200)}`;
        break;
      }
      // Brief delay to be polite to public Judge0.
      await new Promise(r => setTimeout(r, 350));
    }
    total++;
    if (allPassed) {
      passed++;
      results[slug][lang] = 'pass';
      console.log(`  ${lang.padEnd(11)} OK`);
    } else {
      results[slug][lang] = lastErr;
      console.log(`  ${lang.padEnd(11)} FAIL ${lastErr}`);
    }
  }
}

console.log(`\n=== SUMMARY: ${passed}/${total} passed ===\n`);
for (const slug of slugs) {
  const row = LANGS.map(l => {
    const v = results[slug]?.[l] || '-';
    if (v === 'pass') return `${l}:OK`;
    if (v === 'no_code') return `${l}:NA`;
    return `${l}:FAIL`;
  }).join(' ');
  console.log(`${slug.padEnd(45)} ${row}`);
}

process.exit(passed === total ? 0 : 1);
