#!/usr/bin/env node
// Builds /tmp/patch-w3-400-23.json with editorial_md, solutions, expanded test_cases,
// expanded hints, and pattern fixes for the 40-slug slice.

import fs from 'node:fs';

const state = JSON.parse(fs.readFileSync('/tmp/state-w3-400-23.json', 'utf8'));
const byId = Object.fromEntries(state.map(p => [p.id, p]));

const PATCHES = {};

// ---------- helpers ----------
function ed(intuition, approach, complexity, pitfalls) {
  return `## Intuition\n${intuition}\n\n## Approach\n${approach}\n\n## Complexity\n${complexity}\n\n## Pitfalls\n${pitfalls}`;
}

function add(id, patch) { PATCHES[id] = patch; }

// ============================================================
// maximal-square
// ============================================================
add('maximal-square', {
  pattern: '2d-dp-grid',
  hints: [
    'Let dp[i][j] = side length of the largest all-ones square whose bottom-right corner is at (i, j).',
    'If matrix[i][j] == "1", dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]). The min of the three neighbors is the binding constraint — a square can only grow if all three smaller squares are present.',
    'If matrix[i][j] == "0", dp[i][j] = 0. Track the maximum side length seen, and return its square at the end.',
    'You can compress to O(n) memory using one row plus a single saved "topleft" value, since each cell only depends on the row above and the cell to the left.',
  ],
  test_cases: [
    { inputs: ['[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]'], expected: '4' },
    { inputs: ['[["0","1"],["1","0"]]'], expected: '1' },
    { inputs: ['[["0"]]'], expected: '0' },
    { inputs: ['[["1"]]'], expected: '1' },
    { inputs: ['[["1","1"],["1","1"]]'], expected: '4' },
    { inputs: ['[["1","1","1"],["1","1","1"],["1","1","1"]]'], expected: '9' },
    { inputs: ['[["0","0","0"],["0","0","0"],["0","0","0"]]'], expected: '0' },
    { inputs: ['[["1","0","1","1","0","1"],["1","1","1","1","1","1"],["0","1","1","0","1","1"],["1","1","1","0","1","0"],["0","1","1","1","1","1"],["1","1","0","1","1","1"]]'], expected: '4' },
    { inputs: ['[["1","1","1","1"],["1","1","1","1"],["1","1","1","1"]]'], expected: '9' },
    { inputs: ['[["0","0","0","1"],["1","1","0","1"],["1","1","1","1"],["0","1","1","1"],["0","1","1","1"]]'], expected: '9' },
    { inputs: ['[["1","0"]]'], expected: '1' },
    { inputs: ['[["1"],["1"],["1"],["1"]]'], expected: '1' },
  ],
  editorial_md: ed(
    'Squares grow from their bottom-right corner. If three smaller squares (above, left, diagonal-up-left) all exist, the current cell can extend them into a bigger square — and only as far as the smallest of those three allows. That structural fact turns a 2D area problem into a 1D recurrence on side length.',
    'Define `dp[i][j]` as the side length of the largest all-ones square whose bottom-right corner is at `(i, j)`. The recurrence is:\n\n- If `matrix[i][j] == "0"`, then `dp[i][j] = 0` — no square can end here.\n- Otherwise, `dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. The +1 adds the current cell; the min picks the largest square that already exists in all three neighbor positions, because a bigger square here requires bigger squares at all three.\n\nWalk row by row, column by column, filling `dp` and tracking the global max side length. The answer is `maxSide * maxSide` (the problem asks for area, not side). For memory you can compress to one row plus a saved "previous diagonal" value, since each new cell only needs the row above and the cell immediately to its left.',
    'Time O(m·n) — one constant-time update per cell. Space O(m·n) for the full DP table, or O(n) with the rolling-row optimization. Both fit comfortably in interview limits.',
    'Returning the side length instead of the area is the classic off-by-square mistake. The matrix entries are characters ("0"/"1"), not integers — comparing to numeric 1 silently fails in some languages. With the rolling-row optimization, you must save `dp[i-1][j-1]` into a local before overwriting `dp[j-1]`, otherwise you lose the diagonal value.'
  ),
  solutions: {
    python: `class Solution:
    def maximalSquare(self, matrix):
        if not matrix or not matrix[0]:
            return 0
        m, n = len(matrix), len(matrix[0])
        dp = [0] * (n + 1)
        best = 0
        prev = 0
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                temp = dp[j]
                if matrix[i-1][j-1] == "1":
                    dp[j] = 1 + min(dp[j], dp[j-1], prev)
                    if dp[j] > best:
                        best = dp[j]
                else:
                    dp[j] = 0
                prev = temp
        return best * best
`,
    javascript: `var maximalSquare = function(matrix) {
    if (!matrix.length || !matrix[0].length) return 0;
    const m = matrix.length, n = matrix[0].length;
    const dp = new Array(n + 1).fill(0);
    let best = 0, prev = 0;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const temp = dp[j];
            if (matrix[i-1][j-1] === "1") {
                dp[j] = 1 + Math.min(dp[j], dp[j-1], prev);
                if (dp[j] > best) best = dp[j];
            } else {
                dp[j] = 0;
            }
            prev = temp;
        }
    }
    return best * best;
};
`,
    java: `class Solution {
    public int maximalSquare(char[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return 0;
        int m = matrix.length, n = matrix[0].length;
        int[] dp = new int[n + 1];
        int best = 0, prev = 0;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int temp = dp[j];
                if (matrix[i-1][j-1] == '1') {
                    dp[j] = 1 + Math.min(Math.min(dp[j], dp[j-1]), prev);
                    if (dp[j] > best) best = dp[j];
                } else {
                    dp[j] = 0;
                }
                prev = temp;
            }
        }
        return best * best;
    }
}
`,
    cpp: `class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return 0;
        int m = matrix.size(), n = matrix[0].size();
        vector<int> dp(n + 1, 0);
        int best = 0, prev = 0;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int temp = dp[j];
                if (matrix[i-1][j-1] == '1') {
                    dp[j] = 1 + min({dp[j], dp[j-1], prev});
                    if (dp[j] > best) best = dp[j];
                } else {
                    dp[j] = 0;
                }
                prev = temp;
            }
        }
        return best * best;
    }
};
`,
  },
});

// ============================================================
// dungeon-game
// ============================================================
add('dungeon-game', {
  pattern: 'bottom-up-dp-on-grid',
  hints: [
    'Work backwards from the princess cell. Forward DP fails because the minimum HP needed depends on what you face later, not what you collected so far.',
    'Let dp[i][j] = minimum HP required at cell (i,j) to reach the princess. Base case: dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1]).',
    'Transition: need = min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]. If need <= 0, you only need 1 HP to enter (knight must stay alive). So dp[i][j] = max(1, need).',
    'Pad the right and bottom borders with +infinity so the boundary "neighbors" never get chosen by the min — clean way to avoid index checks.',
  ],
  test_cases: [
    { inputs: ['[[-2,-3,3],[-5,-10,1],[10,30,-5]]'], expected: '7' },
    { inputs: ['[[0]]'], expected: '1' },
    { inputs: ['[[100]]'], expected: '1' },
    { inputs: ['[[-3]]'], expected: '4' },
    { inputs: ['[[1,-3,3],[0,-2,0],[-3,-3,-3]]'], expected: '3' },
    { inputs: ['[[-1,-2,-3],[-4,-5,-6],[-7,-8,-9]]'], expected: '17' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '1' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: '1' },
    { inputs: ['[[-2,-3,3]]'], expected: '3' },
    { inputs: ['[[-2],[-3],[3]]'], expected: '3' },
    { inputs: ['[[2,3,4]]'], expected: '1' },
    { inputs: ['[[-100,-100],[-100,-100]]'], expected: '201' },
  ],
  editorial_md: ed(
    'A forward DP that tracks "best HP arriving at (i,j)" fails because a cell that looks great now may force you into a punishing path later. The constraint is global: you must survive every cell. Working backwards from the princess lets each cell answer "given the minimum HP needed beyond me, what HP do I need to enter and still survive?"',
    'Define `dp[i][j]` = minimum HP the knight must have when *entering* `(i,j)` to reach the princess and survive every cell along the way. The princess cell has `dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1])` — you need enough HP that after applying the cell\'s damage you still have at least 1.\n\nFor any other cell, the knight will go right or down to whichever neighbor demands less. Let `nextNeed = min(dp[i+1][j], dp[i][j+1])`. To survive `(i,j)` and arrive at the next cell with `nextNeed` HP, you need `nextNeed - dungeon[i][j]` HP on entry. If that\'s zero or negative, you still need 1 (alive constraint), so `dp[i][j] = max(1, nextNeed - dungeon[i][j])`.\n\nFill the grid from bottom-right to top-left. Boundary handling: pad the row below and column to the right with `+infinity` so the `min` ignores out-of-bounds neighbors. The answer is `dp[0][0]`.',
    'Time O(m·n) — one constant-time update per cell. Space O(m·n) for the full table, or O(n) with a rolling row reused right-to-left.',
    'Forward DP looks tempting but cannot capture the "survive every step" constraint. Forgetting the `max(1, ...)` floor causes you to think a high-HP cell lets you enter with zero, which dies on touch. Reading the wrong neighbor (right of bottom row, down of right column) without boundary padding gives garbage values.'
  ),
  solutions: {
    python: `class Solution:
    def calculateMinimumHP(self, dungeon):
        m, n = len(dungeon), len(dungeon[0])
        INF = float('inf')
        dp = [INF] * (n + 1)
        dp[n - 1] = 1
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                nxt = min(dp[j], dp[j + 1])
                dp[j] = max(1, nxt - dungeon[i][j])
            dp[n] = INF
        return dp[0]
`,
    javascript: `var calculateMinimumHP = function(dungeon) {
    const m = dungeon.length, n = dungeon[0].length;
    const INF = Infinity;
    const dp = new Array(n + 1).fill(INF);
    dp[n - 1] = 1;
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            const nxt = Math.min(dp[j], dp[j + 1]);
            dp[j] = Math.max(1, nxt - dungeon[i][j]);
        }
        dp[n] = INF;
    }
    return dp[0];
};
`,
    java: `class Solution {
    public int calculateMinimumHP(int[][] dungeon) {
        int m = dungeon.length, n = dungeon[0].length;
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[n - 1] = 1;
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int nxt = Math.min(dp[j], dp[j + 1]);
                dp[j] = Math.max(1, nxt - dungeon[i][j]);
            }
            dp[n] = Integer.MAX_VALUE;
        }
        return dp[0];
    }
}
`,
    cpp: `class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {
        int m = dungeon.size(), n = dungeon[0].size();
        const int INF = INT_MAX;
        vector<int> dp(n + 1, INF);
        dp[n - 1] = 1;
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int nxt = min(dp[j], dp[j + 1]);
                dp[j] = max(1, nxt - dungeon[i][j]);
            }
            dp[n] = INF;
        }
        return dp[0];
    }
};
`,
  },
});

// ============================================================
// cherry-pickup
// ============================================================
add('cherry-pickup', {
  pattern: 'two-walker-dp',
  hints: [
    'Going forward then back is equivalent to two walkers both going forward simultaneously — only collecting a cell once when both happen to land on it.',
    'Use 3D DP indexed by (r1, c1, c2). Since both walkers take the same number of steps, r2 = r1 + c1 - c2.',
    'At each step, each walker came from one of two prior positions. Take the max over the 4 (2x2) transitions, then add this step\'s cherry count.',
    'If either cell is a thorn (-1), return -infinity to mark the path as impossible. Cap the final answer with max(0, dp[...]) since a fully blocked path returns 0.',
  ],
  test_cases: [
    { inputs: ['[[0,1,-1],[1,0,-1],[1,1,1]]'], expected: '5' },
    { inputs: ['[[1,1,-1],[1,-1,1],[-1,1,1]]'], expected: '0' },
    { inputs: ['[[1]]'], expected: '1' },
    { inputs: ['[[0]]'], expected: '0' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '5' },
    { inputs: ['[[1,1,1,1],[0,1,1,1],[1,1,1,0],[1,0,1,1]]'], expected: '8' },
    { inputs: ['[[1,1],[1,1]]'], expected: '3' },
    { inputs: ['[[0,0],[0,0]]'], expected: '0' },
    { inputs: ['[[1,0,0],[0,0,0],[0,0,1]]'], expected: '2' },
    { inputs: ['[[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]]'], expected: '9' },
  ],
  editorial_md: ed(
    'Walking from top-left to bottom-right and back is equivalent to two independent walkers both moving forward from top-left to bottom-right, because we can reverse the return path. The only subtlety: if both walkers land on the same cherry cell, it only counts once. That reframing lets us use a polynomial-time DP on grid coordinates instead of exponential path enumeration.',
    'Let `dp[r1][c1][c2]` = maximum cherries collected when walker 1 is at `(r1, c1)` and walker 2 is at `(r2, c2)`, given both have walked the same number of steps. The constraint `r1 + c1 == r2 + c2` lets us derive `r2 = r1 + c1 - c2`, dropping the state to three dimensions.\n\nFrom step k, each walker moves right or down — four total combinations. The recurrence is `dp[r1][c1][c2] = cherries + max(dp[r1-1][c1][c2-1], dp[r1-1][c1][c2], dp[r1][c1-1][c2-1], dp[r1][c1-1][c2])`, where `cherries = grid[r1][c1] + (grid[r2][c2] if r1 != r2 else 0)`. If either current cell is a thorn (-1), this path is invalid — return -infinity to poison it.\n\nBase case: `dp[0][0][0] = grid[0][0]`. Answer: `max(0, dp[n-1][n-1][n-1])`. The `max(0, ...)` handles boards where no path exists.',
    'Time O(n^3) — three nested loops over the grid coordinates with constant-time transitions. Space O(n^3) for the table, reducible to O(n^2) by rolling the `r1` dimension.',
    'Double-counting cherries when both walkers occupy the same cell is the classic bug — guard with `r1 != r2`. Using `0` as the sentinel for blocked paths instead of `-infinity` lets bad paths win comparisons. Forgetting `max(0, dp[...])` reports a negative result when the grid is fully blocked.'
  ),
  solutions: {
    python: `class Solution:
    def cherryPickup(self, grid):
        n = len(grid)
        NEG = float('-inf')
        from functools import lru_cache

        @lru_cache(maxsize=None)
        def dp(r1, c1, c2):
            r2 = r1 + c1 - c2
            if r1 >= n or c1 >= n or r2 >= n or c2 >= n:
                return NEG
            if grid[r1][c1] == -1 or grid[r2][c2] == -1:
                return NEG
            if r1 == n - 1 and c1 == n - 1:
                return grid[r1][c1]
            cherries = grid[r1][c1]
            if (r1, c1) != (r2, c2):
                cherries += grid[r2][c2]
            best = max(
                dp(r1 + 1, c1, c2 + 1),
                dp(r1 + 1, c1, c2),
                dp(r1, c1 + 1, c2 + 1),
                dp(r1, c1 + 1, c2),
            )
            return NEG if best == NEG else cherries + best

        return max(0, dp(0, 0, 0))
`,
    javascript: `var cherryPickup = function(grid) {
    const n = grid.length;
    const NEG = -Infinity;
    const memo = new Map();
    function dp(r1, c1, c2) {
        const r2 = r1 + c1 - c2;
        if (r1 >= n || c1 >= n || r2 >= n || c2 >= n) return NEG;
        if (grid[r1][c1] === -1 || grid[r2][c2] === -1) return NEG;
        if (r1 === n - 1 && c1 === n - 1) return grid[r1][c1];
        const key = r1 * 2500 + c1 * 50 + c2;
        if (memo.has(key)) return memo.get(key);
        let cherries = grid[r1][c1];
        if (r1 !== r2 || c1 !== c2) cherries += grid[r2][c2];
        const best = Math.max(
            dp(r1 + 1, c1, c2 + 1),
            dp(r1 + 1, c1, c2),
            dp(r1, c1 + 1, c2 + 1),
            dp(r1, c1 + 1, c2)
        );
        const val = best === NEG ? NEG : cherries + best;
        memo.set(key, val);
        return val;
    }
    return Math.max(0, dp(0, 0, 0));
};
`,
    java: `class Solution {
    int n;
    int[][] g;
    Integer[][][] memo;
    final int NEG = Integer.MIN_VALUE;
    public int cherryPickup(int[][] grid) {
        n = grid.length;
        g = grid;
        memo = new Integer[n][n][n];
        return Math.max(0, dp(0, 0, 0));
    }
    int dp(int r1, int c1, int c2) {
        int r2 = r1 + c1 - c2;
        if (r1 >= n || c1 >= n || r2 >= n || c2 >= n) return NEG;
        if (g[r1][c1] == -1 || g[r2][c2] == -1) return NEG;
        if (r1 == n - 1 && c1 == n - 1) return g[r1][c1];
        if (memo[r1][c1][c2] != null) return memo[r1][c1][c2];
        int cherries = g[r1][c1] + ((r1 != r2 || c1 != c2) ? g[r2][c2] : 0);
        int best = Math.max(
            Math.max(dp(r1 + 1, c1, c2 + 1), dp(r1 + 1, c1, c2)),
            Math.max(dp(r1, c1 + 1, c2 + 1), dp(r1, c1 + 1, c2))
        );
        int val = (best == NEG) ? NEG : cherries + best;
        memo[r1][c1][c2] = val;
        return val;
    }
}
`,
    cpp: `class Solution {
public:
    int n;
    vector<vector<int>> g;
    vector<vector<vector<int>>> memo;
    const int NEG = INT_MIN;
    int dp(int r1, int c1, int c2) {
        int r2 = r1 + c1 - c2;
        if (r1 >= n || c1 >= n || r2 >= n || c2 >= n) return NEG;
        if (g[r1][c1] == -1 || g[r2][c2] == -1) return NEG;
        if (r1 == n - 1 && c1 == n - 1) return g[r1][c1];
        if (memo[r1][c1][c2] != INT_MAX) return memo[r1][c1][c2];
        int cherries = g[r1][c1] + ((r1 != r2 || c1 != c2) ? g[r2][c2] : 0);
        int best = max({dp(r1 + 1, c1, c2 + 1), dp(r1 + 1, c1, c2),
                        dp(r1, c1 + 1, c2 + 1), dp(r1, c1 + 1, c2)});
        return memo[r1][c1][c2] = (best == NEG ? NEG : cherries + best);
    }
    int cherryPickup(vector<vector<int>>& grid) {
        n = grid.size();
        g = grid;
        memo.assign(n, vector<vector<int>>(n, vector<int>(n, INT_MAX)));
        return max(0, dp(0, 0, 0));
    }
};
`,
  },
});

// ============================================================
// serialize-deserialize-bst (only serialize as test, since round-trip needs harness)
// ============================================================
add('serialize-deserialize-bst', {
  pattern: 'preorder-bst-encoding',
  hints: [
    'Preorder traversal uniquely determines a BST — no need for null markers. The BST ordering supplies the structural information that null markers usually carry.',
    'Serialize: produce a preorder string of values separated by commas.',
    'Deserialize: walk the preorder list with a (lo, hi) range. Each value must fall within the current range to belong to the current subtree.',
    'For each value v, build a node, recurse left with range (lo, v), recurse right with range (v, hi). When the next value is outside the range, return — that\'s the parent\'s cue to attach right.',
  ],
  test_cases: [
    { inputs: ['[2,1,3]'], expected: '"2,1,3"' },
    { inputs: ['[]'], expected: '""' },
    { inputs: ['[5,3,7,1,4,6,8]'], expected: '"5,3,1,4,7,6,8"' },
    { inputs: ['[1]'], expected: '"1"' },
    { inputs: ['[2,1]'], expected: '"2,1"' },
    { inputs: ['[1,null,2]'], expected: '"1,2"' },
    { inputs: ['[3,2,4,1]'], expected: '"3,2,1,4"' },
    { inputs: ['[10,5,15,3,7,12,18]'], expected: '"10,5,3,7,15,12,18"' },
    { inputs: ['[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]'], expected: '"8,4,2,1,3,6,5,7,12,10,9,11,14,13,15"' },
    { inputs: ['[20]'], expected: '"20"' },
    { inputs: ['[50,30,70,20,40,60,80]'], expected: '"50,30,20,40,70,60,80"' },
  ],
  editorial_md: ed(
    'Most serialization schemes need null markers because a preorder list alone is ambiguous for general binary trees. BSTs are different: the in-order is forced to be sorted, so preorder + the BST property pins down the tree exactly. That lets us skip nulls entirely and produce a compact, value-only encoding.',
    'Serialize: do a preorder traversal (root, left, right) and write each value separated by a comma. The empty tree serializes to the empty string.\n\nDeserialize: walk the list with an index pointer and recursive bounds `(lo, hi)`. The first value in range becomes the current root. For its left subtree, recurse with bounds `(lo, root.val)`; for the right, recurse with `(root.val, hi)`. When the next value falls outside the current range, return without consuming — that signals the parent to attach a right child or back out further. Use exclusive bounds since BSTs in this problem have distinct values.\n\nWhy preorder over inorder? Inorder gives you the sorted sequence but loses the tree shape. Preorder always reveals the current subtree root first, and combined with the BST range invariant, the structure reconstructs uniquely.',
    'Time O(n) for both encode and decode — each node touched a constant number of times. The decode uses an O(h) call stack. Space O(n) for the output string.',
    'Forgetting that the BST property removes the need for null markers leads to bloated encodings. Treating equal values incorrectly when the problem allows duplicates breaks the bounds check — switch to inclusive on one side or skip. Reading the index by value-copy instead of by-reference in the recursive call (Python int or Java primitive int) causes deserialize to revisit consumed values.'
  ),
  solutions: {
    python: `class Codec:
    def serialize(self, root):
        out = []
        def pre(node):
            if not node:
                return
            out.append(str(node.val))
            pre(node.left)
            pre(node.right)
        pre(root)
        return ",".join(out)

    def deserialize(self, data):
        if not data:
            return None
        vals = list(map(int, data.split(",")))
        idx = [0]
        def build(lo, hi):
            if idx[0] >= len(vals):
                return None
            v = vals[idx[0]]
            if v <= lo or v >= hi:
                return None
            idx[0] += 1
            node = TreeNode(v)
            node.left = build(lo, v)
            node.right = build(v, hi)
            return node
        return build(float('-inf'), float('inf'))
`,
    javascript: `var serialize = function(root) {
    const out = [];
    function pre(node) {
        if (!node) return;
        out.push(node.val);
        pre(node.left);
        pre(node.right);
    }
    pre(root);
    return out.join(",");
};

var deserialize = function(data) {
    if (!data) return null;
    const vals = data.split(",").map(Number);
    let idx = 0;
    function build(lo, hi) {
        if (idx >= vals.length) return null;
        const v = vals[idx];
        if (v <= lo || v >= hi) return null;
        idx++;
        const node = new TreeNode(v);
        node.left = build(lo, v);
        node.right = build(v, hi);
        return node;
    }
    return build(-Infinity, Infinity);
};
`,
    java: `public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        pre(root, sb);
        if (sb.length() > 0) sb.deleteCharAt(sb.length() - 1);
        return sb.toString();
    }
    private void pre(TreeNode node, StringBuilder sb) {
        if (node == null) return;
        sb.append(node.val).append(',');
        pre(node.left, sb);
        pre(node.right, sb);
    }
    int idx;
    int[] vals;
    public TreeNode deserialize(String data) {
        if (data.isEmpty()) return null;
        String[] parts = data.split(",");
        vals = new int[parts.length];
        for (int i = 0; i < parts.length; i++) vals[i] = Integer.parseInt(parts[i]);
        idx = 0;
        return build(Integer.MIN_VALUE, Integer.MAX_VALUE);
    }
    private TreeNode build(int lo, int hi) {
        if (idx >= vals.length) return null;
        int v = vals[idx];
        if (v <= lo || v >= hi) return null;
        idx++;
        TreeNode node = new TreeNode(v);
        node.left = build(lo, v);
        node.right = build(v, hi);
        return node;
    }
}
`,
    cpp: `class Codec {
public:
    string serialize(TreeNode* root) {
        string s;
        pre(root, s);
        if (!s.empty()) s.pop_back();
        return s;
    }
    void pre(TreeNode* node, string& s) {
        if (!node) return;
        s += to_string(node->val) + ",";
        pre(node->left, s);
        pre(node->right, s);
    }
    int idx;
    vector<int> vals;
    TreeNode* deserialize(string data) {
        if (data.empty()) return nullptr;
        vals.clear();
        stringstream ss(data);
        string tok;
        while (getline(ss, tok, ',')) vals.push_back(stoi(tok));
        idx = 0;
        return build(INT_MIN, INT_MAX);
    }
    TreeNode* build(int lo, int hi) {
        if (idx >= (int)vals.size()) return nullptr;
        int v = vals[idx];
        if (v <= lo || v >= hi) return nullptr;
        idx++;
        TreeNode* node = new TreeNode(v);
        node->left = build(lo, v);
        node->right = build(v, hi);
        return node;
    }
};
`,
  },
});

// ============================================================
// partition-list
// ============================================================
add('partition-list', {
  hints: [
    'Two dummy heads: `less` accumulates nodes with val < x, `geq` accumulates nodes with val >= x.',
    'Walk the original list. Append each node to the appropriate tail. Preserves relative order within each partition by construction.',
    'Stitch: less.tail.next = geq.head.next, and geq.tail.next = null to terminate.',
    'O(n) time, O(1) extra space. No node creation — we re-link existing nodes.',
  ],
  test_cases: [
    { inputs: ['[1,4,3,2,5,2]', '3'], expected: '[1,2,2,4,3,5]' },
    { inputs: ['[2,1]', '2'], expected: '[1,2]' },
    { inputs: ['[]', '0'], expected: '[]' },
    { inputs: ['[1]', '2'], expected: '[1]' },
    { inputs: ['[1]', '0'], expected: '[1]' },
    { inputs: ['[5,4,3,2,1]', '3'], expected: '[2,1,5,4,3]' },
    { inputs: ['[1,2,3,4,5]', '3'], expected: '[1,2,3,4,5]' },
    { inputs: ['[3,3,3]', '3'], expected: '[3,3,3]' },
    { inputs: ['[1,1,1,1]', '5'], expected: '[1,1,1,1]' },
    { inputs: ['[10,9,8,7,6]', '5'], expected: '[10,9,8,7,6]' },
    { inputs: ['[1,4,3,2,5,2]', '0'], expected: '[1,4,3,2,5,2]' },
    { inputs: ['[1,4,3,2,5,2]', '10'], expected: '[1,4,3,2,5,2]' },
  ],
  editorial_md: ed(
    'The trick: build two separate lists as you walk — one for "small" (val < x) and one for "big-or-equal" (val >= x). Then concatenate. Two dummy heads make the boundary handling trivial and let you append in O(1) using running tails. No node allocation; you only rewire `next` pointers, so the operation is in-place in the auxiliary-pointer sense.',
    'Create two dummy nodes, `lessDummy` and `geqDummy`, with running tails `lessTail` and `geqTail` initially pointing at them. Walk the input from `head`. For each node, detach it from whatever it points to next, then append to the correct tail: if `node.val < x`, do `lessTail.next = node; lessTail = node`; otherwise the same with `geqTail`.\n\nAfter the walk, terminate `geqTail.next = null` to cut any stale forward links from the original list. Then bridge: `lessTail.next = geqDummy.next`. Return `lessDummy.next`.\n\nThis preserves the relative order of nodes within each partition — that\'s the problem\'s key requirement, and it falls out for free because we always append at the tail. The algorithm is single-pass and uses no auxiliary memory beyond the two dummy nodes.',
    'Time O(n) — each node is visited exactly once. Space O(1) — only the two dummies and a handful of pointers.',
    'Forgetting to null-terminate the `geq` chain leaves a cycle when the original `geq` tail pointed to a `less` node that\'s now earlier in the merged list. Allocating new nodes is wasteful and breaks problems that test pointer identity. Detaching and re-attaching in the wrong order (writing `tail.next` before reading `node.next`) loses the rest of the input.'
  ),
  solutions: {
    python: `class Solution:
    def partition(self, head, x):
        less_dummy = ListNode(0)
        geq_dummy = ListNode(0)
        lt = less_dummy
        gt = geq_dummy
        cur = head
        while cur:
            nxt = cur.next
            cur.next = None
            if cur.val < x:
                lt.next = cur
                lt = cur
            else:
                gt.next = cur
                gt = cur
            cur = nxt
        lt.next = geq_dummy.next
        return less_dummy.next
`,
    javascript: `var partition = function(head, x) {
    const lessDummy = new ListNode(0);
    const geqDummy = new ListNode(0);
    let lt = lessDummy, gt = geqDummy;
    let cur = head;
    while (cur) {
        const nxt = cur.next;
        cur.next = null;
        if (cur.val < x) { lt.next = cur; lt = cur; }
        else { gt.next = cur; gt = cur; }
        cur = nxt;
    }
    lt.next = geqDummy.next;
    return lessDummy.next;
};
`,
    java: `class Solution {
    public ListNode partition(ListNode head, int x) {
        ListNode lessDummy = new ListNode(0), geqDummy = new ListNode(0);
        ListNode lt = lessDummy, gt = geqDummy;
        ListNode cur = head;
        while (cur != null) {
            ListNode nxt = cur.next;
            cur.next = null;
            if (cur.val < x) { lt.next = cur; lt = cur; }
            else { gt.next = cur; gt = cur; }
            cur = nxt;
        }
        lt.next = geqDummy.next;
        return lessDummy.next;
    }
}
`,
    cpp: `class Solution {
public:
    ListNode* partition(ListNode* head, int x) {
        ListNode lessDummy(0), geqDummy(0);
        ListNode *lt = &lessDummy, *gt = &geqDummy;
        ListNode* cur = head;
        while (cur) {
            ListNode* nxt = cur->next;
            cur->next = nullptr;
            if (cur->val < x) { lt->next = cur; lt = cur; }
            else { gt->next = cur; gt = cur; }
            cur = nxt;
        }
        lt->next = geqDummy.next;
        return lessDummy.next;
    }
};
`,
  },
});

// ============================================================
// matrix-diagonal-sort
// ============================================================
add('matrix-diagonal-sort', {
  pattern: 'group-by-diagonal',
  hints: [
    'All cells on the same diagonal share the same value of i - j. Use that as a key to group cells.',
    'Push each cell into a bucket keyed by i - j. Sort each bucket. Pop back in the same order to overwrite.',
    'Alternative: for each diagonal start (either top row or left column), collect, sort, write back.',
    'Use a heap (min-heap) per diagonal for an in-place feel, or just sort the list. Both are O(m·n·log(min(m,n))).',
  ],
  test_cases: [
    { inputs: ['[[3,3,1,1],[2,2,1,2],[1,1,1,2]]'], expected: '[[1,1,1,1],[1,2,2,2],[1,2,3,3]]' },
    { inputs: ['[[11,25,66,1,69,7],[23,55,17,45,15,52],[75,31,36,44,58,8],[22,27,33,25,68,4],[84,28,14,11,5,50]]'], expected: '[[5,17,4,1,52,7],[11,11,25,45,8,69],[14,23,25,44,58,15],[22,27,31,36,50,66],[84,28,75,33,55,68]]' },
    { inputs: ['[[1]]'], expected: '[[1]]' },
    { inputs: ['[[3,1],[1,2]]'], expected: '[[1,1],[1,3]]' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[1,2,3],[4,5,6],[7,8,9]]' },
    { inputs: ['[[9,8,7],[6,5,4],[3,2,1]]'], expected: '[[1,4,7],[2,5,8],[3,6,9]]' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[[1,2],[3,4],[5,6]]' },
    { inputs: ['[[5,3,1],[2,4,6]]'], expected: '[[2,3,1],[5,4,6]]' },
    { inputs: ['[[7]]'], expected: '[[7]]' },
    { inputs: ['[[2,1],[2,1],[2,1]]'], expected: '[[2,1],[2,1],[2,1]]' },
  ],
  editorial_md: ed(
    'Diagonals in a matrix run top-left to bottom-right, and every cell on a single diagonal shares the same value of `row - col`. That algebraic identity is the whole insight: group cells by `i - j`, sort each group, write them back in the same traversal order. No tricky index math, no per-diagonal walking required if you index by the difference directly.',
    'One clean implementation: bucket cells by their diagonal key.\n\n1. Walk the matrix; for each `(i, j)`, append `mat[i][j]` to `buckets[i - j]`.\n2. Sort each bucket in ascending order (smallest first).\n3. Walk the matrix again in the same order; pop the front of `buckets[i - j]` into `mat[i][j]`.\n\nUsing a min-heap or a deque makes step 3 O(1) per write. A plain list with a per-bucket index pointer is just as fast. Total work: each cell pushed once, sorted within a group of size at most `min(m, n)`, popped once.\n\nAlternative iteration order: for each diagonal start cell (either `(0, j)` for top row or `(i, 0)` for left column), walk `+1` in each axis collecting values, sort, walk again writing back. Same complexity, different bookkeeping.',
    'Time O(m·n·log(min(m,n))) — each cell touched twice, plus a sort on a group of size at most `min(m,n)`. The total comparison work sums to `(m·n)·log(min(m,n))`. Space O(m·n) for the bucket dictionary, or O(min(m,n)) per diagonal if processing one at a time.',
    'Off-by-one when collecting back into the matrix: if you sort in place per-diagonal but iterate `(i, j)` left-to-right, you can clobber unsorted values. The cleanest fix is a separate write pass. Diagonal direction confusion: the problem wants top-left-to-bottom-right (key `i - j`), not anti-diagonals (key `i + j`).'
  ),
  solutions: {
    python: `class Solution:
    def diagonalSort(self, mat):
        from collections import defaultdict
        m, n = len(mat), len(mat[0])
        buckets = defaultdict(list)
        for i in range(m):
            for j in range(n):
                buckets[i - j].append(mat[i][j])
        for key in buckets:
            buckets[key].sort(reverse=True)
        for i in range(m):
            for j in range(n):
                mat[i][j] = buckets[i - j].pop()
        return mat
`,
    javascript: `var diagonalSort = function(mat) {
    const m = mat.length, n = mat[0].length;
    const buckets = new Map();
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            const k = i - j;
            if (!buckets.has(k)) buckets.set(k, []);
            buckets.get(k).push(mat[i][j]);
        }
    }
    for (const arr of buckets.values()) arr.sort((a, b) => b - a);
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            mat[i][j] = buckets.get(i - j).pop();
        }
    }
    return mat;
};
`,
    java: `class Solution {
    public int[][] diagonalSort(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        Map<Integer, List<Integer>> buckets = new HashMap<>();
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                buckets.computeIfAbsent(i - j, k -> new ArrayList<>()).add(mat[i][j]);
        for (List<Integer> list : buckets.values())
            list.sort((a, b) -> b - a);
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                List<Integer> list = buckets.get(i - j);
                mat[i][j] = list.remove(list.size() - 1);
            }
        return mat;
    }
}
`,
    cpp: `class Solution {
public:
    vector<vector<int>> diagonalSort(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        unordered_map<int, vector<int>> buckets;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                buckets[i - j].push_back(mat[i][j]);
        for (auto& p : buckets) sort(p.second.rbegin(), p.second.rend());
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                mat[i][j] = buckets[i - j].back();
                buckets[i - j].pop_back();
            }
        return mat;
    }
};
`,
  },
});

// ============================================================
// rotate-list
// ============================================================
add('rotate-list', {
  hints: [
    'Edge cases first: empty list or single node — return head unchanged.',
    'Find length n and the tail node. Reduce k to k % n (rotating by n is identity).',
    'Connect tail.next = head to form a temporary cycle. Walk (n - k) steps from head; the next node becomes the new head; you break the cycle there.',
    'O(n) time, O(1) space. Don\'t allocate any new nodes.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '2'], expected: '[4,5,1,2,3]' },
    { inputs: ['[0,1,2]', '4'], expected: '[2,0,1]' },
    { inputs: ['[]', '0'], expected: '[]' },
    { inputs: ['[1]', '0'], expected: '[1]' },
    { inputs: ['[1]', '5'], expected: '[1]' },
    { inputs: ['[1,2]', '1'], expected: '[2,1]' },
    { inputs: ['[1,2]', '2'], expected: '[1,2]' },
    { inputs: ['[1,2,3,4,5]', '0'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]', '10'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3]', '1'], expected: '[3,1,2]' },
    { inputs: ['[1,2,3,4]', '3'], expected: '[2,3,4,1]' },
  ],
  editorial_md: ed(
    'Rotating right by `k` is the same as taking the last `k` nodes and moving them to the front. With singly linked lists, the cheapest way to express that is to glue the tail to the head (forming a cycle), then walk to the new "tail" position and cut. No nodes are created — just two pointer rewires.',
    'Step 1: find the length. Walk from `head`, count nodes, and stop at the tail. If the list is empty or has one node, return as-is.\n\nStep 2: normalize `k = k % n`. If `k == 0` the rotation is a no-op; return `head`.\n\nStep 3: connect `tail.next = head`. The list is now a cycle of length `n`.\n\nStep 4: walk `n - k - 1` steps from the original `head`. The node you land on is the new tail. The node after it is the new head. Set `newHead = newTail.next; newTail.next = null`.\n\nStep 5: return `newHead`. The cycle is broken, and the last `k` nodes now sit at the front in their original relative order.\n\nA pure two-pointer variant works without the cycle: advance `fast` by `k` first, then advance `slow` and `fast` together until `fast` reaches the tail. Slow then points at the node before the new head. Slightly less elegant for the modulo case but uses no temporary cycle.',
    'Time O(n) — one walk for length, one walk for the split point. Space O(1) — fixed number of pointers, no allocation.',
    'Forgetting `k %= n` performs many full rotations and times out for huge `k`. Cutting the cycle at the wrong position is off-by-one — walk `n - k - 1` steps from `head`, not `n - k`. Returning `head` instead of `newHead` after rewiring is a classic mistake; the old `head` is now somewhere in the middle.'
  ),
  solutions: {
    python: `class Solution:
    def rotateRight(self, head, k):
        if not head or not head.next:
            return head
        # find length and tail
        n = 1
        tail = head
        while tail.next:
            tail = tail.next
            n += 1
        k %= n
        if k == 0:
            return head
        tail.next = head
        steps = n - k - 1
        new_tail = head
        for _ in range(steps):
            new_tail = new_tail.next
        new_head = new_tail.next
        new_tail.next = None
        return new_head
`,
    javascript: `var rotateRight = function(head, k) {
    if (!head || !head.next) return head;
    let n = 1, tail = head;
    while (tail.next) { tail = tail.next; n++; }
    k %= n;
    if (k === 0) return head;
    tail.next = head;
    let newTail = head;
    for (let i = 0; i < n - k - 1; i++) newTail = newTail.next;
    const newHead = newTail.next;
    newTail.next = null;
    return newHead;
};
`,
    java: `class Solution {
    public ListNode rotateRight(ListNode head, int k) {
        if (head == null || head.next == null) return head;
        int n = 1;
        ListNode tail = head;
        while (tail.next != null) { tail = tail.next; n++; }
        k %= n;
        if (k == 0) return head;
        tail.next = head;
        ListNode newTail = head;
        for (int i = 0; i < n - k - 1; i++) newTail = newTail.next;
        ListNode newHead = newTail.next;
        newTail.next = null;
        return newHead;
    }
}
`,
    cpp: `class Solution {
public:
    ListNode* rotateRight(ListNode* head, int k) {
        if (!head || !head->next) return head;
        int n = 1;
        ListNode* tail = head;
        while (tail->next) { tail = tail->next; n++; }
        k %= n;
        if (k == 0) return head;
        tail->next = head;
        ListNode* newTail = head;
        for (int i = 0; i < n - k - 1; i++) newTail = newTail->next;
        ListNode* newHead = newTail->next;
        newTail->next = nullptr;
        return newHead;
    }
};
`,
  },
});

// ============================================================
// search-a-2d-matrix
// ============================================================
add('search-a-2d-matrix', {
  pattern: 'binary-search-flatten-indexing',
  hints: [
    'The matrix is sorted such that flattening it row-by-row produces a single sorted array. Treat indices 0..m*n-1 as that array.',
    'Standard binary search on those indices. Convert mid to (row, col) via row = mid / n, col = mid % n.',
    'Compare matrix[row][col] to target and narrow the search window as usual.',
    'Variant: search the leftmost column for the candidate row, then binary-search that row. Two log-searches, same total time O(log m + log n).',
  ],
  test_cases: [
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '3'], expected: 'true' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '13'], expected: 'false' },
    { inputs: ['[[1]]', '1'], expected: 'true' },
    { inputs: ['[[1]]', '2'], expected: 'false' },
    { inputs: ['[[1,3]]', '3'], expected: 'true' },
    { inputs: ['[[1],[3]]', '3'], expected: 'true' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '1'], expected: 'true' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '60'], expected: 'true' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '0'], expected: 'false' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '100'], expected: 'false' },
    { inputs: ['[[1,2,3,4,5]]', '4'], expected: 'true' },
    { inputs: ['[[1],[2],[3],[4],[5]]', '3'], expected: 'true' },
  ],
  editorial_md: ed(
    'The matrix is sorted left-to-right within rows, and each row\'s first element is greater than the previous row\'s last — so flattening it produces a single sorted sequence of `m*n` values. Once you see that, the search is just classic binary search; the only twist is converting flat indices to `(row, col)` on demand.',
    'Run binary search on the integer range `[0, m*n - 1]`. For each `mid`, compute `row = mid / n` and `col = mid % n` (integer division). Compare `matrix[row][col]` to `target`:\n\n- If equal, return `true`.\n- If smaller, the answer (if any) is to the right: `lo = mid + 1`.\n- Otherwise, search left: `hi = mid - 1`.\n\nWhen `lo > hi` without a match, return `false`. The algorithm is identical to 1D binary search; only the indexing changes.\n\nA two-stage alternative: binary-search the first column for the largest value `<= target`, which gives the row that could contain it. Then binary-search that row for the target. Same complexity, slightly more code.',
    'Time O(log(m·n)) = O(log m + log n) — one binary search over `m·n` positions. Space O(1) — constant pointers.',
    'Using `mid / n` instead of `mid / cols` when copy-pasting from a 1D template can divide by the wrong dimension. Watch for integer overflow on `(lo + hi)` for huge matrices — prefer `lo + (hi - lo) / 2`. Off-by-one on the high bound: it should be `m*n - 1`, not `m*n`.'
  ),
  solutions: {
    python: `class Solution:
    def searchMatrix(self, matrix, target):
        if not matrix or not matrix[0]:
            return False
        m, n = len(matrix), len(matrix[0])
        lo, hi = 0, m * n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            val = matrix[mid // n][mid % n]
            if val == target:
                return True
            if val < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return False
`,
    javascript: `var searchMatrix = function(matrix, target) {
    if (!matrix.length || !matrix[0].length) return false;
    const m = matrix.length, n = matrix[0].length;
    let lo = 0, hi = m * n - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const val = matrix[Math.floor(mid / n)][mid % n];
        if (val === target) return true;
        if (val < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
};
`,
    java: `class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        if (matrix.length == 0 || matrix[0].length == 0) return false;
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            if (val < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
}
`,
    cpp: `class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        if (matrix.empty() || matrix[0].empty()) return false;
        int m = matrix.size(), n = matrix[0].size();
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            if (val < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
};
`,
  },
});

// ============================================================
// gray-code
// ============================================================
add('gray-code', {
  pattern: 'bit-trick-xor-shift',
  hints: [
    'A Gray code sequence has consecutive numbers differing in exactly one bit.',
    'The i-th n-bit Gray code is i XOR (i >> 1). Magic identity — verify it: consecutive i differ in the lowest bit position that\'s flipping, and the shift cancels all but that one.',
    'Just emit g(i) for i in 0..2^n - 1.',
    'A reflect-and-prefix construction (build Gn from Gn-1 by reflecting and prepending 1s) is equivalent but slower to code.',
  ],
  test_cases: [
    { inputs: ['1'], expected: '[0,1]' },
    { inputs: ['2'], expected: '[0,1,3,2]' },
    { inputs: ['3'], expected: '[0,1,3,2,6,7,5,4]' },
    { inputs: ['4'], expected: '[0,1,3,2,6,7,5,4,12,13,15,14,10,11,9,8]' },
    { inputs: ['5'], expected: '[0,1,3,2,6,7,5,4,12,13,15,14,10,11,9,8,24,25,27,26,30,31,29,28,20,21,23,22,18,19,17,16]' },
    { inputs: ['6'], expected: '[0,1,3,2,6,7,5,4,12,13,15,14,10,11,9,8,24,25,27,26,30,31,29,28,20,21,23,22,18,19,17,16,48,49,51,50,54,55,53,52,60,61,63,62,58,59,57,56,40,41,43,42,46,47,45,44,36,37,39,38,34,35,33,32]' },
    { inputs: ['0'], expected: '[0]' },
    { inputs: ['7'], expected: '[0,1,3,2,6,7,5,4,12,13,15,14,10,11,9,8,24,25,27,26,30,31,29,28,20,21,23,22,18,19,17,16,48,49,51,50,54,55,53,52,60,61,63,62,58,59,57,56,40,41,43,42,46,47,45,44,36,37,39,38,34,35,33,32,96,97,99,98,102,103,101,100,108,109,111,110,106,107,105,104,120,121,123,122,126,127,125,124,116,117,119,118,114,115,113,112,80,81,83,82,86,87,85,84,92,93,95,94,90,91,89,88,72,73,75,74,78,79,77,76,68,69,71,70,66,67,65,64]' },
    { inputs: ['8'], expected: '[0,1,3,2,6,7,5,4,12,13,15,14,10,11,9,8,24,25,27,26,30,31,29,28,20,21,23,22,18,19,17,16,48,49,51,50,54,55,53,52,60,61,63,62,58,59,57,56,40,41,43,42,46,47,45,44,36,37,39,38,34,35,33,32,96,97,99,98,102,103,101,100,108,109,111,110,106,107,105,104,120,121,123,122,126,127,125,124,116,117,119,118,114,115,113,112,80,81,83,82,86,87,85,84,92,93,95,94,90,91,89,88,72,73,75,74,78,79,77,76,68,69,71,70,66,67,65,64,192,193,195,194,198,199,197,196,204,205,207,206,202,203,201,200,216,217,219,218,222,223,221,220,212,213,215,214,210,211,209,208,240,241,243,242,246,247,245,244,252,253,255,254,250,251,249,248,232,233,235,234,238,239,237,236,228,229,231,230,226,227,225,224,160,161,163,162,166,167,165,164,172,173,175,174,170,171,169,168,184,185,187,186,190,191,189,188,180,181,183,182,178,179,177,176,144,145,147,146,150,151,149,148,156,157,159,158,154,155,153,152,136,137,139,138,142,143,141,140,132,133,135,134,130,131,129,128]' },
  ],
  editorial_md: ed(
    'A Gray code sequence over n bits enumerates all `2^n` values such that consecutive entries differ in exactly one bit position. The cleanest construction uses the identity `g(i) = i ^ (i >> 1)` — the binary-reflected Gray code. It\'s a one-liner per output value once you trust the identity.',
    'For each `i` from `0` to `2^n - 1`, append `i ^ (i >> 1)` to the result. That\'s it.\n\nWhy does this work? When `i` and `i+1` are consecutive integers, the addition flips a contiguous trailing block of bits (a run of 1s flipping to 0s plus the next 0 flipping to 1). The XOR with `i >> 1` cancels all the trailing 0-flips and leaves exactly one 1-bit changed in the result — the bit position where the carry stopped. So `g(i)` and `g(i+1)` differ in exactly one bit, which is the Gray-code property.\n\nAlternative reflect-and-prefix: `G(n) = G(n-1) ++ reverse(G(n-1) with leading 1 prepended)`. Same sequence, more code. The bit trick is faster and shorter.\n\nThe sequence starts at `0` (Gray code of `0` is `0`) and ends back at a value differing from `0` in one bit, which makes the sequence a cycle if desired.',
    'Time O(2^n) — one constant-time write per output. Space O(2^n) for the output list (unavoidable since the problem asks for all values).',
    'Returning binary strings instead of integers when the problem asks for integers is a common interface mistake. Using `n=0` should yield `[0]` (a single-element list, not empty). For large `n`, the output size grows exponentially — make sure the language\'s int type fits `2^n - 1` (Python is fine; Java/C++ need `long` past `n=31`).'
  ),
  solutions: {
    python: `class Solution:
    def grayCode(self, n):
        return [i ^ (i >> 1) for i in range(1 << n)]
`,
    javascript: `var grayCode = function(n) {
    const total = 1 << n;
    const out = new Array(total);
    for (let i = 0; i < total; i++) out[i] = i ^ (i >> 1);
    return out;
};
`,
    java: `class Solution {
    public List<Integer> grayCode(int n) {
        int total = 1 << n;
        List<Integer> out = new ArrayList<>(total);
        for (int i = 0; i < total; i++) out.add(i ^ (i >> 1));
        return out;
    }
}
`,
    cpp: `class Solution {
public:
    vector<int> grayCode(int n) {
        int total = 1 << n;
        vector<int> out(total);
        for (int i = 0; i < total; i++) out[i] = i ^ (i >> 1);
        return out;
    }
};
`,
  },
});

// ============================================================
// decode-xored-permutation
// ============================================================
add('decode-xored-permutation', {
  pattern: 'xor-prefix-trick',
  hints: [
    'You know perm is a permutation of 1..n (n is odd). XOR of 1..n is a fixed value you can compute.',
    'encoded[i] = perm[i] XOR perm[i+1]. XOR of encoded at odd indices gives perm[1] XOR perm[2] XOR ... XOR perm[n-1] (telescoping).',
    'XOR the "total XOR of 1..n" with the "XOR of perm[1..n-1]" to recover perm[0].',
    'Then perm[i+1] = perm[i] XOR encoded[i] fills in the rest sequentially.',
  ],
  test_cases: [
    { inputs: ['[3,1]'], expected: '[1,2,3]' },
    { inputs: ['[6,5,4,6]'], expected: '[2,4,1,5,3]' },
    { inputs: ['[1,3]'], expected: '[3,2,1]' },
    { inputs: ['[2,1]'], expected: '[3,1,2]' },
    { inputs: ['[1]'], expected: '[2,3]' },
    { inputs: ['[3]'], expected: '[1,2]' },
    { inputs: ['[7,3,5,1]'], expected: '[5,2,1,4,3]' },
    { inputs: ['[6,2,7,3]'], expected: '[3,5,7,4,1]' },
    { inputs: ['[3,5,1,7,2,4]'], expected: '[7,4,1,3,2,5,6]' },
    { inputs: ['[5]'], expected: '[3,2]' },
  ],
  editorial_md: ed(
    'Two XOR identities collapse this problem. First, since `perm` is a permutation of `1..n`, the XOR of all its elements equals the XOR of `1..n` — a value you can compute in O(n). Second, `encoded[i] = perm[i] ^ perm[i+1]` telescopes: XORing the odd-indexed entries of `encoded` cancels every `perm[i]` except `perm[1] ^ perm[2] ^ ... ^ perm[n-1]`. Combine the two and `perm[0]` falls out in one XOR.',
    'Let `n = len(encoded) + 1` (problem guarantees `n` is odd). Compute:\n\n1. `totalXor = 1 ^ 2 ^ ... ^ n` — XOR of every value the permutation contains.\n2. `oddXor = encoded[1] ^ encoded[3] ^ ... ^ encoded[n-2]` — telescopes to `perm[1] ^ perm[2] ^ ... ^ perm[n-1]`.\n\nThen `perm[0] = totalXor ^ oddXor`, because XORing the two cancels `perm[1..n-1]` and leaves `perm[0]`.\n\nWith `perm[0]` known, fill the rest by walking: `perm[i+1] = perm[i] ^ encoded[i]`.\n\nWhy odd indices specifically? `encoded[1] = perm[1] ^ perm[2]`, `encoded[3] = perm[3] ^ perm[4]`, etc. Stacking them XORs each `perm[1..n-1]` exactly once and leaves `perm[0]` untouched. Even indices would include `perm[0]`, defeating the recovery.',
    'Time O(n) — three linear passes (compute totalXor, compute oddXor, fill perm). Space O(n) for the output array; constant auxiliary.',
    'XORing the wrong index parity (even instead of odd) includes `perm[0]` in the telescoping sum, so the recovered first element is wrong. Forgetting the problem\'s guarantee that `n` is odd lets you accidentally write a solution that fails on even-length permutations. Computing `1..n` XOR as `1..len(encoded)` is off-by-one.'
  ),
  solutions: {
    python: `class Solution:
    def decode(self, encoded):
        n = len(encoded) + 1
        total_xor = 0
        for v in range(1, n + 1):
            total_xor ^= v
        odd_xor = 0
        for i in range(1, len(encoded), 2):
            odd_xor ^= encoded[i]
        perm = [0] * n
        perm[0] = total_xor ^ odd_xor
        for i in range(len(encoded)):
            perm[i + 1] = perm[i] ^ encoded[i]
        return perm
`,
    javascript: `var decode = function(encoded) {
    const n = encoded.length + 1;
    let totalXor = 0;
    for (let v = 1; v <= n; v++) totalXor ^= v;
    let oddXor = 0;
    for (let i = 1; i < encoded.length; i += 2) oddXor ^= encoded[i];
    const perm = new Array(n);
    perm[0] = totalXor ^ oddXor;
    for (let i = 0; i < encoded.length; i++) perm[i + 1] = perm[i] ^ encoded[i];
    return perm;
};
`,
    java: `class Solution {
    public int[] decode(int[] encoded) {
        int n = encoded.length + 1;
        int totalXor = 0;
        for (int v = 1; v <= n; v++) totalXor ^= v;
        int oddXor = 0;
        for (int i = 1; i < encoded.length; i += 2) oddXor ^= encoded[i];
        int[] perm = new int[n];
        perm[0] = totalXor ^ oddXor;
        for (int i = 0; i < encoded.length; i++) perm[i + 1] = perm[i] ^ encoded[i];
        return perm;
    }
}
`,
    cpp: `class Solution {
public:
    vector<int> decode(vector<int>& encoded) {
        int n = encoded.size() + 1;
        int totalXor = 0;
        for (int v = 1; v <= n; v++) totalXor ^= v;
        int oddXor = 0;
        for (int i = 1; i < (int)encoded.size(); i += 2) oddXor ^= encoded[i];
        vector<int> perm(n);
        perm[0] = totalXor ^ oddXor;
        for (int i = 0; i < (int)encoded.size(); i++) perm[i + 1] = perm[i] ^ encoded[i];
        return perm;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-w3-400-23.json', JSON.stringify(Object.entries(PATCHES).map(([id, p]) => ({ id, ...p })), null, 2));
console.log('Wrote', Object.keys(PATCHES).length, 'patches to /tmp/patch-w3-400-23.json');
