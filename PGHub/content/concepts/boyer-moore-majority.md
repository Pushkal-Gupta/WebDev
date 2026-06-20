---
slug: boyer-moore-majority
module: arrays-counting-select
title: Boyer–Moore Majority Vote
subtitle: Find an array's majority element in one pass and O(1) extra space.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "GeeksforGeeks — Boyer-Moore Majority Voting Algorithm"
    url: "https://www.geeksforgeeks.org/boyer-moore-majority-voting-algorithm/"
    type: blog
  - title: "Princeton algs4 — Sorting & Searching (companion)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "TheAlgorithms/Python — reference implementations"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
The Boyer–Moore majority vote algorithm finds the element that appears *more than half the time* in an array using a single pass and exactly two variables. It's a beautiful trick that beats both sorting (O(n log n)) and hash-counting (O(n) space) when a true majority is guaranteed.

## whyItMatters
"Find the most common element" is the kind of problem where everyone reaches for a hash map. Boyer–Moore is the answer when the interviewer says "now do it in O(1) space." It's also a building block for streaming-data majority detection (find heavy hitters in a packet stream without storing them all) and a foundational technique for the more general Misra–Gries `k`-majority algorithm.

## intuition
The mental model is a war of attrition where every element shows up to vote and every disagreement is a mutual knockout. Think of each occurrence of an element as a token holding a single vote. As we sweep left to right, we maintain a tentative leader (`candidate`) and a strength counter (`count`). When a new token matches the current leader, the leader's strength grows by one. When a new token disagrees, the leader spends one unit of strength to neutralise it — both tokens effectively cancel and disappear from the battlefield. When the leader's strength drops to zero, the leader is forgotten and the next token becomes the new tentative leader with strength one.

The *why* before the *how*: a true majority element appears strictly more than `n/2` times. If we paired each majority token with one non-majority token in a one-for-one knockout, the majority would still have leftover tokens after every non-majority element is annihilated. So whoever survives the entire attrition process must be the majority — there is no other way for a token to remain standing.

The key invariant after processing prefix of length `i`: if the true majority element exists in the whole array, it either equals `candidate`, or it appears in the *unpaired* portion (the `count` extra tokens of the current candidate plus the `i - count` tokens that have already been paired and cancelled). Analogy: imagine soldiers from different armies meeting on a bridge — each pair from different armies kills each other and falls off. The army with strictly more than half the soldiers cannot be wiped out by this pairing; survivors must wear its colours. Verification by a second pass is required only because if no majority exists, the algorithm still names someone — the "last army standing" by coincidence.

## visualization
```
Array: [3, 3, 4, 2, 4, 4, 2, 4, 4]   (length 9, majority threshold > 4)

idx  val  count==0?  action                  candidate  count
---  ---  ---------  ----------------------  ---------  -----
 0    3   yes        adopt, count=1                  3      1
 1    3   no, same   count++                         3      2
 2    4   no, diff   count--                         3      1
 3    2   no, diff   count--                         3      0
 4    4   yes        adopt, count=1                  4      1
 5    4   no, same   count++                         4      2
 6    2   no, diff   count--                         4      1
 7    4   no, same   count++                         4      2
 8    4   no, same   count++                         4      3

Pass 1 survivor: candidate = 4
Pass 2 verify:   count(4 in array) = 5 > 9/2 = 4.5  -> answer is 4

Counter-example (no majority): [1, 2, 3, 1, 2]
 0  1  adopt    cand=1 cnt=1
 1  2  diff     cand=1 cnt=0
 2  3  adopt    cand=3 cnt=1
 3  1  diff     cand=3 cnt=0
 4  2  adopt    cand=2 cnt=1
Pass 2: count(2) = 1, not > 2.5  ->  return -1 (no majority).
```

## bruteForce
Two approaches: sort then return the middle element (`O(n log n)`, O(1) if in-place), or count with a hash map (`O(n)` time, O(n) space). Both work, neither is the answer the interviewer wants when they specifically constrain space.

## optimal
The optimal algorithm is a single linear pass that maintains two scalars — `candidate` (the current tentative majority) and `count` (its net surviving strength). The state machine has three rules applied per element `x`: (1) if `count == 0`, claim the slot by setting `candidate = x` and `count = 1`; (2) else if `x == candidate`, reinforce by `count += 1`; (3) else weaken by `count -= 1`. No collection, no map, no priority queue — the entire data structure is two registers. After one pass, `candidate` is the only element that could possibly be a majority. A second pass actually counts occurrences of `candidate`; return it only if it appears more than `n/2` times.

Why this is optimal: any algorithm must read every element at least once to be correct (consider an adversary who hides the majority in the unread suffix), so O(n) time is a lower bound. O(1) space is the smallest possible for any algorithm that does not destroy or reorder the input. Boyer–Moore achieves both simultaneously.

Key invariants and tradeoffs: the algorithm only proves "*if* a majority exists, it is `candidate`." It does not prove existence — hence the verification pass when the problem doesn't guarantee a majority. The technique generalises elegantly to "elements appearing more than n/k times" via the Misra–Gries algorithm: keep `k - 1` candidates with `k - 1` counters; on a new element, increment if it matches any candidate, decrement *all* counters otherwise, claim an empty slot if any counter is zero. This is the backbone of streaming heavy-hitter detection in Spark, Flink, and DataSketches — the same theory ships in production analytics today.

## complexity
time: O(n)
space: O(1)
notes: Two passes if verification is required (which is the safe default). Boyer–Moore generalizes to "elements appearing more than n/k times" via the Misra–Gries algorithm, which keeps k−1 candidates.

## pitfalls
- **Skipping the verification pass.** Boyer–Moore always names a survivor, even when no majority exists, so returning it blindly produces a wrong answer on inputs like `[1, 2, 3]`. Fix: add a second pass that counts occurrences of `candidate` and only return it when the count strictly exceeds `n / 2`; otherwise return a sentinel (`-1`, `None`).
- **Confusing majority with mode.** "Majority" means strictly more than `n / 2`; "most common" (the mode) only requires being the maximum. Boyer–Moore does not find the mode. Fix: if the problem asks for "the most frequent element" with no majority guarantee, switch to a hashmap-count + argmax — `O(n)` time, `O(n)` space.
- **n/3 generalisation done by intuition.** The two-candidate variant for "elements > n/3" requires decrementing *both* counters when neither matches, and a verification pass for *each* candidate; people often decrement only one or skip verification. Fix: write the four cases explicitly — match c1, match c2, empty slot, neither — and verify each surviving candidate's actual count exceeds `n / 3` before returning.
- **Using a primitive `int` with no sentinel for `candidate`.** Initialising `candidate = 0` makes the algorithm misbehave when 0 itself is a valid input value and the array starts with non-zero values; the first comparison spuriously matches the initial 0. Fix: either use a nullable boxed `Integer`/`Optional`, or guard the equality with the explicit `count == 0` rule so the initial value never participates in a comparison.

## interviewTips
- Frame it explicitly: "Boyer–Moore is a streaming majority algorithm. It's O(n) time and O(1) space — strictly better than the hash-map approach the interviewer probably expects."
- If asked for "elements appearing more than n/3 times," generalize on the spot: two candidates, two counts, same logic; at most two such elements can exist.
- Note the link to streaming/distributed systems — this is the academic ancestor of heavy-hitter detection in Spark, Flink, and Cloud Bigtable's compaction.

## code.python
```python
def majority_element(nums: list[int]) -> int:
    candidate = None
    count = 0
    for x in nums:
        if count == 0:
            candidate = x
        count += 1 if x == candidate else -1
    # Verify (drop this line only if a majority is guaranteed)
    return candidate if nums.count(candidate) > len(nums) // 2 else -1
```

## code.javascript
```javascript
function majorityElement(nums) {
  let candidate = null, count = 0;
  for (const x of nums) {
    if (count === 0) candidate = x;
    count += x === candidate ? 1 : -1;
  }
  let occurrences = 0;
  for (const x of nums) if (x === candidate) occurrences++;
  return occurrences > nums.length / 2 ? candidate : -1;
}
```

## code.java
```java
public int majorityElement(int[] nums) {
    Integer candidate = null;
    int count = 0;
    for (int x : nums) {
        if (count == 0) candidate = x;
        count += (candidate != null && x == candidate) ? 1 : -1;
    }
    int occurrences = 0;
    for (int x : nums) if (candidate != null && x == candidate) occurrences++;
    return occurrences > nums.length / 2 ? candidate : -1;
}
```

## code.cpp
```cpp
int majorityElement(vector<int>& nums) {
    int candidate = 0, count = 0;
    for (int x : nums) {
        if (count == 0) candidate = x;
        count += (x == candidate) ? 1 : -1;
    }
    int occurrences = count_if(nums.begin(), nums.end(), [&](int x){ return x == candidate; });
    return occurrences > (int) nums.size() / 2 ? candidate : -1;
}
```
