---
slug: suffix-automaton
module: sorting-strings
title: Suffix Automaton
subtitle: The smallest DFA that accepts every substring of a string — O(n) build, instant substring queries.
difficulty: Advanced
position: 25
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Blumer et al. (1985) — The smallest automaton recognizing the subwords of a text"
    url: ""
status: published
---

## intro
A suffix automaton (SAM) of a string `s` is the minimum-state DFA whose set of accepted strings is *every distinct substring of s*. It has at most `2n − 1` states and `3n − 4` transitions for `|s| = n`. Built in **O(n)** time online (character-by-character). Once built, "does substring `p` appear in `s`?" is `O(|p|)`, and many other substring questions reduce to short walks on the SAM.

## whyItMatters
SAM is the most powerful linear-time substring structure. It computes:
- **Number of distinct substrings**: sum of `len[v] - len[link[v]]` over all states.
- **Longest common substring of two strings**: build SAM on one, scan the other.
- **K-th lexicographic distinct substring**: walk transitions in alphabetical order.
- **Pattern multiplicity**: count occurrences of pattern in O(|p|) once endpos sizes are computed.

Suffix tree does the same things but with ~2x more memory and harder code. SAM has become the standard for competitive substring problems.

## intuition
Each state represents an **equivalence class of substrings** with the same set of ending positions (endpos). Two substrings end at exactly the same positions iff they belong to the same state. A state stores:
- `len` = length of the longest substring in this class.
- `link` = suffix link to the state holding the longest proper suffix that's in a different endpos class.
- `next[c]` = transitions on character `c`.

Building incrementally: when you append character `c`, create a new state for `s` (with the longest suffix being |s| = i+1), then walk the suffix-link chain of the previous "last" state, copying or splitting where ambiguity arises.

## visualization
```
s = "abcbc" — SAM transitions (subset):

  start ──a──► 1 ──b──► 2 ──c──► 3 ──b──► 4 ──c──► 5
   │                    │
   └─b─► 6 ─c─► 7       suffix links thread back to shorter equivalent states.

Each state v has endpos(v) ⊆ {0..n-1}.
len[v] = length of longest substring in this class.
```

## bruteForce
Try every substring up to O(n²) of them, store in a hash set. O(n³) time for building, O(n²) memory. Dies at n = 1000.

## optimal
The classic incremental build (≈ 40 LOC):

```
states = [{len: 0, link: -1, next: {}}]
last = 0
n = 0

def extend(c):
    cur = make_state(len = states[last].len + 1)
    p = last
    while p != -1 and c not in states[p].next:
        states[p].next[c] = cur
        p = states[p].link
    if p == -1:
        states[cur].link = 0
    else:
        q = states[p].next[c]
        if states[p].len + 1 == states[q].len:
            states[cur].link = q
        else:
            clone = make_state(
                len = states[p].len + 1,
                link = states[q].link,
                next = copy(states[q].next),
            )
            while p != -1 and states[p].next[c] == q:
                states[p].next[c] = clone
                p = states[p].link
            states[q].link = clone
            states[cur].link = clone
    last = cur
```

The clone-and-redirect step is the heart: when extending by `c` would create ambiguity, we clone the conflicting state and retarget transitions.

After building, walk the suffix-link tree in reverse-topological order (longest `len` first) to propagate endpos sizes for occurrence counting.

## complexity
- **Build**: O(n) amortized for fixed alphabet (states + transitions are both ≤ linear in n).
- **Substring search for p**: O(|p|) — walk transitions.
- **Distinct substring count**: O(n) — sum of `len[v] - len[link[v]]`.
- **Memory**: O(n · |Σ|) with array transitions, O(n) with hash-map transitions.

## pitfalls
- **Forgetting to clone before retargeting**: produces a wrong automaton. The clone is what keeps the invariant `len[link] < len[state]` exact.
- **Suffix-link tree confusion**: link points to a *strictly shorter* state with overlapping endpos. Easy to mis-implement.
- **Using SAM on multiple strings**: glue with a unique separator character (`#`) and build the SAM of the concatenated string, then process per-string occurrence sets — or use a **generalized suffix automaton**.
- **Counting occurrences from clones**: clones don't accept any new string by themselves — only count their `cnt` after propagation.
- **Confusing with suffix tree**: same expressive power, different machinery. SAM stores substring-equivalence states; suffix tree stores suffix-path nodes.

## interviewTips
- The trigger: "many substring queries online" or "longest common substring of two strings" → SAM is competitive with suffix array but supports online insertion.
- For "number of distinct substrings," reach for the formula: sum of `len[v] - len[link[v]]` across all states.
- Compare with **suffix array** (offline, O(n log n) build with prefix doubling, simpler queries) and **suffix tree** (more memory, more historic literature, equivalent power).
- For senior interviews, mention **generalized SAM** for multi-string and **Aho-Corasick** for multi-pattern matching as the related cousins.

## code.python
```python
class SAM:
    def __init__(self):
        self.states = [{"len": 0, "link": -1, "next": {}}]
        self.last = 0

    def extend(self, c):
        cur = len(self.states)
        self.states.append({"len": self.states[self.last]["len"] + 1, "link": -1, "next": {}})
        p = self.last
        while p != -1 and c not in self.states[p]["next"]:
            self.states[p]["next"][c] = cur
            p = self.states[p]["link"]
        if p == -1:
            self.states[cur]["link"] = 0
        else:
            q = self.states[p]["next"][c]
            if self.states[p]["len"] + 1 == self.states[q]["len"]:
                self.states[cur]["link"] = q
            else:
                clone = len(self.states)
                self.states.append({
                    "len": self.states[p]["len"] + 1,
                    "link": self.states[q]["link"],
                    "next": dict(self.states[q]["next"]),
                })
                while p != -1 and self.states[p]["next"].get(c) == q:
                    self.states[p]["next"][c] = clone
                    p = self.states[p]["link"]
                self.states[q]["link"] = clone
                self.states[cur]["link"] = clone
        self.last = cur

    def distinct_substrings(self):
        total = 0
        for v in range(1, len(self.states)):
            total += self.states[v]["len"] - self.states[self.states[v]["link"]]["len"]
        return total

sam = SAM()
for c in "abcbc": sam.extend(c)
print(sam.distinct_substrings())   # 12
```

## code.javascript
```javascript
// Sketch — mirrors the Python version. Use TypedArrays for performance at large n.
class SAM {
  constructor() { this.states = [{ len: 0, link: -1, next: {} }]; this.last = 0; }
  extend(c) {
    const cur = this.states.length;
    this.states.push({ len: this.states[this.last].len + 1, link: -1, next: {} });
    let p = this.last;
    while (p !== -1 && !(c in this.states[p].next)) { this.states[p].next[c] = cur; p = this.states[p].link; }
    if (p === -1) { this.states[cur].link = 0; return (this.last = cur); }
    const q = this.states[p].next[c];
    if (this.states[p].len + 1 === this.states[q].len) { this.states[cur].link = q; return (this.last = cur); }
    const clone = this.states.length;
    this.states.push({ len: this.states[p].len + 1, link: this.states[q].link, next: { ...this.states[q].next } });
    while (p !== -1 && this.states[p].next[c] === q) { this.states[p].next[c] = clone; p = this.states[p].link; }
    this.states[q].link = clone; this.states[cur].link = clone;
    this.last = cur;
  }
}
```

## code.java
```java
import java.util.*;
class SAM {
    static class Node { int len, link = -1; Map<Character, Integer> next = new HashMap<>(); }
    final List<Node> s = new ArrayList<>();
    int last = 0;
    SAM() { Node r = new Node(); r.len = 0; s.add(r); }
    void extend(char c) {
        int cur = s.size();
        Node n = new Node(); n.len = s.get(last).len + 1; s.add(n);
        int p = last;
        while (p != -1 && !s.get(p).next.containsKey(c)) { s.get(p).next.put(c, cur); p = s.get(p).link; }
        if (p == -1) { n.link = 0; last = cur; return; }
        int q = s.get(p).next.get(c);
        if (s.get(p).len + 1 == s.get(q).len) { n.link = q; last = cur; return; }
        int clone = s.size();
        Node cl = new Node(); cl.len = s.get(p).len + 1; cl.link = s.get(q).link;
        cl.next = new HashMap<>(s.get(q).next); s.add(cl);
        while (p != -1 && Integer.valueOf(q).equals(s.get(p).next.get(c))) { s.get(p).next.put(c, clone); p = s.get(p).link; }
        s.get(q).link = clone; n.link = clone;
        last = cur;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
struct SAM {
    struct Node { int len = 0, link = -1; std::unordered_map<char, int> next; };
    std::vector<Node> st{ Node{} };
    int last = 0;
    void extend(char c) {
        int cur = st.size(); st.push_back({ st[last].len + 1, -1, {} });
        int p = last;
        while (p != -1 && !st[p].next.count(c)) { st[p].next[c] = cur; p = st[p].link; }
        if (p == -1) { st[cur].link = 0; last = cur; return; }
        int q = st[p].next[c];
        if (st[p].len + 1 == st[q].len) { st[cur].link = q; last = cur; return; }
        int clone = st.size();
        st.push_back({ st[p].len + 1, st[q].link, st[q].next });
        while (p != -1 && st[p].next[c] == q) { st[p].next[c] = clone; p = st[p].link; }
        st[q].link = clone; st[cur].link = clone;
        last = cur;
    }
};
```
