---
slug: string-decode-ways
module: dp
title: Decode Ways
subtitle: Count ways to decode a digit string under "1=A ... 26=Z" — linear DP with one or two predecessors.
difficulty: Intermediate
position: 22
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.1/"
    type: book
  - title: "Count number of ways to decode a digit string — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/count-possible-decodings-given-digit-sequence/"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/word_break.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/word_break.py"
    type: repo
status: published
---

## intro
Given a string of digits, count the number of ways to decode it under the mapping 1→A, 2→B, ..., 26→Z. "12" can split as "1, 2" (AB) or "12" (L), so it has 2 decodings. The problem is a classic linear DP that boils down to: at each index, how many decodings end here, given that the previous one or two digits formed a valid letter?

## whyItMatters
This is one of the cleanest examples of "DP over a string with a small lookback." The recurrence is the same shape as climbing-stairs (dp[i] = dp[i-1] + dp[i-2]) but each summand is *gated* by validity checks. Once you internalize the pattern — "DP state = number of decodings ending at i; transitions add dp[i-1] if last digit is valid, dp[i-2] if last two digits form a valid pair" — you can knock out word-break, palindrome-partitioning-counting, and similar problems on autopilot.

## intuition
Walk left to right. At position i, ask two questions: (1) Does the single digit s[i] decode? It does iff s[i] is '1' through '9' (zero is not a letter). If yes, all dp[i-1] decodings extend by one more letter. (2) Does the two-digit chunk s[i-1..i] decode? It does iff it's "10" through "26." If yes, all dp[i-2] decodings extend by one more letter. Sum the two contributions.

## visualization
Input "226". dp[0] = 1 (empty prefix). i=1 (digit '2'): single '2' valid → dp[1] += dp[0] = 1. i=2 (digit '2'): single '2' valid → dp[2] += dp[1] = 1; pair "22" valid → dp[2] += dp[0] = 1; total 2. i=3 (digit '6'): single '6' valid → dp[3] += dp[2] = 2; pair "26" valid → dp[3] += dp[1] = 1; total 3. Answer: 3 — (BBF, BZ, VF).

## bruteForce
Recursive backtracking that, at each index, branches into "take one digit" and (when valid) "take two digits," counting leaves. Without memoization this is O(2^n) — fine to mention as the natural recursion, but obviously infeasible past ~30 characters. Add memo and you reach the same complexity as the tabulated DP.

## optimal
1D DP of length n+1 where dp[i] = number of decodings of s[0..i-1]. Base: dp[0] = 1 (empty string has one decoding — the empty sequence). Transition for i ≥ 1: if s[i-1] ≠ '0', dp[i] += dp[i-1]. For i ≥ 2, if the two-digit number formed by s[i-2..i-1] is between 10 and 26 inclusive, dp[i] += dp[i-2]. Final answer is dp[n]. Space is trivially compressed to two rolling integers.

## complexity
time: O(n)
space: O(1) with rolling variables; O(n) for a clear tabulated array
notes: Each index does constant work — two if-checks and at most two additions. The space optimization keeps only `prev2` and `prev1` and is the form you'd submit in an interview after explaining the array version.

## pitfalls
- Treating '0' as a valid single digit — it's not. Only the pair "10" or "20" rescues a zero.
- Forgetting that pairs above "26" are invalid: "27" splits only as "2, 7."
- Empty-string and leading-zero handling: s = "0" → 0 ways; s = "06" → 0 ways. The dp[0] = 1 base must be paired with explicit gates.
- Off-by-one in the rolling-variable version: `prev1` corresponds to dp[i-1] and `prev2` to dp[i-2]; updating them in the wrong order silently corrupts subsequent values.

## interviewTips
- Open with the climbing-stairs analogy and then qualify: "but each transition is gated by validity."
- Walk through "12" → 2, "10" → 1, "100" → 0 on the whiteboard before coding — these three cases catch every common mistake.
- Mention the rolling O(1) space optimization explicitly after the O(n) version is on the board; interviewers like to see that you can compress when needed.

## code.python
```python
def num_decodings(s):
    n = len(s)
    if n == 0 or s[0] == '0':
        return 0
    prev2, prev1 = 1, 1
    for i in range(2, n + 1):
        cur = 0
        if s[i - 1] != '0':
            cur += prev1
        two = int(s[i - 2:i])
        if 10 <= two <= 26:
            cur += prev2
        prev2, prev1 = prev1, cur
    return prev1
```

## code.javascript
```javascript
function numDecodings(s) {
  const n = s.length;
  if (n === 0 || s[0] === '0') return 0;
  let prev2 = 1, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    let cur = 0;
    if (s[i - 1] !== '0') cur += prev1;
    const two = Number(s.substring(i - 2, i));
    if (two >= 10 && two <= 26) cur += prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}
```

## code.java
```java
public int numDecodings(String s) {
    int n = s.length();
    if (n == 0 || s.charAt(0) == '0') return 0;
    int prev2 = 1, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int cur = 0;
        if (s.charAt(i - 1) != '0') cur += prev1;
        int two = Integer.parseInt(s.substring(i - 2, i));
        if (two >= 10 && two <= 26) cur += prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

## code.cpp
```cpp
int numDecodings(string s) {
    int n = s.size();
    if (n == 0 || s[0] == '0') return 0;
    int prev2 = 1, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int cur = 0;
        if (s[i - 1] != '0') cur += prev1;
        int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
        if (two >= 10 && two <= 26) cur += prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```
