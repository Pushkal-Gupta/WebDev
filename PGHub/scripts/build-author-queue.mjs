// (Re)build the Python authoring queue: algorithmic problems whose python solution
// is still a stub, that have >=1 test case, are gradeable by the stdin harness, and
// aren't on the exclusion list. Re-run between waves — completed problems (python now
// real) drop out automatically, so `--start 0` always points at remaining work.
//
//   node scripts/build-author-queue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const readJsonSet = (f) => { try { const j = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); return new Set(Array.isArray(j) ? j : Object.keys(j)); } catch { return new Set(); } };
const exclude = new Set([...readJsonSet('stub-corrupted-expected.json'), ...readJsonSet('py-author-exclude.json')]);

const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');
function isStubPy(code) {
  if (!code) return true; const b = code.trim(); if (b.length < 12) return true;
  const nc = b.replace(/(^|\n)\s*#.*/g, ''); const ni = nc.replace(/^\s*(from|import)\s.*$/gm, '');
  const a = ni.split(/def\s+\w+\s*\([^)]*\)\s*(?:->[^:]+)?:/).slice(1).join('\n').trim();
  if (a === '' || /^(pass|\.\.\.|return(\s+None)?)$/.test(a)) return true;
  if (/Reference skeleton|See the Editorial/i.test(code)) return true;
  return false;
}
const withCases = [], zeroCases = []; let sql = 0, anyRet = 0, excluded = 0;
const PAGE = 1000;
for (let off = 0; ; off += PAGE) {
  const { data } = await sb.from('PGcode_problems').select('id,return_type,solutions,test_cases').order('id').range(off, off + PAGE - 1);
  if (!data || !data.length) break;
  for (const p of data) {
    if (!isStubPy(codeOf(p.solutions?.python))) continue;
    if (exclude.has(p.id)) { excluded++; continue; }
    const cases = Array.isArray(p.test_cases) ? p.test_cases : [];
    if (/\+--|Users table|Transactions table|"headers"|Write an SQL/i.test(JSON.stringify(cases.slice(0, 2)))) { sql++; continue; }
    if (p.return_type === 'Any') { anyRet++; continue; }
    if (cases.length >= 1) withCases.push({ id: p.id, cases: cases.length, ret: p.return_type });
    else zeroCases.push({ id: p.id, ret: p.return_type });
  }
  if (data.length < PAGE) break;
}
withCases.sort((a, b) => b.cases - a.cases);
fs.writeFileSync(path.join(__dirname, 'py-author-targets.json'), JSON.stringify(withCases, null, 0));
fs.writeFileSync(path.join(__dirname, 'py-author-zerocases.json'), JSON.stringify(zeroCases, null, 0));
console.log(`authoring queue: ${withCases.length} (has cases) -> py-author-targets.json`);
console.log(`  zero-cases: ${zeroCases.length} | excluded-list: ${excluded} | SQL: ${sql} | Any: ${anyRet}`);
