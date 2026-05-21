#!/usr/bin/env node
// Batch 29: hard DP — LCS, interleaving, regex/wildcard, burst-balloons.

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
    id: 'longest-common-subseq',
    method_name: 'longestCommonSubsequence',
    params: [{ name: 'text1', type: 'str' }, { name: 'text2', type: 'str' }],
    return_type: 'int',
    hints: [
      'dp[i][j] = LCS length of text1[0..i-1] and text2[0..j-1].',
      'Match: dp[i][j] = dp[i-1][j-1] + 1.',
      'Mismatch: dp[i][j] = max(dp[i-1][j], dp[i][j-1]).',
      'O(m·n) time. Can compress to O(min(m,n)) space with rolling rows.',
      'Reconstruct the actual subsequence by walking back from dp[m][n].',
    ],
    tags: ['string', 'dp'],
    constraints: '1 ≤ text1.length, text2.length ≤ 1000',
    follow_up: 'Hirschberg\'s algorithm gives the actual subsequence in O(min(m,n)) space.',
    pattern: '2d-dp',
    test_cases: [
      { inputs: ['"abcde"', '"ace"'], expected: '3' },
      { inputs: ['"abc"', '"abc"'], expected: '3' },
      { inputs: ['"abc"', '"def"'], expected: '0' },
      { inputs: ['""', '""'], expected: '0' },
      { inputs: ['"a"', '"a"'], expected: '1' },
      { inputs: ['"a"', '"b"'], expected: '0' },
      { inputs: ['"abcba"', '"abcbcba"'], expected: '5' },
      { inputs: ['"AGGTAB"', '"GXTXAYB"'], expected: '4' },
      { inputs: ['"ABCBDAB"', '"BDCAB"'], expected: '4' },
      { inputs: ['"abcdef"', '"fedcba"'], expected: '1' },
      { inputs: ['"abcdef"', '"abc"'], expected: '3' },
      { inputs: ['"horse"', '"ros"'], expected: '2' },
      { inputs: ['"aaaa"', '"aa"'], expected: '2' },
      { inputs: ['"ezupkr"', '"ubmrapg"'], expected: '2' },
    ],
  },
  {
    id: 'interleaving-string',
    method_name: 'isInterleave',
    params: [{ name: 's1', type: 'str' }, { name: 's2', type: 'str' }, { name: 's3', type: 'str' }],
    return_type: 'bool',
    hints: [
      'If |s3| ≠ |s1| + |s2|, return false.',
      'dp[i][j] = true iff s3[0..i+j-1] is formed by interleaving s1[0..i-1] and s2[0..j-1].',
      'dp[i][j] = (dp[i-1][j] && s1[i-1] == s3[i+j-1]) || (dp[i][j-1] && s2[j-1] == s3[i+j-1]).',
      'O(m·n) time, O(n) space with rolling row.',
      'BFS view: states are (i, j); edges advance by matching next char.',
    ],
    tags: ['string', 'dp'],
    constraints: '0 ≤ s1.length, s2.length ≤ 100\n0 ≤ s3.length ≤ 200',
    follow_up: 'Reconstruct WHICH source each character came from — back-pointers through DP.',
    pattern: '2d-dp',
    test_cases: [
      { inputs: ['"aabcc"', '"dbbca"', '"aadbbcbcac"'], expected: 'true' },
      { inputs: ['"aabcc"', '"dbbca"', '"aadbbbaccc"'], expected: 'false' },
      { inputs: ['""', '""', '""'], expected: 'true' },
      { inputs: ['""', '""', '"a"'], expected: 'false' },
      { inputs: ['"a"', '""', '"a"'], expected: 'true' },
      { inputs: ['""', '"a"', '"a"'], expected: 'true' },
      { inputs: ['"a"', '"b"', '"ab"'], expected: 'true' },
      { inputs: ['"a"', '"b"', '"ba"'], expected: 'true' },
      { inputs: ['"a"', '"b"', '"aa"'], expected: 'false' },
      { inputs: ['"abc"', '"def"', '"adbecf"'], expected: 'true' },
      { inputs: ['"abc"', '"def"', '"abcdef"'], expected: 'true' },
      { inputs: ['"abc"', '"def"', '"abdcef"'], expected: 'true' },
    ],
  },
  {
    id: 'regular-expression-matching',
    method_name: 'isMatch',
    params: [{ name: 's', type: 'str' }, { name: 'p', type: 'str' }],
    return_type: 'bool',
    hints: [
      'p contains . (any single char) and * (zero or more of preceding).',
      'dp[i][j] = true iff s[0..i-1] matches p[0..j-1].',
      'p[j-1] == \'*\': either zero-use (dp[i][j-2]) or match-and-stay (dp[i-1][j] if s[i-1] matches p[j-2]).',
      'p[j-1] == \'.\' or matches s[i-1]: dp[i][j] = dp[i-1][j-1].',
      'O(m·n) time and space.',
    ],
    tags: ['string', 'dp', 'recursion'],
    constraints: '1 ≤ s.length ≤ 20\n1 ≤ p.length ≤ 20\ns and p consist of lowercase + . + *',
    follow_up: 'Compile regex to NFA — simulates all positions simultaneously in O(n·m).',
    pattern: '2d-string-dp',
    test_cases: [
      { inputs: ['"aa"', '"a"'], expected: 'false' },
      { inputs: ['"aa"', '"a*"'], expected: 'true' },
      { inputs: ['"ab"', '".*"'], expected: 'true' },
      { inputs: ['"aab"', '"c*a*b"'], expected: 'true' },
      { inputs: ['"mississippi"', '"mis*is*p*."'], expected: 'false' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['""', '"a*"'], expected: 'true' },
      { inputs: ['"a"', '""'], expected: 'false' },
      { inputs: ['"a"', '"a"'], expected: 'true' },
      { inputs: ['"a"', '"."'], expected: 'true' },
      { inputs: ['"a"', '"a*"'], expected: 'true' },
      { inputs: ['"abc"', '"abc"'], expected: 'true' },
      { inputs: ['"abc"', '"a.c"'], expected: 'true' },
      { inputs: ['"abc"', '".*c"'], expected: 'true' },
      { inputs: ['"aaaa"', '"a*"'], expected: 'true' },
      { inputs: ['"aaaa"', '"a*b"'], expected: 'false' },
    ],
  },
  {
    id: 'wildcard-matching',
    method_name: 'isMatch',
    params: [{ name: 's', type: 'str' }, { name: 'p', type: 'str' }],
    return_type: 'bool',
    hints: [
      'p contains ? (any single char) and * (any sequence including empty).',
      'dp[i][j] = matches.',
      '*: dp[i][j] = dp[i-1][j] (consume a char from s) OR dp[i][j-1] (use * for empty).',
      '? or letter match: dp[i][j] = dp[i-1][j-1].',
      'O(m·n) time, O(n) space rolling.',
    ],
    tags: ['string', 'dp', 'greedy'],
    constraints: '0 ≤ s.length, p.length ≤ 2000\ns is lowercase English\np contains lowercase English, ?, and *',
    follow_up: 'Greedy with backtracking — O(m·n) worst, often faster.',
    pattern: '2d-string-dp',
    test_cases: [
      { inputs: ['"aa"', '"a"'], expected: 'false' },
      { inputs: ['"aa"', '"*"'], expected: 'true' },
      { inputs: ['"cb"', '"?a"'], expected: 'false' },
      { inputs: ['"adceb"', '"*a*b"'], expected: 'true' },
      { inputs: ['"acdcb"', '"a*c?b"'], expected: 'false' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['""', '"*"'], expected: 'true' },
      { inputs: ['""', '"?"'], expected: 'false' },
      { inputs: ['"a"', '"*a"'], expected: 'true' },
      { inputs: ['"a"', '"a*"'], expected: 'true' },
      { inputs: ['"abc"', '"a*c"'], expected: 'true' },
      { inputs: ['"abc"', '"?bc"'], expected: 'true' },
      { inputs: ['"abc"', '"*"'], expected: 'true' },
      { inputs: ['"abc"', '"abcd"'], expected: 'false' },
      { inputs: ['"hello"', '"h*o"'], expected: 'true' },
    ],
  },
  {
    id: 'burst-balloons',
    method_name: 'maxCoins',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Pad with virtual 1s at both ends so every "subrange" has neighbors.',
      'Think reverse: for range (i, j), pick the LAST balloon to burst (k). Then nums[i] * nums[k] * nums[j] is its contribution at burst time.',
      'dp[i][j] = max over k in (i, j) of dp[i][k] + dp[k][j] + nums[i] * nums[k] * nums[j].',
      'Iterate range length from small to large.',
      'O(n³) time, O(n²) space.',
    ],
    tags: ['array', 'dp', 'divide-and-conquer'],
    constraints: 'n == nums.length\n1 ≤ n ≤ 300\n0 ≤ nums[i] ≤ 100',
    follow_up: 'O(n² log n) with sparse table — but the constants beat the algorithm for n ≤ 300.',
    pattern: 'interval-dp',
    test_cases: [
      { inputs: ['[3,1,5,8]'], expected: '167' },
      { inputs: ['[1,5]'], expected: '10' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[5]'], expected: '5' },
      { inputs: ['[1,2]'], expected: '4' },
      { inputs: ['[2,1]'], expected: '4' },
      { inputs: ['[1,1,1,1]'], expected: '4' },
      { inputs: ['[3,1,5,8,7]'], expected: '160' },
      { inputs: ['[7,9,8,0,7,1,3,5,5,2,3]'], expected: '1654' },
      { inputs: ['[2,4,6,8]'], expected: '116' },
      { inputs: ['[0,0,0]'], expected: '0' },
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
