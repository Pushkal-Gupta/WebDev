---
slug: regex-engine-build
module: strings-matching
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
- **grep, ripgrep, GNU sed**: ripgrep and Go's `regexp` package use Thompson-style NFA simulation specifically to avoid catastrophic backtracking on adversarial inputs. RE2 (the Google-authored library powering many of these) is the production reference.
- **Lexers and tokenisers**: flex, the lexer behind countless compilers, and Lark / ANTLR generators all compile regular-expression rules into NFAs and then determinise into DFAs for token recognition.
- **Validation libraries** for JSON Schema patterns, OpenAPI specs, and CloudFlare WAF rules use regex engines that must run on attacker-controlled input — backtracking engines have caused real outages (Cloudflare's 2019 global outage was a catastrophic-backtracking regex).
- **The original Thompson 1968 paper** (Ken Thompson, "Regular Expression Search Algorithm") introduced this exact construction; it is the algorithmic ancestor of every modern regex engine.
- Writing one from scratch teaches you why `(a+)+$` hangs in Java/Perl/Python (backtracking explores one path deeply) and why grep stays linear (NFA simulation explores all paths in lockstep). It is a top-tier system-design follow-up at Google, Cloudflare, and Datadog.

## intuition
The algorithm exists because the naïve approach to matching — recursive backtracking — explores one match path at a time and can revisit the same `(pattern_position, input_position)` state exponentially many times. The escape route is Thompson 1968's insight: convert the pattern into an NFA whose states are pattern positions and whose transitions encode "what the next character must be", then simulate the NFA by tracking *all currently-active states* in parallel. Each input character advances every active state in lockstep, so the total work is bounded by O(m·n) regardless of how the pattern is shaped.

An NFA is a graph of states connected by labelled edges; some edges are "epsilon" (free transitions taken without consuming input). At every position in the input you maintain the set of states reachable so far. Reading a character advances every active state that has a matching outgoing edge; epsilon-closure then expands the new frontier with any states reachable via free transitions. Acceptance is whether the final accept state is in the set after consuming the whole string.

Thompson's construction builds the NFA compositionally from three operators. A literal `a` becomes a two-state edge labelled `a`. Concatenation `XY` wires X's accept to Y's start via epsilon. Alternation `X|Y` creates a fresh start with two epsilon edges into X and Y, and merges their accept states via epsilon into a fresh accept. Kleene star `X*` adds an epsilon loop from X's accept back to X's start plus a bypass epsilon from the loop start to the loop accept (allowing zero repetitions). The resulting NFA has at most O(m) states and O(m) edges.

The deeper principle: by tracking sets of states instead of a single state with backtracking, you replace exponential exploration with set-update operations of bounded size. Each state appears at most once in the active set per step (dedup), so per-character work is O(m), giving O(m·n) total. This is precisely the "frontier of all possibilities" pattern that recurs in BFS, simulation, and dynamic-programming-as-graph-traversal.

## visualization
For pattern `a(b|c)*` the NFA has five nodes. State 0 reads `a` to state 1. From 1 epsilons fork into two branches: one reads `b`, the other reads `c`, both rejoining at 1. Trace input `abcb`: active sets evolve `{0}` then read `a` so `{1}` then read `b` so `{1}` then read `c` so `{1}` then read `b` so `{1}` — accept.

## bruteForce
Walk the pattern recursively and try every alternative at every position. For `a*` this means "try 0 copies, then 1, then 2 ..." with full back-tracking. For pathological inputs like `a*a*a*a*b` against `aaaaaa` this devolves into 2^n exploration. Correct but a productivity bomb for adversarial strings.

## optimal
**Technique: Thompson NFA construction + parallel active-set simulation (no backtracking).** O(m·n) time, O(m) space. Optimal among NFA-simulation algorithms because each `(state, input_position)` pair is touched at most once — the set deduplication is the lever that prevents exponential exploration. RE2, Go's regexp, and ripgrep use precisely this design (or a derived DFA after on-the-fly subset construction).

```python
class State:
    def __init__(self):
        self.edges = []      # list of (char, dest_state) labelled transitions
        self.eps = []        # list of free (epsilon) transitions
        self.accept = False

def compile_pattern(pat):
    def parse(i):
        start = accept = State()
        while i < len(pat) and pat[i] not in ')|':
            if pat[i] == '(':
                sub_start, sub_accept, i = parse(i + 1); i += 1
            else:
                sub_start, sub_accept = State(), State()
                sub_start.edges.append((pat[i], sub_accept)); i += 1
            if i < len(pat) and pat[i] == '*':           # Kleene star: loop + bypass
                loop = State()
                loop.eps += [sub_start, accept]
                sub_accept.eps.append(loop)
                accept.eps.append(loop)
                accept = loop; i += 1
            else:                                          # concatenation
                accept.eps.append(sub_start); accept = sub_accept
        return start, accept, i
    start, accept, _ = parse(0)
    accept.accept = True
    return start

def closure(states):                                       # epsilon-closure: expand via free transitions
    stack, seen = list(states), {id(s) for s in states}
    while stack:
        for n in stack.pop().eps:
            if id(n) not in seen:
                seen.add(id(n)); stack.append(n); states.add(n)
    return states

def matches(pat, text):
    active = closure({compile_pattern(pat)})
    for ch in text:
        nxt = set()
        for s in active:
            for c, dst in s.edges:
                if c == ch: nxt.add(dst)
        active = closure(nxt)                              # advance every active state in lockstep
    return any(s.accept for s in active)
```

Key lines: `loop.eps += [sub_start, accept]` is Thompson's Kleene-star construction — the loop state has free transitions both back into the sub-NFA (allowing more repetitions) and forward to the accept (allowing zero or termination). `closure()` is the epsilon-closure routine that expands the active set with every state reachable via free transitions; without it, alternation and star would silently lose matches. The simulation loop `for s in active: for c, dst in s.edges: if c == ch: nxt.add(dst)` advances every currently-active state simultaneously — the parallel-frontier idea that kills backtracking.

**Why not regex with backtracking (Python `re`, Java `Pattern`, PCRE)?** Backtracking engines support more features (back-references, lookahead, lookbehind), but pay catastrophic worst-case exponential time. Cloudflare's 2019 global outage was caused by exactly this. **Why not DFA?** A DFA gives O(n) match time but O(2^m) construction in the worst case. Production engines like RE2 use a hybrid that lazily caches DFA states from the NFA on demand. **Why not Aho-Corasick?** Aho-Corasick (1975) is the multi-pattern analogue — same era, same paradigm — and is optimal when you have a fixed dictionary of patterns to scan for simultaneously.

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
