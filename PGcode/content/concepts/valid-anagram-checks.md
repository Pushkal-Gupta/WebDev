---
slug: valid-anagram-checks
module: hashing
title: Valid Anagram Checks
subtitle: Frequency counter vs sort — when each strategy wins and how to scale to Unicode.
difficulty: Beginner
position: 1
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Check Whether Two Strings Are Anagram — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/check-whether-two-strings-are-anagram-of-each-other/"
    type: blog
  - title: "Hashing — cp-algorithms"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "TheAlgorithms/Python — anagram.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/anagrams.py"
    type: repo
status: published
---

## intro
Two strings are anagrams if one is a permutation of the other — same multiset of characters, possibly different order. The interview question is the simplest hashing warm-up: "given `s` and `t`, return whether they are anagrams." Two textbook answers exist: sort both strings and compare, or count character frequencies and compare counters. Each wins under different constraints.

## whyItMatters
Anagram checking is a stepping stone to "group anagrams," "find all anagrams in a string," and "minimum window containing anagrams of a pattern." Knowing why the counter version is preferred — and how to extend it past ASCII into Unicode — is the foundation for every counting-based string problem that follows.

## intuition
If two strings have the same length and the same count of each character, they are anagrams. The frequency-counter approach builds two such histograms (or one with positive and negative increments) and compares. The sort approach instead canonicalises both strings to "sorted character order" and compares; equality of the sorted forms implies equality of multisets.

## visualization
Take `s = "listen"`, `t = "silent"`. Counter for `s`: `{l:1, i:1, s:1, t:1, e:1, n:1}`. Counter for `t`: identical. Equal — anagram. Sort approach: `"eilnst"` vs `"eilnst"`. Equal — anagram. For `s = "rat"`, `t = "car"`: counters `{r:1, a:1, t:1}` vs `{c:1, a:1, r:1}` — not equal, return false. Sort: `"art"` vs `"acr"` — not equal.

## bruteForce
Pick one of the two methods and call it brute by comparison to the optimised counter trick. The "really brute" check — for each char in `s`, find and delete the first match in `t` — is O(n^2) and re-creates `t` each time; useful as a teaching contrast, never as a real answer.

## optimal
Single pass with a length-26 int array (lowercase ASCII assumption): increment for each char in `s`, decrement for each char in `t`, return true iff all counts are zero. For Unicode, swap the fixed array for a hash map keyed by the Unicode code point. Skip the histogram and short-circuit `false` if `len(s) != len(t)`.

## complexity
time: O(n) for counter, O(n log n) for sort
space: O(1) for the 26-element ASCII array (O(k) for k distinct chars in the Unicode case)
notes: Counter wins on speed; sort wins on simplicity and zero auxiliary structures. On very long strings the difference is real (log-factor advantage).

## pitfalls
- Skipping the length check — counter logic still works, but you waste a full traversal on obviously-different inputs.
- Hard-coding `[a-z]` and silently failing on uppercase, digits, or Unicode — clarify the alphabet up front.
- Comparing `.toLowerCase()` then forgetting the cost — that's an extra O(n) pass; fine, but acknowledge it.
- Building two maps and iterating one to compare — equivalent but uses 2x memory; one signed counter is leaner.

## interviewTips
- Ask "case-sensitive? whitespace? Unicode?" before writing code — clarifying assumptions is a free signal.
- Mention both methods and choose the counter version, explaining the time-vs-simplicity tradeoff.
- For Unicode, `code = char.codePointAt(0)` (JS) or iterate `chars()` (Java) — surrogate pairs are the trap most candidates miss.

## code.python
```python
def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = [0] * 26
    for cs, ct in zip(s, t):
        count[ord(cs) - 97] += 1
        count[ord(ct) - 97] -= 1
    return all(c == 0 for c in count)

def is_anagram_unicode(s, t):
    if len(s) != len(t):
        return False
    from collections import Counter
    return Counter(s) == Counter(t)
```

## code.javascript
```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every(c => c === 0);
}

function isAnagramUnicode(s, t) {
  if (s.length !== t.length) return false;
  const m = new Map();
  for (const c of s) m.set(c, (m.get(c) || 0) + 1);
  for (const c of t) {
    if (!m.has(c)) return false;
    m.set(c, m.get(c) - 1);
    if (m.get(c) === 0) m.delete(c);
  }
  return m.size === 0;
}
```

## code.java
```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }
    for (int c : count) if (c != 0) return false;
    return true;
}

public boolean isAnagramUnicode(String s, String t) {
    if (s.length() != t.length()) return false;
    Map<Integer, Integer> m = new HashMap<>();
    s.codePoints().forEach(cp -> m.merge(cp, 1, Integer::sum));
    for (int cp : (Iterable<Integer>) () -> t.codePoints().iterator()) {
        Integer v = m.get(cp);
        if (v == null) return false;
        if (v == 1) m.remove(cp); else m.put(cp, v - 1);
    }
    return m.isEmpty();
}
```

## code.cpp
```cpp
bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    int count[26] = {0};
    for (int i = 0; i < (int)s.size(); i++) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }
    for (int c : count) if (c != 0) return false;
    return true;
}

bool isAnagramUnicode(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    unordered_map<char, int> m;
    for (char c : s) m[c]++;
    for (char c : t) {
        if (--m[c] < 0) return false;
    }
    return true;
}
```
