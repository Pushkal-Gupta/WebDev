#!/usr/bin/env node
// Atomic splice: inject 3 viz fns before `export const RICH_CONTENT = {`
// and 3 problem entries before its closing `};`.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function validPalindromeIIViz(')
  || src.includes("'valid-palindrome-ii':")
  || src.includes('"valid-palindrome-ii":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function validPalindromeIIViz() {
  const s = 'abca';
  const arr = s.split('');
  const frames = [];

  frames.push({
    array: arr.slice(),
    chip: [
      { label: 's', value: '"' + s + '"' },
      { label: 'rule', value: 'palindrome after deleting at most 1 char', tone: 'violet' },
    ],
    caption: 'Two pointers from both ends. While chars match, march inward. On the first mismatch you get exactly one rescue attempt — skip the left char or skip the right char and re-check.',
  });

  let l = 0, r = arr.length - 1;
  while (l < r && arr[l] === arr[r]) {
    frames.push({
      array: arr.slice(),
      highlights: { [l]: 'low', [r]: 'mid' },
      chip: [
        { label: 'l', value: String(l) },
        { label: 'r', value: String(r) },
        { label: 'match', value: arr[l] + ' == ' + arr[r], tone: 'violet' },
      ],
      caption: 'arr[' + l + ']="' + arr[l] + '" matches arr[' + r + ']="' + arr[r] + '". Move both pointers inward.',
    });
    l++; r--;
  }

  frames.push({
    array: arr.slice(),
    highlights: { [l]: 'pink', [r]: 'pink' },
    chip: [
      { label: 'l', value: String(l) },
      { label: 'r', value: String(r) },
      { label: 'mismatch', value: arr[l] + ' != ' + arr[r], tone: 'pink' },
    ],
    caption: 'Mismatch at l=' + l + ', r=' + r + ' ("' + arr[l] + '" vs "' + arr[r] + '"). Spend the single allowed deletion: try skipping the left char OR the right char.',
  });

  const skipLeft = s.slice(l + 1, r + 1);
  const skipRight = s.slice(l, r);
  frames.push({
    array: skipLeft.split(''),
    chip: [
      { label: 'attempt', value: 'skip left "' + arr[l] + '"', tone: 'violet' },
      { label: 'check', value: '"' + skipLeft + '"' },
    ],
    caption: 'Skip the left char "' + arr[l] + '". Remaining slice "' + skipLeft + '" must itself be a palindrome.',
  });

  const skipLeftOk = skipLeft === skipLeft.split('').reverse().join('');
  frames.push({
    array: skipLeft.split(''),
    chip: [
      { label: 'reversed', value: '"' + skipLeft.split('').reverse().join('') + '"' },
      { label: 'palindrome?', value: skipLeftOk ? 'yes' : 'no', tone: skipLeftOk ? 'violet' : 'pink' },
    ],
    caption: skipLeftOk ? 'Skip-left slice is a palindrome — answer is true.' : 'Skip-left slice is not a palindrome. Try the other rescue.',
  });

  frames.push({
    array: skipRight.split(''),
    chip: [
      { label: 'attempt', value: 'skip right "' + arr[r] + '"', tone: 'violet' },
      { label: 'check', value: '"' + skipRight + '"' },
    ],
    caption: 'Skip the right char "' + arr[r] + '". Remaining slice "' + skipRight + '" must be a palindrome.',
  });

  const skipRightOk = skipRight === skipRight.split('').reverse().join('');
  const ok = skipLeftOk || skipRightOk;
  frames.push({
    array: skipRight.split(''),
    chip: [
      { label: 'reversed', value: '"' + skipRight.split('').reverse().join('') + '"' },
      { label: 'palindrome?', value: skipRightOk ? 'yes' : 'no', tone: skipRightOk ? 'violet' : 'pink' },
    ],
    caption: skipRightOk ? 'Skip-right slice is a palindrome — answer is true.' : 'Skip-right slice is not a palindrome either.',
  });

  frames.push({
    array: arr.slice(),
    chip: [
      { label: 'answer', value: ok ? 'true' : 'false', tone: 'pink' },
      { label: 'budget', value: '1 deletion', tone: 'violet' },
    ],
    caption: 'Result: ' + ok + '. The trick is the helper: when symmetric pointers disagree, only two windows are worth checking — never recurse, never branch deeper.',
  });

  return { renderer: 'array', title: 'Valid Palindrome II — two pointers + one rescue', frames };
}

function stringCompressionViz() {
  const chars = ['a', 'a', 'b', 'b', 'c', 'c', 'c'];
  const frames = [];

  frames.push({
    array: chars.slice(),
    chip: [
      { label: 'chars', value: '[' + chars.map(c => '"' + c + '"').join(',') + ']' },
      { label: 'in-place', value: 'two pointers, no extra array', tone: 'violet' },
    ],
    caption: 'Compress runs of equal chars in place. Write pointer w lays down [char, run-length-digits]; read pointer i scans groups.',
  });

  const buf = chars.slice();
  let w = 0, i = 0;
  while (i < buf.length) {
    const ch = buf[i];
    let j = i;
    while (j < buf.length && buf[j] === ch) j++;
    const run = j - i;

    frames.push({
      array: buf.slice(),
      highlights: Object.fromEntries(Array.from({ length: run }, (_, k) => [i + k, 'low'])),
      chip: [
        { label: 'i', value: String(i) },
        { label: 'group', value: '"' + ch + '" x ' + run, tone: 'violet' },
        { label: 'w', value: String(w) },
      ],
      caption: 'Scan run starting at i=' + i + ': character "' + ch + '" repeats ' + run + ' time' + (run === 1 ? '' : 's') + '. j advances to ' + j + '.',
    });

    buf[w] = ch;
    w++;
    frames.push({
      array: buf.slice(),
      highlights: { [w - 1]: 'mid' },
      chip: [
        { label: 'write', value: '"' + ch + '"', tone: 'pink' },
        { label: 'w', value: String(w) },
      ],
      caption: 'Write char "' + ch + '" at position ' + (w - 1) + '. w now ' + w + '.',
    });

    if (run > 1) {
      const digits = String(run).split('');
      for (const d of digits) {
        buf[w] = d;
        w++;
      }
      frames.push({
        array: buf.slice(),
        highlights: Object.fromEntries(digits.map((_, k) => [w - digits.length + k, 'mid'])),
        chip: [
          { label: 'count', value: String(run), tone: 'pink' },
          { label: 'digits', value: digits.join(','), tone: 'violet' },
          { label: 'w', value: String(w) },
        ],
        caption: 'Run length ' + run + ' > 1 — write each digit ("' + digits.join('","') + '") after the char. Multi-digit counts (10, 100, ...) write each digit separately.',
      });
    } else {
      frames.push({
        array: buf.slice(),
        chip: [
          { label: 'count', value: '1 (omitted)', tone: 'violet' },
          { label: 'w', value: String(w) },
        ],
        caption: 'Run length is 1 — do NOT write the count. Single chars stay single chars.',
      });
    }

    i = j;
  }

  frames.push({
    array: buf.slice(0, w),
    chip: [
      { label: 'compressed', value: '[' + buf.slice(0, w).map(c => '"' + c + '"').join(',') + ']', tone: 'pink' },
      { label: 'length', value: String(w), tone: 'pink' },
    ],
    caption: 'Returned length = ' + w + '. The first ' + w + ' slots of chars hold the answer; positions beyond w are leftover scratch and ignored.',
  });

  return { renderer: 'array', title: 'String Compression — in-place run-length with two pointers', frames };
}

function repeatedSubstringPatternViz() {
  const s = 'abab';
  const doubled = s + s;
  const trimmed = doubled.slice(1, -1);
  const found = trimmed.indexOf(s);
  const frames = [];

  frames.push({
    array: s.split(''),
    chip: [
      { label: 's', value: '"' + s + '"' },
      { label: 'goal', value: 'is s built from a repeated block?', tone: 'violet' },
    ],
    caption: 'Question: can s be written as some prefix repeated k >= 2 times? Example: "abab" = "ab" + "ab".',
  });

  frames.push({
    array: doubled.split(''),
    chip: [
      { label: 's+s', value: '"' + doubled + '"', tone: 'violet' },
      { label: 'length', value: String(doubled.length) },
    ],
    caption: 'Trick: concatenate s with itself. If s is k copies of some block, then s+s contains 2k copies — and a fresh copy of s appears straddling the join.',
  });

  frames.push({
    array: doubled.split(''),
    highlights: { 0: 'pink', [doubled.length - 1]: 'pink' },
    chip: [
      { label: 'strip', value: 'drop first + last char', tone: 'pink' },
    ],
    caption: 'Strip the first and last char — this kills the trivial occurrences at position 0 (the original s) and at position n (the second copy of s). Only "real" rotations remain.',
  });

  frames.push({
    array: trimmed.split(''),
    chip: [
      { label: '(s+s)[1:-1]', value: '"' + trimmed + '"', tone: 'violet' },
      { label: 'length', value: String(trimmed.length) },
    ],
    caption: 'Trimmed string "' + trimmed + '". Now search for s inside it.',
  });

  if (found >= 0) {
    frames.push({
      array: trimmed.split(''),
      highlights: Object.fromEntries(Array.from({ length: s.length }, (_, k) => [found + k, 'mid'])),
      chip: [
        { label: 'found at', value: String(found), tone: 'pink' },
        { label: 'match', value: '"' + s + '"', tone: 'violet' },
      ],
      caption: 'Found s at index ' + found + ' of the trimmed string — proof that a non-trivial rotation of s equals s itself, which only happens when s is periodic.',
    });
  } else {
    frames.push({
      array: trimmed.split(''),
      chip: [
        { label: 'find', value: 'not found', tone: 'pink' },
      ],
      caption: 'No occurrence of s in the trimmed string. s is not a repetition of any shorter block.',
    });
  }

  frames.push({
    array: s.split(''),
    chip: [
      { label: 'answer', value: found >= 0 ? 'true' : 'false', tone: 'pink' },
      { label: 'time', value: 'O(n) with KMP search', tone: 'violet' },
    ],
    caption: 'Result: ' + (found >= 0) + '. Why it works: a string equals a non-trivial rotation of itself iff it has a proper period dividing its length — exactly the definition of "repeated substring".',
  });

  return { renderer: 'array', title: 'Repeated Substring Pattern — (s+s)[1:-1].find(s)', frames };
}

`;

// Entries to splice in just before the RICH_CONTENT closing brace.
const ENTRY_BLOCK = `  'valid-palindrome-ii': {
    tags: ['string', 'two-pointers', 'greedy'],
    companies: ['meta', 'google', 'amazon', 'microsoft', 'apple', 'bloomberg', 'uber'],
    viz: validPalindromeIIViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def validPalindrome(self, s: str) -> bool:
        def is_pal(i: int, j: int) -> bool:
            while i < j:
                if s[i] != s[j]:
                    return False
                i += 1
                j -= 1
            return True

        l, r = 0, len(s) - 1
        while l < r:
            if s[l] != s[r]:
                return is_pal(l + 1, r) or is_pal(l, r - 1)
            l += 1
            r -= 1
        return True\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Two pointers march from both ends. The first mismatch costs the single allowed deletion — check the substring with the left char skipped OR the right char skipped. At most one re-scan, so still linear.',
      },
      javascript: {
        code: \`function validPalindrome(s) {
  const isPal = (i, j) => {
    while (i < j) {
      if (s[i] !== s[j]) return false;
      i++; j--;
    }
    return true;
  };
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);
    l++; r--;
  }
  return true;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same idea. Closure captures s so the helper avoids re-passing it. Short-circuit OR means the right-skip is only tried if left-skip fails.',
      },
      java: {
        code: \`class Solution {
    public boolean validPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l) != s.charAt(r)) {
                return isPal(s, l + 1, r) || isPal(s, l, r - 1);
            }
            l++; r--;
        }
        return true;
    }

    private boolean isPal(String s, int i, int j) {
        while (i < j) {
            if (s.charAt(i) != s.charAt(j)) return false;
            i++; j--;
        }
        return true;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'charAt avoids creating substrings — keep both passes O(n) without allocation.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool validPalindrome(string s) {
        int l = 0, r = (int)s.size() - 1;
        while (l < r) {
            if (s[l] != s[r]) return isPal(s, l + 1, r) || isPal(s, l, r - 1);
            l++; r--;
        }
        return true;
    }
private:
    bool isPal(const string& s, int i, int j) {
        while (i < j) {
            if (s[i] != s[j]) return false;
            i++; j--;
        }
        return true;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Pass the string by const reference to the helper — no copy. Indices avoid substring construction.',
      },
      c: {
        code: \`#include <stdbool.h>
#include <string.h>

static bool isPal(const char* s, int i, int j) {
    while (i < j) {
        if (s[i] != s[j]) return false;
        i++; j--;
    }
    return true;
}

bool validPalindrome(char* s) {
    int l = 0, r = (int)strlen(s) - 1;
    while (l < r) {
        if (s[l] != s[r]) return isPal(s, l + 1, r) || isPal(s, l, r - 1);
        l++; r--;
    }
    return true;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'strlen once up front; everything else is pointer arithmetic on the same buffer.',
      },
      go: {
        code: \`func validPalindrome(s string) bool {
    isPal := func(i, j int) bool {
        for i < j {
            if s[i] != s[j] {
                return false
            }
            i++
            j--
        }
        return true
    }
    l, r := 0, len(s)-1
    for l < r {
        if s[l] != s[r] {
            return isPal(l+1, r) || isPal(l, r-1)
        }
        l++
        r--
    }
    return true
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Closure captures s; byte indexing works because LeetCode inputs are ASCII. For full Unicode you would convert to []rune first.',
      },
    },
  },
  'string-compression': {
    tags: ['string', 'two-pointers', 'array'],
    companies: ['microsoft', 'amazon', 'google', 'apple', 'meta', 'bloomberg'],
    viz: stringCompressionViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def compress(self, chars: list[str]) -> int:
        n = len(chars)
        w = i = 0
        while i < n:
            j = i
            while j < n and chars[j] == chars[i]:
                j += 1
            chars[w] = chars[i]
            w += 1
            run = j - i
            if run > 1:
                for d in str(run):
                    chars[w] = d
                    w += 1
            i = j
        return w\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Read pointer i finds each run, j scans to the run end. Write pointer w lays down the character, then — only if the run length is >1 — each digit of the count. Single chars get no count. Returned length is w.',
      },
      javascript: {
        code: \`function compress(chars) {
  const n = chars.length;
  let w = 0, i = 0;
  while (i < n) {
    let j = i;
    while (j < n && chars[j] === chars[i]) j++;
    chars[w++] = chars[i];
    const run = j - i;
    if (run > 1) {
      for (const d of String(run)) chars[w++] = d;
    }
    i = j;
  }
  return w;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'String(run) handles multi-digit counts naturally — no manual digit extraction. Mutate in place; return new logical length.',
      },
      java: {
        code: \`class Solution {
    public int compress(char[] chars) {
        int n = chars.length, w = 0, i = 0;
        while (i < n) {
            int j = i;
            while (j < n && chars[j] == chars[i]) j++;
            chars[w++] = chars[i];
            int run = j - i;
            if (run > 1) {
                for (char d : Integer.toString(run).toCharArray()) chars[w++] = d;
            }
            i = j;
        }
        return w;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Integer.toString allocates a tiny string per run — amortized O(1) chars per run. The char[] is mutated in place.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compress(vector<char>& chars) {
        int n = (int)chars.size(), w = 0, i = 0;
        while (i < n) {
            int j = i;
            while (j < n && chars[j] == chars[i]) j++;
            chars[w++] = chars[i];
            int run = j - i;
            if (run > 1) {
                for (char d : to_string(run)) chars[w++] = d;
            }
            i = j;
        }
        return w;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'to_string handles arbitrary counts. Vector is mutated in place; caller reads chars[0..w).',
      },
      c: {
        code: \`#include <stdio.h>
#include <string.h>

int compress(char* chars, int charsSize) {
    int w = 0, i = 0;
    while (i < charsSize) {
        int j = i;
        while (j < charsSize && chars[j] == chars[i]) j++;
        chars[w++] = chars[i];
        int run = j - i;
        if (run > 1) {
            char buf[16];
            int k = snprintf(buf, sizeof(buf), "%d", run);
            for (int t = 0; t < k; t++) chars[w++] = buf[t];
        }
        i = j;
    }
    return w;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'snprintf into a 16-byte stack buffer handles up to 10^15-ish runs. Everything else is pointer index arithmetic on the in-place array.',
      },
      go: {
        code: \`func compress(chars []byte) int {
    n := len(chars)
    w, i := 0, 0
    for i < n {
        j := i
        for j < n && chars[j] == chars[i] {
            j++
        }
        chars[w] = chars[i]
        w++
        run := j - i
        if run > 1 {
            for _, d := range strconv.Itoa(run) {
                chars[w] = byte(d)
                w++
            }
        }
        i = j
    }
    return w
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'strconv.Itoa for the count; range over the resulting string yields runes (each ASCII digit fits in a byte). In-place mutation; w is the answer.',
      },
    },
  },
  'repeated-substring-pattern': {
    tags: ['string', 'pattern-matching', 'kmp'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    viz: repeatedSubstringPatternViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def repeatedSubstringPattern(self, s: str) -> bool:
        return s in (s + s)[1:-1]\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'One-liner trick. Concatenate s with itself, drop the first and last char (which kills the two trivial occurrences), and search for s in the rest. A hit proves s rotates onto itself — i.e. has a period dividing its length.',
      },
      javascript: {
        code: \`function repeatedSubstringPattern(s) {
  return (s + s).slice(1, -1).includes(s);
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Same trick. JS .includes uses an O(n+m) substring search under the hood in modern engines.',
      },
      java: {
        code: \`class Solution {
    public boolean repeatedSubstringPattern(String s) {
        String doubled = s + s;
        return doubled.substring(1, doubled.length() - 1).contains(s);
    }
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Java String.contains is naive O(n*m) in JDKs that ship without Boyer-Moore. For interview correctness this is fine; the KMP version below is the O(n) upgrade.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // O(n) KMP failure-function version: s is periodic iff
    // (n - fail[n-1]) divides n AND fail[n-1] > 0.
    bool repeatedSubstringPattern(string s) {
        int n = (int)s.size();
        vector<int> fail(n, 0);
        for (int i = 1, k = 0; i < n; ) {
            if (s[i] == s[k]) { fail[i++] = ++k; }
            else if (k) { k = fail[k - 1]; }
            else { fail[i++] = 0; }
        }
        int len = fail[n - 1];
        return len > 0 && n % (n - len) == 0;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'KMP failure table. Longest proper prefix that is also a suffix gives the repeat candidate: if (n - failure) evenly divides n, the string is periodic. True O(n) — no concatenation needed.',
      },
      c: {
        code: \`#include <stdbool.h>
#include <string.h>
#include <stdlib.h>

bool repeatedSubstringPattern(char* s) {
    int n = (int)strlen(s);
    if (n < 2) return false;
    int* fail = (int*)calloc(n, sizeof(int));
    for (int i = 1, k = 0; i < n; ) {
        if (s[i] == s[k]) { fail[i++] = ++k; }
        else if (k) { k = fail[k - 1]; }
        else { fail[i++] = 0; }
    }
    int len = fail[n - 1];
    bool ans = len > 0 && n % (n - len) == 0;
    free(fail);
    return ans;
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Same KMP idea. calloc zeroes fail[]; remember to free or you leak per call.',
      },
      go: {
        code: \`func repeatedSubstringPattern(s string) bool {
    if len(s) < 2 {
        return false
    }
    return strings.Contains((s + s)[1:len(s)*2-1], s)
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Go strings.Contains uses Rabin-Karp under the hood — linear in practice. Slice arithmetic does the strip in one shot.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

// Find the matching closing of RICH_CONTENT: walk after vizIdx, count braces from
// the opening `{` after the anchor until they balance.
const openBracePos = src.indexOf('{', vizIdx);
let depth = 0, closeIdx = -1;
for (let p = openBracePos; p < src.length; p++) {
  const ch = src[p];
  // Skip strings + comments very crudely. Adequate because all braces in our entries
  // are real syntax (no `{` inside the code template literals would matter — but we
  // do have `${...}` in JS template strings? None in this source — the existing
  // solutions[] entries use plain strings with embedded { }).
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) { closeIdx = p; break; }
  }
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx); // strictly between { and }
const after = src.slice(closeIdx); // includes the closing }

// Splice viz fns before RICH_CONTENT, and the 3 entries at the END of the body
// (just before the closing brace).
const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced viz fns + 3 entries into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
