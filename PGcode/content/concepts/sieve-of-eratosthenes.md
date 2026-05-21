---
slug: sieve-of-eratosthenes
module: math
title: Sieve of Eratosthenes
subtitle: Find every prime up to N in near-linear time.
difficulty: Beginner
position: 1
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
status: published
---

## intro
The Sieve of Eratosthenes is the oldest still-used algorithm in computer science: 2,200+ years old and still the right answer for "find all primes up to N." It outperforms naive primality testing for bulk prime generation by orders of magnitude and unlocks every number-theory problem that needs prime tables (Euler's phi, segmented sieves, Goldbach, prime factorization caches).

## whyItMatters
Primality is the bottleneck of every cryptography, hash, and number-theory problem. Trial-dividing each candidate is O(√N) per number — for N=10⁷ that's 10¹⁰.⁵ operations, infeasible. The sieve does the whole batch in roughly O(N log log N), which is "essentially linear" for any practical N. Bulk prime tables are how every competitive-programming math problem starts.

## intuition
A composite number is, by definition, a product of two smaller integers. So if we sweep upward and for each prime `p` we find, *strike out* all of its multiples `2p, 3p, 4p, ...`, then every composite gets struck out by its smallest prime factor. Anything still standing at the end is prime. The genius is that we only ever do work proportional to "what we're crossing out" — and the sum of `N/p` over primes is `N log log N`.

## visualization
Start with the integers 2..N all marked "prime." Find the smallest unmarked: 2. Cross out 4, 6, 8, … Next unmarked: 3. Cross out 9, 12, 15, … (we can start at p² because anything smaller was already crossed out by a smaller prime). Continue while `p ≤ √N`. Done.

## bruteForce
Test each candidate for primality by trial division up to `√n`. O(N √N) total. For N = 10⁷ that's ~3 × 10¹⁰ operations — minutes of CPU vs the sieve's milliseconds.

## optimal
Allocate a boolean array `is_prime[0..N]` defaulting to `true`. Mark 0 and 1 as false. For `p` from 2 to `√N`: if `is_prime[p]`, walk `p², p² + p, p² + 2p, …` up to N and mark each composite. At the end, every index where `is_prime` is still true is a prime. Optionally write the primes into a result list in a final O(N) pass.

A linear sieve variant achieves true O(N) using each number's smallest prime factor and is required when N is very large or when you also want a smallest-prime-factor table for fast factorization.

## complexity
time: O(N log log N)
space: O(N)
notes: Linear-sieve variant is O(N) but with a slightly higher constant. Memory dominates: for N = 10⁸ a boolean array is ~100 MB — use a bitset or segmented sieve if memory matters.

## pitfalls
- Starting the inner loop at `2p` instead of `p²` works but is slower; the smaller multiples are guaranteed already-marked.
- Off-by-one: `is_prime` must include index `N` if "primes up to N inclusive" is required.
- Using `int` for `p * p` when `p` is close to √MAX_INT — overflow. Use long (Java) or `int64_t` (C++).
- Confusing "sieve up to N" with "sieve the Nth prime" — those are different problems (use the prime-counting estimate `n ln n` to bound for the Nth prime).

## interviewTips
- Whenever an interview problem mentions "for many queries about primes up to 10⁶," the answer is "precompute with a sieve." Don't trial-divide in the loop.
- Mention the segmented sieve for "primes between L and R when R is huge" — it sieves a window of size √R using a base sieve plus a window sieve.
- The linear sieve also gives you the smallest prime factor of every number for free, which makes factorization O(log n) per number.

## code.python
```python
def sieve(n: int) -> list[int]:
    if n < 2:
        return []
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for p in range(2, int(n ** 0.5) + 1):
        if is_prime[p]:
            for multiple in range(p * p, n + 1, p):
                is_prime[multiple] = False
    return [i for i, prime in enumerate(is_prime) if prime]
```

## code.javascript
```javascript
function sieve(n) {
  if (n < 2) return [];
  const isPrime = new Uint8Array(n + 1).fill(1);
  isPrime[0] = isPrime[1] = 0;
  const limit = Math.floor(Math.sqrt(n));
  for (let p = 2; p <= limit; p++) {
    if (isPrime[p]) {
      for (let m = p * p; m <= n; m += p) isPrime[m] = 0;
    }
  }
  const out = [];
  for (let i = 2; i <= n; i++) if (isPrime[i]) out.push(i);
  return out;
}
```

## code.java
```java
public List<Integer> sieve(int n) {
    if (n < 2) return Collections.emptyList();
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;
    for (int p = 2; (long) p * p <= n; p++) {
        if (isPrime[p]) {
            for (int m = p * p; m <= n; m += p) isPrime[m] = false;
        }
    }
    List<Integer> out = new ArrayList<>();
    for (int i = 2; i <= n; i++) if (isPrime[i]) out.add(i);
    return out;
}
```

## code.cpp
```cpp
vector<int> sieve(int n) {
    if (n < 2) return {};
    vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    for (int p = 2; (long long) p * p <= n; p++) {
        if (isPrime[p]) {
            for (int m = p * p; m <= n; m += p) isPrime[m] = false;
        }
    }
    vector<int> out;
    for (int i = 2; i <= n; i++) if (isPrime[i]) out.push_back(i);
    return out;
}
```
