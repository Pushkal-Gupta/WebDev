---
slug: digit-dp
module: dp-advanced
title: Digit DP
subtitle: Count numbers in [L, R] satisfying digit-based predicates in O(log R · alphabet · states) — even for R = 10^18.
difficulty: Advanced
position: 16
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 14: Dynamic Programming (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap14/"
    type: book
  - title: "TopCoder — Dynamic Programming: From Novice to Advanced"
    url: "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
"How many integers in [L, R] satisfy property P about their digits?" When R can be 10^18, you can't enumerate. Digit DP walks the digits of R left-to-right, tracking just enough state (position, tight-to-upper-bound flag, the predicate's running state) to enumerate all valid numbers in **O(log R · 10 · states)** time.

## whyItMatters
Comes up directly in:
- **Count numbers in [L, R] with property X** — sum of digits ≤ k, no two adjacent equal digits, no substring "13", digit product even, etc.
- **Range digit-related sums** — total sum of (sum of digits of x) for x in [L, R].
- **Beatty sequences and other digit-based generations**.

These are all impossible with brute enumeration once R exceeds ~10^7. Digit DP is the canonical tool — every competitive coder writes ~10 of these in a year.

## intuition
You're filling the digits of a number `d_0 d_1 … d_(k-1)` one position at a time. At position i, you have:
- A **tight flag**: are we still glued to the upper bound (R)? If yes, the next digit can be at most R's i-th digit; if no, it can be 0-9.
- A **leading-zero flag** (sometimes folded into tight): whether we've placed a nonzero digit yet.
- **Predicate state**: whatever extra info P requires (digit sum mod k, last digit seen, count of 7s so far).

`count(L, R) = f(R) - f(L - 1)` where `f(N) = (count of valid x in [0, N])`. So you only need a function that counts up to N.

## visualization
```
N = 132 (digits "132")

position 0:
  tight = true → can place 0, 1 (if tight stays for 1)
  placing 0: tight becomes false (we're now < 1**), free to place 0-9 below
  placing 1: tight stays true, must place ≤ 3 next

position 1 (after placing 1):
  tight = true → can place 0-3
  ...

Recursion explores all branches; memo keys = (position, tight, predicate state).
```

## bruteForce
Loop `x` from 0 to N, check `valid(x)`. O(N). Dies at N = 10^9+.

## optimal
Template (counting numbers in [0, N] with digit-sum exactly S):
```
def count_with_digit_sum(N, S):
    digits = str(N)
    n = len(digits)

    @lru_cache(maxsize=None)
    def dp(pos, sum_so_far, tight):
        if pos == n: return 1 if sum_so_far == S else 0
        limit = int(digits[pos]) if tight else 9
        total = 0
        for d in range(0, limit + 1):
            if sum_so_far + d > S: break       # prune
            total += dp(pos + 1, sum_so_far + d, tight and (d == limit))
        return total

    return dp(0, 0, True)

# count in [L, R] = count_with_digit_sum(R, S) - count_with_digit_sum(L - 1, S)
```

For more complex predicates, expand the state:
- "no two adjacent equal digits" → state includes last digit placed.
- "no substring 13" → state is an Aho-Corasick / KMP-style automaton position.
- "digit sum divisible by k" → state is current sum mod k.

The number of states is `len(N) · 2 · |predicate_state|` — typically a few hundred at most.

## complexity
- **Time**: O(log_{10}(N) · 10 · |predicate state|) per query.
- **Space**: O(states) for the memo table.
- **Two calls** for a range query `f(R) - f(L-1)`.

## pitfalls
- **Range vs prefix**: digit DP naturally counts `[0, N]`. Convert to `[L, R]` via subtraction.
- **Leading zeros**: depending on the predicate (e.g., "first digit must be nonzero"), you need an extra "started" flag.
- **Tight-flag interaction**: once `d < limit`, future positions are NOT tight. Easy to forget the `tight and (d == limit)` propagation.
- **Overflow in counts**: counts can reach ~10^17 for big N; use 64-bit integers.
- **Memoization key including tight**: many state combinations are tight=False, where the memo is reusable. tight=True states might not reuse across queries.

## interviewTips
- The trigger: "count integers in [L, R] with digit-pattern X" — and R is huge.
- Walk through the state vector before writing code: position, tight, predicate state.
- Be explicit about `f(R) - f(L - 1)` decomposition.
- For senior interviews, mention **digit DP on bit representations** (similar technique on binary digits — useful for problems involving XOR or bit-count predicates).

## code.python
```python
from functools import lru_cache

def count_with_digit_sum(N, target):
    if N < 0: return 0
    digits = list(map(int, str(N)))
    n = len(digits)

    @lru_cache(maxsize=None)
    def dp(pos, s, tight):
        if pos == n: return int(s == target)
        limit = digits[pos] if tight else 9
        total = 0
        for d in range(limit + 1):
            if s + d > target: break
            total += dp(pos + 1, s + d, tight and d == limit)
        return total

    return dp(0, 0, True)

def count_range(L, R, target):
    return count_with_digit_sum(R, target) - count_with_digit_sum(L - 1, target)

print(count_range(1, 1000, 5))    # numbers in [1,1000] with digit sum 5
```

## code.javascript
```javascript
function countDigitSum(N, target) {
  if (N < 0) return 0;
  const d = [...String(N)].map(Number);
  const n = d.length;
  const memo = new Map();
  function dp(pos, s, tight) {
    if (pos === n) return s === target ? 1 : 0;
    const key = pos * 10000 + s * 2 + (tight ? 1 : 0);
    if (memo.has(key)) return memo.get(key);
    const limit = tight ? d[pos] : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (s + x > target) break;
      total += dp(pos + 1, s + x, tight && x === limit);
    }
    memo.set(key, total); return total;
  }
  return dp(0, 0, true);
}
```

## code.java
```java
import java.util.*;
class DigitDP {
    int[] d; int n; int target;
    Map<Long, Long> memo = new HashMap<>();
    long count(long N, int target) {
        if (N < 0) return 0;
        this.target = target;
        String s = String.valueOf(N);
        d = new int[s.length()]; n = s.length(); memo.clear();
        for (int i = 0; i < n; i++) d[i] = s.charAt(i) - '0';
        return dp(0, 0, true);
    }
    long dp(int pos, int sum, boolean tight) {
        if (pos == n) return sum == target ? 1 : 0;
        long key = ((long) pos * 200 + sum) * 2 + (tight ? 1 : 0);
        if (memo.containsKey(key)) return memo.get(key);
        int limit = tight ? d[pos] : 9;
        long total = 0;
        for (int x = 0; x <= limit; x++) {
            if (sum + x > target) break;
            total += dp(pos + 1, sum + x, tight && x == limit);
        }
        memo.put(key, total);
        return total;
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <map>
struct DigitDP {
    std::vector<int> d;
    int n, target;
    std::map<long long, long long> memo;
    long long count(long long N, int t) {
        if (N < 0) return 0;
        target = t; memo.clear();
        std::string s = std::to_string(N);
        n = s.size(); d.assign(n, 0);
        for (int i = 0; i < n; i++) d[i] = s[i] - '0';
        return dp(0, 0, true);
    }
    long long dp(int pos, int sum, bool tight) {
        if (pos == n) return sum == target ? 1 : 0;
        long long key = ((long long) pos * 200 + sum) * 2 + (tight ? 1 : 0);
        auto it = memo.find(key);
        if (it != memo.end()) return it->second;
        int limit = tight ? d[pos] : 9;
        long long total = 0;
        for (int x = 0; x <= limit; x++) {
            if (sum + x > target) break;
            total += dp(pos + 1, sum + x, tight && x == limit);
        }
        return memo[key] = total;
    }
};
```
