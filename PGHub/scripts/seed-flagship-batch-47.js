#!/usr/bin/env node
// Batch 47: hard DP heavies (edit-distance, regex, wildcard, decode, interleave).

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
    id: 'edit-distance',
    method_name: 'minDistance',
    params: [{ name: 'word1', type: 'str' }, { name: 'word2', type: 'str' }],
    return_type: 'int',
    hints: [
      'dp[i][j] = edit distance between word1[..i] and word2[..j].',
      'Base: dp[0][j] = j (insertions); dp[i][0] = i (deletions).',
      'If word1[i-1] == word2[j-1], dp[i][j] = dp[i-1][j-1]. Else dp[i][j] = 1 + min(insert, delete, replace).',
      'O(mn) time, O(mn) space. Reduce to O(min(m,n)) using rolling arrays.',
      'Hirschberg\'s algorithm reconstructs the actual edit path in O(mn) time, O(min(m,n)) space.',
    ],
    tags: ['string', 'dp'],
    constraints: '0 ≤ word1.length, word2.length ≤ 500\nLowercase English letters',
    follow_up: 'Output the actual edit operations, not just the distance — backtrack through dp.',
    pattern: '2d-dp-string',
    test_cases: [
      { inputs: ['"horse"', '"ros"'], expected: '3' },
      { inputs: ['"intention"', '"execution"'], expected: '5' },
      { inputs: ['""', '""'], expected: '0' },
      { inputs: ['"a"', '""'], expected: '1' },
      { inputs: ['""', '"a"'], expected: '1' },
      { inputs: ['"abc"', '"abc"'], expected: '0' },
      { inputs: ['"abc"', '"def"'], expected: '3' },
      { inputs: ['"plasma"', '"altruism"'], expected: '6' },
      { inputs: ['"kitten"', '"sitting"'], expected: '3' },
      { inputs: ['"a"', '"b"'], expected: '1' },
      { inputs: ['"abcdef"', '"azced"'], expected: '3' },
      { inputs: ['"food"', '"money"'], expected: '4' },
    ],
  },
  {
    id: 'regular-expression-matching',
    method_name: 'isMatch',
    params: [{ name: 's', type: 'str' }, { name: 'p', type: 'str' }],
    return_type: 'bool',
    hints: [
      'DP over (i, j) — does p[0..j) match s[0..i)?',
      'If p[j-1] is \'*\', it represents zero or more of p[j-2]. dp[i][j] = dp[i][j-2] (zero) OR (matches(s[i-1], p[j-2]) AND dp[i-1][j]) (more).',
      'Else dp[i][j] = matches(s[i-1], p[j-1]) AND dp[i-1][j-1].',
      'matches: p == s OR p == \'.\'.',
      'Carefully handle base: empty s matches "(a*)(b*)..." patterns.',
    ],
    tags: ['string', 'dp', 'regex'],
    constraints: '1 ≤ s.length ≤ 20\n1 ≤ p.length ≤ 20\ns contains lowercase; p contains lowercase, \'.\' and \'*\'\nGuaranteed \'*\' has a preceding valid char',
    follow_up: 'Add \'+\' (one or more) — minor DP tweak.',
    pattern: '2d-dp-with-star',
    test_cases: [
      { inputs: ['"aa"', '"a"'], expected: 'false' },
      { inputs: ['"aa"', '"a*"'], expected: 'true' },
      { inputs: ['"ab"', '".*"'], expected: 'true' },
      { inputs: ['"aab"', '"c*a*b"'], expected: 'true' },
      { inputs: ['"mississippi"', '"mis*is*p*."'], expected: 'false' },
      { inputs: ['"mississippi"', '"mis*is*ip*."'], expected: 'true' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['""', '".*"'], expected: 'true' },
      { inputs: ['"a"', '"ab*"'], expected: 'true' },
      { inputs: ['"a"', '".*..a*"'], expected: 'false' },
      { inputs: ['"aaa"', '"a*a"'], expected: 'true' },
      { inputs: ['"abc"', '"a.c"'], expected: 'true' },
    ],
  },
  {
    id: 'wildcard-matching',
    method_name: 'isMatch',
    params: [{ name: 's', type: 'str' }, { name: 'p', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Simpler than regex matching — \'*\' means zero-or-more ANY chars; \'?\' means any single char.',
      'dp[i][j]: matches s[0..i) with p[0..j)?',
      'If p[j-1] == \'*\': dp[i][j] = dp[i-1][j] (extend match) OR dp[i][j-1] (zero).',
      'If p[j-1] == \'?\' or matches: dp[i][j] = dp[i-1][j-1].',
      'O(mn) time, O(min(m,n)) space with rolling arrays.',
    ],
    tags: ['string', 'dp', 'greedy'],
    constraints: '0 ≤ s.length, p.length ≤ 2000\ns has lowercase; p has lowercase, \'?\', \'*\'',
    follow_up: 'Greedy with backtracking — O(m+n) average, O(mn) worst.',
    pattern: '2d-dp-with-wildcard',
    test_cases: [
      { inputs: ['"aa"', '"a"'], expected: 'false' },
      { inputs: ['"aa"', '"*"'], expected: 'true' },
      { inputs: ['"cb"', '"?a"'], expected: 'false' },
      { inputs: ['"adceb"', '"*a*b"'], expected: 'true' },
      { inputs: ['"acdcb"', '"a*c?b"'], expected: 'false' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['""', '"*"'], expected: 'true' },
      { inputs: ['"abc"', '"a?c"'], expected: 'true' },
      { inputs: ['"abc"', '"???"'], expected: 'true' },
      { inputs: ['"abc"', '"????"'], expected: 'false' },
      { inputs: ['"aab"', '"c*a*b"'], expected: 'false' },
      { inputs: ['"hi"', '"*?"'], expected: 'true' },
    ],
  },
  {
    id: 'decode-ways',
    method_name: 'numDecodings',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'dp[i] = ways to decode s[0..i].',
      'Transitions: if s[i-1] != \'0\', dp[i] += dp[i-1]. If s[i-2..i] in [10, 26], dp[i] += dp[i-2].',
      'Base: dp[0] = 1 (empty), dp[1] = 1 if s[0] != \'0\' else 0.',
      'Watch \'0\' — only valid following a 1 or 2.',
      'O(n) time, O(1) space (only need last two values).',
    ],
    tags: ['string', 'dp'],
    constraints: '1 ≤ s.length ≤ 100\ns contains only digits',
    follow_up: 'Decode Ways II — allows \'*\' as 1-9. State machine with more cases.',
    pattern: 'linear-dp-2-back',
    test_cases: [
      { inputs: ['"12"'], expected: '2' },
      { inputs: ['"226"'], expected: '3' },
      { inputs: ['"0"'], expected: '0' },
      { inputs: ['"06"'], expected: '0' },
      { inputs: ['"10"'], expected: '1' },
      { inputs: ['"27"'], expected: '1' },
      { inputs: ['"11106"'], expected: '2' },
      { inputs: ['"1"'], expected: '1' },
      { inputs: ['"100"'], expected: '0' },
      { inputs: ['"111111"'], expected: '13' },
      { inputs: ['"301"'], expected: '0' },
      { inputs: ['"12345"'], expected: '3' },
    ],
  },
  {
    id: 'interleaving-string',
    method_name: 'isInterleave',
    params: [{ name: 's1', type: 'str' }, { name: 's2', type: 'str' }, { name: 's3', type: 'str' }],
    return_type: 'bool',
    hints: [
      'If |s1| + |s2| != |s3|, immediately false.',
      'dp[i][j]: can s1[..i] + s2[..j] interleave to form s3[..i+j]?',
      'dp[i][j] = (s1[i-1] == s3[i+j-1] AND dp[i-1][j]) OR (s2[j-1] == s3[i+j-1] AND dp[i][j-1]).',
      'Base: dp[0][0] = true. Row 0: each must match s2. Col 0: each must match s1.',
      'O(mn) time, O(mn) → O(n) space.',
    ],
    tags: ['string', 'dp'],
    constraints: '0 ≤ s1.length, s2.length ≤ 100\n0 ≤ s3.length ≤ 200\nAll lowercase ASCII',
    follow_up: 'BFS over (i, j) cells with target (m, n).',
    pattern: '2d-dp-grid',
    test_cases: [
      { inputs: ['"aabcc"', '"dbbca"', '"aadbbcbcac"'], expected: 'true' },
      { inputs: ['"aabcc"', '"dbbca"', '"aadbbbaccc"'], expected: 'false' },
      { inputs: ['""', '""', '""'], expected: 'true' },
      { inputs: ['"a"', '""', '"a"'], expected: 'true' },
      { inputs: ['""', '"b"', '"b"'], expected: 'true' },
      { inputs: ['"a"', '""', '""'], expected: 'false' },
      { inputs: ['"abc"', '"def"', '"adbecf"'], expected: 'true' },
      { inputs: ['"abc"', '"def"', '"abcdef"'], expected: 'true' },
      { inputs: ['"abc"', '"def"', '"abcdefg"'], expected: 'false' },
      { inputs: ['"db"', '"b"', '"cbb"'], expected: 'false' },
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
