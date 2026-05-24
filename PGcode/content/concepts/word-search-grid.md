---
slug: word-search-grid
module: recursion-bt
title: Word Search on a Grid
subtitle: DFS through a 2D board with a visited mask to find a word in any rectilinear path.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Graph Search"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "Word Search — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/word-search-in-2-d-grid/"
    type: blog
  - title: "TheAlgorithms/Python — word_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/backtracking/word_search.py"
    type: repo
status: published
---

## intro
Given a 2D board of characters and a target word, decide whether the word can be traced through adjacent cells (up, down, left, right) without reusing any cell. This is grid backtracking in its purest form: every cell is a potential starting point, and from each starting point we DFS character by character until the word is matched or we exhaust the four-direction tree.

## whyItMatters
Word search is the bridge between flat-list backtracking (permutations, combinations) and graph search. The same template — pick a neighbor, mark visited, recurse, unmark — drives island-counting, flood-fill, maze solving, and the prefix-trie variant for "find all words from a dictionary." Mastering the visited-mark / unmark dance on a grid is a prerequisite for the harder Word Search II problem.

## intuition
Treat the grid as a graph: each cell is a node connected to its four orthogonal neighbors. From every cell whose letter matches word[0], launch a DFS that tries to extend the prefix one character at a time. Mark the cell as visited so the path cannot revisit it; on unwind, unmark so a sibling DFS can use it. Success bubbles up the call stack the instant the full word is matched.

## visualization
Board [["A","B","C","E"], ["S","F","C","S"], ["A","D","E","E"]], word "ABCCED". Start at (0,0)='A'. Move right to (0,1)='B'. Right to (0,2)='C'. Down to (1,2)='C'. Down to (2,2)='E'. Left to (2,1)='D'. Word matched — return true. The visited mask along the path is exactly the six cells we touched.

## bruteForce
Generate every simple path of length len(word) on the grid (8-direction or 4-direction), then check each one against the target. For an m by n board with k = len(word), that is up to mn * 3^(k-1) paths even with the four-direction constraint, and you do all that work even when most paths share no prefix with word.

## optimal
For each cell (r, c) whose value equals word[0], call `dfs(r, c, 0)`. Inside `dfs(r, c, i)`: if board[r][c] != word[i] return false; if i == len(word) - 1 return true; mark board[r][c] with a sentinel (e.g. '#'), recurse on the four neighbors with i+1; restore the original character and return whether any neighbor succeeded. Using the board itself as the visited mask saves the O(mn) auxiliary boolean grid.

## complexity
time: O(m * n * 4^L) where L is len(word)
space: O(L) for the recursion stack
notes: The branching factor is 3 after the first step (you cannot immediately revisit the cell you came from), so a tighter bound is O(m * n * 3^(L-1)). Pruning when board[r][c] != word[i] is the only thing that keeps this tractable for L up to ~10.

## pitfalls
- Forgetting to restore the cell character on the way back up — later starts see false-positive blocks.
- Returning early when any one neighbor fails — you must try all four before declaring this branch dead.
- Out-of-bounds checks missing one side — always validate r and c against both 0 and the board dimensions.
- Allocating a fresh visited array per DFS call instead of mutating in place — O(mn) extra memory per call.

## interviewTips
- Mention the "use the board as the visited mask" trick — it saves memory and signals familiarity with the pattern.
- For Word Search II (find all words from a dictionary), bring up the Trie + DFS combination; prefix-pruning is what makes it tractable.
- A one-line optimization: bail out at the start if a Counter check shows the board doesn't contain enough of each letter in the word.

## code.python
```python
def exist(board, word):
    m, n = len(board), len(board[0])

    def dfs(r, c, i):
        if i == len(word):
            return True
        if r < 0 or r >= m or c < 0 or c >= n or board[r][c] != word[i]:
            return False
        saved = board[r][c]
        board[r][c] = '#'
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1)
                 or dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = saved
        return found

    for r in range(m):
        for c in range(n):
            if dfs(r, c, 0):
                return True
    return False
```

## code.javascript
```javascript
function exist(board, word) {
  const m = board.length, n = board[0].length;
  function dfs(r, c, i) {
    if (i === word.length) return true;
    if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[i]) return false;
    const saved = board[r][c];
    board[r][c] = '#';
    const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1)
               || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = saved;
    return found;
  }
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++)
      if (dfs(r, c, 0)) return true;
  return false;
}
```

## code.java
```java
public boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length;
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (dfs(board, r, c, 0, word)) return true;
    return false;
}

private boolean dfs(char[][] board, int r, int c, int i, String word) {
    if (i == word.length()) return true;
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length
        || board[r][c] != word.charAt(i)) return false;
    char saved = board[r][c];
    board[r][c] = '#';
    boolean found = dfs(board, r + 1, c, i + 1, word)
                 || dfs(board, r - 1, c, i + 1, word)
                 || dfs(board, r, c + 1, i + 1, word)
                 || dfs(board, r, c - 1, i + 1, word);
    board[r][c] = saved;
    return found;
}
```

## code.cpp
```cpp
class Solution {
public:
    bool exist(vector<vector<char>>& board, string word) {
        int m = board.size(), n = board[0].size();
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (dfs(board, r, c, 0, word)) return true;
        return false;
    }
private:
    bool dfs(vector<vector<char>>& board, int r, int c, int i, const string& word) {
        if (i == (int)word.size()) return true;
        if (r < 0 || r >= (int)board.size() || c < 0 || c >= (int)board[0].size()
            || board[r][c] != word[i]) return false;
        char saved = board[r][c];
        board[r][c] = '#';
        bool found = dfs(board, r + 1, c, i + 1, word)
                  || dfs(board, r - 1, c, i + 1, word)
                  || dfs(board, r, c + 1, i + 1, word)
                  || dfs(board, r, c - 1, i + 1, word);
        board[r][c] = saved;
        return found;
    }
};
```
