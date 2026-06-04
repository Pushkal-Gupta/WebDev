import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- Reference implementations (JS mirrors of the canonical Python) ----------

function longestPalindromeLen(s) {
  const c = new Map();
  for (const ch of s) c.set(ch, (c.get(ch) || 0) + 1);
  let odd = 0, total = 0;
  for (const v of c.values()) {
    total += Math.floor(v / 2) * 2;
    if (v % 2) odd = 1;
  }
  return total + odd;
}

function longestPalindromeSubstr(s) {
  if (!s) return '';
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    for (const j of [i, i + 1]) {
      let l = i, r = j;
      while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
      if (r - l - 1 > end - start) { start = l + 1; end = r - 1; }
    }
  }
  return s.slice(start, end + 1);
}

// ---------- Inputs ----------

// longest-palindrome length (case-sensitive): 25 strings
const lenInputs = [
  'abccccdd',
  'a',
  'bb',
  'aaAAaa',
  'abcdef',
  'aaaa',
  'aabbcc',
  'aabbccd',
  'Aa',
  'ccc',
  'abcba',
  'ababab',
  'tattarrattat',
  'civic',
  'racecar',
  'level',
  'noon',
  'redder',
  'banana',
  'forgeeksskeegfor',
  'abcabcabc',
  'zzzzzzz',
  'AaBbCcDd',
  'pqrstuvwxyz',
  'mississippi',
];

// Pick palindromic-substring inputs with UNIQUE answers under expand-around-center
// (using the same reference impl ensures we match the chosen tie-breaking).
const substrInputs = [
  'cbbd',         // bb
  'a',            // a
  'ac',           // a (first found len-1)
  'aaa',          // aaa
  'aaaa',         // aaaa
  'racecar',      // racecar
  'banana',       // anana
  'forgeeksskeegfor', // geeksskeeg
  'abcba',        // abcba
  'level',        // level
  'noon',         // noon
  'civic',        // civic
  'abacdfgdcaba', // aba (first)
  'abacdfgdcabba', // abba
  'xabay',        // aba
  'tattarrattat', // tattarrattat
  'mississippi',  // ississi
  'redivider',    // redivider
  'aibohphobia',  // aibohphobia
  'abcdefg',      // a (single char, first)
  'zzzzz',        // zzzzz
  'detartrated',  // detartrated
  'rotor',        // rotor
  'kayak',        // kayak
  'malayalam',    // malayalam
];

// ---------- Build cases ----------

function pyQuote(s) {
  // Produce a Python-string literal usable as a single positional arg to the harness.
  // Harness wraps the raw string in inputs[]; problem spec says inputs as `["\"...\""]`,
  // i.e. the cell already contains the quoted form.
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function buildLenCases() {
  return lenInputs.map((s, i) => ({
    inputs: [pyQuote(s)],
    expected: String(longestPalindromeLen(s)),
    sample: i < 3,
  }));
}

function buildSubstrCases() {
  return substrInputs.map((s, i) => ({
    inputs: [pyQuote(s)],
    expected: pyQuote(longestPalindromeSubstr(s)),
    sample: i < 3,
  }));
}

// ---------- Canonical Python solutions ----------

const PY_LEN = `class Solution:
    def longestPalindrome(self, s: str) -> int:
        from collections import Counter
        c = Counter(s)
        odd = 0
        total = 0
        for v in c.values():
            total += (v // 2) * 2
            if v % 2:
                odd = 1
        return total + odd
`;

const PY_SUBSTR = `class Solution:
    def longestPalindrome(self, s: str) -> str:
        if not s:
            return ""
        start = end = 0
        for i in range(len(s)):
            for j in (i, i + 1):
                l, r = i, j
                while l >= 0 and r < len(s) and s[l] == s[r]:
                    l -= 1
                    r += 1
                if r - l - 1 > end - start:
                    start, end = l + 1, r - 1
        return s[start:end + 1]
`;

const PY_RANGESUM = `class NumArray:
    def __init__(self, nums):
        self.prefix = [0]
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def sumRange(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]
`;

// ---------- Apply ----------

async function reseed(slug, test_cases, python) {
  const { data: existing, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions, test_cases')
    .eq('id', slug)
    .maybeSingle();
  if (fetchErr) { console.error(slug, fetchErr); return null; }
  if (!existing) { console.error('Not found:', slug); return null; }
  const prior = Array.isArray(existing.test_cases) ? existing.test_cases.length : 0;
  const solutions = { ...(existing.solutions || {}), python };
  const patch = { solutions };
  if (test_cases !== null) patch.test_cases = test_cases;
  const { error: upErr } = await sb
    .from('PGcode_problems')
    .update(patch)
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases === null ? prior : test_cases.length, skipped: test_cases === null };
}

const lenCases = buildLenCases();
const substrCases = buildSubstrCases();

console.log(`longest-palindrome: ${lenCases.length} cases`);
for (const tc of lenCases.slice(0, 5)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);
console.log(`longest-palindromic-substring: ${substrCases.length} cases`);
for (const tc of substrCases.slice(0, 5)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);

const r1 = await reseed('longest-palindrome', lenCases, PY_LEN);
const r2 = await reseed('longest-palindromic-substring', substrCases, PY_SUBSTR);
// range-sum-query-immutable is multi-op (class with __init__ + sumRange).
// Driver-code harness does not support multi-op design problems, so we only
// refresh the canonical Python solution and SKIP test_cases.
const r3 = await reseed('range-sum-query-immutable', null, PY_RANGESUM);

console.log('\n--- Results ---');
for (const r of [r1, r2, r3]) {
  if (!r) continue;
  if (r.skipped) {
    console.log(`${r.slug}: SKIPPED test_cases (multi-op design); solutions.python updated. prior=${r.prior}`);
  } else {
    console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
  }
}
