---
slug: coin-change-variants
module: dp
title: Coin Change Variants
subtitle: Minimum coins, count of ways, and bounded vs unbounded denominations — one DP family, three answers.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.1/"
    type: book
  - title: "Coin Change DP — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/coin-change-dp-7/"
    type: blog
  - title: "TheAlgorithms/Python — minimum_coin_change.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/minimum_coin_change.py"
    type: repo
status: published
---

## intro
Given coin denominations and a target amount, three closely related questions follow. (1) What is the minimum number of coins that sum to the target? (2) How many distinct combinations sum to it? (3) What if each coin has limited supply? All three are solved with one-dimensional DP arrays — the only differences are which loop is outer, whether we minimize or sum, and how repeated use is allowed.

## whyItMatters
Coin change is the textbook entry point to unbounded-knapsack-style DP and underpins currency exchange, vending machines, ration optimization, and any "make a target sum from item buckets" problem. Recruiters use it to test loop-ordering instincts: swapping the two loops between the count-ways and min-coins variants quietly produces wrong answers, and a strong candidate explains why without prompting.

## intuition
Define dp[a] = best answer for amount a. For the minimum-coins variant, dp[a] = 1 + min over coins c <= a of dp[a-c], with dp[0]=0 and dp[a]=infinity otherwise. For count-ways with unlimited supply, dp[0]=1 and for each coin (outer loop) we update dp[a] += dp[a-c] for a from c to target. Putting the coin loop outside guarantees we count each combination once, not as a permutation.

## visualization
coins=[1,2,5], target=11. dp starts [0,inf,inf,...]. After processing all amounts: dp[1]=1, dp[2]=1, dp[3]=2, dp[4]=2, dp[5]=1, dp[6]=2, dp[7]=2, dp[8]=3, dp[9]=3, dp[10]=2, dp[11]=3 (5+5+1). Count-ways for target=5 with the same coins: dp evolves [1,1,1,1,1,1] after coin 1, [1,1,2,2,3,3] after coin 2, [1,1,2,2,3,4] after coin 5. Answer 4: 5; 2+2+1; 2+1+1+1; 1*5.

## bruteForce
Recursive backtracking: at each call, try every coin, subtract, recurse, take the min (or sum). Without memoization the call tree is exponential — branching factor equals coin count. Memoizing on the remaining amount alone collapses it to O(amount * coins) calls. For the count-ways variant, naïve recursion overcounts permutations unless an extra "smallest coin allowed" parameter is threaded through.

## optimal
Single 1D DP of size target+1.
- Min coins (unbounded): outer loop over a in 1..target, inner over coins; dp[a] = min(dp[a], dp[a-c]+1).
- Count ways (unbounded): outer loop over coins, inner over a from c to target; dp[a] += dp[a-c].
- Bounded supply: per coin with supply k, iterate amounts descending and apply the 0/1 knapsack relation k times — or use a sliding-window decomposition by binary chunks (1, 2, 4, ..., remaining) to bring per-coin cost to O(amount * log k).

## complexity
time: O(amount * #coins) for unbounded variants; O(amount * sum_of_supplies) or O(amount * #coins * log max_supply) for bounded
space: O(amount)
notes: Min-coins is solvable greedily only for "canonical" coin systems like US currency; for arbitrary coins (e.g., {1, 3, 4} on amount 6), greedy gives 3 (4+1+1) while DP gives 2 (3+3).

## pitfalls
- Swapping the two loops in count-ways turns combinations into permutations (off by a large factor).
- Initializing dp with 0 instead of infinity for min-coins makes every amount look reachable.
- Using greedy on non-canonical coin sets — fails silently on edge inputs.
- For bounded supply, iterating amount ascending repeats a coin within one pass — only descending order respects the per-coin cap.

## interviewTips
- Always ask "is supply limited?" before coding — the answer changes the loop direction.
- State the canonical-coin caveat for the greedy temptation: "Greedy works for US coins but not in general."
- Mention the change-making-with-amount-not-reachable case — return -1 or a flag, not infinity.

## code.python
```python
def min_coins(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] > amount else dp[amount]

def count_ways(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]

def min_coins_bounded(coins, supply, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for c, k in zip(coins, supply):
        for _ in range(k):
            for a in range(amount, c - 1, -1):
                if dp[a - c] + 1 < dp[a]:
                    dp[a] = dp[a - c] + 1
    return -1 if dp[amount] > amount else dp[amount]
```

## code.javascript
```javascript
function minCoins(coins, amount) {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    }
  }
  return dp[amount] > amount ? -1 : dp[amount];
}

function countWays(coins, amount) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) dp[a] += dp[a - c];
  }
  return dp[amount];
}
```

## code.java
```java
public int minCoins(int[] coins, int amount) {
    int INF = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

public int countWays(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    dp[0] = 1;
    for (int c : coins) {
        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
    }
    return dp[amount];
}
```

## code.cpp
```cpp
int minCoins(vector<int>& coins, int amount) {
    int INF = amount + 1;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

long long countWays(vector<int>& coins, int amount) {
    vector<long long> dp(amount + 1, 0);
    dp[0] = 1;
    for (int c : coins) {
        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
    }
    return dp[amount];
}
```
