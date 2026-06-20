---
slug: trie-autocomplete
module: hashing
title: Trie Autocomplete
subtitle: Prefix tree plus a small DFS yields top-K ranked autocomplete suggestions in O(P + K log K).
difficulty: Intermediate
position: 31
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Tries (Algorithms, 4th Edition)"
    url: "https://algs4.cs.princeton.edu/52trie/"
    type: book
  - title: "Trie (Prefix Tree) — Algorithms for Competitive Programming"
    url: "https://cp-algorithms.com/string/aho_corasick.html"
    type: blog
  - title: "TheAlgorithms/Python — trie.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/trie/trie.py"
    type: repo
status: published
---

## intro
Autocomplete is the canonical use case for a trie. Insert every dictionary word, store a frequency (or score) at each terminal, then on each keystroke walk the trie to the prefix node and DFS the subtree to gather candidates. Rank by score and emit the top K. The walk is O(prefix length); the gather is bounded by the number of matching words, not the dictionary size.

## whyItMatters
Every search bar, IDE completion, command palette, address-line suggester, and shell tab-completion shares this exact pattern. A 10 million word dictionary served from a flat array would scan 10 million entries per keystroke; the trie cuts each keystroke to "follow one pointer." For low-latency UX (sub-50 ms response under finger speed), the trie is the only viable structure short of a server-side index. Google's instant-search backend, JetBrains' IDE completion, GitHub's code-search drop-down, the macOS Spotlight launcher, and VS Code's command palette all use trie or radix-trie variants for the in-memory prefix index. Bash and zsh tab-completion frameworks use tries to suggest commands and arguments.

## intuition
A trie node represents "all strings that share this prefix." If the user has typed `inte`, every continuation lives in the subtree rooted at the `inte` node. To rank suggestions you need a score on each terminal — search-log frequency, recency, edit distance, click-through rate, or any combination. A small DFS over the subtree collects `(word, score)` pairs; a min-heap of size `K` keeps only the best.

The scoring step is where the design gets interesting. Naive DFS visits every word in the subtree, which is wasteful when the subtree has millions of entries and the user wants the top 10. The trick used by production engines is to *precompute and store the top-K words at each internal node during build*. Now a query walks to the prefix node in `O(|prefix|)` and immediately reads the cached top-K list — `O(|prefix| + K)` total, no DFS. The memory cost is `K` words per node, which for typical alphabets and dictionaries is fine.

The second knob is the children-map representation. For hot ASCII paths use an array indexed by character (`O(1)` lookup, dense memory). For cold Unicode paths use a hash map (more memory, but only for nodes that need it). The hybrid representation is what every production trie uses; storing every node as a 65,536-entry array would be wasteful for nodes that have only a handful of children.

## visualization
```
Dictionary: apple(5), app(8), apricot(2), banana(7)

Trie (counts at terminals):

         (root)
         /    \
        a      b
       / \      \
      p   p      a
      |   |      |
      r   l      n
      |   |      |
      i   e(5)   a
      |          |
      c          n
      |          |
      o          a(7)
      |
      t(2)

Prefix "ap" walk:  root -> a -> p
DFS from "ap":     {app(8), apple(5)}
Top-1 result:      "app"  (score 8)
```

## bruteForce
Linear scan: for each query prefix, iterate all N words, keep those starting with the prefix, sort by score, slice top K. Cost per keystroke: O(N · L) where L is average word length. At N = 10^6 this is 10^7+ ops per keystroke — UI feels frozen.

## optimal
Build a trie. On insert, walk or create one node per character and store `(word, score)` on the terminal node. On query, walk to the prefix node in `O(|prefix|)`; if it does not exist return empty. Otherwise read the precomputed top-K cache and return. For dynamic dictionaries (scores change continuously), maintain the top-K cache lazily and recompute on access if stale.

```python
class AutocompleteTrie:
    def __init__(self, K=10):
        self.kids = {}
        self.word = None
        self.score = 0
        self.top_k = []
        self.K = K
    def insert(self, word, score):
        node = self
        path = [self]
        for ch in word:
            node = node.kids.setdefault(ch, AutocompleteTrie(self.K))
            path.append(node)
        node.word = word
        node.score = score
        for n in path:
            n.top_k = self._merge(n.top_k, [(word, score)])
    def _merge(self, a, b):
        merged = a + b
        seen = {}
        for w, s in merged:
            if w not in seen or seen[w] < s: seen[w] = s
        ranked = sorted(seen.items(), key=lambda x: -x[1])
        return ranked[:self.K]
    def suggest(self, prefix):
        node = self
        for ch in prefix:
            if ch not in node.kids: return []
            node = node.kids[ch]
        return [w for w, _ in node.top_k]
```

The critical pattern is the `for n in path: n.top_k = self._merge(...)` update inside `insert` — every ancestor caches the top-K of its subtree, so the query is `O(|prefix| + K)` with no subtree traversal. For very large dictionaries (`>10^7` words) switch to a radix trie (compressed paths) to cut memory by 4-5x, and store the top-K cache as fixed-size arrays for cache locality. For typo tolerance, add a finite-state automaton wrapper that walks the trie with a bounded edit distance (Schulz-Mihov 2002) — the technique Google's spell-checker and Algolia use under the hood. For frequency-updated scores in a live system, run a background job that recomputes top-K caches in batches rather than on every score update.

## complexity
- **Build**: O(sum of word lengths).
- **Query**: O(|prefix| + S) where S is the size of the matching subtree. With per-node top-K caching: O(|prefix| + K).
- **Space**: O(sum of word lengths · alphabet branching). Usually dominated by the map per node.

## pitfalls
- **Storing the full word at every internal node** doubles memory. Store the word only at terminals; rebuild it from the DFS path if needed.
- **Forgetting to update scores** when the user actually selects a suggestion — recency feedback is what makes autocomplete feel alive.
- **DFS without a heap** on huge subtrees: a prefix of "a" might fan out to 10^5 words; the heap caps memory to K.
- **Locale-insensitive comparison**: lowercasing must happen once at insert and once at query, with the same locale.
- **Using a 26-slot array** when the alphabet is Unicode wastes 99% of memory.

## interviewTips
- Trigger phrase: "design Google autocomplete" or "search suggestion box."
- Lead with the trie, then *immediately* mention scoring and top-K — interviewers want to see that you know raw prefix matching is not enough.
- Discuss the **per-node cached top-K** optimization for senior loops; cite it as the standard production pattern.
- Mention edit-distance fuzzy matching as a follow-up — usually solved with a small DFS that allows up to D mismatches (Damerau-Levenshtein on a trie).
- For distributed systems, mention sharding the trie by first 2 characters.

## code.python
```python
import heapq

class TrieNode:
    __slots__ = ("children", "word", "score")
    def __init__(self):
        self.children = {}
        self.word = None
        self.score = 0

class Autocomplete:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word, score=1):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.word = word
        node.score = score

    def suggest(self, prefix, k=5):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]
        heap = []
        stack = [node]
        while stack:
            cur = stack.pop()
            if cur.word:
                if len(heap) < k:
                    heapq.heappush(heap, (cur.score, cur.word))
                elif cur.score > heap[0][0]:
                    heapq.heapreplace(heap, (cur.score, cur.word))
            stack.extend(cur.children.values())
        return [w for _, w in sorted(heap, reverse=True)]

ac = Autocomplete()
for w, s in [("apple", 5), ("app", 8), ("apricot", 2), ("banana", 7)]:
    ac.insert(w, s)
print(ac.suggest("ap", 2))  # ['app', 'apple']
```

## code.javascript
```javascript
class TrieNode {
  constructor() { this.children = new Map(); this.word = null; this.score = 0; }
}
class Autocomplete {
  constructor() { this.root = new TrieNode(); }
  insert(word, score = 1) {
    let n = this.root;
    for (const c of word) {
      if (!n.children.has(c)) n.children.set(c, new TrieNode());
      n = n.children.get(c);
    }
    n.word = word; n.score = score;
  }
  suggest(prefix, k = 5) {
    let n = this.root;
    for (const c of prefix) {
      if (!n.children.has(c)) return [];
      n = n.children.get(c);
    }
    const all = [];
    const stack = [n];
    while (stack.length) {
      const cur = stack.pop();
      if (cur.word) all.push([cur.score, cur.word]);
      for (const ch of cur.children.values()) stack.push(ch);
    }
    return all.sort((a, b) => b[0] - a[0]).slice(0, k).map(([, w]) => w);
  }
}
```

## code.java
```java
import java.util.*;
class Autocomplete {
    static class Node { Map<Character, Node> ch = new HashMap<>(); String word; int score; }
    Node root = new Node();
    void insert(String w, int s) {
        Node n = root;
        for (char c : w.toCharArray()) n = n.ch.computeIfAbsent(c, x -> new Node());
        n.word = w; n.score = s;
    }
    List<String> suggest(String prefix, int k) {
        Node n = root;
        for (char c : prefix.toCharArray()) {
            n = n.ch.get(c);
            if (n == null) return List.of();
        }
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        List<String> words = new ArrayList<>();
        Deque<Node> stack = new ArrayDeque<>();
        stack.push(n);
        while (!stack.isEmpty()) {
            Node cur = stack.pop();
            if (cur.word != null) {
                words.add(cur.word);
                heap.offer(new int[]{cur.score, words.size() - 1});
                if (heap.size() > k) heap.poll();
            }
            for (Node x : cur.ch.values()) stack.push(x);
        }
        List<String> out = new ArrayList<>();
        while (!heap.isEmpty()) out.add(words.get(heap.poll()[1]));
        Collections.reverse(out);
        return out;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>
struct Node {
    std::unordered_map<char, Node*> ch;
    std::string word;
    int score = 0;
};
struct Autocomplete {
    Node* root = new Node();
    void insert(const std::string& w, int s) {
        Node* n = root;
        for (char c : w) {
            if (!n->ch.count(c)) n->ch[c] = new Node();
            n = n->ch[c];
        }
        n->word = w; n->score = s;
    }
    std::vector<std::string> suggest(const std::string& prefix, int k) {
        Node* n = root;
        for (char c : prefix) {
            if (!n->ch.count(c)) return {};
            n = n->ch[c];
        }
        std::vector<std::pair<int, std::string>> all;
        std::vector<Node*> stack{n};
        while (!stack.empty()) {
            Node* cur = stack.back(); stack.pop_back();
            if (!cur->word.empty()) all.push_back({cur->score, cur->word});
            for (auto& [_, c] : cur->ch) stack.push_back(c);
        }
        std::sort(all.begin(), all.end(), [](auto& a, auto& b) { return a.first > b.first; });
        std::vector<std::string> out;
        for (int i = 0; i < (int) std::min((size_t) k, all.size()); i++) out.push_back(all[i].second);
        return out;
    }
};
```
