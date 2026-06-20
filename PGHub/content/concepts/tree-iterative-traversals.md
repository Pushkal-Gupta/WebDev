---
slug: tree-iterative-traversals
module: trees-traversal-bst
title: Iterative Tree Traversals (Stack-Based)
subtitle: Inorder / preorder / postorder without recursion — explicit stack mimics the call stack. Required when depth exceeds the language's recursion limit.
difficulty: Intermediate
position: 52
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Tree traversal techniques"
    url: "https://walkccc.me/CLRS/Chap12/"
    type: book
  - title: "GeeksforGeeks — Iterative tree traversals"
    url: "https://www.geeksforgeeks.org/iterative-preorder-traversal/"
    type: blog
  - title: "TheAlgorithms/Python — Tree traversal"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
Recursive tree traversals are concise but blow the stack on deep trees (typical Python/JS recursion limit ~10⁴, equivalent in many languages). **Iterative traversals** maintain an explicit `stack` of nodes — same O(N) time, O(h) space, but no implicit-stack ceiling. The patterns differ between preorder, inorder, and postorder, with postorder being the trickiest.

## whyItMatters
- **Stack-overflow safety**: skewed trees / linked-list-shaped trees can have depth = N (10⁵+). Recursive crashes; iterative survives.
- **Pause-and-resume**: an iterator/generator pattern lets you traverse part of a tree, do work, resume later — not possible with simple recursion.
- **Performance**: iterative is often faster (no function-call overhead), important for hot paths.
- **Standard interview content**: every tree-traversal question expects you to know both forms.

## intuition
Recursion's implicit call stack tracks "where I left off." The iterative version makes that stack explicit.

**Preorder (root → left → right)**:
- Push root.
- Loop: pop, emit, push right, push left (right first so left pops first).

**Inorder (left → root → right)**:
- Start with `curr = root`.
- Walk left, pushing each node until hitting null.
- Pop, emit, then `curr = popped.right`. Repeat.

**Postorder (left → right → root)**:
- Trickier — root is visited LAST, but we encounter it FIRST.
- Approach 1: "reverse preorder" — preorder with right-then-left push, reverse output → gives root, right, left, then reverse to left, right, root.
- Approach 2: track "previous visited" to know when to emit a node (only after both children done).

## visualization
```
Tree:
        1
       / \
      2   3
     / \   \
    4   5   6

Preorder (1, 2, 4, 5, 3, 6) — iterative:
  stack=[1]
  pop 1, emit 1, push 3, push 2 → stack=[3, 2]
  pop 2, emit 2, push 5, push 4 → stack=[3, 5, 4]
  pop 4, emit 4 → stack=[3, 5]
  pop 5, emit 5 → stack=[3]
  pop 3, emit 3, push 6 → stack=[6]
  pop 6, emit 6 → done.

Inorder (4, 2, 5, 1, 3, 6) — iterative:
  curr=1, stack=[]
  push 1, curr=2 → stack=[1]
  push 2, curr=4 → stack=[1, 2]
  push 4, curr=None → stack=[1, 2, 4]
  pop 4, emit 4, curr=4.right=None
  pop 2, emit 2, curr=5 → push 5, curr=None
  pop 5, emit 5, curr=None
  pop 1, emit 1, curr=3 → push 3, curr=None
  pop 3, emit 3, curr=6 → push 6, curr=None
  pop 6, emit 6 → done.

Postorder (reverse-preorder trick): preorder with right-left push gives
  [1, 3, 6, 2, 5, 4] → reverse → [4, 5, 2, 6, 3, 1].
```

## bruteForce
**Recursive traversal**: clean, but caps at recursion-limit depth.

**Convert to array first via BFS, then iterate**: works for read-only but doesn't preserve the traversal order property (BFS order ≠ pre/in/post).

**Use language's deepest stack-size override**: brittle, platform-specific (`sys.setrecursionlimit` in Python, `ulimit -s` in shell).

Iterative is the portable, safe answer.

## optimal
**Preorder** — straightforward stack:
```python
def preorder_iter(root):
    if not root: return []
    stack, out = [root], []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right: stack.append(node.right)   # push right first
        if node.left:  stack.append(node.left)
    return out
```

**Inorder** — push-left-then-pop:
```python
def inorder_iter(root):
    stack, out, curr = [], [], root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        out.append(curr.val)
        curr = curr.right
    return out
```

**Postorder** (reverse-preorder trick — clean):
```python
def postorder_iter(root):
    if not root: return []
    stack, out = [root], []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.left:  stack.append(node.left)
        if node.right: stack.append(node.right)   # right before left now
    return out[::-1]
```

**Postorder** (two-pointer/last-visited variant — used when you need partial results):
```python
def postorder_iter_v2(root):
    stack, out, last = [], [], None
    curr = root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        peek = stack[-1]
        if peek.right and last != peek.right:
            curr = peek.right
        else:
            out.append(peek.val)
            last = stack.pop()
    return out
```

**Morris traversal** (O(1) extra space) is the only-way to traverse without ANY stack — see the dedicated concept page.

## complexity
- **Time:** O(N) for all three — every node pushed + popped exactly once.
- **Space:** O(h) for the stack (height of tree). O(N) worst case (skewed tree), O(log N) balanced.
- Iterative is constant-factor faster than recursive: no call-frame setup, no return-address bookkeeping.

## pitfalls
- **Push left before right in preorder/postorder**: gets the order wrong. For preorder, push right first so left pops first.
- **Forgetting to handle `None` root**: empty input crashes when calling `root.val`.
- **Inorder push-left loop missing**: skipping the "walk left" inner loop emits root before its left subtree.
- **Postorder reverse-preorder forgets to reverse at the end**: emits root first, not last.
- **Mutating the tree during iteration**: undefined behavior. Build new structures separately.
- **Confusing `stack.pop()` (top) with `queue.popleft()` (front)**: stack vs queue swap turns DFS into BFS — and breaks pre/in/postorder semantics.

## interviewTips
- Always have BOTH recursive AND iterative ready — interviewer may ask for iterative as a follow-up.
- For postorder, mention BOTH the reverse-preorder trick AND the last-visited pointer variant.
- For senior interviews, discuss **Morris traversal** (O(1) space), **generator-based traversal** (yield-based, pause-resume), **parent-pointer traversal** (when tree has parent pointers, no stack needed).

## code.python
```python
def preorder(root):
    if not root: return []
    stack, out = [root], []
    while stack:
        n = stack.pop()
        out.append(n.val)
        if n.right: stack.append(n.right)
        if n.left:  stack.append(n.left)
    return out

def inorder(root):
    stack, out, c = [], [], root
    while c or stack:
        while c: stack.append(c); c = c.left
        c = stack.pop(); out.append(c.val); c = c.right
    return out

def postorder(root):
    if not root: return []
    stack, out = [root], []
    while stack:
        n = stack.pop()
        out.append(n.val)
        if n.left:  stack.append(n.left)
        if n.right: stack.append(n.right)
    return out[::-1]
```

## code.javascript
```javascript
function preorder(root) {
  if (!root) return [];
  const stack = [root], out = [];
  while (stack.length) {
    const n = stack.pop();
    out.push(n.val);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  return out;
}

function inorder(root) {
  const stack = [], out = [];
  let c = root;
  while (c || stack.length) {
    while (c) { stack.push(c); c = c.left; }
    c = stack.pop(); out.push(c.val); c = c.right;
  }
  return out;
}

function postorder(root) {
  if (!root) return [];
  const stack = [root], out = [];
  while (stack.length) {
    const n = stack.pop();
    out.push(n.val);
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return out.reverse();
}
```

## code.java
```java
public List<Integer> preorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        out.add(n.val);
        if (n.right != null) stack.push(n.right);
        if (n.left != null) stack.push(n.left);
    }
    return out;
}
```

## code.cpp
```cpp
vector<int> preorder(TreeNode* root) {
    vector<int> out;
    if (!root) return out;
    stack<TreeNode*> st;
    st.push(root);
    while (!st.empty()) {
        TreeNode* n = st.top(); st.pop();
        out.push_back(n->val);
        if (n->right) st.push(n->right);
        if (n->left)  st.push(n->left);
    }
    return out;
}
```
