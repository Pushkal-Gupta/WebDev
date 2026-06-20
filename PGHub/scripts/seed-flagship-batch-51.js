#!/usr/bin/env node
// Batch 51: string classics.

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
    id: 'longest-palindromic-substring',
    method_name: 'longestPalindrome',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    hints: [
      'Expand around centers. n possible odd-centers, n-1 even-centers.',
      'For each center, expand outward while s[lo] == s[hi]. Track longest.',
      'O(n²) time, O(1) space.',
      'Manacher\'s algorithm: O(n) via clever reuse of mirror palindrome data.',
      'DP variant: pal[i][j] = true if s[i..j] is a palindrome. O(n²) time and space.',
    ],
    tags: ['string', 'dp', 'two-pointers'],
    constraints: '1 ≤ s.length ≤ 1000\ns contains digits + ASCII letters',
    follow_up: 'Manacher\'s gets O(n) with linearithmic-style mirror tricks.',
    pattern: 'expand-around-center',
    test_cases: [
      { inputs: ['"babad"'], expected: 'bab' },
      { inputs: ['"cbbd"'], expected: 'bb' },
      { inputs: ['"a"'], expected: 'a' },
      { inputs: ['"ac"'], expected: 'a' },
      { inputs: ['""'], expected: '' },
      { inputs: ['"aaaaaa"'], expected: 'aaaaaa' },
      { inputs: ['"abcdef"'], expected: 'a' },
      { inputs: ['"forgeeksskeegfor"'], expected: 'geeksskeeg' },
      { inputs: ['"abacdfgdcaba"'], expected: 'aba' },
      { inputs: ['"abba"'], expected: 'abba' },
      { inputs: ['"abacabad"'], expected: 'abacaba' },
    ],
  },
  {
    id: 'longest-palindromic-subseq',
    method_name: 'longestPalindromeSubseq',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'LCS of s and reverse(s) — but that\'s O(n²) extra strings; direct DP is cleaner.',
      'dp[i][j] = longest pal subseq in s[i..j].',
      'If s[i] == s[j]: dp[i][j] = 2 + dp[i+1][j-1]. Else dp[i][j] = max(dp[i+1][j], dp[i][j-1]).',
      'Fill diagonally (length first). Or bottom-up iterating i down, j up.',
      'O(n²) time, O(n) rolling space.',
    ],
    tags: ['string', 'dp', '2d-dp'],
    constraints: '1 ≤ s.length ≤ 1000\nLowercase English',
    follow_up: 'Return the subsequence itself — backtrack through dp.',
    pattern: '2d-dp-diagonal',
    test_cases: [
      { inputs: ['"bbbab"'], expected: '4' },
      { inputs: ['"cbbd"'], expected: '2' },
      { inputs: ['"a"'], expected: '1' },
      { inputs: ['"ab"'], expected: '1' },
      { inputs: ['"abc"'], expected: '1' },
      { inputs: ['"aaaa"'], expected: '4' },
      { inputs: ['"abcd"'], expected: '1' },
      { inputs: ['"abdcba"'], expected: '5' },
      { inputs: ['"racecar"'], expected: '7' },
      { inputs: ['"forgeeksskeegfor"'], expected: '10' },
    ],
  },
  {
    id: 'longest-substr-no-repeat',
    method_name: 'lengthOfLongestSubstring',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Sliding window with a char→last-index map.',
      'Right pointer extends; if duplicate seen inside window, jump left to (last_index + 1).',
      'Track max(right - left + 1).',
      'O(n) time, O(min(n, alphabet)) space.',
      'For ASCII: int[128] is faster than HashMap.',
    ],
    tags: ['string', 'sliding-window', 'hash-map'],
    constraints: '0 ≤ s.length ≤ 5·10^4\nASCII printable',
    follow_up: 'Longest substring with at most K distinct chars — same template with a frequency map.',
    pattern: 'sliding-window-last-seen',
    test_cases: [
      { inputs: ['"abcabcbb"'], expected: '3' },
      { inputs: ['"bbbbb"'], expected: '1' },
      { inputs: ['"pwwkew"'], expected: '3' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['" "'], expected: '1' },
      { inputs: ['"au"'], expected: '2' },
      { inputs: ['"dvdf"'], expected: '3' },
      { inputs: ['"tmmzuxt"'], expected: '5' },
      { inputs: ['"abba"'], expected: '2' },
      { inputs: ['"abcdef"'], expected: '6' },
      { inputs: ['"aabcbcdbca"'], expected: '4' },
    ],
  },
  {
    id: 'string-to-integer-atoi',
    method_name: 'myAtoi',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Skip leading spaces.',
      'Optional sign (+/-).',
      'Read digits until non-digit or end.',
      'Clamp to [INT_MIN, INT_MAX] (32-bit).',
      'Edge cases: "+", "-", "   ", "-+1", "0123", "  -42 abc".',
    ],
    tags: ['string', 'parsing'],
    constraints: '0 ≤ s.length ≤ 200\nASCII',
    follow_up: 'Build a real lexer using a state machine — useful for compiler design.',
    pattern: 'state-machine-parsing',
    test_cases: [
      { inputs: ['"42"'], expected: '42' },
      { inputs: ['"   -42"'], expected: '-42' },
      { inputs: ['"4193 with words"'], expected: '4193' },
      { inputs: ['"words and 987"'], expected: '0' },
      { inputs: ['"-91283472332"'], expected: '-2147483648' },
      { inputs: ['"91283472332"'], expected: '2147483647' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['"   "'], expected: '0' },
      { inputs: ['"+1"'], expected: '1' },
      { inputs: ['"+-12"'], expected: '0' },
      { inputs: ['"  0000000000012345678"'], expected: '12345678' },
      { inputs: ['"00000-42a1234"'], expected: '0' },
      { inputs: ['"3.14159"'], expected: '3' },
    ],
  },
  {
    id: 'zigzag-conversion',
    method_name: 'convert',
    params: [{ name: 's', type: 'str' }, { name: 'numRows', type: 'int' }],
    return_type: 'str',
    hints: [
      'Edge: numRows == 1 → return s.',
      'Cycle length = 2·numRows - 2.',
      'Row 0 and last row: every cycle-th char only.',
      'Middle rows: two chars per cycle, offsets r and cycle - r.',
      'Direct iteration is O(n) and trivially correct.',
    ],
    tags: ['string', 'simulation'],
    constraints: '1 ≤ s.length ≤ 1000\n1 ≤ numRows ≤ 1000\ns is ASCII printable',
    follow_up: 'Generic spiral / boustrophedon ordering — same cycle-math.',
    pattern: 'cycle-math',
    test_cases: [
      { inputs: ['"PAYPALISHIRING"', '3'], expected: 'PAHNAPLSIIGYIR' },
      { inputs: ['"PAYPALISHIRING"', '4'], expected: 'PINALSIGYAHRPI' },
      { inputs: ['"A"', '1'], expected: 'A' },
      { inputs: ['"AB"', '1'], expected: 'AB' },
      { inputs: ['"ABC"', '2'], expected: 'ACB' },
      { inputs: ['"ABCDE"', '4'], expected: 'ABCED' },
      { inputs: ['""', '5'], expected: '' },
      { inputs: ['"AB"', '2'], expected: 'AB' },
      { inputs: ['"ABCDEFG"', '3'], expected: 'AEBDFCG' },
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
  console.log(`  ${f.id}  - ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
