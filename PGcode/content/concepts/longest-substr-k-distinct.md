---
slug: longest-substr-k-distinct
module: arrays-searching
title: Longest Substring with K Distinct Characters
subtitle: Variable-size sliding window with a hashmap of character counts in O(n).
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Longest Substring with At Most K Distinct Characters — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/find-the-longest-substring-with-k-unique-characters-in-a-given-string/"
    type: blog
  - title: "Sliding Window — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/sparse-table.html"
    type: blog
  - title: "TheAlgorithms/Python — longest_substring.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/manacher.py"
    type: repo
status: published
---

## intro
Given a string `s` and an integer `k`, return the length of the longest substring that contains at most `k` distinct characters. The canonical sliding-window problem: a window expands while the invariant holds and contracts when it breaks. Mastering it makes "longest substring with at most two distinct," "fruit into baskets," and "longest repeating character replacement" trivial spin-offs.

## whyItMatters
This template ships in real systems: tokenizers limit the variety of characters per chunk, log aggregators cap the diversity per window, and many streaming algorithms need a "longest valid prefix" answer. The pattern — hash map of counts plus two indices — is the entry point to nearly every variable-size window problem on strings.

## intuition
Walk `right` through the string, adding each char to a frequency map. If the map's size exceeds `k`, slide `left` forward, decrementing counts and deleting keys that hit zero, until size is back to `k`. After each `right` advance, the current window length `right - left + 1` is a candidate answer; track the max.

## visualization
Take `s = "eceba"`, `k = 2`. r=0: window `e`, size 1, max 1. r=1: `ec`, size 2, max 2. r=2: `ece`, size 2, max 3. r=3: `eceb`, size 3 — shrink: drop `e` (count 2 -> 1), still 3 distinct; drop `e` again (count 1 -> 0, remove), size 2; window `ceb`, left=2, max stays 3. r=4: `ceba`, size 3 — shrink: drop `c`, size 2; window `eba`, max stays 3. Answer: 3.

## bruteForce
Two nested loops: fix the left, expand the right until the distinct count exceeds `k`, record the length, restart. O(n^2) time, O(k) space. Correct but wasteful — the right pointer rewinds every time the left advances, doubling work.

## optimal
Two pointers and a hash map of character counts. The map's `size()` is the distinct count. Right always moves forward; left advances only when the invariant breaks. Each character is added once and removed at most once, so total work is O(n). The answer is the largest `right - left + 1` seen during the walk. Using an int array of size 128 (ASCII) is faster than a hash map when the alphabet is small.

## complexity
time: O(n)
space: O(k) for the frequency map (or O(1) for a fixed 128-size ASCII array)
notes: For Unicode the map keys are code points and the space stays O(k). The dual problem "exactly k distinct" reduces to "at most k" minus "at most k-1".

## pitfalls
- Forgetting to delete map entries that hit zero — `map.size()` then over-counts and the window never shrinks correctly.
- Updating `max` only inside the shrink loop — you miss the windows that never triggered a shrink.
- Confusing "at most k" with "exactly k" — they differ by one subtraction, but interviewers do ask the strict version.
- Mishandling k = 0 — define and return 0 explicitly; the loop logic would otherwise loop forever.

## interviewTips
- State "at most" vs "exactly" up front; ask which the interviewer means if the prompt is ambiguous.
- Walk through a 5-character example before coding — the shrink condition (`while map.size > k`) is the rule the interviewer wants you to articulate.
- For follow-ups, "exactly k distinct" = `atMostK(s, k) - atMostK(s, k-1)`. Mentioning this earns the variants points for free.

## code.python
```python
def longest_substring_k_distinct(s, k):
    if k == 0: return 0
    count = {}
    left = best = 0
    for right, c in enumerate(s):
        count[c] = count.get(c, 0) + 1
        while len(count) > k:
            count[s[left]] -= 1
            if count[s[left]] == 0:
                del count[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best
```

## code.javascript
```javascript
function longestSubstringKDistinct(s, k) {
  if (k === 0) return 0;
  const count = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    count.set(c, (count.get(c) || 0) + 1);
    while (count.size > k) {
      const lc = s[left];
      count.set(lc, count.get(lc) - 1);
      if (count.get(lc) === 0) count.delete(lc);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

## code.java
```java
public int longestSubstringKDistinct(String s, int k) {
    if (k == 0) return 0;
    Map<Character, Integer> count = new HashMap<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        count.merge(c, 1, Integer::sum);
        while (count.size() > k) {
            char lc = s.charAt(left);
            if (count.merge(lc, -1, Integer::sum) == 0) count.remove(lc);
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

## code.cpp
```cpp
int longestSubstringKDistinct(string s, int k) {
    if (k == 0) return 0;
    unordered_map<char, int> count;
    int left = 0, best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        count[s[right]]++;
        while ((int)count.size() > k) {
            if (--count[s[left]] == 0) count.erase(s[left]);
            left++;
        }
        best = max(best, right - left + 1);
    }
    return best;
}
```
