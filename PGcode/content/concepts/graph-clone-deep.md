---
slug: graph-clone-deep
module: graphs
title: Deep Clone a Graph
subtitle: BFS or DFS with a hashmap from original to clone — the canonical "visited set with a twist" template.
difficulty: Intermediate
position: 41
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Graphs"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "GeeksforGeeks — Clone an undirected graph"
    url: "https://www.geeksforgeeks.org/clone-undirected-graph/"
    type: blog
  - title: "TheAlgorithms/Python — graphs/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
A deep clone of a graph creates a brand-new set of node objects whose connectivity exactly mirrors the original, with no shared references. Naive recursion stops working the moment the graph contains a cycle — you would recurse forever copying the same node. The fix is a tiny upgrade to the usual BFS/DFS template: instead of tracking a `visited` set of nodes, track a `map[original_node] -> cloned_node`. The map serves as both the visited check and the lookup for "the clone I already made."

## whyItMatters
This pattern shows up everywhere: cloning a linked list with random pointers, snapshotting an immutable object graph in a game engine, copying AST nodes during compiler passes, and replicating any cyclic data structure across a wire. Once you have written the BFS-clone once, you have the template for all of them. It is also a textbook example of why hashmaps are sometimes better visited-sets than plain sets — you piggyback the lookup work on the cycle-detection work.

## intuition
Standard BFS over a graph visits each node once using `visited`. To clone:
1. Pre-create the clone of the start node, store `cloned[start] = clone(start)`.
2. BFS over originals. When you pop an original `u`:
   - For each neighbor `v` of `u`:
     - If `v` has not been cloned, create `clone(v)` and store it; enqueue `v`.
     - Append `cloned[v]` to `cloned[u].neighbors`.

The hashmap doubles as the visited set: `if v in cloned` is the "already seen" check. Every edge in the original is examined exactly once; every node gets exactly one clone. The algorithm terminates even with cycles because the hashmap prevents re-cloning.

A subtle but important point: you must connect *clones to clones*, never clones to originals. Confusing the two is the most common bug.

## walkthroughExample
Undirected graph (cycle present):

```
        1 ----- 2
        |       |
        4 ----- 3
```

Adjacency: 1:[2,4], 2:[1,3], 3:[2,4], 4:[1,3]. Start cloning from node 1.

```
   init:    cloned = {1: c1}      queue = [1]

   pop 1:   neighbors 2, 4
            2 not in cloned -> c2 = clone(2); cloned[2]=c2; enqueue 2
            4 not in cloned -> c4 = clone(4); cloned[4]=c4; enqueue 4
            c1.neighbors = [c2, c4]
            queue = [2, 4]

   pop 2:   neighbors 1, 3
            1 in cloned   -> reuse c1
            3 not in cloned -> c3 = clone(3); cloned[3]=c3; enqueue 3
            c2.neighbors = [c1, c3]
            queue = [4, 3]

   pop 4:   neighbors 1, 3
            both already cloned -> reuse c1, c3
            c4.neighbors = [c1, c3]
            queue = [3]

   pop 3:   neighbors 2, 4
            both already cloned -> reuse c2, c4
            c3.neighbors = [c2, c4]
            queue = []
   done
```

Final clone graph has the same shape as the original; every reference points to a freshly created node.

## visualization
Snapshot 1 — the hashmap doubles as the visited set:
```
   originals:    1, 2, 3, 4
   cloned map:   {1: c1, 2: c2, 3: c3, 4: c4}
                   ^ presence = visited
                   ^ value    = the clone to wire neighbors to
```

Snapshot 2 — neighbor wiring is symmetric for undirected graphs:
```
                              c1
                             /  \
                          c2     c4
                           \    /
                             c3
   c1.neighbors = [c2, c4]    c2.neighbors = [c1, c3]
   c3.neighbors = [c2, c4]    c4.neighbors = [c1, c3]
```

Snapshot 3 — what goes wrong without the map:
```
   recurse(1):
      recurse(2):
         recurse(1):
            recurse(2):           <- infinite loop, cycle never breaks
               ...
```

Snapshot 4 — BFS vs DFS clone, both work:
```
   BFS clone:   queue + map     iterative, safer for deep graphs
   DFS clone:   recursion + map natural for small connected components
   Both: O(V + E) time, O(V) space (map entries)
```

## bruteForce
A naive recursive clone without a memoization map enters an infinite loop on any cycle. A "fix" that uses a plain `visited` set without storing the clones forces a second pass to wire edges, doubling the work and complicating the code. The single-pass map approach beats both.

## optimal
**BFS template:**
```
def cloneGraph(node):
    if not node: return None
    cloned = {node: Node(node.val)}
    queue = deque([node])
    while queue:
        u = queue.popleft()
        for v in u.neighbors:
            if v not in cloned:
                cloned[v] = Node(v.val)
                queue.append(v)
            cloned[u].neighbors.append(cloned[v])
    return cloned[node]
```

**DFS template:**
```
def cloneGraph(node, cloned=None):
    if not node: return None
    if cloned is None: cloned = {}
    if node in cloned: return cloned[node]
    cloned[node] = Node(node.val)
    cloned[node].neighbors = [cloneGraph(v, cloned) for v in node.neighbors]
    return cloned[node]
```

Both are O(V + E). Prefer BFS for very deep components in languages with shallow recursion stacks.

## complexity
time: O(V + E) — each node and each edge handled once.
space: O(V) for the hashmap; queue/stack ≤ O(V).
notes: For directed graphs the algorithm is unchanged. For graphs where node identity is by reference (Python/JS/Java) the hashmap can key on object identity. In languages without that (e.g. pure C) use node ids or a side-table.

## pitfalls
- Wiring `cloned[u].neighbors.append(v)` (original v) instead of `cloned[v]`. Easy to miss; produces a "clone" that secretly shares references with the original.
- Forgetting the base case `if not node: return None`. Some test harnesses pass empty input.
- Using `Node(val)` and then re-initializing its neighbors list elsewhere — keep all child wiring in one place to avoid double-pushes.
- Hashing nodes by value when values are not unique. Use the node object's identity (default `hash(obj)` in most languages).
- DFS on a graph with very long chains — risk of stack overflow. Switch to BFS or iterative DFS.

## interviewTips
- Be explicit: "the visited set and the clone lookup are the same hashmap." Interviewers love that single observation.
- State both BFS and DFS versions and pick one. Mention which you would use in production and why (BFS for stack safety).
- Mention undirected vs directed — for undirected, each edge is encountered twice in the BFS but the map ensures clones are wired only once per direction.
- The follow-up is usually "clone a linked list with random pointers." Same template with two passes (clone nodes, then fix random pointers) or one pass with interleaved cloned nodes.

## code.python
```python
from collections import deque

class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors or []

def cloneGraph(node):
    if not node: return None
    cloned = {node: Node(node.val)}
    queue = deque([node])
    while queue:
        u = queue.popleft()
        for v in u.neighbors:
            if v not in cloned:
                cloned[v] = Node(v.val)
                queue.append(v)
            cloned[u].neighbors.append(cloned[v])
    return cloned[node]
```

## code.javascript
```javascript
function cloneGraph(node) {
  if (!node) return null;
  const cloned = new Map();
  cloned.set(node, new Node(node.val));
  const queue = [node];
  while (queue.length) {
    const u = queue.shift();
    for (const v of u.neighbors) {
      if (!cloned.has(v)) {
        cloned.set(v, new Node(v.val));
        queue.push(v);
      }
      cloned.get(u).neighbors.push(cloned.get(v));
    }
  }
  return cloned.get(node);
}
```

## code.java
```java
public Node cloneGraph(Node node) {
    if (node == null) return null;
    Map<Node, Node> cloned = new HashMap<>();
    cloned.put(node, new Node(node.val));
    Deque<Node> queue = new ArrayDeque<>();
    queue.offer(node);
    while (!queue.isEmpty()) {
        Node u = queue.poll();
        for (Node v : u.neighbors) {
            if (!cloned.containsKey(v)) {
                cloned.put(v, new Node(v.val));
                queue.offer(v);
            }
            cloned.get(u).neighbors.add(cloned.get(v));
        }
    }
    return cloned.get(node);
}
```

## code.cpp
```cpp
Node* cloneGraph(Node* node) {
    if (!node) return nullptr;
    unordered_map<Node*, Node*> cloned;
    cloned[node] = new Node(node->val);
    queue<Node*> q;
    q.push(node);
    while (!q.empty()) {
        Node* u = q.front(); q.pop();
        for (Node* v : u->neighbors) {
            if (!cloned.count(v)) {
                cloned[v] = new Node(v->val);
                q.push(v);
            }
            cloned[u]->neighbors.push_back(cloned[v]);
        }
    }
    return cloned[node];
}
```
