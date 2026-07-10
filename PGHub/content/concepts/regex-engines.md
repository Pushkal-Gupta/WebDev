---
slug: regex-engines
module: strings-matching
title: Regex Engines — NFA vs Backtracking
subtitle: Why Thompson construction matches in linear time while PCRE-style backtracking can blow up exponentially on adversarial inputs.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Strings chapter"
    url: "https://algs4.cs.princeton.edu/50strings/"
    type: book
  - title: "cp-algorithms — String processing"
    url: "https://cp-algorithms.com/string/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — strings/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/strings"
    type: repo
status: published
---

## intro
Regex matching has two dominant implementation strategies. The textbook approach, due to Ken Thompson, compiles the pattern into a non-deterministic finite automaton (NFA) and simulates all active states in parallel, guaranteeing O(m * n) worst case. The mainstream approach used by PCRE, Java, Python's `re`, JavaScript, Ruby, and .NET is recursive backtracking: try one alternative, on failure rewind and try the next. Backtracking is more expressive (supports backreferences and lookaround) but is vulnerable to catastrophic exponential blowup on patterns that have ambiguous matches.

## whyItMatters
"Regular expression denial of service" (ReDoS) is a real CVE class — Stack Overflow, Cloudflare, and many SaaS APIs have had outages caused by a single attacker-crafted input matched against a backtracking regex. Picking the right engine, or rewriting a pattern so backtracking cannot explode, is a senior backend skill. The deeper lesson is that "the same language" can have two algorithms with wildly different worst cases: classic regular expressions are an O(m*n) problem, and any blowup is a property of the implementation, not the problem.

## intuition
The cleanest reframe: think of an NFA as a set of pebbles sitting on a graph. Backtracking moves a single pebble along one path, and whenever it hits a wall it teleports the pebble back and tries a different fork — potentially re-walking ground it already covered. Thompson's simulation instead keeps a whole *handful* of pebbles and advances all of them one input character at a time, in lockstep. Because two pebbles that land on the same state are indistinguishable, you collapse them — so the handful never grows past the number of states in the graph. That single "collapse duplicates" move is the entire reason one algorithm is linear and the other is exponential.

Thompson's construction turns each operator into a tiny NFA snippet and wires them together: `a` becomes one transition, `ab` is concatenation, `a|b` adds an epsilon-split, `a*` adds an epsilon-loop. To match, simulate all states the NFA could be in simultaneously after consuming each input character — like a wave of possibilities sweeping across the input. There are at most m states (where m is the regex length), so each character costs O(m), giving O(m*n) total.

Work a concrete micro-example. Pattern `a*a` against input `aaa`. The NFA has an epsilon-loop for `a*` feeding a final mandatory `a`. Thompson: after reading each character the active set is the two-state pair {inside-the-loop, after-the-mandatory-a}, never larger. Three characters, two states, roughly six state-touches — done. Backtracking: the greedy `a*` first grabs all three `a`s, then the mandatory `a` has nothing left, so it *rewinds* one `a`, retries, and this give-back happens at every quantifier boundary. For unambiguous patterns that give-back is cheap; for `(a|a)*b` against `aaaa...a`, every branching `|` doubles the number of distinct paths, and you get 2^n behavior. Same language, same input, but one engine collapses the duplicate pebbles and the other explores each one.

## visualization
Pattern `(a|a)*b`, input `aaaa` with no trailing `b`, so both engines must ultimately report NO MATCH. The trace below contrasts the bounded active-set of the NFA simulation against the exploding path count of the backtracker.

```
NFA (Thompson) simulation — active states after each char
 step  read   active-state-set                 |set|
   0    -     {S, q1a, q1b}  (eps-closure)        3
   1    a     {q1a, q1b, loop} -> closure          3
   2    a     {q1a, q1b, loop}                     3
   3    a     {q1a, q1b, loop}                     3
   4    a     {q1a, q1b, loop}                     3
   end  -     b required, none active -> FAIL   O(m*n)=~12 touches

Backtracking engine — paths tried before giving up
 pos  branch-choices-so-far      cumulative paths explored
   1   a|a                          2
   2   a|a . a|a                    4
   3   a|a . a|a . a|a              8
   4   a|a . a|a . a|a . a|a       16
  ...  each extra 'a' DOUBLES     2^n  (n=30 -> ~1,073,741,824)
 fail  no 'b' anywhere -> unwind every branch -> FREEZE
```

## bruteForce
Recursive backtracking is the brute force, and it is what most languages ship. Walk the regex left to right; at each alternation or quantifier, try the first option, recurse; on failure, retry with the next. The implementation is small (a hundred lines) and naturally supports backreferences (`\1`) and lookaround (`(?=...)`), neither of which fits in a finite automaton. Worst case is exponential in the input length when the pattern has overlapping alternations under a quantifier — the so-called "evil regex" family like `(a+)+$`, `^(a|a)*b$`, `(.*a){20}`.

## optimal
Compile the regex with Thompson construction, then optionally lazy-DFA-cache the subset construction so that hot states become single-table lookups. RE2 (Google), Rust's `regex` crate, Go's `regexp`, and Hyperscan use this approach. Guarantee: O(m * n) time, no backtracking, immune to ReDoS.

The correctness argument rests on one invariant: **the active-state set after reading the first k characters is exactly the set of NFA states reachable by any partial match of that k-character prefix.** Maintain it by, at each step, taking the transition on the current character from every active state and then computing the epsilon-closure of the results. Because a state is either in the set or not — never in it "twice" — the set has at most m elements, and duplicate paths that a backtracker would explore separately are silently merged here. That merge is the whole trick, and it is why worst-case work is bounded regardless of pattern ambiguity.

Step by step: (1) compile pattern -> NFA of O(m) states; (2) seed the active set with the epsilon-closure of the start; (3) for each input char, advance every active state one transition and re-close; (4) accept iff any active state is accepting at end of input. Each of the n characters touches at most m states, and each closure is O(m) edges, so the bound is O(m*n) — the complexity intuition is simply "n characters times m states, no revisits."

The lazy DFA layer memoizes each `(active-set, char)` transition into a cached table so repeated set-transitions collapse to a single lookup, giving near-O(n). The trade-off is no backreferences, no arbitrary-width lookbehind, sometimes submatch-extraction quirks. For 95% of practical patterns these limits do not bite; for the remaining 5%, use a backtracker but cap input length, set a timeout, and reject patterns with nested quantifiers via a linter.

## complexity
time: NFA simulation: O(m * n). Lazy DFA (RE2 style): O(n) per character once the DFA cache warms, with O(2^m) worst-case states bounded by a memory cap that triggers fallback. Backtracking: O(2^n) worst case, O(m * n) on well-behaved patterns.
space: NFA: O(m) active states. Lazy DFA: bounded cache, usually 8 MB default. Backtracking: O(n) recursion depth, plus capture-group state.
notes: m here is the size of the compiled NFA, which is linear in the source regex with the standard operators. Counted repetition `a{1,1000}` expands m by the count, which is why some engines reject very large bounds.

## pitfalls
- "It works in tests" - tests rarely hit the adversarial input. ReDoS patterns are quiet until production traffic finds them.
- `(a+)+`, `(a|a)*`, `(.*a){n}`, and `(a|ab)*` are the canonical evil patterns. Memorize the shapes.
- Anchoring with `^` and `$` does *not* protect a backtracker - the explosion happens during the failed match attempt that precedes the anchor check.
- Using a backtracker on untrusted input without a timeout is a CVE waiting to happen. Wrap with a watchdog or migrate to RE2.
- Assuming `re.compile(...)` in Python is fast: compilation is fast; *execution* on an evil input is the danger.
- Backreferences (`\1`) and lookaround force backtracking. If you do not need them, do not write them - it disqualifies the entire pattern from DFA optimization in engines that can fall back.

## interviewTips
- Name both algorithms and a real engine for each (Thompson/RE2; backtracking/PCRE). It signals depth.
- Walk through Thompson construction for `a|b` and `a*` on paper - interviewers love to see the epsilon transitions drawn.
- Bring up ReDoS unprompted when discussing input validation; it is the most common production-grade follow-up.
- If asked "why does Python's `re` work this way?" the answer is backwards compatibility with Perl semantics, not technical necessity. Python 3.11 introduced an atomic-group operator partially to mitigate ReDoS.

## code.python
```python
import re

class State:
    def __init__(self): self.eps = []; self.trans = {}; self.accept = False

def thompson(pattern):
    def parse(i):
        start = State(); cur = start
        while i < len(pattern) and pattern[i] != ')':
            c = pattern[i]
            if c == '(':
                sub, i = parse(i + 1)
                cur.eps.append(sub[0]); cur = sub[1]
                i += 1
            elif c == '|':
                alt, i = parse(i + 1)
                fork = State(); fork.eps = [start, alt[0]]
                end = State(); cur.eps.append(end); alt[1].eps.append(end)
                start = fork; cur = end
            elif c == '*':
                loop = State(); loop.eps = [start, State()]
                cur.eps.append(loop); cur = loop.eps[1]
                i += 1
            else:
                nxt = State(); cur.trans[c] = nxt; cur = nxt; i += 1
        cur.accept = True
        return (start, cur), i
    (start, _), _ = parse(0)
    return start

def matches(start, s):
    current = epsilon_closure({start})
    for c in s:
        current = epsilon_closure({st.trans[c] for st in current if c in st.trans})
        if not current: return False
    return any(st.accept for st in current)
```

## code.javascript
```javascript
function epsilonClosure(states) {
  const stack = [...states], out = new Set(states);
  while (stack.length) {
    const s = stack.pop();
    for (const e of s.eps) if (!out.has(e)) { out.add(e); stack.push(e); }
  }
  return out;
}

function simulate(start, input) {
  let current = epsilonClosure(new Set([start]));
  for (const c of input) {
    const next = new Set();
    for (const s of current) if (s.trans[c]) next.add(s.trans[c]);
    current = epsilonClosure(next);
    if (current.size === 0) return false;
  }
  for (const s of current) if (s.accept) return true;
  return false;
}
```

## code.java
```java
class NfaSim {
    static Set<State> epsClosure(Set<State> states) {
        Deque<State> stack = new ArrayDeque<>(states);
        Set<State> out = new HashSet<>(states);
        while (!stack.isEmpty()) {
            State s = stack.pop();
            for (State e : s.eps) if (out.add(e)) stack.push(e);
        }
        return out;
    }

    static boolean simulate(State start, String input) {
        Set<State> current = epsClosure(Set.of(start));
        for (char c : input.toCharArray()) {
            Set<State> next = new HashSet<>();
            for (State s : current) {
                State t = s.trans.get(c);
                if (t != null) next.add(t);
            }
            current = epsClosure(next);
            if (current.isEmpty()) return false;
        }
        return current.stream().anyMatch(s -> s.accept);
    }
}
```

## code.cpp
```cpp
struct State {
    bool accept = false;
    std::vector<State*> eps;
    std::unordered_map<char, State*> trans;
};

std::unordered_set<State*> eps_closure(std::unordered_set<State*> s) {
    std::vector<State*> stack(s.begin(), s.end());
    while (!stack.empty()) {
        State* st = stack.back(); stack.pop_back();
        for (State* e : st->eps) if (s.insert(e).second) stack.push_back(e);
    }
    return s;
}

bool simulate(State* start, const std::string& input) {
    auto current = eps_closure({start});
    for (char c : input) {
        std::unordered_set<State*> next;
        for (State* s : current) if (s->trans.count(c)) next.insert(s->trans[c]);
        current = eps_closure(next);
        if (current.empty()) return false;
    }
    for (State* s : current) if (s->accept) return true;
    return false;
}
```
