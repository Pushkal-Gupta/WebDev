-- Solution approaches: linkedlist (4) + trees (5) + tries (3) + heap (4)
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'reverse-linked-list','merge-two-sorted','linked-list-cycle','reorder-list',
  'invert-binary-tree','max-depth-binary-tree','same-tree','subtree-of-another','level-order-traversal',
  'implement-trie','design-add-search','word-search-ii',
  'kth-largest-element','last-stone-weight','k-closest-points','task-scheduler'
);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

-- ====================== LINKEDLIST ======================

('reverse-linked-list', 1, 'Iterative Three-Pointer',
'Walk the list with prev, curr, and a saved next. At each step, flip curr.next to point backwards at prev, then slide all three pointers forward.',
'["prev = null, curr = head.","While curr: nxt = curr.next; curr.next = prev; prev = curr; curr = nxt.","Return prev (the new head)."]'::jsonb,
$PY$class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev
$PY$,
$JS$var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
};
$JS$,
$JAVA$class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('merge-two-sorted', 1, 'Dummy Head Splice',
'Use a dummy head and a tail pointer. Walk both lists with two pointers; at each step append the smaller node to the tail. When one list runs out, the other''s tail is already sorted — splice it on.',
'["dummy = ListNode(), tail = dummy.","While l1 and l2: if l1.val <= l2.val, tail.next = l1; l1 = l1.next; else tail.next = l2; l2 = l2.next; advance tail.","tail.next = l1 or l2 (whichever is non-null).","Return dummy.next."]'::jsonb,
$PY$class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode()
        tail = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next
        tail.next = list1 or list2
        return dummy.next
$PY$,
$JS$var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode();
    let tail = dummy;
    while (list1 && list2) {
        if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
        else { tail.next = list2; list2 = list2.next; }
        tail = tail.next;
    }
    tail.next = list1 || list2;
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode();
        ListNode tail = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
            else { tail.next = list2; list2 = list2.next; }
            tail = tail.next;
        }
        tail.next = list1 != null ? list1 : list2;
        return dummy.next;
    }
}
$JAVA$,
'O(n + m)', 'O(1)'),

('linked-list-cycle', 1, 'Floyd''s Tortoise and Hare',
'Move one pointer by one step and another by two steps. If there is a cycle, the fast pointer will eventually lap and meet the slow one; otherwise fast hits null.',
'["slow = head, fast = head.","While fast and fast.next: slow = slow.next; fast = fast.next.next.","If slow == fast, return true.","Return false if fast exits the loop."]'::jsonb,
$PY$class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                return True
        return False
$PY$,
$JS$var hasCycle = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};
$JS$,
$JAVA$public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('reorder-list', 1, 'Find Middle + Reverse + Merge',
'Split the list in half, reverse the second half in place, then interleave the two halves starting from the original head.',
'["Find middle with slow/fast: slow stops at the start of the second half.","Reverse the second half iteratively.","Walk two pointers (first half and reversed second half) and splice them alternately.","The in-place result is L0 -> Ln -> L1 -> Ln-1 -> ..."]'::jsonb,
$PY$class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        prev = None
        curr = slow.next
        slow.next = None
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        first, second = head, prev
        while second:
            t1, t2 = first.next, second.next
            first.next = second
            second.next = t1
            first, second = t1, t2
$PY$,
$JS$var reorderList = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
    let prev = null, curr = slow.next;
    slow.next = null;
    while (curr) { const nxt = curr.next; curr.next = prev; prev = curr; curr = nxt; }
    let first = head, second = prev;
    while (second) {
        const t1 = first.next, t2 = second.next;
        first.next = second;
        second.next = t1;
        first = t1; second = t2;
    }
};
$JS$,
$JAVA$class Solution {
    public void reorderList(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode prev = null, curr = slow.next;
        slow.next = null;
        while (curr != null) { ListNode nxt = curr.next; curr.next = prev; prev = curr; curr = nxt; }
        ListNode first = head, second = prev;
        while (second != null) {
            ListNode t1 = first.next, t2 = second.next;
            first.next = second;
            second.next = t1;
            first = t1; second = t2;
        }
    }
}
$JAVA$,
'O(n)', 'O(1)'),

-- ====================== TREES ======================

('invert-binary-tree', 1, 'Recursive Swap',
'Invert the tree by recursively inverting each subtree and swapping a node''s children.',
'["If node is null, return null.","Recursively invert left and right subtrees.","Swap node.left and node.right.","Return node."]'::jsonb,
$PY$class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
$PY$,
$JS$var invertTree = function(root) {
    if (!root) return null;
    const left = invertTree(root.right);
    const right = invertTree(root.left);
    root.left = left;
    root.right = right;
    return root;
};
$JS$,
$JAVA$class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode left = invertTree(root.right);
        TreeNode right = invertTree(root.left);
        root.left = left;
        root.right = right;
        return root;
    }
}
$JAVA$,
'O(n)', 'O(h)'),

('max-depth-binary-tree', 1, 'Recursive DFS',
'A tree''s depth is 1 plus the maximum depth of its children. Null nodes have depth 0.',
'["If root is null, return 0.","Return 1 + max(maxDepth(root.left), maxDepth(root.right))."]'::jsonb,
$PY$class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))
$PY$,
$JS$var maxDepth = function(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
};
$JS$,
$JAVA$class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}
$JAVA$,
'O(n)', 'O(h)'),

('same-tree', 1, 'Recursive Structural Compare',
'Two trees are equal iff their roots match and both subtrees are equal. Recurse; any divergence in structure or value is an early-out.',
'["If both nodes are null, return true.","If exactly one is null, return false.","If values differ, return false.","Recursively check left and right subtrees with AND."]'::jsonb,
$PY$class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        if not p and not q:
            return True
        if not p or not q or p.val != q.val:
            return False
        return self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)
$PY$,
$JS$var isSameTree = function(p, q) {
    if (!p && !q) return true;
    if (!p || !q || p.val !== q.val) return false;
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
};
$JS$,
$JAVA$class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null || p.val != q.val) return false;
        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}
$JAVA$,
'O(min(n, m))', 'O(min(h1, h2))'),

('subtree-of-another', 1, 'DFS + SameTree Check',
'At every node of root, check whether the subtree rooted there is structurally identical to subRoot using the classic same-tree helper.',
'["If root is null, return false.","If sameTree(root, subRoot), return true.","Otherwise recurse into root.left or root.right.","Helper sameTree mirrors the Same Tree problem."]'::jsonb,
$PY$class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        if not root:
            return False
        if self.sameTree(root, subRoot):
            return True
        return self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)

    def sameTree(self, a, b):
        if not a and not b:
            return True
        if not a or not b or a.val != b.val:
            return False
        return self.sameTree(a.left, b.left) and self.sameTree(a.right, b.right)
$PY$,
$JS$var isSubtree = function(root, subRoot) {
    const sameTree = (a, b) => {
        if (!a && !b) return true;
        if (!a || !b || a.val !== b.val) return false;
        return sameTree(a.left, b.left) && sameTree(a.right, b.right);
    };
    if (!root) return false;
    if (sameTree(root, subRoot)) return true;
    return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
};
$JS$,
$JAVA$class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (root == null) return false;
        if (sameTree(root, subRoot)) return true;
        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }
    private boolean sameTree(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null || a.val != b.val) return false;
        return sameTree(a.left, b.left) && sameTree(a.right, b.right);
    }
}
$JAVA$,
'O(n * m)', 'O(h1 + h2)'),

('level-order-traversal', 1, 'BFS with Level Size Snapshot',
'Push the root into a queue. At each iteration, the queue holds an entire level; pop exactly that many nodes, record their values, and push their non-null children for the next level.',
'["If root is null, return [].","queue = deque([root]).","While queue: size = len(queue). Pop size nodes into a level list; push their non-null children.","Append level to result."]'::jsonb,
$PY$class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root:
            return []
        from collections import deque
        queue = deque([root])
        result = []
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left: queue.append(node.left)
                if node.right: queue.append(node.right)
            result.append(level)
        return result
$PY$,
$JS$var levelOrder = function(root) {
    if (!root) return [];
    const queue = [root];
    const result = [];
    while (queue.length) {
        const level = [];
        const size = queue.length;
        for (let i = 0; i < size; i++) {
            const node = queue.shift();
            level.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
        result.push(level);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            result.add(level);
        }
        return result;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ====================== TRIES ======================

('implement-trie', 1, 'Nested Dict Trie',
'Each node is a dictionary mapping char -> child node, plus an end-of-word flag. Insert walks/creates the chain; search requires reaching is_end; startsWith only requires reaching the last char.',
'["TrieNode: {children: dict, end: bool}.","insert(word): walk from root creating missing children; at the last char set end = true.","search(word): walk; return false if any char missing; return last.end.","startsWith(prefix): walk; return false if any char missing; return true otherwise."]'::jsonb,
$PY$class Trie:
    def __init__(self):
        self.children = {}
        self.end = False

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = Trie()
            node = node.children[ch]
        node.end = True

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.end

    def startsWith(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node
$PY$,
$JS$var Trie = function() {
    this.children = {};
    this.end = false;
};
Trie.prototype.insert = function(word) {
    let node = this;
    for (const ch of word) {
        if (!node.children[ch]) node.children[ch] = new Trie();
        node = node.children[ch];
    }
    node.end = true;
};
Trie.prototype._walk = function(s) {
    let node = this;
    for (const ch of s) {
        if (!node.children[ch]) return null;
        node = node.children[ch];
    }
    return node;
};
Trie.prototype.search = function(word) {
    const node = this._walk(word);
    return !!node && node.end;
};
Trie.prototype.startsWith = function(prefix) {
    return this._walk(prefix) !== null;
};
$JS$,
$JAVA$class Trie {
    private Map<Character, Trie> children = new HashMap<>();
    private boolean end = false;

    public void insert(String word) {
        Trie node = this;
        for (char ch : word.toCharArray()) {
            node.children.computeIfAbsent(ch, k -> new Trie());
            node = node.children.get(ch);
        }
        node.end = true;
    }
    public boolean search(String word) {
        Trie node = walk(word);
        return node != null && node.end;
    }
    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }
    private Trie walk(String s) {
        Trie node = this;
        for (char ch : s.toCharArray()) {
            if (!node.children.containsKey(ch)) return null;
            node = node.children.get(ch);
        }
        return node;
    }
}
$JAVA$,
'O(L) per op', 'O(total chars inserted)'),

('design-add-search', 1, 'Trie with Wildcard DFS',
'Standard trie for addWord. For search, recurse on the trie: on a normal letter descend into that one child; on a "." wildcard try every child recursively.',
'["TrieNode: children dict + end flag.","addWord(word): same as a standard trie insert.","search(word): recursive DFS. On a normal char descend that child. On \".\" try every child. On end of word, return current node.end."]'::jsonb,
$PY$class WordDictionary:
    def __init__(self):
        self.children = {}
        self.end = False

    def addWord(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = WordDictionary()
            node = node.children[ch]
        node.end = True

    def search(self, word: str) -> bool:
        def dfs(i, node):
            if i == len(word):
                return node.end
            ch = word[i]
            if ch == '.':
                return any(dfs(i + 1, c) for c in node.children.values())
            return ch in node.children and dfs(i + 1, node.children[ch])
        return dfs(0, self)
$PY$,
$JS$var WordDictionary = function() {
    this.children = {};
    this.end = false;
};
WordDictionary.prototype.addWord = function(word) {
    let node = this;
    for (const ch of word) {
        if (!node.children[ch]) node.children[ch] = new WordDictionary();
        node = node.children[ch];
    }
    node.end = true;
};
WordDictionary.prototype.search = function(word) {
    const dfs = (i, node) => {
        if (i === word.length) return node.end;
        const ch = word[i];
        if (ch === '.') {
            for (const c of Object.values(node.children)) if (dfs(i + 1, c)) return true;
            return false;
        }
        return node.children[ch] !== undefined && dfs(i + 1, node.children[ch]);
    };
    return dfs(0, this);
};
$JS$,
$JAVA$class WordDictionary {
    private Map<Character, WordDictionary> children = new HashMap<>();
    private boolean end = false;

    public void addWord(String word) {
        WordDictionary node = this;
        for (char ch : word.toCharArray()) {
            node.children.computeIfAbsent(ch, k -> new WordDictionary());
            node = node.children.get(ch);
        }
        node.end = true;
    }
    public boolean search(String word) {
        return dfs(word, 0, this);
    }
    private boolean dfs(String word, int i, WordDictionary node) {
        if (i == word.length()) return node.end;
        char ch = word.charAt(i);
        if (ch == '.') {
            for (WordDictionary c : node.children.values()) {
                if (dfs(word, i + 1, c)) return true;
            }
            return false;
        }
        return node.children.containsKey(ch) && dfs(word, i + 1, node.children.get(ch));
    }
}
$JAVA$,
'O(L) add, O(26^wild * L) search', 'O(total chars)'),

('word-search-ii', 1, 'Trie + DFS Backtracking',
'Insert every target word into a trie, then DFS from each cell descending the trie alongside the board. When you hit a trie node with a stored word, record it. Prune dead trie branches to speed up.',
'["Build a trie whose leaves store the full word.","For each cell (r, c), DFS that cell if board[r][c] is a child of the trie root.","In DFS: mark cell visited, descend trie, if node stores a word add it and clear the slot, recurse into 4 neighbors, un-mark.","Return the collected list."]'::jsonb,
$PY$class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        root = {}
        for w in words:
            node = root
            for ch in w:
                node = node.setdefault(ch, {})
            node['$'] = w
        rows, cols = len(board), len(board[0])
        result = []
        def dfs(r, c, node):
            ch = board[r][c]
            child = node.get(ch)
            if not child:
                return
            if '$' in child:
                result.append(child['$'])
                del child['$']
            board[r][c] = '#'
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':
                    dfs(nr, nc, child)
            board[r][c] = ch
        for r in range(rows):
            for c in range(cols):
                dfs(r, c, root)
        return result
$PY$,
$JS$var findWords = function(board, words) {
    const root = {};
    for (const w of words) {
        let node = root;
        for (const ch of w) {
            if (!node[ch]) node[ch] = {};
            node = node[ch];
        }
        node['$'] = w;
    }
    const rows = board.length, cols = board[0].length;
    const result = [];
    const dfs = (r, c, node) => {
        const ch = board[r][c];
        const child = node[ch];
        if (!child) return;
        if (child['$']) { result.push(child['$']); delete child['$']; }
        board[r][c] = '#';
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== '#') {
                dfs(nr, nc, child);
            }
        }
        board[r][c] = ch;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, root);
    return result;
};
$JS$,
$JAVA$class Solution {
    static class Node { Map<Character, Node> children = new HashMap<>(); String word; }
    public List<String> findWords(char[][] board, String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char ch : w.toCharArray()) {
                node.children.putIfAbsent(ch, new Node());
                node = node.children.get(ch);
            }
            node.word = w;
        }
        List<String> result = new ArrayList<>();
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                dfs(board, r, c, root, result);
        return result;
    }
    private void dfs(char[][] board, int r, int c, Node node, List<String> result) {
        char ch = board[r][c];
        Node child = node.children.get(ch);
        if (child == null) return;
        if (child.word != null) { result.add(child.word); child.word = null; }
        board[r][c] = '#';
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc] != '#') {
                dfs(board, nr, nc, child, result);
            }
        }
        board[r][c] = ch;
    }
}
$JAVA$,
'O(cells * 4^L)', 'O(total word chars)'),

-- ====================== HEAP ======================

('kth-largest-element', 1, 'Min-Heap of Size K',
'Keep a min-heap containing the k largest elements seen so far. When its size exceeds k, pop the smallest. At the end the heap top is the k-th largest.',
'["Create an empty min-heap.","For each num: heappush(heap, num). If len(heap) > k, heappop.","Return heap[0]."]'::jsonb,
$PY$class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        import heapq
        heap = []
        for num in nums:
            heapq.heappush(heap, num)
            if len(heap) > k:
                heapq.heappop(heap)
        return heap[0]
$PY$,
$JS$var findKthLargest = function(nums, k) {
    nums.sort((a, b) => b - a);
    return nums[k - 1];
};
$JS$,
$JAVA$class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int num : nums) {
            heap.offer(num);
            if (heap.size() > k) heap.poll();
        }
        return heap.peek();
    }
}
$JAVA$,
'O(n log k)', 'O(k)'),

('last-stone-weight', 1, 'Max-Heap Simulation',
'Repeatedly pop the two heaviest stones, push back their difference if nonzero, and continue until at most one stone remains.',
'["Push -s for each stone (negation turns Python''s min-heap into a max-heap).","While len(heap) > 1: a = -heappop(heap); b = -heappop(heap); if a != b, heappush(heap, -(a - b)).","Return -heap[0] if heap else 0."]'::jsonb,
$PY$class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        import heapq
        heap = [-s for s in stones]
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)
            b = -heapq.heappop(heap)
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0
$PY$,
$JS$var lastStoneWeight = function(stones) {
    stones.sort((a, b) => a - b);
    while (stones.length > 1) {
        const a = stones.pop();
        const b = stones.pop();
        if (a !== b) {
            const diff = a - b;
            let lo = 0, hi = stones.length;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                if (stones[mid] < diff) lo = mid + 1;
                else hi = mid;
            }
            stones.splice(lo, 0, diff);
        }
    }
    return stones[0] || 0;
};
$JS$,
$JAVA$class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int a = heap.poll();
            int b = heap.poll();
            if (a != b) heap.offer(a - b);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}
$JAVA$,
'O(n log n)', 'O(n)'),

('k-closest-points', 1, 'Max-Heap of Size K by Squared Distance',
'Only relative distances matter, so we compare x^2 + y^2. Keep a max-heap of the k nearest points; push each point and pop the farthest when size exceeds k.',
'["Create an empty max-heap keyed by squared distance.","For each (x, y): heappush heap with (-(x*x + y*y), x, y). If size > k, pop.","Extract the k points from the heap and return."]'::jsonb,
$PY$class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        import heapq
        heap = []
        for x, y in points:
            d = x * x + y * y
            heapq.heappush(heap, (-d, x, y))
            if len(heap) > k:
                heapq.heappop(heap)
        return [[x, y] for _, x, y in heap]
$PY$,
$JS$var kClosest = function(points, k) {
    return points
        .map(p => [p[0] * p[0] + p[1] * p[1], p])
        .sort((a, b) => a[0] - b[0])
        .slice(0, k)
        .map(x => x[1]);
};
$JS$,
$JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) ->
            (b[0] * b[0] + b[1] * b[1]) - (a[0] * a[0] + a[1] * a[1]));
        for (int[] p : points) {
            heap.offer(p);
            if (heap.size() > k) heap.poll();
        }
        return heap.toArray(new int[0][]);
    }
}
$JAVA$,
'O(n log k)', 'O(k)'),

('task-scheduler', 1, 'Closed-Form with Max Frequency',
'Build a schedule of chunks of length n + 1, each starting with a "most-frequent" task. The minimum length is max(len(tasks), (max_freq - 1) * (n + 1) + count_with_max_freq).',
'["Count frequencies of all tasks.","max_freq = the largest count; count = number of tasks sharing that max.","formula = (max_freq - 1) * (n + 1) + count.","Return max(formula, len(tasks))."]'::jsonb,
$PY$class Solution:
    def leastInterval(self, tasks: List[str], n: int) -> int:
        from collections import Counter
        freq = Counter(tasks)
        max_freq = max(freq.values())
        count = sum(1 for v in freq.values() if v == max_freq)
        formula = (max_freq - 1) * (n + 1) + count
        return max(formula, len(tasks))
$PY$,
$JS$var leastInterval = function(tasks, n) {
    const freq = {};
    for (const t of tasks) freq[t] = (freq[t] || 0) + 1;
    const counts = Object.values(freq);
    const maxFreq = Math.max(...counts);
    const countMax = counts.filter(c => c === maxFreq).length;
    const formula = (maxFreq - 1) * (n + 1) + countMax;
    return Math.max(formula, tasks.length);
};
$JS$,
$JAVA$class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] freq = new int[26];
        for (char t : tasks) freq[t - 'A']++;
        int maxFreq = 0, countMax = 0;
        for (int f : freq) if (f > maxFreq) maxFreq = f;
        for (int f : freq) if (f == maxFreq) countMax++;
        int formula = (maxFreq - 1) * (n + 1) + countMax;
        return Math.max(formula, tasks.length);
    }
}
$JAVA$,
'O(n)', 'O(1)');

COMMIT;
SELECT (SELECT COUNT(*) FROM public."PGcode_solution_approaches") AS total_solutions;
