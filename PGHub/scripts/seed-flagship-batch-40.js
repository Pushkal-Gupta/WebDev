#!/usr/bin/env node
// Batch 40: math + string classics + bfs problems.

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
    id: 'count-primes',
    method_name: 'countPrimes',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Sieve of Eratosthenes: array of size n; mark multiples of each prime as composite.',
      'Start from p = 2. For each unmarked p, mark p², p²+p, p²+2p, … as composite.',
      'Outer loop only needs p ≤ √n.',
      'O(n log log n) time, O(n) space.',
      'Variants: linear sieve (Euler) is O(n) but constants are higher.',
    ],
    tags: ['math', 'sieve', 'array'],
    constraints: '0 ≤ n ≤ 5·10^6',
    follow_up: 'Segmented sieve for very large n with a memory budget.',
    pattern: 'sieve-of-eratosthenes',
    test_cases: [
      { inputs: ['10'], expected: '4' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '0' },
      { inputs: ['2'], expected: '0' },
      { inputs: ['3'], expected: '1' },
      { inputs: ['5'], expected: '2' },
      { inputs: ['20'], expected: '8' },
      { inputs: ['100'], expected: '25' },
      { inputs: ['1000'], expected: '168' },
      { inputs: ['10000'], expected: '1229' },
      { inputs: ['11'], expected: '4' },
      { inputs: ['7'], expected: '3' },
      { inputs: ['50'], expected: '15' },
      { inputs: ['499979'], expected: '41538' },
    ],
  },
  {
    id: 'isomorphic-strings',
    method_name: 'isIsomorphic',
    params: [{ name: 's', type: 'str' }, { name: 't', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Each character in s maps to exactly one in t, and vice versa (bijection).',
      'Maintain two maps: s→t and t→s. Reject on conflict.',
      'Or encode each string into a sequence of "first-seen indices" and compare.',
      'O(n) time, O(alphabet) space.',
      'Equal length required; different lengths → false.',
    ],
    tags: ['string', 'hash-map'],
    constraints: '1 ≤ s.length == t.length ≤ 5·10^4\nASCII characters',
    follow_up: 'k strings all pairwise isomorphic — compare each to the encoding of the first.',
    pattern: 'bijection-via-two-maps',
    test_cases: [
      { inputs: ['"egg"', '"add"'], expected: 'true' },
      { inputs: ['"foo"', '"bar"'], expected: 'false' },
      { inputs: ['"paper"', '"title"'], expected: 'true' },
      { inputs: ['"a"', '"a"'], expected: 'true' },
      { inputs: ['"ab"', '"aa"'], expected: 'false' },
      { inputs: ['"aa"', '"ab"'], expected: 'false' },
      { inputs: ['"abc"', '"def"'], expected: 'true' },
      { inputs: ['"badc"', '"baba"'], expected: 'false' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['"abcabc"', '"xyzxyz"'], expected: 'true' },
      { inputs: ['"abab"', '"xyxy"'], expected: 'true' },
      { inputs: ['"abab"', '"xyxz"'], expected: 'false' },
    ],
  },
  {
    id: 'max-consecutive-ones-iii',
    method_name: 'longestOnes',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Window of indices where #zeros ≤ k.',
      'Slide right; when zero-count exceeds k, slide left.',
      'Track max window length.',
      'O(n) time, O(1) space.',
      'Equivalent to "longest subarray with ≤ k zeros".',
    ],
    tags: ['array', 'sliding-window', 'binary-search', 'prefix-sum'],
    constraints: '1 ≤ nums.length ≤ 10^5\n0 ≤ k ≤ nums.length\nnums[i] ∈ {0, 1}',
    follow_up: '"Max Consecutive Ones I/II" — k=0 or k=1 versions; same algorithm with edge cases.',
    pattern: 'sliding-window-bounded-violations',
    test_cases: [
      { inputs: ['[1,1,1,0,0,0,1,1,1,1,0]', '2'], expected: '6' },
      { inputs: ['[0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1]', '3'], expected: '10' },
      { inputs: ['[1,1,1,1]', '0'], expected: '4' },
      { inputs: ['[0,0,0,0]', '0'], expected: '0' },
      { inputs: ['[0,0,0,0]', '4'], expected: '4' },
      { inputs: ['[1]', '0'], expected: '1' },
      { inputs: ['[0]', '0'], expected: '0' },
      { inputs: ['[0]', '1'], expected: '1' },
      { inputs: ['[1,0,1,0,1]', '1'], expected: '3' },
      { inputs: ['[1,0,1,0,1]', '2'], expected: '5' },
      { inputs: ['[1,0,1,0,1]', '0'], expected: '1' },
      { inputs: ['[0,1,0,1,0,1]', '3'], expected: '6' },
    ],
  },
  {
    id: 'minimum-genetic-mutation',
    method_name: 'minMutation',
    params: [{ name: 'startGene', type: 'str' }, { name: 'endGene', type: 'str' }, { name: 'bank', type: 'List[str]' }],
    return_type: 'int',
    hints: [
      'BFS where nodes are valid gene strings (start ∪ bank).',
      'Two nodes connected iff they differ in exactly one character.',
      'Standard BFS finds shortest path = min mutations.',
      'Return -1 if endGene is not reachable / not in bank.',
      'O(|bank| · 8 · |gene|) per BFS — small bank ≤ 10.',
    ],
    tags: ['string', 'bfs', 'hash-set'],
    constraints: '0 ≤ bank.length ≤ 10\nstartGene.length == endGene.length == 8\nGenes contain only A, C, G, T',
    follow_up: 'Larger bank → use 8 × 4 letter substitutions per node and bank as a set for O(1) lookups.',
    pattern: 'bfs-on-strings',
    test_cases: [
      { inputs: ['"AACCGGTT"', '"AACCGGTA"', '["AACCGGTA"]'], expected: '1' },
      { inputs: ['"AACCGGTT"', '"AAACGGTA"', '["AACCGGTA","AACCGCTA","AAACGGTA"]'], expected: '2' },
      { inputs: ['"AAAAACCC"', '"AACCCCCC"', '["AAAACCCC","AAACCCCC","AACCCCCC"]'], expected: '3' },
      { inputs: ['"AACCGGTT"', '"AACCGGTT"', '[]'], expected: '0' },
      { inputs: ['"AACCGGTT"', '"AAACGGTA"', '[]'], expected: '-1' },
      { inputs: ['"AAAAAAAA"', '"CCCCCCCC"', '["AAAAAAAA","CCCCCCCC"]'], expected: '-1' },
    ],
  },
  {
    id: 'happy-number',
    method_name: 'isHappy',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Sum of squares of digits → repeat.',
      'Happy iff this iteration reaches 1.',
      'Cycle detection: hashset of seen values OR Floyd\'s tortoise-and-hare.',
      'Numbers shrink to ≤ 243 quickly (max for 3-digit) — bounded space.',
      'O(log n) per step.',
    ],
    tags: ['math', 'hash-set', 'two-pointers'],
    constraints: '1 ≤ n ≤ 2^31 − 1',
    follow_up: 'Generalize: sum of k-th powers of digits. Different attractor sets.',
    pattern: 'cycle-detection-on-function',
    test_cases: [
      { inputs: ['19'], expected: 'true' },
      { inputs: ['2'], expected: 'false' },
      { inputs: ['1'], expected: 'true' },
      { inputs: ['7'], expected: 'true' },
      { inputs: ['10'], expected: 'true' },
      { inputs: ['100'], expected: 'true' },
      { inputs: ['44'], expected: 'false' },
      { inputs: ['68'], expected: 'true' },
      { inputs: ['99'], expected: 'false' },
      { inputs: ['1000'], expected: 'true' },
      { inputs: ['2147483647'], expected: 'false' },
      { inputs: ['11'], expected: 'false' },
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
