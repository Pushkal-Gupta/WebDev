---
slug: string-min-window-substring
module: sorting-strings
title: Minimum Window Substring
subtitle: Shortest substring of S that contains every character of T — sliding window with a "needed" counter.
difficulty: Advanced
position: 17
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sliding Window — cp-algorithms (sliding window minimum)"
    url: "https://cp-algorithms.com/data_structures/sliding_window_minimum.html"
    type: blog
  - title: "Smallest window in a String containing all characters of other String — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/smallest-window-string-containing-characters-string/"
    type: blog
  - title: "TheAlgorithms/Python — strings/min_cost_string_conversion.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/min_cost_string_conversion.py"
    type: repo
status: published
---

## intro
Given strings S and T, find the shortest contiguous substring of S that contains every character of T (with multiplicities). If no such window exists, return the empty string. This is the canonical "two-pointer sliding window with frequency counts" problem — and once you've solved it, a dozen sliding-window variants follow the same template.

## whyItMatters
The two-pointer sliding window with character counts is one of the highest-leverage patterns in interview prep: it solves longest-substring-without-repeats, longest-substring-with-at-most-k-distinct, permutation-in-string, find-all-anagrams, and many more. Min-window is the hardest member of that family — getting it right means you've internalized the pattern's invariants instead of memorizing one specific solution.

## intuition
Maintain two pointers l ≤ r marking a window into S. Advance r to "absorb" characters until the window contains all of T. Then advance l to "shrink" the window as long as it still contains all of T, recording the smallest window seen. Repeat. The work is O(|S|) because each pointer only moves forward.

## visualization
S = "ADOBECODEBANC", T = "ABC". Expand r: window grows to "ADOBEC" — contains A, B, C — record length 6. Shrink l: "DOBEC" still has B, C but no A — break. Expand r: "DOBECODEBA" — contains A, B, C — record length 10, no improvement. Shrink l: drop D, drop O, drop B... eventually "BANC" remains — length 4 — record. Final answer "BANC."

## bruteForce
Enumerate every (l, r) pair (O(n^2) windows) and for each, check whether the substring contains all characters of T (O(|T|) or O(|S|) per check). Total O(n^2 · |T|) — works only for very small inputs. Demonstrates the problem but is rejected immediately in any real interview.

## optimal
Build a frequency map `need` from T and an integer `missing = len(T)` representing how many characters (counted with multiplicity) we still need. Expand r: each time you absorb a character that the window still needs (i.e., `need[c] > 0`), decrement `missing`. When `missing == 0` the window is valid: record its length, then shrink l, undoing each step — if removing a character pushes `need[c]` above 0, increment `missing`. Continue until r reaches the end.

## complexity
time: O(|S| + |T|)
space: O(Σ) where Σ is the alphabet size (effectively constant for ASCII)
notes: Each character in S is visited at most twice — once by r, once by l. The need map is fixed-size for a bounded alphabet. The `missing` integer is the trick that turns "is the window valid?" from O(Σ) into O(1).

## pitfalls
- Updating `missing` only when `need[c] >= 1` before the decrement, not after — off-by-one bugs.
- Forgetting that T can contain duplicate characters: "AABC" requires the window to contain two A's, one B, one C.
- Tracking "characters seen" without multiplicities — works for permutation problems but not here.
- Returning the first valid window instead of the minimum — keep updating the answer every time the window is valid.
- Not handling |S| < |T| as a fast no-answer return.

## interviewTips
- Walk through the algorithm verbally with S = "ADOBECODEBANC", T = "ABC" before coding — it makes the shrink phase concrete.
- Name the invariant explicitly: "When missing == 0, the window contains all required characters; we shrink while preserving that."
- Mention that swapping the shrink condition gives you the longest-substring-with-at-most-k-distinct template for free — interviewers love that pattern recognition.

## code.python
```python
from collections import Counter

def min_window(s, t):
    if not s or not t or len(s) < len(t):
        return ""
    need = Counter(t)
    missing = len(t)
    l = 0
    best_l, best_len = 0, float('inf')
    for r, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if r - l + 1 < best_len:
                best_len = r - l + 1
                best_l = l
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1
            l += 1
    return "" if best_len == float('inf') else s[best_l:best_l + best_len]
```

## code.javascript
```javascript
function minWindow(s, t) {
  if (!s || !t || s.length < t.length) return "";
  const need = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  let missing = t.length;
  let l = 0, bestL = 0, bestLen = Infinity;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if ((need[c] || 0) > 0) missing--;
    need[c] = (need[c] || 0) - 1;
    while (missing === 0) {
      if (r - l + 1 < bestLen) {
        bestLen = r - l + 1;
        bestL = l;
      }
      const lc = s[l];
      need[lc]++;
      if (need[lc] > 0) missing++;
      l++;
    }
  }
  return bestLen === Infinity ? "" : s.substring(bestL, bestL + bestLen);
}
```

## code.java
```java
public String minWindow(String s, String t) {
    if (s == null || t == null || s.length() < t.length()) return "";
    int[] need = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    int missing = t.length();
    int l = 0, bestL = 0, bestLen = Integer.MAX_VALUE;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (need[c] > 0) missing--;
        need[c]--;
        while (missing == 0) {
            if (r - l + 1 < bestLen) {
                bestLen = r - l + 1;
                bestL = l;
            }
            char lc = s.charAt(l);
            need[lc]++;
            if (need[lc] > 0) missing++;
            l++;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
}
```

## code.cpp
```cpp
string minWindow(string s, string t) {
    if (s.empty() || t.empty() || s.size() < t.size()) return "";
    vector<int> need(128, 0);
    for (char c : t) need[(unsigned char)c]++;
    int missing = t.size();
    int l = 0, bestL = 0;
    int bestLen = INT_MAX;
    for (int r = 0; r < (int)s.size(); r++) {
        unsigned char c = s[r];
        if (need[c] > 0) missing--;
        need[c]--;
        while (missing == 0) {
            if (r - l + 1 < bestLen) {
                bestLen = r - l + 1;
                bestL = l;
            }
            unsigned char lc = s[l];
            need[lc]++;
            if (need[lc] > 0) missing++;
            l++;
        }
    }
    return bestLen == INT_MAX ? "" : s.substr(bestL, bestLen);
}
```
