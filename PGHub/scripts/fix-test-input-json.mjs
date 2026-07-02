// Normalize test-case INPUTS stored as Python-repr (single-quoted strings, None/
// True/False) into valid JSON so the stdin harness's json.loads can parse them.
// A whole class of otherwise-correct solutions NZEC only because e.g. the input is
// "'3A2C'" (single-quoted) instead of "\"3A2C\"". We only rewrite an input when the
// normalized form is valid JSON AND the original was not — never touch clean data.
//
//   node scripts/fix-test-input-json.mjs --slugs a,b     # specific
//   node scripts/fix-test-input-json.mjs --from-fails    # collect from /tmp/ra + /tmp/ed fails
//   add --dry to preview
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const DRY = process.argv.includes('--dry');

const slugs = new Set();
if (arg('slugs')) arg('slugs').split(',').forEach((s) => slugs.add(s.trim()));
if (process.argv.includes('--from-fails')) {
  for (const dir of ['/tmp/ra', '/tmp/ed', '/tmp/author']) {
    try { for (const f of fs.readdirSync(dir)) { if (/\.fails\.json$/.test(f)) { try { JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).forEach((x) => slugs.add(x.slug || x)); } catch { /* skip */ } } } } catch { /* skip */ }
  }
}

const isValidJson = (s) => { try { JSON.parse(s); return true; } catch { return false; } };
// Convert a Python-repr scalar/collection string to JSON. Conservative: single→double
// quotes, None/True/False→null/true/false. Only used when it yields valid JSON.
function toJson(s) {
  if (typeof s !== 'string') return s;
  let out = s.replace(/'/g, '"').replace(/\bNone\b/g, 'null').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
  return out;
}

let fixed = 0, skipped = 0, cases = 0;
for (const slug of slugs) {
  const { data, error } = await sb.from('PGcode_problems').select('id,test_cases').eq('id', slug).single();
  if (error || !data || !Array.isArray(data.test_cases)) { skipped++; continue; }
  let changed = false; let ok = true;
  const tc = data.test_cases.map((c) => {
    if (!c || !Array.isArray(c.inputs)) return c;
    const inputs = c.inputs.map((inp) => {
      if (typeof inp !== 'string' || isValidJson(inp)) return inp; // already fine
      const j = toJson(inp);
      if (isValidJson(j)) { changed = true; cases++; return j; }
      ok = false; return inp; // couldn't normalize → leave, will report
    });
    return { ...c, inputs };
  });
  if (!changed) { skipped++; continue; }
  if (!ok) { console.log(`  PARTIAL ${slug}: some inputs un-normalizable`); }
  if (DRY) { console.log(`  WOULD ${slug}: normalized inputs`); fixed++; continue; }
  const { error: uerr } = await sb.from('PGcode_problems').update({ test_cases: tc }).eq('id', slug);
  if (uerr) { console.log(`  ERR ${slug}: ${uerr.message.slice(0, 40)}`); skipped++; continue; }
  console.log(`  FIX ${slug}: normalized ${data.test_cases.length} cases' inputs to JSON`);
  fixed++;
}
console.log(`\n${DRY ? 'would-fix' : 'fixed'}: ${fixed} | skipped: ${skipped} | input values normalized: ${cases}`);
