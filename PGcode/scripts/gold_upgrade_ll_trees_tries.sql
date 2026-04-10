-- Gold upgrade: linkedlist (4) + trees (5) + tries (3)
BEGIN;

-- ============== linkedlist ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given the <code>head</code> of a singly linked list, reverse the list, and return the reversed list.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  head = [1,2,3,4,5]
Output: [5,4,3,2,1]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  head = [1,2]
Output: [2,1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in the list is in the range <code>[0, 5000]</code>.</li>
  <li><code>-5000 &lt;= Node.val &lt;= 5000</code></li>
</ul>
$$,
  hints = ARRAY[
    'Iterative: walk the list with three pointers — prev (initially null), curr (initially head), and next.',
    'At each step: save next = curr.next, point curr.next at prev, then advance prev = curr and curr = next.',
    'Recursive variant: reverse the rest of the list, then make the second node point back at head — equally valid but uses O(n) call stack.'
  ]
WHERE id = 'reverse-linked-list';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given the heads of two sorted linked lists <code>list1</code> and <code>list2</code>. Merge the two lists into one <strong>sorted</strong> list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  list1 = [], list2 = []
Output: []</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in both lists is in the range <code>[0, 50]</code>.</li>
  <li><code>-100 &lt;= Node.val &lt;= 100</code></li>
  <li>Both <code>list1</code> and <code>list2</code> are sorted in non-decreasing order.</li>
</ul>
$$,
  hints = ARRAY[
    'Use a dummy head node so you don''t have to special-case the first append.',
    'Walk both lists with two pointers; at each step append the smaller node to your tail and advance that pointer.',
    'When one list runs out, the other''s remainder is already sorted — splice it on directly.'
  ]
WHERE id = 'merge-two-sorted';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given <code>head</code>, the head of a linked list, determine if the linked list has a cycle in it. There is a cycle if there is some node in the list that can be reached again by continuously following the <code>next</code> pointer. Return <code>true</code> if there is a cycle, otherwise <code>false</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  head = [3,2,0,-4], pos = 1
Output: true
Explanation: There is a cycle where the tail connects to the 1st node (0-indexed).</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  head = [1], pos = -1
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes is in the range <code>[0, 10<sup>4</sup>]</code>.</li>
  <li><code>-10<sup>5</sup> &lt;= Node.val &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Floyd''s tortoise and hare: two pointers, slow advances 1 step, fast advances 2 steps.',
    'If there is a cycle, fast will eventually lap and meet slow inside the cycle. If fast hits null first, there is no cycle.',
    'O(n) time, O(1) extra space — strictly better than the hash-set "seen nodes" approach.'
  ]
WHERE id = 'linked-list-cycle';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given the head of a singly linked list <code>L0 -&gt; L1 -&gt; ... -&gt; Ln - 1 -&gt; Ln</code>. Reorder the list to be on the following form: <code>L0 -&gt; Ln -&gt; L1 -&gt; Ln - 1 -&gt; L2 -&gt; Ln - 2 -&gt; ...</code>. You may not modify the values in the list''s nodes. Only nodes themselves may be changed.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  head = [1,2,3,4]
Output: [1,4,2,3]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  head = [1,2,3,4,5]
Output: [1,5,2,4,3]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes is in the range <code>[1, 5 * 10<sup>4</sup>]</code>.</li>
  <li><code>1 &lt;= Node.val &lt;= 1000</code></li>
</ul>
$$,
  hints = ARRAY[
    'Three sub-problems in sequence: (1) find the middle of the list with slow/fast pointers.',
    '(2) reverse the second half of the list in place.',
    '(3) merge the first half with the reversed second half by alternating one node from each.'
  ]
WHERE id = 'reorder-list';

-- ============== trees ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given the <code>root</code> of a binary tree, return its <strong>maximum depth</strong>. A binary tree''s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  root = [3,9,20,null,null,15,7]
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  root = [1,null,2]
Output: 2</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes is in the range <code>[0, 10<sup>4</sup>]</code>.</li>
  <li><code>-100 &lt;= Node.val &lt;= 100</code></li>
</ul>
$$,
  hints = ARRAY[
    'Recursive DFS: depth(node) = 1 + max(depth(node.left), depth(node.right)). Base case: null returns 0.',
    'Iterative BFS works too: count levels by processing one level at a time with a queue.',
    'Both run in O(n) time and O(h) space (h = tree height) for the recursive call stack.'
  ]
WHERE id = 'max-depth-binary-tree';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given the <code>root</code> of a binary tree, invert the tree, and return its root. To invert a binary tree, swap the left and right children of every node.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  root = [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  root = [2,1,3]
Output: [2,3,1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes is in the range <code>[0, 100]</code>.</li>
  <li><code>-100 &lt;= Node.val &lt;= 100</code></li>
</ul>
$$,
  hints = ARRAY[
    'Recursive: invert the left subtree, invert the right subtree, then swap the two children pointers.',
    'Base case: null subtree returns null. The order of operations doesn''t matter as long as you swap after recursing.',
    'Iterative version: BFS with a queue, popping each node and swapping its children before pushing them.'
  ]
WHERE id = 'invert-binary-tree';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given the roots of two binary trees <code>p</code> and <code>q</code>, write a function to check if they are the same or not. Two binary trees are considered the same if they are structurally identical, and the nodes have the same values.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  p = [1,2,3], q = [1,2,3]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  p = [1,2], q = [1,null,2]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in both trees is in the range <code>[0, 100]</code>.</li>
  <li><code>-10<sup>4</sup> &lt;= Node.val &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Recurse: if both nodes are null → true. If exactly one is null → false. If values differ → false.',
    'Otherwise both nodes exist and have equal values; recurse on left and right subtrees.',
    'Total work O(min(|p|, |q|)) — you stop at the first divergence.'
  ]
WHERE id = 'same-tree';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given the roots of two binary trees <code>root</code> and <code>subRoot</code>, return <code>true</code> if there is a subtree of <code>root</code> with the same structure and node values as <code>subRoot</code>, and <code>false</code> otherwise.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  root = [3,4,5,1,2], subRoot = [4,1,2]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in <code>root</code> is in the range <code>[1, 2000]</code>.</li>
  <li>The number of nodes in <code>subRoot</code> is in the range <code>[1, 1000]</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'Two helpers: sameTree(a, b) checks structural equality, and contains(node, sub) walks root looking for a starting match.',
    'At each node in root, return true if sameTree(node, subRoot), or contains(node.left, subRoot), or contains(node.right, subRoot).',
    'Total time O(|root| * |subRoot|) in the worst case. The serialize-and-substring trick can be O(|root| + |subRoot|) but is trickier to implement correctly.'
  ]
WHERE id = 'subtree-of-another';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given the <code>root</code> of a binary tree, return the <strong>level order traversal</strong> of its nodes'' values (from left to right, level by level).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  root = []
Output: []</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes is in the range <code>[0, 2000]</code>.</li>
  <li><code>-1000 &lt;= Node.val &lt;= 1000</code></li>
</ul>
$$,
  hints = ARRAY[
    'BFS with a queue. At each iteration, snapshot the current queue size = the number of nodes on this level.',
    'Pop exactly that many nodes into a new sublist, and push their non-null children for the next level.',
    'Append each level''s sublist to the answer. O(n) time, O(width) space.'
  ]
WHERE id = 'level-order-traversal';

-- ============== tries ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>A <strong>trie</strong> (pronounced as "try") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement the <code>Trie</code> class with the following operations:</p>
<ul>
  <li><code>insert(word)</code> Inserts the string <code>word</code> into the trie.</li>
  <li><code>search(word)</code> Returns <code>true</code> if <code>word</code> is in the trie (i.e., was inserted before), and <code>false</code> otherwise.</li>
  <li><code>startsWith(prefix)</code> Returns <code>true</code> if there is a previously inserted string that has <code>prefix</code> as a prefix.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input:
["Trie","insert","search","search","startsWith","insert","search"]
[[],["apple"],["apple"],["app"],["app"],["app"],["app"]]
Output:
[null,null,true,false,true,null,true]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= word.length, prefix.length &lt;= 2000</code></li>
  <li><code>word</code> and <code>prefix</code> consist only of lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Each node holds a children map (char → node) and a boolean is_end_of_word.',
    'Insert walks the chain creating nodes as needed; at the final character, set is_end_of_word = true.',
    'search(word) requires walking AND finding is_end_of_word at the last node; startsWith(prefix) only requires the walk to succeed.'
  ]
WHERE id = 'implement-trie';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Design a data structure that supports adding new words and finding if a string matches any previously added string. Implement the <code>WordDictionary</code> class:</p>
<ul>
  <li><code>addWord(word)</code> Adds <code>word</code> to the data structure.</li>
  <li><code>search(word)</code> Returns <code>true</code> if any string previously added matches <code>word</code>. <code>word</code> may contain dots <code>'.'</code> where dots can match any letter.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input:
["WordDictionary","addWord","addWord","addWord","search","search","search","search"]
[[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]
Output: [null,null,null,null,false,true,true,true]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= word.length &lt;= 25</code></li>
  <li><code>word</code> in <code>addWord</code> consists of lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Use a standard trie for addWord — same as Implement Trie.',
    'For search, recurse on the trie. On a normal letter, descend to that single child.',
    'On a "." wildcard, recursively try every existing child of the current node — return true if any branch matches.'
  ]
WHERE id = 'design-add-search';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an <code>m x n</code> grid <code>board</code> of letters and a list of strings <code>words</code>, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]],
        words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  board = [["a","b"],["c","d"]], words = ["abcb"]
Output: []</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == board.length</code>, <code>n == board[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 12</code></li>
  <li><code>1 &lt;= words.length &lt;= 3 * 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Insert all words into a trie. This lets you reject impossible prefixes early during the DFS on the board.',
    'DFS from every cell, descending the trie alongside the board walk. Mark visited cells temporarily with a sentinel and restore on backtrack.',
    'When you reach a trie node with a stored word, add it to results and clear that flag (to avoid duplicates). Optionally prune dead trie branches as you go.'
  ]
WHERE id = 'word-search-ii';

COMMIT;

SELECT topic_id, COUNT(*) FILTER (WHERE position('Example' in description) > 0) AS gold_count, COUNT(*) AS total
FROM public."PGcode_problems"
WHERE topic_id IN ('linkedlist','trees','tries')
GROUP BY topic_id ORDER BY topic_id;
