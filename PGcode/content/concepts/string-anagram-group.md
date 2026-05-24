---
slug: string-anagram-group
module: hashing
title: Group Anagrams
subtitle: Bucket strings by a canonical key — sorted characters or a fixed-length count tuple.
difficulty: Beginner
position: 1
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Symbol Tables"
    url: "https://algs4.cs.princeton.edu/31elementary/"
    type: book
  - title: "Given a sequence of words, print all anagrams together — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/given-a-sequence-of-words-print-all-anagrams-together/"
    type: blog
  - title: "TheAlgorithms/Python — anagrams.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/anagrams.py"
    type: repo
status: published
---

## intro
Two strings are anagrams when they contain the same multiset of characters — "eat", "tea", and "ate" are anagrams; "eat" and "eats" are not. Group Anagrams asks you to partition a list of strings into anagram classes. The trick is to define a canonical key that every string in a class maps to, then bucket by that key.

## whyItMatters
This is the prototypical "hash by canonical form" problem. The same idea appears whenever you want to group equivalent items: isomorphic strings, equivalent expressions, similar shapes after normalization. Picking a good canonical key — fast to compute, deterministic, collision-free — is one of the most reusable design skills in algorithm work. Anagram grouping is also a classic interview screener for understanding hash-map performance trade-offs.

## intuition
Every string in an anagram class shares two invariants: the same multiset of characters and the same length. Sort the characters and you get a single string that uniquely identifies the class. Or count each of the 26 lowercase letters and use that 26-tuple as the key. Either way, a single pass over the input groups everything in linear-plus-key-cost time.

## visualization
Input ["eat","tea","tan","ate","nat","bat"]. Sort each: "aet","aet","ant","aet","ant","abt". Group: "aet" → ["eat","tea","ate"], "ant" → ["tan","nat"], "abt" → ["bat"]. Three classes. The count-tuple version would produce keys like (1,0,0,0,1,0,...,1,...) but groups identically.

## bruteForce
For each pair of strings, check whether they are anagrams (sort and compare, or count and compare), then union them via Union-Find. That is O(n^2 * k log k) where k is the average string length — fine for n ≤ 50, completely wrong for n = 10,000. Worse, the code is more complex than the hash approach.

## optimal
Iterate the input once. For each string, compute a canonical key — either `''.join(sorted(s))` (O(k log k)) or a tuple of 26 character counts (O(k)) — and append the string to a dictionary bucket keyed by that canonical form. Return the dictionary's values. The count-tuple key is asymptotically faster but the sorted-string key has lower constants for small k.

## complexity
time: O(n * k log k) with sorted-string key, O(n * k) with count-tuple key
space: O(n * k) for the bucket map
notes: n strings of average length k. The sorted-string key trades a log factor for cleaner code; on typical interview inputs (k ≤ 100) the difference is negligible. Hash collisions in the count-tuple version are zero because the tuple has a fixed shape.

## pitfalls
- Treating uppercase and lowercase letters as different when the prompt is case-insensitive — normalize first.
- Building a list of 26 ints as the key and forgetting to convert it to a tuple in Python — lists are unhashable.
- Using a sorted-bytes key for unicode strings — multi-byte characters need different handling; sort by codepoint instead.
- Returning the dictionary instead of its values when the spec asks for a list of lists.

## interviewTips
- State both key choices and pick one: "sorted-string is one line; count-tuple shaves a log factor — I'll go with sorted-string for clarity unless k is large."
- For lowercase-only inputs, hint at the prime-product hash (assign primes 2..101 to a..z, multiply) as a math curiosity — it's elegant but overflows past k ≈ 15.
- For Valid Anagram (the two-string version), the same count-tuple comparison answers the question in O(k).

## code.python
```python
from collections import defaultdict

def group_anagrams(strs):
    buckets = defaultdict(list)
    for s in strs:
        key = ''.join(sorted(s))
        buckets[key].append(s)
    return list(buckets.values())

def group_anagrams_count(strs):
    buckets = defaultdict(list)
    for s in strs:
        counts = [0] * 26
        for ch in s:
            counts[ord(ch) - ord('a')] += 1
        buckets[tuple(counts)].append(s)
    return list(buckets.values())
```

## code.javascript
```javascript
function groupAnagrams(strs) {
  const buckets = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(s);
  }
  return [...buckets.values()];
}

function groupAnagramsCount(strs) {
  const buckets = new Map();
  for (const s of strs) {
    const counts = new Array(26).fill(0);
    for (const ch of s) counts[ch.charCodeAt(0) - 97]++;
    const key = counts.join(',');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(s);
  }
  return [...buckets.values()];
}
```

## code.java
```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> buckets = new HashMap<>();
    for (String s : strs) {
        char[] arr = s.toCharArray();
        Arrays.sort(arr);
        String key = new String(arr);
        buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(buckets.values());
}

public List<List<String>> groupAnagramsCount(String[] strs) {
    Map<String, List<String>> buckets = new HashMap<>();
    for (String s : strs) {
        int[] counts = new int[26];
        for (char ch : s.toCharArray()) counts[ch - 'a']++;
        String key = Arrays.toString(counts);
        buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(buckets.values());
}
```

## code.cpp
```cpp
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> buckets;
        for (const auto& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            buckets[key].push_back(s);
        }
        vector<vector<string>> res;
        for (auto& [k, v] : buckets) res.push_back(move(v));
        return res;
    }

    vector<vector<string>> groupAnagramsCount(vector<string>& strs) {
        unordered_map<string, vector<string>> buckets;
        for (const auto& s : strs) {
            string key(26, 'a');
            for (char ch : s) key[ch - 'a']++;
            buckets[key].push_back(s);
        }
        vector<vector<string>> res;
        for (auto& [k, v] : buckets) res.push_back(move(v));
        return res;
    }
};
```
