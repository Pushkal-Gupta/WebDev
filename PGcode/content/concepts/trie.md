---
slug: trie
module: trees
title: Trie (Prefix Tree)
subtitle: O(L) lookup of strings sharing common prefixes.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
status: published
---

## intro
A trie ("retrieval tree") stores strings character-by-character along tree paths, sharing common prefixes. Inserting and looking up a string of length L cost O(L) — independent of how many strings are in the trie. It's the data structure of choice for autocomplete, spell-check, prefix-matching, IP routing, and DNA pattern indexing.

## whyItMatters
A hash map gives O(L) lookup too, but only for *exact* match. A trie gives the same exact-match cost *and* answers "all strings with this prefix" or "all strings that match this wildcard" in time proportional to the result size — which is impossible with a hash. Every search-as-you-type UI, every code completion engine, every router with longest-prefix matching uses a trie or a close variant (radix tree, suffix tree).

## intuition
Picture the dictionary `["car", "cat", "card", "dog"]` as a tree rooted at empty string. Two branches from root: 'c' and 'd'. Under 'c' → 'a' (shared by "car", "cat", "card"). Under 'a' → 'r' (shared by "car", "card") and 't' (just "cat"). Each node tracks whether it terminates a complete word. Insertion walks the path, creating nodes as needed; lookup walks the path returning false on a missing child.

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
A trie node = a dict (or array of size alphabet) from character to child node + a boolean `is_terminal`. Insertion / lookup / prefix-search are straight walks down the tree. For a small fixed alphabet (lowercase letters), use `child[26]` arrays for cache-friendliness; for arbitrary unicode, use a hash map.

For memory-tight cases, a **compressed trie / radix tree** merges chains of single-child nodes into single edges labeled by substrings. Same big-O, much smaller constant.

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
