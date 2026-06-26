// Fix problems whose return_type is the literal "Any" — which makes the Java/C++
// driver templates uncompilable (generateTemplate emits `Any` as the return type).
// We infer the CONCRETE type conservatively from the stored test-case `expected`
// values (ALL sampled expecteds must agree on one JSON shape) and update
// return_type. This is strictly beneficial: python/js templates don't use
// return_type (they stringify the result), so this only ENABLES Java/C++ grading
// (which never compiled under "Any") — it cannot break existing py/js solutions.
//
//   node scripts/fix-any-return-types.mjs           # DRY: print breakdown, no writes
//   node scripts/fix-any-return-types.mjs --apply   # LIVE: update return_type
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(
  process.env.VITE_SUPABASE_URL.startsWith('http') ? process.env.VITE_SUPABASE_URL : `https://${process.env.VITE_SUPABASE_URL}.supabase.co`,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const APPLY = process.argv.includes('--apply');

// Conservative inference: every parsed expected must agree on ONE concrete type.
function infer(expecteds) {
  const vals = [];
  for (const e of expecteds) {
    if (e == null) continue;
    let v; try { v = JSON.parse(e); } catch { return null; } // non-JSON (display string) -> bail
    vals.push(v);
  }
  if (vals.length < 2) return null; // need at least 2 samples to be confident
  const isInt = (x) => Number.isInteger(x);
  const test = {
    bool: (x) => typeof x === 'boolean',
    int: isInt,
    float: (x) => typeof x === 'number' && !Number.isInteger(x),
    str: (x) => typeof x === 'string',
    'List[int]': (x) => Array.isArray(x) && x.every(isInt),
    'List[str]': (x) => Array.isArray(x) && x.every((y) => typeof y === 'string'),
    'List[bool]': (x) => Array.isArray(x) && x.every((y) => typeof y === 'boolean'),
    'List[List[int]]': (x) => Array.isArray(x) && x.length > 0 && x.every((y) => Array.isArray(y) && y.every(isInt)),
  };
  // pick the most specific type that ALL values satisfy
  const order = ['bool', 'int', 'float', 'List[int]', 'List[str]', 'List[bool]', 'List[List[int]]', 'str'];
  for (const t of order) {
    if (vals.every(test[t])) {
      // guard: a number could match both int and float buckets; float only if any non-int
      if (t === 'int' && vals.some((x) => typeof x === 'number' && !Number.isInteger(x))) continue;
      return t;
    }
  }
  return null;
}

async function main() {
  let from = 0; let rows = [];
  for (;;) {
    const { data, error } = await sb.from('PGcode_problems').select('id,return_type,test_cases').range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data || !data.length) break;
    rows = rows.concat(data.filter((r) => String(r.return_type).trim() === 'Any'));
    if (data.length < 1000) break; from += 1000;
  }
  const byType = {}; const fixes = [];
  for (const r of rows) {
    const tc = Array.isArray(r.test_cases) ? r.test_cases : [];
    const t = infer(tc.slice(0, 20).map((c) => c.expected));
    if (!t) continue;
    byType[t] = (byType[t] || 0) + 1;
    fixes.push({ id: r.id, t });
  }
  console.log(`return_type=Any total: ${rows.length} | inferable: ${fixes.length}`);
  console.log('by inferred type:', JSON.stringify(byType, null, 0));
  if (!APPLY) { console.log('\nDRY RUN — no writes. Re-run with --apply to update.'); return; }
  let ok = 0; let err = 0;
  for (const f of fixes) {
    const { error } = await sb.from('PGcode_problems').update({ return_type: f.t }).eq('id', f.id);
    if (error) { err++; if (err < 5) console.error('FAIL', f.id, error.message); } else ok++;
    if (ok % 100 === 0) console.log(`  updated ${ok}...`);
  }
  console.log(`APPLIED: ${ok} updated, ${err} failed.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
