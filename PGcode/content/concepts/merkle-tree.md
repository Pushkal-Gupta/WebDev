---
slug: merkle-tree
module: system-design
title: Merkle Tree
subtitle: Hash tree for tamper-evident storage — prove any leaf's membership in O(log n) hashes.
difficulty: Intermediate
position: 18
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A **Merkle tree** is a binary tree where every internal node stores the hash of its two children, and leaves store the hash of data blocks. The root hash uniquely identifies the entire dataset — change one byte and the root changes. To prove a specific block belongs to the tree, you only need the **sibling hashes along the path** to the root (log n hashes), not the entire dataset.

## whyItMatters
Foundational for tamper-evident systems:
- **Git** — every commit is a Merkle DAG.
- **Bitcoin / blockchains** — transaction batches as Merkle trees so light clients verify membership cheaply.
- **IPFS / content-addressed storage** — files identified by their Merkle root.
- **Database replication** — DynamoDB / Cassandra use Merkle trees for fast anti-entropy (diff two replicas without comparing every key).
- **Certificate transparency logs** — append-only, auditable.

The trick is the O(log n) inclusion proof: a light client doesn't need the full dataset to verify a single entry.

## intuition
Pair adjacent leaves, hash each pair → internal nodes. Pair those, hash again → upper internals. Repeat until one root remains.

To prove "block B is in the tree with root R":
- Receiver knows: B and R.
- Sender sends: log n sibling hashes along B's path to root.
- Receiver recomputes hashes upward; if final == R, B is present and untampered.

## visualization
```
Data blocks: [B0, B1, B2, B3]

Leaves (h_i = hash(B_i)):
  h0 = H(B0)   h1 = H(B1)   h2 = H(B2)   h3 = H(B3)

Internals:
  h01 = H(h0 + h1)
  h23 = H(h2 + h3)

Root:
  R = H(h01 + h23)

Proof that B2 is in tree:
  send: h3, h01
  receiver computes:
    h2' = H(B2)              (recipient already knows B2)
    h23' = H(h2' + h3)
    R'   = H(h01 + h23')
    accept iff R' == R
```

## bruteForce
Send the entire dataset whenever you need to prove inclusion → O(n) bandwidth. Useless for big datasets or many light clients.

## optimal
**Build** (bottom-up):
```
def build(blocks, H):
    layer = [H(b) for b in blocks]
    layers = [layer]
    while len(layer) > 1:
        if len(layer) % 2: layer.append(layer[-1])     # pad odd by duplicating last
        layer = [H(layer[i] + layer[i+1]) for i in range(0, len(layer), 2)]
        layers.append(layer)
    return layers   # layers[0] = leaves, layers[-1] = [root]
```

**Inclusion proof for index i**:
```
def proof(layers, i):
    out = []
    for layer in layers[:-1]:
        sibling = i ^ 1
        if sibling < len(layer): out.append(layer[sibling])
        i //= 2
    return out
```

**Verify**:
```
def verify(block, i, proof, root, H):
    h = H(block)
    for sibling in proof:
        h = H(h + sibling) if i % 2 == 0 else H(sibling + h)
        i //= 2
    return h == root
```

For append-only logs (certificate transparency), use a **Merkle Mountain Range** so old roots remain provable.

## complexity
- **Build**: O(n) hash operations + O(n) memory.
- **Inclusion proof size**: O(log n) hashes.
- **Verification**: O(log n) hash operations.
- **Update one block**: O(log n) — rehash the path to root.

## pitfalls
- **Hash function choice**: use a collision-resistant hash (SHA-256, BLAKE2). MD5/SHA-1 are broken.
- **Odd leaf count**: pad by duplicating the last leaf (Bitcoin's approach) OR by a sentinel. Be consistent across encoder and verifier.
- **Concatenation order**: when hashing `(left, right)`, pick a fixed byte-order. Some attacks flip order.
- **Second-preimage attacks** (CVE-2012-2459): Bitcoin's pad-by-duplicate is exploitable — attacker constructs a different tree with the same root. Modern implementations prefix internal vs leaf hashes with a tag byte (`H(0x00 + leaf)` vs `H(0x01 + left + right)`).
- **Storing the full tree on disk**: only the leaves + the root are essential; internal layers can be recomputed.

## interviewTips
- For "tamper-evident log / blockchain / Git internals" — Merkle tree.
- Mention **inclusion proofs are O(log n)** — that's the whole point.
- Compare with **hash chain** (linear, no efficient inclusion proof) and **Merkle Patricia trie** (Ethereum's keyed variant).
- For senior interviews, mention **second-preimage attacks** and the tagged-hash mitigation.

## code.python
```python
import hashlib
def H(b): return hashlib.sha256(b).digest()

def build_layers(blocks):
    layer = [H(b) for b in blocks]
    layers = [layer]
    while len(layer) > 1:
        if len(layer) % 2: layer = layer + [layer[-1]]
        layer = [H(layer[i] + layer[i+1]) for i in range(0, len(layer), 2)]
        layers.append(layer)
    return layers

def root(blocks): return build_layers(blocks)[-1][0]

def proof(layers, i):
    out = []
    for layer in layers[:-1]:
        sib = i ^ 1
        if sib < len(layer): out.append(layer[sib])
        i //= 2
    return out

def verify(block, i, proof, root):
    h = H(block)
    for s in proof:
        h = H(h + s) if i % 2 == 0 else H(s + h)
        i //= 2
    return h == root

blocks = [b'apple', b'banana', b'cherry', b'date']
layers = build_layers(blocks)
r = layers[-1][0]
p = proof(layers, 2)
print(verify(b'cherry', 2, p, r))   # True
```

## code.javascript
```javascript
const crypto = require('crypto');
const H = (b) => crypto.createHash('sha256').update(b).digest();
function buildLayers(blocks) {
  let layer = blocks.map(b => H(b));
  const layers = [layer];
  while (layer.length > 1) {
    if (layer.length % 2) layer = [...layer, layer[layer.length - 1]];
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(H(Buffer.concat([layer[i], layer[i+1]])));
    layer = next; layers.push(layer);
  }
  return layers;
}
```

## code.java
```java
import java.security.MessageDigest;
import java.util.*;
class Merkle {
    static byte[] H(byte[] b) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(b);
    }
    static List<List<byte[]>> build(List<byte[]> blocks) throws Exception {
        List<byte[]> layer = new ArrayList<>();
        for (byte[] b : blocks) layer.add(H(b));
        List<List<byte[]>> layers = new ArrayList<>();
        layers.add(layer);
        while (layer.size() > 1) {
            if (layer.size() % 2 != 0) layer.add(layer.get(layer.size() - 1));
            List<byte[]> next = new ArrayList<>();
            for (int i = 0; i < layer.size(); i += 2) {
                byte[] cat = new byte[layer.get(i).length + layer.get(i+1).length];
                System.arraycopy(layer.get(i), 0, cat, 0, layer.get(i).length);
                System.arraycopy(layer.get(i+1), 0, cat, layer.get(i).length, layer.get(i+1).length);
                next.add(H(cat));
            }
            layer = next; layers.add(layer);
        }
        return layers;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <openssl/sha.h>
std::vector<unsigned char> H(const std::vector<unsigned char>& b) {
    std::vector<unsigned char> out(SHA256_DIGEST_LENGTH);
    SHA256(b.data(), b.size(), out.data());
    return out;
}
// build / proof / verify follow the same shape as Python — concatenate sibling + hash.
```
