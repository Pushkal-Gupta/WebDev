---
slug: dp-game-theory
module: dp
title: Game Theory DP
subtitle: Minimax with alpha-beta on game trees; Nim and Sprague-Grundy.
difficulty: Advanced
position: 36
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.1/"
    type: book
  - title: "Sprague-Grundy theorem — cp-algorithms"
    url: "https://cp-algorithms.com/game_theory/sprague-grundy-nim.html"
    type: blog
  - title: "TheAlgorithms/Python — game theory"
    url: "https://github.com/TheAlgorithms/Python/tree/master/maths"
    type: repo
status: published
---

## intro
Game-theory DP solves two-player, zero-sum, perfect-information games where both players play optimally. The value of a position is computed from the values of positions reachable in one move: max for the player to move, min for the opponent. For impartial games (same moves available to both), Sprague-Grundy reduces every position to a single integer XOR-combinable across independent sub-games.

## whyItMatters
"Who wins if both play perfectly" is the canonical interview formulation: stone games, coin rows, divisor games, Nim variants. Beyond puzzles, minimax with alpha-beta pruning is the engine behind chess and Go (before neural nets), and Grundy numbers underpin every theoretical analysis of combinatorial games. Knowing the recurrence and the pruning trick is a competitive-programming staple.

## intuition
At a node where it's your turn, you pick the child move that maximises your eventual score. The opponent at the next ply does the opposite. So value(node) = max(value(child)) on your turn, min(value(child)) on theirs. Alpha-beta tracks the best already-guaranteed score for max (alpha) and min (beta); if a branch can never improve on the current bound, prune it without exploring. For partisan-symmetric games like Nim, the position has a single Grundy number g; player to move wins iff XOR of pile Grundy numbers is non-zero.

## visualization
Coin row [1, 5, 233, 7]: each player takes from either end. Build the table dp[i][j] = max points the current player can collect from coins[i..j] assuming optimal play. Base: dp[i][i] = coins[i]. Recurrence: dp[i][j] = max(coins[i] - dp[i+1][j], coins[j] - dp[i][j-1]) (the subtraction encodes "opponent then plays optimally"). For Nim with piles (3, 4, 5): grundy = 3 XOR 4 XOR 5 = 2 != 0 — first player wins.

## bruteForce
Recurse on the game tree, evaluating every leaf. Branching factor b, depth d gives O(b^d) — exponential. Fine for shallow toy games (tic-tac-toe 9!) but explodes on chess (b around 35, d around 80) without aggressive pruning.

## optimal
Two complementary techniques:

1. **Memoised minimax DP.** Hash the position to an integer key, store evaluated values in a table. State count is the limit, not depth.
2. **Alpha-beta on game trees.** Maintain alpha (max's best so far) and beta (min's best so far). Prune any branch where the running value crosses the bound — at best halves the explored tree to O(b^(d/2)).
3. **Sprague-Grundy for impartial games.** Each independent sub-game has a Grundy number g(pos) = mex of g over reachable positions. XOR them; non-zero means the player to move wins, zero means they lose.

## complexity
time: O(states) for memoised DP; O(b^d) worst-case, O(b^(d/2)) with perfect alpha-beta ordering; O(maxPile) for Nim Grundy precompute.
space: O(states) memo table, O(d) recursion stack.
notes: Move-ordering heuristics (try capturing moves first) make alpha-beta close to its best case in practice.

## pitfalls
- Forgetting that minimax assumes both players are optimal — applying it when the opponent is adversarial-but-bounded gives wrong values; use expectimax instead.
- Storing the wrong perspective: dp[state] is always "from the player to move's point of view," and the recurrence flips signs accordingly.
- Misimplementing mex (minimum excludant) — it's the smallest non-negative integer not in the set, not the minimum of the set.
- Treating XOR of pile sizes as Grundy for non-Nim games — only valid when each pile is itself a Nim pile (one move removes any positive number from one pile).

## interviewTips
- For "stone game" problems, always set up dp[i][j] = best score current player can achieve from sub-array [i, j].
- Mention alpha-beta when the interviewer asks about scaling minimax to larger games.
- For impartial games, mention Sprague-Grundy and that the XOR trick collapses independent components into a single equivalent Nim pile.
- Be ready to draw a 3-node game tree and walk through the alpha/beta updates by hand.

## code.python
```python
def stone_game(coins):
    n = len(coins)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = coins[i]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = max(coins[i] - dp[i + 1][j], coins[j] - dp[i][j - 1])
    return dp[0][n - 1] > 0

def alpha_beta(state, depth, alpha, beta, maximising, moves, evaluate):
    if depth == 0 or not moves(state):
        return evaluate(state)
    if maximising:
        value = -10**9
        for nxt in moves(state):
            value = max(value, alpha_beta(nxt, depth - 1, alpha, beta, False, moves, evaluate))
            alpha = max(alpha, value)
            if alpha >= beta:
                break
        return value
    value = 10**9
    for nxt in moves(state):
        value = min(value, alpha_beta(nxt, depth - 1, alpha, beta, True, moves, evaluate))
        beta = min(beta, value)
        if alpha >= beta:
            break
    return value

def nim_winner(piles):
    x = 0
    for p in piles:
        x ^= p
    return "first" if x else "second"
```

## code.javascript
```javascript
function stoneGame(coins) {
  const n = coins.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = coins[i];
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1;
      dp[i][j] = Math.max(coins[i] - dp[i + 1][j], coins[j] - dp[i][j - 1]);
    }
  }
  return dp[0][n - 1] > 0;
}

function nimWinner(piles) {
  let x = 0;
  for (const p of piles) x ^= p;
  return x !== 0 ? "first" : "second";
}
```

## code.java
```java
public boolean stoneGame(int[] coins) {
    int n = coins.length;
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = coins[i];
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = Math.max(coins[i] - dp[i + 1][j], coins[j] - dp[i][j - 1]);
        }
    }
    return dp[0][n - 1] > 0;
}

public String nimWinner(int[] piles) {
    int x = 0;
    for (int p : piles) x ^= p;
    return x != 0 ? "first" : "second";
}
```

## code.cpp
```cpp
bool stoneGame(vector<int>& coins) {
    int n = coins.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int i = 0; i < n; i++) dp[i][i] = coins[i];
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = max(coins[i] - dp[i + 1][j], coins[j] - dp[i][j - 1]);
        }
    }
    return dp[0][n - 1] > 0;
}

string nimWinner(vector<int>& piles) {
    int x = 0;
    for (int p : piles) x ^= p;
    return x != 0 ? "first" : "second";
}
```
