---
slug: kmp-deep-dive
module: strings-matching
title: KMP Deep Dive — Failure Function Lemma and Correctness Proof
subtitle: Why the prefix function exists, why the build is linear, and why the matcher never has to back up the text cursor.
difficulty: Advanced
position: 50
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Prefix function — cp-algorithms (construction and proofs)"
    url: "https://cp-algorithms.com/string/prefix-function.html"
    type: blog
  - title: "Knuth–Morris–Pratt — Wikipedia (failure table, partial-match proofs)"
    url: "https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm"
    type: blog
  - title: "Princeton Algorithms 4e — Substring Search (Sedgewick & Wayne)"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
status: published
---

## intro
The KMP basics — what the failure function is, how to use it to slide a pattern — are well-trodden ground. This page goes one level lower: the lemma that makes the construction loop correct, the amortized accounting that makes both phases linear, and the equivalence between the failure-function matcher and an explicit string-matching automaton. Read this after the standard KMP walkthrough when "why does this code actually work?" starts to itch.

## whyItMatters
Treat KMP as a black-box O(n + m) matcher and you can ship a solution. Treat it as a deterministic finite automaton whose transition function is the prefix function and you unlock the rest of the family: Aho-Corasick is the multi-pattern lift of the same automaton, the Z-function is the prefix-symmetric dual, suffix automata reuse the suffix-link idea, and period detection on a string falls out as a one-liner on the table. The proof techniques here — strong induction over prefix length, amortized accounting via a potential function — recur every time you analyze a string algorithm. Skip the proofs and you will misread when KMP-style structure does and does not transfer.

## intuition
Three facts do the heavy lifting. **Fact one — the LPS monotonicity bound.** For any string `P`, `pi[i]` denotes the length of the longest proper prefix of `P[0..i]` that is also a suffix. The key bound is `pi[i] <= pi[i-1] + 1`. Why: if `pi[i] = k`, then `P[0..k-1]` equals `P[i-k+1..i]`. Strip the last character on both sides — `P[0..k-2]` equals `P[i-k+1..i-1]`, so `P[0..k-2]` is a proper-prefix-and-suffix of `P[0..i-1]`, meaning `pi[i-1] >= k - 1 = pi[i] - 1`. Rearrange: `pi[i] <= pi[i-1] + 1`. The function can never jump up by more than one between adjacent positions.

**Fact two — the candidate-set lemma.** When you have a known match of length `k = pi[i-1]` and you ask "what is the next longer proper prefix of `P[0..i-1]` that is also a suffix?", the answer is `pi[k-1]`. The candidate lengths for `pi[i]` are exactly the sequence `pi[i-1], pi[pi[i-1]-1], pi[pi[pi[i-1]-1]-1], ...`, terminating at 0. This is the *failure chain*. So the construction loop falls back along this chain until either `P[k] == P[i]` (extend by one and stop) or `k == 0` (set `pi[i] = 0` or `1`).

**Fact three — the amortized invariant.** Across the entire build, `k` is incremented at most `m - 1` times (once per outer-loop iteration that finds a match). Each `k = pi[k-1]` fallback strictly decreases `k`. Therefore the total fallback work is bounded by the total increment work, which is at most `m`. Inner while iterations summed over all outer iterations: O(m). The same bookkeeping makes the search phase O(n). Both bounds are tight in the worst case (`P = aab`, `T = aaaaaaaab`) and information-theoretically optimal — you must look at every text character at least once.

## visualization
```
P = a b a b c a b a b a
i = 0 1 2 3 4 5 6 7 8 9
pi= 0 0 1 2 0 1 2 3 4 3
                    ^^^^^^
            chain at i=9 (last char 'a'):
              k = pi[8] = 4 -> P[4]='c' != 'a' -> fallback
              k = pi[3] = 2 -> P[2]='a' == 'a' -> k = 3 -> pi[9] = 3

candidate chain at i=9: 4 -> 2 -> 0  (the failure-link chain of length 4)
each fallback strictly decreases k; total fallbacks across build are <= total increments <= m.
```

## bruteForce
The naive matcher tries every starting offset and compares left to right. On the canonical adversarial input `T = "aaaaaaaaaab"` with `P = "aaaaab"`, every prefix of `T` looks like a prospective match until the final character. The matcher does `m` comparisons per offset times `n - m + 1` offsets — `Theta(n m)` work. Computing the prefix function by hand — "for each suffix-of-prefix length, scan the string" — naively costs `O(m^3)`. Both quadratic and cubic blowups stem from re-deriving information already in the partial match.

## optimal
The lemmas above translate directly to the construction code. Maintain `k` = length of the longest matched prefix at position `i-1`. For position `i`:

```
while k > 0 and P[k] != P[i]:
    k = pi[k-1]        # walk the failure chain
if P[k] == P[i]:
    k += 1             # extend the matched prefix
pi[i] = k
```

**Why the fallback uses `pi[k-1]` and not `pi[k]`.** `pi[k]` is undefined when looking up the next candidate length — we have not yet computed it for the current position, and even for previously computed positions `pi[k]` would index past the matched region. The matched region is `P[0..k-1]`, so the next candidate length is `pi[k-1]` — the LPS of that region.

**Why the matcher's text cursor never backtracks.** Once `q` characters of `P` match the most recent `q` characters of `T`, those `q` text characters are uniquely determined: they equal `P[0..q-1]`. On a mismatch you do not need to re-examine any of them. The pattern slides — that is, `q` decreases via the failure chain — but `i` only advances. This is the difference between KMP and any backtracking matcher: KMP commits to "I have seen these characters and I know what they are," and the failure function tells it what to do with that knowledge.

**Equivalence to a DFA.** Define `delta(q, c) = q'` where `q'` is the longest prefix of `P` matching a suffix of `(P[0..q-1] + c)`. This is a deterministic finite automaton — the *KMP automaton* — with `m + 1` states. The matcher above computes `delta(q, c)` on the fly via the failure chain instead of materializing the full `m * |Sigma|` table. For small alphabets you can build the explicit table in O(m |Sigma|) for an O(n) matcher with no inner while loop. For large alphabets, the implicit form is cheaper.

**The amortized proof formally.** Define the potential `Phi(state) = q` (number of matched characters). The actual work per outer iteration is `1 + (# inner-while iterations)`. The amortized cost is `actual + Delta(Phi)`. Each inner iteration decreases `q` by at least one (so `Delta(Phi) <= -1` per iteration); each outer iteration increases `q` by at most one. Amortized cost per outer iteration is therefore `O(1)`, total O(n) for search and O(m) for build.

## complexity
- **Time**: O(n + m), worst case. The amortized argument above is tight.
- **Build time**: O(m). Inner while iterations across the build sum to at most m, by the potential argument.
- **Search time**: O(n). Same argument applied to the search loop.
- **Space**: O(m) for the prefix-function table. An explicit DFA would use O(m |Sigma|), which is only worth materializing for tiny alphabets where you want zero inner-while branching.

## pitfalls
- **`pi[k]` vs `pi[k-1]`** — the fallback is `k = pi[k-1]`. Using `pi[k]` reads off the matched region and produces a wrong table. Verify on `P = "ababaca"` — hand-tracing two positions catches the off-by-one.
- **Treating the chain as one step** — the inner `while` may walk multiple steps. Replacing it with a single `k = pi[k-1]` produces a wrong table when the new candidate also mismatches; the bug only shows up on patterns where the LPS is long.
- **Forgetting to fall back on full match** — after `q == m` in the matcher, you must set `q = pi[m-1]` to keep finding overlapping occurrences. Setting `q = 0` misses, for example, the second match in `T = "aaaa"`, `P = "aa"`.
- **Using `pi[i-1] + 1` directly as the extension** — that's only valid when `P[pi[i-1]] == P[i]`. Otherwise you must walk the failure chain first.
- **Mis-stating periodicity** — the string `P` of length `m` has period `m - pi[m-1]` iff `(m - pi[m-1])` divides `m`. The divisibility check is required; skipping it gives the *smallest possible* period bound, not a proven period.
- **Computing the table for the text instead of the pattern** — symptom: build time scales with `n`, not `m`. Always build for the pattern.

## interviewTips
- Lead with the LPS monotonicity bound `pi[i] <= pi[i-1] + 1`. Interviewers ask "why is the construction loop linear?" and the bound is the cleanest answer.
- Sketch the failure chain explicitly — draw the candidate lengths `pi[i-1] -> pi[pi[i-1]-1] -> ...` for a small pattern. This is the visual that lands the amortized accounting.
- Mention period detection (`m - pi[m-1]` with the divisibility check) as the one-liner that the failure function unlocks for free. Strong senior signal.

## code.python
```python
def prefix_function(pattern: str) -> list[int]:
    m = len(pattern)
    pi = [0] * m
    k = 0
    for i in range(1, m):
        while k > 0 and pattern[k] != pattern[i]:
            k = pi[k - 1]
        if pattern[k] == pattern[i]:
            k += 1
        pi[i] = k
    return pi


def kmp_search_all(text: str, pattern: str) -> list[int]:
    if not pattern:
        return []
    pi = prefix_function(pattern)
    occurrences = []
    q = 0
    for i, c in enumerate(text):
        while q > 0 and pattern[q] != c:
            q = pi[q - 1]
        if pattern[q] == c:
            q += 1
        if q == len(pattern):
            occurrences.append(i - q + 1)
            q = pi[q - 1]
    return occurrences


def smallest_period(pattern: str) -> int:
    """Smallest p such that pattern is the prefix of (pattern[:p])^infinity.
    Equal to len - pi[-1] when that divides len, else len itself."""
    pi = prefix_function(pattern)
    m = len(pattern)
    p = m - pi[-1]
    return p if m % p == 0 else m


if __name__ == "__main__":
    assert prefix_function("ababcababa") == [0, 0, 1, 2, 0, 1, 2, 3, 4, 3]
    assert kmp_search_all("ababcababaabababc", "abab") == [0, 5, 9, 11]
    assert smallest_period("ababab") == 2
    assert smallest_period("aabaaab") == 7
```

## code.javascript
```javascript
function prefixFunction(pattern) {
  const m = pattern.length;
  const pi = new Array(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) k = pi[k - 1];
    if (pattern[k] === pattern[i]) k++;
    pi[i] = k;
  }
  return pi;
}

function kmpSearchAll(text, pattern) {
  if (!pattern.length) return [];
  const pi = prefixFunction(pattern);
  const out = [];
  let q = 0;
  for (let i = 0; i < text.length; i++) {
    while (q > 0 && pattern[q] !== text[i]) q = pi[q - 1];
    if (pattern[q] === text[i]) q++;
    if (q === pattern.length) {
      out.push(i - q + 1);
      q = pi[q - 1];
    }
  }
  return out;
}

function smallestPeriod(pattern) {
  const pi = prefixFunction(pattern);
  const m = pattern.length;
  const p = m - pi[m - 1];
  return m % p === 0 ? p : m;
}

console.log(prefixFunction("ababcababa"));
console.log(kmpSearchAll("ababcababaabababc", "abab"));
console.log(smallestPeriod("ababab"));
```

## code.java
```java
import java.util.*;

class KmpDeepDive {
    static int[] prefixFunction(String p) {
        int m = p.length();
        int[] pi = new int[m];
        int k = 0;
        for (int i = 1; i < m; i++) {
            while (k > 0 && p.charAt(k) != p.charAt(i)) k = pi[k - 1];
            if (p.charAt(k) == p.charAt(i)) k++;
            pi[i] = k;
        }
        return pi;
    }

    static List<Integer> searchAll(String text, String pattern) {
        List<Integer> out = new ArrayList<>();
        if (pattern.isEmpty()) return out;
        int[] pi = prefixFunction(pattern);
        int q = 0;
        for (int i = 0; i < text.length(); i++) {
            while (q > 0 && pattern.charAt(q) != text.charAt(i)) q = pi[q - 1];
            if (pattern.charAt(q) == text.charAt(i)) q++;
            if (q == pattern.length()) {
                out.add(i - q + 1);
                q = pi[q - 1];
            }
        }
        return out;
    }

    static int smallestPeriod(String p) {
        int[] pi = prefixFunction(p);
        int m = p.length();
        int period = m - pi[m - 1];
        return (m % period == 0) ? period : m;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(prefixFunction("ababcababa")));
        System.out.println(searchAll("ababcababaabababc", "abab"));
        System.out.println(smallestPeriod("ababab"));
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> prefix_function(const string& p) {
    int m = (int)p.size();
    vector<int> pi(m, 0);
    int k = 0;
    for (int i = 1; i < m; ++i) {
        while (k > 0 && p[k] != p[i]) k = pi[k - 1];
        if (p[k] == p[i]) ++k;
        pi[i] = k;
    }
    return pi;
}

vector<int> kmp_search_all(const string& text, const string& pattern) {
    vector<int> out;
    if (pattern.empty()) return out;
    auto pi = prefix_function(pattern);
    int q = 0;
    for (int i = 0; i < (int)text.size(); ++i) {
        while (q > 0 && pattern[q] != text[i]) q = pi[q - 1];
        if (pattern[q] == text[i]) ++q;
        if (q == (int)pattern.size()) {
            out.push_back(i - q + 1);
            q = pi[q - 1];
        }
    }
    return out;
}

int smallest_period(const string& p) {
    auto pi = prefix_function(p);
    int m = (int)p.size();
    int period = m - pi[m - 1];
    return (m % period == 0) ? period : m;
}

int main() {
    auto pi = prefix_function("ababcababa");
    for (int v : pi) cout << v << ' '; cout << '\n';
    for (int idx : kmp_search_all("ababcababaabababc", "abab")) cout << idx << ' ';
    cout << '\n' << smallest_period("ababab") << '\n';
}
```
