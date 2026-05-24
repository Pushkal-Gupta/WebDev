---
slug: dp-interval-mcm
module: dp
title: Matrix Chain Multiplication
subtitle: Classic interval DP — find the cheapest parenthesization of A_1 · A_2 · ... · A_n in O(n^3).
difficulty: Advanced
position: 1
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Matrix Chain Multiplication — CLRS Solutions (Chapter 15)"
    url: "https://walkccc.me/CLRS/Chap15/15.2/"
    type: book
  - title: "Matrix Chain Multiplication DP-8 — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/matrix-chain-multiplication-dp-8/"
    type: blog
  - title: "TheAlgorithms/Python — matrix_chain_order.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/matrix_chain_multiplication.py"
    type: repo
status: published
---

## intro
Matrix multiplication is associative but not commutative, so (A · B) · C and A · (B · C) compute the same result with potentially very different costs. Matrix Chain Multiplication (MCM) finds the parenthesization that minimizes the total number of scalar multiplications for a chain A_1 · A_2 · ... · A_n. It's the textbook interval DP and the gateway problem for the entire family.

## whyItMatters
MCM is the canonical introduction to interval DP — the trick of fixing the *last* operation (the outermost split) and recursing on the two intervals it creates. Once internalized, the same template solves polygon triangulation, optimal BST construction, palindrome partitioning min-cuts, balloon bursting, evaluating expression trees, and many "merge stones" variants. Mastering MCM means mastering all of them.

## intuition
Any parenthesization of A_i · ... · A_j ultimately performs one "outermost" multiplication that combines two subproducts (A_i · ... · A_k) and (A_{k+1} · ... · A_j). If we know the optimal cost of each side, the total cost for this split is `cost[i][k] + cost[k+1][j] + p[i-1] * p[k] * p[j]`, where p[] are the chain dimensions. Try every k in [i, j-1], take the minimum, and store. We're searching over the position of the last cut — the defining move of interval DP.

## visualization
Dimensions p = [30, 35, 15, 5, 10, 20, 25] (six matrices of sizes 30x35, 35x15, 15x5, 5x10, 10x20, 20x25). cost[i][i] = 0 for all i. Build up by interval length. Length 2: cost[1][2] = 30*35*15 = 15750, cost[2][3] = 35*15*5 = 2625, etc. Length 3: cost[1][3] = min over k=1,2 of cost[1][k] + cost[k+1][3] + p[0]*p[k]*p[3]. Continue until cost[1][6]. The classic CLRS table gives 15125 as the optimal cost with parenthesization ((A_1 (A_2 A_3)) ((A_4 A_5) A_6)).

## bruteForce
Enumerate every binary parenthesization — these are the Catalan-counted binary trees over n leaves, count C(n-1) = (2n-2)! / ((n-1)! n!) which is Θ(4^n / n^1.5). For n = 20 you'd evaluate over a billion trees; for n = 30 it's hopeless. The recursive structure of the brute-force search has massive overlapping subproblems — exactly what DP eliminates with O(n^2) states.

## optimal
Let dp[i][j] be the minimum cost to multiply A_i through A_j. Base: dp[i][i] = 0. Transition: dp[i][j] = min over k in [i, j-1] of dp[i][k] + dp[k+1][j] + p[i-1] * p[k] * p[j]. Iterate by interval length ell from 2 to n, and for each length over starting index i. Track choice[i][j] = the k that achieved the min so you can reconstruct the parenthesization. Final answer is dp[1][n]. O(n^2) states, O(n) transitions each — O(n^3) total.

## complexity
time: O(n^3)
space: O(n^2) for dp table and choice table
notes: Hu and Shing (1984) solved MCM in O(n log n) using a clever polygon-triangulation reduction, but it's purely of theoretical interest — interviewers expect the O(n^3) DP. Knuth's optimization (the monotone-quadrangle inequality) reduces certain interval DPs to O(n^2), but MCM in general does not satisfy the inequality required.

## pitfalls
- 0- vs 1-indexed dimensions — p has length n+1 for n matrices. Be explicit: matrix i has shape p[i-1] x p[i]. Off-by-one here is the single most common bug.
- Iterating by (i, j) instead of by interval length — you'll read dp[i][k] and dp[k+1][j] before they're computed and get garbage.
- Returning dp[1][n-1] instead of dp[1][n] — pick a convention (0-indexed [0, n-1] or 1-indexed [1, n]) and use it consistently.
- Forgetting that dp[i][i] = 0 — a single matrix needs no multiplications.
- Treating the problem as commutative — swapping operand order changes shapes, not just cost. MCM only swaps grouping, never order.

## interviewTips
- Frame it as "interval DP fixing the last operation" — that template generalizes to many follow-ups.
- Reconstruct the parenthesization from choice[i][j] — interviewers often ask "show me the actual grouping," not just the cost.
- If asked about applications, name optimal BST construction and polygon triangulation — both use the identical template with different cost functions.

## code.python
```python
def matrix_chain_order(p):
    n = len(p) - 1
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    choice = [[0] * (n + 1) for _ in range(n + 1)]
    for ell in range(2, n + 1):
        for i in range(1, n - ell + 2):
            j = i + ell - 1
            dp[i][j] = float('inf')
            for k in range(i, j):
                cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j]
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    choice[i][j] = k
    return dp[1][n], choice

def reconstruct(choice, i, j):
    if i == j: return f"A{i}"
    k = choice[i][j]
    return f"({reconstruct(choice, i, k)} {reconstruct(choice, k + 1, j)})"
```

## code.javascript
```javascript
function matrixChainOrder(p) {
  const n = p.length - 1;
  const dp = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  const choice = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let ell = 2; ell <= n; ell++) {
    for (let i = 1; i <= n - ell + 1; i++) {
      const j = i + ell - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
        if (cost < dp[i][j]) { dp[i][j] = cost; choice[i][j] = k; }
      }
    }
  }
  return { cost: dp[1][n], choice };
}

function reconstruct(choice, i, j) {
  if (i === j) return `A${i}`;
  const k = choice[i][j];
  return `(${reconstruct(choice, i, k)} ${reconstruct(choice, k + 1, j)})`;
}
```

## code.java
```java
class MatrixChain {
    int[][] choice;

    long matrixChainOrder(int[] p) {
        int n = p.length - 1;
        long[][] dp = new long[n + 1][n + 1];
        choice = new int[n + 1][n + 1];
        for (int ell = 2; ell <= n; ell++) {
            for (int i = 1; i <= n - ell + 1; i++) {
                int j = i + ell - 1;
                dp[i][j] = Long.MAX_VALUE;
                for (int k = i; k < j; k++) {
                    long cost = dp[i][k] + dp[k + 1][j] + (long) p[i - 1] * p[k] * p[j];
                    if (cost < dp[i][j]) { dp[i][j] = cost; choice[i][j] = k; }
                }
            }
        }
        return dp[1][n];
    }

    String reconstruct(int i, int j) {
        if (i == j) return "A" + i;
        int k = choice[i][j];
        return "(" + reconstruct(i, k) + " " + reconstruct(k + 1, j) + ")";
    }
}
```

## code.cpp
```cpp
struct MatrixChain {
    vector<vector<int>> choice;

    long long matrixChainOrder(const vector<int>& p) {
        int n = (int)p.size() - 1;
        vector<vector<long long>> dp(n + 1, vector<long long>(n + 1, 0));
        choice.assign(n + 1, vector<int>(n + 1, 0));
        for (int ell = 2; ell <= n; ell++) {
            for (int i = 1; i <= n - ell + 1; i++) {
                int j = i + ell - 1;
                dp[i][j] = LLONG_MAX;
                for (int k = i; k < j; k++) {
                    long long cost = dp[i][k] + dp[k + 1][j] + (long long)p[i - 1] * p[k] * p[j];
                    if (cost < dp[i][j]) { dp[i][j] = cost; choice[i][j] = k; }
                }
            }
        }
        return dp[1][n];
    }

    string reconstruct(int i, int j) {
        if (i == j) return "A" + to_string(i);
        int k = choice[i][j];
        return "(" + reconstruct(i, k) + " " + reconstruct(k + 1, j) + ")";
    }
};
```
