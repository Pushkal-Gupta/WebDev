// Normalize non-canonical param/return type names to the ones the grading driver
// understands — but SAFELY: for each problem, compute normalized types, and only
// write them if the canonical then passes MORE of its own test cases than before
// (test-before-write). This fixes problems whose canonical was correct but whose
// type strings ("string", "Optional[TreeNode]", "long", "List[number]") made
// wrapWithDriver emit a broken/absent parser.
//
//   node scripts/normalize-types.mjs [--dry]
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

const MAP = {
  string: 'str', String: 'str', 'List[string]': 'List[str]', 'List[String]': 'List[str]',
  number: 'int', 'List[number]': 'List[int]', integer: 'int', Integer: 'int', Boolean: 'bool', boolean: 'bool', Float: 'float', double: 'float', Double: 'float',
  long: 'int', 'List[long]': 'List[int]', Long: 'int',
  'Optional[TreeNode]': 'TreeNode', 'Optional[ListNode]': 'ListNode', 'Optional[Node]': 'Node',
  'Optional[int]': 'int', 'Optional[str]': 'str', 'List[Optional[int]]': 'List[int]', 'List[Optional[ListNode]]': 'List[ListNode]',
  'Optional[List[int]]': 'List[int]',
};
const norm = (t) => MAP[t] || t;

function gradeRate(code, method, params, retType) {
  // returns {ok, pass, total} — how many of the problem's cases the canonical passes
  return async (tcs) => {
    let wrapped; try { wrapped = wrapWithDriver(code, 'python', method, params, retType); } catch { return { ok: false, pass: 0, total: tcs.length }; }
    let pass = 0; const N = Math.min(tcs.length, 30);
    for (let i = 0; i < N; i++) {
      const c = tcs[i]; if (!Array.isArray(c.inputs)) continue;
      let r; try { r = runLocal('python', wrapped, buildStdin(c.inputs.map(String)) + '\n', { timeoutMs: 6000 }); } catch { continue; }
      if (r && r.ok && compareOutput((r.stdout ?? '').replace(/\n$/, ''), c.expected)) pass++;
    }
    return { ok: true, pass, total: N };
  };
}

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }

let fixed = 0, unchanged = 0, noImprove = 0;
for (const p of rows) {
  const params = Array.isArray(p.params) ? p.params : [];
  const newParams = params.map(x => ({ ...x, type: norm(x?.type) }));
  const newRet = norm(p.return_type);
  const changed = JSON.stringify(newParams.map(x => x.type)) !== JSON.stringify(params.map(x => x?.type)) || newRet !== p.return_type;
  if (!changed) { unchanged++; continue; }
  const code = p.solutions?.python?.code; const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (!code || !/class\s+Solution/.test(code) || tcs.length < 3) continue;
  const before = await gradeRate(code, p.method_name, params, p.return_type)(tcs);
  const after = await gradeRate(code, p.method_name, newParams, newRet)(tcs);
  if (after.pass > before.pass && after.pass === after.total) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ params: newParams, return_type: newRet }).eq('id', p.id); if (error) { console.log('  ERR', p.id, error.message.slice(0, 40)); continue; } }
    fixed++;
    console.log(`  ${DRY ? 'would-fix' : 'FIXED'} ${p.id}: ${params.map(x => x?.type).join(',')}->${newParams.map(x => x.type).join(',')} ret ${p.return_type}->${newRet} | ${before.pass}/${before.total} -> ${after.pass}/${after.total}`);
  } else { noImprove++; }
}
console.log(`\n${DRY ? 'would-fix' : 'fixed'}: ${fixed} | type-changed-but-no-improvement: ${noImprove} | unchanged: ${unchanged}`);
