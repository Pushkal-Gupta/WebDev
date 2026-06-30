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
try { JSON.parse(fs.readFileSync(path.join(__dirname, 'buggy-stored-solutions.json'), 'utf8')).forEach((x) => slugs.add(x.slug || x)); } catch { /* none */ }
for (const dir of ['/tmp/ed', '/tmp/author']) {
  try { for (const f of fs.readdirSync(dir)) { if (/\.fails\.json$/.test(f)) { try { JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).forEach((x) => slugs.add(x.slug || x)); } catch { /* skip */ } } } } catch { /* skip */ }
}
const argList = process.argv.indexOf('--slugs');
if (argList >= 0) { slugs.clear(); process.argv[argList + 1].split(',').forEach((s) => slugs.add(s.trim())); }

function stripFences(code) {
  let c = code.replace(/^\s*```(?:python|py)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return c;
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

  let code = stripFences(orig);
  const fenced = code !== orig;
  let repaired = code;
  let how = fenced ? 'unfenced' : '';

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
