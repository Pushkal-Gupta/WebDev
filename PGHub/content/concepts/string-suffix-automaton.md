---
slug: string-suffix-automaton
module: strings-advanced
title: Suffix Automaton
subtitle: A linear-size DFA accepting exactly the substrings of s; built online in O(n).
difficulty: Advanced
position: 2
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Suffix Automaton — cp-algorithms"
    url: "https://cp-algorithms.com/string/suffix-automaton.html"
    type: blog
  - title: "Suffix Automaton — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/suffix-automation/"
    type: blog
  - title: "KACTL — SuffixAutomaton.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/strings/SuffixAutomaton.h"
    type: repo
status: published
---

## intro
A suffix automaton (SAM) is the smallest DFA whose accepted language is exactly the set of substrings of a string s. It has at most 2n - 1 states and 3n - 4 transitions for |s| at least 3 — strictly linear. It supports online construction (append one character at a time) in O(n * alphabet) and answers "is t a substring of s?", "how many distinct substrings does s have?", "what is the longest common substring of s and t?", and many more queries in O(|query|).

## whyItMatters
SAM is the most compact full-substring index in computer science. Where a suffix tree needs ~20n bytes and a suffix array + LCP needs 8n integers, SAM matches both in capability with comparable memory and an arguably simpler online build. It is the workhorse behind contest-grade substring problems and any production system that needs streaming substring queries.

## intuition
Every substring of s corresponds to a class of "right-extensions" (the endpos set: which positions of s does this substring end at?). Two substrings with the same endpos set behave identically going forward, so they share one SAM state. Each state represents the equivalence class of substrings sharing an endpos set. A "suffix link" from state u to state v means v's substrings are the longest proper suffixes of u's that fall into a different (larger) endpos class. The result is a DAG of transitions and a tree of suffix links — both linear-size.

Geometrically, think of it as folding a trie. A trie of all suffixes has one leaf per suffix and blows up to O(n^2) nodes because it never reuses shared structure; the SAM glues together every path that has an identical future, so branches that end at the same set of positions become one node. That gluing is exactly the endpos equivalence, and it is what caps the machine at 2n - 1 states.

Concrete micro-example on s = "aba". Look at where each substring ends (1-indexed positions): "a" ends at {1, 3}, "b" ends at {2}, "ab" ends at {2}, "ba" ends at {3}, "aba" ends at {3}. Now group by identical endpos set: {2} is shared by "b" and "ab", so they collapse into one state; {3} is shared by "ba" and "aba", another single state; "a" with {1,3} stands alone. So the whole automaton needs just the root plus states for endpos {1,3}, {2}, and {3} — four states for a length-3 string, well under 2n - 1 = 5. What's actually happening: a state's `len` records the longest string in its class, and the difference `len[state] - len[link[state]]` counts exactly how many distinct substrings that class contributes, before any formula is invoked.

## visualization
s = "abb". States after building: q0 (empty), q1 ("a"), q2 ("ab"), q3 ("abb","bb","b"). Transitions: q0 -a-> q1, q0 -b-> q3, q1 -b-> q2, q2 -b-> q3. Suffix links: q1 -> q0, q2 -> q3, q3 -> q0. Counting distinct substrings: sum over states of (state.len - link.len) = (1-0) + (2-1) + (3-0) = 5 → "a","b","ab","bb","abb".

The table below traces the actual online build of the code (with the clone state the algorithm really creates when appending the second 'b'):

```
add | new/clone | state | len | link | transitions after step
----+-----------+-------+-----+------+------------------------------
 a  | create    |   1   |  1  |  0   | 0:{a->1}                 1:{}
 b  | create    |   2   |  2  |  0   | 0:{a->1,b->2} 1:{b->2}   2:{}
 b  | create    |   3   |  3  |  ?   | 2:{b->3}  (walking links...)
 b  | clone q=2 |   4   |  1  |  0   | 4:{b->3}  copy of 2's edges
 b  | redirect  |   -   |  -  |  -   | 0:{a->1,b->4}  (was b->2)
 b  | relink    |   -   |  -  |  2->4, 3->4 | last = 3
----+-----------+-------+-----+------+------------------------------
final: 0(len0,link-1) 1(len1,link0) 2(len2,link4) 3(len3,link2) 4(len1,link0)
distinct = sum(len-len[link]) = (1)+( -)+... over non-root = 5 substrings
```

## bruteForce
Insert every substring of s into a set or trie. O(n^2) substrings, O(n) each to insert: O(n^3) time, O(n^2) memory. Trie of substrings ("substring trie") is already 2n-state but is harder to build online than SAM and offers nothing extra.

## optimal
Online extension: keep `last` = state for the prefix so far. To append character c: create a new state `cur` with len = last.len + 1. Walk suffix links from `last` while there is no c-transition; add transition to `cur`. If we hit the root with no c-transition, set cur.link = root. Otherwise let p be the first node with a c-transition to q. If q.len == p.len + 1, cur.link = q. Else clone q into q', copy q's transitions and link, set q'.len = p.len + 1, redirect p's (and ancestors') c-transitions from q to q', set q.link = cur.link = q'. The amortized cost per character is O(alphabet); total O(n * alphabet).

Why this is correct rests on one invariant: the chain of suffix links from `last` back to the root enumerates exactly the suffixes of the current prefix, in strictly decreasing length. Adding character c must extend every one of those suffixes by c that does not already have such an extension — that is precisely the set of states visited by the link-walk that lack a c-transition, and pointing them all at `cur` records the newly appearing substrings. The delicate case is when some ancestor p already reads c into an existing state q. If q's longest string is exactly p.len + 1, then q's endpos class simply grows to include the new position and cur.link = q is valid. But if q is longer, its class is about to split: the strings of length up to p.len + 1 now end at the new position while the longer ones do not. Cloning q into q' with len = p.len + 1 performs that split — q' inherits q's outgoing transitions and link so both halves keep the same future, and every ancestor transition that pointed to q for c is rerouted to q'. Skipping the clone is the classic bug: suffix links would then point into a class whose endpos set strictly contains the new substring, violating the tree structure.

Step by step per character: (1) allocate `cur`; (2) climb links from `last`, wiring missing c-edges to `cur`; (3) resolve the link of `cur` via the root / direct-q / clone-q cases above; (4) set `last = cur`. Complexity intuition: each character adds one (sometimes two) states, and the total number of link-walk steps and transition redirections is amortized O(1) per character by a potential argument on link depth — so the whole build is linear in n up to the per-transition map factor.

## complexity
time: O(n * alphabet) construction; O(|t|) per "is t a substring?" query
space: O(n * alphabet) for transition maps, O(n) for links and lens
notes: Distinct substrings of s = sum over non-root states of len[v] - len[link[v]]. Longest common substring of s, t = run t through SAM(s) keeping a (state, matched_length) pair; O(|t|).

## pitfalls
- Forgetting to clone — without cloning, suffix links can point into a state whose endpos set strictly contains the new substring, breaking invariants.
- Storing transitions as a fixed 256-array when alphabet is tiny — wastes memory. Use a hash map for unicode or large alphabets.
- Off-by-one on `len[link[v]]` when counting distinct substrings — the empty state at the root has len = 0 by convention.
- Re-traversing all states on every query — once SAM is built, queries are O(|t|), not O(|s| + |t|).

## interviewTips
- Lead with "SAM has at most 2n - 1 states, built online in O(n)." That single line tells the interviewer you know the bound.
- Mention the endpos equivalence class — it is the soul of SAM and the answer to "why is the state count linear?"
- For "distinct substrings of s," give the one-line formula sum of (len[v] - len[link[v]]).
- For "longest common substring of s, t," describe the matched-length pointer walk through SAM(s); it is the canonical use case.

## code.python
```python
class SAM:
    def __init__(self):
        self.next = [{}]
        self.link = [-1]
        self.len = [0]
        self.last = 0

    def extend(self, c):
        cur = len(self.next)
        self.next.append({}); self.link.append(-1); self.len.append(self.len[self.last] + 1)
        p = self.last
        while p != -1 and c not in self.next[p]:
            self.next[p][c] = cur
            p = self.link[p]
        if p == -1:
            self.link[cur] = 0
        else:
            q = self.next[p][c]
            if self.len[p] + 1 == self.len[q]:
                self.link[cur] = q
            else:
                clone = len(self.next)
                self.next.append(dict(self.next[q]))
                self.link.append(self.link[q])
                self.len.append(self.len[p] + 1)
                while p != -1 and self.next[p].get(c) == q:
                    self.next[p][c] = clone
                    p = self.link[p]
                self.link[q] = self.link[cur] = clone
        self.last = cur

    def distinct_substrings(self):
        return sum(self.len[v] - self.len[self.link[v]] for v in range(1, len(self.next)))
```

## code.javascript
```javascript
class SAM {
  constructor() {
    this.next = [new Map()];
    this.link = [-1];
    this.len = [0];
    this.last = 0;
  }
  extend(c) {
    const cur = this.next.length;
    this.next.push(new Map());
    this.link.push(-1);
    this.len.push(this.len[this.last] + 1);
    let p = this.last;
    while (p !== -1 && !this.next[p].has(c)) {
      this.next[p].set(c, cur);
      p = this.link[p];
    }
    if (p === -1) this.link[cur] = 0;
    else {
      const q = this.next[p].get(c);
      if (this.len[p] + 1 === this.len[q]) this.link[cur] = q;
      else {
        const clone = this.next.length;
        this.next.push(new Map(this.next[q]));
        this.link.push(this.link[q]);
        this.len.push(this.len[p] + 1);
        while (p !== -1 && this.next[p].get(c) === q) {
          this.next[p].set(c, clone);
          p = this.link[p];
        }
        this.link[q] = this.link[cur] = clone;
      }
    }
    this.last = cur;
  }
  distinctSubstrings() {
    let total = 0;
    for (let v = 1; v < this.next.length; v++) total += this.len[v] - this.len[this.link[v]];
    return total;
  }
}
```

## code.java
```java
class SAM {
    java.util.List<java.util.Map<Character, Integer>> next = new java.util.ArrayList<>();
    java.util.List<Integer> link = new java.util.ArrayList<>();
    java.util.List<Integer> len = new java.util.ArrayList<>();
    int last = 0;

    SAM() { next.add(new java.util.HashMap<>()); link.add(-1); len.add(0); }

    void extend(char c) {
        int cur = next.size();
        next.add(new java.util.HashMap<>()); link.add(-1); len.add(len.get(last) + 1);
        int p = last;
        while (p != -1 && !next.get(p).containsKey(c)) {
            next.get(p).put(c, cur);
            p = link.get(p);
        }
        if (p == -1) link.set(cur, 0);
        else {
            int q = next.get(p).get(c);
            if (len.get(p) + 1 == len.get(q)) link.set(cur, q);
            else {
                int clone = next.size();
                next.add(new java.util.HashMap<>(next.get(q)));
                link.add(link.get(q));
                len.add(len.get(p) + 1);
                while (p != -1 && next.get(p).getOrDefault(c, -1) == q) {
                    next.get(p).put(c, clone);
                    p = link.get(p);
                }
                link.set(q, clone); link.set(cur, clone);
            }
        }
        last = cur;
    }

    long distinctSubstrings() {
        long total = 0;
        for (int v = 1; v < next.size(); v++) total += len.get(v) - len.get(link.get(v));
        return total;
    }
}
```

## code.cpp
```cpp
struct SAM {
    struct State { int len, link; map<char,int> next; };
    vector<State> st;
    int last;
    SAM() { st.push_back({0, -1, {}}); last = 0; }
    void extend(char c) {
        int cur = st.size();
        st.push_back({st[last].len + 1, -1, {}});
        int p = last;
        while (p != -1 && !st[p].next.count(c)) { st[p].next[c] = cur; p = st[p].link; }
        if (p == -1) st[cur].link = 0;
        else {
            int q = st[p].next[c];
            if (st[p].len + 1 == st[q].len) st[cur].link = q;
            else {
                int clone = st.size();
                st.push_back({st[p].len + 1, st[q].link, st[q].next});
                while (p != -1 && st[p].next[c] == q) { st[p].next[c] = clone; p = st[p].link; }
                st[q].link = st[cur].link = clone;
            }
        }
        last = cur;
    }
    long long distinctSubstrings() {
        long long total = 0;
        for (int v = 1; v < (int)st.size(); ++v) total += st[v].len - st[st[v].link].len;
        return total;
    }
};
```
