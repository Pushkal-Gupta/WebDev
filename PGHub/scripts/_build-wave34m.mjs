#!/usr/bin/env node
// Build WAVE 34M: substring-with-concatenation-of-all-words + number-of-substrings-containing-all-three-characters
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
// PROBLEM 1: substring-with-concatenation-of-all-words (LC 30)
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F34CA);

  // canonical reference solution
  function findSubstring(s, words) {
    const out = [];
    if (!s || !words || words.length === 0) return out;
    const wlen = words[0].length;
    const count = words.length;
    if (wlen === 0 || s.length < wlen * count) return out;
    const need = new Map();
    for (const w of words) need.set(w, (need.get(w) || 0) + 1);
    for (let off = 0; off < wlen; off++) {
      let left = off;
      let matched = 0;
      const have = new Map();
      for (let right = off; right + wlen <= s.length; right += wlen) {
        const w = s.slice(right, right + wlen);
        if (!need.has(w)) {
          have.clear();
          matched = 0;
          left = right + wlen;
          continue;
        }
        have.set(w, (have.get(w) || 0) + 1);
        matched++;
        while (have.get(w) > need.get(w)) {
          const lw = s.slice(left, left + wlen);
          have.set(lw, have.get(lw) - 1);
          matched--;
          left += wlen;
        }
        if (matched === count) {
          out.push(left);
          const lw = s.slice(left, left + wlen);
          have.set(lw, have.get(lw) - 1);
          matched--;
          left += wlen;
        }
      }
    }
    out.sort((a, b) => a - b);
    return out;
  }

  // test case generator
  const pool = "abcdefghijklmnopqrstuvwxyz";
  function randStr(n) {
    let r = "";
    for (let i = 0; i < n; i++) r += pool[lcg() % 26];
    return r;
  }

  const cases = [];

  // canonical LC samples
  cases.push({ s: "barfoothefoobarman", words: ["foo", "bar"] });
  cases.push({ s: "wordgoodgoodgoodbestword", words: ["word", "good", "best", "word"] });
  cases.push({ s: "barfoofoobarthefoobarman", words: ["bar", "foo", "the"] });

  // edge: single word
  cases.push({ s: "a", words: ["a"] });
  cases.push({ s: "ab", words: ["ab"] });
  cases.push({ s: "abc", words: ["abc"] });

  // edge: words longer than s
  cases.push({ s: "ab", words: ["abc"] });

  // edge: no match
  cases.push({ s: "abcdefg", words: ["xy", "yz"] });

  // edge: overlapping match positions
  cases.push({ s: "aaaaaa", words: ["aa", "aa"] });
  cases.push({ s: "ababababab", words: ["ab", "ba"] });

  // edge: repeated words in dictionary
  cases.push({ s: "wordgoodgoodgoodbestword", words: ["word", "good", "best", "good"] });

  // edge: all same letter
  cases.push({ s: "aaaaaaaa", words: ["a", "a", "a"] });

  // edge: short string just fits
  cases.push({ s: "foobar", words: ["foo", "bar"] });

  // edge: long string, many candidates
  cases.push({ s: "lingmindraboofooowingdingbarrwingmonkeypoundcake", words: ["fooo", "barr", "wing", "ding", "wing"] });

  // edge: empty words list disallowed by constraint but test single nonsense
  cases.push({ s: "aaaa", words: ["aa", "aa"] });

  // random fuzz seeded
  while (cases.length < 28) {
    const wlen = 1 + (lcg() % 3); // word length 1..3
    const count = 1 + (lcg() % 3); // 1..3 words
    const words = [];
    for (let i = 0; i < count; i++) words.push(randStr(wlen));
    const slen = wlen * count + (lcg() % 8);
    let s = randStr(slen);
    // sometimes embed a true concatenation
    if ((lcg() % 2) === 0 && s.length >= wlen * count) {
      const order = words.slice().sort(() => 0);
      const join = order.join("");
      const insertAt = lcg() % (s.length - wlen * count + 1);
      s = s.slice(0, insertAt) + join + s.slice(insertAt + join.length);
    }
    cases.push({ s, words });
  }

  const test_cases = cases.map((c) => {
    const out = findSubstring(c.s, c.words);
    return {
      inputs: [JSON.stringify(c.s), JSON.stringify(c.words)],
      expected: JSON.stringify(out)
    };
  });

  return {
    slug: "substring-with-concatenation-of-all-words",
    obj: {
      description: "Given a string `s` and an array of strings `words` where **every word has the same length**, return all starting indices of substrings in `s` that are a **concatenation of every word in `words` exactly once** in any order.\n\nExamples:\n\n```\nInput:  s = \"barfoothefoobarman\", words = [\"foo\", \"bar\"]\nOutput: [0, 9]\nExplanation: \"barfoo\" starts at 0 and \"foobar\" starts at 9.\n\nInput:  s = \"wordgoodgoodgoodbestword\", words = [\"word\", \"good\", \"best\", \"word\"]\nOutput: []\nExplanation: the dictionary has two \"word\"s but the string only contains one.\n\nInput:  s = \"barfoofoobarthefoobarman\", words = [\"bar\", \"foo\", \"the\"]\nOutput: [6, 9, 12]\n```\n\n**This is LeetCode 30.** The fact that every word in the dictionary has the **same length `L`** is the lever — `s[i..i+L)` is either a word in the dictionary or it isn't, so the search collapses to a fixed-step sliding window over indices `i, i+L, i+2L, ...` starting from each offset in `[0, L)`.",
      method_name: "findSubstring",
      params: [
        { name: "s", type: "string" },
        { name: "words", type: "string[]" }
      ],
      return_type: "int[]",
      tags: ["string", "sliding-window", "hash-map"],
      pattern: "**Why the equal-length constraint matters.** Every word has length `L`, so any concatenation of `K = words.length` words occupies exactly `K*L` characters of `s`. At any candidate start index `i`, we just need to check whether `s[i..i+K*L)` decomposes into exactly the multiset of `words`.\n\n**Brute force.** For each starting index `i` in `[0, n - K*L]`, slice `s[i..i+K*L)` into `K` chunks of length `L`, build a frequency map, and compare to the target frequency map. Total work: `O(n * K * L)` time with a hash-map per index. Acceptable for small inputs; the next idea is strictly better.\n\n**Sliding window with bucket alignment.** Because words are length `L`, only `L` different starting offsets are interesting modulo `L`. Run `L` sliding windows in parallel — one for each starting offset `off in [0, L)`. Within each offset, walk in steps of `L` and maintain:\n- a frequency map `have` of words currently in the window,\n- the count `matched` of words inserted so far,\n- a `left` pointer in the same offset stride.\n\n**Window operations.**\n1. Read the next word `w = s[right..right+L)`.\n2. If `w` is not in `need`, the window can't extend through it. Reset `have`, `matched`, and advance `left = right + L`.\n3. Otherwise insert `w` into `have` and increment `matched`. If `have[w] > need[w]`, slide `left` forward by `L` (decrementing `have` and `matched`) until the overcount is gone.\n4. When `matched == K`, record `left` as a valid start, then advance `left` by `L` once to look for the next match without overlap on the same offset.\n\n**Correctness sketch.** Within a single offset, every word boundary in `s` aligns to a multiple of `L` from `off`. So the chunks the window sees are the exact same chunks the brute-force decomposition would see — but the sliding-window amortization makes each chunk an `O(1)` operation in expectation.\n\n**Why we run `L` independent windows.** A concatenation can start at any of the first `L` indices modulo `L`, so the alignment differs. By looping `off = 0..L-1`, we cover every possible starting offset.\n\n**Why the answers need sorting.** Different offsets discover matches in different orders, so we collect into a list and sort ascending at the end.\n\n**Failure mode of a naive Manacher-style trick.** Don't try to merge offsets into a single linear scan — the alignment shifts make the bookkeeping tangled and error-prone.\n\n**A note on duplicates.** If `words` contains duplicates, `need` is a multiset, not a set. The `have[w] > need[w]` shrink rule is what enforces multiset equality.",
      follow_up: "**Variant 1 — words of differing lengths.** The equal-length trick collapses. The general substring-cover problem becomes much harder; one approach is Aho-Corasick + DP over occurrence positions.\n\n**Variant 2 — find one match (any).** Same algorithm; return on the first `matched == K`. Slight speedup.\n\n**Variant 3 — count distinct concatenations.** Instead of indices, count how many positions form a valid concatenation. Trivial extension — return `result.length`.\n\n**Variant 4 — overlapping concatenations.** If matches at indices `i` and `i+1` are both valid (impossible when `L >= 1` actually, since chunks align), report all. The algorithm already finds all matches; just don't skip past one after recording it.\n\n**Variant 5 — streaming `s`.** When `s` is a stream, you can't go back. Maintain `L` independent sliding windows, each progressing in steps of `L`. Each window holds at most `K` words of state, so memory is `O(K*L)`.\n\n**Variant 6 — case-insensitive matching.** Lowercase both `s` and every word once before starting. Doesn't change the algorithm.\n\n**Variant 7 — concatenation in a fixed order.** Stronger constraint — words must appear in the order given. Reduces to KMP over the joined pattern `words.join('')` — single linear scan, no hashing.\n\n**Variant 8 — multiple dictionaries.** Given many `(s, words)` queries, preprocess `s` into rolling hashes per offset. Each query becomes `O(K)` with a multiset comparison.",
      complexity: {
        time: "**O(L * n)** amortized, where `L` is the length of each word and `n = |s|`. The outer loop runs `L` times (one per offset); each inner loop walks `n / L` words, and each word is inserted/removed `O(1)` times amortized. Total: `O(L * (n/L)) = O(n)` per offset, `O(L * n)` overall. In practice this dominates the `O(K * L)` reset cost when a non-dictionary word forces a wipe.",
        space: "**O(K * L)** for the two hash maps `need` and `have`, where `K = words.length`. The output list is `O(answer.length)` separately. The sort at the end is `O(R log R)` where `R` is the number of matches — usually negligible.",
        notes: "The naive `O(n * K * L)` brute force is fine when `K * L` is tiny (e.g. `K=2, L=3`), but the sliding-window version scales much better when `K` is into the hundreds. The `L`-offset loop is the part people forget on a whiteboard — without it the algorithm only finds matches starting at multiples of `L`.",
        optimal: "**Sliding-window with offset sharding is optimal** for the general case. Reading `s` is already `O(n)`; the constant factor is small (one hash lookup per word boundary). Suffix-automaton-based approaches exist but are more complex and not faster in expectation."
      },
      constraints: [
        "`1 <= s.length <= 10^4`",
        "`1 <= words.length <= 5000`",
        "`1 <= words[i].length <= 30`",
        "All `words[i]` have the **same length**",
        "`s` and `words[i]` consist of **lowercase English letters only**"
      ],
      hints: [
        "**Every word has the same length `L`.** That means at any candidate start index `i`, the next `K = words.length` chunks of length `L` either decompose into the multiset `words` or they don't.",
        "**There are only `L` interesting starting offsets modulo `L`.** Loop `off = 0..L-1` and run an independent sliding window for each offset, walking in steps of `L`.",
        "**Maintain a frequency map `have` and a `matched` counter.** Insert the next word; if it overshoots its allowed count, slide the left edge forward in steps of `L` until the overcount is gone.",
        "**Reset on a non-dictionary word.** If `w` isn't in `need`, the window can't extend through it. Clear `have`, set `matched = 0`, and advance `left = right + L`.",
        "**On `matched == K`, record `left` and advance `left += L` once** to look for the next non-overlapping match within the same offset."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\nfrom collections import Counter\n\nclass Solution:\n    def findSubstring(self, s: str, words: List[str]) -> List[int]:\n        out = []\n        if not s or not words:\n            return out\n        L = len(words[0])\n        K = len(words)\n        if L == 0 or len(s) < L * K:\n            return out\n        need = Counter(words)\n        for off in range(L):\n            left = off\n            matched = 0\n            have = Counter()\n            right = off\n            while right + L <= len(s):\n                w = s[right:right + L]\n                if w not in need:\n                    have.clear()\n                    matched = 0\n                    left = right + L\n                else:\n                    have[w] += 1\n                    matched += 1\n                    while have[w] > need[w]:\n                        lw = s[left:left + L]\n                        have[lw] -= 1\n                        matched -= 1\n                        left += L\n                    if matched == K:\n                        out.append(left)\n                        lw = s[left:left + L]\n                        have[lw] -= 1\n                        matched -= 1\n                        left += L\n                right += L\n        out.sort()\n        return out\n",
        javascript: "var findSubstring = function(s, words) {\n    const out = [];\n    if (!s || !words || words.length === 0) return out;\n    const L = words[0].length;\n    const K = words.length;\n    if (L === 0 || s.length < L * K) return out;\n    const need = new Map();\n    for (const w of words) need.set(w, (need.get(w) || 0) + 1);\n    for (let off = 0; off < L; off++) {\n        let left = off;\n        let matched = 0;\n        const have = new Map();\n        let right = off;\n        while (right + L <= s.length) {\n            const w = s.substring(right, right + L);\n            if (!need.has(w)) {\n                have.clear();\n                matched = 0;\n                left = right + L;\n            } else {\n                have.set(w, (have.get(w) || 0) + 1);\n                matched++;\n                while (have.get(w) > need.get(w)) {\n                    const lw = s.substring(left, left + L);\n                    have.set(lw, have.get(lw) - 1);\n                    matched--;\n                    left += L;\n                }\n                if (matched === K) {\n                    out.push(left);\n                    const lw = s.substring(left, left + L);\n                    have.set(lw, have.get(lw) - 1);\n                    matched--;\n                    left += L;\n                }\n            }\n            right += L;\n        }\n    }\n    out.sort((a, b) => a - b);\n    return out;\n};\n",
        java: "import java.util.*;\n\nclass Solution {\n    public List<Integer> findSubstring(String s, String[] words) {\n        List<Integer> out = new ArrayList<>();\n        if (s == null || words == null || words.length == 0) return out;\n        int L = words[0].length();\n        int K = words.length;\n        if (L == 0 || s.length() < L * K) return out;\n        Map<String, Integer> need = new HashMap<>();\n        for (String w : words) need.merge(w, 1, Integer::sum);\n        for (int off = 0; off < L; off++) {\n            int left = off;\n            int matched = 0;\n            Map<String, Integer> have = new HashMap<>();\n            int right = off;\n            while (right + L <= s.length()) {\n                String w = s.substring(right, right + L);\n                if (!need.containsKey(w)) {\n                    have.clear();\n                    matched = 0;\n                    left = right + L;\n                } else {\n                    have.merge(w, 1, Integer::sum);\n                    matched++;\n                    while (have.get(w) > need.get(w)) {\n                        String lw = s.substring(left, left + L);\n                        have.merge(lw, -1, Integer::sum);\n                        matched--;\n                        left += L;\n                    }\n                    if (matched == K) {\n                        out.add(left);\n                        String lw = s.substring(left, left + L);\n                        have.merge(lw, -1, Integer::sum);\n                        matched--;\n                        left += L;\n                    }\n                }\n                right += L;\n            }\n        }\n        Collections.sort(out);\n        return out;\n    }\n}\n",
        cpp: "#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> findSubstring(string s, vector<string>& words) {\n        vector<int> out;\n        if (s.empty() || words.empty()) return out;\n        int L = (int) words[0].size();\n        int K = (int) words.size();\n        if (L == 0 || (int) s.size() < L * K) return out;\n        unordered_map<string, int> need;\n        for (const auto& w : words) need[w]++;\n        for (int off = 0; off < L; off++) {\n            int left = off;\n            int matched = 0;\n            unordered_map<string, int> have;\n            int right = off;\n            while (right + L <= (int) s.size()) {\n                string w = s.substr(right, L);\n                auto it = need.find(w);\n                if (it == need.end()) {\n                    have.clear();\n                    matched = 0;\n                    left = right + L;\n                } else {\n                    have[w]++;\n                    matched++;\n                    while (have[w] > it->second) {\n                        string lw = s.substr(left, L);\n                        have[lw]--;\n                        matched--;\n                        left += L;\n                    }\n                    if (matched == K) {\n                        out.push_back(left);\n                        string lw = s.substr(left, L);\n                        have[lw]--;\n                        matched--;\n                        left += L;\n                    }\n                }\n                right += L;\n            }\n        }\n        sort(out.begin(), out.end());\n        return out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: number-of-substrings-containing-all-three-characters (LC 1358)
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F34CB);

  function numberOfSubstrings(s) {
    const cnt = [0, 0, 0];
    let left = 0;
    let ans = 0;
    for (let right = 0; right < s.length; right++) {
      cnt[s.charCodeAt(right) - 97]++;
      while (cnt[0] > 0 && cnt[1] > 0 && cnt[2] > 0) {
        cnt[s.charCodeAt(left) - 97]--;
        left++;
      }
      ans += left;
    }
    return ans;
  }

  const cases = [];

  // LC samples
  cases.push("abcabc");
  cases.push("aaacb");
  cases.push("abc");

  // edges: no answer (missing a letter)
  cases.push("a");
  cases.push("b");
  cases.push("c");
  cases.push("aaaa");
  cases.push("bbbb");
  cases.push("cccc");
  cases.push("ab");
  cases.push("ac");
  cases.push("bc");
  cases.push("aabb");

  // edge: minimum length valid
  cases.push("cba");
  cases.push("bca");
  cases.push("acb");

  // longer patterns
  cases.push("aaabbbccc");
  cases.push("abcabcabc");
  cases.push("cabacba");
  cases.push("babacabbc");
  cases.push("ccccabaab");

  // all three exactly once interleaved
  cases.push("aabbcc");
  cases.push("ccbbaa");

  // longer random
  function randAbc(n) {
    let r = "";
    for (let i = 0; i < n; i++) {
      r += "abc"[lcg() % 3];
    }
    return r;
  }
  while (cases.length < 30) {
    const n = 3 + (lcg() % 12);
    cases.push(randAbc(n));
  }

  const test_cases = cases.map((s) => ({
    inputs: [JSON.stringify(s)],
    expected: String(numberOfSubstrings(s))
  }));

  return {
    slug: "number-of-substrings-containing-all-three-characters",
    obj: {
      description: "Given a string `s` consisting only of the characters `a`, `b`, and `c`, return the **number of substrings containing at least one occurrence of all three** characters `a`, `b`, and `c`.\n\nExamples:\n\n```\nInput:  s = \"abcabc\"\nOutput: 10\nExplanation: the substrings containing at least one of each are\n             \"abc\", \"abca\", \"abcab\", \"abcabc\", \"bca\", \"bcab\",\n             \"bcabc\", \"cab\", \"cabc\", and \"abc\" (the trailing one).\n\nInput:  s = \"aaacb\"\nOutput: 3\nExplanation: the valid substrings are \"aaacb\", \"aacb\", and \"acb\".\n\nInput:  s = \"abc\"\nOutput: 1\n```\n\n**This is LeetCode 1358.** Brute force enumerates every substring in `O(n^2)` and checks each in `O(n)` — `O(n^3)` total — easily TLE at `n <= 5*10^4`. The clean fix is a **sliding window** with the invariant 'window is the smallest valid suffix ending at `right`'.",
      method_name: "numberOfSubstrings",
      params: [
        { name: "s", type: "string" }
      ],
      return_type: "int",
      tags: ["string", "sliding-window", "hash-map", "two-pointers"],
      pattern: "**Restate the count.** A substring is valid iff it contains at least one `a`, one `b`, and one `c`. We want to count valid substrings — equivalently, for every right endpoint `r`, count the number of left endpoints `l <= r` such that `s[l..r]` is valid, and sum over `r`.\n\n**Key observation.** Fix `r`. There is a unique smallest left endpoint `L*(r)` such that `s[L*(r)..r]` is valid (i.e. contains all three characters). Every `l <= L*(r) - 1` extends a valid window to the left, so it is ALSO valid. Therefore the number of valid substrings ending at `r` is exactly `L*(r)` (i.e. all `l` in `[0, L*(r) - 1]`). Equivalently, the count of `l` values that produce a valid window with right endpoint `r` is `L*(r)`.\n\n**Sliding window structure.** Maintain `left` such that `s[left..right]` is the SMALLEST suffix ending at `right` that contains all three characters (or `left > right` if no such suffix exists yet). As `right` advances by one:\n- Add `s[right]` to the count map.\n- While the window is valid (`cnt[a] > 0 && cnt[b] > 0 && cnt[c] > 0`), pop `s[left]` and advance `left`. This moves `left` to the FIRST position where dropping `s[left]` would break validity.\n- The number of valid `l` is now exactly `left` (every `l` in `[0, left - 1]` keeps the window valid; `l = left` itself does not since we just broke the invariant).\n- Add `left` to the running answer.\n\n**Brute force.** O(n^3). Enumerate all `(l, r)` pairs and check whether `s[l..r]` contains all three. Easy to write but TLE.\n\n**Slightly better brute force.** O(n^2). Fix `l`, expand `r` until the window first becomes valid, then add `n - r` (every extension of that window remains valid). Acceptable for `n <= 5000`.\n\n**Why the O(n) two-pointer works.** As `right` increases by one, `left` only moves forward (monotone) — adding a character can only make the window more valid, not less. The total `left` movement across the entire run is at most `n`, so both pointers do `O(n)` work combined.\n\n**Symmetric formulation.** Some solutions track `last[c]` = the last index at which character `c` appeared, then for each `r`, valid substrings ending at `r` count = `min(last[a], last[b], last[c]) + 1`. This is the SAME number `L*(r)` reinterpreted — `L*(r) = min(last[a], last[b], last[c])`. Either formulation is correct.\n\n**Why the answer can be up to ~10^10.** `n * (n + 1) / 2` upper-bounds the count; at `n = 5*10^4` that's `~1.25 * 10^9`. Fits in a 32-bit signed int but pick `long` in Java/C++ for safety.",
      follow_up: "**Variant 1 — count substrings missing at least one character.** Total substrings = `n*(n+1)/2`. Subtract the LC-1358 answer to get the missing-at-least-one count. Trivial extension.\n\n**Variant 2 — alphabet of size `K` (not just 3).** Same algorithm — replace the three-letter check with a `distinct == K` counter. Maintain `distinct` as the number of characters with non-zero count. Total time still `O(n)`.\n\n**Variant 3 — exactly K distinct characters.** Slightly harder. Use the trick 'at most K distinct' minus 'at most K-1 distinct'. Each sub-call is a separate sliding window. LC 992-style.\n\n**Variant 4 — at least `t` occurrences of each character.** Replace the per-character `cnt[c] > 0` check with `cnt[c] >= t`. The monotonicity argument still holds. Adapt accordingly.\n\n**Variant 5 — count substrings containing all characters of an arbitrary target string.** Build a frequency target from the target string, maintain the `matched` count in the window, and apply the same monotone-`left` argument. LC 76 'Minimum Window Substring' is closely related; this is the counting version.\n\n**Variant 6 — return ONE valid substring (any).** First time the window becomes valid, return `s[left-1..right]`. O(n) and stops early.\n\n**Variant 7 — return the SHORTEST valid substring.** Track the minimum-length valid window across the run. LC 76 directly.\n\n**Variant 8 — substrings of fixed length `k` containing all three.** Fixed-window O(n) — slide a length-`k` window, maintain counts, count windows that are valid.",
      complexity: {
        time: "**O(n)**, where `n = |s|`. The `right` pointer scans `s` once; the `left` pointer is monotone — across the entire run it advances at most `n` times. The per-step work inside both loops is `O(1)` (three counter increments / decrements). Total: linear.",
        space: "**O(1)** — only a 3-slot counter array (one per character `a`, `b`, `c`), three integer pointers, and the running answer. No auxiliary data structures grow with `n`.",
        notes: "When the window first becomes valid, the while-loop will pop the character at `left` and advance. This is correct: we're identifying the smallest valid suffix, then counting every left endpoint that keeps the window valid. The trap people fall into is breaking out of the while loop too early or counting `right - left + 1` instead of `left` — both are wrong.",
        optimal: "**O(n) is optimal** since every character of `s` must be inspected at least once to know whether all three characters appear. The constants are tiny: one array access and one comparison per step."
      },
      constraints: [
        "`3 <= s.length <= 5 * 10^4`",
        "`s` consists only of the characters `'a'`, `'b'`, and `'c'`",
        "Substrings are considered by index range (so `s[i..j]` is counted by its position, not by string value)",
        "Empty substrings are NOT counted",
        "A substring is valid iff it contains at least one of each of the three characters"
      ],
      hints: [
        "**Fix the right endpoint `r`.** For each `r`, count how many left endpoints `l` produce a substring `s[l..r]` containing all three characters. Sum over `r`.",
        "**Sliding-window invariant.** Maintain `left` such that `s[left..right]` is the smallest suffix ending at `right` that contains all three. As `right` advances, shrink from the left while the window remains valid.",
        "**Count = `left`.** Once you can no longer shrink, every `l` in `[0, left - 1]` extends a valid suffix to the left, so it stays valid. There are exactly `left` such choices.",
        "**The `left` pointer is monotone.** It never decreases as `right` increases — adding a character only adds count, never removes any. This is what makes the algorithm O(n) overall.",
        "**Alternative formulation.** Track the most recent index `last[a]`, `last[b]`, `last[c]`. The count of valid substrings ending at `r` is `min(last[a], last[b], last[c]) + 1` (treating any character not yet seen as `-1`, in which case the contribution is `0`)."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def numberOfSubstrings(self, s: str) -> int:\n        cnt = [0, 0, 0]\n        left = 0\n        ans = 0\n        for right in range(len(s)):\n            cnt[ord(s[right]) - 97] += 1\n            while cnt[0] > 0 and cnt[1] > 0 and cnt[2] > 0:\n                cnt[ord(s[left]) - 97] -= 1\n                left += 1\n            ans += left\n        return ans\n",
        javascript: "var numberOfSubstrings = function(s) {\n    const cnt = [0, 0, 0];\n    let left = 0;\n    let ans = 0;\n    for (let right = 0; right < s.length; right++) {\n        cnt[s.charCodeAt(right) - 97]++;\n        while (cnt[0] > 0 && cnt[1] > 0 && cnt[2] > 0) {\n            cnt[s.charCodeAt(left) - 97]--;\n            left++;\n        }\n        ans += left;\n    }\n    return ans;\n};\n",
        java: "class Solution {\n    public int numberOfSubstrings(String s) {\n        int[] cnt = new int[3];\n        int left = 0;\n        long ans = 0;\n        for (int right = 0; right < s.length(); right++) {\n            cnt[s.charAt(right) - 'a']++;\n            while (cnt[0] > 0 && cnt[1] > 0 && cnt[2] > 0) {\n                cnt[s.charAt(left) - 'a']--;\n                left++;\n            }\n            ans += left;\n        }\n        return (int) ans;\n    }\n}\n",
        cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numberOfSubstrings(string s) {\n        int cnt[3] = {0, 0, 0};\n        int left = 0;\n        long long ans = 0;\n        for (int right = 0; right < (int) s.size(); right++) {\n            cnt[s[right] - 'a']++;\n            while (cnt[0] > 0 && cnt[1] > 0 && cnt[2] > 0) {\n                cnt[s[left] - 'a']--;\n                left++;\n            }\n            ans += left;\n        }\n        return (int) ans;\n    }\n};\n"
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
    "// ===== WAVE 34M START =====",
    "// === WAVE 34M " + p1.slug + " START ===",
    "RICH_CONTENT[" + JSON.stringify(p1.slug) + "] = " + j1 + ";",
    "// === WAVE 34M " + p1.slug + " END ===",
    "// === WAVE 34M " + p2.slug + " START ===",
    "RICH_CONTENT[" + JSON.stringify(p2.slug) + "] = " + j2 + ";",
    "// === WAVE 34M " + p2.slug + " END ===",
    "// ===== WAVE 34M END =====",
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
if (src.indexOf("WAVE 34M START") !== -1) {
  console.error("WAVE 34M already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34L END marker and append block after it.
const ANCHOR = "// ===== WAVE 34L END =====";
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

console.log("DONE wave34m " + p1.slug + " + " + p2.slug);
process.exit(0);
