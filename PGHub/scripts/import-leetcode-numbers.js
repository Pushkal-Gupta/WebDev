#!/usr/bin/env node
// Fetches LeetCode's public problems list and populates
// PGcode_problems.leetcode_number by matching on slug.
//
// LC exposes /api/problems/all/ which returns stat_status_pairs[] where each
// entry has stat.question__title_slug and stat.frontend_question_id.
//
// Usage: node scripts/import-leetcode-numbers.js [--dry]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dry = process.argv.includes('--dry');

console.log('Fetching LeetCode problems index...');
const resp = await fetch('https://leetcode.com/api/problems/all/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PGcode/1.0)' },
});
if (!resp.ok) {
  console.error(`LC API returned ${resp.status}`);
  process.exit(1);
}
const lc = await resp.json();
const pairs = lc.stat_status_pairs || [];
console.log(`LC returned ${pairs.length} problems`);

const slugToNumber = new Map();
for (const entry of pairs) {
  const slug = entry?.stat?.question__title_slug;
  const num = entry?.stat?.frontend_question_id;
  if (slug && typeof num === 'number') slugToNumber.set(slug, num);
}
console.log(`Built slug→number map for ${slugToNumber.size} problems`);

console.log('Fetching PGcode problems (paginated)...');
const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,leetcode_number')
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`PGcode has ${all.length} problems`);

let matched = 0, alreadySet = 0, unmatched = 0;
const updates = [];
for (const p of all) {
  const num = slugToNumber.get(p.id);
  if (num == null) { unmatched++; continue; }
  if (p.leetcode_number === num) { alreadySet++; continue; }
  matched++;
  updates.push({ id: p.id, leetcode_number: num });
}

console.log(`Matched: ${matched} | Already set: ${alreadySet} | Unmatched: ${unmatched}`);
if (dry) {
  console.log('--dry: not writing. Sample of updates:');
  console.log(JSON.stringify(updates.slice(0, 5), null, 2));
  process.exit(0);
}

let ok = 0, fail = 0;
for (const u of updates) {
  const { error } = await sb.from('PGcode_problems').update({ leetcode_number: u.leetcode_number }).eq('id', u.id);
  if (error) { fail++; console.error(u.id, error.message); }
  else ok++;
}
console.log(JSON.stringify({ updated: ok, failed: fail }, null, 2));
