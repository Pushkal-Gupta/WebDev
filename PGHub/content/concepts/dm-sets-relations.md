---
slug: dm-sets-relations
module: discrete-math
title: Set Theory and Relations
subtitle: The grammar of collections — union, intersection, Cartesian products, and the relations that turn sets into structure.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "MIT OCW 6.042J — Mathematics for Computer Science (Fall 2010)"
    url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/"
    type: course
  - title: "Brilliant — Set Notation"
    url: "https://brilliant.org/wiki/set-notation/"
    type: reference
  - title: "Khan Academy — Basic set operations"
    url: "https://www.khanacademy.org/math/statistics-probability/probability-library/basic-set-ops/v/intersection-and-union-of-sets"
    type: course
status: published
---

## intro
A set is the most primitive object in mathematics: an unordered collection of distinct things, with no notion of position and no duplicates. From that one idea the entire scaffolding of discrete mathematics is built — numbers, functions, graphs, databases, and type systems are all sets with extra structure bolted on. This lesson covers the core vocabulary: how to combine sets with union, intersection, difference, and complement; how to build bigger sets with Cartesian products and power sets; and how **relations** — subsets of a product — encode "is connected to," "is less than," or "belongs to the same group as." Master this and the rest of discrete math reads like sentences instead of hieroglyphics.

## whyItMatters
Sets are the shared language every other topic borrows. A SQL query is relational algebra: `JOIN` is a filtered Cartesian product, `UNION`/`INTERSECT`/`EXCEPT` are exactly the set operations, and a primary-key constraint says a relation is a function. Graph algorithms treat edges as a relation on vertices; equivalence relations are the formal engine behind union-find, connected components, and modular arithmetic. Type systems model sum and product types as unions and Cartesian products. Inclusion-exclusion counts overlapping possibilities in combinatorics, probability, and the sieve algorithms that power number theory. Even a hash set — the workhorse of interview coding — is a physical realization of set membership. Learning to think in sets and relations means you stop reinventing these ideas ad hoc and start recognizing them everywhere, which is precisely what makes a strong problem solver.

## intuition
Write a set with braces: \(A = \{1,2,3,4\}\). Order and repetition are irrelevant, so \(\{1,2,2,3\}\) *is* \(\{1,2,3\}\). Membership is the atomic question — \(3 \in A\), \(7 \notin A\) — and \(|A|\) denotes cardinality, the number of elements. The empty set \(\varnothing\) has \(|\varnothing| = 0\) and is a subset of every set.

The four combining operations are best pictured as regions of a Venn diagram. The **union** \(A \cup B\) is everything in either set; **intersection** \(A \cap B\) is the overlap; **difference** \(A \setminus B\) is what is in \(A\) but not \(B\); and the **complement** \(A^c = U \setminus A\) is everything in the universe \(U\) outside \(A\). Symmetric difference \(A \triangle B = (A\setminus B)\cup(B\setminus A)\) is the "exactly one of the two" region. These obey clean algebraic laws: commutativity, associativity, distributivity \(A\cap(B\cup C)=(A\cap B)\cup(A\cap C)\), and De Morgan's laws \((A\cup B)^c = A^c \cap B^c\).

Counting the union double-counts the overlap, so you subtract it once — the **inclusion-exclusion** identity \(|A \cup B| = |A| + |B| - |A \cap B|\). For three sets it grows to \(|A\cup B\cup C| = |A|+|B|+|C|-|A\cap B|-|A\cap C|-|B\cap C|+|A\cap B\cup C|\), alternating signs by intersection size.

The **Cartesian product** \(A \times B = \{(a,b) : a\in A,\ b\in B\}\) pairs every element of \(A\) with every element of \(B\), so \(|A\times B| = |A|\cdot|B|\). The **power set** \(\mathcal{P}(A)\) is the set of all subsets, and \(|\mathcal{P}(A)| = 2^{|A|}\) because each element is independently in or out.

A **relation** \(R\) from \(A\) to \(B\) is just a subset \(R \subseteq A \times B\); we write \(a\,R\,b\) when \((a,b)\in R\). A relation on a single set \(A\) can be **reflexive** (every \(a\,R\,a\)), **symmetric** (\(a\,R\,b \Rightarrow b\,R\,a\)), **antisymmetric** (\(a\,R\,b\) and \(b\,R\,a\) force \(a=b\)), or **transitive** (\(a\,R\,b\) and \(b\,R\,c \Rightarrow a\,R\,c\)). A relation that is reflexive, symmetric, and transitive is an **equivalence relation**; it carves \(A\) into disjoint **equivalence classes** that partition the set (think "same remainder mod 5"). A relation that is reflexive, antisymmetric, and transitive is a **partial order**, the abstraction behind "\(\le\)", divisibility, and subset containment. Finally, a **function** \(f: A \to B\) is a relation where every \(a\) maps to exactly one \(b\); it is **injective** (one-to-one) if no two inputs share an output, **surjective** (onto) if every \(b\) is hit, and **bijective** if both — a perfect pairing that makes \(|A|=|B|\).

## visualization
```
Two sets  A = {1,2,3,4}   B = {3,4,5,6}   universe U = {1..8}

 region          members       belongs to           operation that selects it
 -------------   -----------   ------------------    -------------------------
 A \ B           1, 2          A only                difference  A \ B
 A n B           3, 4          both A and B          intersection A n B
 B \ A           5, 6          B only                difference  B \ A
 outside both    7, 8          neither (in U)        complement (A u B)^c

 A u B  = {1,2,3,4,5,6}        |A u B| = 6
 A n B  = {3,4}                |A n B| = 2
 A ^ B  = {1,2,5,6}            symmetric difference (A\B) u (B\A)

 inclusion-exclusion check:   |A| + |B| - |A n B| = 4 + 4 - 2 = 6 = |A u B|  OK
```

## bruteForce
The direct way to compute any set operation is to store elements in a list and scan. For union, copy \(A\) then append each element of \(B\) not already present; for intersection, keep each element of \(A\) that a linear search finds in \(B\); for difference, keep each element of \(A\) that is absent from \(B\). Every membership test walks the other list, so each operation costs \(O(|A|\cdot|B|)\) comparisons — quadratic. Cardinality of a union via inclusion-exclusion still needs the intersection count, computed the same slow way. This is correct and needs no cleverness, which makes it fine for tiny sets or a whiteboard sanity check, but it collapses on large inputs: a union of two ten-thousand-element lists does a hundred million comparisons. The fix is to give membership a faster answer than a linear scan, which is exactly what the optimal representations below do.

## optimal
Replace linear membership with a structure that answers \(x \in S\) in near-constant time. A **hash set** stores elements in a table so membership, insert, and delete are expected \(O(1)\); then union, intersection, and difference each cost \(O(|A| + |B|)\) — you iterate the smaller set and probe the larger. This is what `set()` in Python and `HashSet` in Java do under the hood, and it is the representation you reach for in interviews.

When the universe is small and fixed — say elements are integers \(0\ldots 63\) — a **bitset** is unbeatable: represent \(S\) as an integer whose \(i\)-th bit is 1 iff \(i \in S\). Then union is bitwise OR, intersection is AND, difference is `A & ~B`, symmetric difference is XOR, and cardinality is a popcount — each a single machine word operation covering 64 elements at once. Wider universes use an array of words, giving \(O(n/64)\) set operations, which is how bitset-DP and subset enumeration stay fast.

**Inclusion-exclusion** turns overlap-counting into arithmetic. For three sets, \(|A\cup B\cup C| = |A|+|B|+|C|-|A\cap B|-|A\cap C|-|B\cap C|+|A\cap B\cap C|\): add singles, subtract pairs, add the triple. The general rule alternates signs by intersection size, and it is the backbone of counting surjections, derangements, and "at least one property" problems.

For an **equivalence relation**, you rarely materialize the full \(O(n^2)\) relation. Instead compute the **quotient** — the partition into equivalence classes — with a union-find (disjoint-set) structure: union the endpoints of each relating pair, and the resulting roots label the classes in near-linear \(O(n\,\alpha(n))\) time. That quotient is the practical payload: connected components of a graph, congruence classes mod \(m\), or clusters under "same group as." **Partial orders** get processed with topological sort, respecting the antisymmetric direction. The through-line: pick the representation (hash, bitset, or disjoint-set) that makes your dominant query cheap, and the algebra follows for free.

## complexity
time: hash-set union/intersection/difference \(O(|A|+|B|)\) expected; bitset operations \(O(n/w)\) for word size \(w\) (a single word when \(n \le 64\)); building the quotient of an equivalence relation via union-find \(O(n\,\alpha(n))\); brute-force list operations \(O(|A|\cdot|B|)\).
space: \(O(|A|+|B|)\) for hash sets; \(O(n/w)\) words for a bitset over an \(n\)-element universe; \(O(n)\) for union-find parent/rank arrays; the full Cartesian product \(A\times B\) and any dense relation on it cost \(O(|A|\cdot|B|)\), and a power set is \(O(2^{|A|})\) — both explode, so enumerate lazily.
notes: The 3-set inclusion-exclusion has \(2^3-1=7\) terms; the general \(k\)-set version has \(2^k-1\) terms, so it is only practical for small \(k\). Prefer disjoint-set over storing an equivalence relation explicitly.

## pitfalls
- **Empty-set edge cases.** \(\varnothing\) is a subset of every set and \(A\cup\varnothing = A\), \(A\cap\varnothing = \varnothing\). Code that special-cases "no elements" often forgets that \(\varnothing \subseteq A\) is always true and that \(|\mathcal{P}(\varnothing)| = 2^0 = 1\) (the power set of the empty set contains one element: the empty set itself).
- **Subset vs proper subset.** \(A \subseteq B\) allows \(A = B\); \(A \subsetneq B\) demands a strictly smaller \(A\). Mixing the two breaks counting arguments and off-by-one bounds — a set is a subset of itself but not a *proper* subset of itself.
- **A relation that is not a function.** Every function is a relation, but a relation is a function only if each input maps to *exactly one* output. Allowing an element of \(A\) to relate to two elements of \(B\) (or to none) silently violates the function contract — the classic bug behind a broken lookup table.
- **Symmetric vs antisymmetric.** These are not opposites. "\(=\)" is both; "\(\le\)" is antisymmetric but not symmetric; "is a sibling of" is symmetric but not antisymmetric. Assuming a relation must be one or the other loses the many relations that are neither.
- **Double counting in inclusion-exclusion.** Adding \(|A|+|B|+|C|\) counts triple-overlap elements three times; subtracting all three pairwise intersections then removes them three times, leaving zero — so you must add \(|A\cap B\cap C|\) back. Forgetting the final \(+\) term (or the sign pattern) is the single most common inclusion-exclusion error.

## interviewTips
- When asked to dedupe, test overlap, or find "common elements," say the word **set** and reach for a hash set immediately — \(O(n)\) membership beats the nested-loop \(O(n^2)\) an interviewer is watching for you to avoid.
- If the universe is small integers or booleans, propose a **bitmask**: union/intersection/complement become OR/AND/NOT, cardinality is a popcount, and subset enumeration is a clean loop over \(2^n\). It signals fluency and unlocks bitset-DP.
- Recognize "group things that are equivalent / connected / in the same cluster" as an **equivalence relation** and answer with **union-find** and the three axioms (reflexive, symmetric, transitive) — naming the structure and justifying the partition earns the point.

## keyTakeaways
- A set is an unordered, duplicate-free collection; the four operations \(A\cup B\), \(A\cap B\), \(A\setminus B\), and \(A^c\) are Venn regions obeying De Morgan and distributive laws, and \(|A\cup B| = |A|+|B|-|A\cap B|\) corrects the double-counted overlap.
- Cartesian products build ordered pairs (\(|A\times B|=|A|\,|B|\)) and power sets build all subsets (\(|\mathcal{P}(A)|=2^{|A|}\)); a relation is just a subset of a product, and its reflexive/symmetric/transitive properties classify it as an equivalence relation (a partition) or a partial order.
- Choose the representation that makes membership cheap — hash set for \(O(1)\) probes, bitset for tiny fixed universes, union-find for equivalence quotients — and inclusion-exclusion counts overlapping possibilities by alternating signs over \(2^k-1\) intersection terms.

## code.python
```python
def set_ops(a, b):
    A, B = set(a), set(b)
    return {
        "union": A | B,
        "intersection": A & B,
        "difference": A - B,          # A \ B
        "symmetric_difference": A ^ B,
        "is_subset": A <= B,
        "cardinality_union": len(A) + len(B) - len(A & B),  # inclusion-exclusion
    }

def inclusion_exclusion_3(A, B, C):
    A, B, C = set(A), set(B), set(C)
    return (len(A) + len(B) + len(C)
            - len(A & B) - len(A & C) - len(B & C)
            + len(A & B & C))

def cartesian_product(A, B):
    return [(x, y) for x in A for y in B]

def power_set(A):
    A = list(A)
    subsets = [[]]
    for x in A:
        subsets += [s + [x] for s in subsets]   # each element doubles the count
    return subsets

if __name__ == "__main__":
    print(set_ops([1, 2, 3, 4], [3, 4, 5, 6])["cardinality_union"])  # 6
    print(inclusion_exclusion_3([1, 2, 3], [2, 3, 4], [3, 4, 5]))    # 5
    print(len(power_set([1, 2, 3])))                                 # 8 = 2**3
```

## code.javascript
```javascript
function setOps(a, b) {
  const A = new Set(a), B = new Set(b);
  const union = new Set([...A, ...B]);
  const intersection = new Set([...A].filter((x) => B.has(x)));
  const difference = new Set([...A].filter((x) => !B.has(x)));      // A \ B
  const symmetric = new Set([...union].filter((x) => !(A.has(x) && B.has(x))));
  return {
    union, intersection, difference, symmetric,
    cardinalityUnion: A.size + B.size - intersection.size,          // inclusion-exclusion
  };
}

function inclusionExclusion3(a, b, c) {
  const A = new Set(a), B = new Set(b), C = new Set(c);
  const inter = (X, Y) => [...X].filter((x) => Y.has(x)).length;
  const interAll = [...A].filter((x) => B.has(x) && C.has(x)).length;
  return A.size + B.size + C.size
    - inter(A, B) - inter(A, C) - inter(B, C) + interAll;
}

console.log(setOps([1, 2, 3, 4], [3, 4, 5, 6]).cardinalityUnion); // 6
console.log(inclusionExclusion3([1, 2, 3], [2, 3, 4], [3, 4, 5])); // 5
```

## code.java
```java
import java.util.*;

public class SetRelations {
    static int cardinalityUnion(Set<Integer> a, Set<Integer> b) {
        Set<Integer> inter = new HashSet<>(a);
        inter.retainAll(b);                       // A n B
        return a.size() + b.size() - inter.size(); // inclusion-exclusion
    }

    static int inclusionExclusion3(Set<Integer> a, Set<Integer> b, Set<Integer> c) {
        return a.size() + b.size() + c.size()
            - inter(a, b) - inter(a, c) - inter(b, c)
            + interAll(a, b, c);
    }

    static int inter(Set<Integer> x, Set<Integer> y) {
        Set<Integer> t = new HashSet<>(x); t.retainAll(y); return t.size();
    }
    static int interAll(Set<Integer> x, Set<Integer> y, Set<Integer> z) {
        Set<Integer> t = new HashSet<>(x); t.retainAll(y); t.retainAll(z); return t.size();
    }

    public static void main(String[] args) {
        Set<Integer> A = new HashSet<>(List.of(1, 2, 3, 4));
        Set<Integer> B = new HashSet<>(List.of(3, 4, 5, 6));
        System.out.println(cardinalityUnion(A, B));                          // 6
        System.out.println(inclusionExclusion3(
            new HashSet<>(List.of(1, 2, 3)),
            new HashSet<>(List.of(2, 3, 4)),
            new HashSet<>(List.of(3, 4, 5))));                               // 5
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

int cardinalityUnion(const set<int>& a, const set<int>& b) {
    vector<int> inter;
    set_intersection(a.begin(), a.end(), b.begin(), b.end(),
                     back_inserter(inter));            // A n B
    return (int)a.size() + (int)b.size() - (int)inter.size(); // inclusion-exclusion
}

// Bitset representation: sets over the universe 0..63 in one 64-bit word.
struct BitSet {
    unsigned long long bits = 0;
    void add(int x) { bits |= (1ULL << x); }
    BitSet uni(BitSet o)  const { return {bits | o.bits}; }  // union
    BitSet inter(BitSet o) const { return {bits & o.bits}; } // intersection
    BitSet diff(BitSet o)  const { return {bits & ~o.bits}; }// A \ B
    int card() const { return __builtin_popcountll(bits); }  // cardinality
};

int main() {
    set<int> A = {1, 2, 3, 4}, B = {3, 4, 5, 6};
    cout << cardinalityUnion(A, B) << "\n";               // 6

    BitSet x, y;
    for (int v : {1, 2, 3, 4}) x.add(v);
    for (int v : {3, 4, 5, 6}) y.add(v);
    cout << x.uni(y).card() << "\n";                      // 6
    cout << x.inter(y).card() << "\n";                    // 2
    return 0;
}
```
