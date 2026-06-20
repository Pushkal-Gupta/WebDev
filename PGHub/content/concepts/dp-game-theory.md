---
slug: dp-game-theory
module: dp-advanced
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
- Stockfish, Komodo, and pre-neural Houdini chess engines run minimax with alpha-beta pruning as their core search; AlphaZero and Lc0 wrap neural-net value estimates around the same skeleton.
- AlphaGo (DeepMind), and now its successors KataGo and Leela Zero, use minimax tree search at inference time with policy/value networks pruning the branching factor.
- Competitive programming Olympiads (Codeforces, AtCoder) use Sprague-Grundy theorem for Nim-variant problems where the XOR of pile Grundy numbers determines the winner — every serious competitor knows this trick.
- Game-theoretic DPs power coin-row games, divisor games, partizan combinatorial games, and the entire analysis framework Conway built for Surreal Numbers.
- "Who wins under optimal play?" is the canonical interview formulation across stone games, coin rows, and Nim variants — knowing both minimax DP and Grundy numbers is a competitive-programming staple.

## intuition
Two-player zero-sum games with perfect information have a recursive structure: the value of a position is fully determined by the values of positions reachable in one move. At a node where you (the maximizing player) are to move, you pick the child that maximizes your value; at a node where the opponent (minimizing) is to move, they pick the child that minimizes your value. This is the minimax recurrence: `value(node) = max(value(child))` on your turn, `min(value(child))` on theirs. The base case is terminal positions (game over) where the value is the final score. For finite games, this recurrence terminates and gives the game-theoretic value. The challenge is that the game tree has branching factor b and depth d, giving O(b^d) raw search — chess has b around 35 and d around 80, hopelessly large. Alpha-beta pruning exploits a structural fact: if a branch's running value already crosses what the opponent would allow at a higher level, exploring further is wasted because the opponent will steer away from this branch entirely. Tracking alpha (max's best guaranteed score so far) and beta (min's best guaranteed score so far) and pruning when `alpha >= beta` can shave the explored tree to O(b^(d/2)) under perfect move ordering — quadratic speedup. For impartial games (same moves available to both players, like Nim), Sprague-Grundy theorem reduces every position to a single integer "Grundy number" g(pos) defined as the mex (minimum excludant) of g over reachable positions. Independent subgames combine by XOR: the overall game is a loss for the player-to-move iff the XOR of Grundy numbers is zero. The deep insight is that game theory's recursive value is a generalization of minimax DP, and Grundy numbers collapse impartial games to a single integer that XOR-composes — a remarkable algebraic structure on top of recursive search.

## visualization
Coin row [1, 5, 233, 7]: each player takes from either end. Build the table dp[i][j] = max points the current player can collect from coins[i..j] assuming optimal play. Base: dp[i][i] = coins[i]. Recurrence: dp[i][j] = max(coins[i] - dp[i+1][j], coins[j] - dp[i][j-1]) (the subtraction encodes "opponent then plays optimally"). For Nim with piles (3, 4, 5): grundy = 3 XOR 4 XOR 5 = 2 != 0 — first player wins.

## bruteForce
Recurse on the game tree, evaluating every leaf. Branching factor b, depth d gives O(b^d) — exponential. Fine for shallow toy games (tic-tac-toe 9!) but explodes on chess (b around 35, d around 80) without aggressive pruning.

## optimal
Three complementary techniques covering the spectrum of game-theory DP problems. (1) Memoized minimax DP for small finite-state games: hash the position to an integer key and store evaluated values in a table — the state count, not the depth, is the cost. (2) Alpha-beta pruning for large game trees: maintain alpha (max's best guaranteed score so far) and beta (min's best so far); prune when `alpha >= beta`, shaving search to O(b^(d/2)) under good move ordering. (3) Sprague-Grundy theorem for impartial games: compute Grundy numbers `g(pos) = mex of g over reachable positions` and XOR independent subgames — non-zero XOR means the player to move wins.

```python
def alpha_beta(state, depth, alpha, beta, maximizing, moves, evaluate):
    """Alpha-beta search returning the value from the maximizer's perspective."""
    if depth == 0 or not moves(state):
        return evaluate(state)
    if maximizing:
        value = -10**9
        for nxt in moves(state):
            value = max(value, alpha_beta(nxt, depth - 1, alpha, beta, False, moves, evaluate))
            alpha = max(alpha, value)
            if alpha >= beta:           # prune: opponent will steer away
                break
        return value
    else:
        value = 10**9
        for nxt in moves(state):
            value = min(value, alpha_beta(nxt, depth - 1, alpha, beta, True, moves, evaluate))
            beta = min(beta, value)
            if alpha >= beta:
                break
        return value

def nim_winner(piles):
    """Sprague-Grundy XOR: first player wins iff XOR is non-zero."""
    x = 0
    for p in piles:
        x ^= p
    return "first" if x else "second"
```

The `alpha >= beta` prune is the load-bearing speedup — it skips entire subtrees that the opponent would never let happen. Move-ordering heuristics (try captures first, killer moves first) bring alpha-beta close to its O(b^(d/2)) best-case bound in practice. The Nim XOR trick is breathtakingly compact: Sprague-Grundy guarantees that any impartial game is equivalent to a Nim pile of size equal to its Grundy number, and XOR-composing independent subgames falls out of the theorem.

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
