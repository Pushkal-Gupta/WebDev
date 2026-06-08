#!/usr/bin/env node
// Build WAVE 34S: repeated-dna-sequences + string-without-3-consecutive
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ============================================================
// PROBLEM 1: repeated-dna-sequences (LC 187)
//   findRepeatedDnaSequences(s: str) -> List[str]
//   Return all 10-letter-long sequences that occur more than once in s.
//   Order: the spec says "any order"; we standardize on SORTED ascending so
//   the registry's expected string is canonical and matches Python's
//   `sorted(...)`. The reference solutions in all four languages emit the
//   same sorted form.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F352A);

  function ref(s) {
    const seen = new Set();
    const out = new Set();
    if (s.length < 10) return [];
    for (let i = 0; i + 10 <= s.length; i++) {
      const sub = s.substring(i, i + 10);
      if (seen.has(sub)) out.add(sub);
      else seen.add(sub);
    }
    return Array.from(out).sort();
  }

  const cases = [];

  // Canonical LC sample 1
  cases.push("AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT");
  // Canonical LC sample 2
  cases.push("AAAAAAAAAAAAA");
  // No repeats: exactly 10 letters
  cases.push("ACGTACGTAC");
  // 9 letters: too short
  cases.push("ACGTACGTA");
  // Empty
  cases.push("");
  // Single letter
  cases.push("A");
  // 10 distinct nothing repeats
  cases.push("ACGTACGTAC" + "GTACGTACGT");
  // Exactly two windows, same
  cases.push("AAAAAAAAAAA"); // length 11, two identical windows AAAAAAAAAA
  // Two distinct repeated 10-mers
  cases.push("AAAAAAAAAA" + "CCCCCCCCCC" + "AAAAAAAAAA" + "CCCCCCCCCC");
  // Sliding overlap repeats
  cases.push("ACACACACACACACACACAC"); // many overlapping repeats
  // Repeats at the boundary
  cases.push("GGGGGGGGGGTTTTTTTTTTGGGGGGGGGG");
  // Mixed with a unique segment in the middle
  cases.push("AAAAACCCCCGGGGGTTTTTAAAAACCCCC");
  // All G
  cases.push("GGGGGGGGGGGGGGGGGGGG");
  // All T
  cases.push("TTTTTTTTTTTTT");
  // Three repeats of one 10-mer (still appears once in output)
  cases.push("ACGTACGTAC".repeat(3));
  // Repeats with shifted phase
  cases.push("AACCGGTTAACCGGTTAACCGGTTAACCGGTT");
  // Single non-repeating, then a repeat at end
  cases.push("CGTACGATCG" + "ATATATATAT" + "ATATATATAT");
  // Just under threshold
  cases.push("AAAAAAAAA");
  // 20-char palindromic-ish (still no exact 10-mer repeat)
  cases.push("ACGTACGTGC" + "CGTGCATGCA");
  // Mixed, two distinct 10-mers each appearing twice
  cases.push("AAAAAAAAAACCCCCCCCCCAAAAAAAAAACCCCCCCCCC");
  // Repeats of two adjacent windows
  cases.push("AAAAAAAAAAA" + "CCCCCCCCCCC"); // 22 chars: AAAA... twice + CCCC... twice
  // No repeats but length 30 mixed
  cases.push("ACGTACGTGT" + "GTGTGTGTGA" + "CACACACACA");
  // Length exactly 11 with two windows different
  cases.push("ACGTACGTACG"); // ACGTACGTAC and CGTACGTACG: different
  // Long random-ish string with at least one engineered repeat
  cases.push("ACGTACGTAC" + "GGGGGGGGGG" + "ACGTACGTAC" + "TTTTTTTTTT" + "GGGGGGGGGG");
  // Pure CCCC long
  cases.push("CCCCCCCCCCCCCCCCCCCC");
  // Mixed AAACCC
  cases.push("AAACCCAAACCCAAACCCAAACCC"); // length 24
  // Length 12 - two overlapping windows, equal only if all same
  cases.push("ACACACACACAC");
  // Length 11 same letter
  cases.push("AAAAAAAAAAA"); // 11 A's: AAAAAAAAAA appears twice

  // Random LCG-generated DNA strings of various lengths
  const alphabet = "ACGT";
  while (cases.length < 33) {
    const len = 12 + (lcg() % 50);
    let s = "";
    for (let i = 0; i < len; i++) {
      s += alphabet[lcg() % 4];
    }
    // Occasionally inject a known repeat
    if ((lcg() & 1) === 0 && s.length >= 25) {
      const pos1 = lcg() % (s.length - 20);
      const pos2 = pos1 + 10 + (lcg() % Math.max(1, s.length - pos1 - 20));
      const seq = s.substring(pos1, pos1 + 10);
      s = s.substring(0, pos2) + seq + s.substring(pos2 + 10);
    }
    cases.push(s);
  }

  const test_cases = cases.map((s) => ({
    inputs: [JSON.stringify(s)],
    expected: JSON.stringify(ref(s))
  }));

  return {
    slug: "repeated-dna-sequences",
    obj: {
      description: "The **DNA sequence** is composed of a series of nucleotides abbreviated as `'A'`, `'C'`, `'G'`, and `'T'`. For example, `\"ACGAATTCCG\"` is a DNA sequence.\n\nGiven a string `s` that represents a DNA sequence, return **all the 10-letter-long sequences (substrings) that occur more than once** in a DNA molecule. The answer may be returned in **any order**; this registry standardizes on **sorted ascending** so the expected output is canonical.\n\n**Example 1**\n\n```\nInput:  s = \"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT\"\nOutput: [\"AAAAACCCCC\", \"CCCCCAAAAA\"]\n```\n\n**Example 2**\n\n```\nInput:  s = \"AAAAAAAAAAAAA\"\nOutput: [\"AAAAAAAAAA\"]\n```\n\nThis is **LeetCode 187 — Repeated DNA Sequences**. The canonical solution is a sliding window of length 10 over the string, hashed into a set of seen substrings; any substring seen a second time is added to a result set. Returning the result as a sorted list keeps the grader's expected value deterministic.",
      method_name: "findRepeatedDnaSequences",
      params: [
        { name: "s", type: "str" }
      ],
      return_type: "List[str]",
      tags: ["hash-table", "string", "bit-manipulation", "sliding-window", "rolling-hash"],
      pattern: "**Slide a length-10 window over the string, hash each window into a set, and record any window that appears twice.** The problem is a textbook membership question dressed up in bioinformatics terminology.\n\n**The core loop.** For `i` from `0` to `len(s) - 10`, extract the substring `s[i:i+10]`. Track two sets:\n\n```\nseen  = set()   # 10-mers we have already encountered at least once\nfound = set()   # 10-mers we have encountered at least twice\nfor i in range(len(s) - 9):\n    sub = s[i:i+10]\n    if sub in seen:\n        found.add(sub)\n    else:\n        seen.add(sub)\nreturn sorted(found)\n```\n\nUsing `found` as a set (not a list) is critical: a 10-mer that appears 3 times must appear exactly once in the output, not twice.\n\n**Why two sets, not a counter.** A `Counter / HashMap<str, int>` works but does double the bookkeeping. The two-set form costs one extra lookup but avoids the post-pass over the map to extract keys with count >= 2.\n\n**Complexity, plain.** With `n = len(s)`, the loop runs `n - 9` times. Each iteration takes `O(10)` to extract the substring and `O(10)` to hash it. So the running time is `O(10 * n) = O(n)` (the 10 is a constant). Auxiliary memory holds at most `n - 9` distinct 10-mers in `seen`, so `O(n)` extra space — each entry costs `O(10)` characters.\n\n**Rolling-hash optimization (Rabin-Karp).** For very large `n` (gigabase-scale DNA), the constant `10` on hashing matters. Treat the 10-mer as a base-4 integer: `A=0, C=1, G=2, T=3`. Each 10-mer fits in 20 bits — an `int`. Rolling update on each shift:\n\n```\nhash_{i+1} = (hash_i - s[i] * 4^9) * 4 + s[i+10]\n```\n\nNow each iteration is `O(1)` after the initial fill. Hash collisions are impossible because the 20-bit integer uniquely identifies a 10-mer over the 4-letter alphabet.\n\n**Edge cases.** `n < 10`: no 10-mer exists; return `[]`. `n == 10`: at most one 10-mer; no repeats possible; return `[]`. `n == 11`: two overlapping 10-mers; they are equal iff all 11 characters are the same letter. The all-same-letter input is the canonical edge: it produces exactly one 10-mer in the output.\n\n**Brute-force comparison.** Pairwise compare every pair `(i, j)` of 10-mer starting positions: `O(n^2)` time with `O(n^2)` string comparisons. Useless above `n ~= 10^4`.",
      follow_up: "**Variant 1 — find all k-mers that occur >= t times.** Generalize the constants: window length `k`, threshold `t`. The two-set scaffold becomes a `Counter` so you can detect the threshold crossing for arbitrary `t`.\n\n**Variant 2 — DNA with `N` (unknown nucleotide).** Real sequencing data sometimes contains `N`. Decide whether to skip windows containing `N` (most common) or treat `N` as a wildcard (much harder — exponential in the count of `N`s).\n\n**Variant 3 — count, not list.** Return the number of distinct 10-mers that repeat. Drop the result list; track `found.size()` only.\n\n**Variant 4 — return repeat counts.** Return a `Map<str, int>` from each repeated 10-mer to its multiplicity. Use a single `Counter` and filter `count >= 2`.\n\n**Variant 5 — streaming input (one base at a time).** Maintain a rolling hash + deque of the last 10 bases. Each new base updates the hash in `O(1)` and contributes one membership check. Memory is still `O(distinct 10-mers seen)` because the result set must remember them.\n\n**Variant 6 — output in input order.** Replace the result set with a list + a 'first-saw-repeat' set. The first time a 10-mer repeats, append it to the list and add to the marker set; subsequent repeats are ignored.\n\n**Implementation pitfalls.**\n1. **Appending repeats to a list instead of a set.** A 10-mer that appears 3 times would otherwise show up twice in the output. Always use a set for `found` (or a flag-on-first-repeat).\n2. **Off-by-one on the loop bound.** The valid starting positions are `0` to `n - 10` inclusive; the loop must use `range(n - 9)` in Python or `i + 10 <= n` in C-style languages. `i < n - 10` drops the last window.\n3. **Substring slicing creating new strings each iteration.** In tight C++ / Java code, prefer `string_view` / `String.regionMatches` / rolling hash to avoid per-iteration allocation.\n4. **Forgetting to handle `n < 10`.** The loop body simply does not execute; just return `[]`. Be explicit so the reader does not have to derive it.\n5. **Returning an unordered iteration of `found`.** Any order is technically accepted by LC, but the grader here compares to a canonical sorted list. Sort before returning.\n6. **Bit-packing with `A=00, C=01, G=10, T=11`.** A `10 * 2 = 20`-bit integer fits a 10-mer. Forgetting to mask off the top bits during the rolling update leaks state from the previous window and produces wrong hashes.",
      complexity: {
        time: "**O(n)** where `n = len(s)`. The sliding window visits each starting position once, performs an `O(10)` substring extraction (or `O(1)` rolling-hash update), and does one `O(1)` average-case hash-set lookup. The total is `O(n)` with a small constant.",
        space: "**O(n)** auxiliary. The `seen` set may grow to hold `n - 9` distinct 10-mers, each `O(10)` characters. The output set is at most the same size. With bit-packed hashing, each entry shrinks to a 4-byte integer, but the asymptotic bound is unchanged.",
        notes: "The 10 in '10-letter sequences' is a problem-level constant. If `k` were a parameter, the time would become `O(k * n)` for the substring form, or `O(n)` for the rolling-hash form (after an `O(k)` initialization).",
        optimal: "**O(n) is essentially optimal.** Any algorithm must read every character of `s` to know whether it participates in a repeating 10-mer, so the lower bound is `Omega(n)`. The set-based approach matches it, and the rolling-hash refinement matches it with a smaller constant factor."
      },
      constraints: [
        "0 <= s.length <= 10^5",
        "s[i] is either 'A', 'C', 'G', or 'T'",
        "Return value must contain each repeated 10-mer exactly once",
        "Order: this registry returns the result sorted ascending"
      ],
      hints: [
        "**Slide a 10-character window over `s`.** For each starting index `i`, the candidate 10-mer is `s[i:i+10]`.",
        "**Two sets are enough.** `seen` collects every 10-mer encountered; `found` collects 10-mers seen at least twice. Whenever a window is already in `seen`, add it to `found`.",
        "**Sort the result for canonical output.** The spec allows any order, but the grader compares strings — sort the result list before returning.",
        "**Rolling hash if perf matters.** Encode `A->0, C->1, G->2, T->3` as 2-bit symbols and pack a 10-mer into a 20-bit integer. Updates become `O(1)` per shift.",
        "**Edge case: `n < 10`.** No 10-mer exists; return an empty list immediately."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def findRepeatedDnaSequences(self, s: str) -> List[str]:\n        seen = set()\n        found = set()\n        for i in range(len(s) - 9):\n            sub = s[i:i+10]\n            if sub in seen:\n                found.add(sub)\n            else:\n                seen.add(sub)\n        return sorted(found)\n",
        javascript: "var findRepeatedDnaSequences = function(s) {\n    const seen = new Set();\n    const found = new Set();\n    for (let i = 0; i + 10 <= s.length; i++) {\n        const sub = s.substring(i, i + 10);\n        if (seen.has(sub)) found.add(sub);\n        else seen.add(sub);\n    }\n    return Array.from(found).sort();\n};\n",
        java: "import java.util.*;\n\npublic class Solution {\n    public List<String> findRepeatedDnaSequences(String s) {\n        Set<String> seen = new HashSet<>();\n        Set<String> found = new TreeSet<>();\n        for (int i = 0; i + 10 <= s.length(); i++) {\n            String sub = s.substring(i, i + 10);\n            if (!seen.add(sub)) {\n                found.add(sub);\n            }\n        }\n        return new ArrayList<>(found);\n    }\n}\n",
        cpp: "#include <vector>\n#include <string>\n#include <unordered_set>\n#include <set>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<string> findRepeatedDnaSequences(string s) {\n        unordered_set<string> seen;\n        set<string> found;\n        for (int i = 0; i + 10 <= (int)s.size(); i++) {\n            string sub = s.substr(i, 10);\n            if (!seen.insert(sub).second) {\n                found.insert(sub);\n            }\n        }\n        return vector<string>(found.begin(), found.end());\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: string-without-3-consecutive (LC 984)
//   Given a and b nonneg ints, return a string s of length a+b such that:
//     - exactly a chars are 'a' and exactly b chars are 'b'
//     - no substring "aaa" or "bbb" appears in s
//   Any valid string is accepted. We choose a deterministic greedy:
//     - At each step, append the letter whose remaining count is larger,
//       BUT if that would create a triple, append the other letter.
//   The reference is also the canonical solution.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F352B);

  function ref(a, b) {
    let out = "";
    let ra = a, rb = b;
    while (ra > 0 || rb > 0) {
      const aMore = ra >= rb;
      const tail = out.length >= 2 ? out.substring(out.length - 2) : "";
      if (aMore) {
        if (tail === "aa") {
          // forced to place 'b'
          out += "b";
          rb -= 1;
        } else {
          out += "a";
          ra -= 1;
        }
      } else {
        if (tail === "bb") {
          out += "a";
          ra -= 1;
        } else {
          out += "b";
          rb -= 1;
        }
      }
    }
    return out;
  }

  function validate(s, a, b) {
    let ca = 0, cb = 0;
    for (const ch of s) { if (ch === "a") ca++; else if (ch === "b") cb++; else return false; }
    if (ca !== a || cb !== b) return false;
    if (s.indexOf("aaa") !== -1) return false;
    if (s.indexOf("bbb") !== -1) return false;
    return true;
  }

  const cases = [];

  // Canonical LC samples
  cases.push([1, 2]);   // -> "abb" or "bab" or "bba"
  cases.push([4, 1]);   // -> "aabaa"
  // Zeros
  cases.push([0, 0]);
  cases.push([0, 1]);
  cases.push([1, 0]);
  cases.push([0, 2]);
  cases.push([2, 0]);
  // Balanced small
  cases.push([1, 1]);
  cases.push([2, 2]);
  cases.push([3, 3]);
  // Skewed
  cases.push([5, 2]);
  cases.push([2, 5]);
  cases.push([6, 3]);
  cases.push([3, 6]);
  cases.push([4, 2]);
  cases.push([2, 4]);
  // Larger balanced
  cases.push([10, 10]);
  cases.push([20, 20]);
  // Maximum-feasible imbalance: a = 2*(b+1) is still feasible
  cases.push([6, 2]);  // ratio 3:1 boundary
  cases.push([8, 3]);
  cases.push([2, 6]);
  // Constraint edges (feasible: max <= 2*(min+1))
  cases.push([1, 4]);
  cases.push([3, 1]);
  cases.push([7, 4]);
  cases.push([4, 7]);
  // Triangular shapes
  cases.push([10, 5]);
  cases.push([5, 10]);
  cases.push([12, 6]);
  cases.push([6, 12]);

  // Random LCG-generated cases within the LC bound a,b in [0..100]
  while (cases.length < 33) {
    const a = lcg() % 25;
    const b = lcg() % 25;
    // Keep feasibility: if either count >= 2 * (other + 1) + 1, ref greedy
    // may emit triples. So clamp so max <= 2 * (min + 1).
    let aa = a, bb = b;
    if (aa > 2 * (bb + 1)) aa = 2 * (bb + 1);
    if (bb > 2 * (aa + 1)) bb = 2 * (aa + 1);
    cases.push([aa, bb]);
  }

  // Verify every case at script build time and store expected = ref(a, b).
  // The expected string is just one valid answer; the LC spec accepts any
  // valid answer, but for grader determinism we store the canonical one.
  const test_cases = cases.map(([a, b]) => {
    const expected = ref(a, b);
    if (!validate(expected, a, b)) {
      throw new Error("ref produced invalid output for a=" + a + " b=" + b + ": " + expected);
    }
    return {
      inputs: [String(a), String(b)],
      expected: JSON.stringify(expected)
    };
  });

  return {
    slug: "string-without-3-consecutive",
    obj: {
      description: "Given two integers `a` and `b`, return **any** string `s` such that:\n- `s` has length `a + b` and contains exactly `a` occurrences of `'a'` and `b` occurrences of `'b'`.\n- The substring `\"aaa\"` does **not** occur in `s`.\n- The substring `\"bbb\"` does **not** occur in `s`.\n\nIf there are several valid strings, return any of them. This registry stores the **canonical greedy** answer (described below) so the grader can compare exactly; an alternative valid answer would not match the stored string.\n\n**Example 1**\n\n```\nInput:  a = 1, b = 2\nOutput: \"abb\"      (also valid: \"bab\", \"bba\")\n```\n\n**Example 2**\n\n```\nInput:  a = 4, b = 1\nOutput: \"aabaa\"\n```\n\nThis is **LeetCode 984 — String Without AAA or BBB**. The canonical greedy: at every step append the letter whose remaining count is larger, EXCEPT if that would form a triple — in which case append the other letter. The greedy is provably correct whenever the input is feasible (`max(a,b) <= 2 * (min(a,b) + 1)`).",
      method_name: "strWithout3a3b",
      params: [
        { name: "a", type: "int" },
        { name: "b", type: "int" }
      ],
      return_type: "str",
      tags: ["greedy", "string"],
      pattern: "**Greedy with a single look-back.** Build the answer one character at a time. The only constraint that can be locally violated is 'do not extend an existing run of 2 same letters'. So the decision rule is:\n\n```\nlet last2 = last two chars of output (or '' if shorter)\nif remainingA >= remainingB:\n    if last2 == \"aa\":  append 'b'  (forced)\n    else:              append 'a'\nelse:\n    if last2 == \"bb\":  append 'a'  (forced)\n    else:              append 'b'\n```\n\n**Why this works.** Whenever the letter with the larger remaining count would create a triple, the other letter has at least one unit left — otherwise the input was infeasible. Concretely, when `last2 == \"aa\"` and we want to place another `'a'`, the previous two `'a'`s were placed in steps where `'a'` was the majority. After placing them, `remainingA` dropped by 2. For the greedy to still pick `'a'` (`ra >= rb`), we need `rb >= 1` (because the very first placement of `'a'` over `'b'` only required `ra >= rb`, so `rb` was at least 1 before that placement, and the second 'a' placement only happens when `ra > rb` strictly or `ra == rb` and we tie-break to `a`). The detailed bookkeeping is in the editorial; the practical takeaway is: **the only forced moves are after a same-letter run of 2, and forced moves never produce a triple.**\n\n**Feasibility.** Let `M = max(a, b)`, `m = min(a, b)`. The arrangement exists iff `M <= 2 * (m + 1)`. Intuition: every block of 2 majority letters must be separated by at least 1 minority letter, so `M <= 2 * (m + 1)` is the maximum sustainable ratio. LC guarantees `1 <= a + b <= 200` and a valid configuration so the test cases are always feasible; this registry's curated cases also respect that.\n\n**Why a single look-back is sufficient.** The forbidden pattern is exactly length 3. So whether the next character is legal depends only on the previous 2. No deeper look-back is ever required.\n\n**Counting argument for the choice rule.** Always picking the letter with the larger remaining count keeps the two counts balanced over time, which delays the moment when one letter runs out. Picking the smaller-count letter would let the larger-count letter pile up, eventually exceeding the `M <= 2 * (m + 1)` budget for the remaining suffix.\n\n**Edge cases.** `a == 0` or `b == 0`: the only constraint is `M <= 2`; the answer is exactly the letter repeated `M` times (length 0, 1, or 2). `a == b`: the greedy alternates, producing `ababab...` (or `baba...` if you tie-break the other way).\n\n**Brute-force comparison.** Backtracking — try each letter at each position and roll back on failure. Worst case `2^(a+b)` branches; useless above `a + b ~= 30`. The greedy gives a valid answer in linear time and constant extra space.",
      follow_up: "**Variant 1 — three letters (no `aaa`, no `bbb`, no `ccc`).** Greedy 'pick the letter with the largest remaining count that does not create a triple' still works. The feasibility bound generalizes too.\n\n**Variant 2 — disallow `aa` and `bb` (no consecutive repeats at all).** Now the constraint is `|a - b| <= 1` and the answer is forced alternation. There is no room for greedy choice.\n\n**Variant 3 — disallow `aaaa` and `bbbb` (no quadruples).** The look-back grows from 2 to 3. The greedy still works with the rule 'forced to switch only after a run of 3'.\n\n**Variant 4 — disallow a specific pattern like `ab` or `ba`.** This is a different problem entirely — it constrains transitions, not run lengths. Often the answer must be all `'a'`s then all `'b'`s, or no valid answer exists.\n\n**Variant 5 — return **any** valid string vs the lexicographically smallest.** Lex smallest changes the strategy: prefer `'a'` when feasible, regardless of remaining counts; only switch to `'b'` if forced. Still greedy, still `O(a + b)`.\n\n**Variant 6 — count the number of valid strings.** Combinatorial; involves DP `f[ra][rb][last2] = number of ways`. `O((a+b)^2)` states, each `O(1)` transition.\n\n**Implementation pitfalls.**\n1. **Always picking `'a'` first.** Without the 'majority count' heuristic, you can paint yourself into a corner where one letter runs out while the other still has 4+ left, producing a forced triple.\n2. **Forgetting the tie-break.** When `ra == rb`, picking either letter is fine; just be consistent so the test cases match.\n3. **Look-back of length 1.** Only checking the previous character (not the previous two) misses the case where you are about to extend `\"aa\"` into `\"aaa\"`.\n4. **Returning a list instead of a string.** All four reference implementations join the characters before returning.\n5. **Mutating a Python `str` repeatedly.** Use a list and `\"\".join(...)` at the end; otherwise the `+=` loop is `O(n^2)`.",
      complexity: {
        time: "**O(a + b)**. Exactly `a + b` iterations of the main loop, each performing a constant amount of work (compare remaining counts, examine the last two characters, append one character).",
        space: "**O(a + b)** for the output buffer. Auxiliary working space is `O(1)`: two counters and a 2-character window.",
        notes: "The look-back of the last 2 characters can be cached as two int variables instead of slicing the output string each iteration; the asymptotics do not change but the constant improves noticeably in Python.",
        optimal: "**O(a + b) is optimal.** Any algorithm must emit `a + b` characters, so the output alone takes linear time and space. The greedy matches this lower bound."
      },
      constraints: [
        "0 <= a, b <= 100 (LC: 1 <= a+b, but this registry also tests a=0 or b=0)",
        "Feasibility: max(a, b) <= 2 * (min(a, b) + 1)",
        "The output must contain exactly a 'a' chars and exactly b 'b' chars",
        "No 'aaa' or 'bbb' substring may appear",
        "This registry expects the canonical greedy output (majority-first, switch only when forced)"
      ],
      hints: [
        "**Greedy: pick the letter whose remaining count is larger.** Tie-break to 'a' for determinism.",
        "**Override the greedy when forced.** If the last two output characters are both the letter you want to place, place the other letter instead.",
        "**Look-back of exactly 2.** The forbidden pattern is length 3, so the previous two characters are all you need to inspect.",
        "**No deeper bookkeeping needed.** A simple loop with two integer counters and a tiny 2-character tail buffer suffices — no DP, no backtracking.",
        "**Feasibility shortcut.** `max(a, b) <= 2 * (min(a, b) + 1)` guarantees a valid string exists. LC always passes feasible inputs."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def strWithout3a3b(self, a: int, b: int) -> str:\n        out = []\n        while a > 0 or b > 0:\n            a_more = a >= b\n            tail = \"\".join(out[-2:]) if len(out) >= 2 else \"\"\n            if a_more:\n                if tail == \"aa\":\n                    out.append(\"b\"); b -= 1\n                else:\n                    out.append(\"a\"); a -= 1\n            else:\n                if tail == \"bb\":\n                    out.append(\"a\"); a -= 1\n                else:\n                    out.append(\"b\"); b -= 1\n        return \"\".join(out)\n",
        javascript: "var strWithout3a3b = function(a, b) {\n    let out = \"\";\n    while (a > 0 || b > 0) {\n        const aMore = a >= b;\n        const tail = out.length >= 2 ? out.substring(out.length - 2) : \"\";\n        if (aMore) {\n            if (tail === \"aa\") { out += \"b\"; b--; }\n            else { out += \"a\"; a--; }\n        } else {\n            if (tail === \"bb\") { out += \"a\"; a--; }\n            else { out += \"b\"; b--; }\n        }\n    }\n    return out;\n};\n",
        java: "public class Solution {\n    public String strWithout3a3b(int a, int b) {\n        StringBuilder sb = new StringBuilder();\n        while (a > 0 || b > 0) {\n            boolean aMore = a >= b;\n            int len = sb.length();\n            boolean tailAA = len >= 2 && sb.charAt(len - 1) == 'a' && sb.charAt(len - 2) == 'a';\n            boolean tailBB = len >= 2 && sb.charAt(len - 1) == 'b' && sb.charAt(len - 2) == 'b';\n            if (aMore) {\n                if (tailAA) { sb.append('b'); b--; }\n                else { sb.append('a'); a--; }\n            } else {\n                if (tailBB) { sb.append('a'); a--; }\n                else { sb.append('b'); b--; }\n            }\n        }\n        return sb.toString();\n    }\n}\n",
        cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string strWithout3a3b(int a, int b) {\n        string out;\n        while (a > 0 || b > 0) {\n            bool aMore = a >= b;\n            int n = (int)out.size();\n            bool tailAA = n >= 2 && out[n-1] == 'a' && out[n-2] == 'a';\n            bool tailBB = n >= 2 && out[n-1] == 'b' && out[n-2] == 'b';\n            if (aMore) {\n                if (tailAA) { out += 'b'; b--; }\n                else { out += 'a'; a--; }\n            } else {\n                if (tailBB) { out += 'a'; a--; }\n                else { out += 'b'; b--; }\n            }\n        }\n        return out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 34S START =====",
    "// === WAVE 34S " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34S " + p1.slug + " END ===",
    "// === WAVE 34S " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34S " + p2.slug + " END ===",
    "// ===== WAVE 34S END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// guard: don't double-write
if (src.indexOf("WAVE 34S START") !== -1) {
  console.error("WAVE 34S already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34R END marker and append block after it.
const ANCHOR = "// ===== WAVE 34R END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave34s " + p1.slug + " + " + p2.slug);
process.exit(0);
