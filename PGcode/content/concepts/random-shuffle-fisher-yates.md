---
slug: random-shuffle-fisher-yates
module: math
title: Random Shuffle — Fisher-Yates
subtitle: An O(n) unbiased in-place shuffle and the off-by-one bug that quietly biases millions of "shuffles".
difficulty: Intermediate
position: 2
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 5: Probabilistic Analysis"
    url: "https://walkccc.me/CLRS/Chap05/5.3/"
    type: book
  - title: "Fisher-Yates Shuffle Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/shuffle-a-given-array-using-fisher-yates-shuffle-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — fisher_yates_shuffle.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/other/fischer_yates_shuffle.py"
    type: repo
status: published
---

## intro
Fisher-Yates (also called the Knuth shuffle) is the canonical algorithm for randomly permuting an array in linear time, using O(1) extra space, and — crucially — producing each of the n! permutations with exactly equal probability. It is short enough to memorize and gets asked about whenever shuffling matters: card games, A/B tests, randomized algorithms, dataset splits.

## whyItMatters
"Sort by random key" looks correct and is even used in production code, but it is biased and slow. A naive swap-each-index-with-a-random-other-index is also biased. The Fisher-Yates pattern is the only easy, in-place way to get a uniform permutation, and a single off-by-one in the range turns it into the famously-biased shuffle that ruined a major browser's vote-randomization feature.

## intuition
Walk the array from the last index down to the first. At each position i, pick a uniformly random index j in `[0, i]` (inclusive on both ends) and swap `a[i]` with `a[j]`. After the swap, `a[i]` is "locked in" — it will not move again. You are repeatedly answering "of the elements not yet placed, which one goes next?" — and you do it n times, each with the correct uniform choice from the remaining pool.

## visualization
Start with [A, B, C, D]. i=3: pick j in [0,3], say 1; swap -> [A, D, C, B]. i=2: pick j in [0,2], say 0; swap -> [C, D, A, B]. i=1: pick j in [0,1], say 1; swap -> [C, D, A, B]. i=0: nothing to do. Each of the 24 permutations is reachable through exactly one sequence of random choices, each with probability 1/24.

## bruteForce
"Sort by random key": `array.sort((a, b) => Math.random() - 0.5)`. Looks elegant, is biased (the comparator violates transitivity, so the sort's pivot choices skew the output) and is O(n log n) instead of O(n). Equally bad: pick a uniform random index in `[0, n)` for every swap — gives n^n total outcomes, not divisible by n!, so the distribution cannot be uniform.

## optimal
The classic Knuth loop, descending:
```
for i = n-1 down to 1:
    j = random integer in [0, i]   // INCLUSIVE on both ends
    swap a[i], a[j]
```
Or equivalently the ascending form: for i from 0 to n-1, swap a[i] with a[j] where j is uniform in `[i, n-1]`. Either way, each draw must include the current index itself; that is what makes the result unbiased.

## complexity
time: O(n) — one random draw and one swap per element.
space: O(1) extra (in place); reservoir sampling and lazy variants for streams are separate algorithms.
notes: Requires a true uniform random integer in `[0, k]`. Using `random() % (k+1)` introduces modulo bias when `k+1` does not divide RAND_MAX.

## pitfalls
- Choosing `j` in `[0, i-1]` instead of `[0, i]` — bias; this is the classic Microsoft browser-shuffle bug.
- Using `Math.floor(Math.random() * n)` is fine for n far below 2^53, but `(int)(rand() % n)` in C is modulo-biased for large n.
- Shuffling references but not noticing the underlying objects are mutable and shared.
- Re-seeding the PRNG with the current second between calls: identical shuffles in the same second.
- Using the same shuffle for cryptographic purposes — use `secrets`/`crypto.getRandomValues` instead of `Math.random()`.

## interviewTips
- Be able to write the 4-line loop from memory, with the inclusive bound highlighted.
- Mention partial shuffle: to pick k uniform random elements from n in O(k), shuffle only the first k positions of the array.
- Bring up reservoir sampling as the streaming analogue when n is unknown.

## code.python
```python
import random

def fisher_yates(a: list) -> list:
    for i in range(len(a) - 1, 0, -1):
        j = random.randint(0, i)
        a[i], a[j] = a[j], a[i]
    return a
```

## code.javascript
```javascript
export function fisherYates(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

## code.java
```java
import java.util.Random;

public class Shuffle {
    private static final Random RNG = new Random();
    public static void fisherYates(int[] a) {
        for (int i = a.length - 1; i > 0; i--) {
            int j = RNG.nextInt(i + 1);
            int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <random>

void fisherYates(std::vector<int>& a) {
    static std::mt19937 rng(std::random_device{}());
    for (int i = static_cast<int>(a.size()) - 1; i > 0; --i) {
        std::uniform_int_distribution<int> dist(0, i);
        int j = dist(rng);
        std::swap(a[i], a[j]);
    }
}
```
