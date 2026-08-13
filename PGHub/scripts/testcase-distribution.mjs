// Per-problem test-case count distribution + under-covered flagging. Resize-safe (small paged
// reads with pacing so the giant test_cases JSONB never bursts). Buckets counts, lists the
// problems with suspiciously FEW real (non-stress) cases — where coverage may be missing vs LeetCode.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGE = 80;
const buckets = { '0': 0, '1-4': 0, '5-9': 0, '10-19': 0, '20-49': 0, '50+': 0 };
const under = []; // problems with a python solution but < 10 real cases (buildable + under-covered)
let total = 0, gradeable = 0;
for (let from = 0; ; from += PAGE) {
  let data, error;
  for (let a = 0; a < 5; a++) { ({ data, error } = await sb.from('PGcode_problems').select('id,name,difficulty,leetcode_number,solutions,test_cases').order('id').range(from, from + PAGE - 1)); if (!error) break; await sleep(1500 * (a + 1)); }
  if (error) { console.error('ERR', error.message); break; }
  await sleep(200);
  for (const r of data) {
    total++;
    const cases = Array.isArray(r.test_cases) ? r.test_cases.filter((c) => c && Array.isArray(c.inputs)) : [];
    const real = cases.filter((c) => !c.stress).length;
    const n = real;
    if (n === 0) buckets['0']++; else if (n < 5) buckets['1-4']++; else if (n < 10) buckets['5-9']++; else if (n < 20) buckets['10-19']++; else if (n < 50) buckets['20-49']++; else buckets['50+']++;
    const hasPy = !!(r.solutions?.python?.code && r.solutions.python.code.trim().length > 10);
    if (hasPy) { gradeable++; if (n < 10) under.push({ id: r.id, name: r.name, difficulty: r.difficulty, lc: r.leetcode_number, cases: n }); }
  }
  process.stderr.write(`\rscanned ${total}`);
  if (data.length < PAGE) break;
}
under.sort((a, b) => a.cases - b.cases);
fs.writeFileSync('/private/tmp/claude-501/-Users-pushkalgupta-Desktop-WebDev-PGHub/62eea790-8bd0-4c10-aef9-ab3d1df533c5/scratchpad/undercovered.json', JSON.stringify(under, null, 1));
console.log('\n=== TEST-CASE COUNT DISTRIBUTION (real, non-stress) ===');
console.log('total problems:', total, '| with python (gradeable):', gradeable);
console.log(JSON.stringify(buckets, null, 2));
console.log('under-covered (python + <10 real cases):', under.length, '-> undercovered.json');
console.log('sample:', under.slice(0, 15).map((u) => `${u.id}(${u.cases})`).join(', '));
process.exit(0);
