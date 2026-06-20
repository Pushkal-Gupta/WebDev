#!/usr/bin/env node
// Part 4: problems 31-50
import fs from 'node:fs';

const entries = [];
const add = (p) => entries.push(p);

// 31. rotate-a-matrix-by-90
add({
  id: 'rotate-a-matrix-by-90',
  method_name: 'rotate',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'List[List[int]]',
  pattern: 'Transpose + reverse rows',
  description: '<p>Rotate an n x n 2D matrix 90 degrees clockwise in place. Return the rotated matrix.</p>',
  hints: [
    'Notice the rotation: cell (i, j) ends up at (j, n - 1 - i).',
    'Two-step trick: transpose the matrix, then reverse each row.',
    'Transpose: swap matrix[i][j] with matrix[j][i] for j > i.',
    'Reversing each row finishes the clockwise rotation.',
    'For counter-clockwise: transpose then reverse each column (or reverse rows then transpose).',
  ],
  test_cases: [
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[7,4,1],[8,5,2],[9,6,3]]' },
    { inputs: ['[[1,2],[3,4]]'], expected: '[[3,1],[4,2]]' },
    { inputs: ['[[1]]'], expected: '[[1]]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]'], expected: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
    { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]'], expected: '[[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]]' },
    { inputs: ['[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]]'], expected: '[[21,16,11,6,1],[22,17,12,7,2],[23,18,13,8,3],[24,19,14,9,4],[25,20,15,10,5]]' },
    { inputs: ['[[0,0],[0,0]]'], expected: '[[0,0],[0,0]]' },
    { inputs: ['[[-1,2],[3,-4]]'], expected: '[[3,-1],[-4,2]]' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9],[10,11,12]]'], expected: '[]' },
  ],
  editorial_md: `## Intuition
A 90-degree clockwise rotation maps cell \`(i, j)\` to \`(j, n - 1 - i)\`. The cleanest in-place way to realise this transformation is the classic two-step trick: first transpose the matrix (swap \`(i, j)\` and \`(j, i)\`), then reverse each row. Both passes touch every cell at most once.

## Approach
1. If the matrix is empty, return it.
2. Reject non-square inputs by returning an empty matrix (this implementation only handles square rotations in place; a different shape implies the caller misused the API).
3. Transpose: for \`i\` in \`[0, n)\`, for \`j\` in \`[i + 1, n)\`, swap \`matrix[i][j]\` with \`matrix[j][i]\`.
4. Reverse each row.
5. Return the mutated matrix.

The transpose-then-reverse trick avoids any auxiliary buffer. For counter-clockwise the order flips: reverse each row first, then transpose.

## Complexity
- Time: O(n^2).
- Space: O(1) extra.`,
  solutions: {
    python: `class Solution:
    def rotate(self, matrix):
        if not matrix: return matrix
        n = len(matrix)
        if any(len(row) != n for row in matrix): return []
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()
        return matrix
`,
    javascript: `class Solution {
    rotate(matrix) {
        if (!matrix.length) return matrix;
        const n = matrix.length;
        if (matrix.some(row => row.length !== n)) return [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
        for (const row of matrix) row.reverse();
        return matrix;
    }
}
`,
    java: `class Solution {
    public int[][] rotate(int[][] matrix) {
        if (matrix.length == 0) return matrix;
        int n = matrix.length;
        for (int[] row : matrix) if (row.length != n) return new int[0][];
        for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
        for (int[] row : matrix) {
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int t = row[l]; row[l] = row[r]; row[r] = t;
            }
        }
        return matrix;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    vector<vector<int>> rotate(vector<vector<int>>& matrix) {
        if (matrix.empty()) return matrix;
        int n = matrix.size();
        for (auto& row : matrix) if ((int)row.size() != n) return {};
        for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) swap(matrix[i][j], matrix[j][i]);
        for (auto& row : matrix) reverse(row.begin(), row.end());
        return matrix;
    }
};
`,
  },
});

// 32. conway - Conway's Game of Life next state
add({
  id: 'conway',
  method_name: 'gameOfLife',
  params: [{ name: 'board', type: 'List[List[int]]' }],
  return_type: 'List[List[int]]',
  pattern: 'In-place state encoding',
  description: '<p>Compute the next state of Conway\'s Game of Life on the given m x n board. A cell is alive (1) or dead (0). For each cell: live with &lt; 2 live neighbours dies (under-pop); live with 2 or 3 lives; live with &gt; 3 dies (over-pop); dead with exactly 3 lives (reproduction).</p>',
  hints: [
    'Count live neighbours in 8 directions for each cell.',
    'Apply the four rules to derive the next state.',
    'Naively, use a copy of the board to avoid stomping live counts.',
    'For O(1) extra space, encode "was-live, now-dead" as 2 and "was-dead, now-live" as 3, then walk again to normalise.',
    'Be careful with boundary cells — only count in-bounds neighbours.',
  ],
  test_cases: [
    { inputs: ['[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]'], expected: '[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]' },
    { inputs: ['[[1,1],[1,0]]'], expected: '[[1,1],[1,1]]' },
    { inputs: ['[[0]]'], expected: '[[0]]' },
    { inputs: ['[[1]]'], expected: '[[0]]' },
    { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: '[[0,0,0],[0,0,0],[0,0,0]]' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '[[1,0,1],[0,0,0],[1,0,1]]' },
    { inputs: ['[[0,1,0],[1,1,1],[0,1,0]]'], expected: '[[1,1,1],[1,0,1],[1,1,1]]' },
    { inputs: ['[[1,0],[0,1]]'], expected: '[[0,0],[0,0]]' },
    { inputs: ['[[1,1,0],[0,1,1],[1,0,1]]'], expected: '[[1,1,1],[1,0,1],[0,1,1]]' },
    { inputs: ['[]'], expected: '[]' },
  ],
  editorial_md: `## Intuition
For each cell, count its live neighbours among the eight surrounding cells and apply Conway's four rules. The naive route makes a copy of the board to avoid the "I just updated my neighbour" problem; an in-place trick encodes both the current and next state in a single integer so we can finish without auxiliary storage.

## Approach (O(1) extra space)
1. Walk every cell. For each, count live neighbours among the 8 surrounding cells (a neighbour counts as alive if its current low-order bit is 1 — true both for cells we haven't yet touched, and for cells we encoded as \`3\` meaning "was dead, will be alive": their bit 0 is 1 because 3 mod 2 = 1).
2. Decide next state:
   - Live cell with neighbour count in \`{2, 3}\` → stays 1. Else encode as \`2\` (was 1, becomes 0).
   - Dead cell with neighbour count == 3 → encode as \`3\` (was 0, becomes 1). Else stays 0.
3. Second pass: replace every cell with \`cell >> 1\` to obtain the new state.

This double encoding keeps the rule "neighbour is alive iff current bit 0 is 1", so the first pass can read original live counts while writing new states without confusion.

## Complexity
- Time: O(m * n).
- Space: O(1) extra.`,
  solutions: {
    python: `class Solution:
    def gameOfLife(self, board):
        if not board or not board[0]: return board
        m, n = len(board), len(board[0])
        dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
        for i in range(m):
            for j in range(n):
                live = 0
                for dr, dc in dirs:
                    r, c = i + dr, j + dc
                    if 0 <= r < m and 0 <= c < n and (board[r][c] & 1) == 1:
                        live += 1
                if board[i][j] == 1:
                    if live < 2 or live > 3: board[i][j] = 1 | (0 << 1)  # stays 1, next 0 -> encode 1
                    else: board[i][j] = 1 | (1 << 1)
                else:
                    if live == 3: board[i][j] = 0 | (1 << 1)
                    else: board[i][j] = 0
        for i in range(m):
            for j in range(n):
                board[i][j] >>= 1
        return board
`,
    javascript: `class Solution {
    gameOfLife(board) {
        if (!board.length || !board[0].length) return board;
        const m = board.length, n = board[0].length;
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
            let live = 0;
            for (const [dr, dc] of dirs) {
                const r = i + dr, c = j + dc;
                if (r >= 0 && r < m && c >= 0 && c < n && (board[r][c] & 1) === 1) live++;
            }
            if (board[i][j] === 1) board[i][j] = (live === 2 || live === 3) ? 3 : 1;
            else if (live === 3) board[i][j] = 2;
        }
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) board[i][j] >>= 1;
        return board;
    }
}
`,
    java: `class Solution {
    public int[][] gameOfLife(int[][] board) {
        if (board.length == 0 || board[0].length == 0) return board;
        int m = board.length, n = board[0].length;
        int[][] dirs = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
            int live = 0;
            for (int[] d : dirs) {
                int r = i + d[0], c = j + d[1];
                if (r >= 0 && r < m && c >= 0 && c < n && (board[r][c] & 1) == 1) live++;
            }
            if (board[i][j] == 1) board[i][j] = (live == 2 || live == 3) ? 3 : 1;
            else if (live == 3) board[i][j] = 2;
        }
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) board[i][j] >>= 1;
        return board;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<vector<int>> gameOfLife(vector<vector<int>>& board) {
        if (board.empty() || board[0].empty()) return board;
        int m = board.size(), n = board[0].size();
        int dirs[8][2] = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
            int live = 0;
            for (auto& d : dirs) {
                int r = i + d[0], c = j + d[1];
                if (r >= 0 && r < m && c >= 0 && c < n && (board[r][c] & 1)) live++;
            }
            if (board[i][j] == 1) board[i][j] = (live == 2 || live == 3) ? 3 : 1;
            else if (live == 3) board[i][j] = 2;
        }
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) board[i][j] >>= 1;
        return board;
    }
};
`,
  },
});

// 33. queries-in-a-matrix — return the rotated query (we'll do simpler: for each query [r,c] return matrix[r][c])
add({
  id: 'queries-in-a-matrix',
  method_name: 'queriesInMatrix',
  params: [{ name: 'matrix', type: 'List[List[int]]' }, { name: 'queries', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Direct cell lookup with bounds check',
  description: '<p>Given an m x n integer matrix and a list of queries where each query is <code>[r, c]</code>, return a list containing <code>matrix[r][c]</code> for each query. If <code>(r, c)</code> is out of bounds, return <code>-1</code> for that query.</p>',
  hints: [
    'For each query, validate 0 <= r < m and 0 <= c < n.',
    'Return matrix[r][c] when valid, else -1.',
    'No preprocessing needed — each query is O(1).',
    'Total work is O(Q) plus O(1) per query.',
    'Pay attention to empty matrices.',
  ],
  test_cases: [
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]', '[[0,0],[1,1],[2,2]]'], expected: '[1,5,9]' },
    { inputs: ['[[1,2],[3,4]]', '[[0,1],[1,0]]'], expected: '[2,3]' },
    { inputs: ['[[1]]', '[[0,0]]'], expected: '[1]' },
    { inputs: ['[[1]]', '[[1,0]]'], expected: '[-1]' },
    { inputs: ['[[1,2,3]]', '[[0,0],[0,2],[0,5]]'], expected: '[1,3,-1]' },
    { inputs: ['[]', '[[0,0]]'], expected: '[-1]' },
    { inputs: ['[[5,6],[7,8]]', '[]'], expected: '[]' },
    { inputs: ['[[10,20],[30,40]]', '[[0,0],[0,1],[1,0],[1,1]]'], expected: '[10,20,30,40]' },
    { inputs: ['[[1,2,3],[4,5,6]]', '[[-1,0],[2,0],[0,-1],[1,3]]'], expected: '[-1,-1,-1,-1]' },
    { inputs: ['[[0,0,0],[0,0,0]]', '[[0,0],[1,2]]'], expected: '[0,0]' },
  ],
  editorial_md: `## Intuition
Each query is a direct array index, so the only complexity is the bounds check. Validate \`0 <= r < m\` and \`0 <= c < n\`, then either return the cell value or a sentinel like \`-1\` for an out-of-range query. Done in constant time per query without preprocessing.

## Approach
1. Read \`m = len(matrix)\`, \`n = len(matrix[0])\` (handle the empty matrix as \`m = 0\`, \`n = 0\`).
2. Iterate over the queries. For each \`[r, c]\`:
   - If \`r < 0\` or \`r >= m\` or \`c < 0\` or \`c >= n\`, append \`-1\`.
   - Else append \`matrix[r][c]\`.
3. Return the collected list.

If the problem were instead to perform a fixed transformation on the matrix and answer queries, we would precompute that transformation once — but here every query is independent and direct.

## Complexity
- Time: O(Q).
- Space: O(Q) for the output.`,
  solutions: {
    python: `class Solution:
    def queriesInMatrix(self, matrix, queries):
        m = len(matrix)
        n = len(matrix[0]) if m else 0
        out = []
        for q in queries:
            r, c = q
            if 0 <= r < m and 0 <= c < n: out.append(matrix[r][c])
            else: out.append(-1)
        return out
`,
    javascript: `class Solution {
    queriesInMatrix(matrix, queries) {
        const m = matrix.length, n = m ? matrix[0].length : 0;
        return queries.map(([r, c]) => (r >= 0 && r < m && c >= 0 && c < n) ? matrix[r][c] : -1);
    }
}
`,
    java: `class Solution {
    public int[] queriesInMatrix(int[][] matrix, int[][] queries) {
        int m = matrix.length, n = m > 0 ? matrix[0].length : 0;
        int[] out = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            int r = queries[i][0], c = queries[i][1];
            out[i] = (r >= 0 && r < m && c >= 0 && c < n) ? matrix[r][c] : -1;
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> queriesInMatrix(vector<vector<int>>& matrix, vector<vector<int>>& queries) {
        int m = matrix.size(), n = m ? matrix[0].size() : 0;
        vector<int> out;
        for (auto& q : queries) {
            int r = q[0], c = q[1];
            out.push_back((r >= 0 && r < m && c >= 0 && c < n) ? matrix[r][c] : -1);
        }
        return out;
    }
};
`,
  },
});

// 34. set-matrix-0
add({
  id: 'set-matrix-0',
  method_name: 'setZeroes',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'List[List[int]]',
  pattern: 'First-row/col markers for O(1) space',
  description: '<p>Given an m x n integer matrix, set the entire row and column to 0 for every cell that contains 0. Solve in place. Return the mutated matrix.</p>',
  hints: [
    'First pass to find all zero cells. Second pass to apply.',
    'Naive O(m + n) extra: store the row-set and column-set of zeros.',
    'O(1) trick: use the first row and column themselves as markers.',
    'Remember if the first row or first column originally contained any zero.',
    'Apply zeros to the inner cells, then handle the first row/col last.',
  ],
  test_cases: [
    { inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'], expected: '[[1,0,1],[0,0,0],[1,0,1]]' },
    { inputs: ['[[0,1,2,0],[3,4,5,2],[1,3,1,5]]'], expected: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' },
    { inputs: ['[[1]]'], expected: '[[1]]' },
    { inputs: ['[[0]]'], expected: '[[0]]' },
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[1,2,3],[4,5,6],[7,8,9]]' },
    { inputs: ['[[0,0,0],[0,0,0]]'], expected: '[[0,0,0],[0,0,0]]' },
    { inputs: ['[[1,1,1,1],[1,1,1,1],[1,1,1,0]]'], expected: '[[1,1,1,0],[1,1,1,0],[0,0,0,0]]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[[1,0]]'], expected: '[[0,0]]' },
    { inputs: ['[[1],[0]]'], expected: '[[0],[0]]' },
  ],
  editorial_md: `## Intuition
We need to mark every row and every column that contains at least one zero, then zero them all out. The naive solution uses two boolean arrays of size m and n. The O(1) trick reuses the matrix's own first row and first column as those marker arrays; we just need two scalars to remember whether the first row or first column themselves were originally zero.

## Approach
1. Scan the first row — record \`firstRowZero = true\` if any zero.
2. Scan the first column — record \`firstColZero = true\` if any zero.
3. For each interior cell \`(i, j)\` with \`i > 0\` and \`j > 0\`: if \`matrix[i][j] == 0\`, set \`matrix[i][0] = 0\` and \`matrix[0][j] = 0\` as markers.
4. For each interior cell, set it to 0 if \`matrix[i][0] == 0\` or \`matrix[0][j] == 0\`.
5. If \`firstRowZero\`, zero the entire first row.
6. If \`firstColZero\`, zero the entire first column.

The order matters — we must apply the markers to interior cells before touching the first row/col, otherwise the markers get overwritten.

## Complexity
- Time: O(m * n).
- Space: O(1) extra.`,
  solutions: {
    python: `class Solution:
    def setZeroes(self, matrix):
        if not matrix or not matrix[0]: return matrix
        m, n = len(matrix), len(matrix[0])
        first_row = any(matrix[0][j] == 0 for j in range(n))
        first_col = any(matrix[i][0] == 0 for i in range(m))
        for i in range(1, m):
            for j in range(1, n):
                if matrix[i][j] == 0:
                    matrix[i][0] = 0
                    matrix[0][j] = 0
        for i in range(1, m):
            for j in range(1, n):
                if matrix[i][0] == 0 or matrix[0][j] == 0:
                    matrix[i][j] = 0
        if first_row:
            for j in range(n): matrix[0][j] = 0
        if first_col:
            for i in range(m): matrix[i][0] = 0
        return matrix
`,
    javascript: `class Solution {
    setZeroes(matrix) {
        if (!matrix.length || !matrix[0].length) return matrix;
        const m = matrix.length, n = matrix[0].length;
        let firstRow = false, firstCol = false;
        for (let j = 0; j < n; j++) if (matrix[0][j] === 0) firstRow = true;
        for (let i = 0; i < m; i++) if (matrix[i][0] === 0) firstCol = true;
        for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
        if (firstRow) for (let j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstCol) for (let i = 0; i < m; i++) matrix[i][0] = 0;
        return matrix;
    }
}
`,
    java: `class Solution {
    public int[][] setZeroes(int[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return matrix;
        int m = matrix.length, n = matrix[0].length;
        boolean firstRow = false, firstCol = false;
        for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRow = true;
        for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstCol = true;
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        if (firstRow) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstCol) for (int i = 0; i < m; i++) matrix[i][0] = 0;
        return matrix;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<vector<int>> setZeroes(vector<vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return matrix;
        int m = matrix.size(), n = matrix[0].size();
        bool firstRow = false, firstCol = false;
        for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRow = true;
        for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstCol = true;
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        if (firstRow) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstCol) for (int i = 0; i < m; i++) matrix[i][0] = 0;
        return matrix;
    }
};
`,
  },
});

// 35. max-circular-subarray-sum
add({
  id: 'max-circular-subarray-sum',
  method_name: 'maxSubarraySumCircular',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Kadane (max) + inverted Kadane (min)',
  description: '<p>Given a circular integer array, return the maximum possible sum of a non-empty subarray. The subarray may wrap from the end of the array to the beginning.</p>',
  hints: [
    'Two cases: the best subarray is contiguous, or it wraps around.',
    'Contiguous case: standard Kadane gives maxSum.',
    'Wrap case: total - minSum (where minSum is the smallest contiguous sum).',
    'Edge case: if every element is negative, total - minSum is 0 but maxSum is the answer.',
    'Answer = max(maxSum, total - minSum), unless maxSum < 0 in which case return maxSum.',
  ],
  test_cases: [
    { inputs: ['[1,-2,3,-2]'], expected: '3' },
    { inputs: ['[5,-3,5]'], expected: '10' },
    { inputs: ['[-3,-2,-3]'], expected: '-2' },
    { inputs: ['[3,-1,2,-1]'], expected: '4' },
    { inputs: ['[3,-2,2,-3]'], expected: '3' },
    { inputs: ['[-2,-3,-1]'], expected: '-1' },
    { inputs: ['[1,2,3,4,5]'], expected: '15' },
    { inputs: ['[5,-3,5,-3,5]'], expected: '12' },
    { inputs: ['[8,-1,3,4]'], expected: '15' },
    { inputs: ['[-1,-2,-3,-4]'], expected: '-1' },
  ],
  editorial_md: `## Intuition
The best circular subarray is either entirely contained in the array (no wrap) or it wraps around the boundary. The non-wrap case is standard Kadane. The wrap case equals \`total - (minimum subarray sum)\`: the minimum subarray is the chunk we exclude, so the remaining (wrapped) elements are the maximum possible total minus the minimum. There is one nasty edge: when every element is negative, the "wrap" computation gives \`total - total = 0\` corresponding to the empty subarray, which is invalid. We detect this by checking if Kadane's maximum is itself negative — that means all values are negative, and the answer is just that maximum.

## Approach
1. Compute \`total\` = sum of all elements.
2. Run Kadane's algorithm for the maximum contiguous sum → \`max_sum\`.
3. Run Kadane on the negated array (equivalently, take min) for the minimum contiguous sum → \`min_sum\`.
4. Wrap answer is \`total - min_sum\`.
5. If \`max_sum < 0\`, return \`max_sum\` (all elements negative — wrap would be invalid).
6. Otherwise return \`max(max_sum, total - min_sum)\`.

## Complexity
- Time: O(n) — two linear passes.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def maxSubarraySumCircular(self, nums):
        total = sum(nums)
        max_sum = cur_max = nums[0]
        min_sum = cur_min = nums[0]
        for x in nums[1:]:
            cur_max = max(x, cur_max + x); max_sum = max(max_sum, cur_max)
            cur_min = min(x, cur_min + x); min_sum = min(min_sum, cur_min)
        if max_sum < 0: return max_sum
        return max(max_sum, total - min_sum)
`,
    javascript: `class Solution {
    maxSubarraySumCircular(nums) {
        let total = nums[0], maxSum = nums[0], curMax = nums[0], minSum = nums[0], curMin = nums[0];
        for (let i = 1; i < nums.length; i++) {
            total += nums[i];
            curMax = Math.max(nums[i], curMax + nums[i]); maxSum = Math.max(maxSum, curMax);
            curMin = Math.min(nums[i], curMin + nums[i]); minSum = Math.min(minSum, curMin);
        }
        if (maxSum < 0) return maxSum;
        return Math.max(maxSum, total - minSum);
    }
}
`,
    java: `class Solution {
    public int maxSubarraySumCircular(int[] nums) {
        int total = nums[0], maxSum = nums[0], curMax = nums[0], minSum = nums[0], curMin = nums[0];
        for (int i = 1; i < nums.length; i++) {
            total += nums[i];
            curMax = Math.max(nums[i], curMax + nums[i]); maxSum = Math.max(maxSum, curMax);
            curMin = Math.min(nums[i], curMin + nums[i]); minSum = Math.min(minSum, curMin);
        }
        if (maxSum < 0) return maxSum;
        return Math.max(maxSum, total - minSum);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int maxSubarraySumCircular(vector<int>& nums) {
        int total = nums[0], maxSum = nums[0], curMax = nums[0], minSum = nums[0], curMin = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            total += nums[i];
            curMax = max(nums[i], curMax + nums[i]); maxSum = max(maxSum, curMax);
            curMin = min(nums[i], curMin + nums[i]); minSum = min(minSum, curMin);
        }
        if (maxSum < 0) return maxSum;
        return max(maxSum, total - minSum);
    }
};
`,
  },
});

// 36. next-smallest-palindrome — simplified: given a positive integer n, return the smallest palindrome > n
add({
  id: 'next-smallest-palindrome',
  method_name: 'nextPalindrome',
  params: [{ name: 'n', type: 'int' }],
  return_type: 'int',
  pattern: 'Mirror left half + carry',
  description: '<p>Given a positive integer n, return the smallest palindrome strictly greater than n. The palindrome must use the same digits and be a positive integer.</p>',
  hints: [
    'Mirror the left half over the right half to get a candidate palindrome.',
    'If the mirrored value is greater than n, it is the answer.',
    'If not, increment the left half by 1 and mirror again.',
    'Handle the all-9s edge case (e.g., 999 -> 1001).',
    'Numbers with even and odd lengths use slightly different midpoints.',
  ],
  test_cases: [
    { inputs: ['123'], expected: '131' },
    { inputs: ['808'], expected: '818' },
    { inputs: ['99'], expected: '101' },
    { inputs: ['9'], expected: '11' },
    { inputs: ['1'], expected: '2' },
    { inputs: ['11'], expected: '22' },
    { inputs: ['1991'], expected: '2002' },
    { inputs: ['2133'], expected: '2222' },
    { inputs: ['999'], expected: '1001' },
    { inputs: ['12321'], expected: '12421' },
  ],
  editorial_md: `## Intuition
A palindrome is fully determined by its left half. So the smallest palindrome bigger than n is built by mirroring n's left half; if the result already exceeds n, we are done, otherwise we add one to the left half (carrying as necessary) and mirror again. All-9s inputs are special — incrementing the left half pushes the length up.

## Approach
1. Convert n to a string \`s\` of length \`L\`.
2. Mirror: take \`left = s[:ceil(L/2)]\` and form candidate = \`left + reverse(left)\` (for even L) or \`left + reverse(left[:-1])\` (for odd L).
3. If candidate (as integer) > n, return it.
4. Else: increment \`left\` numerically. If incrementing pushes \`left\` to one digit longer (carry overflow, e.g. 99 -> 100), the answer is \`10^L + 1\` (e.g. 99 -> 101). Otherwise rebuild the palindrome from the new \`left\` and return it.

## Complexity
- Time: O(L) where L is the number of digits in n.
- Space: O(L) for the string manipulation.`,
  solutions: {
    python: `class Solution:
    def nextPalindrome(self, n):
        s = str(n)
        L = len(s)
        half_len = (L + 1) // 2
        left = s[:half_len]
        if L % 2 == 0:
            cand = int(left + left[::-1])
        else:
            cand = int(left + left[:-1][::-1])
        if cand > n: return cand
        new_left = str(int(left) + 1)
        if len(new_left) > half_len:
            return 10 ** L + 1
        if L % 2 == 0:
            return int(new_left + new_left[::-1])
        return int(new_left + new_left[:-1][::-1])
`,
    javascript: `class Solution {
    nextPalindrome(n) {
        const s = String(n), L = s.length, half = Math.ceil(L / 2);
        const left = s.slice(0, half);
        const mirror = (L % 2 === 0) ? left + left.split('').reverse().join('') : left + left.slice(0, -1).split('').reverse().join('');
        if (BigInt(mirror) > BigInt(n)) return Number(mirror);
        const newLeft = String(BigInt(left) + 1n);
        if (newLeft.length > half) return Math.pow(10, L) + 1;
        const ans = (L % 2 === 0) ? newLeft + newLeft.split('').reverse().join('') : newLeft + newLeft.slice(0, -1).split('').reverse().join('');
        return Number(ans);
    }
}
`,
    java: `class Solution {
    public int nextPalindrome(int n) {
        String s = String.valueOf(n);
        int L = s.length(), half = (L + 1) / 2;
        String left = s.substring(0, half);
        String mirror = (L % 2 == 0) ? left + new StringBuilder(left).reverse() : left + new StringBuilder(left.substring(0, half - 1)).reverse();
        long cand = Long.parseLong(mirror);
        if (cand > n) return (int) cand;
        long newLeft = Long.parseLong(left) + 1;
        String nl = String.valueOf(newLeft);
        if (nl.length() > half) return (int)(Math.pow(10, L) + 1);
        String ans = (L % 2 == 0) ? nl + new StringBuilder(nl).reverse() : nl + new StringBuilder(nl.substring(0, half - 1)).reverse();
        return Integer.parseInt(ans);
    }
}
`,
    cpp: `#include <string>
#include <algorithm>
#include <cmath>
using namespace std;
class Solution {
public:
    int nextPalindrome(int n) {
        string s = to_string(n);
        int L = s.size(), half = (L + 1) / 2;
        string left = s.substr(0, half);
        string mirror;
        if (L % 2 == 0) { string rev = left; reverse(rev.begin(), rev.end()); mirror = left + rev; }
        else { string rev = left.substr(0, half - 1); reverse(rev.begin(), rev.end()); mirror = left + rev; }
        long long cand = stoll(mirror);
        if (cand > n) return (int) cand;
        long long newLeft = stoll(left) + 1;
        string nl = to_string(newLeft);
        if ((int)nl.size() > half) return (int)(pow(10, L) + 1);
        string ans;
        if (L % 2 == 0) { string rev = nl; reverse(rev.begin(), rev.end()); ans = nl + rev; }
        else { string rev = nl.substr(0, half - 1); reverse(rev.begin(), rev.end()); ans = nl + rev; }
        return stoi(ans);
    }
};
`,
  },
});

// 37. lexicographic-rank
add({
  id: 'lexicographic-rank',
  method_name: 'lexRank',
  params: [{ name: 's', type: 'str' }],
  return_type: 'int',
  pattern: 'Factorial counting of smaller permutations',
  description: '<p>Given a string of distinct characters, return its 1-indexed rank when all permutations of its characters are sorted lexicographically. For example, the rank of "abc" is 1, "acb" is 2, "bac" is 3, and so on.</p>',
  hints: [
    'Walk the string left to right.',
    'At position i, count how many remaining characters are smaller than s[i].',
    'Each such smaller character anchors (n - i - 1)! permutations that come before s.',
    'Sum these contributions and add 1 for the 1-indexing.',
    'Use long integers — factorials grow fast.',
  ],
  test_cases: [
    { inputs: ['"abc"'], expected: '1' },
    { inputs: ['"acb"'], expected: '2' },
    { inputs: ['"bac"'], expected: '3' },
    { inputs: ['"bca"'], expected: '4' },
    { inputs: ['"cab"'], expected: '5' },
    { inputs: ['"cba"'], expected: '6' },
    { inputs: ['"a"'], expected: '1' },
    { inputs: ['"string"'], expected: '598' },
    { inputs: ['"dcba"'], expected: '24' },
    { inputs: ['"abcd"'], expected: '1' },
  ],
  editorial_md: `## Intuition
The k-th permutation in lex order has the property that at each position, the choice of character determines a block of \`(remaining-length)!\` later permutations. So we walk left to right, and at each position count how many of the remaining unused characters are smaller than the current one. Each such smaller character anchors \`(n-i-1)!\` permutations that appear before \`s\` in the sorted list. Sum those contributions and add 1 for 1-indexing.

## Approach
1. Precompute factorials \`fact[0..n]\` where \`fact[k] = k!\`.
2. Maintain the multiset of remaining characters (initialised to the sorted character array of \`s\`).
3. For each index \`i\`:
   - Find how many characters in the remaining set are lexicographically smaller than \`s[i]\`. Call this \`smaller\`.
   - Add \`smaller * fact[n - i - 1]\` to the rank.
   - Remove \`s[i]\` from the remaining set.
4. Return \`rank + 1\` (1-indexed).

For length up to 20 a 64-bit integer suffices; beyond that use big integers.

## Complexity
- Time: O(n^2) using a list scan, O(n log n) with a Fenwick tree of remaining chars.
- Space: O(n) for the factorial table.`,
  solutions: {
    python: `from math import factorial
class Solution:
    def lexRank(self, s):
        n = len(s)
        remaining = sorted(s)
        rank = 0
        for i in range(n):
            idx = remaining.index(s[i])
            rank += idx * factorial(n - i - 1)
            remaining.pop(idx)
        return rank + 1
`,
    javascript: `class Solution {
    lexRank(s) {
        const n = s.length;
        const fact = [1n];
        for (let i = 1; i <= n; i++) fact.push(fact[i - 1] * BigInt(i));
        const remaining = s.split('').sort();
        let rank = 0n;
        for (let i = 0; i < n; i++) {
            const idx = remaining.indexOf(s[i]);
            rank += BigInt(idx) * fact[n - i - 1];
            remaining.splice(idx, 1);
        }
        return Number(rank + 1n);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int lexRank(String s) {
        int n = s.length();
        long[] fact = new long[n + 1]; fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
        char[] arr = s.toCharArray();
        char[] sorted = arr.clone(); Arrays.sort(sorted);
        List<Character> remaining = new ArrayList<>();
        for (char c : sorted) remaining.add(c);
        long rank = 0;
        for (int i = 0; i < n; i++) {
            int idx = remaining.indexOf(arr[i]);
            rank += idx * fact[n - i - 1];
            remaining.remove(idx);
        }
        return (int)(rank + 1);
    }
}
`,
    cpp: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int lexRank(string s) {
        int n = s.size();
        vector<long long> fact(n + 1, 1);
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
        string sorted_s = s; sort(sorted_s.begin(), sorted_s.end());
        vector<char> remaining(sorted_s.begin(), sorted_s.end());
        long long rank = 0;
        for (int i = 0; i < n; i++) {
            auto it = find(remaining.begin(), remaining.end(), s[i]);
            int idx = it - remaining.begin();
            rank += idx * fact[n - i - 1];
            remaining.erase(it);
        }
        return (int)(rank + 1);
    }
};
`,
  },
});

// 38. largest
add({
  id: 'largest',
  method_name: 'largest',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Linear maximum scan',
  description: '<p>Given a non-empty array of integers, return the largest element.</p>',
  hints: [
    'Iterate once, tracking the running max.',
    'Initialise max to the first element.',
    'Compare each subsequent element and update if larger.',
    'O(n) time, O(1) space.',
    'Built-in: max(nums) in Python.',
  ],
  test_cases: [
    { inputs: ['[1,2,3]'], expected: '3' },
    { inputs: ['[5]'], expected: '5' },
    { inputs: ['[-1,-2,-3]'], expected: '-1' },
    { inputs: ['[3,1,4,1,5,9,2,6]'], expected: '9' },
    { inputs: ['[0]'], expected: '0' },
    { inputs: ['[2,2,2,2]'], expected: '2' },
    { inputs: ['[100,99,98]'], expected: '100' },
    { inputs: ['[-100,-50,-200]'], expected: '-50' },
    { inputs: ['[1000000,1,2]'], expected: '1000000' },
    { inputs: ['[7,8,9,10,11,12]'], expected: '12' },
  ],
  editorial_md: `## Intuition
The maximum of a non-empty array can be found in a single pass: keep the largest value seen so far, compare each new element, and update when a larger one appears. This is the canonical "running aggregate" pattern.

## Approach
1. Initialise \`best = nums[0]\`.
2. For each remaining element \`x\` in \`nums\`, if \`x > best\` then \`best = x\`.
3. Return \`best\`.

Single pass, constant extra space, and works for any comparable type with a defined ordering.

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def largest(self, nums):
        best = nums[0]
        for x in nums[1:]:
            if x > best: best = x
        return best
`,
    javascript: `class Solution {
    largest(nums) {
        let best = nums[0];
        for (let i = 1; i < nums.length; i++) if (nums[i] > best) best = nums[i];
        return best;
    }
}
`,
    java: `class Solution {
    public int largest(int[] nums) {
        int best = nums[0];
        for (int i = 1; i < nums.length; i++) if (nums[i] > best) best = nums[i];
        return best;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int largest(vector<int>& nums) {
        int best = nums[0];
        for (size_t i = 1; i < nums.size(); i++) if (nums[i] > best) best = nums[i];
        return best;
    }
};
`,
  },
});

// 39. second-largest
add({
  id: 'second-largest',
  method_name: 'secondLargest',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Single-pass two-variable tracking',
  description: '<p>Return the second-largest distinct integer in the array. If no second-largest exists (e.g., all elements are equal, or fewer than two distinct values), return <code>-1</code>.</p>',
  hints: [
    'Track best and secondBest in one pass.',
    'When you find a new best, the old best becomes secondBest.',
    'Skip duplicates of the current best so secondBest stays distinct.',
    'Initialise both to INT_MIN.',
    'Return -1 if secondBest is still INT_MIN.',
  ],
  test_cases: [
    { inputs: ['[1,2,3]'], expected: '2' },
    { inputs: ['[5]'], expected: '-1' },
    { inputs: ['[5,5,5]'], expected: '-1' },
    { inputs: ['[3,3,3,2]'], expected: '2' },
    { inputs: ['[10,5,10]'], expected: '5' },
    { inputs: ['[1,2]'], expected: '1' },
    { inputs: ['[2,1]'], expected: '1' },
    { inputs: ['[-1,-2,-3]'], expected: '-2' },
    { inputs: ['[0,0,1]'], expected: '0' },
    { inputs: ['[7,8,9,10,11,12]'], expected: '11' },
  ],
  editorial_md: `## Intuition
We can find the second-largest distinct value in a single pass by tracking two variables: \`best\` (the largest so far) and \`second\` (the largest distinct value below \`best\`). Each new element either beats \`best\` (pushing the old \`best\` into \`second\`), beats \`second\` but ties \`best\` (no change), or beats \`second\` (taking its place).

## Approach
1. Initialise \`best = second = INT_MIN\` (or use \`None\` sentinels).
2. For each \`x\` in \`nums\`:
   - If \`x > best\`: \`second = best\`; \`best = x\`.
   - Else if \`x < best\` and \`x > second\`: \`second = x\`.
3. After the pass, if \`second == INT_MIN\` (or sentinel still), return \`-1\` — no distinct second-largest exists.
4. Otherwise return \`second\`.

The strict \`<\` in step 2 keeps duplicates from polluting \`second\`.

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def secondLargest(self, nums):
        INF = float('-inf')
        best = second = INF
        for x in nums:
            if x > best:
                second = best
                best = x
            elif x < best and x > second:
                second = x
        return -1 if second == INF else second
`,
    javascript: `class Solution {
    secondLargest(nums) {
        let best = -Infinity, second = -Infinity;
        for (const x of nums) {
            if (x > best) { second = best; best = x; }
            else if (x < best && x > second) second = x;
        }
        return second === -Infinity ? -1 : second;
    }
}
`,
    java: `class Solution {
    public int secondLargest(int[] nums) {
        long best = Long.MIN_VALUE, second = Long.MIN_VALUE;
        for (int x : nums) {
            if (x > best) { second = best; best = x; }
            else if (x < best && x > second) second = x;
        }
        return second == Long.MIN_VALUE ? -1 : (int) second;
    }
}
`,
    cpp: `#include <vector>
#include <climits>
using namespace std;
class Solution {
public:
    int secondLargest(vector<int>& nums) {
        long long best = LLONG_MIN, second = LLONG_MIN;
        for (int x : nums) {
            if (x > best) { second = best; best = x; }
            else if (x < best && x > second) second = x;
        }
        return second == LLONG_MIN ? -1 : (int) second;
    }
};
`,
  },
});

// 40. local-min-max — find all indices that are local minima or maxima
add({
  id: 'local-min-max',
  method_name: 'findLocalMinMax',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[List[int]]',
  pattern: 'Neighbour comparison sweep',
  description: '<p>Given an integer array, return all indices that are local minima or local maxima. A local maximum at index <code>i</code> satisfies <code>nums[i] &gt; nums[i-1]</code> and <code>nums[i] &gt; nums[i+1]</code>. A local minimum is the symmetric condition. Boundaries (i = 0 or i = n-1) consider only the existing neighbour.</p><p>Return a list of <code>[index, kind]</code> pairs where <code>kind</code> is <code>0</code> for local minimum and <code>1</code> for local maximum, in ascending order of index.</p>',
  hints: [
    'Walk i from 0 to n-1.',
    'For interior i, compare to both neighbours.',
    'For i = 0, compare only to nums[1].',
    'For i = n-1, compare only to nums[n-2].',
    'Strictly less than both -> local min; strictly greater -> local max.',
  ],
  test_cases: [
    { inputs: ['[1,3,2,4,1,5]'], expected: '[[0,0],[1,1],[2,0],[3,1],[4,0],[5,1]]' },
    { inputs: ['[1,2,3]'], expected: '[[0,0],[2,1]]' },
    { inputs: ['[3,2,1]'], expected: '[[0,1],[2,0]]' },
    { inputs: ['[1]'], expected: '[]' },
    { inputs: ['[5,5,5,5]'], expected: '[]' },
    { inputs: ['[1,2,1]'], expected: '[[0,0],[1,1],[2,0]]' },
    { inputs: ['[2,1,2]'], expected: '[[0,1],[1,0],[2,1]]' },
    { inputs: ['[10,20,15,2,23,90,67]'], expected: '[[0,0],[1,1],[3,0],[5,1],[6,0]]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[[0,0],[4,1]]' },
    { inputs: ['[]'], expected: '[]' },
  ],
  editorial_md: `## Intuition
A local extremum is a point that differs from its neighbours in a specific direction. With a single linear sweep we compare each index to its (existing) neighbours and classify it as a local min, local max, or neither. The two boundary indices have only one neighbour, so we treat them as edge cases.

## Approach
1. If the array is empty, return an empty list.
2. For each index \`i\` from 0 to \`n - 1\`:
   - If \`n == 1\`, no neighbour exists — skip.
   - Determine the left and right neighbours (or sentinels when missing).
   - The cell is a local maximum if it is strictly greater than every existing neighbour, a local minimum if strictly less.
   - Skip plateaus where the value equals a neighbour — they're neither.
3. Append matching indices with kind 0 (min) or 1 (max) in order.

## Complexity
- Time: O(n).
- Space: O(k) where k is the number of extrema found.`,
  solutions: {
    python: `class Solution:
    def findLocalMinMax(self, nums):
        n = len(nums)
        out = []
        if n == 0: return out
        for i in range(n):
            left = nums[i - 1] if i > 0 else None
            right = nums[i + 1] if i + 1 < n else None
            is_max = True; is_min = True
            for v in (left, right):
                if v is None: continue
                if not (nums[i] > v): is_max = False
                if not (nums[i] < v): is_min = False
            if is_max and (left is not None or right is not None): out.append([i, 1])
            elif is_min and (left is not None or right is not None): out.append([i, 0])
        return out
`,
    javascript: `class Solution {
    findLocalMinMax(nums) {
        const n = nums.length, out = [];
        if (n === 0) return out;
        for (let i = 0; i < n; i++) {
            const left = i > 0 ? nums[i - 1] : null;
            const right = i + 1 < n ? nums[i + 1] : null;
            if (left === null && right === null) continue;
            let isMax = true, isMin = true;
            for (const v of [left, right]) {
                if (v === null) continue;
                if (!(nums[i] > v)) isMax = false;
                if (!(nums[i] < v)) isMin = false;
            }
            if (isMax) out.push([i, 1]);
            else if (isMin) out.push([i, 0]);
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[][] findLocalMinMax(int[] nums) {
        int n = nums.length;
        List<int[]> out = new ArrayList<>();
        if (n == 0) return new int[0][];
        for (int i = 0; i < n; i++) {
            Integer left = i > 0 ? nums[i - 1] : null;
            Integer right = i + 1 < n ? nums[i + 1] : null;
            if (left == null && right == null) continue;
            boolean isMax = true, isMin = true;
            if (left != null) { if (!(nums[i] > left)) isMax = false; if (!(nums[i] < left)) isMin = false; }
            if (right != null) { if (!(nums[i] > right)) isMax = false; if (!(nums[i] < right)) isMin = false; }
            if (isMax) out.add(new int[]{i, 1});
            else if (isMin) out.add(new int[]{i, 0});
        }
        return out.toArray(new int[0][]);
    }
}
`,
    cpp: `#include <vector>
#include <optional>
using namespace std;
class Solution {
public:
    vector<vector<int>> findLocalMinMax(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> out;
        if (n == 0) return out;
        for (int i = 0; i < n; i++) {
            bool hasLeft = i > 0, hasRight = i + 1 < n;
            if (!hasLeft && !hasRight) continue;
            bool isMax = true, isMin = true;
            if (hasLeft) { if (!(nums[i] > nums[i-1])) isMax = false; if (!(nums[i] < nums[i-1])) isMin = false; }
            if (hasRight) { if (!(nums[i] > nums[i+1])) isMax = false; if (!(nums[i] < nums[i+1])) isMin = false; }
            if (isMax) out.push_back({i, 1});
            else if (isMin) out.push_back({i, 0});
        }
        return out;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-02-part4.json', JSON.stringify(entries, null, 2));
console.log('Wrote part4 with ' + entries.length + ' entries.');
