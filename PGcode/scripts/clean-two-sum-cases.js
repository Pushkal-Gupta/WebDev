#!/usr/bin/env node
// Audit two-sum test cases: validate that expected indices actually sum to target,
// and that they match the canonical left-to-right hashmap algorithm.
// Rewrite test_cases with only the unambiguous, correct entries.

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

function canonicalTwoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}

const { data } = await sb.from('PGcode_problems').select('test_cases').eq('id', 'two-sum').single();
const cases = data.test_cases;
const kept = [];
let dropped = 0;
for (const tc of cases) {
  const nums = JSON.parse(tc.inputs[0]);
  const target = JSON.parse(tc.inputs[1]);
  const canon = canonicalTwoSum(nums, target);
  const expected = JSON.parse(tc.expected);
  if (JSON.stringify(canon) === JSON.stringify(expected)) {
    kept.push(tc);
  } else {
    console.log(`DROP: nums=${tc.inputs[0]} target=${tc.inputs[1]} expected=${tc.expected} canonical=${JSON.stringify(canon)}`);
    dropped++;
  }
}

console.log(`\nKept ${kept.length}, dropped ${dropped} / ${cases.length}`);

const { error } = await sb.from('PGcode_problems').update({ test_cases: kept }).eq('id', 'two-sum');
if (error) { console.error(error.message); process.exit(1); }
console.log('Updated two-sum test_cases.');
