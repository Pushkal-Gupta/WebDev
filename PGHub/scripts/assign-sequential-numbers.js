#!/usr/bin/env node
// Assign sequential leetcode_number values to PGcode problems that didn't
// match the LC catalog, starting at max(leetcode_number) + 1. Sorted by name
// for stable order. Idempotent: skips rows that already have a number.

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

const { data: maxRows } = await sb.from('PGcode_problems')
  .select('leetcode_number')
  .not('leetcode_number', 'is', null)
  .order('leetcode_number', { ascending: false })
  .limit(1);
const max = maxRows?.[0]?.leetcode_number || 0;
console.log(`Current max leetcode_number: ${max}`);

const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,leetcode_number')
    .is('leetcode_number', null)
    .order('name', { ascending: true })
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Problems missing leetcode_number: ${all.length}`);

let nextNum = max + 1;
const updates = all.map(p => ({ id: p.id, leetcode_number: nextNum++ }));

if (dry) {
  console.log('Sample:', JSON.stringify(updates.slice(0, 5), null, 2));
  console.log(`Would assign ${updates.length} numbers, range ${max + 1}..${nextNum - 1}`);
  process.exit(0);
}

let ok = 0, fail = 0;
for (const u of updates) {
  const { error } = await sb.from('PGcode_problems').update({ leetcode_number: u.leetcode_number }).eq('id', u.id);
  if (error) { fail++; console.error(u.id, error.message); }
  else ok++;
}
console.log(JSON.stringify({ assigned: ok, failed: fail, range: `${max + 1}..${nextNum - 1}` }, null, 2));
