#!/usr/bin/env node
// Batch 60: linked-list classics + final polish.

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
    id: 'swap-nodes-pairs',
    method_name: 'swapPairs',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Use a dummy node pointing to head.',
      'Keep a `prev` pointer. While prev.next AND prev.next.next exist:',
      '  Let a = prev.next, b = a.next. Re-wire: prev → b → a → b.next.',
      '  Move prev to a (the new "second" of the pair).',
      'Return dummy.next.',
    ],
    tags: ['linked-list', 'recursion'],
    constraints: '0 ≤ nodes ≤ 100\n0 ≤ Node.val ≤ 100',
    follow_up: 'Reverse k consecutive nodes (k=2 is this problem).',
    pattern: 'dummy-node-swap',
    test_cases: [
      { inputs: ['[1,2,3,4]'], expected: '[2,1,4,3]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[2,1]' },
      { inputs: ['[1,2,3]'], expected: '[2,1,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[2,1,4,3,5]' },
      { inputs: ['[1,2,3,4,5,6]'], expected: '[2,1,4,3,6,5]' },
      { inputs: ['[1,1,1,1]'], expected: '[1,1,1,1]' },
    ],
  },
  {
    id: 'reorder-list',
    method_name: 'reorderList',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Step 1: find middle via slow/fast pointers.',
      'Step 2: reverse the second half.',
      'Step 3: merge first half and reversed second half by alternating.',
      'O(n) time, O(1) extra space.',
      'Watch off-by-one for odd-length lists — middle goes to the first half.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '1 ≤ nodes ≤ 5·10^4\n0 ≤ Node.val ≤ 1000',
    follow_up: 'Reverse alternate K nodes — generalise the alternating merge.',
    pattern: 'find-middle-reverse-merge',
    test_cases: [
      { inputs: ['[1,2,3,4]'], expected: '[1,4,2,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,5,2,4,3]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[1,2,3,4,5,6]'], expected: '[1,6,2,5,3,4]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[1,7,2,6,3,5,4]' },
    ],
  },
  {
    id: 'delete-node-ll',
    method_name: 'deleteNode',
    params: [{ name: 'head', type: 'List[int]' }, { name: 'targetVal', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'You only have a reference to the node to delete (not the head).',
      'Trick: copy next.val into current; bypass next by setting current.next = current.next.next.',
      'Effectively delete the SUCCESSOR, but the visible value gone is the original target.',
      'Assumes target node is never the tail.',
      'O(1) time, O(1) space.',
    ],
    tags: ['linked-list'],
    constraints: '2 ≤ nodes ≤ 1000\nAll values distinct\nTarget exists and is not the tail',
    follow_up: 'If target could be the tail, you need head — or set node.val = sentinel and mark deleted.',
    pattern: 'value-copy-bypass',
    test_cases: [
      { inputs: ['[4,5,1,9]', '5'], expected: '[4,1,9]' },
      { inputs: ['[4,5,1,9]', '1'], expected: '[4,5,9]' },
      { inputs: ['[1,2]', '1'], expected: '[2]' },
      { inputs: ['[1,2,3]', '2'], expected: '[1,3]' },
      { inputs: ['[1,2,3,4,5,6]', '4'], expected: '[1,2,3,5,6]' },
      { inputs: ['[1,2,3,4,5,6]', '1'], expected: '[2,3,4,5,6]' },
    ],
  },
  {
    id: 'palindrome-partitioning',
    method_name: 'partition',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[List[str]]',
    hints: [
      'Backtrack: at each index, try every palindrome prefix.',
      'Recurse on the suffix; collect the current partition.',
      'Precompute pal[i][j] in O(n²) for O(1) checks.',
      'Append a copy when index reaches end.',
      'O(n · 2^n) worst — each cut creates exponential branches.',
    ],
    tags: ['string', 'backtracking', 'dp'],
    constraints: '1 ≤ s.length ≤ 16',
    follow_up: 'Palindrome Partitioning II — minimum cuts. DP only on counts.',
    pattern: 'backtracking-palindrome-prefix',
    test_cases: [
      { inputs: ['"aab"'], expected: '[["a","a","b"],["aa","b"]]' },
      { inputs: ['"a"'], expected: '[["a"]]' },
      { inputs: ['"ab"'], expected: '[["a","b"]]' },
      { inputs: ['"aba"'], expected: '[["a","b","a"],["aba"]]' },
      { inputs: ['"aaa"'], expected: '[["a","a","a"],["a","aa"],["aa","a"],["aaa"]]' },
      { inputs: ['"abc"'], expected: '[["a","b","c"]]' },
    ],
  },
  {
    id: 'reverse-integer',
    method_name: 'reverse',
    params: [{ name: 'x', type: 'int' }],
    return_type: 'int',
    hints: [
      'Pop last digit with x % 10; push to result with result * 10 + digit.',
      'Watch sign: handle negative naturally if you use truncation toward zero.',
      'Overflow check BEFORE multiplying: if result > INT_MAX/10 → overflow.',
      'Edge: result = INT_MAX/10 and next digit > 7 → overflow.',
      'O(log10 x) time, O(1) space.',
    ],
    tags: ['math'],
    constraints: '-2^31 ≤ x ≤ 2^31 − 1',
    follow_up: 'Reverse bits — same idea, base 2.',
    pattern: 'digit-pop-push',
    test_cases: [
      { inputs: ['123'], expected: '321' },
      { inputs: ['-123'], expected: '-321' },
      { inputs: ['120'], expected: '21' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['1534236469'], expected: '0' },
      { inputs: ['-2147483648'], expected: '0' },
      { inputs: ['1000'], expected: '1' },
      { inputs: ['-100'], expected: '-1' },
      { inputs: ['10'], expected: '1' },
    ],
  },
  {
    id: 'next-greater-element-iii',
    method_name: 'nextGreaterElement',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    pattern: 'Next Permutation on Digits',
    tags: ['math', 'string', 'two-pointers', 'next-permutation'],
    companies: ["amazon","meta","microsoft","google","apple"],
    constraints: [
      '1 <= n <= 2^31 - 1',
      'Return -1 if no valid answer exists or the result overflows 32-bit signed int.',
    ],
    follow_up: 'How does this generalize to next-permutation on any sequence? What if digits could repeat with constraints?',
    hints: [
      'Convert n into its digit array and apply the standard next-permutation algorithm.',
      'Step 1: scan from the right and find the first index i where digits[i] < digits[i+1]. If none, no greater number exists.',
      'Step 2: scan from the right again and find the smallest digit > digits[i] in the suffix. Swap them.',
      'Step 3: reverse the suffix starting at i+1 to make it the smallest possible.',
      'Final check: if the resulting integer exceeds 2^31 - 1, return -1.',
    ],
    test_cases: [
      { inputs: ['12'], expected: '21' },
      { inputs: ['21'], expected: '-1' },
      { inputs: ['12443322'], expected: '13222344' },
      { inputs: ['1'], expected: '-1' },
      { inputs: ['11'], expected: '-1' },
      { inputs: ['123456789'], expected: '123456798' },
      { inputs: ['987654321'], expected: '-1' },
      { inputs: ['230241'], expected: '230412' },
      { inputs: ['2147483486'], expected: '-1' },
      { inputs: ['1999999999'], expected: '-1' },
    ],
    visualization: {
      type: 'array',
      frames: [
        { array: [1,2,4,4,3,3,2,2], highlights: [], pointers: {}, status: 'n = 12443322. Convert to digits and apply next-permutation.' },
        { array: [1,2,4,4,3,3,2,2], highlights: [6,7], pointers: { i: 7 }, status: 'Scan right -> left: digits[6]=2, digits[7]=2. Not strictly increasing (2 < 2 is false). Continue.' },
        { array: [1,2,4,4,3,3,2,2], highlights: [5,6], pointers: { i: 6 }, status: 'digits[5]=3, digits[6]=2. 3 < 2 false. Continue.' },
        { array: [1,2,4,4,3,3,2,2], highlights: [2,3], pointers: { i: 2 }, status: 'Find first i where digits[i] < digits[i+1]. Here i=2: digits[2]=4? No, look at digits[1]=2 < digits[2]=4 -> i=1.' },
        { array: [1,2,4,4,3,3,2,2], highlights: [1], pointers: { i: 1 }, status: 'Pivot index i=1, digits[i]=2. Suffix is [4,4,3,3,2,2].' },
        { array: [1,2,4,4,3,3,2,2], highlights: [5], pointers: { i: 1, j: 5 }, status: 'Scan suffix from right for smallest digit > 2. digits[7]=2 no, digits[6]=2 no, digits[5]=3 yes -> j=5.' },
        { array: [1,3,4,4,3,2,2,2], highlights: [1,5], pointers: { i: 1, j: 5 }, status: 'Swap digits[1] and digits[5]. Array: [1,3,4,4,3,2,2,2].' },
        { array: [1,3,2,2,2,3,4,4], highlights: [2,3,4,5,6,7], pointers: {}, status: 'Reverse suffix [4,4,3,2,2,2] -> [2,2,2,3,4,4]. Result digits: [1,3,2,2,2,3,4,4].' },
        { array: [1,3,2,2,2,3,4,4], highlights: [], pointers: {}, status: 'Convert back: 13222344. Check overflow: 13222344 <= 2^31-1 -> valid.' },
        { array: [1,3,2,2,2,3,4,4], highlights: [], pointers: {}, status: 'Answer = 13222344. Time O(d) where d = number of digits (at most 10). Space O(d).' },
      ],
    },
    solutions: [
      {
        language: 'python',
        approach: 'Next-permutation on digit list',
        code: `class Solution:
    def nextGreaterElement(self, n: int) -> int:
        digits = list(str(n))
        k = len(digits)
        # Step 1: find pivot
        i = k - 2
        while i >= 0 and digits[i] >= digits[i + 1]:
            i -= 1
        if i < 0:
            return -1
        # Step 2: find swap target
        j = k - 1
        while digits[j] <= digits[i]:
            j -= 1
        digits[i], digits[j] = digits[j], digits[i]
        # Step 3: reverse suffix
        digits[i + 1:] = reversed(digits[i + 1:])
        result = int(''.join(digits))
        return result if result <= 2**31 - 1 else -1`,
      },
      {
        language: 'javascript',
        approach: 'Next-permutation on digit array',
        code: `/**
 * @param {number} n
 * @return {number}
 */
var nextGreaterElement = function(n) {
    const digits = String(n).split('');
    const k = digits.length;
    let i = k - 2;
    while (i >= 0 && digits[i] >= digits[i + 1]) i--;
    if (i < 0) return -1;
    let j = k - 1;
    while (digits[j] <= digits[i]) j--;
    [digits[i], digits[j]] = [digits[j], digits[i]];
    // reverse suffix in place
    let l = i + 1, r = k - 1;
    while (l < r) { [digits[l], digits[r]] = [digits[r], digits[l]]; l++; r--; }
    const result = Number(digits.join(''));
    return result > 2147483647 ? -1 : result;
};`,
      },
      {
        language: 'java',
        approach: 'Char array + long overflow check',
        code: `class Solution {
    public int nextGreaterElement(int n) {
        char[] d = String.valueOf(n).toCharArray();
        int k = d.length, i = k - 2;
        while (i >= 0 && d[i] >= d[i + 1]) i--;
        if (i < 0) return -1;
        int j = k - 1;
        while (d[j] <= d[i]) j--;
        char tmp = d[i]; d[i] = d[j]; d[j] = tmp;
        // reverse suffix
        for (int l = i + 1, r = k - 1; l < r; l++, r--) {
            tmp = d[l]; d[l] = d[r]; d[r] = tmp;
        }
        long result = Long.parseLong(new String(d));
        return result > Integer.MAX_VALUE ? -1 : (int) result;
    }
}`,
      },
      {
        language: 'cpp',
        approach: 'std::next_permutation + overflow check',
        code: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int nextGreaterElement(int n) {
        string s = to_string(n);
        if (!next_permutation(s.begin(), s.end())) return -1;
        long long result = stoll(s);
        return result > INT_MAX ? -1 : (int) result;
    }
};`,
      },
      {
        language: 'go',
        approach: 'Byte slice next-permutation',
        code: `import (
    "strconv"
    "math"
)

func nextGreaterElement(n int) int {
    d := []byte(strconv.Itoa(n))
    k := len(d)
    i := k - 2
    for i >= 0 && d[i] >= d[i+1] {
        i--
    }
    if i < 0 {
        return -1
    }
    j := k - 1
    for d[j] <= d[i] {
        j--
    }
    d[i], d[j] = d[j], d[i]
    // reverse suffix
    for l, r := i+1, k-1; l < r; l, r = l+1, r-1 {
        d[l], d[r] = d[r], d[l]
    }
    result, _ := strconv.ParseInt(string(d), 10, 64)
    if result > math.MaxInt32 {
        return -1
    }
    return int(result)
}`,
      },
      {
        language: 'rust',
        approach: 'Vec<u8> next-permutation',
        code: `impl Solution {
    pub fn next_greater_element(n: i32) -> i32 {
        let mut d: Vec<u8> = n.to_string().into_bytes();
        let k = d.len();
        if k < 2 { return -1; }
        let mut i = k as i32 - 2;
        while i >= 0 && d[i as usize] >= d[i as usize + 1] {
            i -= 1;
        }
        if i < 0 { return -1; }
        let mut j = k - 1;
        while d[j] <= d[i as usize] { j -= 1; }
        d.swap(i as usize, j);
        d[(i as usize + 1)..].reverse();
        let s: String = String::from_utf8(d).unwrap();
        match s.parse::<i64>() {
            Ok(v) if v <= i32::MAX as i64 => v as i32,
            _ => -1,
        }
    }
}`,
      },
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
