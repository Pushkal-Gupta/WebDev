---
slug: dp-stone-game
module: dp
title: Stone Game (Minimax DP)
subtitle: Two players take stones from a row; compute the score difference under optimal play.
difficulty: Intermediate
position: 33
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Game Theory and DP — walkccc.me/CLRS"
    url: "https://walkccc.me/CLRS/Chap15/15.2/"
    type: book
  - title: "Optimal Strategy for a Game — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/optimal-strategy-for-a-game-dp-31/"
    type: blog
  - title: "TheAlgorithms/Python — minimax.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/backtracking/minimax.py"
    type: repo
status: published
---

## intro
Two players take turns removing a stone from either end of a row of piles. Each pile has a positive value; the player who has accumulated the most points at the end wins. Assuming both play optimally, determine the score difference between the first and second player. This is the canonical minimax-on-an-interval DP and powers a large family of game-theory interview problems.

## whyItMatters
Game-theoretic DP comes up in Nim variants, coin-pickup games, palindrome partitioning with adversaries, and Alpha-Beta pruning warmups. The "interval DP on a subarray with two endpoints" template — dp[i][j] depending on dp[i+1][j] and dp[i][j-1] — is also the engine of matrix-chain multiplication, optimal BST, and burst-balloons. Recognising the same shape across many disguises is the point.

## intuition
Think recursively from the current state defined by the interval [i, j] of remaining piles. Whoever is to move wants to maximise (their pick) - (best score the opponent can then get). Picking the left pile gives piles[i] - solve(i+1, j); picking the right gives piles[j] - solve(i, j-1). The current player chooses the larger. The recursion is symmetric because "best score the opponent can get from [i+1, j]" is exactly solve(i+1, j) under the same optimal-play rule.

## visualization
Piles = [3, 9, 1, 2]. Subintervals of length 1: dp[0][0]=3, dp[1][1]=9, dp[2][2]=1, dp[3][3]=2. Length 2: dp[0][1] = max(3 - 9, 9 - 3) = 6. dp[1][2] = max(9 - 1, 1 - 9) = 8. dp[2][3] = max(1 - 2, 2 - 1) = 1. Length 3: dp[0][2] = max(3 - dp[1][2], 1 - dp[0][1]) = max(-5, -5) = -5. dp[1][3] = max(9 - dp[2][3], 2 - dp[1][2]) = max(8, -6) = 8. Length 4: dp[0][3] = max(3 - dp[1][3], 2 - dp[0][2]) = max(-5, 7) = 7. First player wins by 7.

## bruteForce
Direct recursion explores both choices at every state and re-explores subintervals exponentially. Without memoisation, time is O(2^n). It is the right thing to *write first* on the whiteboard because it makes the recurrence visible, then add memoisation to make it tractable.

## optimal
Memoise on the interval (i, j): dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1]). Iterate length from 1 to n; for each length iterate left endpoint i from 0 to n - length. The final answer is dp[0][n-1] — the score advantage of the first player. First player wins iff this is positive. To recover the optimal move sequence, store the chosen end at each cell and replay forward.

## complexity
time: O(n^2) — fills an n x n table once with O(1) work per cell
space: O(n^2) for the DP table, reducible to O(n) by iterating diagonally and keeping two diagonals
notes: Total stones sum S is fixed, so first player's score is (S + dp[0][n-1]) / 2. For special cases (e.g., even n in the LeetCode Stone Game I where first player always wins), there are clever one-liners but they do not generalise — the DP is the safe answer.

## pitfalls
- Returning dp[0][n-1] as the first player's score instead of as the score difference. They differ by (S - diff) / 2.
- Iterating endpoints in the wrong order — by length is the safe pattern; by i then j leaves cells unfilled.
- Using min instead of max somewhere, mixing up "what current player gets" with "what total is."
- Memoising on (i, j, turn) — turn is redundant because the recursion already swaps perspectives via the minus sign.
- Forgetting the base case dp[i][i] = piles[i] (single pile, current player takes it).

## interviewTips
- State the invariant: "dp[i][j] is current player's score minus opponent's, assuming both play optimally on piles[i..j]."
- Walk through a 3- or 4-pile example end-to-end so the minus-flip is unambiguous.
- Be ready for follow-ups: "what if players can take from one end only," "what if there are k allowed moves per turn," "what if values can be negative."
- Mention real-world links: chip-stack games, Alpha-Beta on tic-tac-toe, AlphaZero's value-network targets.

## code.python
```python
def stone_game(piles):
    n = len(piles)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = piles[i]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1])
    return dp[0][n - 1]
```

## code.javascript
```javascript
function stoneGame(piles) {
  const n = piles.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = piles[i];
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
    }
  }
  return dp[0][n - 1];
}
```

## code.java
```java
public class StoneGame {
    public int scoreDifference(int[] piles) {
        int n = piles.length;
        int[][] dp = new int[n][n];
        for (int i = 0; i < n; i++) dp[i][i] = piles[i];
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

int stoneGame(std::vector<int>& piles) {
    int n = piles.size();
    std::vector<std::vector<int>> dp(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) dp[i][i] = piles[i];
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = std::max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
        }
    }
    return dp[0][n - 1];
}
```
