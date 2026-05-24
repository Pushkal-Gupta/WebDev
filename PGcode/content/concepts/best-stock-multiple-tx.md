---
slug: best-stock-multiple-tx
module: dp
title: Best Time to Buy and Sell Stock with K Transactions
subtitle: Generalize the buy/sell DP to at most k completed trades — state machine on (day, txs, holding).
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.1/"
    type: book
  - title: "Maximum profit by buying and selling a share at most k times — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/maximum-profit-by-buying-and-selling-a-share-at-most-k-times/"
    type: blog
  - title: "TheAlgorithms/Python — knapsack.py (DP patterns)"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/knapsack.py"
    type: repo
status: published
---

## intro
Given daily prices and a limit of `k` complete buy-then-sell transactions, find the maximum profit. The unlimited variant is a one-liner — sum every positive day-to-day delta — but capping the number of round trips forces a real DP because the algorithm must decide *which* runs of profit to keep.

## whyItMatters
This problem unifies the entire "Best Time to Buy/Sell Stock" family. With one parameter swap you recover the cases k=1 (single trade), k=2 (LeetCode III), k=∞ (greedy delta sum), and k with cooldown or fees. Mastering the (day, transactions-left, holding) state lets you write any of them from scratch in five minutes.

## intuition
At every day you face three choices: do nothing, buy if you don't already hold a share, or sell if you do. Each completed sell consumes one of your k transaction slots. The state that fully captures progress is therefore the triple `(i, j, h)` — day index, transactions used (or remaining), and a 0/1 flag for whether you currently hold stock. The DP is just enumerating those choices over each state.

## visualization
Imagine a grid of `k+1` rows and `n` columns, with two layers (held / not held). Each cell looks at yesterday's same row (do nothing) and yesterday's adjacent row (buy or sell). Filling the grid top-down, left-to-right, the answer falls out of `dp[k][n-1][0]`. With prices `[3,2,6,5,0,3]` and k=2 the optimal picks (2 to 6) and (0 to 3) for profit 7 — the grid traces both trades.

## bruteForce
Enumerate every subset of up to `k` non-overlapping (buy-day, sell-day) intervals and take the best total. There are O(n^{2k}) such subsets — exponential. Even backtracking with pruning collapses past k=3 or n=30. Useful only as a correctness oracle on tiny inputs.

## optimal
Two layouts both work. The textbook 3D DP defines `dp[i][j][h]` and runs in O(n·k) time with O(n·k) memory; collapsing the day dimension brings memory to O(k). The cleaner formulation uses two arrays of length k+1: `buy[j]` = best profit after j-th buy, `sell[j]` = best profit after j-th sell. The recurrences `buy[j] = max(buy[j], sell[j-1] - price)` and `sell[j] = max(sell[j], buy[j] + price)` update both in a single pass. Special case: when `k >= n/2`, no cap is binding — fall back to the greedy positive-delta sum.

## complexity
time: O(n·k)
space: O(k)
notes: When k ≥ n/2 the cap is irrelevant — switch to the O(n) greedy sum of positive deltas to avoid wasted work and integer overflow on pathological inputs.

## pitfalls
- Forgetting the k ≥ n/2 shortcut — algorithms TLE on large k otherwise.
- Initialising `buy[j]` to 0 instead of `-infinity` — lets the DP "sell" without ever buying.
- Updating `sell[j]` before `buy[j]` within the same iteration — order matters when collapsing dimensions.
- Counting buy *and* sell as separate transactions — the problem usually defines one transaction as a complete buy-then-sell pair.

## interviewTips
- Open by sketching the state: "day, transactions used, holding flag — three dimensions." Interviewers love seeing the state space defined before any code.
- Mention the k=∞ greedy shortcut even if the prompt doesn't ask — shows you recognise the family.
- Walk through a 4-day example by hand to derive the recurrence; don't recite it.
- If asked about cooldown or fees, point out which cell the change lands in — it's a one-line patch.

## code.python
```python
def max_profit(k, prices):
    n = len(prices)
    if n < 2 or k == 0:
        return 0
    if k >= n // 2:
        return sum(max(0, prices[i] - prices[i-1]) for i in range(1, n))
    buy = [float('-inf')] * (k + 1)
    sell = [0] * (k + 1)
    for price in prices:
        for j in range(1, k + 1):
            buy[j] = max(buy[j], sell[j-1] - price)
            sell[j] = max(sell[j], buy[j] + price)
    return sell[k]
```

## code.javascript
```javascript
function maxProfit(k, prices) {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;
  if (k >= n >> 1) {
    let s = 0;
    for (let i = 1; i < n; i++) s += Math.max(0, prices[i] - prices[i-1]);
    return s;
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  for (const price of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j-1] - price);
      sell[j] = Math.max(sell[j], buy[j] + price);
    }
  }
  return sell[k];
}
```

## code.java
```java
public int maxProfit(int k, int[] prices) {
    int n = prices.length;
    if (n < 2 || k == 0) return 0;
    if (k >= n / 2) {
        int s = 0;
        for (int i = 1; i < n; i++) s += Math.max(0, prices[i] - prices[i-1]);
        return s;
    }
    int[] buy = new int[k + 1];
    int[] sell = new int[k + 1];
    java.util.Arrays.fill(buy, Integer.MIN_VALUE);
    for (int price : prices) {
        for (int j = 1; j <= k; j++) {
            buy[j] = Math.max(buy[j], sell[j-1] - price);
            sell[j] = Math.max(sell[j], buy[j] + price);
        }
    }
    return sell[k];
}
```

## code.cpp
```cpp
int maxProfit(int k, vector<int>& prices) {
    int n = prices.size();
    if (n < 2 || k == 0) return 0;
    if (k >= n / 2) {
        int s = 0;
        for (int i = 1; i < n; i++) s += max(0, prices[i] - prices[i-1]);
        return s;
    }
    vector<int> buy(k + 1, INT_MIN), sell(k + 1, 0);
    for (int price : prices) {
        for (int j = 1; j <= k; j++) {
            buy[j] = max(buy[j], sell[j-1] - price);
            sell[j] = max(sell[j], buy[j] + price);
        }
    }
    return sell[k];
}
```
