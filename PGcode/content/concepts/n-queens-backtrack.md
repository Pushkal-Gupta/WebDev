---
slug: n-queens-backtrack
module: recursion-bt
title: N-Queens via Backtracking
subtitle: Place n non-attacking queens on an n by n board using DFS with column and diagonal pruning.
difficulty: Advanced
position: 3
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Sedgewick & Wayne"
    url: "https://algs4.cs.princeton.edu/"
    type: book
  - title: "N Queen Problem — Backtracking — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/n-queen-problem-backtracking-3/"
    type: blog
  - title: "TheAlgorithms/Python — n_queens.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/backtracking/n_queens.py"
    type: repo
status: published
---

## intro
The N-Queens problem asks you to place n queens on an n by n chessboard so that no two attack one another — no shared row, column, or diagonal. It is the canonical constraint-satisfaction problem and the perfect showcase for backtracking: enumerate candidates row by row, prune the moment any constraint is violated, recurse on what is left.

## whyItMatters
N-Queens is the canonical constraint-satisfaction problem and the backbone of nearly every backtracking interview question. Donald Knuth chose it as the running example for Dancing Links (DLX) in *The Art of Computer Programming* Volume 4A; the same algorithm now powers Sudoku solvers, exact-cover puzzle generators, and the SAT-style constraint engines inside Google OR-Tools and IBM CPLEX. The bitmask variant ships inside chess engines like Stockfish for move-generation pruning. Recruiters at Google, Meta, and Jane Street use N-Queens because it forces three skills at once: encoding constraints in `O(1)` lookup structures, ordering decisions to maximize pruning, and recognizing when a partial assignment is already doomed.

## intuition
Place queens one row at a time, top to bottom. Because every legal solution has exactly one queen per row (rows attack), the search space collapses from `n^n` arrangements to at most `n!` permutations of columns. That single observation is the first cut.

The second cut comes from O(1) constraint lookups. When you try to put a queen in row `r`, column `c`, three things would make it illegal: another queen sitting in column `c`, another queen on the up-right diagonal (where `row - col` is the same constant), or another queen on the down-right diagonal (where `row + col` matches). Maintain three sets — `cols`, `diag1`, `diag2` — and you can reject a candidate in constant time instead of scanning all previously placed queens.

The third cut is the backtracking choreography itself: on each recursive call you add to the three sets, recurse one row deeper, then on the way back up you remove what you added. The state is always a valid partial solution, never a tentative or speculative one. When `row == n` you have placed all `n` queens legally, so you record the board and return. If no column works in the current row, you simply return without recording anything; the caller's loop tries the next column.

## visualization
On a 4x4 board, place row 0 at col 1. Mark cols={1}, diag1={0-1=-1}, diag2={0+1=1}. Row 1: cols 0 and 2 are blocked by diagonals from the row-0 queen (diag1 hits col 0 via 1-0=1? no, 1-0=1 not in {-1}, but 1+0=1 is in diag2 — col 0 blocked; col 2 has 1-2=-1 in diag1 — blocked; col 3 is free). Continue similarly until row 3 either succeeds or the chain backtracks.

## bruteForce
Try every assignment of n columns to n rows — n^n possibilities — then filter for the no-attack condition. Even with the obvious "one queen per row" simplification you are down to n!, and for n=8 that is already 40,320; for n=12 it is 479 million. Without pruning the constants make this unusable by n=10 in interview time.

## optimal
DFS by row with three boolean (or bitmask) trackers — `cols`, `diag1` keyed by `row - col`, `diag2` keyed by `row + col`. For each candidate column in the current row, test all three; if any is occupied, skip. Otherwise mark the three sets, record the placement, recurse to `row + 1`, then unmark on the way back. At `row == n` the board is complete. The total work is bounded by `O(n!)`, but pruning slashes it: for `n = 8` the search visits about 15,000 nodes instead of 40,320, and for `n = 12` only a few million instead of half a billion.

```python
def solve_n_queens(n):
    res, queens = [], [-1] * n
    cols, d1, d2 = set(), set(), set()
    def dfs(r):
        if r == n:
            res.append(['.'*q + 'Q' + '.'*(n-q-1) for q in queens])
            return
        for c in range(n):
            if c in cols or (r-c) in d1 or (r+c) in d2:
                continue
            cols.add(c); d1.add(r-c); d2.add(r+c); queens[r] = c
            dfs(r + 1)
            cols.remove(c); d1.remove(r-c); d2.remove(r+c)
    dfs(0)
    return res
```

The four critical lines are the conflict check (`c in cols or (r-c) in d1 or (r+c) in d2`) and the symmetric mark/unmark pair around the recursive call. A faster bitmask variant replaces the three sets with three integers and uses `available = ~(cols | d1 | d2)` plus the `x & -x` low-bit trick to iterate only over legal columns; it runs roughly 5x faster for `n` in `[8, 14]` and is the version Knuth ships in DLX.

## complexity
time: O(n!) worst case, drastically less with diagonal pruning in practice
space: O(n) for the row stack and the three constraint sets
notes: The exact count of solutions is OEIS A000170; for n=8 there are 92 distinct solutions explored from roughly 15k recursion nodes. The bitmask variant runs roughly 5x faster than the array variant for n in [8, 14].

## pitfalls
- Indexing `diag1` with `row - col` without offsetting by n-1 — negative indices crash arrays in non-Python languages.
- Forgetting to unmark on the way back up — the parent's next column sees stale conflicts.
- Recomputing diagonal sets from the queens list every call — turns O(1) checks into O(n) checks.
- Returning the first solution when the problem asked to count all of them — re-read the spec.

## interviewTips
- Start by drawing a 4x4 board on paper and walking the recursion until you find the first solution.
- Mention the bitmask variant as a follow-up — interviewers like seeing you know it exists even if you do not code it.
- For "count solutions" follow-ups, name the symmetry trick: solve half the first row and double (handle the center column carefully when n is odd).

## code.python
```python
def solve_n_queens(n):
    res = []
    cols, d1, d2 = set(), set(), set()
    queens = [-1] * n

    def dfs(r):
        if r == n:
            board = ['.' * q + 'Q' + '.' * (n - q - 1) for q in queens]
            res.append(board)
            return
        for c in range(n):
            if c in cols or (r - c) in d1 or (r + c) in d2:
                continue
            cols.add(c); d1.add(r - c); d2.add(r + c)
            queens[r] = c
            dfs(r + 1)
            cols.remove(c); d1.remove(r - c); d2.remove(r + c)

    dfs(0)
    return res
```

## code.javascript
```javascript
function solveNQueens(n) {
  const res = [], queens = new Array(n).fill(-1);
  const cols = new Set(), d1 = new Set(), d2 = new Set();
  function dfs(r) {
    if (r === n) {
      res.push(queens.map(q => '.'.repeat(q) + 'Q' + '.'.repeat(n - q - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
      cols.add(c); d1.add(r - c); d2.add(r + c);
      queens[r] = c;
      dfs(r + 1);
      cols.delete(c); d1.delete(r - c); d2.delete(r + c);
    }
  }
  dfs(0);
  return res;
}
```

## code.java
```java
public List<List<String>> solveNQueens(int n) {
    List<List<String>> res = new ArrayList<>();
    int[] queens = new int[n];
    Set<Integer> cols = new HashSet<>(), d1 = new HashSet<>(), d2 = new HashSet<>();
    dfs(0, n, queens, cols, d1, d2, res);
    return res;
}

private void dfs(int r, int n, int[] queens, Set<Integer> cols, Set<Integer> d1, Set<Integer> d2, List<List<String>> res) {
    if (r == n) {
        List<String> board = new ArrayList<>();
        for (int q : queens) {
            char[] row = new char[n];
            Arrays.fill(row, '.');
            row[q] = 'Q';
            board.add(new String(row));
        }
        res.add(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        if (cols.contains(c) || d1.contains(r - c) || d2.contains(r + c)) continue;
        cols.add(c); d1.add(r - c); d2.add(r + c);
        queens[r] = c;
        dfs(r + 1, n, queens, cols, d1, d2, res);
        cols.remove(c); d1.remove(r - c); d2.remove(r + c);
    }
}
```

## code.cpp
```cpp
class Solution {
public:
    vector<vector<string>> solveNQueens(int n) {
        vector<vector<string>> res;
        vector<int> queens(n, -1);
        unordered_set<int> cols, d1, d2;
        dfs(0, n, queens, cols, d1, d2, res);
        return res;
    }
private:
    void dfs(int r, int n, vector<int>& queens, unordered_set<int>& cols,
             unordered_set<int>& d1, unordered_set<int>& d2, vector<vector<string>>& res) {
        if (r == n) {
            vector<string> board;
            for (int q : queens) {
                string row(n, '.');
                row[q] = 'Q';
                board.push_back(row);
            }
            res.push_back(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (cols.count(c) || d1.count(r - c) || d2.count(r + c)) continue;
            cols.insert(c); d1.insert(r - c); d2.insert(r + c);
            queens[r] = c;
            dfs(r + 1, n, queens, cols, d1, d2, res);
            cols.erase(c); d1.erase(r - c); d2.erase(r + c);
        }
    }
};
```
