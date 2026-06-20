---
slug: sieve-of-eratosthenes
module: math-number-theory
title: Sieve of Eratosthenes
subtitle: Find every prime up to N in near-linear time.
difficulty: Beginner
position: 1
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Sieve of Eratosthenes"
    url: "https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html"
    type: blog
  - title: "TheAlgorithms/Python — maths (sieve)"
    url: "https://github.com/TheAlgorithms/Python/blob/master/maths/sieve_of_eratosthenes.py"
    type: repo
status: published
---

## intro
The Sieve of Eratosthenes is the oldest still-used algorithm in computer science: 2,200+ years old and still the right answer for "find all primes up to N." It outperforms naive primality testing for bulk prime generation by orders of magnitude and unlocks every number-theory problem that needs prime tables (Euler's phi, segmented sieves, Goldbach, prime factorization caches).

## whyItMatters
Primality is the bottleneck of every cryptography, hash, and number-theory pipeline. Trial-dividing each candidate costs `O(sqrt(N))` per number, which for `N = 10^7` runs to about `10^{10.5}` operations — minutes, not microseconds. Eratosthenes' sieve does the whole batch in roughly `O(N log log N)` and is the engine behind every prime-table generator you have ever loaded: SymPy's `primerange`, Wolfram Mathematica's `Prime`, GMP's `mpz_nextprime`, the prime-sieves baked into competitive-programming templates. Cryptographic key generation uses a sieve to discard composite candidates fast before running an expensive Miller-Rabin probabilistic test. The Atkin sieve and the segmented sieve (used by `primesieve.org` to enumerate the first `10^{12}` primes) are direct descendants.

## intuition
Trial division asks each number "who are your divisors?" — slow because most numbers have many. Eratosthenes inverts the question: take each prime in turn and ask "which of my multiples sit below `N`?" Each composite gets crossed off exactly once per distinct prime factor, which by Mertens' theorem averages `log log N` strikes per number — the source of the famous near-linear runtime.

Start with a boolean array of size `N + 1` initialized to true ("all numbers are prime until disproven"). Walk `p` from 2 upward. When you find `is_prime[p] == True`, mark every multiple `p*p, p*p+p, p*p+2p, ...` as composite. The reason you start at `p*p` and not `2p` is that any composite less than `p*p` has a prime factor smaller than `p`, which a previous iteration already crossed off. That single optimization halves the number of writes and is what separates a clean sieve from a slow one.

The outer loop only needs to run while `p*p <= N`, because every composite up to `N` has at least one prime factor `<= sqrt(N)`. Past that point you can simply collect remaining true entries. The total work satisfies `sum over primes p <= N of N/p ~ N * log log N` by Mertens' theorem (1874), which is essentially linear for any practical `N`.

## visualization
Start with the integers 2..N all marked "prime." Find the smallest unmarked: 2. Cross out 4, 6, 8, … Next unmarked: 3. Cross out 9, 12, 15, … (we can start at p² because anything smaller was already crossed out by a smaller prime). Continue while `p ≤ √N`. Done.

## bruteForce
Test each candidate for primality by trial division up to `√n`. O(N √N) total. For N = 10⁷ that's ~3 × 10¹⁰ operations — minutes of CPU vs the sieve's milliseconds.

## optimal
Linear-time variants exist (Pritchard 1981, the linear sieve of Gries and Misra), but the original quadratic-loop Eratosthenes with the `p*p` starting trick and a `bytearray` for memory locality is unbeatable in practice for any `N` up to `10^8` on commodity hardware. For larger `N` switch to a segmented sieve that processes one cache-sized chunk at a time, keeping the working set in L1/L2.

```python
def sieve(n):
    is_prime = bytearray(b'\x01') * (n + 1)
    is_prime[0] = is_prime[1] = 0
    for p in range(2, int(n**0.5) + 1):
        if is_prime[p]:
            is_prime[p*p : n+1 : p] = bytearray(len(range(p*p, n+1, p)))
    return [i for i in range(n + 1) if is_prime[i]]
```

The critical line is `is_prime[p*p : n+1 : p] = bytearray(len(...))` — Python's slice-assignment lets the CPython interpreter execute the strike loop in C, which makes this Python sieve roughly as fast as a hand-written C loop for `N <= 10^7`. For `N` up to `10^{12}` use the **segmented sieve**: precompute primes up to `sqrt(N)` with the standard sieve, then sweep `[L, R]` windows of size around 32 KiB across the range, marking composites in the window using only the small primes. That keeps the working set inside L1 cache and is how `primesieve.org` enumerates the first trillion primes in under an hour on a laptop.

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
