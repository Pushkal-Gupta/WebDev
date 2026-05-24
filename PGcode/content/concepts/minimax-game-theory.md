---
slug: minimax-game-theory
module: recursion-bt
title: Minimax + Alpha-Beta Pruning
subtitle: Pick the optimal move in a two-player zero-sum game by recursively assuming the opponent plays optimally too.
difficulty: Advanced
position: 15
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
Minimax is the algorithm behind every classical perfect-information game AI: chess, tic-tac-toe, checkers, Nim, Connect Four. The premise: one player **maximizes** a position score, the other **minimizes** it. To pick your move, simulate forward — assuming both players play optimally — and choose the move that maximizes your score against the opponent's best reply. Alpha-beta pruning cuts the search space by skipping branches that can't possibly change the outcome.

## whyItMatters
Comes up directly in interview problems framed as "two players take turns doing X — who wins if both play optimally?" (Stone Game, Predict the Winner, Nim Game, Coins-in-Line). Beyond interviews, it's how chess engines worked from Deep Blue through ~2017, and is still part of the AlphaGo / AlphaZero stack (combined with MCTS + neural value networks). Knowing it deeply puts you in a much stronger position to discuss search trees, evaluation, and pruning in any senior interview.

## intuition
Build a game tree. Leaves are terminal positions with known scores. Internal nodes alternate between "max" (your move — pick child with highest score) and "min" (opponent's move — pick child with lowest score). The score of the root is what perfect play gives you. Pure minimax explores everything; alpha-beta pruning carries the best-so-far bounds (`α` for max, `β` for min) and skips subtrees that can't improve on them.

## visualization
```
       max
      /   \
    3       min
           /   \
          min   2
         /   \
        9     5
         \   /
          ⊥
Outer max picks max(3, min subtree) = max(3, min(min(9,5), 2)) = max(3, min(5, 2)) = max(3, 2) = 3
```

## bruteForce
Pure minimax explores every leaf — O(b^d) for branching factor b and depth d. For chess (b ≈ 35, d = 80) that's astronomical.

## optimal
**Minimax** (recursive):
```
minimax(state, depth, is_max):
    if terminal(state) or depth == 0:
        return evaluate(state)
    if is_max:
        best = -infinity
        for move in moves(state):
            best = max(best, minimax(apply(state, move), depth - 1, False))
        return best
    else:
        best = +infinity
        for move in moves(state):
            best = min(best, minimax(apply(state, move), depth - 1, True))
        return best
```

**Alpha-beta pruning** adds two bounds:
- `α` = best score the maximizing player can guarantee so far
- `β` = best score the minimizing player can guarantee so far

If `β ≤ α` at any internal node, the rest of its children won't change the outcome — prune.

```
alphabeta(state, depth, α, β, is_max):
    if terminal(state) or depth == 0: return evaluate(state)
    if is_max:
        v = -inf
        for move in moves(state):
            v = max(v, alphabeta(apply(state, move), depth - 1, α, β, False))
            α = max(α, v)
            if β <= α: break          # β-cutoff
        return v
    else:
        v = +inf
        for move in moves(state):
            v = min(v, alphabeta(apply(state, move), depth - 1, α, β, True))
            β = min(β, v)
            if β <= α: break          # α-cutoff
        return v
```

With good move ordering, alpha-beta cuts the effective branching factor to √b — same depth in sqrt the time. Combined with **memoization** on the state (often called a transposition table) for games with overlapping subtrees, you can go very deep.

## complexity
- **Pure minimax**: O(b^d) time, O(d) recursion depth.
- **Alpha-beta with ideal move ordering**: O(b^(d/2)) — equivalently search depth 2× deeper for the same cost.
- **With memoization**: O(unique states), typically a huge win in turn-based games with reachable position dedup.

## pitfalls
- **Forgetting to flip the player on recursion**: returns garbage. Always toggle `is_max`.
- **Mis-defining the terminal score**: should be from the maximizer's POV throughout — positive = max wins.
- **Cutoff too aggressive without depth limit**: in real games you can't reach a leaf in reasonable time. Use a depth-limited search + heuristic evaluation.
- **Memoization key omits whose turn**: two identical boards with different sides-to-move have different scores. Include `is_max` in the cache key.
- **Confusing minimax with expectimax**: minimax assumes optimal opponent; expectimax averages over a random opponent's moves.

## interviewTips
- "Two-player optimal play" — that's a minimax setup. State the recursion in plain English before writing code.
- Mention **memoization** without prompting — many interview minimax problems collapse to O(n²) DP once you cache the state.
- For senior interviews, mention **alpha-beta pruning** and **iterative deepening**.
- For game-AI questions, compare with **MCTS** (Monte Carlo Tree Search) — what AlphaGo uses on top.

## code.python
```python
from functools import lru_cache

# Stone Game: 1-indexed pile, players alternate, take from either end.
# Maximizer wants to maximize their score - opponent's score; minimizer the opposite.
def stone_game(piles):
    @lru_cache(maxsize=None)
    def best(l, r):
        if l > r: return 0
        # Player picks one end; the result subtracts the next player's best.
        return max(piles[l] - best(l + 1, r),
                   piles[r] - best(l, r - 1))
    return best(0, len(piles) - 1) > 0

print(stone_game([5, 3, 4, 5]))  # True — first player wins
```

## code.javascript
```javascript
function stoneGame(piles) {
  const memo = new Map();
  function best(l, r) {
    if (l > r) return 0;
    const k = l * 100 + r;
    if (memo.has(k)) return memo.get(k);
    const v = Math.max(piles[l] - best(l + 1, r), piles[r] - best(l, r - 1));
    memo.set(k, v); return v;
  }
  return best(0, piles.length - 1) > 0;
}
```

## code.java
```java
class StoneGame {
    Integer[][] memo;
    public boolean stoneGame(int[] piles) {
        int n = piles.length;
        memo = new Integer[n][n];
        return best(piles, 0, n - 1) > 0;
    }
    int best(int[] p, int l, int r) {
        if (l > r) return 0;
        if (memo[l][r] != null) return memo[l][r];
        return memo[l][r] = Math.max(p[l] - best(p, l + 1, r), p[r] - best(p, l, r - 1));
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
class StoneGame {
    std::vector<std::vector<int>> memo;
    std::vector<int> piles;
    int best(int l, int r) {
        if (l > r) return 0;
        if (memo[l][r] != INT32_MIN) return memo[l][r];
        return memo[l][r] = std::max(piles[l] - best(l + 1, r), piles[r] - best(l, r - 1));
    }
public:
    bool stoneGame(std::vector<int>& p) {
        piles = p;
        int n = p.size();
        memo.assign(n, std::vector<int>(n, INT32_MIN));
        return best(0, n - 1) > 0;
    }
};
```
