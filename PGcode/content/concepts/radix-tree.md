---
slug: radix-tree
module: trees
title: Radix Tree (Compressed Trie)
subtitle: Like a trie, but consecutive single-child nodes collapse into one edge labelled with a string — O(k) lookup with much less memory.
difficulty: Advanced
position: 27
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Morrison (1968) — PATRICIA"
    url: ""
status: published
---

## intro
A standard trie stores one character per edge. For a set of long keys with few branching points, that creates long chains of single-child nodes — wasteful. A **radix tree** (also called a **PATRICIA trie** or **compressed trie**) merges every chain of single-child nodes into one edge labelled with the concatenated string. Lookups stay O(k) where k is the key length, but memory drops dramatically.

## whyItMatters
Radix trees power:
- **IP routing tables** (longest-prefix match on IP addresses) — Linux kernel uses a radix tree for the FIB.
- **Database indexes** for variable-length string keys (used by FoundationDB, LMDB-related stores).
- **In-memory key-value stores** for very long keys (e.g., URLs).
- **Spell-checkers and autocomplete** where the dictionary is fixed and queries are frequent.

The space win over a plain trie scales with the average chain length — easily 10-100× on real-world string sets.

## intuition
Walk the input character-by-character. At each node, edges are labelled with strings (not just chars). To match input prefix `p` against an edge labelled `e`:
- If `p` and `e` share a common prefix shorter than `e`, **split** the edge: insert a new internal node at the divergence point. Now both new sub-edges have shorter labels.
- If `p` extends past `e`, descend into the child and continue with the suffix of `p`.

The tree stays "minimal" — every internal node either is terminal (a key ends here) or has at least 2 children.

## visualization
```
Plain trie of {"romane", "romanus", "romulus"}:

r-o-m-a-n-e
        n-u-s
    u-l-u-s

(many single-child nodes)

Radix tree of the same set:

       (root)
         │ "rom"
         ▼
      [node]
       / "an"     \ "ulus"  (key terminal)
      ▼            ▼
     "e"  "us"   (no children)
     (terminal) (terminal)
```

## bruteForce
A plain trie. O(k) lookup, O(total chars × alphabet) memory. Wasteful when chains are long.

## optimal
**Insert(key)**:
1. Walk from root. At each step, find the edge whose label shares the longest common prefix with the remaining key.
2. If no edge starts with the key's first character → add a new leaf.
3. If the edge's label is a strict prefix of the remaining key → descend, recurse on the rest of the key.
4. If they share a partial prefix but diverge → split the edge at the divergence point: create a new internal node, two children (one for the original suffix, one for the new suffix).
5. If they're identical → mark the destination as terminal.

**Lookup(key)** is the same walk but without modifications.

**Delete** requires care: after removing a leaf, merge a single-child non-terminal back with its parent.

For **longest prefix match** (the IP routing use case), walk as deep as you can match; remember the last terminal node you passed; return that.

## complexity
- **Lookup / insert / delete**: O(k) where k is key length.
- **Space**: O(total characters across keys + number of internal nodes). Internal nodes ≤ number of keys − 1.
- **Versus hash map**: hash map is also O(k) lookup but doesn't support prefix queries or longest-prefix-match.

## pitfalls
- **Edge splitting**: easy to get wrong. Walk through the case "key 'foo' exists, insert 'foobar'" by hand once.
- **Empty key**: the root itself can be terminal.
- **Variable alphabets**: storing children as a sorted array vs a hash map vs an array indexed by char-code is a memory/speed tradeoff. ASCII → 128-element array is common.
- **Concurrency**: copy-on-write radix trees (used in Linux FIB) avoid locks for readers. Plain mutable ones need locks.
- **Confusing radix tree with Adaptive Radix Tree (ART)**: ART adds node-fanout variants (4 / 16 / 48 / 256) for cache efficiency — same asymptotic, ~10× faster in practice.

## interviewTips
- The trigger: "many long string keys, want prefix / longest-prefix queries fast" → radix tree.
- For IP routing specifically, mention **longest-prefix match** explicitly and the binary-trie variant for IPv4.
- Compare with **plain trie** (simpler, more memory) and **Adaptive Radix Tree** (cache-friendly variant).
- For senior interviews, mention **suffix tree** as the "all suffixes of one string in a radix tree" specialization — a totally different application of the same idea.

## code.python
```python
class Node:
    __slots__ = ('children', 'terminal')
    def __init__(self):
        self.children = {}      # edge_label_first_char -> (edge_label, child_node)
        self.terminal = False

class RadixTree:
    def __init__(self):
        self.root = Node()

    def insert(self, key):
        node = self.root
        i = 0
        while i < len(key):
            c = key[i]
            if c not in node.children:
                child = Node(); child.terminal = True
                node.children[c] = (key[i:], child)
                return
            edge, child = node.children[c]
            j = 0
            while j < len(edge) and i + j < len(key) and edge[j] == key[i + j]:
                j += 1
            if j == len(edge):
                node = child; i += j
                continue
            # split
            mid = Node()
            node.children[c] = (edge[:j], mid)
            mid.children[edge[j]] = (edge[j:], child)
            if i + j == len(key):
                mid.terminal = True
            else:
                leaf = Node(); leaf.terminal = True
                mid.children[key[i + j]] = (key[i + j:], leaf)
            return
        node.terminal = True

    def contains(self, key):
        node = self.root
        i = 0
        while i < len(key):
            c = key[i]
            if c not in node.children: return False
            edge, child = node.children[c]
            if key[i:i + len(edge)] != edge: return False
            i += len(edge); node = child
        return node.terminal

rt = RadixTree()
for w in ["romane", "romanus", "romulus"]: rt.insert(w)
print(rt.contains("romanus"))    # True
print(rt.contains("roman"))      # False
```

## code.javascript
```javascript
// Sketch — same algorithm, edges keyed by first character.
class Node { constructor() { this.children = new Map(); this.terminal = false; } }
class RadixTree {
  constructor() { this.root = new Node(); }
  // insert + contains follow the same edge-split algorithm as the Python version.
}
```

## code.java
```java
import java.util.*;
class RadixTree {
    static class Node { Map<Character, Object[]> children = new HashMap<>(); boolean terminal; }
    final Node root = new Node();
    // insert + contains — same edge-split algorithm.
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <string>
struct RNode {
    std::unordered_map<char, std::pair<std::string, RNode*>> children;
    bool terminal = false;
};
// insert + contains — same edge-split algorithm. Memory ownership left to the caller.
```
