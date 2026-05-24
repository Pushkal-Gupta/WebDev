---
slug: sudoku-solver
module: recursion-bt
title: Sudoku Solver
subtitle: Backtracking with row, column, and 3x3 box constraint sets — and where constraint propagation helps.
difficulty: Advanced
position: 6
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Sedgewick & Wayne"
    url: "https://algs4.cs.princeton.edu/"
    type: book
  - title: "Sudoku — Backtracking — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/sudoku-backtracking-7/"
    type: blog
  - title: "TheAlgorithms/Python — sudoku.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/backtracking/sudoku.py"
    type: repo
status: published
---

## intro
Sudoku is a 9x9 grid where each row, each column, and each of nine 3x3 boxes must contain the digits 1 through 9 exactly once. A puzzle gives you a partial assignment and asks you to fill the rest. The textbook solver is backtracking: walk the empty cells in some order, try every legal digit, recurse, undo on failure. With three constraint sets it runs in microseconds on standard puzzles.

## whyItMatters
Sudoku consolidates everything you've learned about backtracking — recursion, choice + unchoice, O(1) constraint checks via sets — and adds the most important strategic idea in constraint-satisfaction search: variable ordering. Choosing the most-constrained empty cell first (MRV — minimum remaining values) cuts solve time by orders of magnitude on hard puzzles. The same principle generalizes to graph coloring, scheduling, and SAT solvers.

## intuition
View the board as 81 variables, each with domain {1..9}, and three families of all-different constraints. Pick an empty cell, look at the union of digits already in its row, column, and box, and try each remaining candidate. If you reach a cell with no candidates, the current path is doomed — undo the latest choice and try the next. The cleverer the variable ordering, the smaller the search tree.

## visualization
Suppose row 0 contains 5, 3 in known cells, column 0 contains 5, 6, and the top-left box already contains 5, 3, 6. For the empty cell at (0, 2), the forbidden set is {3, 5, 6}, so candidates are {1, 2, 4, 7, 8, 9}. We try 1 first, recurse into the next empty cell, propagate. If a downstream cell ends up with an empty domain, we undo to (0, 2) and try 2.

## bruteForce
Fill every empty cell with every digit 1..9 independently, then test the entire board against all 27 all-different constraints. With k empty cells you do 9^k boards, validating each in 81 work — utterly infeasible for k > 10 even on a server. This is mentioned only to motivate the constraint-aware approach.

## optimal
Maintain `rows[9]`, `cols[9]`, `boxes[9]` as bitmasks of used digits. Find the next empty cell (or, better, the empty cell with the fewest candidates — MRV). For each digit not in the union, set the bit in all three masks, write to the board, recurse; on failure clear the bit and the cell. The MRV ordering plus bitmask candidate computation (`available = ~(rows[r] | cols[c] | boxes[b])`) is enough to solve every newspaper puzzle in under a millisecond.

## complexity
time: O(9^k) worst case where k is the number of empty cells
space: O(k) recursion depth plus O(1) for the constraint masks
notes: With MRV ordering, real-world puzzles solve in tens of thousands of node visits, not 9^k. For benchmark-hard puzzles consider naked-pair, hidden-single, and X-wing propagation, but plain MRV + bitmask is interview-grade for any standard 9x9.

## pitfalls
- Recomputing the candidate set from scratch each call — O(81) per cell instead of O(1) bitmask read.
- Forgetting to clear the bit in all three masks on unwind — a single missed undo corrupts the search.
- Returning the first solution when the prompt asks "does a unique solution exist?" — you must continue searching and bail at the second.
- Iterating empty cells in row-major order instead of MRV order on hard puzzles — works but can be 100x slower.

## interviewTips
- Code with three integer bitmasks before considering anything fancier — it is the cleanest solution and runs fast enough.
- Mention MRV ordering even if you do not implement it: "I'd pick the empty cell with the fewest candidates first; that's a standard CSP heuristic."
- For Sudoku variants (16x16, Killer, Samurai) the same skeleton applies — the constraint sets just grow.

## code.python
```python
def solve_sudoku(board):
    rows = [0] * 9
    cols = [0] * 9
    boxes = [0] * 9
    empties = []
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == '.':
                empties.append((r, c))
            else:
                bit = 1 << (int(v) - 1)
                rows[r] |= bit
                cols[c] |= bit
                boxes[(r // 3) * 3 + c // 3] |= bit

    def dfs(k):
        if k == len(empties):
            return True
        r, c = empties[k]
        b = (r // 3) * 3 + c // 3
        used = rows[r] | cols[c] | boxes[b]
        for d in range(9):
            bit = 1 << d
            if used & bit:
                continue
            rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit
            board[r][c] = str(d + 1)
            if dfs(k + 1):
                return True
            rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit
            board[r][c] = '.'
        return False

    dfs(0)
```

## code.javascript
```javascript
function solveSudoku(board) {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  const empties = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === '.') { empties.push([r, c]); continue; }
      const bit = 1 << (Number(v) - 1);
      rows[r] |= bit; cols[c] |= bit;
      boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)] |= bit;
    }
  }
  function dfs(k) {
    if (k === empties.length) return true;
    const [r, c] = empties[k];
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const used = rows[r] | cols[c] | boxes[b];
    for (let d = 0; d < 9; d++) {
      const bit = 1 << d;
      if (used & bit) continue;
      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      board[r][c] = String(d + 1);
      if (dfs(k + 1)) return true;
      rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
      board[r][c] = '.';
    }
    return false;
  }
  dfs(0);
}
```

## code.java
```java
public void solveSudoku(char[][] board) {
    int[] rows = new int[9], cols = new int[9], boxes = new int[9];
    List<int[]> empties = new ArrayList<>();
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++) {
            char v = board[r][c];
            if (v == '.') { empties.add(new int[]{r, c}); continue; }
            int bit = 1 << (v - '1');
            rows[r] |= bit; cols[c] |= bit;
            boxes[(r / 3) * 3 + c / 3] |= bit;
        }
    dfs(0, board, rows, cols, boxes, empties);
}

private boolean dfs(int k, char[][] board, int[] rows, int[] cols, int[] boxes, List<int[]> empties) {
    if (k == empties.size()) return true;
    int r = empties.get(k)[0], c = empties.get(k)[1];
    int b = (r / 3) * 3 + c / 3;
    int used = rows[r] | cols[c] | boxes[b];
    for (int d = 0; d < 9; d++) {
        int bit = 1 << d;
        if ((used & bit) != 0) continue;
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        board[r][c] = (char) ('1' + d);
        if (dfs(k + 1, board, rows, cols, boxes, empties)) return true;
        rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
        board[r][c] = '.';
    }
    return false;
}
```

## code.cpp
```cpp
class Solution {
public:
    void solveSudoku(vector<vector<char>>& board) {
        vector<int> rows(9, 0), cols(9, 0), boxes(9, 0);
        vector<pair<int,int>> empties;
        for (int r = 0; r < 9; r++)
            for (int c = 0; c < 9; c++) {
                char v = board[r][c];
                if (v == '.') { empties.push_back({r, c}); continue; }
                int bit = 1 << (v - '1');
                rows[r] |= bit; cols[c] |= bit;
                boxes[(r / 3) * 3 + c / 3] |= bit;
            }
        dfs(0, board, rows, cols, boxes, empties);
    }
private:
    bool dfs(int k, vector<vector<char>>& board, vector<int>& rows,
             vector<int>& cols, vector<int>& boxes, vector<pair<int,int>>& empties) {
        if (k == (int)empties.size()) return true;
        auto [r, c] = empties[k];
        int b = (r / 3) * 3 + c / 3;
        int used = rows[r] | cols[c] | boxes[b];
        for (int d = 0; d < 9; d++) {
            int bit = 1 << d;
            if (used & bit) continue;
            rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
            board[r][c] = (char)('1' + d);
            if (dfs(k + 1, board, rows, cols, boxes, empties)) return true;
            rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
            board[r][c] = '.';
        }
        return false;
    }
};
```
