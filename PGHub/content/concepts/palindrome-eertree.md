---
slug: palindrome-eertree
module: strings-advanced
title: Palindromic Tree (Eertree)
subtitle: Linear-time online structure that enumerates every distinct palindromic substring.
difficulty: Advanced
position: 50
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Eertree (Palindromic Tree) — Algorithms for Competitive Programming"
    url: "https://cp-algorithms.com/string/palindromic_tree.html"
    type: blog
  - title: "Sedgewick & Wayne — String Processing (Algorithms, 4th Edition)"
    url: "https://algs4.cs.princeton.edu/50strings/"
    type: book
  - title: "kth-competitive-programming/kactl — Eertree"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/strings/Eertree.h"
    type: repo
status: published
---

## intro
The eertree (palindromic tree) is a string-processing structure that stores every distinct palindromic substring of S in O(|S|) total nodes — a striking fact, since the count of distinct palindromic substrings is at most |S| + 2. Each node represents one palindrome; suffix links point to the longest proper palindromic suffix; the structure is built online, one character at a time, in amortized O(1).

## whyItMatters
- **Bioinformatics pipelines** (BWA, Bowtie2, SeqAn) lean on palindrome-aware indices when scanning DNA for inverted repeats and hairpin loops — eertree gives the distinct-palindrome count in one pass over a chromosome.
- **Plagiarism detection at scale** (Turnitin, Moss-style tooling) uses palindromic-substring fingerprints as one of several features; the linear build is the only way to stay under per-document budgets.
- **Competitive programming** uses eertree on Codeforces / ICPC palindrome counting and decomposition problems (CF 17E, CF 906E, 932G) where Manacher leaks the "distinct" requirement and DP TLEs at n = 5·10^5.
- **Compression research** (palindromic factorisation for entropy coders) and **RFC 9171 Bundle Protocol** content addressing both touch palindrome dedup at edge devices.
- The structure is the canonical answer whenever the words "palindrome" and "distinct" appear together — knowing it shortcuts an entire family of hard interview rounds.

## intuition
Two facts make the eertree click. First: a string of length n has at most n + 1 distinct palindromic substrings (Eertree theorem). Append a single character and you can introduce at most one new distinct palindrome — exactly the one whose center sits at the new position. That bound is what makes a linear structure possible at all.

Second: the new palindrome created at step i is determined entirely by the longest palindromic suffix that can be extended on both sides by the new character c. Call that suffix P; the new node represents c + P + c. So the algorithm reduces to "find the right P fast." A suffix-link chain anchored at the most recent palindromic suffix (`last`) makes that search amortized constant — same amortization argument as KMP failure functions or suffix-automaton suffix links.

The structure carries two imaginary roots: an odd-root of length -1 (parent of single-character palindromes; "extending" a length -1 string by c on both sides gives length 1) and an even-root of length 0 (parent of even-length palindromes like "aa"). Each real node v stores `len[v]`, a transition table `to[v][c]` (child = palindrome formed by surrounding v with c), and `link[v]`, the longest proper palindromic suffix of v. Walking suffix links from `last` lets you find a palindrome whose left-neighbour character matches c; that is the v you extend.

The amortized argument: every suffix-link hop strictly decreases the length of the candidate, and `last` only grows by at most 2 per character — so total hops across all n characters are O(n).

## visualization
```
String: "abba"

After each append, new node added (if not present):

  i=0, ch='a': new palindrome "a"
  i=1, ch='b': new palindrome "b"
  i=2, ch='b': new palindrome "bb"
  i=3, ch='a': new palindrome "abba"

Final tree:
  root_odd (-1) ── a ──> [a]
                   \─ b ──> [b]
  root_even (0) ── b ──> [bb]
                  \─ a ──> [abba]

Suffix link of [abba] -> [a]   (longest proper palindromic suffix)
Suffix link of [bb]   -> root_even
Suffix link of [b]    -> root_odd
```

## bruteForce
Enumerate every substring (O(n^2)), check each for palindrome (O(n)), dedupe with a hash set: O(n^3) time, O(n^2) memory. Dies at n = 5000.

## optimal
**Eertree — online linear build.** Maintain four arrays indexed by node id:
- `len[v]` — length of the palindrome at v.
- `link[v]` — suffix link to the longest proper palindromic suffix.
- `to[v][c]` — child on character c (extension by surrounding v with c on both sides).
- `last` — node id for the longest palindromic suffix of the prefix processed so far.

For each new character c at position i, run two suffix-link walks:

```python
def add(self, c):
    self.s.append(c)
    i = len(self.s) - 1
    cur = self._get_link(self.last, i)            # find extendable parent
    if c in self.to[cur]:
        self.last = self.to[cur][c]
        return False                              # no new distinct palindrome
    u = len(self.len)
    self.len.append(self.len[cur] + 2)
    self.to.append({})
    if self.len[u] == 1:
        self.link.append(1)                       # single chars link to even-root
    else:
        self.link.append(self.to[self._get_link(self.link[cur], i)][c])
    self.to[cur][c] = u
    self.last = u
    return True
```

`_get_link(v, i)` walks `link` from v until `s[i - len[v] - 1] == c`, i.e. the character one position before v's left end matches the new right character. That is the only node whose `to[·][c]` child can be the new palindrome.

**Why O(n) amortized.** Each character adds at most one node (Eertree theorem). The first `_get_link` walk shrinks `last`'s palindrome length, and `last` grows by at most 2 per character, so total shrinkage across the run is O(n). The second walk during link assignment is dominated by the same potential. Hash-map children give O(n) total time independent of alphabet size; array children give O(n · |Σ|) memory but O(1) per transition.

This is the same potential-method amortization that gives suffix automaton its linear build — a strict bound, not heuristic.

## complexity
- **Build**: O(n · |Σ|) with array children; O(n) amortized with hash-map children.
- **Distinct palindromes**: equals the number of non-root nodes.
- **Space**: O(n) nodes; O(n · |Σ|) total if you store children as arrays.

## pitfalls
- **Off-by-one on len[u] = 1**: the suffix link must point to root_even (not root_odd) for single-character palindromes; an explicit check is needed.
- **Walking suffix links incorrectly**: the loop is `while s[i - len[v] - 1] != c: v = link[v]`. Forgetting the `-1` shifts the comparison.
- **Two imaginary roots**: a common mistake is to use one root and special-case lengths; you really need both, with `link[root_odd] = root_odd`.
- **Counting all occurrences vs distinct**: each node = one *distinct* palindrome. For occurrence counts, propagate counts along suffix links at the end.
- **Memory blow-up with array children**: at |Σ| = 256, 10^6 nodes × 256 × 4 bytes = 1 GB. Switch to hash map.

## interviewTips
- Trigger phrases: "count distinct palindromic substrings," "shortest palindromic decomposition," "online palindrome queries."
- This is an advanced-loop topic — at the screening level, a quick "I'd use an eertree, here's the property" earns the points; full implementation is rarely required.
- Compare with **Manacher** (gets only longest / radii) and **suffix automaton** (no palindrome structure but linear space).
- For decomposition problems (split S into the fewest palindromes), the eertree plus a small DP over suffix-link chains is O(n log n) — much faster than O(n^2) DP.

## code.python
```python
class Eertree:
    def __init__(self, s):
        self.s = []
        # node 0: imaginary root of length -1 (odd); node 1: root of length 0 (even)
        self.len = [-1, 0]
        self.link = [0, 0]
        self.to = [{}, {}]
        self.last = 1
        for c in s: self.add(c)

    def get_link(self, v, i):
        while True:
            ln = self.len[v]
            if i - ln - 1 >= 0 and self.s[i - ln - 1] == self.s[i]:
                return v
            v = self.link[v]

    def add(self, c):
        self.s.append(c)
        i = len(self.s) - 1
        cur = self.get_link(self.last, i)
        if c in self.to[cur]:
            self.last = self.to[cur][c]
            return False
        u = len(self.len)
        self.len.append(self.len[cur] + 2)
        self.to.append({})
        if self.len[-1] == 1:
            self.link.append(1)
        else:
            self.link.append(self.to[self.get_link(self.link[cur], i)][c])
        self.to[cur][c] = u
        self.last = u
        return True

    def distinct_palindromes(self):
        return len(self.len) - 2

e = Eertree("abba")
print(e.distinct_palindromes())  # 4: a, b, bb, abba
```

## code.javascript
```javascript
class Eertree {
  constructor(s = "") {
    this.s = [];
    this.len = [-1, 0];
    this.link = [0, 0];
    this.to = [new Map(), new Map()];
    this.last = 1;
    for (const c of s) this.add(c);
  }
  getLink(v, i) {
    while (true) {
      const ln = this.len[v];
      if (i - ln - 1 >= 0 && this.s[i - ln - 1] === this.s[i]) return v;
      v = this.link[v];
    }
  }
  add(c) {
    this.s.push(c);
    const i = this.s.length - 1;
    const cur = this.getLink(this.last, i);
    if (this.to[cur].has(c)) { this.last = this.to[cur].get(c); return false; }
    const u = this.len.length;
    this.len.push(this.len[cur] + 2);
    this.to.push(new Map());
    if (this.len[u] === 1) this.link.push(1);
    else this.link.push(this.to[this.getLink(this.link[cur], i)].get(c));
    this.to[cur].set(c, u);
    this.last = u;
    return true;
  }
  distinct() { return this.len.length - 2; }
}
```

## code.java
```java
import java.util.*;
class Eertree {
    List<Character> s = new ArrayList<>();
    List<Integer> len = new ArrayList<>(List.of(-1, 0));
    List<Integer> link = new ArrayList<>(List.of(0, 0));
    List<Map<Character, Integer>> to = new ArrayList<>(List.of(new HashMap<>(), new HashMap<>()));
    int last = 1;
    int getLink(int v, int i) {
        while (true) {
            int ln = len.get(v);
            if (i - ln - 1 >= 0 && s.get(i - ln - 1) == s.get(i)) return v;
            v = link.get(v);
        }
    }
    boolean add(char c) {
        s.add(c);
        int i = s.size() - 1;
        int cur = getLink(last, i);
        if (to.get(cur).containsKey(c)) { last = to.get(cur).get(c); return false; }
        int u = len.size();
        len.add(len.get(cur) + 2);
        to.add(new HashMap<>());
        if (len.get(u) == 1) link.add(1);
        else link.add(to.get(getLink(link.get(cur), i)).get(c));
        to.get(cur).put(c, u);
        last = u;
        return true;
    }
    int distinct() { return len.size() - 2; }
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
#include <string>
struct Eertree {
    std::string s;
    std::vector<int> len{-1, 0};
    std::vector<int> link{0, 0};
    std::vector<std::unordered_map<char, int>> to{{}, {}};
    int last = 1;
    int getLink(int v, int i) {
        while (true) {
            int ln = len[v];
            if (i - ln - 1 >= 0 && s[i - ln - 1] == s[i]) return v;
            v = link[v];
        }
    }
    bool add(char c) {
        s.push_back(c);
        int i = (int) s.size() - 1;
        int cur = getLink(last, i);
        if (to[cur].count(c)) { last = to[cur][c]; return false; }
        int u = (int) len.size();
        len.push_back(len[cur] + 2);
        to.emplace_back();
        if (len[u] == 1) link.push_back(1);
        else link.push_back(to[getLink(link[cur], i)][c]);
        to[cur][c] = u;
        last = u;
        return true;
    }
    int distinct() { return (int) len.size() - 2; }
};
```
