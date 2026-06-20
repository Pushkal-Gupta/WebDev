#!/usr/bin/env node
// Batch 25: sliding-window + heap + arrays.

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
    id: 'two-sum-ii',
    method_name: 'twoSum',
    params: [{ name: 'numbers', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Array is SORTED. Two pointers from both ends.',
      'l = 0, r = n-1. sum = numbers[l] + numbers[r].',
      'sum < target → l++; sum > target → r--; sum == target → return [l+1, r+1] (1-indexed).',
      'O(n) time, O(1) space.',
      'Hashmap approach also works but uses O(n) space — wastes the sorted structure.',
    ],
    tags: ['array', 'two-pointers', 'binary-search'],
    constraints: '2 ≤ numbers.length ≤ 3·10^4\n-1000 ≤ numbers[i] ≤ 1000\nnumbers is sorted ascending\nExactly one solution exists; same element cannot be used twice',
    follow_up: 'Binary search for the second number when array is huge but sparse. O(n log n) variant.',
    pattern: 'two-pointer-sorted',
    test_cases: [
      { inputs: ['[2,7,11,15]', '9'], expected: '[1,2]' },
      { inputs: ['[2,3,4]', '6'], expected: '[1,3]' },
      { inputs: ['[-1,0]', '-1'], expected: '[1,2]' },
      { inputs: ['[1,2,3,4,4,9,56,90]', '8'], expected: '[4,5]' },
      { inputs: ['[5,25,75]', '100'], expected: '[2,3]' },
      { inputs: ['[1,2]', '3'], expected: '[1,2]' },
      { inputs: ['[-5,-3,-1,2,4]', '-4'], expected: '[2,3]' },
      { inputs: ['[1,3,5,7,9,11]', '14'], expected: '[4,5]' },
      { inputs: ['[1,3,5,7,9,11]', '12'], expected: '[2,4]' },
      { inputs: ['[0,0,3,4]', '0'], expected: '[1,2]' },
      { inputs: ['[2,3,5,7,11,13,17]', '20'], expected: '[3,7]' },
      { inputs: ['[-1000,-999,999,1000]', '0'], expected: '[2,3]' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '11'], expected: '[1,10]' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '19'], expected: '[9,10]' },
    ],
  },
  {
    id: 'house-robber-ii',
    method_name: 'rob',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Houses are in a CIRCLE — first and last are adjacent.',
      'You can\'t rob both first and last. Split into two linear sub-problems.',
      'Case A: rob nums[0..n-2] (exclude last). Case B: rob nums[1..n-1] (exclude first).',
      'Each case is the standard House Robber DP. Take the max of the two.',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'dp'],
    constraints: '1 ≤ nums.length ≤ 100\n0 ≤ nums[i] ≤ 1000',
    follow_up: '"House Robber III" — houses are nodes in a binary tree. Tree DP with (rob, skip) tuples.',
    pattern: 'linear-dp-twice',
    test_cases: [
      { inputs: ['[2,3,2]'], expected: '3' },
      { inputs: ['[1,2,3,1]'], expected: '4' },
      { inputs: ['[1,2,3]'], expected: '3' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '2' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[200,3,140,20,10]'], expected: '340' },
      { inputs: ['[2,7,9,3,1]'], expected: '11' },
      { inputs: ['[1,3,1,3,100]'], expected: '103' },
      { inputs: ['[100,1,1,100]'], expected: '101' },
      { inputs: ['[5,5,5,5,5]'], expected: '10' },
      { inputs: ['[1000,1,1,1,1000]'], expected: '1002' },
      { inputs: ['[1,1,1,1,1]'], expected: '2' },
      { inputs: ['[0,0,0]'], expected: '0' },
    ],
  },
  {
    id: 'permutation-in-string',
    method_name: 'checkInclusion',
    params: [{ name: 's1', type: 'str' }, { name: 's2', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Question is: does any permutation of s1 appear as a substring of s2?',
      'Sliding window over s2 of size |s1|. Maintain a freq count.',
      'Compare with the target freq count of s1. Match → return true.',
      'O(26) comparison per window step → O(n) overall.',
      'Variation: maintain a "match count" of how many letters are at the target frequency. O(1) per slide.',
    ],
    tags: ['string', 'sliding-window', 'hash-map'],
    constraints: '1 ≤ s1.length, s2.length ≤ 10^4\ns1 and s2 are lowercase English',
    follow_up: '"Find All Anagrams in a String" — same algorithm, but return all starting indices.',
    pattern: 'fixed-size-sliding-window',
    test_cases: [
      { inputs: ['"ab"', '"eidbaooo"'], expected: 'true' },
      { inputs: ['"ab"', '"eidboaoo"'], expected: 'false' },
      { inputs: ['"a"', '"a"'], expected: 'true' },
      { inputs: ['"a"', '"b"'], expected: 'false' },
      { inputs: ['"ab"', '"a"'], expected: 'false' },
      { inputs: ['"abc"', '"cbabcabc"'], expected: 'true' },
      { inputs: ['"hello"', '"ooolleoooleh"'], expected: 'false' },
      { inputs: ['"adc"', '"dcda"'], expected: 'true' },
      { inputs: ['"ab"', '"ba"'], expected: 'true' },
      { inputs: ['"abc"', '"def"'], expected: 'false' },
      { inputs: ['"abc"', '"cab"'], expected: 'true' },
      { inputs: ['"abc"', '"bca"'], expected: 'true' },
      { inputs: ['"aaa"', '"aab"'], expected: 'false' },
      { inputs: ['"abcd"', '"dcba"'], expected: 'true' },
    ],
  },
  {
    id: 'longest-repeating-char',
    method_name: 'characterReplacement',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Sliding window. Track letter counts inside the window.',
      'Window is valid iff (window length − max count) ≤ k.',
      'When invalid, shrink from the left.',
      'Track the maximum window length encountered.',
      'O(n) — the max count only needs to be approximately tracked (never need to decrement on shrink for the global max).',
    ],
    tags: ['string', 'sliding-window'],
    constraints: '1 ≤ s.length ≤ 10^5\n0 ≤ k ≤ s.length\ns consists of uppercase English letters',
    follow_up: 'Stream variant: chars arrive online. Same window logic with a tail-only frequency.',
    pattern: 'window-with-most-frequent',
    test_cases: [
      { inputs: ['"ABAB"', '2'], expected: '4' },
      { inputs: ['"AABABBA"', '1'], expected: '4' },
      { inputs: ['"A"', '0'], expected: '1' },
      { inputs: ['"AAAA"', '2'], expected: '4' },
      { inputs: ['"ABCDE"', '1'], expected: '2' },
      { inputs: ['"ABCDE"', '5'], expected: '5' },
      { inputs: ['"BAAAB"', '2'], expected: '5' },
      { inputs: ['"BBBB"', '0'], expected: '4' },
      { inputs: ['"ABABA"', '0'], expected: '1' },
      { inputs: ['"ABABA"', '1'], expected: '3' },
      { inputs: ['"ABABA"', '2'], expected: '5' },
      { inputs: ['"ABCABCABC"', '3'], expected: '6' },
      { inputs: ['""', '0'], expected: '0' },
      { inputs: ['"AAABBC"', '1'], expected: '4' },
      { inputs: ['"AABA"', '0'], expected: '2' },
    ],
  },
  {
    id: 'find-all-anagrams',
    method_name: 'findAnagrams',
    params: [{ name: 's', type: 'str' }, { name: 'p', type: 'str' }],
    return_type: 'List[int]',
    hints: [
      'Fixed-size sliding window of length |p|.',
      'Maintain a freq array of the window. Compare to target freq of p.',
      'Slide: add s[r], remove s[l-1]. O(26) compare or maintain a single "match count".',
      'O(n) overall.',
      'Result is the list of starting indices where the window matches.',
    ],
    tags: ['string', 'sliding-window', 'hash-map'],
    constraints: '1 ≤ s.length, p.length ≤ 3·10^4\ns and p are lowercase English',
    follow_up: '"Substring with Concatenation of All Words" — variant where the target is a list of equal-length words.',
    pattern: 'fixed-window-frequency-match',
    test_cases: [
      { inputs: ['"cbaebabacd"', '"abc"'], expected: '[0,6]' },
      { inputs: ['"abab"', '"ab"'], expected: '[0,1,2]' },
      { inputs: ['"a"', '"a"'], expected: '[0]' },
      { inputs: ['"a"', '"b"'], expected: '[]' },
      { inputs: ['"ab"', '"a"'], expected: '[0]' },
      { inputs: ['"baa"', '"aa"'], expected: '[1]' },
      { inputs: ['"aaaa"', '"aa"'], expected: '[0,1,2]' },
      { inputs: ['"abcdef"', '"xyz"'], expected: '[]' },
      { inputs: ['"abcdefg"', '"gfedcba"'], expected: '[0]' },
      { inputs: ['"abacbabc"', '"abc"'], expected: '[1,2,3,5]' },
      { inputs: ['""', '"abc"'], expected: '[]' },
      { inputs: ['"hello"', '"oll"'], expected: '[1]' },
    ],
  },
  {
    id: 'task-scheduler',
    method_name: 'leastInterval',
    params: [{ name: 'tasks', type: 'List[str]' }, { name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Most-frequent task drives the schedule.',
      'Closed form: (maxCount − 1) × (n + 1) + (number of tasks tied for max).',
      'Compare to total tasks; the answer is the max of the two.',
      'Intuition: arrange max-count copies into "slots" of size n+1; fill remaining tasks into the gaps.',
      'Heap simulation also works but the formula is O(unique) after counting.',
    ],
    tags: ['array', 'hash-map', 'heap', 'greedy', 'math'],
    constraints: '1 ≤ tasks.length ≤ 10^4\n0 ≤ n ≤ 100\ntasks[i] is uppercase English letter',
    follow_up: 'Print the actual schedule — use a max-heap and a cooldown queue.',
    pattern: 'frequency-formula',
    test_cases: [
      { inputs: ['["A","A","A","B","B","B"]', '2'], expected: '8' },
      { inputs: ['["A","A","A","B","B","B"]', '0'], expected: '6' },
      { inputs: ['["A","A","A","A","A","A","B","C","D","E","F","G"]', '2'], expected: '16' },
      { inputs: ['["A"]', '0'], expected: '1' },
      { inputs: ['["A","B","C"]', '0'], expected: '3' },
      { inputs: ['["A","B","C"]', '10'], expected: '3' },
      { inputs: ['["A","A"]', '5'], expected: '7' },
      { inputs: ['["A","A","A"]', '2'], expected: '7' },
      { inputs: ['["A","A","B","B"]', '2'], expected: '6' },
      { inputs: ['["A","A","B","B","C","C"]', '2'], expected: '6' },
      { inputs: ['["A","A","A","B","B"]', '2'], expected: '7' },
      { inputs: ['["A","A","A","A","B","C","D"]', '2'], expected: '10' },
      { inputs: ['["B","C","D","A","A","A","A","G"]', '1'], expected: '8' },
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
  console.log(`  ✓ ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
