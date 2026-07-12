// Apply LeetCode-quality example rewrites + real param names produced by agents.
// Input JSON: { slug: { params?: ["n","edges"], samples?: [ "<explanation_md for sample 0>", ... ] } }
//   - params: new NAMES only (count must equal current params; types preserved).
//   - samples: reader-voice explanation_md, positionally matched to explained_samples.
//     `inputs` and canonical-graded `expected` are NEVER touched here.
//
//   node scripts/apply-example-quality.mjs --in /tmp/eq/out-0.json [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry');
if (!IN) { console.error('need --in'); process.exit(1); }
const map = JSON.parse(fs.readFileSync(IN, 'utf8'));

const META = /canonical lc|edge case:|algorithmically interesting|catches the bug|always test|near-clique|this example tests|worth noting|re-read|lc answer/i;
let params = 0, samples = 0, probs = 0, skipped = 0;
for (const slug of Object.keys(map)) {
  const entry = map[slug] || {};
  const { data, error } = await sb.from('PGcode_problems').select('id,params,explained_samples').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); skipped++; continue; }
  const patch = {}; let touched = false;
  // params: rename only, count + basic identifier validation
  if (Array.isArray(entry.params) && Array.isArray(data.params) && entry.params.length === data.params.length
    && entry.params.every(n => typeof n === 'string' && /^[A-Za-z_]\w*$/.test(n))) {
    patch.params = data.params.map((p, i) => ({ ...p, name: entry.params[i] }));
    params++; touched = true;
  }
  // samples: rewrite explanation_md positionally; reject if it still reads as meta-voice
  if (Array.isArray(entry.samples) && Array.isArray(data.explained_samples)) {
    const next = data.explained_samples.map((s, i) => {
      const txt = entry.samples[i];
      if (typeof txt === 'string' && txt.trim().length >= 15 && !META.test(txt)) { samples++; return { ...s, explanation_md: txt.trim() }; }
      return s;
    });
    patch.explained_samples = next; touched = true;
  }
  if (!touched) { skipped++; continue; }
  if (!DRY) { const { error: uerr } = await sb.from('PGcode_problems').update(patch).eq('id', slug); if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); skipped++; continue; } }
  probs++;
  if (probs <= 30) console.log(`  ${DRY ? 'would' : 'OK'} ${slug}${patch.params ? ' [params]' : ''}${patch.explained_samples ? ' [' + (entry.samples?.length || 0) + ' samples]' : ''}`);
}
console.log(`\n${DRY ? 'would-update' : 'updated'}: ${probs} problems | params renamed: ${params} | samples rewritten: ${samples} | skipped: ${skipped}`);
