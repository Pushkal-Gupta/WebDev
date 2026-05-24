---
slug: regex-engine-build
module: sorting-strings
title: Build a Simple Regex Engine
subtitle: Compile a pattern to an NFA via Thompson's construction, then simulate it on the input.
difficulty: Advanced
position: 1
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Princeton Algorithms — Regular Expressions"
    url: "https://algs4.cs.princeton.edu/54regexp/"
    type: book
  - title: "Finite Automata Algorithms — cp-algorithms"
    url: "https://cp-algorithms.com/string/aho_corasick.html"
    type: blog
  - title: "TheAlgorithms/Python — automata"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
A regex engine answers the question "does this string match this pattern?" for a tiny language: literal characters, concatenation, alternation `a|b`, and Kleene star `a*`. The clean textbook approach compiles the pattern into a non-deterministic finite automaton (NFA) via Thompson's construction, then simulates that NFA on the input by tracking a set of currently active states.

## whyItMatters
Every grep, lexer, tokenizer, and validation library leans on the same recursive idea: small NFAs glue together into bigger NFAs through three operators. Writing one from scratch teaches you why catastrophic backtracking happens in PCRE-style engines (they explore one path deeply) and why Thompson-style engines stay linear (they explore all paths in lockstep).

## intuition
An NFA is a graph of states connected by labelled edges; some edges are free ("epsilon"). At every position in the input you maintain the set of states reachable so far. Reading a character advances every state that has a matching outgoing edge; epsilon-closure then expands that frontier. Acceptance is whether the final accept state is in the set after consuming the whole string.

## visualization
For pattern `a(b|c)*` the NFA has five nodes. State 0 reads `a` to state 1. From 1 epsilons fork into two branches: one reads `b`, the other reads `c`, both rejoining at 1. Trace input `abcb`: active sets evolve `{0}` then read `a` so `{1}` then read `b` so `{1}` then read `c` so `{1}` then read `b` so `{1}` — accept.

## bruteForce
Walk the pattern recursively and try every alternative at every position. For `a*` this means "try 0 copies, then 1, then 2 ..." with full back-tracking. For pathological inputs like `a*a*a*a*b` against `aaaaaa` this devolves into 2^n exploration. Correct but a productivity bomb for adversarial strings.

## optimal
Compile once, simulate once. Compilation is recursive on the parsed pattern: literal becomes a two-state edge; concatenation `XY` wires X's accept to Y's start; alternation `X|Y` creates a fresh start with two epsilon edges and merges accepts via epsilons; Kleene star `X*` adds an epsilon loop from X.accept back to X.start plus a bypass epsilon. Simulation tracks a set of active states, advances it one input character at a time, and accepts if the final set contains the accept state.

## complexity
time: O(m * n) where m = pattern length, n = input length
space: O(m) for the NFA plus O(m) for the active-state set
notes: Each character touches each NFA state at most once per step because the active set is dedup'd. No backtracking means no exponential blow-up — the cost interview engines pay for catastrophic regex robustness.

## pitfalls
- Forgetting epsilon-closure after each step: alternation and star both rely on it; without it `a*` matches only one `a`.
- Using a list instead of a set for active states — duplicates explode under repeated stars.
- Off-by-one when parsing: the parser must respect operator precedence (concat is tighter than `|`).
- Treating `.` and character classes as literals in v1 — fine, but document the supported subset before the interviewer assumes full PCRE.

## interviewTips
- Start by stating the supported subset out loud: "literal, concatenation, `|`, and `*` — let me know if you want me to add `?` or `+` afterwards."
- Sketch the three sub-NFAs on the whiteboard before writing code; the picture sells the design.
- Mention Thompson vs back-tracking: "Java's `Pattern` is back-tracking — that's why `(a+)+$` can hang."

## code.python
```python
class State:
    def __init__(self):
        self.edges = []
        self.eps = []
        self.accept = False

def compile_pattern(pat):
    def parse(i):
        start = accept = State()
        while i < len(pat) and pat[i] != ')' and pat[i] != '|':
            ch = pat[i]
            if ch == '(':
                sub_start, sub_accept, i = parse(i + 1)
                i += 1
            else:
                sub_start, sub_accept = State(), State()
                sub_start.edges.append((ch, sub_accept))
                i += 1
            if i < len(pat) and pat[i] == '*':
                loop = State()
                loop.eps += [sub_start, accept]
                sub_accept.eps.append(loop)
                accept.eps.append(loop)
                accept = loop
                i += 1
            else:
                accept.eps.append(sub_start)
                accept = sub_accept
        return start, accept, i
    start, accept, _ = parse(0)
    accept.accept = True
    return start

def closure(states):
    stack, seen = list(states), set(id(s) for s in states)
    while stack:
        s = stack.pop()
        for n in s.eps:
            if id(n) not in seen:
                seen.add(id(n)); stack.append(n); states.add(n)
    return states

def matches(pat, text):
    start = compile_pattern(pat)
    active = closure({start})
    for ch in text:
        nxt = set()
        for s in active:
            for c, dst in s.edges:
                if c == ch: nxt.add(dst)
        active = closure(nxt)
    return any(s.accept for s in active)
```

## code.javascript
```javascript
class State { constructor(){ this.edges = []; this.eps = []; this.accept = false; } }

function compile(pat) {
  let i = 0;
  function parse() {
    let start = new State(), accept = start;
    while (i < pat.length && pat[i] !== ')' && pat[i] !== '|') {
      let s, a;
      if (pat[i] === '(') { i++; [s, a] = parse(); i++; }
      else { s = new State(); a = new State(); s.edges.push([pat[i], a]); i++; }
      if (pat[i] === '*') {
        const loop = new State();
        loop.eps.push(s, a); a.eps.push(loop); accept.eps.push(loop);
        accept = loop; i++;
      } else { accept.eps.push(s); accept = a; }
    }
    return [start, accept];
  }
  const [start, accept] = parse();
  accept.accept = true;
  return start;
}

function closure(set) {
  const stack = [...set];
  while (stack.length) for (const n of stack.pop().eps) if (!set.has(n)) { set.add(n); stack.push(n); }
  return set;
}

function matches(pat, text) {
  let active = closure(new Set([compile(pat)]));
  for (const ch of text) {
    const next = new Set();
    for (const s of active) for (const [c, d] of s.edges) if (c === ch) next.add(d);
    active = closure(next);
  }
  for (const s of active) if (s.accept) return true;
  return false;
}
```

## code.java
```java
class State {
    List<Object[]> edges = new ArrayList<>();
    List<State> eps = new ArrayList<>();
    boolean accept;
}

class Regex {
    int i;
    String pat;

    State[] parse() {
        State start = new State(), acc = start;
        while (i < pat.length() && pat.charAt(i) != ')' && pat.charAt(i) != '|') {
            State s, a;
            if (pat.charAt(i) == '(') { i++; State[] sub = parse(); s = sub[0]; a = sub[1]; i++; }
            else { s = new State(); a = new State(); s.edges.add(new Object[]{pat.charAt(i), a}); i++; }
            if (i < pat.length() && pat.charAt(i) == '*') {
                State loop = new State();
                loop.eps.add(s); loop.eps.add(a); a.eps.add(loop); acc.eps.add(loop);
                acc = loop; i++;
            } else { acc.eps.add(s); acc = a; }
        }
        return new State[]{start, acc};
    }

    boolean matches(String p, String t) {
        pat = p; i = 0;
        State[] r = parse();
        r[1].accept = true;
        Set<State> active = new HashSet<>(); active.add(r[0]); closure(active);
        for (char ch : t.toCharArray()) {
            Set<State> next = new HashSet<>();
            for (State s : active) for (Object[] e : s.edges) if ((char)e[0] == ch) next.add((State)e[1]);
            closure(next); active = next;
        }
        for (State s : active) if (s.accept) return true;
        return false;
    }

    void closure(Set<State> set) {
        Deque<State> st = new ArrayDeque<>(set);
        while (!st.isEmpty()) for (State n : st.pop().eps) if (set.add(n)) st.push(n);
    }
}
```

## code.cpp
```cpp
struct State {
    vector<pair<char, State*>> edges;
    vector<State*> eps;
    bool accept = false;
};

struct Regex {
    int i; string pat;
    pair<State*, State*> parse() {
        State* start = new State(); State* acc = start;
        while (i < (int)pat.size() && pat[i] != ')' && pat[i] != '|') {
            State *s, *a;
            if (pat[i] == '(') { i++; auto sub = parse(); s = sub.first; a = sub.second; i++; }
            else { s = new State(); a = new State(); s->edges.push_back({pat[i], a}); i++; }
            if (i < (int)pat.size() && pat[i] == '*') {
                State* loop = new State();
                loop->eps = {s, a}; a->eps.push_back(loop); acc->eps.push_back(loop);
                acc = loop; i++;
            } else { acc->eps.push_back(s); acc = a; }
        }
        return {start, acc};
    }
    void closure(set<State*>& cur) {
        vector<State*> st(cur.begin(), cur.end());
        while (!st.empty()) {
            State* x = st.back(); st.pop_back();
            for (auto n : x->eps) if (cur.insert(n).second) st.push_back(n);
        }
    }
    bool matches(string p, string t) {
        pat = p; i = 0;
        auto r = parse();
        r.second->accept = true;
        set<State*> active{r.first}; closure(active);
        for (char ch : t) {
            set<State*> nxt;
            for (auto s : active) for (auto& e : s->edges) if (e.first == ch) nxt.insert(e.second);
            closure(nxt); active = nxt;
        }
        for (auto s : active) if (s->accept) return true;
        return false;
    }
};
```
