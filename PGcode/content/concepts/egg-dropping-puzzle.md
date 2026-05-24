---
slug: egg-dropping-puzzle
module: dp
title: Egg Dropping Puzzle
subtitle: Find the minimum worst-case trials to identify the critical floor with k eggs and n floors.
difficulty: Advanced
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.3/"
    type: book
  - title: "Egg Dropping Puzzle — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/egg-dropping-puzzle-dp-11/"
    type: blog
  - title: "TheAlgorithms/Python — egg_dropping_puzzle.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/minimum_squares_to_represent_a_number.py"
    type: repo
status: published
---

## intro
You have k identical eggs and an n-story building. An egg dropped from a floor above the "critical" one breaks; from the critical floor or below, it survives. Find the strategy that minimizes the worst-case number of trials needed to identify the critical floor. The straightforward DP costs O(k * n^2); flipping the recurrence costs O(k * log n) and is the answer a strong candidate gives.

## whyItMatters
The puzzle is a microcosm of decision-tree problems with limited bandwidth: each drop is a probe, eggs are budget, floors are search space. The same reformulation — "given m moves and k eggs, what's the largest floor count we can cover?" — appears in adaptive A/B test design, information-theoretic guessing games, and fault-tolerant binary search where probe failures are expensive.

## intuition
With unlimited eggs, binary search gives ceil(log2(n+1)) trials. With exactly one egg, you must scan from the bottom — n trials worst case. For k between 1 and log n, the answer is somewhere in between. The key reformulation: let f(m, k) be the maximum floors solvable in m drops with k eggs. Then f(m, k) = f(m-1, k-1) + f(m-1, k) + 1: the new drop either breaks (cover f(m-1, k-1) floors below) or survives (cover f(m-1, k) floors above), plus the current floor. Find the smallest m with f(m, k) >= n.

## visualization
k=2, n=10. m=1: 1 floor. m=2: f(2,2) = f(1,1)+f(1,2)+1 = 1+1+1 = 3 floors. m=3: f(3,2) = f(2,1)+f(2,2)+1 = 2+3+1 = 6. m=4: f(4,2) = f(3,1)+f(3,2)+1 = 3+6+1 = 10. So 4 trials suffice for 10 floors with 2 eggs. The classic answer matches: drop egg 1 from floor 4. If it breaks, scan floors 1, 2, 3 with the second egg (max 4 total). If it survives, drop from floor 7. Continue this geometric step pattern.

## bruteForce
Standard DP: dp[k][n] = 1 + min over x in 1..n of max(dp[k-1][x-1], dp[k][n-x]). The outer min searches every floor x. O(k * n^2) time, O(k * n) memory. For k = 2 and n = 200, this is 80,000 ops — fine. For n in the millions, the quadratic factor explodes and you must reformulate.

## optimal
Flip the question: instead of "min trials for n floors and k eggs," compute "max floors for m trials and k eggs" via f(m, k) = f(m-1, k-1) + f(m-1, k) + 1, f(0, k) = 0, f(m, 0) = 0. Increment m starting from 1 until f(m, k) >= n. Each step is O(k), and m never exceeds ceil(log2(n+1)) because that's the upper bound when eggs are plentiful. Total work: O(k * log n).

## complexity
time: O(k * log n) with the reformulation; O(k * n^2) for the naïve DP, optimizable to O(k * n * log n) with knuth-style binary search of the min
space: O(k) — only the previous m's row is needed
notes: The closed-form connection to Pascal's triangle: f(m, k) = sum_{i=1..k} C(m, i). So you can also answer by computing partial binomial sums and binary-searching m.

## pitfalls
- Treating "min trials" as "average trials" — the puzzle is worst-case minimax; randomization does not help.
- Confusing the two DP directions — "min trials for n" vs "max floors for m" — getting the recurrence shape backwards.
- Using floating-point in the binomial-sum approach for large m — overflow and precision both bite; use integer arithmetic with early termination.
- Off-by-one when interpreting "critical floor" — many sources define it as the highest safe floor; some as the lowest breaking floor. Clarify with the interviewer.

## interviewTips
- Open with the simple recurrence, then say "this is O(k * n^2); the better recurrence inverts the question and runs in O(k log n)."
- Be ready to walk through k=2, n=100 by hand — the answer is 14 trials. Recruiters love that example.
- Mention the connection to information theory: each drop is one bit of info; with k eggs you can extract more than one bit per drop because the outcome space narrows.

## code.python
```python
def super_egg_drop(k, n):
    dp = [0] * (k + 1)
    m = 0
    while dp[k] < n:
        m += 1
        for j in range(k, 0, -1):
            dp[j] = dp[j - 1] + dp[j] + 1
    return m
```

## code.javascript
```javascript
function superEggDrop(k, n) {
  const dp = new Array(k + 1).fill(0);
  let m = 0;
  while (dp[k] < n) {
    m++;
    for (let j = k; j >= 1; j--) {
      dp[j] = dp[j - 1] + dp[j] + 1;
    }
  }
  return m;
}
```

## code.java
```java
public int superEggDrop(int k, int n) {
    int[] dp = new int[k + 1];
    int m = 0;
    while (dp[k] < n) {
        m++;
        for (int j = k; j >= 1; j--) {
            dp[j] = dp[j - 1] + dp[j] + 1;
        }
    }
    return m;
}
```

## code.cpp
```cpp
int superEggDrop(int k, int n) {
    vector<int> dp(k + 1, 0);
    int m = 0;
    while (dp[k] < n) {
        m++;
        for (int j = k; j >= 1; j--) {
            dp[j] = dp[j - 1] + dp[j] + 1;
        }
    }
    return m;
}
```
