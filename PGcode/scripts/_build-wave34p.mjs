#!/usr/bin/env node
// Build WAVE 34P: find-common-characters + counting-elements
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
// PROBLEM 1: find-common-characters (LC 1002)
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F34FA);

  // Canonical reference: per-word frequency, take elementwise minimum across all words.
  function commonChars(words) {
    if (!words || words.length === 0) return [];
    const minCount = new Array(26).fill(Infinity);
    for (const w of words) {
      const c = new Array(26).fill(0);
      for (const ch of w) c[ch.charCodeAt(0) - 97]++;
      for (let i = 0; i < 26; i++) {
        if (c[i] < minCount[i]) minCount[i] = c[i];
      }
    }
    const out = [];
    for (let i = 0; i < 26; i++) {
      const k = minCount[i] === Infinity ? 0 : minCount[i];
      for (let j = 0; j < k; j++) out.push(String.fromCharCode(97 + i));
    }
    return out.sort();
  }

  function randomLowerWord(lcg, minLen, maxLen) {
    const len = minLen + (lcg() % (maxLen - minLen + 1));
    let s = "";
    for (let i = 0; i < len; i++) {
      s += String.fromCharCode(97 + (lcg() % 26));
    }
    return s;
  }

  const cases = [];

  // canonical LC samples
  cases.push(["bella", "label", "roller"]);
  cases.push(["cool", "lock", "cook"]);

  // single word: every char survives at its full count
  cases.push(["aabbcc"]);
  cases.push(["a"]);
  cases.push(["zzzzz"]);

  // identical words
  cases.push(["abc", "abc", "abc"]);
  cases.push(["hello", "hello"]);

  // no shared chars
  cases.push(["abc", "def"]);
  cases.push(["a", "b", "c"]);

  // one word missing a char fully eliminates it
  cases.push(["aaa", "aaa", "aab"]);

  // mixed multiplicities
  cases.push(["aabb", "abab", "bbaa"]);

  // empty intersection due to one word lacking all letters of others
  cases.push(["xyz", "abcxyz", "xyzpqr"]);

  // all single-char words, all same letter
  cases.push(["a", "a", "a", "a"]);

  // 100 short words sharing exactly one letter
  cases.push(Array.from({ length: 8 }, (_, i) => "a" + String.fromCharCode(98 + (i % 25))));

  // long words with shared letter set
  cases.push(["abcdefghij", "jihgfedcba", "abcdefghij"]);

  // larger group
  cases.push(["common", "comma", "cosmic", "coconut"]);

  // mix of repeated letters
  cases.push(["aaabbb", "ababab", "bababa"]);

  // edge: many copies of one letter
  cases.push(["aaaa", "aa", "aaaaa", "aaa"]);

  // intersection of size 2
  cases.push(["good", "goal", "goat"]);

  // distinct, longer
  cases.push(["abcdef", "fedcba", "cabbed"]);

  // word with all 26 letters and word missing one
  cases.push(["abcdefghijklmnopqrstuvwxyz", "abcdefghijklmnopqrstuvwxy"]);

  // word with all 26 + ordinary words
  cases.push(["abcdefghijklmnopqrstuvwxyz", "aabbccddeeffgghhiijjkkllmmnnooppqqrrssttuuvvwwxxyyzz"]);

  // long mixed
  cases.push(["mississippi", "mississippi", "missing"]);

  // tricky duplicates
  cases.push(["aabbccdd", "abcdabcd", "ddccbbaa"]);

  // word with repeats vs short word
  cases.push(["zzzzz", "z"]);

  // randomized small
  while (cases.length < 28) {
    const n = 2 + (lcg() % 4);
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(randomLowerWord(lcg, 1, 8));
    cases.push(arr);
  }

  const test_cases = cases.map((words) => ({
    inputs: [JSON.stringify(words)],
    expected: JSON.stringify(commonChars(words)),
  }));

  return {
    slug: "find-common-characters",
    obj: {
      description: "Given a string array `words`, return an array of all characters that show up in **all** strings within `words` (including duplicates). You may return the answer in **any order**; this registry sorts ascending for deterministic grading.\n\nExamples:\n\n```\nInput:  words = [\"bella\", \"label\", \"roller\"]\nOutput: [\"e\", \"l\", \"l\"]\nExplanation: 'l' appears at least twice in every word; 'e' appears at least once in every word.\n\nInput:  words = [\"cool\", \"lock\", \"cook\"]\nOutput: [\"c\", \"o\"]\n```\n\n**This is LeetCode 1002.** The brute force compares every character of the first word against the rest; the optimal pattern is **elementwise minimum over 26-bucket frequency counters** — one of the cleanest examples of multiset intersection on a bounded alphabet.",
      method_name: "commonChars",
      params: [
        { name: "words", type: "List[str]" }
      ],
      return_type: "List[str]",
      tags: ["array", "hash-table", "string", "counting"],
      pattern: "**Multiset intersection over a bounded alphabet.** Every character that survives must appear in EVERY word, and the number of copies that survive is the minimum count across all words. So we don't need to compare words pairwise — we just compute a per-word 26-bucket frequency array, then fold them all into one array taking the elementwise minimum.\n\n**Algorithm in 4 steps.**\n1. Initialize `minCount[26]` to a large sentinel (`Infinity` or `INT_MAX`).\n2. For each word `w`, build `count[26]` (frequency of each letter in `w`).\n3. Update `minCount[i] = min(minCount[i], count[i])` for every letter `i`.\n4. Emit `minCount[i]` copies of letter `i` for `i = 0..25`. Sort ascending for deterministic output.\n\n**Why min, not intersection?** Treat each word as a multiset of letters. The intersection of multisets `A` and `B` is the multiset where each element `x` has count `min(A.count(x), B.count(x))`. Generalize to k multisets by taking min across all k.\n\n**Bounded alphabet matters.** Because `words[i]` is lowercase English, the alphabet has size 26 and each per-word counter is `O(26)` to build (proportional to word length, but bookkeeping is constant). For arbitrary alphabets, swap the `int[26]` for a `HashMap<Character, Integer>` and use the keys of the first word's map as the candidate set for intersection.\n\n**Brute force.** Take the first word as a character bag (`list(words[0])`). For each subsequent word, scan its characters and intersect the bag: for each `ch` in the next word, if `ch` is in the bag, remove one copy and keep it in the survivor list; else drop it. Repeat with each word. Worst-case `O(N * L * L)` where `L` is average word length and `N` is the number of words (the inner `bag.remove` is `O(L)`).\n\n**Optimal complexity.** `O(N * L + 26 * N)` = `O(N * L)` total, where `L` is the longest word. Space `O(26)` plus output.\n\n**Edge cases.** Single word: every character of the only word survives at its native count. All distinct words with no shared letters: empty result. Identical words: every letter survives at its native count. Empty input list (not strictly LC-allowed): empty result.",
      follow_up: "**Variant 1 — uncommon characters (LC 884 mood).** Return characters that appear in exactly one word's character set. Compute a per-letter `presenceCount[26]` = number of words containing that letter; emit letters with `presenceCount == 1`. Different counting trick (presence, not multiplicity).\n\n**Variant 2 — multiset intersection on arbitrary alphabet.** Replace `int[26]` with `HashMap<Character, Integer>` (or `HashMap<String, Integer>` for emoji / unicode). Same elementwise-min algorithm, slightly larger constants. Initialize `minCount` from the first word's map; for each later word, build its map and update `minCount[k] = min(minCount[k], laterMap.getOrDefault(k, 0))`. Drop entries where `minCount[k] == 0`.\n\n**Variant 3 — characters appearing in at least `k` of `n` words.** Compute per-letter `presenceCount[26]`; emit letters with `presenceCount >= k`. If you want each emitted letter to carry its full multiplicity (the min across the words that DO contain it), maintain `runningMin[26]` only over the qualifying subset.\n\n**Variant 4 — find common subsequence across all words.** No longer a multiset problem — order matters, so the multiset-min approach fails. Use multi-string LCS DP. `O(L^N)` exponential in N; usually approximated.\n\n**Variant 5 — streaming words.** Build a running `minCount[26]` and update each time a new word arrives. `O(1)` extra space, `O(L)` per word. Naturally online.\n\n**Variant 6 — case-insensitive.** Lowercase each word before counting. If output needs original-case representatives, track first-seen casing in a parallel array.\n\n**Implementation pitfalls.** (1) Forgetting to sort the output — LC accepts any order but our grader compares JSON-serialized strings. (2) Initializing `minCount` to 0 instead of `Infinity` — then the min stays 0 forever and the answer is always empty. (3) Building per-word counters as length-26 arrays but indexing by `ch` instead of `ch - 'a'` (off-by-97).",
      complexity: {
        time: "**O(N * L)** where `N` is the number of words and `L` is the average word length. Each word is scanned once to build its 26-bucket counter (`O(L)`). The elementwise min update is `O(26)` per word. The final emission step is `O(26 + total_output_chars)`. Sorting the output (when required) is `O(K log K)` where `K` is output length, but `K <= 26 * minWordLength` and is dwarfed by the main scan.",
        space: "**O(26) = O(1)** auxiliary excluding the output. Two length-26 arrays (`minCount` and the per-word `count`). Output is `O(K)` where `K` is the number of surviving characters (at most `min(|words[i]|)`).",
        notes: "The 26-bucket trick is the canonical optimization for any 'character intersection / union / difference over multiple strings' problem. Constant-factor space `O(26)` beats `HashMap<Character, Integer>` for lowercase-only inputs (no hashing, dense iteration).",
        optimal: "**O(N * L) is optimal** in the worst case — every input character must be inspected to know whether it might appear in every word. Lower bound matches: any algorithm must read all `N * L` characters in the worst case to verify the answer."
      },
      constraints: [
        "1 <= words.length <= 100",
        "1 <= words[i].length <= 100",
        "words[i] consists of lowercase English letters only",
        "Output may be returned in any order; this registry sorts ascending for deterministic grading",
        "Duplicates are part of the answer (multiset intersection, not set intersection)"
      ],
      hints: [
        "**This is multiset intersection.** Each word is a bag of letters; the answer is the bag of letters present in EVERY word, with multiplicity equal to the smallest count across words.",
        "**Use a 26-bucket counter per word.** Build `count[26]` for each word in `O(L)`. Maintain a global `minCount[26]` initialized to `Infinity`; after each word, set `minCount[i] = min(minCount[i], count[i])`.",
        "**Emit letters by their min count.** For each `i` from 0 to 25, append letter `chr(97 + i)` exactly `minCount[i]` times to the output.",
        "**Brute-force fallback.** Take `words[0]` as a list of characters. For each subsequent word, scan its characters and `bag.remove(c)` if present; collect survivors into a new bag. Slower (`O(N * L^2)` due to list-remove) but conceptually identical.",
        "**Watch out for the sentinel.** Initialize `minCount` to `Infinity` (or `INT_MAX`), not `0` — otherwise the min stays at `0` and the answer is always empty."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\nclass Solution:\n    def commonChars(self, words: List[str]) -> List[str]:\n        if not words:\n            return []\n        INF = float('inf')\n        min_count = [INF] * 26\n        for w in words:\n            count = [0] * 26\n            for ch in w:\n                count[ord(ch) - 97] += 1\n            for i in range(26):\n                if count[i] < min_count[i]:\n                    min_count[i] = count[i]\n        out = []\n        for i in range(26):\n            k = 0 if min_count[i] == INF else min_count[i]\n            for _ in range(k):\n                out.append(chr(97 + i))\n        out.sort()\n        return out\n",
        javascript: "var commonChars = function(words) {\n    if (!words || words.length === 0) return [];\n    const INF = Number.POSITIVE_INFINITY;\n    const minCount = new Array(26).fill(INF);\n    for (const w of words) {\n        const count = new Array(26).fill(0);\n        for (let i = 0; i < w.length; i++) {\n            count[w.charCodeAt(i) - 97]++;\n        }\n        for (let i = 0; i < 26; i++) {\n            if (count[i] < minCount[i]) minCount[i] = count[i];\n        }\n    }\n    const out = [];\n    for (let i = 0; i < 26; i++) {\n        const k = minCount[i] === INF ? 0 : minCount[i];\n        for (let j = 0; j < k; j++) out.push(String.fromCharCode(97 + i));\n    }\n    out.sort();\n    return out;\n};\n",
        java: "import java.util.*;\n\nclass Solution {\n    public List<String> commonChars(String[] words) {\n        List<String> out = new ArrayList<>();\n        if (words == null || words.length == 0) return out;\n        int[] minCount = new int[26];\n        Arrays.fill(minCount, Integer.MAX_VALUE);\n        for (String w : words) {\n            int[] count = new int[26];\n            for (int i = 0; i < w.length(); i++) count[w.charAt(i) - 'a']++;\n            for (int i = 0; i < 26; i++) {\n                if (count[i] < minCount[i]) minCount[i] = count[i];\n            }\n        }\n        for (int i = 0; i < 26; i++) {\n            int k = (minCount[i] == Integer.MAX_VALUE) ? 0 : minCount[i];\n            for (int j = 0; j < k; j++) out.add(String.valueOf((char)('a' + i)));\n        }\n        Collections.sort(out);\n        return out;\n    }\n}\n",
        cpp: "#include <vector>\n#include <string>\n#include <algorithm>\n#include <climits>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<string> commonChars(vector<string>& words) {\n        vector<string> out;\n        if (words.empty()) return out;\n        vector<int> minCount(26, INT_MAX);\n        for (const auto& w : words) {\n            vector<int> count(26, 0);\n            for (char c : w) count[c - 'a']++;\n            for (int i = 0; i < 26; i++) {\n                if (count[i] < minCount[i]) minCount[i] = count[i];\n            }\n        }\n        for (int i = 0; i < 26; i++) {\n            int k = (minCount[i] == INT_MAX) ? 0 : minCount[i];\n            for (int j = 0; j < k; j++) out.push_back(string(1, (char)('a' + i)));\n        }\n        sort(out.begin(), out.end());\n        return out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: counting-elements (LC 1426)
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F34FB);

  // Canonical reference: count x in arr such that x+1 is also in arr (count duplicates).
  function countElements(arr) {
    if (!arr || arr.length === 0) return 0;
    const present = new Set(arr);
    let total = 0;
    for (const x of arr) {
      if (present.has(x + 1)) total++;
    }
    return total;
  }

  const cases = [];

  // canonical LC samples
  cases.push([1, 2, 3]);
  cases.push([1, 1, 3, 3, 5, 5, 7, 7]);
  cases.push([1, 3, 2, 3, 5, 0]);
  cases.push([1, 1, 2, 2]);

  // single element: cannot have x+1 present
  cases.push([7]);
  cases.push([0]);
  cases.push([1000]);

  // two consecutive
  cases.push([1, 2]);
  cases.push([5, 6]);

  // two non-consecutive
  cases.push([1, 3]);
  cases.push([0, 1000]);

  // all duplicates of one value
  cases.push([4, 4, 4, 4, 4]);

  // duplicates with successor present multiple times
  cases.push([4, 4, 4, 5, 5]);

  // long arithmetic progression of consecutive integers
  cases.push([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // descending consecutive
  cases.push([10, 9, 8, 7, 6, 5]);

  // gap pattern: only every other present
  cases.push([0, 2, 4, 6, 8]);

  // pairs always have +1 partner
  cases.push([1, 2, 3, 4, 5, 6]);

  // big duplicates count
  cases.push([2, 2, 2, 3]);

  // chain of 3 with reps
  cases.push([1, 1, 1, 2, 3]);

  // chain broken at the end
  cases.push([1, 2, 3, 4, 6]);

  // zeros and ones
  cases.push([0, 0, 0, 1]);
  cases.push([0, 1, 1, 1, 2]);

  // largest value (constraints: arr[i] <= 1000)
  cases.push([999, 1000]);
  cases.push([1000, 1000, 1000]);

  // mixed scatter
  cases.push([100, 101, 200, 201, 300]);

  // lots of duplicates with successor
  cases.push([5, 5, 5, 5, 6]);

  // arr where no element has its successor
  cases.push([2, 4, 6, 8, 10]);

  // random small cases
  while (cases.length < 28) {
    const n = 1 + (lcg() % 12);
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(lcg() % 20);
    cases.push(arr);
  }

  const test_cases = cases.map((arr) => ({
    inputs: [JSON.stringify(arr)],
    expected: String(countElements(arr)),
  }));

  return {
    slug: "counting-elements",
    obj: {
      description: "Given an integer array `arr`, count the number of elements `x` in `arr` such that `x + 1` is also present in `arr`. If there are **duplicates** of `x` in `arr`, count each one of them.\n\nExamples:\n\n```\nInput:  arr = [1, 2, 3]\nOutput: 2\nExplanation: 1 and 2 both have their +1 successors (2, 3) present. 3 does not (4 is not in arr).\n\nInput:  arr = [1, 1, 3, 3, 5, 5, 7, 7]\nOutput: 0\nExplanation: No element has its +1 successor present in arr.\n\nInput:  arr = [1, 3, 2, 3, 5, 0]\nOutput: 3\nExplanation: 0 -> 1 present, 1 -> 2 present, 2 -> 3 present. The two copies of 3 do not have 4 present, and 5 does not have 6 present.\n```\n\n**This is LeetCode 1426.** The trick is that **each duplicate counts separately** — so you can't deduplicate before counting. The clean solution is a hash set of distinct values plus a linear pass that counts each `x` in `arr` whose successor `x + 1` is in the set.",
      method_name: "countElements",
      params: [
        { name: "arr", type: "List[int]" }
      ],
      return_type: "int",
      tags: ["array", "hash-table"],
      pattern: "**Hash-set successor lookup with duplicate-aware counting.** Build a hash set `S` of the distinct values in `arr`. Iterate through `arr` (NOT through `S`!) and for each element `x` increment the answer iff `x + 1` is in `S`. The two parts of this pattern are independent:\n- The **set** is for `O(1)` membership testing of the successor — converts the otherwise-`O(N)` 'is `x+1` in `arr`' check into `O(1)`.\n- The **loop is over `arr` (with duplicates)**, not over `S` — so a value appearing 5 times in `arr` contributes 5 to the count if its successor is present.\n\n**Why this is the trap.** A natural first attempt is `for x in set(arr): if x+1 in s: ans += 1`. That gives the wrong answer when duplicates exist: for `arr = [2, 2, 2, 3]` it returns 1 (one distinct value 2 has successor 3 present), but the correct answer is 3 (each copy of 2 counts). The fix is trivial: iterate over `arr`, not `set(arr)`.\n\n**Alternative: counter-based.** Build `count = Counter(arr)`. Sum `count[x]` over all `x` such that `x + 1 in count`. Same asymptotic complexity, slightly cleaner if you also need to expose the per-value contribution.\n\n**Brute force.** For each `x` in `arr`, scan `arr` to check if `x + 1` is present. `O(N^2)` and obviously slow. With the hash set, this drops to `O(N)`.\n\n**Edge cases.** Empty input: 0. Single element: 0 (no successor possible). All duplicates of one value: 0. Long arithmetic progression `[0, 1, ..., k]`: answer is `k` (every element except the largest has its successor).\n\n**Sort-based alternative.** Sort `arr` then two-pointer scan, counting how many elements have `x + 1` somewhere later. Works but `O(N log N)`, strictly worse than the `O(N)` hash-set approach.",
      follow_up: "**Variant 1 — count elements `x` such that `x + k` is in `arr` for some fixed `k`.** Same hash-set trick: build `S`, count elements in `arr` whose `x + k` is in `S`. Generalizes the +1 case.\n\n**Variant 2 — count pairs (x, x+1) where both are in `arr`, counted by (count[x] * count[x+1]).** Different question — counts ordered pairs of items, not single elements. Use `Counter` then sum `count[x] * count[x+1]` over all `x`.\n\n**Variant 3 — count the longest run of consecutive integers in `arr`.** LC 128 (Longest Consecutive Sequence) — different problem; uses the same 'set of distinct values' but with a 'start a chain only at run-starts' optimization. `O(N)`.\n\n**Variant 4 — count elements with both `x - 1` and `x + 1` in `arr`.** Two membership tests per element; same `O(N)` framework.\n\n**Variant 5 — streaming.** Maintain a running `S` (set) and a running counter `ans`. On each new value `v`: if `v - 1` is in `S`, increment `ans` (we just gave the predecessor a successor). If `v + 1` is in `S`, increment `ans` by `count[v]` once `v` is added. Subtle ordering; usually easier to batch.\n\n**Implementation pitfalls.** (1) Iterating over `set(arr)` and missing the duplicate-counting requirement. (2) Using `arr.contains(x + 1)` in the inner loop instead of a hash set — degrades to `O(N^2)`. (3) Off-by-one with the successor: the problem asks for `x + 1`, not `x - 1`.",
      complexity: {
        time: "**O(N)** where `N` is the length of `arr`. Building the hash set is `O(N)`. The counting loop is `O(N)` with `O(1)` set membership tests.",
        space: "**O(N)** for the hash set in the worst case (when all values are distinct). For inputs with many duplicates, the set is smaller but still `O(N)` worst case.",
        notes: "The duplicate-counting requirement is the load-bearing detail. Iterate over the array, not the set. The `Counter` alternative is equivalent — sum `count[x]` over all `x` with `x + 1` in the counter — but introduces a hash map where a set would do.",
        optimal: "**O(N) time and O(N) space is optimal.** Every input element must be read at least once to verify the answer, and the auxiliary set is necessary for `O(1)` successor lookups (without it, the inner check degrades to `O(N)`). For bounded-value inputs (e.g., `0 <= arr[i] <= 1000`), an `O(V)` boolean array can replace the hash set, but asymptotic complexity is the same."
      },
      constraints: [
        "1 <= arr.length <= 1000",
        "0 <= arr[i] <= 1000",
        "Duplicates are counted separately (each copy of x with x+1 present adds one to the total)",
        "Result is a non-negative integer in the range [0, arr.length]",
        "Empty input (defensive) returns 0"
      ],
      hints: [
        "**Use a hash set of the distinct values** for `O(1)` 'is x+1 in arr?' lookups. Building the set is `O(N)`.",
        "**Iterate over `arr` (with duplicates), not over the set.** A value appearing 5 times must contribute 5 to the count if its successor is present.",
        "**The brute force** is `O(N^2)`: for each x in arr, scan arr again for x+1. Use that as a sanity check before optimizing.",
        "**Counter alternative.** Build `Counter(arr)` and sum `count[x]` over all keys `x` with `x + 1 in count`. Same `O(N)`, slightly different style.",
        "**Off-by-one watch.** The problem asks for `x + 1`, not `x - 1`. And duplicates of x each count separately if x+1 is present."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\nclass Solution:\n    def countElements(self, arr: List[int]) -> int:\n        if not arr:\n            return 0\n        present = set(arr)\n        total = 0\n        for x in arr:\n            if (x + 1) in present:\n                total += 1\n        return total\n",
        javascript: "var countElements = function(arr) {\n    if (!arr || arr.length === 0) return 0;\n    const present = new Set(arr);\n    let total = 0;\n    for (const x of arr) {\n        if (present.has(x + 1)) total++;\n    }\n    return total;\n};\n",
        java: "import java.util.HashSet;\nimport java.util.Set;\n\nclass Solution {\n    public int countElements(int[] arr) {\n        if (arr == null || arr.length == 0) return 0;\n        Set<Integer> present = new HashSet<>();\n        for (int x : arr) present.add(x);\n        int total = 0;\n        for (int x : arr) {\n            if (present.contains(x + 1)) total++;\n        }\n        return total;\n    }\n}\n",
        cpp: "#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countElements(vector<int>& arr) {\n        if (arr.empty()) return 0;\n        unordered_set<int> present(arr.begin(), arr.end());\n        int total = 0;\n        for (int x : arr) {\n            if (present.count(x + 1)) total++;\n        }\n        return total;\n    }\n};\n"
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
    "// ===== WAVE 34P START =====",
    "// === WAVE 34P " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34P " + p1.slug + " END ===",
    "// === WAVE 34P " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34P " + p2.slug + " END ===",
    "// ===== WAVE 34P END =====",
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
if (src.indexOf("WAVE 34P START") !== -1) {
  console.error("WAVE 34P already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34O END marker and append block after it.
const ANCHOR = "// ===== WAVE 34O END =====";
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

console.log("DONE wave34p " + p1.slug + " + " + p2.slug);
process.exit(0);
