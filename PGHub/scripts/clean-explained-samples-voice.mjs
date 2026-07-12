// Strip test-designer meta-voice lead-ins from explained_samples so the prose
// reads like a reader-facing explanation, not commentary about how the test was
// picked. "Canonical LC example. Use union-find..." -> "Use union-find...".
// Conservative: only removes a known leading label (up to its first :/./—/-) and
// recapitalizes the remainder (guarding code-like first tokens). Also removes the
// handful of mid-text self-reference tells ("Wait: ... Re-read: ...").
//
//   node scripts/clean-explained-samples-voice.mjs --dry
//   node scripts/clean-explained-samples-voice.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

const LEAD = /^\s*(Canonical LC example|Canonical example|Classic [^.:—-]*example|Textbook example|Standard example|The canonical [^.:—-]*example|Edge case|Corner case|Boundary case|Tricky case|Trivial case|Basic case|Simple case|Algorithmically interesting|Worth noting|Note|Interesting case|Sanity check|Warm-up|Warmup)\b\s*[:.—-]+\s*/i;

function capFirst(s) {
  const m = s.match(/^([^A-Za-z]*)([A-Za-z].*)$/s);
  if (!m) return s;
  const rest = m[2];
  // don't uppercase a code-ish identifier like `n=1` / `edges(...)` / `k)`
  if (/^[a-z_]\w*\s*[=([)]/.test(rest)) return s;
  return m[1] + rest[0].toUpperCase() + rest.slice(1);
}

function clean(md) {
  let t = String(md || '');
  const before = t;
  // 1) strip a leading meta-label (once)
  if (LEAD.test(t)) t = capFirst(t.replace(LEAD, ''));
  // 2) remove mid-text self-reference tells: kill the sentence-fragment from the
  //    tell to the next sentence boundary.
  t = t.replace(/\s*(Wait:|Re-read:|Re-read\b)[^.?!]*[.?!]/gi, ' ');
  t = t.replace(/\bLC answer is\b/gi, 'The answer is');
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t === before ? null : t;
}

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,explained_samples').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
rows = rows.filter(p => Array.isArray(p.explained_samples) && p.explained_samples.length);

let changedProblems = 0, changedSamples = 0;
for (const p of rows) {
  let touched = false;
  const next = p.explained_samples.map(s => {
    if (!s || !s.explanation_md) return s;
    const c = clean(s.explanation_md);
    if (c && c.length >= 12) { touched = true; changedSamples++; return { ...s, explanation_md: c }; }
    return s;
  });
  if (touched) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ explained_samples: next }).eq('id', p.id); if (error) { console.log('  ERR', p.id, error.message.slice(0, 40)); continue; } }
    changedProblems++;
    if (changedProblems <= 30) console.log(`  ${DRY ? 'would' : 'done'} ${p.id}`);
  }
}
console.log(`\n${DRY ? 'would-clean' : 'cleaned'}: ${changedProblems} problems, ${changedSamples} samples`);
