---
slug: dm-logic-proofs
module: discrete-math
title: Propositional Logic and Proof Techniques
subtitle: Truth tables, logical equivalence, quantifiers, and the four proof strategies every rigorous argument rests on.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "MIT OCW 6.042J — Mathematics for Computer Science (Fall 2010)"
    url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/"
    type: course
  - title: "Brilliant — Propositional Logic"
    url: "https://brilliant.org/wiki/propositional-logic/"
    type: interactive
  - title: "Open Logic Project — an open-source advanced logic textbook"
    url: "https://openlogicproject.org/"
    type: reference
status: published
---

## intro
Every algorithm you trust, every loop invariant you rely on, every "this can never happen" comment rests on a chain of logical reasoning. Propositional logic is the grammar of that reasoning: it takes statements that are either true or false, glues them together with a handful of connectives, and asks precisely when the whole is true. Once statements carry variables and range over collections, quantifiers extend the grammar to "for all" and "there exists." And proof techniques — direct, contrapositive, contradiction, induction — are the sanctioned moves for turning premises into conclusions you can bet a system on. Master these and correctness stops being a feeling and becomes something you can demonstrate.

## whyItMatters
Logic is the substrate underneath computer science, not a side topic. Boolean algebra drives every circuit and every branch predictor; a compiler simplifies conditions using the same equivalences you will meet here; SQL query planners and SAT solvers manipulate propositional formulas at industrial scale. Type checkers and program verifiers (Coq, Lean, Dafny, TLA+) are machines for checking proofs. Interviewers probe it because loop invariants, correctness arguments, and reasoning about edge cases are logic in disguise — a candidate who confuses a statement with its converse will ship a bug. Beyond code, quantifier order decides whether a definition of continuity or convergence is even correct. Getting implication, negation, and quantifiers right is the difference between an argument that holds and one that merely sounds convincing.

## intuition
A **proposition** is a statement with a definite truth value — true or false, never both. We combine propositions with **truth-functional connectives**, so called because the truth of the compound depends only on the truth values of its parts. Negation \(\lnot p\) flips truth. Conjunction \(p \land q\) is true only when both are true. Disjunction \(p \lor q\) is true when at least one is (inclusive "or"). Exclusive or, \(p \oplus q\), is true when exactly one holds. The one that trips everyone is **implication** \(p \implies q\): it is false in exactly one situation — a true antecedent with a false consequent. "If it rains, the ground is wet" is broken only by rain over dry ground; every other combination keeps the promise. That single fact drives the crucial equivalence
\[
p \implies q \;\equiv\; \lnot p \lor q .
\]

Because implication is false only when \(p\) is true and \(q\) is false, an implication with a **false antecedent is automatically true** — this is **vacuous truth**. "Every unicorn in this room is purple" is true precisely because there are no unicorns to check.

Two formulas are **logically equivalent**, written \(\equiv\), when they share the same truth value in every row of the truth table. The workhorse equivalences are **De Morgan's laws**,
\[
\lnot(p \land q) \equiv \lnot p \lor \lnot q, \qquad \lnot(p \lor q) \equiv \lnot p \land \lnot q,
\]
which say negation swaps AND with OR — exactly how you push a NOT through a compound condition when refactoring. A formula true in *every* row is a **tautology** (e.g. \(p \lor \lnot p\)); one false in every row is a **contradiction** (e.g. \(p \land \lnot p\)); anything in between is a **contingency**. Note \(p \implies q\) is **not** equivalent to its **converse** \(q \implies p\) nor its **inverse** \(\lnot p \implies \lnot q\); it *is* equivalent to its **contrapositive** \(\lnot q \implies \lnot p\), the fact that powers proof by contrapositive.

**Quantifiers** lift logic from fixed statements to predicates over a domain. Universal \(\forall x\, P(x)\) claims \(P\) holds for every element; existential \(\exists x\, P(x)\) claims at least one. Their negations mirror De Morgan: \(\lnot \forall x\, P(x) \equiv \exists x\, \lnot P(x)\) and \(\lnot \exists x\, P(x) \equiv \forall x\, \lnot P(x)\). **Order matters**: \(\forall x\, \exists y\, (x < y)\) ("every number has something bigger" — true over the integers) is not \(\exists y\, \forall x\, (x < y)\) ("one number beats them all" — false). Swapping quantifiers can silently change a true claim into a false one.

## visualization
```
 p  q | ¬p |  p∧q | p∨q | p⊕q | p→q | p↔q |  ¬(p∧q)  ¬p∨¬q   (De Morgan: equal cols)
------+----+------+-----+-----+-----+-----+----------------------------------------
 T  T |  F |   T  |  T  |  F  |  T  |  T  |     F         F
 T  F |  F |   F  |  T  |  T  |  F  |  F  |     T         T
 F  T |  T |   F  |  T  |  T  |  T  |  F  |     T         T
 F  F |  T |   F  |  F  |  F  |  T  |  T  |     T         T
------+----+------+-----+-----+-----+-----+----------------------------------------
 p→q is FALSE on exactly one row (T,F).   p∨¬p is a TAUTOLOGY (all T).
 ¬(p∧q) and ¬p∨¬q match every row  =>  they are logically equivalent.
```

## bruteForce
The definitive way to settle any question about a formula over \(n\) variables is to **enumerate the entire truth table**: list all \(2^n\) assignments of true/false, evaluate the formula on each row, and read off the answer. Is it a tautology? Check that the result column is all-true. A contradiction? All-false. Are two formulas equivalent? Build both columns and confirm they agree in every row. Is an argument valid? Confirm the conclusion is true in every row where all premises are true. This is complete and never wrong — it literally checks every case — which is exactly why it is the ground truth against which cleverer methods are validated. Its only flaw is cost: the table doubles with each new variable, so ten variables already means 1024 rows and twenty means over a million, making pure enumeration impractical for large formulas.

## optimal
Enumeration is exponential, so for scale we reason with **equivalences** instead of rows. Applying De Morgan, distribution, double-negation, and the identity \(p \implies q \equiv \lnot p \lor q\) lets you rewrite a formula into a **normal form**. Conjunctive normal form (CNF) — an AND of OR-clauses — is what SAT solvers consume; disjunctive normal form (DNF) is an OR of AND-terms. To *prove* a tautology you can transform it algebraically to \(\top\); to test satisfiability you feed the CNF to a solver whose DPLL/CDCL search prunes the \(2^n\) space far below brute force in practice. This is decision-procedure territory: propositional validity is decidable but co-NP-complete, so no known method beats exponential worst case — the art is avoiding it on real inputs.

When variables and quantifiers enter, truth tables vanish and you need **proof strategies**:

- **Direct proof.** To show \(p \implies q\), assume \(p\) and derive \(q\) by definitions and prior results.
- **Contrapositive.** Since \(p \implies q \equiv \lnot q \implies \lnot p\), assume \(\lnot q\) and derive \(\lnot p\) — often easier (e.g. "if \(n^2\) is even then \(n\) is even" is cleaner as "if \(n\) is odd then \(n^2\) is odd").
- **Contradiction.** Assume the statement is false, i.e. assume \(p \land \lnot q\), and derive an impossibility; the classic proof that \(\sqrt{2}\) is irrational works this way.
- **Induction.** To prove \(\forall n \ge n_0\, P(n)\), establish the **base case** \(P(n_0)\), then the **inductive step** \(P(k) \implies P(k+1)\); together they cover every \(n\) like dominoes. **Strong induction** assumes \(P(n_0),\dots,P(k)\) all hold to prove \(P(k+1)\), which suits recursive structures.

Choosing the strategy is the skill: reach for contrapositive when \(\lnot q\) gives concrete algebra, contradiction when the negation exposes a clash, induction whenever the claim ranges over the naturals or a recursively defined structure.

## complexity
time: O(2^n) to build a full truth table over n variables; deciding tautology/SAT is co-NP-complete / NP-complete, so no known sub-exponential worst-case algorithm exists, though DPLL/CDCL solvers prune aggressively in practice.
space: O(n) to hold one assignment at a time when streaming rows, or O(2^n) to materialize the whole table; CNF conversion can blow up formula size unless the Tseitin encoding is used to keep it linear.
notes: Evaluating a single fixed assignment is O(size of formula). The exponential blowup is in the number of *rows* (assignments), not in evaluating any one of them, so short-circuiting and memoization help constant factors but not the asymptotic worst case.

## pitfalls
- **Implication direction / converse confusion.** \(p \implies q\) is not its converse \(q \implies p\). "If prime then it has no small divisors" does not give you "if no small divisors then prime." Proving the converse proves a different theorem.
- **Inverse ≠ original.** The inverse \(\lnot p \implies \lnot q\) is equivalent to the *converse*, not the statement. Only the **contrapositive** \(\lnot q \implies \lnot p\) is equivalent to \(p \implies q\); mixing these up invalidates a contrapositive proof.
- **Vacuous truth surprises.** An implication with a false antecedent is true, and \(\forall x \in \varnothing\, P(x)\) is true. Forgetting this makes you "disprove" statements that are actually (trivially) true, or assert a universal you never verified because the domain was empty.
- **De Morgan errors.** \(\lnot(p \land q)\) is \(\lnot p \lor \lnot q\), **not** \(\lnot p \land \lnot q\); the connective must flip. Dropping the flip (or negating \(p < x \le q\) wrong) is the most common refactoring bug in `if` conditions.
- **Quantifier order and negation.** \(\forall x\, \exists y\) is not \(\exists y\, \forall x\), and \(\lnot \forall x\, P(x)\) is \(\exists x\, \lnot P(x)\) — you negate by swapping the quantifier and negating the body, not by leaving the quantifier alone.

## interviewTips
- When asked to prove "if A then B," state which strategy you are using and why — "the contrapositive is cleaner here because \(\lnot B\) gives me a concrete factorization" — before diving in; naming the move signals control.
- For any claim over the natural numbers or a recursive structure, default to induction and be explicit about base case *and* inductive hypothesis; a missing or too-weak base case is the single most common flaw interviewers look for.
- Sanity-check equivalence claims and negations with a two- or three-row truth table on the spot; it catches converse/inverse slips and De Morgan sign errors faster than staring at the symbols.

## keyTakeaways
- A compound proposition's truth is fixed by its parts via truth-functional connectives; \(p \implies q\) is false only when \(p\) is true and \(q\) is false, giving \(p \implies q \equiv \lnot p \lor q\) and the vacuous-truth rule.
- Logical equivalence, tautology, and contradiction are settled by comparing every row of a \(2^n\)-row truth table; De Morgan's laws and normal forms let you reason without enumerating rows, and only the contrapositive (never the converse or inverse) is equivalent to the original implication.
- Proof techniques — direct, contrapositive, contradiction, and induction — are the sanctioned ways to establish universally quantified claims; pick induction for statements over the naturals, and always respect quantifier order since \(\forall x\, \exists y\) differs from \(\exists y\, \forall x\).

## code.python
```python
from itertools import product

def is_tautology(var_names, expr):
    """expr: fn(env: dict[str,bool]) -> bool. Prints the table, returns verdict."""
    rows = list(product([False, True], repeat=len(var_names)))
    results = []
    for combo in rows:
        env = dict(zip(var_names, combo))
        results.append(expr(env))
    for combo, out in zip(rows, results):
        env = dict(zip(var_names, combo))
        print("  ".join(f"{k}={int(env[k])}" for k in var_names), "->", int(out))
    if all(results):
        return "tautology"
    if not any(results):
        return "contradiction"
    return "contingency"

# (p -> q)  ==  (not p or q)
implies = lambda e: (not e["p"]) or e["q"]
print(is_tautology(["p", "q"], lambda e: implies(e) == ((not e["p"]) or e["q"])))  # tautology
```

## code.javascript
```javascript
function classify(vars, expr) {
  const n = vars.length;
  const results = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const env = {};
    vars.forEach((v, i) => { env[v] = Boolean((mask >> (n - 1 - i)) & 1); });
    const out = expr(env);
    results.push(out);
    console.log(vars.map((v) => `${v}=${env[v] ? 1 : 0}`).join("  "), "->", out ? 1 : 0);
  }
  if (results.every(Boolean)) return "tautology";
  if (results.every((r) => !r)) return "contradiction";
  return "contingency";
}

const implies = (e) => !e.p || e.q;
// De Morgan: !(p && q) === (!p || !q)  -> tautology
console.log(classify(["p", "q"], (e) => (!(e.p && e.q)) === (!e.p || !e.q)));
console.log(classify(["p", "q"], (e) => implies(e) === (!e.p || e.q)));
```

## code.java
```java
import java.util.function.Predicate;
import java.util.Map;
import java.util.HashMap;

public class TruthTable {
    static String classify(String[] vars, Predicate<Map<String, Boolean>> expr) {
        int n = vars.length;
        boolean allTrue = true, allFalse = true;
        for (int mask = 0; mask < (1 << n); mask++) {
            Map<String, Boolean> env = new HashMap<>();
            for (int i = 0; i < n; i++) env.put(vars[i], ((mask >> (n - 1 - i)) & 1) == 1);
            boolean out = expr.test(env);
            allTrue &= out;
            allFalse &= !out;
            StringBuilder sb = new StringBuilder();
            for (String v : vars) sb.append(v).append("=").append(env.get(v) ? 1 : 0).append("  ");
            System.out.println(sb + "-> " + (out ? 1 : 0));
        }
        return allTrue ? "tautology" : allFalse ? "contradiction" : "contingency";
    }
    public static void main(String[] args) {
        // p -> q  ==  !p || q   is a tautology
        System.out.println(classify(new String[]{"p", "q"},
            e -> ((!e.get("p")) || e.get("q")) == ((!e.get("p")) || e.get("q"))));
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>
#include <string>
#include <functional>

std::string classify(const std::vector<std::string>& vars,
                     const std::function<bool(const std::vector<bool>&)>& expr) {
    int n = (int)vars.size();
    bool allTrue = true, allFalse = true;
    for (int mask = 0; mask < (1 << n); ++mask) {
        std::vector<bool> env(n);
        for (int i = 0; i < n; ++i) env[i] = (mask >> (n - 1 - i)) & 1;
        bool out = expr(env);
        allTrue &= out;
        allFalse &= !out;
        for (int i = 0; i < n; ++i) std::printf("%s=%d  ", vars[i].c_str(), (int)env[i]);
        std::printf("-> %d\n", (int)out);
    }
    return allTrue ? "tautology" : allFalse ? "contradiction" : "contingency";
}

int main() {
    // De Morgan: !(p && q) == (!p || !q) is a tautology
    auto f = [](const std::vector<bool>& e) {
        bool p = e[0], q = e[1];
        return (!(p && q)) == ((!p) || (!q));
    };
    std::printf("%s\n", classify({"p", "q"}, f).c_str());
    return 0;
}
```
