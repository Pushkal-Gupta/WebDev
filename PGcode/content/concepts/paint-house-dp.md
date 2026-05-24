---
slug: paint-house-dp
module: dp
title: Paint House DP
subtitle: Paint N houses in 3 colors so no two adjacent houses share a color — minimum cost in O(N).
difficulty: Beginner
position: 2
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.3/"
    type: book
  - title: "Painting fence algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/painting-fence-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — minimum_cost_path.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/minimum_cost_path.py"
    type: repo
status: published
---

## intro
You are given an `n x 3` cost matrix where `cost[i][c]` is the price of painting house `i` with color `c` (red, blue, green). Adjacent houses must differ in color. Minimize the total cost. The variant with k colors is the same recurrence — generalize once and you own both.

## whyItMatters
Paint House is the canonical "small fixed-arity DP" — it teaches you that DP state often equals a tiny enum, not an integer index. The mindset transfers directly to state-machine DPs (stock trading, ad-placement, paint fence with same-color limits), where the "where am I now" coordinate is a discrete choice rather than a length or position.

## intuition
The only thing about the past that affects the future is the color of the previous house — because that's what blocks one of your three options today. So carry a 3-way state: the cheapest way to reach house `i` ending in each color. Each new house is a constant-work update.

## visualization
With costs `[[17,2,17],[16,16,5],[14,3,19]]` the per-color running minimums evolve: `[17,2,17] → [16+2, 16+17, 5+2] = [18, 33, 7] → [14+7, 3+18, 19+7] = [21, 21, 26]`. Answer = min row = 21. Each column inherits the cheaper of the *other two* columns from the prior row.

## bruteForce
Enumerate every coloring: 3^n possibilities, validated against the no-adjacent-same constraint. Workable only up to n ≈ 20. Backtracking with pruning reaches a bit further but still falls off a cliff because every house genuinely branches.

## optimal
Carry three rolling values `r, b, g` = min cost to reach the current house painted red/blue/green. Transition: `r_new = cost[i][0] + min(b, g)`, and symmetric for the others. Return `min(r, b, g)`. O(n) time, O(1) extra space. For k colors, swap the explicit `min(other_two)` for "row-min if current isn't the unique min, else second-min" — still O(n·k).

## complexity
time: O(n)
space: O(1)
notes: For the k-color variant track the two smallest values in the previous row (and which color holds the min). Each transition stays O(1), so the total is O(n·k).

## pitfalls
- Adding `cost[i][c]` to all three transitions at once instead of only the chosen color.
- Forgetting to take `min(other_two)` and accidentally allowing same-color neighbors.
- Mutating the cost matrix in place — fine for the problem but breaks repeat runs in tests.
- For k-color: scanning the full previous row each step gives O(n·k²); track top-two to stay linear.

## interviewTips
- Say the magic line: "The only thing that matters about the past is the previous color." That alone shows DP intuition.
- Mention space optimization: full DP table is O(n) but three rolling scalars are enough.
- Ask whether colors are exactly three or general k — the variant flips the recurrence to a top-two trick.

## code.python
```python
def min_cost(costs):
    if not costs:
        return 0
    r, b, g = costs[0]
    for i in range(1, len(costs)):
        nr = costs[i][0] + min(b, g)
        nb = costs[i][1] + min(r, g)
        ng = costs[i][2] + min(r, b)
        r, b, g = nr, nb, ng
    return min(r, b, g)
```

## code.javascript
```javascript
function minCost(costs) {
  if (!costs.length) return 0;
  let [r, b, g] = costs[0];
  for (let i = 1; i < costs.length; i++) {
    const nr = costs[i][0] + Math.min(b, g);
    const nb = costs[i][1] + Math.min(r, g);
    const ng = costs[i][2] + Math.min(r, b);
    r = nr; b = nb; g = ng;
  }
  return Math.min(r, b, g);
}
```

## code.java
```java
public int minCost(int[][] costs) {
    if (costs.length == 0) return 0;
    int r = costs[0][0], b = costs[0][1], g = costs[0][2];
    for (int i = 1; i < costs.length; i++) {
        int nr = costs[i][0] + Math.min(b, g);
        int nb = costs[i][1] + Math.min(r, g);
        int ng = costs[i][2] + Math.min(r, b);
        r = nr; b = nb; g = ng;
    }
    return Math.min(r, Math.min(b, g));
}
```

## code.cpp
```cpp
int minCost(vector<vector<int>>& costs) {
    if (costs.empty()) return 0;
    int r = costs[0][0], b = costs[0][1], g = costs[0][2];
    for (int i = 1; i < (int)costs.size(); i++) {
        int nr = costs[i][0] + min(b, g);
        int nb = costs[i][1] + min(r, g);
        int ng = costs[i][2] + min(r, b);
        r = nr; b = nb; g = ng;
    }
    return min({r, b, g});
}
```
