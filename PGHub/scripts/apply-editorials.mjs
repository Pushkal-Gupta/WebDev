// Apply agent-produced multi-approach editorials. Reads /tmp/appr/out-*.json
// (each = array of {id, editorial_md}), validates it actually presents brute+optimal
// with complexity, and stores editorial_md. Idempotent.
//   node scripts/apply-editorials.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

function valid(md) {
  if (typeof md !== 'string' || md.length < 300) return 'too-short';
  if (!/brute|naive/i.test(md)) return 'no-brute';
  if (!/optimal|efficient/i.test(md)) return 'no-optimal';
  if (!/O\(/.test(md)) return 'no-complexity';
  return null;
}

const dir = '/tmp/appr';
const files = fs.readdirSync(dir).filter((f) => /^out-\d+\.json$/.test(f));
let applied = 0, bad = 0; const rejects = [];
for (const f of files) {
  let arr; try { arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { console.log('unparseable', f); continue; }
  if (!Array.isArray(arr)) continue;
  for (const { id, editorial_md } of arr) {
    const why = valid(editorial_md);
    if (why) { bad++; rejects.push({ id, why }); continue; }
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ editorial_md }).eq('id', id); if (error) { rejects.push({ id, why: 'db:' + error.message.slice(0, 40) }); continue; } }
    applied++;
  }
}
console.log(`editorials applied: ${applied} | rejected: ${bad}${DRY ? ' (DRY)' : ''}`);
if (rejects.length) console.log('rejects:', JSON.stringify(rejects.slice(0, 20)));
