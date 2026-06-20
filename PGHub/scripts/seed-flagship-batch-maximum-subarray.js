#!/usr/bin/env node
// Re-seed maximum-subarray after verify-prune wiped its test cases.
// 20 hand-crafted Kadane test cases covering: single element, all-negative,
// all-positive, mixed, large swings, prefix/suffix max, and middle-only max.

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

const FLAGSHIPS = [
  {
    id: 'maximum-subarray',
    method_name: 'maxSubArray',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Brute force: try every (i, j) pair and sum nums[i..j]. O(n²) or O(n³).',
      "Kadane's insight: at index i, either extend the running subarray or start a new one at nums[i].",
      'Track running = max(nums[i], running + nums[i]); answer = max(answer, running).',
      'Initialise both to nums[0] so the all-negative case still picks the largest single element.',
      'O(n) time, O(1) space — single pass.',
    ],
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    constraints: '1 ≤ nums.length ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4',
    follow_up: 'Solve with divide & conquer in O(n log n): max sum is either fully in left half, fully in right half, or crossing the midpoint.',
    pattern: 'kadane',
    test_cases: [
      { inputs: ['[-2,1,-3,4,-1,2,1,-5,4]'], expected: '6' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[5,4,-1,7,8]'], expected: '23' },
      { inputs: ['[-1]'], expected: '-1' },
      { inputs: ['[-2,-1]'], expected: '-1' },
      { inputs: ['[1,2,3,4,5]'], expected: '15' },
      { inputs: ['[-1,-2,-3]'], expected: '-1' },
      { inputs: ['[8,-19,5,-4,20]'], expected: '21' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[0,0,0,0]'], expected: '0' },
      { inputs: ['[-5,-4,-3,-2,-1]'], expected: '-1' },
      { inputs: ['[1,-1,1,-1,1]'], expected: '1' },
      { inputs: ['[100,-50,100]'], expected: '150' },
      { inputs: ['[-100,1,2,3,-100]'], expected: '6' },
      { inputs: ['[3,-2,5,-1,4,-3,2]'], expected: '9' },
      { inputs: ['[-2,-3,4,-1,-2,1,5,-3]'], expected: '7' },
      { inputs: ['[10000,-1,-1,-1,10000]'], expected: '19997' },
      { inputs: ['[-10000]'], expected: '-10000' },
      { inputs: ['[10000]'], expected: '10000' },
      { inputs: ['[1,2,-1,3,-2,4,-3,5]'], expected: '9' },
      { inputs: ['[-1,2,-1,2,-1,2,-1]'], expected: '4' },
      { inputs: ['[6,-1,6,-1,6]'], expected: '16' },
      { inputs: ['[-3,-1,-2,-4,-5]'], expected: '-1' },
      { inputs: ['[2,-1,2,-1,2,-1,2]'], expected: '5' },
    ],
  },
];

let updated = 0;
for (const f of FLAGSHIPS) {
  const { data: existing } = await sb.from('PGcode_problems').select('*').eq('id', f.id).maybeSingle();
  if (!existing) { console.log(`  SKIP ${f.id} (not in DB)`); continue; }
  const row = {
    id: f.id,
    name: existing.name,
    topic_id: existing.topic_id,
    difficulty: existing.difficulty,
    description: existing.description,
    roadmap_set: existing.roadmap_set || '100',
    method_name: f.method_name,
    params: f.params,
    return_type: f.return_type,
    hints: f.hints,
    tags: f.tags,
    constraints: f.constraints,
    follow_up: f.follow_up,
    pattern: f.pattern,
    test_cases: f.test_cases,
  };
  const { error } = await sb.from('PGcode_problems').upsert(row, { onConflict: 'id' });
  if (error) { console.error(`  ERROR ${f.id}: ${error.message}`); continue; }
  console.log(`  ok ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
