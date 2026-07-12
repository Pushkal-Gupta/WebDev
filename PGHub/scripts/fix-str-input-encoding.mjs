// Fix str-typed params whose stored test-case inputs are BARE strings (e.g. the
// literal `leet`) instead of JSON-encoded (`"leet"`). The driver does
// `json.loads(line)` for each param, so a bare string throws JSONDecodeError and
// the canonical can't grade a single case. Also normalizes the param/return type
// `string`->`str` so wrapWithDriver emits the right parser. SAFE: re-grades the
// canonical after the fix and only writes when it now passes all its cases.
//
//   node scripts/fix-str-input-encoding.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const isStr = (t) => t === 'str' || t === 'string' || t === 'String';

// A str input is "properly encoded" iff JSON.parse succeeds AND yields a string.
function reencodeStr(raw) {
  const s = String(raw);
  try { const v = JSON.parse(s); if (typeof v === 'string') return s; } catch { /* bare */ }
  return JSON.stringify(s); // bare or non-string JSON -> quote it as the literal string
}

async function gradeAll(code, method, params, retType, tcs) {
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', method, params, retType); } catch { return -1; }
  let pass = 0; const N = Math.min(tcs.length, 30);
  for (let i = 0; i < N; i++) {
    const c = tcs[i]; if (!Array.isArray(c.inputs)) return -1;
    let r; try { r = runLocal('python', wrapped, buildStdin(c.inputs.map(String)) + '\n', { timeoutMs: 6000 }); } catch { continue; }
    if (r && r.ok && compareOutput((r.stdout ?? '').replace(/\n$/, ''), c.expected)) pass++;
  }
  return `${pass}/${N}`;
}

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
rows = rows.filter(p => Array.isArray(p.params) && p.params.some(x => isStr(x?.type)) && Array.isArray(p.test_cases) && p.test_cases.length >= 3 && p.solutions?.python?.code);

let fixed = 0, skipped = 0;
for (const p of rows) {
  const strIdx = p.params.map((x, i) => isStr(x?.type) ? i : -1).filter(i => i >= 0);
  // does any str input need re-encoding?
  let needs = false;
  const newCases = p.test_cases.map(c => {
    if (!Array.isArray(c.inputs)) return c;
    const inp = c.inputs.slice();
    for (const i of strIdx) { if (i < inp.length) { const ne = reencodeStr(inp[i]); if (ne !== String(inp[i])) { inp[i] = ne; needs = true; } } }
    return { ...c, inputs: inp };
  });
  const newParams = p.params.map(x => isStr(x?.type) ? { ...x, type: 'str' } : x);
  const newRet = p.return_type === 'string' || p.return_type === 'String' ? 'str' : p.return_type;
  const typeChanged = newRet !== p.return_type || p.params.some(x => x?.type === 'string' || x?.type === 'String');
  if (!needs && !typeChanged) { skipped++; continue; }
  const before = await gradeAll(p.solutions.python.code, p.method_name, p.params, p.return_type, p.test_cases);
  const after = await gradeAll(p.solutions.python.code, p.method_name, newParams, newRet, newCases);
  const beforeN = before === -1 ? -1 : Number(before.split('/')[0]);
  const afterOk = after !== -1 && after.split('/')[0] === after.split('/')[1];
  const improved = after !== -1 && (before === -1 || Number(after.split('/')[0]) > beforeN);
  if (afterOk && improved) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ params: newParams, return_type: newRet, test_cases: newCases }).eq('id', p.id); if (error) { console.log('  ERR', p.id, error.message.slice(0, 40)); continue; } }
    fixed++;
    console.log(`  ${DRY ? 'would-fix' : 'FIXED'} ${p.id}: ${before} -> ${after}${typeChanged ? ' (+type str)' : ''}`);
  } else skipped++;
}
console.log(`\n${DRY ? 'would-fix' : 'fixed'}: ${fixed} | skipped: ${skipped}`);
