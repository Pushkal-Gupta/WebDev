---
slug: random-shuffle-fisher-yates
module: math-geom-sampling
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
- Spotify, Apple Music, and YouTube Music shuffle playlists with Fisher-Yates (or Spotify's "balanced shuffle" variant); the original uniform version is the baseline.
- Online poker and casino RNGs (PokerStars, Random.org's audited shuffle) require provably uniform permutations; Fisher-Yates is the audit-friendly choice paired with a CSPRNG.
- Machine learning frameworks — TensorFlow's `tf.random.shuffle`, PyTorch's `torch.randperm`, scikit-learn's `train_test_split` — use Fisher-Yates internally for dataset shuffling because biased shuffles silently destroy validation guarantees.
- Microsoft's IE10 vote-randomization feature shipped with a buggy non-Fisher-Yates shuffle that gave certain browsers a ~50% higher chance of being listed first; the off-by-one in random-range bounds is the famous failure mode.
- "Sort by random key" (`.sort((a,b) => Math.random() - 0.5)`) is biased *and* O(n log n); Fisher-Yates is unbiased and O(n) — there is no reason to use anything else.

## intuition
There are n! permutations of n elements, and a uniform shuffle must assign each one probability 1/n!. The challenge is constructing an algorithm whose probability tree has exactly n! equally-likely leaves. Fisher-Yates does this by walking the array from the last index down to the first and, at each step, picking a uniformly random index from the still-unfixed portion (positions 0 through i) and swapping with position i. After the swap, position i is "locked" — it will not move again. The probability tree is n choices wide at the first step, n-1 wide at the second, down to 1 at the last step, giving exactly n * (n-1) * ... * 1 = n! equally likely paths. Each permutation is reachable by exactly one path, so each gets probability 1/n!. The critical detail is that the random range must include the current index — `random_int(0, i)` inclusive on both ends, not `random_int(0, i-1)`. The off-by-one is the famous bias bug: excluding the current position forces every element to move at least once, eliminating the n! - (n-1)! / n! ratio of permutations where some element stays put, which is roughly 37% of all permutations missing. The naive alternative — picking a uniform random other index for each swap — gives n^n outcomes, which does not divide evenly into n!, so the distribution cannot be uniform regardless of how careful you are. The deep insight is that uniform shuffling is a constructive proof of n! by induction: pick the last element from n choices, then shuffle the remaining n-1 elements (a smaller instance of the same problem).

## visualization
Start with [A, B, C, D]. i=3: pick j in [0,3], say 1; swap -> [A, D, C, B]. i=2: pick j in [0,2], say 0; swap -> [C, D, A, B]. i=1: pick j in [0,1], say 1; swap -> [C, D, A, B]. i=0: nothing to do. Each of the 24 permutations is reachable through exactly one sequence of random choices, each with probability 1/24.

## bruteForce
"Sort by random key": `array.sort((a, b) => Math.random() - 0.5)`. Looks elegant, is biased (the comparator violates transitivity, so the sort's pivot choices skew the output) and is O(n log n) instead of O(n). Equally bad: pick a uniform random index in `[0, n)` for every swap — gives n^n total outcomes, not divisible by n!, so the distribution cannot be uniform.

## optimal
The Knuth descending form: walk i from n-1 down to 1, draw j uniformly from `[0, i]` inclusive, swap `a[i]` with `a[j]`. Equivalently, ascending: walk i from 0 to n-1, draw j uniformly from `[i, n-1]`, swap `a[i]` with `a[j]`. Each draw must include the current index itself — that is the critical detail that produces n! equally likely outcomes and the bug that ruins the naive variant. Time is O(n) with one random draw and one swap per iteration. Space is O(1) extra — the shuffle is in place. This is information-theoretically optimal because producing one of n! permutations requires at least log2(n!) ~ n log n bits of randomness, which the n random draws over ranges of decreasing size deliver exactly.

```python
import random

def fisher_yates(a):
    # Descending Knuth variant — equivalent ascending form also works.
    for i in range(len(a) - 1, 0, -1):
        # CRITICAL: range is [0, i] inclusive; randint includes both endpoints.
        # Off-by-one to [0, i-1] is the famous IE10 vote-bias bug.
        j = random.randint(0, i)
        a[i], a[j] = a[j], a[i]
    return a
```

The inclusive bound `random.randint(0, i)` is the load-bearing line. Using `random() % (i + 1)` introduces modulo bias when `RAND_MAX % (i + 1) != 0` — small effect on 32-bit RAND_MAX but real, and forbidden in cryptographic contexts (use `secrets.randbelow` or `crypto.getRandomValues` for those). The partial-shuffle variant — pick k uniform elements from n in O(k) — shuffles only the first k positions of the array, exploiting the same locked-in invariant.

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
