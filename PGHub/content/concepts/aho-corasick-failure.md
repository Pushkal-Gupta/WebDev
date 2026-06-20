---
slug: aho-corasick-failure
module: strings-advanced
title: Aho-Corasick Failure Links
subtitle: Build a trie from a dictionary, then add BFS-computed failure links — match all patterns in a text in O(text + total pattern length + matches).
difficulty: Advanced
position: 27
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Substring Search (Algorithms, 4th Edition)"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
  - title: "Aho-Corasick algorithm — Algorithms for Competitive Programming"
    url: "https://cp-algorithms.com/string/aho_corasick.html"
    type: blog
  - title: "KACTL (KTH) — AhoCorasick.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/strings/AhoCorasick.h"
    type: repo
status: published
---

## intro
**Aho-Corasick** searches for ALL occurrences of MANY patterns in a single text in O(|text| + ∑|pattern| + #matches). Build a **trie** of all patterns, then add **failure links** (longest proper suffix of the current node that is also a prefix of some pattern) via BFS. While scanning the text, follow children when possible; otherwise jump along failure links.

## whyItMatters
The canonical multi-pattern search:
- **Snort / Suricata / IDS** — match thousands of attack signatures simultaneously.
- **Antivirus / DLP** — scan files for known signatures.
- **Censorship / content filtering** — match dictionaries of words.
- **`grep -F`** with many patterns uses AC under the hood.
- **DNA / bioinformatics** — match many subsequences in a genome.

Naive multi-pattern search runs each pattern separately: O(|patterns| · |text|). Aho-Corasick is O(|text|) regardless of pattern count.

## intuition
- **Trie**: each pattern is a path from the root.
- **Failure link** `fail(u)`: the longest proper suffix of the string spelled by root→u that is ALSO spelled by some root→v path. If no such v exists, fail(u) = root.
- **Output link** `output(u)`: list of patterns that end at u (and at ancestors via fail-chain).

Process text character by character, walking the trie. When current char doesn't match a child, follow failure links until we find one that does (or hit root). Each step is amortized O(1).

## visualization
```
Patterns: { he, she, his, hers }

Trie (root marked •, internal nodes letters; * = end-of-pattern):
        •
       /|\
      h s
      |   \
      e* (h)
      |     \
      r      e*
      |
      s*

After BFS to compute fail links:
  fail(h) = •
  fail(e) [from "he"] = •
  fail(r) = •
  fail(s) [from "hers"] = •
  fail(i) [from "his"] = •
  fail(s_root) = •
  fail(h_from_s) = h     # "sh" → longest proper suffix in trie = "h"
  fail(e_from_sh) = e    # "she" → longest proper suffix in trie = "he"

Text "ushers":
  u → no path, stay at •
  s → root.children[s], at "s"
  h → "s".children[h], at "sh"
  e → "sh".children[e], at "she" — output: ["she", "he"] (via fail-output of "she" → "he")
  r → no child "r" at "she"; fail("she") = "e"; "e".children[r] = "her", at "her"
  s → "her".children[s] = "hers" — output: ["hers"]

Matches: she@idx 1, he@idx 2, hers@idx 2.
```

## bruteForce
Run each pattern through the text independently: O(p · n) where p = #patterns. For 10,000 patterns + 1M text: 10^10 ops, hopeless.

## optimal
**Build trie** in O(∑|pattern|):
```
class Node: pass    # children: {char: Node}, fail: Node, out: [pattern_ids]
def build_trie(patterns):
    root = Node(); root.children = {}; root.fail = None; root.out = []
    for pid, pat in enumerate(patterns):
        node = root
        for c in pat:
            node = node.children.setdefault(c, Node())
            if not hasattr(node, 'children'): node.children = {}; node.out = []
        node.out.append(pid)
    return root
```

**Compute fail links via BFS** in O(trie size):
```
from collections import deque
def build_failures(root):
    q = deque()
    for c, child in root.children.items():
        child.fail = root
        q.append(child)
    while q:
        node = q.popleft()
        for c, child in node.children.items():
            # find longest proper suffix that's a prefix of some pattern
            f = node.fail
            while f and c not in f.children: f = f.fail
            child.fail = f.children[c] if f and c in f.children else root
            # merge output via fail link (output suffix chain)
            child.out = child.out + child.fail.out
            q.append(child)
```

**Scan text** in O(|text| + #matches):
```
def search(root, text):
    matches = []
    node = root
    for i, c in enumerate(text):
        while node and c not in node.children: node = node.fail
        node = node.children[c] if node else root
        if node.out:
            for pid in node.out:
                matches.append((i, pid))
    return matches
```

## complexity
- **Build**: O(∑|pattern|) for trie + O(trie nodes) for failures.
- **Search**: O(|text| + #matches).
- **Memory**: O(trie nodes). For DNA-style small alphabets, use arrays instead of dicts.

## pitfalls
- **Output merge along fail chain** is the easy-to-miss step — when you reach a node, ALL patterns ending on the fail-chain from this node are also matches at this position.
- **Failure computation must be BFS** (level-order), not DFS — fail(node) needs the parent's fail computed.
- **Goto vs failure**: textbooks distinguish "goto function" (children) from "failure function" (fail links). Modern implementations merge them: `goto(u, c) = children[c] if present, else goto(fail(u), c)`. Cache or not — either works.
- **Memory blowup**: a trie over 1M random short patterns can use GB. Use double-array tries or compressed AC automata if memory matters.
- **Unicode / multibyte chars**: AC operates on the trie alphabet. For Unicode, either work on byte sequences (UTF-8) or use char-by-char with a map-backed children dict.

## interviewTips
- For "match many patterns in a text" → Aho-Corasick.
- Mention `O(n + total + matches)` — emphasize the multi-pattern speedup.
- Walk through fail links on a small example — interviewers love seeing the BFS.
- For senior interviews, contrast with **suffix automaton** (better for many queries on one text), **Rabin-Karp** (multi-pattern via rolling hashes, simpler but slower), and **suffix array + binary search** (k log n per query).

## code.python
```python
from collections import deque

class AC:
    def __init__(self, patterns):
        self.root = {}
        self.fail = {id(self.root): None}
        self.out = {id(self.root): []}
        for pid, p in enumerate(patterns):
            node = self.root
            for c in p:
                node = node.setdefault(c, {})
                if id(node) not in self.out: self.out[id(node)] = []
            self.out[id(node)].append(pid)
        # BFS for failures
        q = deque()
        for c, child in self.root.items():
            if isinstance(child, dict):
                self.fail[id(child)] = self.root
                q.append(child)
        while q:
            node = q.popleft()
            for c, child in node.items():
                if not isinstance(child, dict): continue
                f = self.fail[id(node)]
                while f is not None and c not in f: f = self.fail.get(id(f))
                self.fail[id(child)] = f[c] if (f and c in f and isinstance(f[c], dict)) else self.root
                self.out[id(child)] = self.out.get(id(child), []) + self.out.get(id(self.fail[id(child)]), [])
                q.append(child)

    def search(self, text):
        out = []; node = self.root
        for i, c in enumerate(text):
            while node is not self.root and c not in node:
                node = self.fail[id(node)] or self.root
            if c in node and isinstance(node[c], dict): node = node[c]
            for pid in self.out.get(id(node), []): out.append((i, pid))
        return out

ac = AC(['he','she','his','hers'])
print(ac.search('ushers'))
```

## code.javascript
```javascript
class ACNode { constructor() { this.children = {}; this.fail = null; this.out = []; } }
function buildAC(patterns) {
  const root = new ACNode();
  for (let pid = 0; pid < patterns.length; pid++) {
    let n = root;
    for (const c of patterns[pid]) {
      n.children[c] = n.children[c] || new ACNode();
      n = n.children[c];
    }
    n.out.push(pid);
  }
  const q = [];
  for (const c in root.children) { root.children[c].fail = root; q.push(root.children[c]); }
  while (q.length) {
    const n = q.shift();
    for (const c in n.children) {
      const ch = n.children[c];
      let f = n.fail;
      while (f && !(c in f.children)) f = f.fail;
      ch.fail = (f && f.children[c]) || root;
      ch.out = [...ch.out, ...ch.fail.out];
      q.push(ch);
    }
  }
  return root;
}
```

## code.java
```java
import java.util.*;
class AC {
    static class Node { Map<Character, Node> c = new HashMap<>(); Node fail; List<Integer> out = new ArrayList<>(); }
    final Node root = new Node();
    public AC(List<String> patterns) {
        for (int pid = 0; pid < patterns.size(); pid++) {
            Node n = root;
            for (char ch : patterns.get(pid).toCharArray()) n = n.c.computeIfAbsent(ch, k -> new Node());
            n.out.add(pid);
        }
        Queue<Node> q = new ArrayDeque<>();
        for (Node ch : root.c.values()) { ch.fail = root; q.add(ch); }
        while (!q.isEmpty()) {
            Node n = q.poll();
            for (var e : n.c.entrySet()) {
                Node f = n.fail;
                while (f != null && !f.c.containsKey(e.getKey())) f = f.fail;
                e.getValue().fail = f != null ? f.c.get(e.getKey()) : root;
                e.getValue().out.addAll(e.getValue().fail.out);
                q.add(e.getValue());
            }
        }
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <map>
#include <queue>
#include <string>
struct ACNode { std::map<char, ACNode*> c; ACNode* fail = nullptr; std::vector<int> out; };
class AC {
    ACNode* root = new ACNode();
public:
    AC(const std::vector<std::string>& patterns) {
        for (int pid = 0; pid < patterns.size(); pid++) {
            ACNode* n = root;
            for (char ch : patterns[pid]) {
                if (!n->c.count(ch)) n->c[ch] = new ACNode();
                n = n->c[ch];
            }
            n->out.push_back(pid);
        }
        std::queue<ACNode*> q;
        for (auto& [ch, child] : root->c) { child->fail = root; q.push(child); }
        while (!q.empty()) {
            ACNode* n = q.front(); q.pop();
            for (auto& [ch, child] : n->c) {
                ACNode* f = n->fail;
                while (f && !f->c.count(ch)) f = f->fail;
                child->fail = (f && f->c.count(ch)) ? f->c[ch] : root;
                child->out.insert(child->out.end(), child->fail->out.begin(), child->fail->out.end());
                q.push(child);
            }
        }
    }
};
```
