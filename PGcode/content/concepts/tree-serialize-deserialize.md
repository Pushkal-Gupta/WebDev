---
slug: tree-serialize-deserialize
module: trees
title: Serialize & Deserialize a Binary Tree
subtitle: Preorder traversal with explicit null markers gives a single unambiguous round-trip string.
difficulty: Intermediate
position: 43
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Binary Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "GeeksforGeeks — Serialize and Deserialize a Binary Tree"
    url: "https://www.geeksforgeeks.org/serialize-deserialize-binary-tree/"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree/serialize_deserialize_binary_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/serialize_deserialize_binary_tree.py"
    type: repo
status: published
---

## intro
"Convert a binary tree to a string, then reconstruct the original tree from that string." The hidden subtlety is that *plain* preorder or inorder by itself is ambiguous — `[3,1,2]` could be at least four different trees. The fix is brutally simple: emit a sentinel for every null child. With explicit nulls, a single preorder walk produces a string that decodes uniquely in linear time.

## whyItMatters
Serialization is how trees travel between processes — caches, network APIs, databases, snapshot files. Tree-shaped state appears everywhere: ASTs in compilers, scene graphs in renderers, DOMs in browsers. Knowing one robust, language-agnostic encoding (preorder + nulls) saves you from inventing brittle ad-hoc formats. The interview version (LC 297) is also a near-perfect test of recursion / queue mechanics in 25 lines.

## intuition
Two traversals (preorder + inorder) reconstruct a tree only when values are unique. With duplicates or unknown alphabets, you need structural information at every position. The cheapest structural marker is "this child is null." So:

```
   serialize(node):
     if node is null:  emit "#"
     else:             emit node.val; serialize(left); serialize(right)
```

This is preorder with `#` as a null sentinel. To deserialize, scan the tokens left-to-right and recurse with the same rule: a `#` returns null; anything else creates a node and recursively builds its left and right.

The encoding length is exactly `n + (n+1) = 2n+1` tokens for a tree of n nodes — every node contributes one value and the tree has n+1 null leaves.

## walkthroughExample
Tree:
```
            1
           / \
          2   3
               \
                4
```

Preorder-with-nulls serialization: visit 1, recurse left (2 — both children null), recurse right (3 — left null, right is 4 — both children null):

```
   1 -> 2 -> # -> # -> 3 -> # -> 4 -> # -> #
```

As a CSV: `"1,2,#,#,3,#,4,#,#"`.

Now deserialize the token stream `[1, 2, #, #, 3, #, 4, #, #]` using a queue and the same recursive shape:

```
   build():
     tok = pop_front()
     if tok == "#": return null
     node = TreeNode(int(tok))
     node.left  = build()
     node.right = build()
     return node
```

Trace (indent = recursion depth):
```
   build()  reads 1  -> create node(1)
     build()  reads 2  -> create node(2)
       build()  reads #  -> null
       build()  reads #  -> null
       node(2).left = null, .right = null
     node(1).left = node(2)
     build()  reads 3  -> create node(3)
       build()  reads #  -> null
       build()  reads 4  -> create node(4)
         build()  reads #  -> null
         build()  reads #  -> null
         node(4).left = null, .right = null
       node(3).left = null, .right = node(4)
     node(1).right = node(3)
   return node(1)
```

Reconstruction is exact: same shape, same values, no ambiguity.

## visualization
Snapshot 1 — the encoding embeds every null as a leaf:
```
   actual tree:           encoded tree (nulls drawn):
        1                          1
       / \                        / \
      2   3                      2   3
           \                    / \ / \
            4                  #  # #  4
                                      / \
                                     #   #
```

Snapshot 2 — the serialization is a preorder DFS of THIS augmented tree:
```
   visit order:   1, 2, #, #, 3, #, 4, #, #
                  ^  ^  ^  ^  ^  ^  ^  ^  ^
                  1  2  L  R  3  L  4  L  R   (L/R indicate null children)
```

Snapshot 3 — deserialization driver:
```
   tokens (queue):  [ 1 | 2 | # | # | 3 | # | 4 | # | # ]
                      ^
                  pop_front each recursive call
   stack of build() frames mirrors the tree shape exactly.
```

Snapshot 4 — why a delimiter matters when values have variable width:
```
   tokens "10,2,#,#" — comma-delimited.
   without delimiter "102##" is ambiguous: 1|0|2 or 10|2 ?
   always join with a separator that cannot appear inside a value.
```

## bruteForce
A common wrong attempt: emit plain preorder, then reconstruct with "the first element is root, find left subtree by size, recurse." This needs the tree to be a BST (so left < root) or for you to *also* emit inorder. Doable but requires two traversals and an O(n²) reconstruction (or O(n) with a hashmap of inorder positions). Preorder-with-nulls beats it on every axis: one traversal, linear time, no value-uniqueness assumption.

## optimal
**Serialize** (preorder DFS):
```
def serialize(node):
    if not node: return "#"
    return f"{node.val},{serialize(node.left)},{serialize(node.right)}"
```

**Deserialize** (consume tokens via shared iterator/queue):
```
def deserialize(s):
    tokens = iter(s.split(","))
    def build():
        v = next(tokens)
        if v == "#": return None
        node = TreeNode(int(v))
        node.left  = build()
        node.right = build()
        return node
    return build()
```

For very deep trees (skewed to n ≈ 10⁵ depth), switch to an iterative version using your own stack to avoid recursion limits.

## complexity
time: O(n) for both serialize and deserialize — each node visited once, each null emitted/consumed once.
space: O(n) for the output string; O(h) recursion stack, where h is tree height.
notes: The string length is exactly 2n+1 tokens for n nodes. Use a BFS/level-order variant if you want a more compact human-readable format with trailing nulls trimmed.

## pitfalls
- Forgetting null markers — plain preorder alone cannot uniquely reconstruct a binary tree when nodes have arbitrary values.
- Using `string.split(",")` on the receiving side but a *generator* on the sending side that emits without commas. Pick one delimiter and stick to it.
- Re-parsing the same token by passing the string and an index by value across recursive calls. Use a shared iterator, a mutable index object, or a queue/`deque`.
- Sending integer-only token streams without realizing values may be negative — verify your tokenizer handles `-5`.
- Recursing on a tree with depth 10⁵ — Python and Java default stacks blow up. Switch to iterative.

## interviewTips
- State the encoding choice and *why*: "Preorder with null markers, because it is single-pass, unambiguous, and decodes in O(n)."
- Use a `deque` (or queue/iterator) on deserialize so each recursive call consumes one token in O(1).
- Mention BFS-with-nulls as an alternative — it is more cache-friendly for very wide trees and slightly easier to inspect by eye.
- Be ready for the follow-up: "serialize a *general n-ary* tree." Same idea, but emit the child count too: `val,childCount,child1,child2,...`.

## code.python
```python
class Codec:
    def serialize(self, root) -> str:
        def dfs(node):
            if not node: vals.append("#"); return
            vals.append(str(node.val))
            dfs(node.left); dfs(node.right)
        vals = []
        dfs(root)
        return ",".join(vals)

    def deserialize(self, data: str):
        tokens = iter(data.split(","))
        def build():
            v = next(tokens)
            if v == "#": return None
            node = TreeNode(int(v))
            node.left  = build()
            node.right = build()
            return node
        return build()
```

## code.javascript
```javascript
class Codec {
  serialize(root) {
    const out = [];
    const dfs = (n) => {
      if (!n) { out.push("#"); return; }
      out.push(String(n.val));
      dfs(n.left); dfs(n.right);
    };
    dfs(root);
    return out.join(",");
  }
  deserialize(data) {
    const tokens = data.split(",");
    let i = 0;
    const build = () => {
      const v = tokens[i++];
      if (v === "#") return null;
      const node = new TreeNode(Number(v));
      node.left  = build();
      node.right = build();
      return node;
    };
    return build();
  }
}
```

## code.java
```java
public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        dfs(root, sb);
        return sb.toString();
    }
    private void dfs(TreeNode n, StringBuilder sb) {
        if (n == null) { sb.append("#,"); return; }
        sb.append(n.val).append(',');
        dfs(n.left, sb);
        dfs(n.right, sb);
    }
    public TreeNode deserialize(String data) {
        Deque<String> q = new ArrayDeque<>(Arrays.asList(data.split(",")));
        return build(q);
    }
    private TreeNode build(Deque<String> q) {
        String v = q.poll();
        if ("#".equals(v)) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v));
        n.left  = build(q);
        n.right = build(q);
        return n;
    }
}
```

## code.cpp
```cpp
class Codec {
    void dfs(TreeNode* n, string& out) {
        if (!n) { out += "#,"; return; }
        out += to_string(n->val) + ",";
        dfs(n->left,  out);
        dfs(n->right, out);
    }
    TreeNode* build(queue<string>& q) {
        string v = q.front(); q.pop();
        if (v == "#") return nullptr;
        TreeNode* n = new TreeNode(stoi(v));
        n->left  = build(q);
        n->right = build(q);
        return n;
    }
public:
    string serialize(TreeNode* root) { string s; dfs(root, s); return s; }
    TreeNode* deserialize(string data) {
        queue<string> q; string tok;
        stringstream ss(data);
        while (getline(ss, tok, ',')) q.push(tok);
        return build(q);
    }
};
```
