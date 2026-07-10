---
slug: huffman-coding
module: greedy
title: Huffman Coding
subtitle: Build an optimal prefix-free code by greedy heap merging.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 15: Greedy Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap15/"
    type: book
  - title: "GeeksforGeeks — Greedy Algorithms"
    url: "https://www.geeksforgeeks.org/greedy-algorithms/"
    type: blog
  - title: "TheAlgorithms/Python — greedy_methods/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/greedy_methods"
    type: repo
status: published
---

## intro
Huffman coding produces an **optimal prefix-free binary code** for a set of symbols with given frequencies. "Optimal" = minimizes total bits in the encoded message; "prefix-free" = no code word is a prefix of another, so decoding is unambiguous. It's the algorithm behind classical compression (DEFLATE, JPEG entropy coding, ZIP, gzip).

## whyItMatters
Compression matters everywhere bandwidth and storage cost money. Huffman is the cleanest demonstration of a **greedy algorithm proven optimal** via an exchange argument. The technique — repeatedly merge the two smallest elements via a min-heap — is reusable for problems like "minimum cost to connect ropes," "merge k files with minimum I/O," and several Codeforces gym staples.

## intuition
High-frequency symbols should get short codes; rare ones can afford long codes. Imagine a binary tree where each leaf is a symbol and the path from root to leaf is its code (`0` = left, `1` = right). Prefix-freeness is automatic because no symbol's path can be a prefix of another's. Total cost = `Σ frequency[s] × depth[s]`.

Physically, picture the frequencies as weights hanging from the leaves of a mobile. The cost is the total "torque" — each weight multiplied by how far it dangles from the root. To minimize torque you keep the heavy weights near the top and banish the light ones to the far tips. Huffman builds this mobile from the bottom up: it repeatedly grabs the two lightest hanging pieces and ties them together, so the lightest weights inevitably accumulate the longest strings.

**Greedy step:** the two least-frequent symbols belong at the deepest level — they're the cheapest to push down. Merge them under a new internal node whose frequency is their sum, then repeat with the new node treated as a leaf. After `n - 1` merges, you have a binary tree.

Concrete micro-example with real numbers: frequencies `{a:5, b:9, c:12, d:13, e:16, f:45}`, total 100. The two smallest, a=5 and b=9, merge first into a node of weight 14 sitting one level deeper; because they were smallest, they end up deepest and each carries a 4-bit code. The giant f=45 never gets merged until the final step, so it stays near the root with a 1-bit code. What's actually happening before any formula: every merge commits the two current lightest items to be siblings one level lower, and since a symbol's code length equals how many merges it lived through, the rarest symbols — merged earliest — accrue the longest codes. That single invariant is the whole idea.

A min-heap keyed by frequency makes each merge `O(log n)` → total `O(n log n)`.

## visualization
Frequencies: `{a: 5, b: 9, c: 12, d: 13, e: 16, f: 45}`.
- Pop a(5), b(9) → merge ab(14). Heap: [c(12), d(13), ab(14), e(16), f(45)].
- Pop c(12), d(13) → merge cd(25). Heap: [ab(14), e(16), cd(25), f(45)].
- Pop ab(14), e(16) → merge abe(30). Heap: [cd(25), abe(30), f(45)].
- Pop cd(25), abe(30) → merge cdabe(55). Heap: [f(45), cdabe(55)].
- Pop f(45), cdabe(55) → root(100).

Codes (assigning 0/1 by walking the tree): f=0, c=100, d=101, a=1100, b=1101, e=111.

Total bits = 5·4 + 9·4 + 12·3 + 13·3 + 16·3 + 45·1 = 20 + 36 + 36 + 39 + 48 + 45 = 224 bits. Any fixed-length code on 6 symbols needs 3 bits × 100 frequency = 300 bits — Huffman saves 25%.

Priority-queue merge trace (each row pops the two smallest, pushes their sum):

```
 step | heap (sorted low->high)           | pop two | new node | running cost
------+-----------------------------------+---------+----------+-------------
  1   | 5  9  12 13 16 45                  |  5, 9   |  ab=14   |  +14  = 14
  2   | 12 13 14 16 45                     | 12,13   |  cd=25   |  +25  = 39
  3   | 14 16 25 45                        | 14,16   | abe=30   |  +30  = 69
  4   | 25 30 45                           | 25,30   |cdabe=55  |  +55  =124
  5   | 45 55                              | 45,55   | root=100 | +100  =224
------+-----------------------------------+---------+----------+-------------
sum of all merge weights = 14+25+30+55+100 = 224 bits (== total encoded size)
```

## bruteForce
Generate every prefix-free assignment and compute the cost. Combinatorial — `Cₙ` Catalan number of tree shapes times `n!` symbol-leaf assignments. Useless beyond n=8.

## optimal
1. Build a min-heap of `(frequency, node)` pairs, one per symbol.
2. Repeat `n - 1` times: pop the two smallest, merge into a new internal node whose frequency is their sum, push back onto the heap.
3. The last remaining node is the root. Walk it, accumulating bits left-vs-right, to produce per-symbol codes.

The key invariant is that the heap always holds the roots of a forest of optimal subtrees for the symbols merged so far; each merge combines the two lightest roots and never has to be undone, which is why a single greedy pass suffices. Step by step, the merge that combines weights `w1` and `w2` adds exactly `w1 + w2` to the running total cost, because every symbol beneath those two roots gains one bit of depth — so the sum of all merge weights equals the final encoded size. Minimizing that sum by always merging the two smallest available weights is the whole optimization.

**Correctness:** by an exchange argument, swapping any two leaves at different depths can never decrease the cost when the deeper leaf has higher frequency; greedy never makes a wrong commitment.

Fleshing that argument out: in any optimal prefix tree there exist two lowest-frequency symbols that are siblings at maximum depth — if they were not, swapping them toward the deepest sibling pair cannot raise the cost (a lower-frequency leaf placed deeper never increases `Σ frequency × depth`). So there is always an optimal tree agreeing with Huffman's first merge. Replacing those two siblings by a single leaf of weight `w1 + w2` yields a strictly smaller instance whose optimal solution, by induction, is exactly what the remaining merges produce. The base case of one symbol is trivially optimal, closing the proof that the greedy tree is globally optimal.

Complexity intuition: building the heap is `O(n)`, and the loop runs `n - 1` times, each doing two pops and one push at `O(log n)` — so the heap operations dominate at `O(n log n)`. The final tree walk that assigns codes visits each of the `2n - 1` nodes once, `O(n)`, and needs only `O(n)` memory for the forest plus the output codes.

## complexity
time: O(n log n) — n insertions and `2(n-1)` heap operations.
space: O(n) for the heap + tree.
notes: When frequencies are already sorted, you can use two queues (one for original leaves, one for merged internal nodes) and skip the heap → `O(n)`. Rarely required in interviews.

## pitfalls
- Forgetting to **handle a single-symbol input** — the loop never runs, and the symbol gets an empty code. Edge case: assign it a single `0` manually.
- Using a max-heap by mistake — produces the worst possible tree.
- Tie-breaking inconsistency — when two nodes have equal frequency, the heap may pop in any order. The total cost is still optimal, but specific code strings may vary; tests that compare against a canonical code string can fail. Stabilize by secondary key (e.g., insertion order).
- Encoding the tree alongside the message — Huffman compression isn't useful unless the decoder can rebuild the tree, which means transmitting either the frequencies or the tree structure.

## interviewTips
- The classic interview phrasing is "minimum cost to connect ropes" — `n` ropes with lengths, every connect operation costs the sum of the two ropes' lengths. Identical to Huffman: pop two smallest, sum, repush.
- The greedy proof is sometimes asked; sketch the exchange argument: if a deeper leaf had lower frequency than a shallower one, swap them and total cost strictly decreases — contradiction.
- For decoding-side problems ("given the tree, decode this bitstring"), walk left-or-right per bit until you hit a leaf, emit, restart at root.

## code.python
```python
import heapq

def huffman_codes(freqs: dict[str, int]) -> dict[str, str]:
    """freqs: symbol → frequency. Returns symbol → binary code string."""
    if len(freqs) == 1:
        return {next(iter(freqs)): '0'}
    heap = [[f, [s, '']] for s, f in freqs.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        lo = heapq.heappop(heap)
        hi = heapq.heappop(heap)
        for pair in lo[1:]: pair[1] = '0' + pair[1]
        for pair in hi[1:]: pair[1] = '1' + pair[1]
        heapq.heappush(heap, [lo[0] + hi[0]] + lo[1:] + hi[1:])
    return {sym: code for sym, code in heap[0][1:]}
```

## code.javascript
```javascript
function huffmanCodes(freqs) {
  const entries = Object.entries(freqs);
  if (entries.length === 1) return { [entries[0][0]]: '0' };
  // Simple priority queue via repeated sort — fine for textbook sizes.
  let heap = entries.map(([s, f]) => ({ f, leaves: [[s, '']] }));
  while (heap.length > 1) {
    heap.sort((a, b) => a.f - b.f);
    const lo = heap.shift(), hi = heap.shift();
    for (const p of lo.leaves) p[1] = '0' + p[1];
    for (const p of hi.leaves) p[1] = '1' + p[1];
    heap.push({ f: lo.f + hi.f, leaves: [...lo.leaves, ...hi.leaves] });
  }
  const out = {};
  for (const [s, c] of heap[0].leaves) out[s] = c;
  return out;
}
```

## code.java
```java
public Map<Character,String> huffmanCodes(Map<Character,Integer> freqs) {
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    // node id ↔ char map; internal nodes get id >= 256
    Map<Integer, int[]> children = new HashMap<>();   // id → [left, right]
    Map<Integer, Character> leaf = new HashMap<>();
    int nextId = 256;
    for (Map.Entry<Character,Integer> e : freqs.entrySet()) {
        int id = (int) e.getKey();
        leaf.put(id, e.getKey());
        pq.offer(new int[]{e.getValue(), id});
    }
    while (pq.size() > 1) {
        int[] a = pq.poll(), b = pq.poll();
        int id = nextId++;
        children.put(id, new int[]{a[1], b[1]});
        pq.offer(new int[]{a[0] + b[0], id});
    }
    int rootId = pq.peek()[1];
    Map<Character,String> codes = new HashMap<>();
    walk(rootId, "", codes, children, leaf);
    return codes;
}
private void walk(int id, String code, Map<Character,String> codes,
                  Map<Integer,int[]> children, Map<Integer,Character> leaf) {
    if (leaf.containsKey(id)) { codes.put(leaf.get(id), code.isEmpty() ? "0" : code); return; }
    int[] kids = children.get(id);
    walk(kids[0], code + '0', codes, children, leaf);
    walk(kids[1], code + '1', codes, children, leaf);
}
```

## code.cpp
```cpp
struct Node {
    int freq;
    char sym = 0;
    Node *l = nullptr, *r = nullptr;
};

map<char, string> huffmanCodes(map<char,int>& freqs) {
    auto cmp = [](Node* a, Node* b){ return a->freq > b->freq; };
    priority_queue<Node*, vector<Node*>, decltype(cmp)> pq(cmp);
    for (auto& [s, f] : freqs) pq.push(new Node{f, s});
    while (pq.size() > 1) {
        Node* a = pq.top(); pq.pop();
        Node* b = pq.top(); pq.pop();
        pq.push(new Node{a->freq + b->freq, 0, a, b});
    }
    map<char, string> codes;
    function<void(Node*, string)> walk = [&](Node* n, string code) {
        if (!n) return;
        if (!n->l && !n->r) { codes[n->sym] = code.empty() ? "0" : code; return; }
        walk(n->l, code + '0');
        walk(n->r, code + '1');
    };
    walk(pq.top(), "");
    return codes;
}
```
