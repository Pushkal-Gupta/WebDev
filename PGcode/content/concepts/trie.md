---
slug: trie
module: trees-balanced-disk
title: Trie (Prefix Tree)
subtitle: O(L) lookup of strings sharing common prefixes.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "cp-algorithms — Trees and tree algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/binary_tree/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
A trie ("retrieval tree") stores strings character-by-character along tree paths, sharing common prefixes. Inserting and looking up a string of length L cost O(L) — independent of how many strings are in the trie. It's the data structure of choice for autocomplete, spell-check, prefix-matching, IP routing, and DNA pattern indexing.

## whyItMatters
Hash maps give `O(L)` lookup but only for exact match. A trie gives the same exact-match cost and adds prefix queries in time proportional to the result size — impossible to match with a hash. Every search-as-you-type box (Google, GitHub code search, Slack channel switcher) sits on a trie or a close cousin. Linux's IP routing table is a compressed-trie (radix tree) so longest-prefix match runs in `O(32)` instead of `O(N)` across a million routes. Redis stores its key namespace as a radix tree for the same reason. Knuth credits Edward Fredkin (1960) with the structure; the name comes from re*trie*val. Spell-checkers, autocomplete, IP firewalls, and DNA-sequence aligners all run on tries.

## intuition
A trie is a tree where each edge is labeled with one character and each path from the root spells a prefix. Storing the words `cat`, `car`, `cart` puts a `c` edge at the root, an `a` edge below it, then two children — `t` (with `end = true` for `cat` and an `r → t` chain ending in another `end = true` for `cart`). Shared prefixes share nodes, which is why a dictionary of 200,000 English words compresses to roughly the same memory whether you store one word or all of them: most letters are reused.

The key invariant is that every node represents exactly one prefix — the string spelled by following edges from the root. To look up a word, walk character by character; if you fall off the tree or end on a node that is not marked `is_word`, the word is absent. To list all words sharing a prefix, walk to the node for that prefix then DFS the subtree; you visit exactly as many nodes as there are matching characters. That `O(prefix + matches)` cost is what no hash can give you.

Variants tighten the same idea. A radix (compressed) trie merges chains of single-child nodes into one edge labeled with a substring — 4x less memory on natural-language data. A ternary search tree replaces the per-node array with a small BST and is cache-friendlier on Unicode inputs.

## visualization
After inserting `["car", "cat", "card"]`:
```
        (root)
          │
          c
          │
          a
         / \
        r*  t*
        │
        d*
```
Asterisk marks terminal nodes. `search("car")` walks c → a → r, sees terminal, returns true. `startsWith("ca")` walks c → a, doesn't need terminal — returns true.

## bruteForce
Store all strings in a list; for prefix queries, scan and filter. O(N × L) per query, where N is the total string count. For autocomplete on a 100,000-word dictionary, prohibitive. Trie collapses this to O(L + results).

## optimal
A node holds a children map (an array of 26 for ASCII lowercase, or a dict for arbitrary alphabets) and a boolean `is_end`. Insert walks the path, creating missing nodes along the way; lookup walks the path and reads `is_end` at the terminal; `startsWith` walks the path and returns true if no edge was missing. All three operations are `O(L)` where `L` is the length of the query string — they do not depend on `N`, the number of words stored.

```python
class Trie:
    def __init__(self):
        self.kids = {}
        self.end = False
    def insert(self, word):
        node = self
        for ch in word:
            node = node.kids.setdefault(ch, Trie())
        node.end = True
    def search(self, word):
        node = self._walk(word)
        return node is not None and node.end
    def startsWith(self, prefix):
        return self._walk(prefix) is not None
    def _walk(self, s):
        node = self
        for ch in s:
            if ch not in node.kids: return None
            node = node.kids[ch]
        return node
```

The critical line is `node.kids.setdefault(ch, Trie())`, which combines lookup and lazy creation into one step; without it you write five lines of `if ch not in node.kids: node.kids[ch] = Trie(); node = node.kids[ch]`. For production code on a fixed ASCII alphabet, replace the dict with a length-26 array of references — cuts allocation overhead by 3-5x. For very large dictionaries (DNA databases, IP-prefix tables) switch to a radix trie that stores substring labels per edge; this is what Redis, Linux's FIB lookup, and Aho-Corasick's goto function use under the hood.

## complexity
time: O(L) per insert, lookup, or `startsWith`, where L = string length.
space: O(N × L) worst case (no prefix sharing); much less in practice. Per-node overhead is significant — for tiny dictionaries, a sorted array + binary search may win.
notes: For huge dictionaries where memory matters, consider a *DAFSA* (directed acyclic finite-state automaton), which merges identical subtrees — often 10-100× smaller than a naive trie.

## pitfalls
- Forgetting to set `is_terminal = true` on insert — `search` will return false for the inserted word while still seeing it as a valid prefix.
- Hash-map children create allocation pressure; use arrays for small fixed alphabets.
- Deletion is tricky: don't just unset terminal — also prune dead branches, but only if no other word uses them as prefix.
- Treating "prefix" and "substring" as the same problem — a trie matches prefixes; for arbitrary substring matching, you need a **suffix trie / array** instead.

## interviewTips
- Trie is the right answer to: "implement autocomplete," "search words on a 2D grid with shared prefixes" (word search II), "longest common prefix of N strings," "stream of characters / word ending detection."
- Mention the alphabet-size optimization (`int[26]` vs `HashMap`) — interviewers love it.
- For "word search II" specifically, the trick is to put all words into a trie and DFS the grid once, pruning branches whose prefix isn't in the trie. Brute force is O(W × N²); trie+DFS is roughly O(N²).

## code.python
```python
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node['$'] = True

    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node: return False
            node = node[ch]
        return node.get('$', False)

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node: return False
            node = node[ch]
        return True
```

## code.javascript
```javascript
class Trie {
  constructor() { this.root = {}; }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = true;
  }
  search(word) {
    let node = this.root;
    for (const ch of word) { if (!node[ch]) return false; node = node[ch]; }
    return !!node.$;
  }
  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) { if (!node[ch]) return false; node = node[ch]; }
    return true;
  }
}
```

## code.java
```java
class Trie {
    static class Node {
        Node[] children = new Node[26];
        boolean terminal;
    }
    private final Node root = new Node();
    public void insert(String word) {
        Node node = root;
        for (char ch : word.toCharArray()) {
            int i = ch - 'a';
            if (node.children[i] == null) node.children[i] = new Node();
            node = node.children[i];
        }
        node.terminal = true;
    }
    public boolean search(String word) { Node n = walk(word); return n != null && n.terminal; }
    public boolean startsWith(String prefix) { return walk(prefix) != null; }
    private Node walk(String s) {
        Node node = root;
        for (char ch : s.toCharArray()) {
            Node next = node.children[ch - 'a'];
            if (next == null) return null;
            node = next;
        }
        return node;
    }
}
```

## code.cpp
```cpp
class Trie {
    struct Node { Node* children[26] = {}; bool terminal = false; };
    Node* root = new Node();
    Node* walk(const string& s) {
        Node* node = root;
        for (char ch : s) {
            Node* next = node->children[ch - 'a'];
            if (!next) return nullptr;
            node = next;
        }
        return node;
    }
public:
    void insert(string word) {
        Node* node = root;
        for (char ch : word) {
            int i = ch - 'a';
            if (!node->children[i]) node->children[i] = new Node();
            node = node->children[i];
        }
        node->terminal = true;
    }
    bool search(string word) { auto n = walk(word); return n && n->terminal; }
    bool startsWith(string prefix) { return walk(prefix) != nullptr; }
};
```
