// Full-catalog health audit. Buckets every problem so nothing hides:
//   - DEAD: has test_cases but ALL (or >50%) expecteds are null/empty AND/OR no
//     usable python canonical -> effectively ungraded (the Q1291 class).
//   - FAILING is measured separately by verify-all-canonicals.mjs.
//   - OOD: test inputs that obviously violate a numeric `low/high`-style bound is
//     hard to detect generically, so we only flag null-expected + no-canonical here.
//   - MISSING_LANGS: which of python/javascript/java/cpp solutions are absent.
//   - RET_ANY: return_type is 'Any' (usually a mis-set type worth tightening).
//   - NO_TESTS: zero test cases.
// Writes /tmp/health/*.json lists so fix-waves can consume them.
//
//   node scripts/audit-catalog-health.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases,description').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
console.log('audited', rows.length, 'problems');

const LANGS = ['python', 'javascript', 'java', 'cpp'];
const isStub = (c) => {
  const s = (c || '').trim();
  if (!s) return true;
  // last meaningful line is a bare pass/... /return None -> stub
  const lines = s.split('\n').map(x => x.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || '';
  return /^(pass|\.\.\.|return None|# *TODO|raise NotImplementedError)$/.test(last) && lines.length < 4;
};
const nullish = (e) => e === null || e === undefined || String(e).trim() === '' || String(e).trim().toLowerCase() === 'null';

const dead = [], missingLangs = [], retAny = [], noTests = [], noMethod = [];
for (const p of rows) {
  const sol = p.solutions || {};
  const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
  const pyCode = sol.python?.code || '';
  const gradeable = !!p.method_name && Array.isArray(p.params);
  if (!p.method_name) { noMethod.push(p.id); }
  if (tcs.length === 0) { if (gradeable) noTests.push(p.id); }
  else {
    const nullCount = tcs.filter(c => nullish(c?.expected)).length;
    const frac = nullCount / tcs.length;
    if ((frac > 0.5 || isStub(pyCode)) && gradeable) {
      dead.push({ id: p.id, method: p.method_name, ret: p.return_type, cases: tcs.length, nullFrac: +frac.toFixed(2), pyStub: isStub(pyCode) });
    }
  }
  const missing = LANGS.filter(L => !(sol[L]?.code || '').trim());
  if (missing.length && gradeable && tcs.length > 0) missingLangs.push({ id: p.id, missing });
  if (p.return_type === 'Any' && gradeable) retAny.push(p.id);
}
fs.mkdirSync('/tmp/health', { recursive: true });
fs.writeFileSync('/tmp/health/dead.json', JSON.stringify(dead, null, 1));
fs.writeFileSync('/tmp/health/missing-langs.json', JSON.stringify(missingLangs, null, 1));
fs.writeFileSync('/tmp/health/ret-any.json', JSON.stringify(retAny, null, 1));
fs.writeFileSync('/tmp/health/no-tests.json', JSON.stringify(noTests, null, 1));
console.log('DEAD (stub canonical / >50% null expecteds, gradeable):', dead.length, '-> /tmp/health/dead.json');
console.log('MISSING_LANGS (gradeable, has tests):', missingLangs.length, '-> /tmp/health/missing-langs.json');
console.log('RET_ANY:', retAny.length, '-> /tmp/health/ret-any.json');
console.log('NO_TESTS (gradeable):', noTests.length, '-> /tmp/health/no-tests.json');
console.log('NO_METHOD (design/SQL/interactive, not Judge0-gradeable):', noMethod.length);
console.log('\nDEAD sample:', dead.slice(0, 15).map(d => d.id).join(', '));
