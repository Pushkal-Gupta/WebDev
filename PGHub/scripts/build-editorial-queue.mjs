// Find problems that have a REAL python solution but no NeetCode-style editorial:
// solutions.python is a bare code string, or an object missing `approach`. These get
// an approach + complexity + graduated hints backfilled (code stays as-is, it's
// already graded-correct). Writes scripts/py-editorial-targets.json.
//
//   node scripts/build-editorial-queue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Slugs that fail re-grading (buggy/mismatched stored code) — they need RE-AUTHORING,
// not an editorial; skip them here so editorial agents stop re-hitting the same wall.
let skip = new Set();
try { JSON.parse(fs.readFileSync(path.join(__dirname, 'editorial-skip.json'), 'utf8')).forEach((s) => skip.add(s)); } catch { /* none */ }
const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');
function isStubPy(code) {
  if (!code) return true; const b = code.trim(); if (b.length < 12) return true;
  const nc = b.replace(/(^|\n)\s*#.*/g, ''); const ni = nc.replace(/^\s*(from|import)\s.*$/gm, '');
  const a = ni.split(/def\s+\w+\s*\([^)]*\)\s*(?:->[^:]+)?:/).slice(1).join('\n').trim();
  if (a === '' || /^(pass|\.\.\.|return(\s+None)?)$/.test(a)) return true;
  if (/Reference skeleton|See the Editorial/i.test(code)) return true;
  return false;
}
const targets = [];
const PAGE = 1000;
for (let off = 0; ; off += PAGE) {
  const { data } = await sb.from('PGcode_problems').select('id,solutions,hints,test_cases').order('id').range(off, off + PAGE - 1);
  if (!data || !data.length) break;
  for (const p of data) {
    if (skip.has(p.id)) continue;                          // buggy/mismatched → re-author track
    const py = p.solutions?.python;
    if (isStubPy(codeOf(py))) continue;                    // still a stub → not our job here
    const hasApproach = py && typeof py === 'object' && py.approach && py.approach.trim().length > 20;
    const hasHints = Array.isArray(p.hints) && p.hints.length >= 2;
    const nCases = Array.isArray(p.test_cases) ? p.test_cases.length : 0;
    if (hasApproach && hasHints) continue;                 // already complete
    if (!nCases) continue;                                  // can't re-grade the kept code
    targets.push({ id: p.id, needApproach: !hasApproach, needHints: !hasHints });
  }
  if (data.length < PAGE) break;
}
fs.writeFileSync(path.join(__dirname, 'py-editorial-targets.json'), JSON.stringify(targets, null, 0));
console.log(`editorial backfill targets: ${targets.length} -> py-editorial-targets.json`);
console.log(`  need approach: ${targets.filter((t) => t.needApproach).length} | need hints: ${targets.filter((t) => t.needHints).length}`);
