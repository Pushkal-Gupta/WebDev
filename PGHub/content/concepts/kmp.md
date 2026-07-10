---
slug: kmp
module: strings-matching
title: KMP — Knuth-Morris-Pratt
subtitle: Find a pattern inside a text in O(n + m) by precomputing where to jump after a mismatch.
difficulty: Advanced
position: 20
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Strings chapter"
    url: "https://algs4.cs.princeton.edu/50strings/"
    type: book
  - title: "cp-algorithms — String processing"
    url: "https://cp-algorithms.com/string/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — strings/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/strings"
    type: repo
status: published
---

## intro
Find every occurrence of a pattern `P` of length `m` inside a text `T` of length `n`. The naive scan retries from `T[i+1]` after a partial-then-failed match, throwing away all the comparisons it just did. KMP keeps that information: a failure function tells you exactly where in `P` to resume so no character of `T` is ever re-examined.

## whyItMatters
KMP is the canonical "make string matching linear" algorithm — `O(n + m)` instead of `O(n·m)` worst case. It's the textbook setup for understanding the **failure function** (a.k.a. `pi` array, longest proper prefix that is also a suffix), which then unlocks Aho-Corasick (multi-pattern), Z-algorithm, suffix automata, and several DP-on-strings tricks. Beyond interviews, it powers grep, parsers, and intrusion-detection scanners.

## intuition
You're scanning the text and you've matched `abab` of pattern `ababc`. Then `T` gives a `d` — mismatch. The naive approach would slide `P` one step right and recompare from scratch. But you already know what you've matched! The last `ab` of your match equals the first `ab` of the pattern — so you can resume at index 2 of `P` without rescanning that suffix of `T`. The failure function tells you, for every prefix, the longest proper prefix that's also a suffix — and that's exactly the "safe jump-back" length.

Physically, imagine the pattern printed on a transparent ruler laid over the text. On a mismatch the naive method nudges the ruler right by one and rechecks every overlapping character. KMP instead slides the ruler as far right as it can while still keeping the already-matched portion aligned — and the failure function precomputes exactly that slide distance so no text character is ever revisited. The text pointer only ever marches forward; only the pattern pointer rewinds, and even that rewinding is bounded.

Concrete micro-example with real characters. Matching P = `ababc` against T = `ababd...`: after four steps you have matched `abab`, so the pattern pointer k = 4 and the text pointer sits on `d`. Since P[4] = `c` does not equal `d`, you consult pi[3] = 2 (because the prefix `abab` has longest proper prefix-suffix `ab`, length 2). You set k = 2 — meaning "the first two characters `ab` are already re-aligned under the `ab` sitting just before `d`" — and compare P[2] = `a` against the same `d`. Still no match, so pi[1] = 0 drops k to 0, and you finally advance the text pointer past `d`. What's actually happening before any formula appears: the failure value is a memory of self-overlap in the pattern, and reusing it converts the quadratic re-scan into a single forward sweep.

## visualization
```
P =  a  b  a  b  c
i =  0  1  2  3  4
pi=  0  0  1  2  0
                ^
                pi[3]=2 means "abab" has prefix "ab" == suffix "ab"
```

Phase 1 build trace for P = "ababc" (k = current border length):

```
 i | P[i] | k before | compare        | action           | pi[i]
---+------+----------+----------------+------------------+------
 1 |  b   |    0     | P[0]a != b     | k stays 0        |  0
 2 |  a   |    0     | P[0]a == a     | k -> 1           |  1
 3 |  b   |    1     | P[1]b == b     | k -> 2           |  2
 4 |  c   |    2     | P[2]a != c     | k=pi[1]=0        |
   |      |    0     | P[0]a != c     | k stays 0        |  0
```

Phase 2 matching trace, P = "ababc" over T = "abababc" (m = 5):

```
 i | T[i] | k in | compare                | k out | note
---+------+------+------------------------+-------+---------------------
 0 |  a   |  0   | P[0]a == a             |   1   |
 1 |  b   |  1   | P[1]b == b             |   2   |
 2 |  a   |  2   | P[2]a == a             |   3   |
 3 |  b   |  3   | P[3]b == b             |   4   |
 4 |  a   |  4   | P[4]c != a; k=pi[3]=2  |   3   | fall back, then a==a
 5 |  b   |  3   | P[3]b == b             |   4   |
 6 |  c   |  4   | P[4]c == c             |   5   | k==m: MATCH at i-m+1=2
```

## bruteForce
For every starting index `i` in `T`, compare `T[i..i+m]` to `P` character by character; on mismatch advance `i` by 1 and restart. Worst case `O(n·m)` — e.g. `T = "aaaaaa..."` and `P = "aaaab"`.

## optimal
Two phases. The whole algorithm rests on one invariant: at every moment `k` equals the length of the longest suffix of the text scanned so far that is also a prefix of `P`. Everything below is machinery to maintain that invariant in amortized linear time.

**Phase 1 — build the failure function `pi` for `P` (O(m))**

`pi[i]` = length of the longest proper prefix of `P[0..i]` that is also a suffix.

```
k = 0
for i from 1 to m-1:
    while k > 0 and P[k] != P[i]: k = pi[k-1]
    if P[k] == P[i]: k += 1
    pi[i] = k
```

**Phase 2 — match `P` against `T` using `pi` (O(n))**

```
k = 0
for i from 0 to n-1:
    while k > 0 and P[k] != T[i]: k = pi[k-1]
    if P[k] == T[i]: k += 1
    if k == m:
        emit match at i - m + 1
        k = pi[k-1]      # continue searching for overlapping matches
```

Each character of `T` is compared at most twice (once advancing `k`, once "consumed"), so the matching phase is amortized linear.

Why the build is correct: computing `pi[i]` is itself a pattern-matching problem — matching `P` against `P` shifted by one — so it reuses the very same jump-back logic. When `P[i]` extends the current border, `pi[i] = k + 1`; when it breaks, we fall back to the next-shorter border `pi[k-1]` and retry, exactly as the matching phase falls back on a text mismatch. The key invariant during the build is that `k` always holds the length of the longest border of the prefix ending at the previous index, so each `pi[i]` is exact.

Why the matching phase never rescans text: the outer loop advances `i` by one every iteration and never decrements it, so each text character is read once going forward. The inner `while` only ever shrinks `k` via `k = pi[k-1]`, and since `k` rose by at most one per outer step (`if P[k]==T[i]: k += 1`), the total number of shrink operations across the whole scan is bounded by the total number of increments — at most `n`. That amortization is the crux: even though a single character can trigger several fall-backs, the summed cost of all fall-backs is linear, giving O(n) for matching and O(m) for the build. Step by step, matching maintains `k` as the live match length, emits an occurrence the instant `k == m`, then jumps to `pi[m-1]` so overlapping matches are not missed.

## complexity
- **Time**: O(n + m) — both phases are linear amortized.
- **Space**: O(m) for the failure function.
- **No extra alphabet space** — works on any comparable symbols.

## pitfalls
- **Off-by-one in the while loop**: `k = pi[k-1]`, not `pi[k]`. Easy to get wrong; double-check on `P = "aaa"`.
- **Overlapping matches**: after `k == m`, set `k = pi[m-1]` to keep searching from a valid suffix. If you set `k = 0` you miss overlaps.
- **Building `pi` for the wrong string**: build it on the pattern, not the text.
- **Pattern of length 0**: defensively return early.
- **Mistaking KMP for Z-algorithm or Rabin-Karp**: similar problem, different machinery.

## interviewTips
- Always state "linear-time string matching via failure function" when the interviewer says "find all occurrences."
- Walk through the failure function on a small string like `ababcabab` — concrete > abstract.
- Mention that the failure function alone solves several problems: longest prefix-suffix, periodicity (`m - pi[m-1]` divides `m` iff `P` is periodic), and string-rotation checks.
- For multi-pattern, mention Aho-Corasick as the natural extension.

## code.python
```python
def build_failure(p: str) -> list[int]:
    pi = [0] * len(p)
    k = 0
    for i in range(1, len(p)):
        while k > 0 and p[k] != p[i]: k = pi[k-1]
        if p[k] == p[i]: k += 1
        pi[i] = k
    return pi

def kmp_search(text: str, pattern: str) -> list[int]:
    if not pattern: return []
    pi = build_failure(pattern)
    out, k = [], 0
    for i, ch in enumerate(text):
        while k > 0 and pattern[k] != ch: k = pi[k-1]
        if pattern[k] == ch: k += 1
        if k == len(pattern):
            out.append(i - k + 1)
            k = pi[k-1]
    return out

print(kmp_search("ababcabcabababd", "ababd"))  # [10]
```

## code.javascript
```javascript
function buildFailure(p) {
  const pi = new Array(p.length).fill(0);
  let k = 0;
  for (let i = 1; i < p.length; i++) {
    while (k > 0 && p[k] !== p[i]) k = pi[k - 1];
    if (p[k] === p[i]) k++;
    pi[i] = k;
  }
  return pi;
}
function kmpSearch(text, pattern) {
  if (!pattern) return [];
  const pi = buildFailure(pattern);
  const out = []; let k = 0;
  for (let i = 0; i < text.length; i++) {
    while (k > 0 && pattern[k] !== text[i]) k = pi[k - 1];
    if (pattern[k] === text[i]) k++;
    if (k === pattern.length) { out.push(i - k + 1); k = pi[k - 1]; }
  }
  return out;
}
```

## code.java
```java
import java.util.*;
class KMP {
    static int[] buildFailure(String p) {
        int[] pi = new int[p.length()];
        int k = 0;
        for (int i = 1; i < p.length(); i++) {
            while (k > 0 && p.charAt(k) != p.charAt(i)) k = pi[k - 1];
            if (p.charAt(k) == p.charAt(i)) k++;
            pi[i] = k;
        }
        return pi;
    }
    static List<Integer> search(String t, String p) {
        List<Integer> out = new ArrayList<>();
        if (p.isEmpty()) return out;
        int[] pi = buildFailure(p);
        int k = 0;
        for (int i = 0; i < t.length(); i++) {
            while (k > 0 && p.charAt(k) != t.charAt(i)) k = pi[k - 1];
            if (p.charAt(k) == t.charAt(i)) k++;
            if (k == p.length()) { out.add(i - k + 1); k = pi[k - 1]; }
        }
        return out;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
std::vector<int> buildFailure(const std::string& p) {
    std::vector<int> pi(p.size(), 0);
    int k = 0;
    for (size_t i = 1; i < p.size(); i++) {
        while (k > 0 && p[k] != p[i]) k = pi[k - 1];
        if (p[k] == p[i]) k++;
        pi[i] = k;
    }
    return pi;
}
std::vector<int> kmpSearch(const std::string& t, const std::string& p) {
    std::vector<int> out;
    if (p.empty()) return out;
    auto pi = buildFailure(p);
    int k = 0;
    for (size_t i = 0; i < t.size(); i++) {
        while (k > 0 && p[k] != t[i]) k = pi[k - 1];
        if (p[k] == t[i]) k++;
        if ((size_t)k == p.size()) { out.push_back(i - k + 1); k = pi[k - 1]; }
    }
    return out;
}
```
