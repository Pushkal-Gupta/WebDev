---
slug: merkle-patricia-trie
module: trees
title: Merkle Patricia Trie
subtitle: Ethereum's state tree — a hash-keyed radix trie that proves membership in O(log n).
difficulty: Advanced
position: 35
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Merkle tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/introduction-to-merkle-tree/"
    type: blog
  - title: "Trie data structure — cp-algorithms"
    url: "https://cp-algorithms.com/string/aho_corasick.html"
    type: blog
  - title: "system-design-primer — Hashing and consistent hashing"
    url: "https://github.com/donnemartin/system-design-primer#under-the-hood"
    type: repo
status: published
---

## intro
A Merkle Patricia Trie (MPT) is a hybrid of a radix trie and a Merkle tree. The radix-trie part stores key/value pairs by walking the key's nibbles down a tree of branching nodes; the Merkle part replaces every child pointer with the cryptographic hash of the child node, so the root hash commits to the entire data set. Change a single byte anywhere and the root hash changes. Ethereum uses an MPT to commit to its world state, transaction list, and per-block receipts — that root hash is what light clients verify against.

## whyItMatters
A plain Merkle tree commits to an ordered list. Adding or updating one entry rebuilds the whole tree. Adding a trie means each key (an account address, a storage slot) has its own path; updating one key rehashes only the O(log n) nodes along that path. Light clients can then ask a full node for a "proof of inclusion" — the sibling hashes along the path — and verify a single account balance without downloading the whole state. This is the basis of light clients, rollup state proofs, and cross-chain bridges.

## intuition
Strip out the hashing and you have a radix trie keyed by hex nibbles. Each branch node has 17 slots (one per nibble 0..f, plus a value slot for keys ending here). Extension and leaf nodes compress long single-child paths into one node carrying the shared nibble sequence — that compression is the "Patricia" part. Now glue the Merkle layer on top: serialize each node (RLP-encoded), take its keccak-256 hash, and use that hash as the child reference. The root hash uniquely fingerprints the entire trie.

## visualization
```
Keys (hex): a711, a77d, a7f9
Shared prefix nibbles: a, 7

Root (Extension "a7") -> Branch
                         |
              ┌──────────┼──────────┐
              1          7          f
              |          |          |
            Leaf "1"   Leaf "d"   Leaf "9"
              v1         v2         v3

Proof for key a77d: sibling hashes at branch slots 1 and f + the leaf node.
A verifier rebuilds the hashes upward and checks they match the published root.
```

## bruteForce
A flat key->value store (a hash map) is O(1) per access but proves nothing — you cannot ask "is this entry really in the state I committed to?" A plain Merkle tree over the sorted entries answers that, but every insert reorders the leaves and forces a full rehash. An MPT keeps the Merkle property without the global rebuild: only the O(log n) nodes along the changed key's path need rehashing.

## optimal
Three node types: leaf (terminator, holds remaining key nibbles + value), extension (compressed path of nibbles + child reference), branch (17 slots). Insert: walk down by nibble. On hit, replace the value at the matching slot. On partial match in an extension, split it into a common-prefix extension + branch + two children. Rehash bottom-up: each modified node's hash propagates upward, ending at a new root hash. Proofs are the chain of serialised nodes plus an index telling the verifier which slot to follow at each branch.

```
prove(key):
    path = nibbles(key)
    proof = []
    node = root
    while node is not leaf:
        proof.append(serialize(node))
        node = walk_one_step(node, path)
    proof.append(serialize(node))
    return proof

verify(root_hash, key, value, proof):
    rebuild each node from proof, hash bottom-up, compare to root_hash
```

## complexity
time: O(k) per get / put where k is the key length in nibbles (k = 64 for 256-bit hashes); O(log n) effective when the trie is well-spread. Each operation rehashes O(k) nodes.
space: O(n * k) in the worst case; in practice Ethereum stores only changed branches per block and references unchanged subtrees by hash.
notes: Verifying a proof is O(k) hashes — feasible on phones. The proof size is O(k) hashes ~ 64 * 32 bytes = 2 KB.

## pitfalls
- Mixing up "leaf" and "extension" node encoding — both use HP (hex-prefix) encoding but the first nibble flag differs (even/odd, leaf/extension).
- Forgetting RLP serialization rules — two different encodings of the same logical content produce different hashes and break verification.
- Treating the branch's 17th slot (the "value" slot) as another child pointer — it stores the value for a key that ends at that branch.
- Caching old hashes across blocks: Ethereum's MPT is persistent (copy-on-write); writes do not mutate previous roots, they fork new ones.
- Confusing "stateRoot" (the MPT root of all accounts) with "storageRoot" inside each account (an independent MPT keyed by storage slots).

## interviewTips
- Lead with the why: "MPT is for authenticated state — anyone can prove an entry without trusting the prover."
- Compare with sparse Merkle trees (used by Plasma, some L2s) and with Merkle Mountain Ranges (used by Mimblewimble) — interviewers love when you can place MPT in the broader family.
- Name the three node types and the role of the branch node's value slot — that is the most common technical question.
- Mention the proof size: 2 KB for a 1 GB state is the magic that makes Ethereum light clients viable.

## code.python
```python
import hashlib

def keccak(b): return hashlib.sha3_256(b).digest()  # placeholder
def nibbles(key): return [c for b in key for c in (b >> 4, b & 0xf)]

class Leaf:
    def __init__(self, path, value): self.path, self.value = path, value
class Extension:
    def __init__(self, path, child): self.path, self.child = path, child
class Branch:
    def __init__(self):
        self.slots = [None] * 16; self.value = None

def serialize(node):
    if isinstance(node, Leaf): return b"L" + bytes(node.path) + b"|" + node.value
    if isinstance(node, Extension): return b"E" + bytes(node.path) + b"|" + hash_node(node.child)
    out = b"B"
    for s in node.slots: out += (hash_node(s) if s else b"\x00" * 32)
    out += node.value or b""
    return out

def hash_node(node): return keccak(serialize(node)) if node else b"\x00" * 32

def insert(node, path, value):
    if node is None: return Leaf(path, value)
    if isinstance(node, Leaf):
        if node.path == path: return Leaf(path, value)
        b = Branch()
        common = 0
        while common < len(node.path) and common < len(path) and node.path[common] == path[common]:
            common += 1
        old_remaining = node.path[common:]
        new_remaining = path[common:]
        b.slots[old_remaining[0]] = Leaf(old_remaining[1:], node.value) if old_remaining else None
        b.slots[new_remaining[0]] = Leaf(new_remaining[1:], value) if new_remaining else None
        return Extension(path[:common], b) if common else b
    if isinstance(node, Branch):
        if not path: node.value = value
        else: node.slots[path[0]] = insert(node.slots[path[0]], path[1:], value)
        return node
    return node
```

## code.javascript
```javascript
const crypto = require("crypto");
const keccak = b => crypto.createHash("sha3-256").update(b).digest();

function nibbles(bytes) {
  const out = [];
  for (const b of bytes) { out.push(b >> 4, b & 0xf); }
  return out;
}

class Leaf { constructor(path, value) { this.path = path; this.value = value; } }
class Extension { constructor(path, child) { this.path = path; this.child = child; } }
class Branch { constructor() { this.slots = new Array(16).fill(null); this.value = null; } }

function insert(node, path, value) {
  if (!node) return new Leaf(path, value);
  if (node instanceof Leaf) {
    if (node.path.join() === path.join()) return new Leaf(path, value);
    let c = 0;
    while (c < node.path.length && c < path.length && node.path[c] === path[c]) c++;
    const b = new Branch();
    const oldRem = node.path.slice(c), newRem = path.slice(c);
    if (oldRem.length) b.slots[oldRem[0]] = new Leaf(oldRem.slice(1), node.value);
    else b.value = node.value;
    if (newRem.length) b.slots[newRem[0]] = new Leaf(newRem.slice(1), value);
    else b.value = value;
    return c ? new Extension(path.slice(0, c), b) : b;
  }
  if (node instanceof Branch) {
    if (!path.length) node.value = value;
    else node.slots[path[0]] = insert(node.slots[path[0]], path.slice(1), value);
    return node;
  }
  return node;
}
```

## code.java
```java
import java.security.MessageDigest;
import java.util.*;

abstract class MPTNode {}
class Leaf extends MPTNode { int[] path; byte[] value; Leaf(int[] p, byte[] v) { path = p; value = v; } }
class Extension extends MPTNode { int[] path; MPTNode child; Extension(int[] p, MPTNode c) { path = p; child = c; } }
class Branch extends MPTNode { MPTNode[] slots = new MPTNode[16]; byte[] value; }

public class MPT {
    static int[] nibbles(byte[] bytes) {
        int[] out = new int[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            out[2*i] = (bytes[i] >> 4) & 0xf;
            out[2*i+1] = bytes[i] & 0xf;
        }
        return out;
    }

    public static MPTNode insert(MPTNode node, int[] path, byte[] value) {
        if (node == null) return new Leaf(path, value);
        if (node instanceof Leaf l) {
            if (Arrays.equals(l.path, path)) return new Leaf(path, value);
            int c = 0;
            while (c < l.path.length && c < path.length && l.path[c] == path[c]) c++;
            Branch b = new Branch();
            int[] oldRem = Arrays.copyOfRange(l.path, c, l.path.length);
            int[] newRem = Arrays.copyOfRange(path, c, path.length);
            if (oldRem.length > 0) b.slots[oldRem[0]] = new Leaf(Arrays.copyOfRange(oldRem, 1, oldRem.length), l.value);
            else b.value = l.value;
            if (newRem.length > 0) b.slots[newRem[0]] = new Leaf(Arrays.copyOfRange(newRem, 1, newRem.length), value);
            else b.value = value;
            return c > 0 ? new Extension(Arrays.copyOfRange(path, 0, c), b) : b;
        }
        if (node instanceof Branch b) {
            if (path.length == 0) b.value = value;
            else b.slots[path[0]] = insert(b.slots[path[0]], Arrays.copyOfRange(path, 1, path.length), value);
            return b;
        }
        return node;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cstring>

struct MPTNode { virtual ~MPTNode() = default; };
struct Leaf : MPTNode { std::vector<int> path; std::vector<uint8_t> value;
    Leaf(std::vector<int> p, std::vector<uint8_t> v) : path(std::move(p)), value(std::move(v)) {} };
struct Extension : MPTNode { std::vector<int> path; MPTNode* child;
    Extension(std::vector<int> p, MPTNode* c) : path(std::move(p)), child(c) {} };
struct Branch : MPTNode { MPTNode* slots[16] = {}; std::vector<uint8_t> value; };

std::vector<int> nibbles(const std::vector<uint8_t>& bytes) {
    std::vector<int> out;
    out.reserve(bytes.size() * 2);
    for (auto b : bytes) { out.push_back(b >> 4); out.push_back(b & 0xf); }
    return out;
}

MPTNode* insertNode(MPTNode* node, std::vector<int> path, std::vector<uint8_t> value) {
    if (!node) return new Leaf(std::move(path), std::move(value));
    if (auto* l = dynamic_cast<Leaf*>(node)) {
        if (l->path == path) { l->value = std::move(value); return l; }
        size_t c = 0;
        while (c < l->path.size() && c < path.size() && l->path[c] == path[c]) c++;
        auto* b = new Branch();
        std::vector<int> oldRem(l->path.begin() + c, l->path.end());
        std::vector<int> newRem(path.begin() + c, path.end());
        if (!oldRem.empty()) b->slots[oldRem[0]] = new Leaf({oldRem.begin()+1, oldRem.end()}, l->value);
        else b->value = l->value;
        if (!newRem.empty()) b->slots[newRem[0]] = new Leaf({newRem.begin()+1, newRem.end()}, value);
        else b->value = value;
        return c > 0 ? (MPTNode*)new Extension({path.begin(), path.begin()+c}, b) : (MPTNode*)b;
    }
    if (auto* b = dynamic_cast<Branch*>(node)) {
        if (path.empty()) b->value = std::move(value);
        else b->slots[path[0]] = insertNode(b->slots[path[0]], {path.begin()+1, path.end()}, std::move(value));
        return b;
    }
    return node;
}
```
