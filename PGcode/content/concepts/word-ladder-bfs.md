---
slug: word-ladder-bfs
module: graphs
title: Word Ladder (BFS on an Implicit Graph)
subtitle: Treat every word as a vertex, every one-letter swap as an edge, and BFS gives the shortest transformation length.
difficulty: Intermediate
position: 43
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Graphs"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "GeeksforGeeks — Word Ladder (BFS)"
    url: "https://www.geeksforgeeks.org/word-ladder-length-of-shortest-chain-to-reach-a-target-word/"
    type: blog
  - title: "TheAlgorithms/Python — graphs/breadth_first_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/breadth_first_search.py"
    type: repo
status: published
---

## intro
Given a `beginWord`, an `endWord`, and a dictionary, transform `beginWord` into `endWord` one letter at a time, where every intermediate word must be in the dictionary. Return the length of the shortest transformation sequence, or 0 if impossible. The graph is implicit: vertices are words, edges connect any two dictionary words that differ by exactly one letter. Shortest-path-in-an-unweighted-graph means BFS. The only real engineering is making neighbor generation fast — the naive O(N²·L) pairwise comparison is the killer that fails large dictionaries.

## whyItMatters
"Define the graph implicitly, then BFS" is one of the most powerful interview patterns. It applies to sliding-puzzle solvers (state graph of board configurations), Rubik's cube solvers, word-transform problems, minimum-knight-moves on a chessboard, and "minimum number of jumps" variants. The wildcard-pattern trick used here for fast neighbor lookup also reappears in Levenshtein-1 spell correction and DNA k-mer indexing.

## intuition
Two words are neighbors iff they differ by exactly one letter. Compare every pair: O(N²·L). Too slow for N = 10⁴, L = 10.

The fix is precomputing a *pattern index*. For each dictionary word, generate every "wildcard" form by replacing one letter with `*`. Group words by pattern:

```
   word "hot" -> patterns "*ot", "h*t", "ho*"
   word "dot" -> patterns "*ot", "d*t", "do*"
   "hot" and "dot" share pattern "*ot" -> they are neighbors
```

Then BFS from `beginWord`. At each step, for the current word generate its L patterns and look up `patternMap[pattern]` — every word in that list is a neighbor.

Cost: building the pattern map is O(N·L²). BFS visits each word once. Lookup per step is O(L) patterns times O(group size). In aggregate the entire algorithm is O(N·L²).

## walkthroughExample
Dictionary: `["hot", "dot", "dog", "lot", "log", "cog"]`. `beginWord = "hit"`, `endWord = "cog"`.

Pattern map (words grouped by wildcarded pattern):
```
   *ot  -> [hot, dot, lot]
   *og  -> [dog, log, cog]
   h*t  -> [hit, hot]
   d*t  -> [dot]
   d*g  -> [dog]
   l*t  -> [lot]
   l*g  -> [log]
   c*g  -> [cog]
   ho*  -> [hot]
   do*  -> [dot, dog]
   lo*  -> [lot, log]
   co*  -> [cog]
   hi*  -> [hit]
```

BFS from "hit", distance = 1:
```
   level 1: { hit }                            (distance 1)
       patterns of hit: *it, h*t, hi*
           *it -> nothing new
           h*t -> {hit (self), hot}            new: hot
           hi* -> {hit (self)}                 nothing new
   level 2: { hot }                            (distance 2)
       patterns of hot: *ot, h*t, ho*
           *ot -> {hot (visited), dot, lot}   new: dot, lot
   level 3: { dot, lot }                       (distance 3)
       patterns of dot -> *ot, d*t, do*
           do* -> {dot (visited), dog}        new: dog
       patterns of lot -> *ot, l*t, lo*
           lo* -> {lot (visited), log}        new: log
   level 4: { dog, log }                       (distance 4)
       patterns of dog -> *og, d*g, do*
           *og -> {dog (visited), log (visited), cog}   new: cog  <- target!
   answer: 5    (sequence length includes beginWord and endWord)
```

The chain `hit -> hot -> dot -> dog -> cog` has length 5 (or `hit -> hot -> lot -> log -> cog`, also length 5).

## visualization
Snapshot 1 — implicit graph induced by the dictionary:
```
            hit
             |
            hot
           /   \
         dot    lot
          |      |
         dog    log
           \   /
            cog
```

Snapshot 2 — pattern-index buckets group neighbors in O(L) per word:
```
   pattern "*og" bucket:  { dog, log, cog }   <- all pairs in this bucket are neighbors
   pattern "*ot" bucket:  { hot, dot, lot }
   pattern "h*t" bucket:  { hit, hot }
```

Snapshot 3 — BFS layering (distance from "hit"):
```
   layer 1: { hit }
   layer 2: { hot }
   layer 3: { dot, lot }
   layer 4: { dog, log }
   layer 5: { cog }       <- shortest path length = 5
```

Snapshot 4 — naive O(N²·L) vs pattern-index O(N·L²):
```
   N = 10^4 words, L = 10:
       naive:           10^4 * 10^4 * 10 = 10^9   too slow
       pattern index:   10^4 * 10^2     = 10^6   fast
```

## bruteForce
Two slow approaches:
1. Pairwise comparison: for every pair of words check letter-by-letter, build adjacency list, then BFS. O(N²·L) preprocessing.
2. DFS up to some depth bound: exponential in transformation length.

Both are dominated by BFS + pattern index, which is O(N·L²).

## optimal
```
def ladderLength(beginWord, endWord, wordList):
    words = set(wordList)
    if endWord not in words: return 0
    L = len(beginWord)

    pattern_map = defaultdict(list)
    for w in words:
        for i in range(L):
            pattern_map[w[:i] + "*" + w[i+1:]].append(w)

    visited = {beginWord}
    queue = deque([(beginWord, 1)])
    while queue:
        word, dist = queue.popleft()
        if word == endWord: return dist
        for i in range(L):
            pat = word[:i] + "*" + word[i+1:]
            for nxt in pattern_map[pat]:
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, dist + 1))
            pattern_map[pat] = []          # mark bucket consumed -> avoid revisits
    return 0
```

Emptying each bucket after first use is the trick that prevents the same neighbor list from being scanned multiple times. It cuts a hidden quadratic factor on big inputs.

**Bidirectional BFS** is the next speed-up: BFS from both `beginWord` and `endWord` simultaneously, alternating directions and always expanding the smaller frontier. Stops when frontiers meet. Roughly square-roots the explored count.

## complexity
time: O(N·L²) — N words, each contributing L patterns of length L; BFS visits each word once.
space: O(N·L²) for the pattern map; O(N) for the visited set and queue.
notes: Bidirectional BFS reduces the constant factor dramatically — on average each frontier reaches √M nodes where M is the total visited. Worst-case asymptotics are unchanged.

## pitfalls
- Not putting `wordList` into a set first — `if endWord in wordList` on a list is O(N), and you do it inside the loop. Convert once up front.
- Forgetting to check that `endWord` is in the dictionary. Return 0 immediately if not — saves wasted BFS.
- Confusing "length of the sequence" (which counts both endpoints) with "number of transformations" (one less). Read the problem carefully.
- Re-enqueueing already-visited words because you mark visited on dequeue instead of enqueue. Mark on *enqueue* in BFS to keep the queue small.
- Generating patterns by string concatenation in tight loops in Java/C++ — preallocate a char array and overwrite the swap position to avoid GC pressure.

## interviewTips
- Lead with the framing: "The dictionary defines an implicit unweighted graph; BFS gives shortest distance."
- Immediately mention the pattern-index trick. Many candidates write the O(N²) pairwise version and lose time.
- Bring up bidirectional BFS if the interviewer pushes for further optimization — it is the standard follow-up and the answer they expect.
- For LC 126 ("return all shortest sequences"), you need to *also* track parents during BFS, then DFS-reconstruct. Mention this if asked.

## code.python
```python
from collections import deque, defaultdict

def ladderLength(beginWord, endWord, wordList):
    words = set(wordList)
    if endWord not in words: return 0
    L = len(beginWord)

    pattern_map = defaultdict(list)
    for w in words | {beginWord}:
        for i in range(L):
            pattern_map[w[:i] + "*" + w[i+1:]].append(w)

    visited = {beginWord}
    queue = deque([(beginWord, 1)])
    while queue:
        word, dist = queue.popleft()
        if word == endWord: return dist
        for i in range(L):
            pat = word[:i] + "*" + word[i+1:]
            for nxt in pattern_map[pat]:
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, dist + 1))
            pattern_map[pat] = []
    return 0
```

## code.javascript
```javascript
function ladderLength(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const L = beginWord.length;

  const patternMap = new Map();
  const add = (w) => {
    for (let i = 0; i < L; i++) {
      const pat = w.slice(0, i) + "*" + w.slice(i + 1);
      if (!patternMap.has(pat)) patternMap.set(pat, []);
      patternMap.get(pat).push(w);
    }
  };
  words.add(beginWord);
  for (const w of words) add(w);

  const visited = new Set([beginWord]);
  const queue = [[beginWord, 1]];
  while (queue.length) {
    const [word, dist] = queue.shift();
    if (word === endWord) return dist;
    for (let i = 0; i < L; i++) {
      const pat = word.slice(0, i) + "*" + word.slice(i + 1);
      for (const nxt of (patternMap.get(pat) || [])) {
        if (!visited.has(nxt)) { visited.add(nxt); queue.push([nxt, dist + 1]); }
      }
      patternMap.set(pat, []);
    }
  }
  return 0;
}
```

## code.java
```java
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    int L = beginWord.length();
    Map<String, List<String>> patternMap = new HashMap<>();
    words.add(beginWord);
    for (String w : words) {
        for (int i = 0; i < L; i++) {
            String pat = w.substring(0, i) + "*" + w.substring(i + 1);
            patternMap.computeIfAbsent(pat, k -> new ArrayList<>()).add(w);
        }
    }
    Set<String> visited = new HashSet<>();
    visited.add(beginWord);
    Deque<String[]> queue = new ArrayDeque<>();
    queue.offer(new String[]{beginWord, "1"});
    while (!queue.isEmpty()) {
        String[] cur = queue.poll();
        String word = cur[0]; int dist = Integer.parseInt(cur[1]);
        if (word.equals(endWord)) return dist;
        for (int i = 0; i < L; i++) {
            String pat = word.substring(0, i) + "*" + word.substring(i + 1);
            List<String> bucket = patternMap.getOrDefault(pat, Collections.emptyList());
            for (String nxt : bucket) {
                if (!visited.contains(nxt)) {
                    visited.add(nxt);
                    queue.offer(new String[]{nxt, String.valueOf(dist + 1)});
                }
            }
            patternMap.put(pat, Collections.emptyList());
        }
    }
    return 0;
}
```

## code.cpp
```cpp
int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
    unordered_set<string> words(wordList.begin(), wordList.end());
    if (!words.count(endWord)) return 0;
    int L = beginWord.size();
    unordered_map<string, vector<string>> patternMap;
    words.insert(beginWord);
    for (const auto& w : words) {
        for (int i = 0; i < L; i++) {
            string pat = w; pat[i] = '*';
            patternMap[pat].push_back(w);
        }
    }
    unordered_set<string> visited{beginWord};
    queue<pair<string,int>> q;
    q.push({beginWord, 1});
    while (!q.empty()) {
        auto [word, dist] = q.front(); q.pop();
        if (word == endWord) return dist;
        for (int i = 0; i < L; i++) {
            string pat = word; pat[i] = '*';
            for (const auto& nxt : patternMap[pat]) {
                if (!visited.count(nxt)) {
                    visited.insert(nxt);
                    q.push({nxt, dist + 1});
                }
            }
            patternMap[pat].clear();
        }
    }
    return 0;
}
```
