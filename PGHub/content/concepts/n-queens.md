---
slug: n-queens
module: recursion-bt
title: N-Queens
subtitle: The canonical backtracking problem — place N queens on N×N without conflict.
difficulty: Advanced
position: 6
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 4: Divide-and-Conquer (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap04/"
    type: book
  - title: "cp-algorithms — Backtracking"
    url: "https://cp-algorithms.com/combinatorics/all_combinations.html"
    type: blog
  - title: "TheAlgorithms/Python — backtracking/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/backtracking"
    type: repo
status: published
---

## intro
N-Queens: place N chess queens on an N×N board so no two threaten each other (no shared row, column, or diagonal). The problem is small enough to grasp, large enough to *require* backtracking, and structured enough that every smart pruning trick reveals itself. It's the canonical "search with constraints" interview question.

## whyItMatters
N-Queens is the gateway drug to backtracking. Once you internalize the search pattern — place tentatively, recurse, undo if it does not work — every other backtracking problem (Sudoku, word search, combinations, permutations, parenthesis generation) clicks. The bit-manipulation optimization doubles as the canonical introduction to "represent a set as bits" thinking, which is foundational for bitmask DP and state-space search. Knuth's Dancing Links (DLX, TAOCP Volume 4A) uses N-Queens as its running example. Stockfish's move-generation pruning uses the same diagonal-bitmask trick. Google OR-Tools' CP-SAT solver internally instruments N-Queens as a regression benchmark because performance there correlates strongly with general CSP throughput.

## intuition
Place one queen per row, top to bottom. For each row, try every column. A column is valid if no previously placed queen shares it, shares the same `/` diagonal (`row + col` equal), or shares the same `\` diagonal (`row - col` equal). Recurse to the next row. If no column works at the current row, backtrack to the previous row and try its next column.

Three sets — `cols`, `posDiag` (`row + col`), `negDiag` (`row - col`) — make conflict checking `O(1)` per attempt. The single most important property of this representation is that adding and removing from a hash set are both `O(1)`, so the symmetric mark-recurse-unmark pattern stays tight. Without the sets you would scan all previously placed queens on every check, turning each conflict test into `O(row)` and the whole search into `O(n * n!)`.

The deeper insight is that backtracking is depth-first search over a tree of partial assignments. The tree's root is the empty board; each child fixes the column for the next row; leaves at depth `n` are complete solutions. Pruning is what prevents the tree from being `n^n` — every illegal partial assignment is rejected immediately rather than after the whole board is placed. The same shape applies to Sudoku (depth = empty cells), graph coloring (depth = vertices), and any CSP you will see in interviews.

## visualization
For N=4: row 0, try col 0 → place. Row 1, col 0 conflict (column), col 1 conflict (diagonal r+c=1 vs prev r+c=0... actually no), col 2 OK → place. Row 2: cols 0/2 taken, 1 conflicts diagonally, 3 OK → place. Row 3: all conflict → backtrack to row 2, try col 4 (none) → backtrack to row 1 col 3 → place. Row 2 col 1 OK. Row 3 col 4 (none)... You get the picture. The recursion tree is pruned aggressively by the three sets.

## bruteForce
Place N queens in `N²` cells in every possible way (`N² choose N` placements) and check each for validity. Astronomically slow — for N=8, that's ~4.4 billion placements. Useless. Even "one queen per row" without diagonal pruning is N^N — for N=8, 16M. Backtracking with the three sets prunes to a few thousand recursive calls for N=8.

## optimal
Row-by-row DFS with three sets tracking column / `/`-diagonal / `\`-diagonal occupation. The `/` diagonal is identified by `row + col`; the `\` diagonal by `row - col` (offset by `n - 1` to keep it non-negative if you use an array instead of a hash set). Each successful `row == n` completes one solution; collect or count.

```python
def total_n_queens(n):
    cols, pos, neg = set(), set(), set()
    count = 0
    def dfs(r):
        nonlocal count
        if r == n:
            count += 1
            return
        for c in range(n):
            if c in cols or (r + c) in pos or (r - c) in neg:
                continue
            cols.add(c); pos.add(r + c); neg.add(r - c)
            dfs(r + 1)
            cols.remove(c); pos.remove(r + c); neg.remove(r - c)
    dfs(0)
    return count
```

The critical pattern is the symmetric `add` / `remove` pair surrounding the recursive call — backtracking only works if every modification is undone on the way back up. The bit-manipulation variant uses three integers (cols, posDiag, negDiag) as bitmasks and `~(cols | (posDiag << row) | (negDiag >> row))` to find available columns in one operation; the world-record solver for `n >= 18` uses this representation plus symmetry breaking (only enumerate first-row columns `0..n/2 - 1` and double the count, handling the center column carefully when `n` is odd). The exact count of solutions is OEIS A000170; for `n = 12` it is 14,200 placements explored from about 30 million recursion nodes.

## complexity
time: O(N!) worst case, but pruning brings it dramatically lower in practice.
space: O(N) for the recursion stack + O(N) for the three occupation sets.
notes: For N=8 there are exactly 92 solutions; for N=12 there are 14,200; for N=15 there are over 2 million. The bit-manipulation solver handles N=15 in seconds; pure boolean-set backtracking handles N=12 in seconds, N=14 in minutes.

## pitfalls
- Forgetting one of the diagonal directions (only checking `/` or only `\`) — the most common bug.
- Off-by-one on the `\` diagonal index when using an array instead of a hash set (`row - col` can be negative; add `N - 1`).
- Forgetting to *undo* the three sets on backtrack — leads to false conflicts for sibling branches.
- Trying to "optimize" by placing queens in any order — row-by-row is canonical because it implicitly handles "one per row" without an extra check.

## interviewTips
- Always start by stating the row-by-row insight: "queens can't share rows, so I'll place exactly one per row and only have to check columns and diagonals." This single sentence cuts the problem from `N²` choices to `N` choices per row.
- Mention the bitmask optimization but don't lead with it. Most interviewers want the readable hash-set version first.
- The natural follow-up is "count solutions only, don't enumerate" — same recursion, just increment a counter and return at row=N.

## code.python
```python
def solve_n_queens(n: int) -> list[list[str]]:
    cols, pos_diag, neg_diag = set(), set(), set()
    board = [['.'] * n for _ in range(n)]
    solutions = []

    def backtrack(row: int) -> None:
        if row == n:
            solutions.append([''.join(r) for r in board])
            return
        for col in range(n):
            if col in cols or (row + col) in pos_diag or (row - col) in neg_diag:
                continue
            cols.add(col); pos_diag.add(row + col); neg_diag.add(row - col)
            board[row][col] = 'Q'
            backtrack(row + 1)
            cols.remove(col); pos_diag.remove(row + col); neg_diag.remove(row - col)
            board[row][col] = '.'

    backtrack(0)
    return solutions
```

## code.javascript
```javascript
function solveNQueens(n) {
  const cols = new Set(), posDiag = new Set(), negDiag = new Set();
  const board = Array.from({ length: n }, () => Array(n).fill('.'));
  const solutions = [];

  function backtrack(row) {
    if (row === n) {
      solutions.push(board.map(r => r.join('')));
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || posDiag.has(row + col) || negDiag.has(row - col)) continue;
      cols.add(col); posDiag.add(row + col); negDiag.add(row - col);
      board[row][col] = 'Q';
      backtrack(row + 1);
      cols.delete(col); posDiag.delete(row + col); negDiag.delete(row - col);
      board[row][col] = '.';
    }
  }
  backtrack(0);
  return solutions;
}
```

## code.java
```java
public List<List<String>> solveNQueens(int n) {
    Set<Integer> cols = new HashSet<>(), posDiag = new HashSet<>(), negDiag = new HashSet<>();
    char[][] board = new char[n][n];
    for (char[] r : board) Arrays.fill(r, '.');
    List<List<String>> solutions = new ArrayList<>();
    backtrack(0, n, board, cols, posDiag, negDiag, solutions);
    return solutions;
}
private void backtrack(int row, int n, char[][] board, Set<Integer> cols, Set<Integer> posDiag, Set<Integer> negDiag, List<List<String>> solutions) {
    if (row == n) {
        List<String> snapshot = new ArrayList<>();
        for (char[] r : board) snapshot.add(new String(r));
        solutions.add(snapshot);
        return;
    }
    for (int col = 0; col < n; col++) {
        if (cols.contains(col) || posDiag.contains(row + col) || negDiag.contains(row - col)) continue;
        cols.add(col); posDiag.add(row + col); negDiag.add(row - col);
        board[row][col] = 'Q';
        backtrack(row + 1, n, board, cols, posDiag, negDiag, solutions);
        cols.remove(col); posDiag.remove(row + col); negDiag.remove(row - col);
        board[row][col] = '.';
    }
}
```

## code.cpp
```cpp
class NQueens {
    set<int> cols, posDiag, negDiag;
    vector<string> board;
    vector<vector<string>> solutions;
    int n;
    void backtrack(int row) {
        if (row == n) { solutions.push_back(board); return; }
        for (int col = 0; col < n; col++) {
            if (cols.count(col) || posDiag.count(row + col) || negDiag.count(row - col)) continue;
            cols.insert(col); posDiag.insert(row + col); negDiag.insert(row - col);
            board[row][col] = 'Q';
            backtrack(row + 1);
            cols.erase(col); posDiag.erase(row + col); negDiag.erase(row - col);
            board[row][col] = '.';
        }
    }
public:
    vector<vector<string>> solveNQueens(int sz) {
        n = sz;
        board.assign(n, string(n, '.'));
        backtrack(0);
        return solutions;
    }
};
```
