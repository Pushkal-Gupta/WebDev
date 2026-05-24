---
slug: boyer-moore-majority
module: arrays-searching
title: Boyer–Moore Majority Vote
subtitle: Find an array's majority element in one pass and O(1) extra space.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Boyer & Moore — MJRTY: A Fast Majority Vote Algorithm (UT Austin)"
    url: "https://www.cs.utexas.edu/~moore/best-ideas/mjrty/index.html"
    type: book
  - title: "GeeksforGeeks — Boyer-Moore Majority Voting Algorithm"
    url: "https://www.geeksforgeeks.org/boyer-moore-majority-voting-algorithm/"
    type: blog
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
Imagine every element as a token. The candidate-with-vote-count starts at "nothing." Each time we see the same element as the current candidate, the vote count goes up. Each time we see something different, it cancels one of the candidate's votes. If the candidate ever runs out of votes, replace it with the next element. A *true* majority element wins more cancellations than it loses; everything else mutually annihilates. Whatever survives is the majority — *if a majority exists*.

## visualization
Array `[3, 3, 4, 2, 4, 4, 2, 4, 4]`. Step through: candidate=3, count=1. Next 3 → count=2. Next 4 → count=1. Next 2 → count=0, candidate cleared. Next 4 → candidate=4, count=1. Next 4 → count=2. Next 2 → count=1. Next 4 → count=2. Next 4 → count=3. Final candidate: 4. Verify on a second pass: count of 4 = 5 > 9/2. ✓

## bruteForce
Two approaches: sort then return the middle element (`O(n log n)`, O(1) if in-place), or count with a hash map (`O(n)` time, O(n) space). Both work, neither is the answer the interviewer wants when they specifically constrain space.

## optimal
Single linear pass with two variables: `candidate` and `count`. If `count == 0`, set `candidate = current_element`. If `current_element == candidate`, increment; else decrement. After one pass, candidate is the only possible majority element. A second pass verifies by actually counting — required when the problem doesn't guarantee a majority exists.

## complexity
time: O(n)
space: O(1)
notes: Two passes if verification is required (which is the safe default). Boyer–Moore generalizes to "elements appearing more than n/k times" via the Misra–Gries algorithm, which keeps k−1 candidates.

## pitfalls
- Returning the candidate without verification when no majority is guaranteed — Boyer–Moore says "if a majority exists, it's this," but doesn't *prove* it. Always verify unless the problem promises a majority.
- Confusing "majority" (strictly more than n/2) with "most common" (the mode). The mode is *not* what Boyer–Moore finds; it finds majority specifically.
- For n/3 generalization, keep two candidates with two counts; logic is symmetric, but the edge cases trip people up.

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
