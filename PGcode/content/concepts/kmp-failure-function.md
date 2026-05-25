---
slug: kmp-failure-function
module: strings-matching
title: KMP Failure Function
subtitle: Build the prefix-function in O(m), then scan the text in O(n) without ever backing up.
difficulty: Advanced
position: 31
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Prefix function — cp-algorithms"
    url: "https://cp-algorithms.com/string/prefix-function.html"
    type: blog
  - title: "Princeton Algorithms — Substring Search"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
  - title: "TheAlgorithms/Python — knuth_morris_pratt.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/knuth_morris_pratt.py"
    type: repo
status: published
---

## intro
The Knuth-Morris-Pratt algorithm finds a pattern inside a text in O(n + m) by precomputing a failure function — also called the prefix function — that records, for each prefix of the pattern, the length of its longest proper prefix that is also a suffix. With that table in hand, the text cursor never moves backwards: after a mismatch you simply slide the pattern by exactly the amount the table tells you.

## whyItMatters
- **Substring search in editors and search tools**: `grep`, `ripgrep`, GNU `sed`, and most regex engines use KMP-style automaton matching for fixed-string patterns; Boyer-Moore wins for long alphabets but KMP wins on small/binary alphabets where the bad-character heuristic loses its edge.
- **Network IDS and DPI**: Snort, Suricata, and Cisco's deep packet inspection rules use multi-pattern variants (Aho-Corasick, built on KMP-style failure links) to scan packet payloads for thousands of attack signatures simultaneously at line rate.
- **Bioinformatics**: BWA-MEM, BLAST, and Bowtie use prefix-function-derived data structures for seed matching in DNA sequence alignment.
- **The KMP 1977 paper** introduced both the failure function and the amortised-linearity proof that became a textbook example of potential-function analysis (Sedgewick & Wayne ch.5).
- **Plagiarism detection and code-similarity tooling** (MOSS, JPlag) use prefix-function-derived structures for fixed-token matching before more expensive semantic comparison.
- The same prefix function powers period detection (Lyndon-Schützenberger 1962), occurrence counting of all prefixes, and the Z-function equivalence — all foundational primitives in competitive programming.

## intuition
The algorithm exists because naïve substring search backtracks the text cursor on every mismatch, costing O(n·m) in the worst case (text `AAA…AAB`, pattern `AAB`). Knuth, Morris, and Pratt (1977) observed that the partial match already obtained before a mismatch contains structural information that can be reused: those matched characters form a known suffix of the text, and any potential next alignment of the pattern must match a prefix of the pattern with that same suffix.

The decisive observation: for each prefix of the pattern, the *longest proper prefix that is also a suffix* (LPS) tells us how far the pattern can slide on mismatch without losing match information. If `pattern[0..j-1]` matched but `pattern[j]` mismatched, the next plausible alignment is the one where `pattern[0..LPS[j-1]-1]` aligns to the last LPS[j-1] characters of the matched region — that prefix is already known to match (since it equals a suffix of `pattern[0..j-1]`, which equals a suffix of the text). So the pattern slides by `j - LPS[j-1]` characters, and the text cursor never moves backward.

Building the LPS table itself uses the same idea applied to the pattern matching against itself: maintain a running length `k` of the longest prefix matched so far. On mismatch, fall back to `LPS[k-1]` and try again; on match, increment `k`. The amortised analysis is the elegant part: `k` is incremented at most m times total (once per outer iteration), and each `k = LPS[k-1]` fallback strictly decreases `k`, so total decreases cannot exceed total increases. The inner while loop runs O(m) times across the entire build, making the build O(m) — and the same argument applies to the text scan, giving O(n) for search. Total: O(n + m), which is information-theoretically tight.

The deeper principle is that prefix structure of the pattern, computed once, encodes "how much can I slide on mismatch?" for every possible mismatch position. The Z-function (Gusfield 1997) is a closely related primitive with the same asymptotic; both feed into Aho-Corasick (multi-pattern), KMP automaton (NFA/DFA construction), and string-period detection.

## visualization
Pattern `ABABABC`. Build the table left to right. `pi[0] = 0`. For position 1 (`B`), no proper prefix matches, so `pi[1] = 0`. Position 2 (`A`): matches first char, `pi[2] = 1`. Position 3 (`B`): extends, `pi[3] = 2`. Position 4 (`A`): extends, `pi[4] = 3`. Position 5 (`B`): extends, `pi[5] = 4`. Position 6 (`C`): mismatch, fall back via the table to length 0, `pi[6] = 0`. The table teaches the matcher how far back to jump on every mismatch.

## bruteForce
Naive substring search tries every starting offset and compares left to right, backing the text cursor up to the next candidate on mismatch. On adversarial input like text `AAAA...AAAB` with pattern `AAAB` it does O(nm) character comparisons. The wasted work is exactly the suffix-prefix overlap that KMP's table captures, which is why the table buys you a worst-case linear bound for free.

## optimal
**Technique: KMP prefix-function precomputation + linear text scan with no text-cursor backtracking.** O(n + m) total — optimal because any string-matching algorithm must read every character of the text and pattern at least once. The amortised analysis charges every inner-while iteration to a corresponding outer-loop increment, capping total decreases at total increases.

```python
def prefix_function(pattern):
    m = len(pattern)
    pi = [0] * m                                    # pi[i] = length of longest proper prefix
    k = 0                                            #         of pattern[0..i] that is also a suffix
    for i in range(1, m):
        while k > 0 and pattern[k] != pattern[i]:
            k = pi[k - 1]                            # fall back via the table itself
        if pattern[k] == pattern[i]:
            k += 1                                    # extend the matched prefix by one
        pi[i] = k
    return pi

def kmp_search(text, pattern):
    if not pattern:
        return 0
    pi = prefix_function(pattern)
    q = 0                                            # number of pattern chars matched so far
    for i, c in enumerate(text):
        while q > 0 and pattern[q] != c:
            q = pi[q - 1]                            # slide pattern using the failure table
        if pattern[q] == c:
            q += 1
        if q == len(pattern):
            return i - q + 1                         # full match — start index in text
    return -1
```

Key lines: `k = pi[k - 1]` is the failure-function fallback — it tells us "the next plausible matched-prefix length that still respects the suffix-of-prefix structure". Crucially, the fallback uses `k - 1`, not `k`, because `pi[k]` would index past the matched region. The `if pattern[k] == pattern[i]: k += 1` line extends the matched prefix by one when the next character agrees. The amortised analysis applies here: across all m iterations of the build, `k` is incremented at most m times total, and the inner while strictly decreases `k`, so the inner loop runs O(m) times total — giving O(m) build.

The search loop is structurally identical with `q` playing the role of `k`. The `while q > 0 and pattern[q] != c: q = pi[q - 1]` line slides the pattern using the failure table without backtracking the text cursor `i`. On full match (`q == len(pattern)`), we report the start index and either stop or fall back via `pi[q - 1]` to continue searching for overlapping occurrences.

**Why doesn't the text cursor backtrack?** Once we've matched k characters of the pattern, those k text characters equal the corresponding pattern prefix; we never need to re-examine them, because we already know what they are. The pattern slides; the text cursor only advances.

**Why not Z-function?** The Z-function (Gusfield 1997) is the natural alternative — it computes, for each position i, the length of the longest substring starting at i that matches a prefix. Same O(n + m) asymptotic, different shape. KMP's failure function is a *suffix* notion; Z-function is a *prefix* notion. **Why not Boyer-Moore?** Boyer-Moore is sub-linear on average (O(n/m) for random text + large alphabet) but degenerates to O(n·m) worst-case on adversarial inputs. KMP is linear-worst-case unconditionally. **Why not rolling hash / Rabin-Karp?** Rabin-Karp is expected O(n + m) with collision risk; KMP is deterministic. **For multi-pattern search**, escalate to Aho-Corasick (1975), which builds a goto-fail automaton over a trie of patterns using KMP-style failure links.

## complexity
time: O(n + m)
space: O(m)
notes: The amortized argument: in both the build and the search, the inner `while` strictly decreases `k` (or `q`), and the outer loop increases it by at most one per iteration. Total decreases cannot exceed total increases, so the inner loop runs O(n + m) times across the whole algorithm.

## pitfalls
- Off-by-one on the fallback: it is `pi[k - 1]`, not `pi[k]`. Reading from index `k` while `k == 0` corrupts the table.
- Confusing the prefix function with the Z-function — both encode similar information but indexed differently; do not paste a Z-array into KMP's matcher.
- Forgetting to fall back after a successful full match (`q == m`) — missing the next overlapping occurrence in `AAAA...` style texts.
- Sentinel-based variants concatenate `pattern + '$' + text` to compute occurrences in one pass; make sure the separator does not occur in either string. Never use the null character — many systems and Postgres reject it.

## interviewTips
- Be ready to derive the table from scratch at the whiteboard — interviewers love asking why the fallback is `pi[k - 1]`.
- Mention the Z-function as the natural alternative and that it gives the same asymptotic bound with a different shape.
- Note real-world uses: substring search in editors, regex engine prefilters, plagiarism detection over large corpora.

## code.python
```python
def prefix_function(pattern):
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

def kmp_search(text, pattern):
    if not pattern:
        return 0
    pi = prefix_function(pattern)
    q = 0
    for i, c in enumerate(text):
        while q > 0 and pattern[q] != c:
            q = pi[q - 1]
        if pattern[q] == c:
            q += 1
        if q == len(pattern):
            return i - q + 1
    return -1
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

function kmpSearch(text, pattern) {
  if (!pattern.length) return 0;
  const pi = prefixFunction(pattern);
  let q = 0;
  for (let i = 0; i < text.length; i++) {
    while (q > 0 && pattern[q] !== text[i]) q = pi[q - 1];
    if (pattern[q] === text[i]) q++;
    if (q === pattern.length) return i - q + 1;
  }
  return -1;
}
```

## code.java
```java
public int[] prefixFunction(String p) {
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

public int kmpSearch(String text, String pattern) {
    if (pattern.isEmpty()) return 0;
    int[] pi = prefixFunction(pattern);
    int q = 0;
    for (int i = 0; i < text.length(); i++) {
        while (q > 0 && pattern.charAt(q) != text.charAt(i)) q = pi[q - 1];
        if (pattern.charAt(q) == text.charAt(i)) q++;
        if (q == pattern.length()) return i - q + 1;
    }
    return -1;
}
```

## code.cpp
```cpp
std::vector<int> prefixFunction(const std::string& p) {
    int m = p.size();
    std::vector<int> pi(m, 0);
    int k = 0;
    for (int i = 1; i < m; ++i) {
        while (k > 0 && p[k] != p[i]) k = pi[k - 1];
        if (p[k] == p[i]) ++k;
        pi[i] = k;
    }
    return pi;
}

int kmpSearch(const std::string& text, const std::string& pattern) {
    if (pattern.empty()) return 0;
    auto pi = prefixFunction(pattern);
    int q = 0;
    for (int i = 0; i < (int)text.size(); ++i) {
        while (q > 0 && pattern[q] != text[i]) q = pi[q - 1];
        if (pattern[q] == text[i]) ++q;
        if (q == (int)pattern.size()) return i - q + 1;
    }
    return -1;
}
```
