---
slug: string-trie-radix
module: hashing
title: Radix Tree (Compressed Trie)
subtitle: Collapse single-child trie chains into edge labels to cut memory by an order of magnitude.
difficulty: Intermediate
position: 32
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Tries (Algorithms, 4th Edition)"
    url: "https://algs4.cs.princeton.edu/52trie/"
    type: book
  - title: "Trie & Compressed Trie — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/advanced-data-structure/radix-tree/"
    type: blog
  - title: "TheAlgorithms/Python — radix_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/trie/radix_tree.py"
    type: repo
status: published
---

A standard trie wastes a node per character; a radix tree (compressed trie / Patricia trie) merges any chain of single-child nodes into one node whose edge carries the full substring. Memory drops from O(sum of word lengths) nodes to O(number of distinct words) nodes, while lookup time stays O(|key|).

## intro
Standard tries are simple but bloated. "internationalization" alone burns 20 nodes — most of them have exactly one child, so they encode nothing useful. A radix tree replaces every single-child chain with one node carrying the concatenated label. The asymptotic time is unchanged; the constants drop dramatically. Linux's IP routing table (`net/ipv4/fib_trie.c`) and many filesystems use exactly this idea.

## whyItMatters
- **IP routing**: longest-prefix-match against a 700K-entry BGP table — radix tree gets it in O(32) memory accesses with a tiny footprint.
- **Filesystems**: ext4 directory hashing; ZFS metadata.
- **Databases**: PostgreSQL `gist_trgm_ops`; many key-value stores (Adaptive Radix Tree, used in HyPer/DuckDB).
- **Autocomplete with millions of entries**: the trie won't fit in cache, the radix tree will.

The benefit is *cache locality* and *node count*, not big-O.

## intuition
Walk a normal trie. Any time you find a path of length k where every internal node has exactly one child, that path encodes a fixed substring — store the substring as the edge label and skip the intermediate nodes. The only nodes that survive are: (a) terminals, (b) branching points (≥ 2 children).

## visualization
```
Words: ["romane", "romanus", "romulus", "rubens"]

Trie (compressed → radix tree):

                (root)
                 / \
               r   ...
              /
            (node)        edges labeled with strings, not single chars
          /        \
         "om"       "ubens"  -> terminal
        /          
     (node)
    /      \
   "an"     "ulus" -> terminal
   /
 (node)
 /    \
"e"    "us"
 |       |
TERM   TERM
```

Compare to the plain trie which needs a node for every single character of every word.

## bruteForce
Plain trie: O(sum of |word|) nodes. With 1M words averaging 20 chars and Unicode hash-map children, easily 1 GB+ of overhead.

## optimal
Two operations to get right:

**Insert(word)**:
1. Walk from root. At each step, look at the child whose edge starts with `word[i]`.
2. If no such child, create a new terminal child with edge label = remainder of `word`.
3. If the edge label is a prefix of the remaining `word`, descend and continue.
4. If the edge label and remaining `word` share a common prefix shorter than the label, **split** the edge: insert an intermediate node at the split point, give it two children (the old subtree and the new terminal for the remainder of `word`).
5. If `word` is exhausted exactly at a node, mark it terminal.

**Find(prefix)**:
1. Walk down matching whole edge labels against the prefix.
2. If you consume the entire prefix and land on (or inside) a label, success.
3. Mismatch on a label → not present.

**Adaptive Radix Tree (ART)** further optimizes by varying the child-array layout per node — Node4, Node16, Node48, Node256 — keeping the dense or sparse case cheap. That's the production-grade variant.

## complexity
- **Lookup / insert**: O(|key|) character comparisons; tighter constant than a plain trie because each step skips many one-child nodes.
- **Space**: O(number of distinct nodes), bounded by O(number of words). Each word adds at most 2 nodes (split + new terminal).
- **Cache misses**: roughly 1 per branching node — much friendlier than a plain trie.

## pitfalls
- **Forgetting the split case**: inserting "team" after "test" must split the `"te"` edge — implementations that only handle "extend" or "new child" break here.
- **Edge labels as substrings of the original word**: store offsets into the original string to save memory, but you must keep the string alive.
- **Marking terminals**: every node carries a `is_terminal` flag and optionally a value; do not skip it just because the edge label "ends a word."
- **Concurrent updates**: edge splits move data — making radix trees lock-free is hard (this is why ART has a specialized concurrent variant).
- **Confusing Patricia trie (binary) with radix tree (k-ary)**: same family, different alphabets.

## interviewTips
- Trigger phrases: "longest-prefix match," "IP routing table," "memory-efficient prefix index," "millions of words autocomplete."
- Lead with: "I'd use a trie, but since most internal nodes have one child, I'd compress to a radix tree."
- Mention **Adaptive Radix Tree** for senior loops — knowing the name signals you've read papers.
- Compare with **suffix automaton** (compresses *suffixes* of one string, not *prefixes* of many strings) and **B+ trees** (disk-based, different access pattern).

## code.python
```python
class RadixNode:
    __slots__ = ("children", "is_terminal", "value")
    def __init__(self):
        self.children = {}   # first char -> (label, RadixNode)
        self.is_terminal = False
        self.value = None

class RadixTree:
    def __init__(self):
        self.root = RadixNode()

    def insert(self, key, value=None):
        node, i = self.root, 0
        while i < len(key):
            first = key[i]
            if first not in node.children:
                child = RadixNode()
                child.is_terminal = True
                child.value = value
                node.children[first] = (key[i:], child)
                return
            label, child = node.children[first]
            j = 0
            while j < len(label) and i + j < len(key) and label[j] == key[i + j]:
                j += 1
            if j == len(label):
                node, i = child, i + j
                continue
            # split
            split = RadixNode()
            split.children[label[j]] = (label[j:], child)
            node.children[first] = (label[:j], split)
            if i + j == len(key):
                split.is_terminal = True
                split.value = value
            else:
                new_leaf = RadixNode()
                new_leaf.is_terminal = True
                new_leaf.value = value
                split.children[key[i + j]] = (key[i + j:], new_leaf)
            return
        node.is_terminal = True
        node.value = value

    def find(self, key):
        node, i = self.root, 0
        while i < len(key):
            first = key[i]
            if first not in node.children: return None
            label, child = node.children[first]
            if not key.startswith(label, i): return None
            i += len(label); node = child
        return node.value if node.is_terminal else None

t = RadixTree()
for w in ["romane", "romanus", "romulus", "rubens"]:
    t.insert(w, w.upper())
print(t.find("romulus"))  # ROMULUS
```

## code.javascript
```javascript
class RadixNode {
  constructor() { this.children = new Map(); this.term = false; this.value = null; }
}
class RadixTree {
  constructor() { this.root = new RadixNode(); }
  insert(key, value = null) {
    let node = this.root, i = 0;
    while (i < key.length) {
      const f = key[i];
      if (!node.children.has(f)) {
        const c = new RadixNode(); c.term = true; c.value = value;
        node.children.set(f, [key.slice(i), c]); return;
      }
      const [label, child] = node.children.get(f);
      let j = 0;
      while (j < label.length && i + j < key.length && label[j] === key[i + j]) j++;
      if (j === label.length) { node = child; i += j; continue; }
      const split = new RadixNode();
      split.children.set(label[j], [label.slice(j), child]);
      node.children.set(f, [label.slice(0, j), split]);
      if (i + j === key.length) { split.term = true; split.value = value; }
      else {
        const leaf = new RadixNode(); leaf.term = true; leaf.value = value;
        split.children.set(key[i + j], [key.slice(i + j), leaf]);
      }
      return;
    }
    node.term = true; node.value = value;
  }
  find(key) {
    let node = this.root, i = 0;
    while (i < key.length) {
      const f = key[i];
      if (!node.children.has(f)) return null;
      const [label, child] = node.children.get(f);
      if (key.slice(i, i + label.length) !== label) return null;
      i += label.length; node = child;
    }
    return node.term ? node.value : null;
  }
}
```

## code.java
```java
import java.util.*;
class RadixTree {
    static class Node {
        Map<Character, Object[]> children = new HashMap<>();
        boolean term; Object value;
    }
    Node root = new Node();
    void insert(String key, Object value) {
        Node node = root; int i = 0;
        while (i < key.length()) {
            char f = key.charAt(i);
            Object[] edge = node.children.get(f);
            if (edge == null) {
                Node c = new Node(); c.term = true; c.value = value;
                node.children.put(f, new Object[]{key.substring(i), c});
                return;
            }
            String label = (String) edge[0]; Node child = (Node) edge[1];
            int j = 0;
            while (j < label.length() && i + j < key.length() && label.charAt(j) == key.charAt(i + j)) j++;
            if (j == label.length()) { node = child; i += j; continue; }
            Node split = new Node();
            split.children.put(label.charAt(j), new Object[]{label.substring(j), child});
            node.children.put(f, new Object[]{label.substring(0, j), split});
            if (i + j == key.length()) { split.term = true; split.value = value; }
            else {
                Node leaf = new Node(); leaf.term = true; leaf.value = value;
                split.children.put(key.charAt(i + j), new Object[]{key.substring(i + j), leaf});
            }
            return;
        }
        node.term = true; node.value = value;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <string>
#include <memory>
struct RadixNode {
    std::unordered_map<char, std::pair<std::string, RadixNode*>> children;
    bool term = false;
};
struct RadixTree {
    RadixNode* root = new RadixNode();
    void insert(const std::string& key) {
        RadixNode* node = root; size_t i = 0;
        while (i < key.size()) {
            char f = key[i];
            auto it = node->children.find(f);
            if (it == node->children.end()) {
                auto* c = new RadixNode(); c->term = true;
                node->children[f] = {key.substr(i), c};
                return;
            }
            auto& [label, child] = it->second;
            size_t j = 0;
            while (j < label.size() && i + j < key.size() && label[j] == key[i + j]) j++;
            if (j == label.size()) { node = child; i += j; continue; }
            auto* split = new RadixNode();
            split->children[label[j]] = {label.substr(j), child};
            std::string head = label.substr(0, j);
            node->children[f] = {head, split};
            if (i + j == key.size()) split->term = true;
            else {
                auto* leaf = new RadixNode(); leaf->term = true;
                split->children[key[i + j]] = {key.substr(i + j), leaf};
            }
            return;
        }
        node->term = true;
    }
};
```
