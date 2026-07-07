---
slug: compiler-semantics-types
module: compilers
title: Semantic Analysis — Scopes, Symbol Tables, and Type Checking
subtitle: The stage that decides whether a syntactically valid program actually means something — walking the AST to resolve every name to its declaration, track scopes with a symbol table, and catch type errors like adding a number to a string before any code ever runs.
difficulty: Advanced
position: 3
estimatedReadMinutes: 15
prereqs: [compiler-parsing]
relatedProblems: []
references:
  - title: "Crafting Interpreters — Chapter 11: Resolving and Binding"
    url: "https://craftinginterpreters.com/resolving-and-binding.html"
    type: book
  - title: "Crafting Interpreters — Chapter 8: Statements and State"
    url: "https://craftinginterpreters.com/statements-and-state.html"
    type: book
  - title: "Aho, Lam, Sethi & Ullman — Compilers: Principles, Techniques, and Tools (Dragon Book), Ch. 6: Semantic Analysis / Type Checking"
    url: "https://suif.stanford.edu/dragonbook/"
    type: book
  - title: "Wikipedia — Type system"
    url: "https://en.wikipedia.org/wiki/Type_system"
    type: article
status: published
---

## intro
A program can be perfectly grammatical and still be nonsense. `x + 1` parses cleanly into an AST — but if `x` was never declared, or if `x` is a string, the program has no coherent meaning. The parser only checks *shape*; it happily builds a tree for `"hello" * true` because that is a valid arrangement of tokens. **Semantic analysis** is the stage that asks the deeper question: does this well-formed tree actually make sense? It walks the AST and enforces the rules that grammar cannot express — every name must refer to something in scope, every operation must be applied to compatible types, every function must be called with the right number of arguments. Its two central tools are the **symbol table**, which tracks what names exist and what they mean in each scope, and **type checking**, which verifies that values flow through operations sensibly. This is the last line of defense before code runs.

## whyItMatters
Semantic analysis is where most of the errors you actually hit during development are caught: "undefined variable," "cannot assign string to int," "wrong number of arguments," "use before declaration." Catching these at compile time, with a precise message and a source location, is enormously cheaper than discovering them as a crash or silent corruption at runtime — this is the entire value proposition of a statically typed language. The symbol table that semantic analysis builds is also reused by later stages: the code generator needs to know each variable's type to pick the right instruction, and where it lives (local, global, field) to address it. Understanding scoping and type checking demystifies a whole family of everyday questions — why a variable declared inside a loop is invisible outside it, why shadowing works the way it does, why the compiler complains about `int + string` but not `int + double`. Every linter, IDE "go to definition," and refactoring tool is powered by exactly this analysis.

## intuition
Think of a **symbol table** as a stack of dictionaries, one per active scope. When the analyzer enters a block, a function body, or a loop, it pushes a fresh empty dictionary; when it leaves, it pops it. Declaring a name inserts an entry — name to type (and other facts) — into the *top* dictionary. Looking a name up searches from the top of the stack downward: check the innermost scope first, then the enclosing one, and so on out to the global scope, stopping at the first match. This single mechanism explains almost every scoping behavior you have ever seen. **Shadowing**: an inner `x` sits in a higher dictionary than an outer `x`, so the lookup finds the inner one first. **Block scope**: a variable declared inside a loop lives in a dictionary that gets popped when the loop's scope ends, so it is gone afterward. **Undefined variable**: the search reaches the bottom of the stack without a match, which is an error.

**Type checking** is a second walk of the same tree that computes a type for every expression from the bottom up and verifies the rules at each node. A number literal has type `number`; a string literal has type `string`; a variable reference has whatever type the symbol table recorded for it. For a compound expression, the checker first recursively finds the types of the children, then applies the operator's rule. Addition might say "both operands must be numbers, and the result is a number" — so `2 + 3` type-checks to `number`, but `2 + "hi"` fails because one operand is a string. A comparison like `<` might demand two numbers and produce a `boolean`. An assignment demands that the right-hand type be compatible with the variable's declared type. Because the children are resolved before the parent, types flow upward through the tree exactly the way values will flow at runtime, and any mismatch surfaces at the precise node where incompatible types meet — which is why type errors can point at the exact subexpression that is wrong.

Two families of rules interact here. **Name resolution** connects each use of an identifier to its declaration using the symbol-table stack, catching undeclared names, use-before-declaration, and redeclaration in the same scope. **Type rules** verify operations, catching type mismatches, calling a non-function, wrong argument counts, and returning the wrong type. Some languages do all of this before execution (**static typing**); others defer type checks to runtime (**dynamic typing**) but still resolve scopes. Some infer types you did not write (**type inference**, as in the Hindley-Milner systems behind ML and the local inference in modern languages), but the underlying activity is the same: a disciplined walk of the AST, threading a symbol table through the scopes and a type through every expression.

## visualization
```
 source:                       symbol table (stack of scopes):
   let x: int = 5                 global: { x -> int, msg -> string }
   let msg: string = "hi"         (lookup searches top-down)
   x + 1        --> OK: int + int -> int
   x + msg      --> TYPE ERROR

 type-check walks the AST bottom-up for  x + msg :
             (+)  <- rule: number + number
            /   \
   look up x     look up msg
     -> int        -> string
        \             /
         int   +   string   ->  MISMATCH  (int + string not allowed)
                              report at the '+' node, line:col
```

## bruteForce
The naive approach folds semantic checks into parsing or evaluation and uses a single flat dictionary for all names. This fails in several ways at once. A single global map cannot represent scopes, so a variable declared inside one function leaks into another, shadowing breaks, and a block-local loop counter stays visible after the loop — the map has no notion of push and pop. Checking types lazily, only when a value is actually used at runtime, means a type error hidden in an untaken branch ships to production and detonates on the one input that reaches it. Doing name resolution during evaluation also makes closures and forward references fragile, because "which `x` does this refer to" gets answered differently depending on execution order rather than lexical structure. These shortcuts appear to work on small examples but collapse on nested scopes, recursion, mutual references, and any branch that a test happens not to exercise — the very cases a type checker exists to cover.

## optimal
Run semantic analysis as one or more explicit passes over the AST, *after* parsing and *before* code generation, threading a **scoped symbol table** (a stack of scopes) and computing a **type for every expression**. On entering a scope-creating construct — a block, function, or loop — push a new scope; on leaving, pop it. Declaring a name inserts it into the current (top) scope, reporting an error if the same name is already declared there. Resolving a name searches from the innermost scope outward and errors if nothing matches. Type checking recurses into an expression's children first, then applies the operator's typing rule to their results, so types propagate bottom-up and mismatches are reported at the exact node where they occur, using the source position carried from the lexer through the parser. Statement-level rules layer on top: an `if` condition must be boolean, a `return` must match the function's declared return type, an assignment's right side must be compatible with the left.

Real front-ends often split this into two sub-passes for robustness. A **resolution pass** walks the tree binding every identifier to its declaration and precomputing scope depths, which lets closures capture the right variables regardless of later mutation. A **type-checking pass** then annotates each node with its type, running any **type inference** needed to fill in types the programmer omitted — from simple local inference (`let x = 5` deduces `int`) up to full Hindley-Milner unification in functional languages. The symbol table produced here is not thrown away: it flows into code generation, where the backend consults each symbol's type to choose instructions and its storage class to compute addresses. The discipline that makes all of this correct is invariant and simple — push and pop scopes to mirror the program's lexical structure, resolve names by searching outward, and compute types bottom-up so every operation is checked against operands whose types are already known.

## complexity
time: O(n) in the number of AST nodes for the common case — each node is visited a constant number of times, and each name resolution is an O(1) hash lookup in the current scope amortized (worst case O(s) across s nested scopes for a name found in the outermost one). Full type inference with unification is close to linear in practice but has a known worst case that is exponential for pathological programs; ordinary type checking without unification stays linear.
space: O(d) for the symbol-table stack, where d is the maximum scope nesting depth, plus O(k) for the total number of declared symbols across live scopes. Annotating every node with its inferred type adds O(n) storage. Recursion depth for the tree walk is O(h) in the tree height.
notes: The dominant cost is the single tree walk, so semantic analysis is rarely the compiler's bottleneck. Scope lookup cost grows with nesting depth for names resolved in outer scopes, which is why some compilers precompute a "scope distance" during resolution so later lookups are O(1).

## pitfalls
- **Using one flat namespace instead of scoped symbol tables.** A single global map cannot express shadowing or block scope, so inner declarations leak out and loop-local variables stay visible after the loop. Fix: model scope as a stack of dictionaries — push on entering a block/function, pop on leaving, declare into the top, resolve from the top outward.
- **Deferring type checks to runtime.** Checking types only when a value is used lets an error in an untaken branch escape to production. Fix: type-check the entire AST statically before execution, computing a type for every expression bottom-up so every operation is verified regardless of whether that path runs.
- **Reporting the wrong location for a type error.** Emitting "type mismatch" with no position, or blaming the whole statement instead of the offending subexpression. Fix: carry source positions from the lexer through the parser onto AST nodes, and report the error at the exact node where incompatible types meet.
- **Mishandling declaration order and self/mutual reference.** Rejecting a valid recursive or mutually-recursive function because its own name is not yet in scope when its body is checked, or allowing use-before-declaration where the language forbids it. Fix: for recursion, insert the function's signature into the scope *before* checking its body; enforce use-before-declaration rules explicitly per the language's semantics.
- **Ignoring implicit conversions and compatibility, not just equality.** Rejecting `int + double` because the types are not identical, or silently allowing lossy conversions. Fix: define the type rules in terms of *compatibility* and explicit promotion (e.g. `int` widens to `double`), not raw equality, and reject only genuinely incompatible pairs like `int + string`.

## interviewTips
- Describe the **symbol table as a stack of scopes**: push on entering a block or function, pop on leaving, declare into the top scope, and resolve by searching from innermost outward. Then explain shadowing and block scope purely in terms of this stack — interviewers love that one mechanism explains so many behaviors.
- Explain type checking as a **bottom-up walk**: recurse into children to get their types, then apply the operator's rule, so errors surface at the exact node. Contrast **static** typing (checked before running) with **dynamic** typing (checked at runtime) and mention **type inference** (deducing unwritten types) as the sophisticated extension.
- Be ready for the **recursion / forward-reference** follow-up: to type-check a recursive function you must insert its signature into the symbol table *before* analyzing its body. Getting this right shows you understand the interaction between declaration order and name resolution.

## keyTakeaways
- Semantic analysis walks the AST to enforce the rules grammar cannot express — every name must resolve to a declaration in scope, and every operation must receive type-compatible operands — catching errors like undefined variables and `int + string` before any code runs.
- The **symbol table is a stack of scopes**: push on entering a block/function, pop on leaving, declare into the top, resolve from innermost outward — a single mechanism that explains shadowing, block scope, and undefined-name errors.
- **Type checking is a bottom-up tree walk** that computes a type for each expression from its children and reports mismatches at the exact node; the resulting typed symbol table flows into code generation, and inference/static-vs-dynamic choices are variations on this same disciplined pass.

## code.python
```python
# Scoped symbol table + a bottom-up type checker over a tiny AST.
# AST nodes are tuples: ('num', v) ('str', v) ('var', name)
#   ('bin', op, left, right) ('let', name, type, expr)
class Scopes:
    def __init__(self): self.stack = [{}]
    def push(self): self.stack.append({})
    def pop(self):  self.stack.pop()
    def declare(self, name, ty):
        if name in self.stack[-1]:
            raise TypeError(f"'{name}' already declared in this scope")
        self.stack[-1][name] = ty
    def lookup(self, name):
        for scope in reversed(self.stack):        # innermost outward
            if name in scope: return scope[name]
        raise NameError(f"undefined variable '{name}'")

def check(node, scopes):
    kind = node[0]
    if kind == "num": return "number"
    if kind == "str": return "string"
    if kind == "var": return scopes.lookup(node[1])
    if kind == "let":
        _, name, declared, expr = node
        actual = check(expr, scopes)
        if actual != declared:
            raise TypeError(f"cannot assign {actual} to {name}: {declared}")
        scopes.declare(name, declared)
        return declared
    if kind == "bin":
        _, op, left, right = node
        lt, rt = check(left, scopes), check(right, scopes)   # bottom-up
        if op in ("+", "-", "*", "/"):
            if lt != "number" or rt != "number":
                raise TypeError(f"{op} needs numbers, got {lt} and {rt}")
            return "number"
        if op in ("<", ">", "=="):
            if lt != rt:
                raise TypeError(f"{op} needs matching types, got {lt} and {rt}")
            return "boolean"
    raise TypeError(f"unknown node {kind}")
```

## code.javascript
```javascript
// Scoped symbol table + bottom-up type checker.
class Scopes {
  constructor() { this.stack = [new Map()]; }
  push() { this.stack.push(new Map()); }
  pop()  { this.stack.pop(); }
  declare(name, ty) {
    if (this.stack[this.stack.length - 1].has(name))
      throw new Error(`'${name}' already declared in this scope`);
    this.stack[this.stack.length - 1].set(name, ty);
  }
  lookup(name) {
    for (let i = this.stack.length - 1; i >= 0; i--)   // innermost outward
      if (this.stack[i].has(name)) return this.stack[i].get(name);
    throw new Error(`undefined variable '${name}'`);
  }
}

function check(node, scopes) {
  switch (node.type) {
    case "num": return "number";
    case "str": return "string";
    case "var": return scopes.lookup(node.name);
    case "let": {
      const actual = check(node.expr, scopes);
      if (actual !== node.declared)
        throw new Error(`cannot assign ${actual} to ${node.name}: ${node.declared}`);
      scopes.declare(node.name, node.declared);
      return node.declared;
    }
    case "bin": {
      const lt = check(node.left, scopes), rt = check(node.right, scopes);  // bottom-up
      if ("+-*/".includes(node.op)) {
        if (lt !== "number" || rt !== "number")
          throw new Error(`${node.op} needs numbers, got ${lt} and ${rt}`);
        return "number";
      }
      if (["<", ">", "=="].includes(node.op)) {
        if (lt !== rt)
          throw new Error(`${node.op} needs matching types, got ${lt} and ${rt}`);
        return "boolean";
      }
    }
  }
  throw new Error(`unknown node ${node.type}`);
}
```

## code.java
```java
import java.util.*;

public class TypeChecker {
    // Symbol table as a stack of scopes.
    static class Scopes {
        final Deque<Map<String, String>> stack = new ArrayDeque<>();
        Scopes() { stack.push(new HashMap<>()); }
        void push() { stack.push(new HashMap<>()); }
        void pop()  { stack.pop(); }
        void declare(String name, String ty) {
            if (stack.peek().containsKey(name))
                throw new RuntimeException("'" + name + "' already declared in this scope");
            stack.peek().put(name, ty);
        }
        String lookup(String name) {
            for (Map<String, String> s : stack)          // innermost outward
                if (s.containsKey(name)) return s.get(name);
            throw new RuntimeException("undefined variable '" + name + "'");
        }
    }

    // AST as records.
    sealed interface Node permits Num, Str, Var, Let, Bin {}
    record Num(double v) implements Node {}
    record Str(String v) implements Node {}
    record Var(String name) implements Node {}
    record Let(String name, String declared, Node expr) implements Node {}
    record Bin(String op, Node left, Node right) implements Node {}

    static String check(Node node, Scopes sc) {
        if (node instanceof Num) return "number";
        if (node instanceof Str) return "string";
        if (node instanceof Var v) return sc.lookup(v.name());
        if (node instanceof Let l) {
            String actual = check(l.expr(), sc);
            if (!actual.equals(l.declared()))
                throw new RuntimeException("cannot assign " + actual + " to " + l.name());
            sc.declare(l.name(), l.declared());
            return l.declared();
        }
        if (node instanceof Bin b) {
            String lt = check(b.left(), sc), rt = check(b.right(), sc);   // bottom-up
            if ("+-*/".contains(b.op())) {
                if (!lt.equals("number") || !rt.equals("number"))
                    throw new RuntimeException(b.op() + " needs numbers, got " + lt + " and " + rt);
                return "number";
            }
            if (List.of("<", ">", "==").contains(b.op())) {
                if (!lt.equals(rt))
                    throw new RuntimeException(b.op() + " needs matching types");
                return "boolean";
            }
        }
        throw new RuntimeException("unknown node");
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <stdexcept>

// Symbol table as a stack of scopes.
struct Scopes {
    std::vector<std::unordered_map<std::string, std::string>> stack{ {} };
    void push() { stack.push_back({}); }
    void pop()  { stack.pop_back(); }
    void declare(const std::string& name, const std::string& ty) {
        if (stack.back().count(name))
            throw std::runtime_error("'" + name + "' already declared in this scope");
        stack.back()[name] = ty;
    }
    std::string lookup(const std::string& name) {
        for (auto it = stack.rbegin(); it != stack.rend(); ++it)   // innermost outward
            if (it->count(name)) return (*it)[name];
        throw std::runtime_error("undefined variable '" + name + "'");
    }
};

// Minimal AST node.
struct Node {
    std::string kind;      // "num" "str" "var" "let" "bin"
    std::string name, op, declared;
    std::shared_ptr<Node> left, right, expr;
};

std::string check(const std::shared_ptr<Node>& n, Scopes& sc) {
    if (n->kind == "num") return "number";
    if (n->kind == "str") return "string";
    if (n->kind == "var") return sc.lookup(n->name);
    if (n->kind == "let") {
        std::string actual = check(n->expr, sc);
        if (actual != n->declared)
            throw std::runtime_error("cannot assign " + actual + " to " + n->name);
        sc.declare(n->name, n->declared);
        return n->declared;
    }
    if (n->kind == "bin") {
        std::string lt = check(n->left, sc), rt = check(n->right, sc);  // bottom-up
        if (n->op == "+" || n->op == "-" || n->op == "*" || n->op == "/") {
            if (lt != "number" || rt != "number")
                throw std::runtime_error(n->op + " needs numbers, got " + lt + " and " + rt);
            return "number";
        }
        if (n->op == "<" || n->op == ">" || n->op == "==") {
            if (lt != rt)
                throw std::runtime_error(n->op + " needs matching types");
            return "boolean";
        }
    }
    throw std::runtime_error("unknown node");
}
```
