---
slug: huffman-canonical
module: greedy
title: Canonical Huffman Codes
subtitle: A normal form for Huffman that ships as a list of code lengths — used by DEFLATE, JPEG, MP3.
difficulty: Advanced
position: 21
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Huffman Coding — Princeton Algorithms"
    url: "https://algs4.cs.princeton.edu/55compression/"
    type: book
  - title: "Huffman Coding — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/huffman-coding-greedy-algo-3/"
    type: blog
  - title: "TheAlgorithms/Python — huffman.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/compression/huffman.py"
    type: repo
status: published
---

## intro
Classic Huffman coding builds a binary tree from a frequency table and reads off variable-length prefix codes. Canonical Huffman keeps the same lengths but assigns codes in a deterministic order — sorted by length, then by symbol — so that the entire codebook can be transmitted as nothing but a list of `(symbol, length)` pairs. Every modern compressor that uses Huffman, from DEFLATE to JPEG to MP3, uses the canonical form.

## whyItMatters
Standard Huffman has a problem at the file boundary: to decode, the receiver needs the exact tree the encoder built, and there are many trees with the same optimal length profile. Shipping the tree itself is expensive. Canonical Huffman makes the tree implicit in the lengths: given only the length-per-symbol table, both ends rebuild the identical codebook. That property is why DEFLATE's "dynamic Huffman" block header is just a packed length list.

## intuition
Two prefix-code trees that produce the same set of codeword lengths are equally optimal in compressed size. So fix on a canonical assignment. Sort symbols by `(length, symbol)`. Start with the smallest code length: its first codeword is all zeros. To get the next codeword at the same length, increment by one. When the length grows by `k`, increment by one and then shift left by `k`. This rule produces unique prefix-free codes in O(n log n).

## visualization
Symbols `A:3, B:3, C:3, D:3, E:3, F:2, G:4, H:4`. Sort by `(length, symbol)`: `F(2), A(3), B(3), C(3), D(3), E(3), G(4), H(4)`. Codes: `F = 00`, then shift left and increment: `A = 100`, `B = 101`, `C = 110`, `D = 111` — wait, that overflows length 3. Re-derive: after `F = 00` at length 2, next code at length 3 is `(00 + 1) << 1 = 010`. So `A = 010`, `B = 011`, `C = 100`, `D = 101`, `E = 110`. Length 4: `(110 + 1) << 1 = 1110`. `G = 1110`, `H = 1111`. Pure mechanical output from the length list.

## bruteForce
Build the Huffman tree from a priority queue of frequencies. Repeatedly extract the two smallest, merge into a new node whose weight is the sum, reinsert. Walk the final tree to assign codes — left child gets a 0 suffix, right gets 1. Correct and produces optimal codeword lengths. The "brute" part is that to serialize the codebook you must also write down the tree shape or the full `(symbol, code)` table, both of which are larger than the canonical length list.

## optimal
Step 1: compute optimal code lengths via standard Huffman (heap-based, O(n log n)). Step 2: discard the tree, keep only the per-symbol length. Step 3: bucket symbols by length, sort each bucket lexicographically. Step 4: assign codes by the canonical rule — start `code = 0`, for symbols in sorted order, emit `code` padded to the current length, then `code = (code + 1) << (next_length - current_length)`. The decoder rebuilds the table from lengths alone.

## complexity
time: O(n log n) to build the lengths, O(n log n) to sort the lookup table, O(n) for the assignment pass
space: O(n) for the length array and the code table
notes: Decoders typically build a length-limited lookup table — for example a 256-entry table when the maximum length is bounded at 15 (the DEFLATE limit). This makes decode a single array index per code, not a tree walk.

## pitfalls
- Forgetting to enforce a maximum code length: a heavily skewed distribution can produce codes longer than your transport allows. Use a length-limited Huffman variant — Package-Merge is the standard fix.
- Mixing the sort key: it is `(length, symbol)`, not `(symbol, length)`. Wrong order and the encoder and decoder disagree on the codebook.
- Off-by-one on the shift: after incrementing, the next length jump shifts by `next - current`, not by `next`. Test with the DEFLATE RFC vectors.
- Using a delimiter byte to separate fields in the serialized length table — never the null character; many transports and Postgres reject it. Pick a printable sentinel like `'#'` or `'$'` instead.

## interviewTips
- Mention DEFLATE, JPEG, and MP3 by name — interviewers want to see you tie theory to shipped systems.
- Be ready to walk through the canonical assignment by hand on a six-symbol example.
- If asked about length-limited codes, name Package-Merge as the production answer; it pairs well with canonical Huffman.

## code.python
```python
import heapq

def huffman_lengths(freq):
    if len(freq) == 1:
        sym = next(iter(freq))
        return {sym: 1}
    heap = [(f, [(s, 0)]) for s, f in freq.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        f1, n1 = heapq.heappop(heap)
        f2, n2 = heapq.heappop(heap)
        merged = [(s, d + 1) for s, d in n1] + [(s, d + 1) for s, d in n2]
        heapq.heappush(heap, (f1 + f2, merged))
    return {s: d for s, d in heap[0][1]}

def canonical_codes(lengths):
    items = sorted(lengths.items(), key=lambda kv: (kv[1], kv[0]))
    codes = {}
    code = 0
    prev_len = items[0][1]
    for sym, length in items:
        code <<= (length - prev_len)
        codes[sym] = format(code, '0' + str(length) + 'b')
        code += 1
        prev_len = length
    return codes
```

## code.javascript
```javascript
function huffmanLengths(freq) {
  const entries = Object.entries(freq);
  if (entries.length === 1) return { [entries[0][0]]: 1 };
  let heap = entries.map(([s, f]) => [f, [[s, 0]]]);
  while (heap.length > 1) {
    heap.sort((a, b) => a[0] - b[0]);
    const [f1, n1] = heap.shift();
    const [f2, n2] = heap.shift();
    const merged = n1.map(([s, d]) => [s, d + 1]).concat(n2.map(([s, d]) => [s, d + 1]));
    heap.push([f1 + f2, merged]);
  }
  const out = {};
  for (const [s, d] of heap[0][1]) out[s] = d;
  return out;
}

function canonicalCodes(lengths) {
  const items = Object.entries(lengths).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  const codes = {};
  let code = 0, prev = items[0][1];
  for (const [sym, length] of items) {
    code <<= (length - prev);
    codes[sym] = code.toString(2).padStart(length, '0');
    code += 1;
    prev = length;
  }
  return codes;
}
```

## code.java
```java
import java.util.*;

public Map<Character, Integer> huffmanLengths(Map<Character, Integer> freq) {
    if (freq.size() == 1) {
        Map<Character, Integer> m = new HashMap<>();
        m.put(freq.keySet().iterator().next(), 1);
        return m;
    }
    PriorityQueue<Object[]> heap = new PriorityQueue<>((a, b) -> (int)a[0] - (int)b[0]);
    for (var e : freq.entrySet()) {
        List<int[]> node = new ArrayList<>();
        node.add(new int[]{e.getKey(), 0});
        heap.offer(new Object[]{e.getValue(), node});
    }
    while (heap.size() > 1) {
        Object[] x = heap.poll();
        Object[] y = heap.poll();
        List<int[]> merged = new ArrayList<>();
        for (int[] p : (List<int[]>) x[1]) merged.add(new int[]{p[0], p[1] + 1});
        for (int[] p : (List<int[]>) y[1]) merged.add(new int[]{p[0], p[1] + 1});
        heap.offer(new Object[]{(int)x[0] + (int)y[0], merged});
    }
    Map<Character, Integer> out = new HashMap<>();
    for (int[] p : (List<int[]>) heap.peek()[1]) out.put((char) p[0], p[1]);
    return out;
}

public Map<Character, String> canonicalCodes(Map<Character, Integer> lengths) {
    List<Map.Entry<Character, Integer>> items = new ArrayList<>(lengths.entrySet());
    items.sort((a, b) -> a.getValue() - b.getValue() != 0 ? a.getValue() - b.getValue()
                                                          : a.getKey() - b.getKey());
    Map<Character, String> codes = new LinkedHashMap<>();
    int code = 0, prev = items.get(0).getValue();
    for (var e : items) {
        int len = e.getValue();
        code <<= (len - prev);
        String bits = Integer.toBinaryString(code);
        while (bits.length() < len) bits = "0" + bits;
        codes.put(e.getKey(), bits);
        code += 1;
        prev = len;
    }
    return codes;
}
```

## code.cpp
```cpp
#include <queue>
#include <vector>
#include <unordered_map>
#include <string>
#include <algorithm>

std::unordered_map<char,int> huffmanLengths(const std::unordered_map<char,int>& freq) {
    if (freq.size() == 1) return {{freq.begin()->first, 1}};
    using Node = std::pair<int, std::vector<std::pair<char,int>>>;
    auto cmp = [](const Node& a, const Node& b){ return a.first > b.first; };
    std::priority_queue<Node, std::vector<Node>, decltype(cmp)> heap(cmp);
    for (auto& [s, f] : freq) heap.push({f, {{s, 0}}});
    while (heap.size() > 1) {
        Node a = heap.top(); heap.pop();
        Node b = heap.top(); heap.pop();
        std::vector<std::pair<char,int>> merged;
        for (auto& p : a.second) merged.push_back({p.first, p.second + 1});
        for (auto& p : b.second) merged.push_back({p.first, p.second + 1});
        heap.push({a.first + b.first, merged});
    }
    std::unordered_map<char,int> out;
    for (auto& p : heap.top().second) out[p.first] = p.second;
    return out;
}

std::unordered_map<char,std::string> canonicalCodes(const std::unordered_map<char,int>& lengths) {
    std::vector<std::pair<char,int>> items(lengths.begin(), lengths.end());
    std::sort(items.begin(), items.end(), [](auto& a, auto& b){
        return a.second != b.second ? a.second < b.second : a.first < b.first;
    });
    std::unordered_map<char,std::string> codes;
    unsigned long long code = 0;
    int prev = items[0].second;
    for (auto& [sym, len] : items) {
        code <<= (len - prev);
        std::string bits(len, '0');
        for (int i = 0; i < len; ++i)
            bits[len - 1 - i] = ((code >> i) & 1) ? '1' : '0';
        codes[sym] = bits;
        code += 1;
        prev = len;
    }
    return codes;
}
```
