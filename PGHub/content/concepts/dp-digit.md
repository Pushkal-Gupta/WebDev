---
slug: dp-digit
module: dp-advanced
title: Digit DP
subtitle: Count integers in [L, R] satisfying a digit-level property by DP on the decimal representation.
difficulty: Advanced
position: 2
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Digit DP — cp-algorithms"
    url: "https://cp-algorithms.com/dynamic_programming/intro-to-dp.html"
    type: blog
  - title: "Digit DP — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/digit-dp-introduction/"
    type: blog
  - title: "KACTL — number theory"
    url: "https://github.com/kth-competitive-programming/kactl/tree/main/content/number-theory"
    type: repo
status: published
---

## intro
Digit DP answers "how many integers in [L, R] satisfy property P?" when P depends on the digits — sum, count of a particular digit, lucky-number constraints, divisibility-by-k, no two equal adjacent digits, and so on. Instead of iterating through R - L + 1 values (impossibly large for R up to 10^18), it iterates over the at-most-19 positions of R written in base 10 and DPs over a small per-position state.

## whyItMatters
- Tax-bracket and financial-reporting tools (used by Intuit's TurboTax tax-line counters and accounting auditing suites) count income amounts hitting specific digit-sum or trailing-zero patterns across enormous declared ranges via digit DP.
- Lottery and gaming-regulator audits (UK Gambling Commission, Nevada Gaming Control) enumerate winning ticket numbers with digit-based constraints (no-repeated-digit, sum-divisible-by-k) over ranges of 10^18.
- Competitive programming Olympiads (IOI, Codeforces, AtCoder) use digit DP as the canonical answer to "count integers in [L, R] with property P" where R is 10^18.
- Bioinformatics k-mer counting in dense numeric encodings of DNA windows uses digit-DP-like dynamic programs over base-4 representations to count k-mers with structural constraints.
- The standard tool for digit-property counting — any per-integer loop dies at R > 10^10, and digit DP cuts the work to O(D * states * 10) where D = 19 for 64-bit integers.

## intuition
The naive "iterate every integer in [L, R] and check P" is correct but infeasible — R can be 10^18, which is more than every CPU cycle since the Big Bang. Digit DP attacks the problem at the structural level: rather than enumerating integers, enumerate their decimal-digit prefixes and use DP to count how many suffixes complete each prefix into a valid number. Two range bounds are handled by inclusion-exclusion: `count_in_range(L, R) = count_up_to(R) - count_up_to(L - 1)`. So we reduce to counting integers in `[0, N]` satisfying P. Build the answer digit by digit, left to right. At each position the digit choice is constrained by whether the prefix built so far is "tight" — equal to N's prefix up to this position. If tight, the next digit can go from 0 up to N's digit at this position; choosing strictly less than that digit transitions out of tight (the suffix is now free to be any 0..9 sequence), choosing equal preserves tight. If not tight, every digit choice 0..9 is allowed. Alongside this, carry a property-specific state — running digit sum mod k, last digit chosen, count of a particular digit, parity of some count — whatever the constraint P needs. The DP key is `(pos, state, tight, started)`. The `started` flag handles properties that should ignore leading zeros (counting digit 4s should not count zeros prepended to "007"). The critical insight is that the `tight = false` subproblems do not depend on N at all — they are pure "count of length-D suffixes with state X satisfying P" — and the memo table caches them across all calls. Only the `tight = true` chain is unique to N, and that chain is at most D long. The deep skill is realizing that digit-position state is small (at most 19) and per-position state is also small (a few dozen values for typical P), so the table fits in memory and fills in microseconds.

## visualization
Counting integers in [0, 325] with digit sum divisible by 3. Position 0, digit choices 0..3. If we pick 3 (tight), recurse into position 1 with state = sum=3, tight=true, choices 0..2. If we pick 0,1,2 (loose), recurse with state = digit, tight=false, choices 0..9 at every later position. The "loose" subtree is independent of R and is the workhorse the memo table reuses.

## bruteForce
For each n in [L, R], compute the property and increment a counter. Trivial to write, correct, and infeasible: R up to 10^18 means 10^18 iterations. Acceptable only as a verifier for R at most 10^6 or so, useful for unit-testing the DP.

## optimal
Recursive `solve(pos, state, tight, started)` returning the count of valid suffixes for the current prefix. Base case: `pos == D` returns 1 if accumulated state satisfies P else 0. Recursive case: loop digit d from 0 to `tight ? digits[pos] : 9`, recurse with `new_tight = tight and d == cap`, `new_state = update(state, d)`, sum the returns. Memoize on `(pos, state, started)` when `tight = false` — those subproblems are independent of N and shared across the entire computation. Cap state space by working modulo k for sum constraints rather than tracking the raw sum. Total time is O(D * states * 10) and space is O(D * states), both well under a million operations for D <= 19 and typical state counts.

```python
from functools import lru_cache

def count_up_to(n, k):
    """Count integers in [0, n] whose digit value is divisible by k."""
    if n < 0:
        return 0
    digits = list(map(int, str(n)))
    D = len(digits)

    @lru_cache(maxsize=None)
    def solve(pos, rem, tight, started):
        if pos == D:
            return 1 if started and rem == 0 else 0
        cap = digits[pos] if tight else 9   # tight prefix constrains digit choice
        total = 0
        for d in range(cap + 1):
            new_started = started or d > 0  # ignore leading zeros for "started" flag
            new_rem = (rem * 10 + d) % k if new_started else 0
            total += solve(pos + 1, new_rem, tight and d == cap, new_started)
        return total
    return solve(0, 0, True, False)

def count_in_range(L, R, k):
    return count_up_to(R, k) - count_up_to(L - 1, k)
```

The `started` flag is essential for properties that ignore leading zeros — without it, counting "digit 4 appears" would credit "00004" as a four-digit appearance. The memo's effectiveness depends on caching only when `tight = false`; tight subproblems depend on N and are at most D-deep, so caching them gives no reuse and wastes memory. The `count_up_to(R) - count_up_to(L - 1)` inclusion-exclusion is the standard range-to-prefix reduction.

## complexity
time: O(D * S * 10) where D = #digits, S = #distinct states
space: O(D * S) memo (tight = false dimension is the one that gets cached)
notes: 19 digits * a few hundred states * 10 digit choices is well under a million operations — instant for any reasonable property.

## pitfalls
- Memoizing across the tight = true boundary — those subproblems depend on R and are not reusable. Cache only when tight = false (and usually only when started = true).
- Forgetting the `started` flag for properties that ignore leading zeros (e.g., "count of digit 4" should not count zeros prepended to small numbers).
- Off-by-one between f(R) and f(L) — the standard fix is f(R) - f(L - 1).
- Mis-encoding state: digit sum mod k is fine; raw digit sum up to D*9 = 171 is also fine; raw sum up to 10^18 is not.

## interviewTips
- Always state the recurrence in terms of (pos, state, tight, started) — interviewers want to see those four labels.
- Mention the f(R) - f(L - 1) reduction up front; otherwise people wonder how you handle the lower bound.
- Walk through one digit position by hand before coding — it pins down the memo key.
- Watch out for very long N as a string: read it as `string` and index its characters, not as `long long` plus manual digit extraction.

## code.python
```python
import sys
from functools import lru_cache
sys.setrecursionlimit(100000)

def count_up_to(n: int, k: int) -> int:
    if n < 0:
        return 0
    digits = list(map(int, str(n)))
    D = len(digits)

    @lru_cache(maxsize=None)
    def solve(pos: int, rem: int, tight: bool, started: bool) -> int:
        if pos == D:
            return 1 if started and rem == 0 else 0
        cap = digits[pos] if tight else 9
        total = 0
        for d in range(0, cap + 1):
            new_started = started or d > 0
            new_rem = (rem * 10 + d) % k if new_started else 0
            total += solve(pos + 1, new_rem, tight and d == cap, new_started)
        return total

    return solve(0, 0, True, False)

def count_in_range(L: int, R: int, k: int) -> int:
    return count_up_to(R, k) - count_up_to(L - 1, k)
```

## code.javascript
```javascript
function countUpTo(n, k) {
  if (n < 0n) return 0n;
  const digits = String(n).split('').map(Number);
  const D = digits.length;
  const memo = new Map();
  function solve(pos, rem, tight, started) {
    if (pos === D) return started && rem === 0 ? 1n : 0n;
    const key = tight ? -1 : pos * 1000 + rem * 2 + (started ? 1 : 0);
    if (!tight && memo.has(key)) return memo.get(key);
    const cap = tight ? digits[pos] : 9;
    let total = 0n;
    for (let d = 0; d <= cap; d++) {
      const ns = started || d > 0;
      const nr = ns ? (rem * 10 + d) % k : 0;
      total += solve(pos + 1, nr, tight && d === cap, ns);
    }
    if (!tight) memo.set(key, total);
    return total;
  }
  return solve(0, 0, true, false);
}

function countInRange(L, R, k) {
  return countUpTo(BigInt(R), k) - countUpTo(BigInt(L) - 1n, k);
}
```

## code.java
```java
int K;
int[] digits;
Long[][][][] memo;

long solve(int pos, int rem, int tight, int started) {
    if (pos == digits.length) return (started == 1 && rem == 0) ? 1L : 0L;
    if (tight == 0 && memo[pos][rem][0][started] != null) return memo[pos][rem][0][started];
    int cap = tight == 1 ? digits[pos] : 9;
    long total = 0;
    for (int d = 0; d <= cap; d++) {
        int ns = (started == 1 || d > 0) ? 1 : 0;
        int nr = ns == 1 ? (rem * 10 + d) % K : 0;
        int nt = (tight == 1 && d == cap) ? 1 : 0;
        total += solve(pos + 1, nr, nt, ns);
    }
    if (tight == 0) memo[pos][rem][0][started] = total;
    return total;
}

long countUpTo(long n, int k) {
    if (n < 0) return 0;
    String s = Long.toString(n);
    digits = new int[s.length()];
    for (int i = 0; i < s.length(); i++) digits[i] = s.charAt(i) - '0';
    K = k;
    memo = new Long[digits.length][k][1][2];
    return solve(0, 0, 1, 0);
}
```

## code.cpp
```cpp
int K;
vector<int> digits;
vector<vector<vector<long long>>> memo;

long long solve(int pos, int rem, int tight, int started) {
    if (pos == (int)digits.size()) return (started && rem == 0) ? 1 : 0;
    if (!tight && memo[pos][rem][started] != -1) return memo[pos][rem][started];
    int cap = tight ? digits[pos] : 9;
    long long total = 0;
    for (int d = 0; d <= cap; ++d) {
        int ns = (started || d > 0) ? 1 : 0;
        int nr = ns ? (rem * 10 + d) % K : 0;
        int nt = (tight && d == cap) ? 1 : 0;
        total += solve(pos + 1, nr, nt, ns);
    }
    if (!tight) memo[pos][rem][started] = total;
    return total;
}

long long countUpTo(long long n, int k) {
    if (n < 0) return 0;
    digits.clear();
    for (auto c : to_string(n)) digits.push_back(c - '0');
    K = k;
    memo.assign(digits.size(), vector<vector<long long>>(k, vector<long long>(2, -1)));
    return solve(0, 0, 1, 0);
}
```
