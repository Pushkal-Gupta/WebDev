---
slug: suffix-automaton-applications
module: strings-advanced
title: Suffix Automaton — Applications and Endpos Equivalence
subtitle: Counting distinct substrings, lex-smallest rotation, longest common substring of two strings, and occurrence counting in O(n).
difficulty: Advanced
position: 60
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Suffix Automaton — cp-algorithms (construction, endpos, all standard applications)"
    url: "https://cp-algorithms.com/string/suffix-automaton.html"
    type: blog
  - title: "Suffix Automaton — Wikipedia (states, suffix links, applications)"
    url: "https://en.wikipedia.org/wiki/Suffix_automaton"
    type: blog
  - title: "KACTL — SuffixAutomaton.h (competitive reference implementation)"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/strings/SuffixAutomaton.h"
    type: repo
status: published
---

## intro
A suffix automaton (SAM) is the smallest DFA recognizing exactly the set of substrings of a string. It has at most `2n - 1` states and `3n - 4` transitions, builds online in O(n) for fixed alphabet, and once built turns a long list of substring questions into short walks. The construction is well-documented; the *applications* are what make SAM worth carrying around. This page is the applications-side companion: endpos classes, the suffix-link tree, and the standard problems they crack.

## whyItMatters
Many string problems reduce to "count distinct substrings", "count occurrences of every substring", "find the longest common substring of two strings", or "find the k-th lexicographically smallest substring". Solving any one of these from scratch is a week of careful coding. SAM solves all four with a few dozen lines of post-processing on the same automaton. In competitive programming, SAM has displaced suffix array as the default for these because of its constant-factor speed and the elegance of the suffix-link tree. In production it underpins parts of full-text search engines, plagiarism detectors (MOSS uses related automata), and bioinformatics pipelines that need fast substring statistics on a fixed reference genome.

## intuition
The endpos definition is the load-bearing concept. For a non-empty substring `t` of `s`, `endpos(t)` is the set of end positions where `t` occurs. Two substrings are *endpos-equivalent* if they have the same set of end positions. Equivalence classes are the SAM's states. Three facts make the structure work and underpin every application.

**Fact one — the inclusion lemma.** For any two substrings `u` and `v` of `s` with `|u| < |v|`, either `endpos(u) ⊇ endpos(v)` or the two sets are disjoint. Why: if a position `p` is in both, then both `u` and `v` end at `p`, so the shorter one is a suffix of the longer one. If the shorter is a suffix of the longer, every occurrence of the longer is also an occurrence of the shorter, giving inclusion. Crucially, *endpos classes are determined by length*: within one state, all substrings have lengths in a contiguous range `[len(link) + 1, len]`, and any two of them are suffixes of one another.

**Fact two — the suffix-link tree.** Each state `v` other than the initial state has a suffix link `link(v)` to the state holding the longest proper suffix that lives in a different endpos class. The links form a tree rooted at the initial state. The *endpos* of a state equals the union of endpos sets of all its children in this tree — children's positions strictly include the parent's, by the inclusion lemma flipped. This propagation is the engine behind occurrence counting.

**Fact three — the linear bound on state count.** Every state is either (a) generated when a new character extends the previous "last" state — at most `n` such — or (b) a *clone* created when a transition into an existing state is ambiguous — at most `n - 1` of those. Total states are bounded by `2n - 1`. Transitions are bounded by `3n - 4` by a similar counting argument. The size bounds are tight: the string `abbb...b` of length `n` hits both within a constant.

Together these say: SAM is a tree (the suffix-link tree) augmented with extra forward transitions, and every reasonable substring query reduces to a constant amount of work per node in that tree.

## visualization
```
s = "aabab"   (n = 5)

Suffix-link tree (initial state at root, lengths shown as |state|=len):

                 root (|=0)
                /    |     \
            [a]      [b]    [ab]    ...     each leaf-direction holds substrings
            len=1    len=1   len=2          ending at the same set of positions
              \      /
            [aa,a]  (clone)

Forward transitions form a DAG:
  root --a--> q_a --a--> q_aa --b--> q_aab --a--> q_aaba --b--> q_aabab
                  \--b--> q_ab  ...

Number of distinct substrings of s = sum over all states v != root of (len[v] - len[link[v]])
                                   = 12 for "aabab".
```

## bruteForce
Enumerate every substring — there are up to `n(n+1)/2`, so O(n^2) of them — and store the distinct ones in a hash set. O(n^2) time, O(n^2) space, dies at `n = 5000`. Counting occurrences of every substring naively is O(n^3). Finding the longest common substring of two strings of length `n` and `m` naively is O(n^2 m). All three problems sit in the "SAM crushes this" bucket.

## optimal
Build SAM once, then run the appropriate O(n) post-pass.

**Counting distinct substrings.** Every substring of `s` corresponds to exactly one path from the initial state along forward transitions, and each such path lands in a unique state. The number of substrings ending in state `v` is `len[v] - len[link[v]]` — the size of the length range for that endpos class. Sum across all states except the root:

```
distinct = sum(len[v] - len[link[v]] for v in states if v != root)
```

This is O(n) post-processing. For "k-th lexicographically smallest distinct substring", precompute `cnt[v]` = number of distinct substrings starting at `v` (DP on the forward-transition DAG in reverse-topological order), then walk transitions in alphabetical order.

**Counting occurrences of a substring.** The occurrence count of any substring equals `|endpos(state)|`. To compute `|endpos(v)|` for every state: initialize `cnt[v] = 1` for every state that corresponds to a prefix of `s` (the "real" states, not clones), then in reverse-topological order of the suffix-link tree (largest `len` first), add `cnt[v]` to `cnt[link[v]]`. The inclusion lemma guarantees correctness — children's endpos sets are disjoint subsets of the parent's. Querying "how many times does `p` occur in `s`?" then takes O(|p|): walk forward transitions from the root, return `cnt[final state]` if the walk completes, else 0.

**Longest common substring of `s` and `t`.** Build SAM on `s`. Walk through `t` maintaining a current state `v` and a current matched length `l`. For each character `c` in `t`: if `v` has a `c`-transition, advance and `l += 1`; otherwise follow suffix links from `v` until you find one with a `c`-transition (resetting `l = len[link] + 1` along the way), and if none exists reset to root with `l = 0`. Track `max(l)`. The amortized accounting mirrors KMP: total work O(|t|), so total LCS is O(|s| + |t|).

**Lexicographically smallest cyclic rotation of `s`.** Build SAM on `s + s`. Walk forward transitions, at each step picking the smallest available character, for exactly `n` steps. The string spelled along that walk is the lex-smallest rotation. O(n) total.

**Why clones do not get counted as occurrences.** Clones are introduced during construction precisely because two different "natural" states would otherwise share a transition target. Their `endpos` is a *union* of children's endpos and contributes nothing of its own; initializing `cnt[clone] = 0` and letting the suffix-link DP propagate is what keeps the count honest.

## complexity
- **Build**: O(n) amortized for fixed alphabet, O(n |Sigma|) with array transitions, O(n log |Sigma|) with balanced-tree transitions.
- **States**: at most `2n - 1`. **Transitions**: at most `3n - 4`.
- **Distinct substring count**: O(n) post-pass.
- **Occurrence count per query**: O(|p|).
- **Longest common substring of two strings**: O(|s| + |t|).
- **Space**: O(n |Sigma|) with array transitions, O(n) with hash-map transitions. The hash-map form is slower per transition but much smaller for large alphabets.

## pitfalls
- **Initializing `cnt[clone] = 1`** — clones do not correspond to a new prefix of `s`; they exist only to maintain the equivalence-class invariant. Setting their initial count to 1 overcounts every occurrence below them.
- **Skipping reverse-topological order in occurrence counting** — propagating children to parents requires children to be processed first. Topological order by `len` (or radix-sort on `len`) is the standard trick; iterating states in insertion order is wrong because clones may have smaller `len` than their children's children.
- **Building SAM on `s + sentinel + t` then querying as if it were SAM of `s`** — that gives a *generalized* SAM. Useful for many problems, but occurrence counts now reflect both strings; do not conflate the two.
- **Forgetting the `len[link] + 1` boundary in the LCS walk** — when you follow a suffix link and the target state has length `L`, the longest currently-matching prefix has length `L + 1` (assuming the transition succeeds). Off-by-one here silently truncates the answer.
- **Recursing on the suffix-link tree without an explicit stack** — for `n = 10^6`, the link tree can have depth proportional to `n`. Always iterate by `len`-sorted order, not by DFS recursion.
- **Mixing up "transitions" and "suffix links"** — transitions go forward on characters; suffix links go to shorter endpos classes. The DAG of transitions and the tree of suffix links are different structures sitting on the same nodes.

## interviewTips
- Lead with endpos: "States are equivalence classes of substrings under same-end-positions." Interviewers gauge depth by whether you reach for endpos or for "it's like a suffix tree but smaller".
- For "distinct substrings", drop the formula `sum(len[v] - len[link[v]])` immediately — it is the canonical one-liner and signals you have actually used SAM.
- For "longest common substring of two strings", mention SAM as the linear-time answer and contrast with the suffix-array + LCP solution (O((n + m) log(n + m)) construction, same query). Strong senior signal.

## code.python
```python
class SuffixAutomaton:
    def __init__(self):
        self.size = 1
        self.last = 0
        self.len = [0]
        self.link = [-1]
        self.next = [dict()]
        self.is_clone = [False]
        self.first_pos = [-1]  # for the original (non-clone) state, the end position of the prefix

    def _new_state(self, length, link, transitions, is_clone, first_pos):
        self.len.append(length)
        self.link.append(link)
        self.next.append(transitions)
        self.is_clone.append(is_clone)
        self.first_pos.append(first_pos)
        idx = self.size
        self.size += 1
        return idx

    def extend(self, c, position):
        cur = self._new_state(self.len[self.last] + 1, -1, {}, False, position)
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
                clone = self._new_state(self.len[p] + 1, self.link[q], dict(self.next[q]), True, self.first_pos[q])
                while p != -1 and self.next[p].get(c) == q:
                    self.next[p][c] = clone
                    p = self.link[p]
                self.link[q] = clone
                self.link[cur] = clone
        self.last = cur

    def build(self, s):
        for i, c in enumerate(s):
            self.extend(c, i)
        return self

    def distinct_substrings(self):
        return sum(self.len[v] - self.len[self.link[v]] for v in range(1, self.size))

    def occurrence_counts(self):
        cnt = [0 if self.is_clone[v] else 1 for v in range(self.size)]
        cnt[0] = 0
        order = sorted(range(self.size), key=lambda v: -self.len[v])
        for v in order:
            if self.link[v] != -1:
                cnt[self.link[v]] += cnt[v]
        return cnt

    def count_occurrences(self, pattern, cnt):
        v = 0
        for c in pattern:
            if c not in self.next[v]:
                return 0
            v = self.next[v][c]
        return cnt[v]


def longest_common_substring(s, t):
    sam = SuffixAutomaton().build(s)
    v, l, best = 0, 0, 0
    for c in t:
        while v and c not in sam.next[v]:
            v = sam.link[v]
            l = sam.len[v]
        if c in sam.next[v]:
            v = sam.next[v][c]
            l += 1
        best = max(best, l)
    return best


if __name__ == "__main__":
    sam = SuffixAutomaton().build("aabab")
    assert sam.distinct_substrings() == 12
    cnt = sam.occurrence_counts()
    assert sam.count_occurrences("ab", cnt) == 2
    assert longest_common_substring("abcde", "cdeab") == 3
```

## code.javascript
```javascript
class SuffixAutomaton {
  constructor() {
    this.len = [0];
    this.link = [-1];
    this.next = [Object.create(null)];
    this.isClone = [false];
    this.last = 0;
  }
  _newState(length, link, transitions, isClone) {
    this.len.push(length);
    this.link.push(link);
    this.next.push(transitions);
    this.isClone.push(isClone);
    return this.len.length - 1;
  }
  extend(c) {
    const cur = this._newState(this.len[this.last] + 1, -1, Object.create(null), false);
    let p = this.last;
    while (p !== -1 && !(c in this.next[p])) { this.next[p][c] = cur; p = this.link[p]; }
    if (p === -1) { this.link[cur] = 0; }
    else {
      const q = this.next[p][c];
      if (this.len[p] + 1 === this.len[q]) this.link[cur] = q;
      else {
        const clone = this._newState(this.len[p] + 1, this.link[q], { ...this.next[q] }, true);
        while (p !== -1 && this.next[p][c] === q) { this.next[p][c] = clone; p = this.link[p]; }
        this.link[q] = clone; this.link[cur] = clone;
      }
    }
    this.last = cur;
  }
  build(s) { for (const c of s) this.extend(c); return this; }
  distinctSubstrings() {
    let total = 0;
    for (let v = 1; v < this.len.length; v++) total += this.len[v] - this.len[this.link[v]];
    return total;
  }
  occurrenceCounts() {
    const n = this.len.length;
    const cnt = new Array(n).fill(0);
    for (let v = 1; v < n; v++) if (!this.isClone[v]) cnt[v] = 1;
    const order = [...Array(n).keys()].sort((a, b) => this.len[b] - this.len[a]);
    for (const v of order) if (this.link[v] !== -1) cnt[this.link[v]] += cnt[v];
    return cnt;
  }
}

function longestCommonSubstring(s, t) {
  const sam = new SuffixAutomaton().build(s);
  let v = 0, l = 0, best = 0;
  for (const c of t) {
    while (v && !(c in sam.next[v])) { v = sam.link[v]; l = sam.len[v]; }
    if (c in sam.next[v]) { v = sam.next[v][c]; l++; }
    if (l > best) best = l;
  }
  return best;
}

console.log(new SuffixAutomaton().build("aabab").distinctSubstrings()); // 12
console.log(longestCommonSubstring("abcde", "cdeab")); // 3
```

## code.java
```java
import java.util.*;

class SuffixAutomatonApps {
    int[] len, link;
    boolean[] isClone;
    List<Map<Character, Integer>> next = new ArrayList<>();
    int last = 0, size = 1;

    SuffixAutomatonApps(int cap) {
        len = new int[2 * cap + 5];
        link = new int[2 * cap + 5];
        isClone = new boolean[2 * cap + 5];
        link[0] = -1;
        next.add(new HashMap<>());
    }

    int newState(int length, int lnk, Map<Character, Integer> trans, boolean clone) {
        len[size] = length;
        link[size] = lnk;
        isClone[size] = clone;
        next.add(trans);
        return size++;
    }

    void extend(char c) {
        int cur = newState(len[last] + 1, -1, new HashMap<>(), false);
        int p = last;
        while (p != -1 && !next.get(p).containsKey(c)) {
            next.get(p).put(c, cur);
            p = link[p];
        }
        if (p == -1) link[cur] = 0;
        else {
            int q = next.get(p).get(c);
            if (len[p] + 1 == len[q]) link[cur] = q;
            else {
                int clone = newState(len[p] + 1, link[q], new HashMap<>(next.get(q)), true);
                while (p != -1 && Integer.valueOf(q).equals(next.get(p).get(c))) {
                    next.get(p).put(c, clone);
                    p = link[p];
                }
                link[q] = clone;
                link[cur] = clone;
            }
        }
        last = cur;
    }

    long distinctSubstrings() {
        long total = 0;
        for (int v = 1; v < size; v++) total += len[v] - len[link[v]];
        return total;
    }

    int[] occurrenceCounts() {
        int[] cnt = new int[size];
        for (int v = 1; v < size; v++) cnt[v] = isClone[v] ? 0 : 1;
        Integer[] order = new Integer[size];
        for (int i = 0; i < size; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> len[b] - len[a]);
        for (int v : order) if (link[v] != -1) cnt[link[v]] += cnt[v];
        return cnt;
    }

    static int longestCommonSubstring(String s, String t) {
        SuffixAutomatonApps sam = new SuffixAutomatonApps(s.length());
        for (char c : s.toCharArray()) sam.extend(c);
        int v = 0, l = 0, best = 0;
        for (char c : t.toCharArray()) {
            while (v != 0 && !sam.next.get(v).containsKey(c)) { v = sam.link[v]; l = sam.len[v]; }
            if (sam.next.get(v).containsKey(c)) { v = sam.next.get(v).get(c); l++; }
            best = Math.max(best, l);
        }
        return best;
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

struct SAM {
    struct Node { int len = 0, link = -1; bool clone = false; unordered_map<char, int> next; };
    vector<Node> st;
    int last = 0;
    SAM() { st.push_back({}); }

    void extend(char c) {
        int cur = (int)st.size();
        st.push_back({ st[last].len + 1, -1, false, {} });
        int p = last;
        while (p != -1 && !st[p].next.count(c)) { st[p].next[c] = cur; p = st[p].link; }
        if (p == -1) st[cur].link = 0;
        else {
            int q = st[p].next[c];
            if (st[p].len + 1 == st[q].len) st[cur].link = q;
            else {
                int clone = (int)st.size();
                st.push_back({ st[p].len + 1, st[q].link, true, st[q].next });
                while (p != -1 && st[p].next[c] == q) { st[p].next[c] = clone; p = st[p].link; }
                st[q].link = clone; st[cur].link = clone;
            }
        }
        last = cur;
    }

    long long distinct_substrings() const {
        long long total = 0;
        for (int v = 1; v < (int)st.size(); ++v) total += st[v].len - st[st[v].link].len;
        return total;
    }

    vector<int> occurrence_counts() const {
        int n = (int)st.size();
        vector<int> cnt(n, 0), order(n);
        for (int v = 1; v < n; ++v) cnt[v] = st[v].clone ? 0 : 1;
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b){ return st[a].len > st[b].len; });
        for (int v : order) if (st[v].link != -1) cnt[st[v].link] += cnt[v];
        return cnt;
    }
};

int longest_common_substring(const string& s, const string& t) {
    SAM sam;
    for (char c : s) sam.extend(c);
    int v = 0, l = 0, best = 0;
    for (char c : t) {
        while (v && !sam.st[v].next.count(c)) { v = sam.st[v].link; l = sam.st[v].len; }
        if (sam.st[v].next.count(c)) { v = sam.st[v].next[c]; ++l; }
        best = max(best, l);
    }
    return best;
}

int main() {
    SAM sam;
    for (char c : string("aabab")) sam.extend(c);
    cout << sam.distinct_substrings() << '\n';
    cout << longest_common_substring("abcde", "cdeab") << '\n';
}
```
