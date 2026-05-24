---
slug: aho-corasick
module: sorting-strings
title: Aho-Corasick
subtitle: Match many patterns against a text in a single O(n + sum_of_pattern_lengths + matches) scan.
difficulty: Advanced
position: 22
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Substring Search (Algorithms, 4th Edition)"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
  - title: "Aho-Corasick algorithm — Algorithms for Competitive Programming"
    url: "https://cp-algorithms.com/string/aho_corasick.html"
    type: blog
  - title: "TheAlgorithms/Python — aho_corasick.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/aho_corasick.py"
    type: repo
status: published
---

## intro
Aho-Corasick is multi-pattern KMP. Build a trie of all patterns, augment it with failure links (the "fall-back" pointer when the current edge mismatches), then scan the text once. Every occurrence of every pattern is found in one pass — total cost O(n + m + z) where n is text length, m is sum of pattern lengths, z is number of matches.

## whyItMatters
The natural fit for any "given a text, flag every appearance of these K terms" workload. Real users: virus scanners (signature matching), grep `-f` mode (multiple patterns), web filters, intrusion-detection systems (Snort), bioinformatics short-read aligners, autocomplete pre-fetchers. Running KMP K times costs O(K·n); Aho-Corasick costs O(n) regardless of K.

## intuition
A trie holds every pattern as a path from the root. If you're at trie node `u` after consuming text characters and the next character doesn't extend `u`, you'd normally restart at the root. Aho-Corasick adds a **failure link** `fail(u)` = the deepest *other* trie node whose path is a proper suffix of the path to `u`. When you mismatch, follow `fail(u)` instead of restarting. Same idea as KMP's pi array, generalized to a trie.

## visualization
```
Patterns: ["he", "she", "his", "hers"]

Trie (numbers = node IDs):
        (0)
       / | \
      h  s  
     /|  |
    e i  h
   /| |  |
  r s s  e        s
  |       |       |
  s       i       (more nodes…)
  
Failure links:
  he  → at 'e' under h, fail → 0
  she → at 'e' under sh, fail → 'e' under h
  his → at 's' under hi, fail → 's' under root
  hers→ at 'rs' under her, fail → 's' under root
```

## bruteForce
For each pattern p, run KMP against the text → O((n + |p|) · K). Fine for K = 2. Dies at K = 10,000 patterns.

## optimal
**Construction** (BFS over the trie):
1. Build the trie: insert each pattern; mark terminal nodes with the pattern id.
2. Compute failure links in BFS order from root:
   - `fail(root) = root`.
   - For each node `u` with child `v` on character `c`:
     - Walk `f = fail(u)`, following failure links while `f` lacks a `c`-child.
     - `fail(v) = f.child[c]` if it exists, else root.
     - **Output link**: `output(v) = fail(v) if fail(v) is terminal, else output(fail(v))` — chases the chain of suffix-pattern matches.

**Matching**:
```
node = root
for i, ch in enumerate(text):
    while node != root and ch not in node.children:
        node = fail(node)
    if ch in node.children:
        node = node.children[ch]
    # report any terminal pattern reachable via output links
    t = node
    while t and t != root:
        if t.is_terminal:
            emit(t.pattern_id, ending at position i)
        t = output(t)
```

## complexity
- **Build**: O(m + |Σ|·states) using array-based children; O(m log |Σ|) with hash maps.
- **Match**: O(n + z) where z is total matches reported.
- **Space**: O(m · |Σ|) worst case for array children; O(m) typical with hash-map children.

## pitfalls
- **Forgetting output links**: without them you miss patterns that are suffixes of other matched patterns ("he" within "she").
- **Confusing fail link target**: it points to the deepest *strict-suffix* node, not to itself.
- **Building goto + fail in the wrong order**: must compute fail links in BFS (level-order) so each node's fail target is already computed.
- **Pattern-id collisions**: two identical patterns should be deduped at insertion time, not silently overwritten.
- **Unicode characters**: pad children to full alphabet size and you waste memory. Use hash-map children for sparse alphabets.

## interviewTips
- The trigger: "find all occurrences of multiple patterns in a text" or "given a list of banned words, flag every appearance."
- Always describe the failure-link analogy to KMP — interviewers love the connection.
- Mention **output links** as the trick to catch overlapping/nested matches.
- For very senior interviews, compare with **suffix automaton** (better for "all distinct substrings, online") and **generalized suffix array** (better for offline queries on a fixed text).

## code.python
```python
from collections import deque

class AhoCorasick:
    def __init__(self):
        self.children = [{}]          # children[id] = { ch -> id }
        self.fail = [0]
        self.out = [[]]               # patterns ending at this node

    def add(self, pattern, pid):
        node = 0
        for ch in pattern:
            if ch not in self.children[node]:
                self.children.append({})
                self.fail.append(0)
                self.out.append([])
                self.children[node][ch] = len(self.children) - 1
            node = self.children[node][ch]
        self.out[node].append(pid)

    def build(self):
        q = deque()
        for ch, c in self.children[0].items():
            self.fail[c] = 0
            q.append(c)
        while q:
            u = q.popleft()
            for ch, v in self.children[u].items():
                f = self.fail[u]
                while f and ch not in self.children[f]: f = self.fail[f]
                self.fail[v] = self.children[f].get(ch, 0) if f != v else 0
                if self.fail[v] == v: self.fail[v] = 0
                self.out[v] += self.out[self.fail[v]]
                q.append(v)

    def search(self, text):
        node = 0
        for i, ch in enumerate(text):
            while node and ch not in self.children[node]:
                node = self.fail[node]
            node = self.children[node].get(ch, 0)
            for pid in self.out[node]:
                yield (i, pid)

ac = AhoCorasick()
for i, p in enumerate(["he", "she", "his", "hers"]): ac.add(p, i)
ac.build()
for end, pid in ac.search("ushers"):
    print(f"pattern {pid} ends at {end}")
```

## code.javascript
```javascript
class AhoCorasick {
  constructor() { this.children = [new Map()]; this.fail = [0]; this.out = [[]]; }
  add(p, id) {
    let n = 0;
    for (const c of p) {
      if (!this.children[n].has(c)) {
        this.children.push(new Map()); this.fail.push(0); this.out.push([]);
        this.children[n].set(c, this.children.length - 1);
      }
      n = this.children[n].get(c);
    }
    this.out[n].push(id);
  }
  build() {
    const q = [];
    for (const [, c] of this.children[0]) { this.fail[c] = 0; q.push(c); }
    while (q.length) {
      const u = q.shift();
      for (const [ch, v] of this.children[u]) {
        let f = this.fail[u];
        while (f && !this.children[f].has(ch)) f = this.fail[f];
        this.fail[v] = (f !== v && this.children[f].has(ch)) ? this.children[f].get(ch) : 0;
        this.out[v] = this.out[v].concat(this.out[this.fail[v]]);
        q.push(v);
      }
    }
  }
  *search(text) {
    let n = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      while (n && !this.children[n].has(ch)) n = this.fail[n];
      n = this.children[n].get(ch) || 0;
      for (const pid of this.out[n]) yield [i, pid];
    }
  }
}
```

## code.java
```java
import java.util.*;
class AhoCorasick {
    List<Map<Character, Integer>> children = new ArrayList<>();
    List<Integer> fail = new ArrayList<>();
    List<List<Integer>> out = new ArrayList<>();
    AhoCorasick() { children.add(new HashMap<>()); fail.add(0); out.add(new ArrayList<>()); }
    void add(String p, int id) {
        int n = 0;
        for (char c : p.toCharArray()) {
            if (!children.get(n).containsKey(c)) {
                children.add(new HashMap<>()); fail.add(0); out.add(new ArrayList<>());
                children.get(n).put(c, children.size() - 1);
            }
            n = children.get(n).get(c);
        }
        out.get(n).add(id);
    }
    void build() {
        Deque<Integer> q = new ArrayDeque<>();
        for (int c : children.get(0).values()) { fail.set(c, 0); q.add(c); }
        while (!q.isEmpty()) {
            int u = q.pollFirst();
            for (var e : children.get(u).entrySet()) {
                char ch = e.getKey(); int v = e.getValue();
                int f = fail.get(u);
                while (f != 0 && !children.get(f).containsKey(ch)) f = fail.get(f);
                fail.set(v, (f != v && children.get(f).containsKey(ch)) ? children.get(f).get(ch) : 0);
                out.get(v).addAll(out.get(fail.get(v)));
                q.add(v);
            }
        }
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <unordered_map>
#include <string>
struct AhoCorasick {
    std::vector<std::unordered_map<char,int>> children{1};
    std::vector<int> fail{0};
    std::vector<std::vector<int>> out{{}};
    void add(const std::string& p, int id) {
        int n = 0;
        for (char c : p) {
            if (!children[n].count(c)) {
                children.emplace_back(); fail.push_back(0); out.emplace_back();
                children[n][c] = (int) children.size() - 1;
            }
            n = children[n][c];
        }
        out[n].push_back(id);
    }
    void build() {
        std::queue<int> q;
        for (auto& [c, ch] : children[0]) { fail[ch] = 0; q.push(ch); }
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (auto& [ch, v] : children[u]) {
                int f = fail[u];
                while (f && !children[f].count(ch)) f = fail[f];
                fail[v] = (f != v && children[f].count(ch)) ? children[f][ch] : 0;
                for (int x : out[fail[v]]) out[v].push_back(x);
                q.push(v);
            }
        }
    }
};
```
