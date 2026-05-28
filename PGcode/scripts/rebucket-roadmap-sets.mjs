#!/usr/bin/env node
// Cap bucket '200' at 100 canonical problems (lowest LC numbers first) so the
// roadmap_set column matches its intent: PGcode-X means X questions. Buckets
// 100/300/400/500 are already at their proper curated sizes — left alone.
// Overflow from '200' (~2886 problems) → roadmap_set=NULL.
//
// Why: import-time fallback dumped every LC problem into '200' which made the
// bucket meaningless. The PGcode-N modes still pick top-N via selectExactlyN,
// but the DB column now means what it says.
//
// Usage: node scripts/rebucket-roadmap-sets.mjs [--dry]

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

const in200 = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,leetcode_number')
    .eq('roadmap_set', '200')
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  in200.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Bucket '200' currently holds: ${in200.length}`);

// Sort: prefer real LC numbers (smaller = more canonical), then by name.
const sorted = [...in200].sort((a, b) => {
  const aHas = typeof a.leetcode_number === 'number';
  const bHas = typeof b.leetcode_number === 'number';
  if (aHas && bHas) return a.leetcode_number - b.leetcode_number;
  if (aHas) return -1;
  if (bHas) return 1;
  return (a.name || '').localeCompare(b.name || '');
});

const KEEP = 100;
const keep = sorted.slice(0, KEEP);
const demote = sorted.slice(KEEP);

console.log(`Keeping top ${keep.length} in '200', demoting ${demote.length} to NULL`);
console.log('Sample kept:');
keep.slice(0, 10).forEach(p => console.log(`  #${p.leetcode_number ?? '-'} ${p.name}`));
console.log('Sample demoted (first 5):');
demote.slice(0, 5).forEach(p => console.log(`  #${p.leetcode_number ?? '-'} ${p.name}`));
console.log('Sample demoted (last 5):');
demote.slice(-5).forEach(p => console.log(`  #${p.leetcode_number ?? '-'} ${p.name}`));

if (dry) process.exit(0);

let ok = 0, fail = 0;
// We can batch by passing an array of ids to .in() — much faster than per-row updates.
const BATCH = 200;
for (let i = 0; i < demote.length; i += BATCH) {
  const chunk = demote.slice(i, i + BATCH).map(p => p.id);
  const { error } = await sb.from('PGcode_problems').update({ roadmap_set: null }).in('id', chunk);
  if (error) { fail += chunk.length; console.error(error.message); }
  else ok += chunk.length;
  console.log(`  Demoted ${ok + fail}/${demote.length}`);
}
console.log(JSON.stringify({ demoted: ok, failed: fail }, null, 2));
