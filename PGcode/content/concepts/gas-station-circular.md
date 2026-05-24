---
slug: gas-station-circular
module: greedy
title: Gas Station Circular Tour
subtitle: Find the unique starting station that lets you traverse a circular route — O(N) with a single pass.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Graphs (Sedgewick & Wayne)"
    url: "https://algs4.cs.princeton.edu/40graphs/"
    type: book
  - title: "Find the first circular tour that visits all petrol pumps — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/find-a-tour-that-visits-all-stations/"
    type: blog
  - title: "TheAlgorithms/Python — gas_station.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/greedy_methods/gas_station.py"
    type: repo
status: published
---

## intro
A car travels a circular route with `n` gas stations. At station `i` the car can refuel `gas[i]` units; driving to station `i+1` costs `cost[i]` units. Starting with an empty tank, return the index of the unique station from which a full loop is possible, or -1 if none exists. The pretty result: a single linear pass solves it.

## whyItMatters
Gas Station is the canonical "balance with rotation" greedy. The same balance-along-a-circle pattern shows up in cyclic load balancing, Huffman scheduling rotations, and ring-buffer integrity checks. Recognizing the invariant — total balance non-negative implies a valid start exists — is a transferable insight.

## intuition
Two facts: (1) if `sum(gas) < sum(cost)` no start works at all — there isn't enough fuel for the loop; (2) if `sum(gas) >= sum(cost)`, then exactly one valid start exists. The clever bit is finding it without trying each station. Walk the array tracking a running tank; whenever the tank drops below zero, no station from the current candidate up to here can be a valid start — discard them all and try the next station. The first index that survives the final pass *is* the answer.

## visualization
With `gas = [1,2,3,4,5]` and `cost = [3,4,5,1,2]`, total gas - cost = 0 (so a solution exists). Walk from 0: tank goes 1-3=-2 (reset, candidate=1); 2-4=-2 (reset, candidate=2); 3-5=-2 (reset, candidate=3); 4-1=3; 3+5-2=6. End of pass with candidate=3. Verify: 3 → tank 4-1=3 → +5-2=6 → +1-3=4 → +2-4=2 → +3-5=0. Loop succeeds. Answer = 3.

## bruteForce
Try every station as a start and simulate the full loop, breaking when the tank dips negative. O(n²) time. Trivially correct, fine for small n, but loses the elegance — and is rejected by interviewers as the final answer.

## optimal
Single pass. Maintain `total` (running surplus over the whole array, used at the end as a feasibility check) and `tank` (surplus since the current candidate start). For each i: add `gas[i] - cost[i]` to both. If `tank < 0`, the current candidate cannot reach i+1 — and crucially, no station from candidate to i can either, since each was reached with non-negative tank and ended in deficit. Reset `tank = 0` and set candidate = i + 1. At the end, return candidate if `total >= 0` else -1.

## complexity
time: O(n)
space: O(1)
notes: The pivotal correctness lemma is that any station between the current candidate and a tank-bust station inherits a smaller running tank than the candidate had, so cannot be a valid start either. This is what compresses O(n²) brute force to O(n).

## pitfalls
- Returning `candidate` without checking `total >= 0` first — gives a wrong answer when no solution exists.
- Comparing `tank < 0` after only adding `gas[i]` (not `gas[i] - cost[i]`) — off-by-one on what "this station" means.
- Resetting candidate to `i` instead of `i + 1` — the bust happened *while leaving* i, so i itself is also invalid.
- Forgetting the circular wrap when simulating to verify by hand.

## interviewTips
- State both lemmas upfront: (1) sums determine feasibility; (2) any reset skip is safe. Together they justify the O(n) algorithm.
- Mention that the answer is unique when feasible — this surprises interviewers who haven't seen it.
- For follow-up "return all valid starts", note that the answer remains unique unless ties in surplus zeros are reported separately.

## code.python
```python
def can_complete_circuit(gas, cost):
    total = tank = 0
    start = 0
    for i in range(len(gas)):
        diff = gas[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1
```

## code.javascript
```javascript
function canCompleteCircuit(gas, cost) {
  let total = 0, tank = 0, start = 0;
  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }
  return total >= 0 ? start : -1;
}
```

## code.java
```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {
            start = i + 1;
            tank = 0;
        }
    }
    return total >= 0 ? start : -1;
}
```

## code.cpp
```cpp
int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < (int)gas.size(); i++) {
        int diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {
            start = i + 1;
            tank = 0;
        }
    }
    return total >= 0 ? start : -1;
}
```
