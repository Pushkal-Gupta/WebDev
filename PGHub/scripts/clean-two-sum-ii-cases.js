#!/usr/bin/env node
// Audit two-sum-ii test cases (LC 167 — sorted array, two pointers).
// Keep only cases whose expected matches the canonical two-pointer algorithm,
// which returns the 1-indexed pair with the smallest left pointer.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function canonicalTwoSumII(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l < r) {
    const s = numbers[l] + numbers[r];
    if (s === target) return [l + 1, r + 1];
    if (s < target) l++; else r--;
  }
  return [];
}

const { data } = await sb.from('PGcode_problems').select('test_cases').eq('id', 'two-sum-ii-input-array-is-sorted').single();
const cases = data.test_cases;
const kept = [];
let dropped = 0;
for (const tc of cases) {
  const numbers = JSON.parse(tc.inputs[0]);
  const target = JSON.parse(tc.inputs[1]);
  const canon = canonicalTwoSumII(numbers, target);
  const expected = JSON.parse(tc.expected);
  if (JSON.stringify(canon) === JSON.stringify(expected)) {
    kept.push(tc);
  } else {
    console.log(`DROP: numbers=${tc.inputs[0]} target=${tc.inputs[1]} expected=${tc.expected} canonical=${JSON.stringify(canon)}`);
    dropped++;
  }
}

console.log(`\nKept ${kept.length}, dropped ${dropped} / ${cases.length}`);

const { error } = await sb.from('PGcode_problems').update({ test_cases: kept }).eq('id', 'two-sum-ii-input-array-is-sorted');
if (error) { console.error(error.message); process.exit(1); }
console.log('Updated.');
