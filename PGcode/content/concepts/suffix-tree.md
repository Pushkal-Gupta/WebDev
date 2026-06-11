---
slug: suffix-tree
module: strings-advanced
title: Suffix Tree
subtitle: A compressed trie of every suffix of a string — substring queries, longest repeated substring, and longest common substring all in linear time.
difficulty: Advanced
position: 26
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "cp-algorithms — Suffix Tree (Ukkonen's algorithm)"
    url: "https://cp-algorithms.com/string/suffix-tree-ukkonen.html"
    type: blog
  - title: "Stanford CS166 — Suffix Trees lecture notes"
    url: "https://web.stanford.edu/class/cs166/lectures/01/Slides01.pdf"
    type: paper
  - title: "Ukkonen 1995 — On-line construction of suffix trees"
    url: "https://www.cs.helsinki.fi/u/ukkonen/SuffixT1withFigs.pdf"
    type: paper
  - title: "Gusfield — Algorithms on Strings, Trees, and Sequences (Ch. 5-6)"
    url: "https://www.cambridge.org/core/books/algorithms-on-strings-trees-and-sequences/F0B095049C7E6EF5356F0A26686C20D3"
    type: book
status: published
---

## intro
A **suffix tree** is a compressed trie containing every suffix of a string `S` of length `n`, with `$` appended so that no suffix is a prefix of another. Once built, it answers "is `P` a substring of `S`?" in `O(|P|)`, finds the longest repeated substring in `O(n)`, and finds the longest common substring of two strings in `O(n + m)`. Ukkonen's 1995 algorithm builds it on-line in `O(n)` time.

## whyItMatters
Suffix trees turn dozens of seemingly-distinct string problems into the same tree walk: substring search, longest repeated substring, longest common substring of `k` strings, longest palindromic substring (via generalized tree of `S` and `reverse(S)`), the number of distinct substrings, and the suffix-link backbone used by Aho-Corasick. They are the data structure behind the BWA aligner, classic bioinformatics pipelines (Mummer, REPuter), genome assembly tools, and Git's diff-detection heuristics. In interviews they signal that a candidate can reach for the right tool when KMP and Z-algorithm hit their ceiling; in production they remain the canonical structure for any task where many queries hit the same indexed text and an extra `4n` to `20n` bytes of memory buys orders-of-magnitude speedup.

## intuition
Picture every suffix of `S = banana$` written out as a separate string: `banana$`, `anana$`, `nana$`, `ana$`, `na$`, `a$`, `$`. Drop all seven into a trie — each character is one node, shared prefixes share the same path from the root. A trie like that has up to `n^2 / 2` nodes, which is too many. The **suffix tree** is the same trie with every chain of single-child nodes collapsed into a single edge labelled with the whole substring it represents. The result has at most `2n - 1` nodes and `2n - 2` edges. Each leaf corresponds to one suffix; the leaf's depth (sum of edge-label lengths) is the suffix length; the leaf can be tagged with the starting index of that suffix.

Now the entire algorithmic power comes from a single observation: **any substring of `S` is a prefix of some suffix**. So to check whether `P` is a substring, you walk down from the root, consuming characters of `P` along edge labels. If you ever fall off the tree (a character of `P` does not match the next character of the current edge label), `P` is not a substring; if you exhaust `P`, you've located the set of leaves whose suffixes start with `P` — those leaves' indices are exactly the occurrences. Substring queries cost `O(|P|)` regardless of `n`.

The expensive part is building the tree. Naive construction inserts each suffix one at a time, costing `O(n^2)`. Ukkonen's algorithm processes the text left to right, maintaining the suffix tree of the prefix seen so far, and uses **suffix links** — pointers from internal node `xα` to internal node `α` — to jump across the tree in amortized `O(1)` per character extension. The bookkeeping is intricate (active node + active edge + active length + remaining suffixes) but the total work over the whole string is `O(n)`. For interview discussion you usually only need to know the structure and the query algorithm; for actual implementation prefer a battle-tested library (or use suffix arrays + LCP, which give most of the same queries with simpler code).

## visualization
```
S = banana$            suffix tree:

                     root
                    / | | \
                   a  b n  $
                  /|  |  \
                 $ na bana na$
                /  |  na$  |
               2   $       4
                   |
                   na$
                   / \
                 ...  ...

Leaves tagged with the starting index of the suffix they represent:
  banana$  -> leaf 0
  anana$   -> leaf 1
  nana$    -> leaf 2
  ana$     -> leaf 3
  na$      -> leaf 4
  a$       -> leaf 5
  $        -> leaf 6
```

## bruteForce
**Naive insertion of every suffix into a compressed trie**: walk each suffix from the root, split edges when a mismatch happens, append a new leaf. There are `n` suffixes, and each insertion can take up to `O(n)` work walking + splitting, so total cost is `O(n^2)` time and `O(n)` nodes. Workable for `n` up to a few thousand and easy to write — useful as a reference implementation and for unit-testing Ukkonen's output, but unacceptable on genome-scale inputs where `n` is in the hundreds of millions.

## optimal
**Ukkonen's algorithm** builds the suffix tree on-line in `O(n)` total time. The construction processes characters of `S` left to right. At each step `i`, the algorithm extends every suffix of `S[0..i]` by the new character `S[i]`. Three extension rules cover all cases: **Rule 1** (the suffix ends at a leaf — just extend the leaf's edge by 1, handled implicitly by storing "current end" as a global pointer), **Rule 2** (the next character is missing — create a new internal node + leaf), **Rule 3** (the next character already exists — do nothing, the suffix is implicitly represented; this is the *showstopper* rule that ends the current phase early).

The cleverness is the **active point** — a triple (active_node, active_edge, active_length) describing where the next extension starts — and **suffix links**, which let you jump from the internal node representing `xα` directly to the node representing `α` in `O(1)`. Without suffix links, every extension would re-walk from the root, costing `O(n)`. With them, the amortized cost per character is `O(1)` because each suffix link traversal either consumes a character or shortens the active length.

```python
# Build with a clean cp-algorithms style: see code.python section below.
# In an interview, sketch the data structure + query algorithm and switch
# to suffix-array + LCP for an actually-codable answer.
```

For pure substring search, prefer KMP (`O(n + m)`, trivial code). Suffix trees pay off when the same text is queried many times, or when you need longest-repeated-substring (`O(n)` — deepest internal node), longest-common-substring of `S` and `T` (build a *generalized* suffix tree of `S#T$` and find the deepest internal node whose leaves include indices from both halves), or count of distinct substrings (`= sum of edge label lengths`).

In practice, most engineers reach for **suffix arrays + LCP arrays** instead — they answer the same queries with simpler code, less memory (`O(n)` integers vs. `O(n)` nodes and pointers), and better cache behaviour. The suffix tree's main remaining edge is the `O(1)` LCA-based longest-common-prefix query in a generalized tree.

## complexity
- **Build:** `O(n)` time and `O(n)` space with Ukkonen's algorithm (constant alphabet); `O(n * sigma)` with a children array, `O(n log sigma)` with a balanced map. Naive build is `O(n^2)`.
- **Substring query** for pattern `P`: `O(|P|)`.
- **Longest repeated substring:** `O(n)` — deepest internal node by string depth.
- **Longest common substring** of two strings: `O(n + m)` via generalized tree.
- **Number of distinct substrings:** `O(n)` — sum of edge-label lengths.

## pitfalls
- **Forgetting the sentinel `$`**: without a unique terminator, one suffix can be a prefix of another and end mid-edge, breaking the leaf-per-suffix invariant.
- **Storing edge labels as strings**: blows memory to `O(n^2)`. Always store edges as `(start, end)` index pairs into the original text and use a shared `global_end` for leaves so Rule 1 extensions are free.
- **Skipping suffix-link updates after creating an internal node**: every node created in phase `i` must receive a suffix link by the end of phase `i` (or in phase `i+1`). Forgetting this turns `O(n)` into `O(n^2)`.
- **Off-by-one in the active-length / active-edge bookkeeping**: classic Ukkonen bug. After consuming a character, if `active_length` equals the current edge length, you need to walk down: set `active_node` to the child, `active_edge` to the next character, `active_length = 0`.
- **Treating the children map as `O(1)` for variable alphabets**: hash maps add a constant factor and break the `O(n)` bound on adversarial cases — use a fixed-size array when the alphabet is small (DNA, ASCII).
- **Building over Unicode characters directly**: normalize to a fixed byte alphabet first, otherwise the children-map cost dominates.

## interviewTips
- For substring search say KMP / Z-algorithm first; mention suffix trees / arrays as the indexed-many-queries upgrade. Naming Ukkonen and saying "linear on-line construction with suffix links" signals depth.
- If asked to *implement* a suffix tree on a whiteboard, switch to **suffix array + LCP**: same queries, far simpler code (DC3 or `O(n log^2 n)` sort-suffixes works on a board).
- Connect suffix trees to longest repeated substring (deepest internal node) and longest common substring (generalized tree, deepest node spanning both colours). These two questions appear in advanced rounds at Google, Meta, and bioinformatics-adjacent companies.

## code.python
```python
# Build a suffix tree the naive O(n^2) way (compressed trie of all suffixes).
# Edges store (start, end) index pairs into the text — never substrings —
# so the whole structure fits in O(n) space.

class Node:
    __slots__ = ("children", "start", "end", "suffix_index")
    def __init__(self, start=-1, end=-1):
        self.children = {}
        self.start = start
        self.end = end
        self.suffix_index = -1

class SuffixTree:
    def __init__(self, text):
        self.text = text + "$"
        self.root = Node()
        for i in range(len(self.text)):
            self._insert_suffix(i)

    def _insert_suffix(self, suffix_start):
        node = self.root
        i = suffix_start
        n = len(self.text)
        while i < n:
            ch = self.text[i]
            if ch not in node.children:
                leaf = Node(i, n - 1)
                leaf.suffix_index = suffix_start
                node.children[ch] = leaf
                return
            child = node.children[ch]
            j = child.start
            while j <= child.end and i < n and self.text[j] == self.text[i]:
                j += 1
                i += 1
            if j > child.end:
                node = child
                continue
            split = Node(child.start, j - 1)
            node.children[ch] = split
            child.start = j
            split.children[self.text[j]] = child
            leaf = Node(i, n - 1)
            leaf.suffix_index = suffix_start
            split.children[self.text[i]] = leaf
            return

    def contains(self, pattern):
        node = self.root
        i = 0
        while i < len(pattern):
            ch = pattern[i]
            if ch not in node.children:
                return False
            child = node.children[ch]
            j = child.start
            while j <= child.end and i < len(pattern):
                if self.text[j] != pattern[i]:
                    return False
                j += 1
                i += 1
            if i == len(pattern):
                return True
            node = child
        return True


if __name__ == "__main__":
    st = SuffixTree("banana")
    print(st.contains("nan"))   # True
    print(st.contains("nax"))   # False
    print(st.contains("anana")) # True
```

## code.javascript
```javascript
class Node {
  constructor(start = -1, end = -1) {
    this.children = new Map();
    this.start = start;
    this.end = end;
    this.suffixIndex = -1;
  }
}

class SuffixTree {
  constructor(text) {
    this.text = text + "$";
    this.root = new Node();
    for (let i = 0; i < this.text.length; i++) this.insertSuffix(i);
  }

  insertSuffix(suffixStart) {
    let node = this.root;
    let i = suffixStart;
    const n = this.text.length;
    while (i < n) {
      const ch = this.text[i];
      if (!node.children.has(ch)) {
        const leaf = new Node(i, n - 1);
        leaf.suffixIndex = suffixStart;
        node.children.set(ch, leaf);
        return;
      }
      const child = node.children.get(ch);
      let j = child.start;
      while (j <= child.end && i < n && this.text[j] === this.text[i]) {
        j++;
        i++;
      }
      if (j > child.end) {
        node = child;
        continue;
      }
      const split = new Node(child.start, j - 1);
      node.children.set(ch, split);
      child.start = j;
      split.children.set(this.text[j], child);
      const leaf = new Node(i, n - 1);
      leaf.suffixIndex = suffixStart;
      split.children.set(this.text[i], leaf);
      return;
    }
  }

  contains(pattern) {
    let node = this.root;
    let i = 0;
    while (i < pattern.length) {
      const ch = pattern[i];
      if (!node.children.has(ch)) return false;
      const child = node.children.get(ch);
      let j = child.start;
      while (j <= child.end && i < pattern.length) {
        if (this.text[j] !== pattern[i]) return false;
        j++;
        i++;
      }
      if (i === pattern.length) return true;
      node = child;
    }
    return true;
  }
}
```

## code.java
```java
import java.util.HashMap;
import java.util.Map;

class SuffixTree {
    static class Node {
        Map<Character, Node> children = new HashMap<>();
        int start, end;
        int suffixIndex = -1;
        Node(int start, int end) { this.start = start; this.end = end; }
    }

    private final String text;
    private final Node root = new Node(-1, -1);

    SuffixTree(String s) {
        this.text = s + "$";
        for (int i = 0; i < text.length(); i++) insertSuffix(i);
    }

    private void insertSuffix(int suffixStart) {
        Node node = root;
        int i = suffixStart;
        int n = text.length();
        while (i < n) {
            char ch = text.charAt(i);
            if (!node.children.containsKey(ch)) {
                Node leaf = new Node(i, n - 1);
                leaf.suffixIndex = suffixStart;
                node.children.put(ch, leaf);
                return;
            }
            Node child = node.children.get(ch);
            int j = child.start;
            while (j <= child.end && i < n && text.charAt(j) == text.charAt(i)) {
                j++;
                i++;
            }
            if (j > child.end) {
                node = child;
                continue;
            }
            Node split = new Node(child.start, j - 1);
            node.children.put(ch, split);
            child.start = j;
            split.children.put(text.charAt(j), child);
            Node leaf = new Node(i, n - 1);
            leaf.suffixIndex = suffixStart;
            split.children.put(text.charAt(i), leaf);
            return;
        }
    }

    boolean contains(String pattern) {
        Node node = root;
        int i = 0;
        while (i < pattern.length()) {
            char ch = pattern.charAt(i);
            if (!node.children.containsKey(ch)) return false;
            Node child = node.children.get(ch);
            int j = child.start;
            while (j <= child.end && i < pattern.length()) {
                if (text.charAt(j) != pattern.charAt(i)) return false;
                j++;
                i++;
            }
            if (i == pattern.length()) return true;
            node = child;
        }
        return true;
    }
}
```

## code.cpp
```cpp
#include <string>
#include <unordered_map>
#include <memory>
using namespace std;

struct Node {
    unordered_map<char, Node*> children;
    int start, end;
    int suffixIndex = -1;
    Node(int s = -1, int e = -1) : start(s), end(e) {}
};

class SuffixTree {
public:
    SuffixTree(const string& s) : text(s + "$"), root(new Node()) {
        for (int i = 0; i < (int)text.size(); i++) insertSuffix(i);
    }

    bool contains(const string& pattern) const {
        Node* node = root;
        int i = 0;
        while (i < (int)pattern.size()) {
            char ch = pattern[i];
            auto it = node->children.find(ch);
            if (it == node->children.end()) return false;
            Node* child = it->second;
            int j = child->start;
            while (j <= child->end && i < (int)pattern.size()) {
                if (text[j] != pattern[i]) return false;
                j++; i++;
            }
            if (i == (int)pattern.size()) return true;
            node = child;
        }
        return true;
    }

private:
    string text;
    Node* root;

    void insertSuffix(int suffixStart) {
        Node* node = root;
        int i = suffixStart, n = text.size();
        while (i < n) {
            char ch = text[i];
            auto it = node->children.find(ch);
            if (it == node->children.end()) {
                Node* leaf = new Node(i, n - 1);
                leaf->suffixIndex = suffixStart;
                node->children[ch] = leaf;
                return;
            }
            Node* child = it->second;
            int j = child->start;
            while (j <= child->end && i < n && text[j] == text[i]) { j++; i++; }
            if (j > child->end) { node = child; continue; }
            Node* split = new Node(child->start, j - 1);
            node->children[ch] = split;
            child->start = j;
            split->children[text[j]] = child;
            Node* leaf = new Node(i, n - 1);
            leaf->suffixIndex = suffixStart;
            split->children[text[i]] = leaf;
            return;
        }
    }
};
```
