// Re-grade every stored solution (python/js/java/cpp) against the CURRENT test set —
// including the freshly-added stress cases — to catch any stored solution that now FAILS
// (wrong answer OR too slow on the large stress input). Reports offenders per language.
//   node scripts/verify-stored-solutions.mjs [--offset N] [--limit N] [--only stress]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const OFFSET = arg('offset', 0), LIMIT = arg('limit', 100000);
const ONLY_STRESS = process.argv.includes('--only') && process.argv[process.argv.indexOf('--only') + 1] === 'stress';
const LANGS = ['python', 'javascript', 'java', 'cpp'];

let rows = [], from = 0;
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
rows = rows.filter((p) => (Array.isArray(p.test_cases) ? p.test_cases : []).some((c) => c && c.stress));
if (ONLY_STRESS) { /* already filtered to problems that HAVE a stress case */ }
const work = rows.slice(OFFSET, OFFSET + LIMIT);
console.log(`problems with a stress case: ${rows.length} | grading ${work.length}`);

const fails = [];
let checked = 0;
for (const p of work) {
  const cases = (p.test_cases || []).filter((c) => Array.isArray(c.inputs));
  if (!cases.length) continue;
  const params = Array.isArray(p.params) ? p.params : [];
  for (const lang of LANGS) {
    const code = p.solutions?.[lang]?.code; if (!code) continue;
    let wrapped; try { wrapped = wrapWithDriver(code, lang, p.method_name, params, p.return_type); } catch { fails.push({ id: p.id, lang, why: 'wrap-error' }); continue; }
    let bad = null;
    for (const c of cases) {
      const r = runLocal(lang, wrapped, buildStdin(c.inputs.map(String)) + '\n', { timeoutMs: 5200 });
      if (!r || !r.ok) { bad = c.stress ? 'TLE/crash on stress' : 'fail on normal'; break; }
      if (!compareOutput((r.stdout ?? '').replace(/\n$/, ''), c.expected)) { bad = c.stress ? 'wrong on stress' : 'wrong on normal'; break; }
    }
    if (bad) fails.push({ id: p.id, lang, why: bad });
  }
  checked++;
  if (checked % 25 === 0) console.log(`  ...${checked}/${work.length} checked, ${fails.length} failures so far`);
}
fs.mkdirSync('/tmp/health', { recursive: true });
fs.writeFileSync('/tmp/health/stored-solution-fails.json', JSON.stringify(fails, null, 1));
const byWhy = fails.reduce((a, f) => (a[f.why] = (a[f.why] || 0) + 1, a), {});
console.log(`\nDONE. stored-solution failures: ${fails.length}`);
console.log('by reason:', JSON.stringify(byWhy, null, 1));
console.log('-> /tmp/health/stored-solution-fails.json');
