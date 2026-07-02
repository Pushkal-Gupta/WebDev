// Mechanically repair buggy stored Python solutions the editorial QA pass flagged:
//  - code fenced in ```python ... ``` markdown  -> strip the fences
//  - a bare top-level `def f(...)` with no `class Solution` -> append a delegating
//    `class Solution` whose `method_name` calls f(*args). This also fixes the
//    method-name-mismatch case for free (the wrapper exposes method_name and
//    delegates to whatever the code actually defined).
// Then grade on the host toolchain and write back ONLY if it passes — a bad repair
// can never land. Candidates: scripts/buggy-stored-solutions.json + any
// /tmp/ed/*.fails.json + /tmp/author/*.fails.json the drives produced.
//
//   node scripts/fix-stored-mechanical.mjs --dry
//   node scripts/fix-stored-mechanical.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { gradeLang } from './local-grade.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');

// collect candidate slugs
const slugs = new Set();
const ALL = process.argv.includes('--all');
function isStubPy(code) {
  if (!code) return true; const b = code.trim(); if (b.length < 12) return true;
  const nc = b.replace(/(^|\n)\s*#.*/g, ''); const ni = nc.replace(/^\s*(from|import)\s.*$/gm, '');
  const a = ni.split(/def\s+\w+\s*\([^)]*\)\s*(?:->[^:]+)?:/).slice(1).join('\n').trim();
  if (a === '' || /^(pass|\.\.\.|return(\s+None)?)$/.test(a)) return true;
  if (/Reference skeleton|See the Editorial/i.test(code)) return true;
  return false;
}
if (ALL) {
  const co = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');
  for (let off = 0; ; off += 1000) {
    const { data } = await sb.from('PGcode_problems').select('id,solutions').order('id').range(off, off + 999);
    if (!data || !data.length) break;
    for (const p of data) { if (!isStubPy(co(p.solutions?.python))) slugs.add(p.id); }
    if (data.length < 1000) break;
  }
} else {
  try { JSON.parse(fs.readFileSync(path.join(__dirname, 'buggy-stored-solutions.json'), 'utf8')).forEach((x) => slugs.add(x.slug || x)); } catch { /* none */ }
  for (const dir of ['/tmp/ed', '/tmp/author']) {
    try { for (const f of fs.readdirSync(dir)) { if (/\.fails\.json$/.test(f)) { try { JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).forEach((x) => slugs.add(x.slug || x)); } catch { /* skip */ } } } } catch { /* skip */ }
  }
}
const argList = process.argv.indexOf('--slugs');
if (argList >= 0) { slugs.clear(); process.argv[argList + 1].split(',').forEach((s) => slugs.add(s.trim())); }

function stripFences(code) {
  let c = code.replace(/^\s*```(?:python|py)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return c;
}
// Prepend imports for stdlib names the code uses but never imports (a large class of
// stored solutions NZEC purely because of a missing `from collections import ...`).
function addMissingImports(code) {
  const adds = [];
  const used = (n) => new RegExp(`(?<![.\\w])${n}\\s*\\(`).test(code) && !new RegExp(`import[^\\n]*\\b${n}\\b`).test(code);
  const collFrom = ['deque', 'defaultdict', 'Counter', 'OrderedDict', 'namedtuple'].filter(used);
  if (collFrom.length) adds.push(`from collections import ${collFrom.join(', ')}`);
  if (/(\bheapq\.\w|(?<![.\w])(heappush|heappop|heapify|heapreplace|nlargest|nsmallest)\s*\()/.test(code) && !/import\s+heapq|from\s+heapq/.test(code)) adds.push('import heapq');
  if (/(\bbisect\.\w|(?<![.\w])(bisect_left|bisect_right|insort|insort_left|insort_right)\s*\()/.test(code) && !/import\s+bisect|from\s+bisect/.test(code)) adds.push('import bisect');
  if (used('reduce')) adds.push('from functools import reduce');
  const itFrom = ['combinations', 'permutations', 'accumulate', 'product', 'groupby', 'chain'].filter(used);
  if (itFrom.length) adds.push(`from itertools import ${itFrom.join(', ')}`);
  if (/\bmath\.\w+/.test(code) && !/import\s+math/.test(code)) adds.push('import math');
  if (!adds.length) return code;
  return adds.join('\n') + '\n' + code;
}
// top-level (column-0) def names, in order
function topLevelDefs(code) {
  return [...code.matchAll(/^def\s+([a-zA-Z_]\w*)\s*\(/gm)].map((m) => m[1]);
}
function hasSolutionMethod(code, method) {
  if (!/class\s+Solution\b/.test(code)) return false;
  // method defined somewhere after the class (best-effort)
  return new RegExp(`def\\s+${method}\\s*\\(`).test(code);
}

async function processOne(slug) {
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) return { slug, skip: 'not found' };
  const cases = (Array.isArray(data.test_cases) ? data.test_cases : []).slice(0, 12);
  if (!cases.length) return { slug, skip: 'no cases' };
  const orig = codeOf(data.solutions?.python);
  if (!orig) return { slug, skip: 'no code' };

  let repaired = stripFences(orig);
  let how = repaired !== orig ? 'unfenced' : '';
  const withImports = addMissingImports(repaired);
  if (withImports !== repaired) { repaired = withImports; how = how ? how + '+imports' : 'imports'; }
  const code = repaired;

  if (!hasSolutionMethod(code, data.method_name)) {
    const defs = topLevelDefs(code);
    // pick the entry: prefer one named method_name, else the last top-level def
    const entry = defs.includes(data.method_name) ? data.method_name : defs[defs.length - 1];
    if (entry) {
      repaired = `${code.trimEnd()}\n\n\nclass Solution:\n    def ${data.method_name}(self, *args, **kwargs):\n        return ${entry}(*args, **kwargs)\n`;
      how = how ? how + '+delegate' : 'delegate';
    }
  }
  if (repaired === orig) return { slug, skip: 'no transform applicable' };

  const g = gradeLang('python', repaired, data, cases);
  if (!g.ok) return { slug, fail: `${g.firstFail?.status || g.reason} @${g.firstFail?.at}/${cases.length}`, how };
  if (DRY) return { slug, would: `${how} PASS ${g.pass}/${g.n}` };
  const prev = data.solutions?.python;
  const merged = { ...(data.solutions || {}) };
  merged.python = (prev && typeof prev === 'object') ? { ...prev, code: repaired } : repaired;
  const { error: uerr } = await sb.from('PGcode_problems').update({ solutions: merged }).eq('id', slug);
  if (uerr) return { slug, fail: 'write ' + uerr.message.slice(0, 40) };
  return { slug, fixed: `${how} PASS ${g.pass}/${g.n}` };
}

console.log(`fix-stored-mechanical ${DRY ? '(DRY)' : '(APPLY)'} | candidates: ${slugs.size}\n`);
let fixed = 0, failed = 0, skipped = 0;
for (const slug of slugs) {
  const r = await processOne(slug);
  if (r.fixed) { fixed++; console.log(`  FIX  ${slug}: ${r.fixed}`); }
  else if (r.would) { fixed++; console.log(`  WOULD ${slug}: ${r.would}`); }
  else if (r.fail) { failed++; console.log(`  fail ${slug}: ${r.fail}`); }
  else { skipped++; /* console.log(`  -    ${slug}: ${r.skip}`); */ }
}
console.log(`\n${DRY ? 'would-fix' : 'fixed'}: ${fixed} | still-failing: ${failed} | skipped: ${skipped}`);
