---
slug: compiler-parsing
module: compilers
title: Parsing — From Tokens to an Abstract Syntax Tree
subtitle: The stage that gives code its shape — a recursive-descent parser that consumes a flat token stream and builds a tree that captures grouping and operator precedence, so that 2 + 3 * 4 becomes an addition of 2 and a multiplication, not a left-to-right accident.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: [compiler-lexing]
relatedProblems: []
references:
  - title: "Crafting Interpreters — Chapter 6: Parsing Expressions"
    url: "https://craftinginterpreters.com/parsing-expressions.html"
    type: book
  - title: "Crafting Interpreters — Chapter 5: Representing Code"
    url: "https://craftinginterpreters.com/representing-code.html"
    type: book
  - title: "Aho, Lam, Sethi & Ullman — Compilers: Principles, Techniques, and Tools (Dragon Book), Ch. 4: Syntax Analysis"
    url: "https://suif.stanford.edu/dragonbook/"
    type: book
  - title: "Wikipedia — Recursive descent parser"
    url: "https://en.wikipedia.org/wiki/Recursive_descent_parser"
    type: article
status: published
---

## intro
The lexer hands the parser a flat list of tokens — `2`, `+`, `3`, `*`, `4` — but a flat list says nothing about how those pieces fit together. Does `2 + 3 * 4` mean "add 2 and 3, then multiply by 4" (giving 20) or "multiply 3 and 4, then add 2" (giving 14)? A human knows the second reading is correct because multiplication binds tighter than addition, but that knowledge lives nowhere in the token list. **Parsing** is the stage that recovers this structure: it reads the token stream according to the language's **grammar** and builds an **abstract syntax tree** (AST), a tree whose shape encodes exactly how the operators group. The AST is the central data structure of the rest of the compiler — every later stage walks it rather than the tokens.

## whyItMatters
Structure is meaning. Two programs with the same tokens in the same order can mean completely different things depending on how they nest, and the parser is where that nesting gets decided, once, correctly, for everyone downstream. Precedence and associativity — why `*` beats `+`, why `a - b - c` groups as `(a - b) - c` and not `a - (b - c)` — are baked into the tree the parser produces, so the interpreter and type checker never have to think about them again. Parsing is also where **syntax errors** are caught and reported: a missing parenthesis, a dangling operator, a statement that never closes. Good parsers turn these into precise, recoverable messages instead of cascading nonsense. Beyond compilers, the same techniques parse JSON, SQL, regular expressions, HTML, configuration formats, and command lines — recursive descent in particular is the workhorse behind an enormous amount of real-world software.

## intuition
A **grammar** is a set of rules describing what well-formed programs look like, written as productions like "an expression is a term, optionally followed by `+` and another term." The magic of recursive descent is that each grammar rule becomes a function, and the functions call each other exactly the way the rules refer to each other — recursion in the code mirrors recursion in the grammar. To parse an expression you call `expression()`; to parse a term inside it you call `term()`; and because grammars are naturally recursive (an expression can contain a parenthesized expression), the functions naturally recurse too.

Precedence falls out of how you **layer** the grammar. You write one rule per precedence level, from loosest-binding to tightest, and each level is defined in terms of the next-tighter one. Addition and subtraction live at one level; multiplication and division at a tighter level below it; and the individual numbers and parenthesized groups at the tightest level of all. Because `expression` is defined as a sum of `term`s, and each `term` is a product of `factor`s, the parser is *forced* to gather the multiplications into their own subtrees before the additions ever see them. The tree comes out correctly grouped without any special-casing — the layering does the work. Associativity is handled by looping: to make `-` left-associative, the addition rule reads one term, then keeps consuming `+ term` or `- term` in a loop, folding each new term into the left side as it goes, so the tree leans left.

Each function follows the same rhythm: look at the current token to decide which production applies (this is the **lookahead**), consume tokens that match, recursively call lower-level functions for sub-parts, and build and return a node. A helper like `match` checks whether the current token is what you expect and advances past it, while `expect` demands a specific token and raises a syntax error if it is missing — that is how a missing `)` gets caught. Walking `2 + 3 * 4`, the parser reads `2` as a factor and term, sees `+`, then parses the right side as a term — which greedily consumes `3 * 4` into a multiplication node before returning — so the final tree is `Add(2, Mul(3, 4))`, exactly the correct grouping. This style, where the current token alone decides the next move, is called **predictive** or **LL(1)** parsing, and it is both the easiest to write by hand and the easiest to debug.

## visualization
```
 grammar (each level tighter-binding than the one above):
   expression -> term   (('+' | '-') term)*
   term       -> factor (('*' | '/') factor)*
   factor     -> NUMBER | '(' expression ')'

 parse of:  2 + 3 * 4
   expression() reads term -> 2, sees '+', parses right term...
     term() reads factor 3, sees '*', reads factor 4 -> Mul(3,4)
   folds into:            (+)
                         /   \
                       2      (*)         '*' bound tighter, so it
                             /   \        sits BELOW the '+' node
                            3     4

 result AST = Add( 2, Mul(3, 4) )  ->  evaluates to 14, not 20
```

## bruteForce
The tempting naive approach is to evaluate or group tokens strictly left to right, applying each operator as you reach it. This is trivial to write and gives the right answer for `2 + 3 + 4`, but it silently breaks on precedence: `2 + 3 * 4` becomes `(2 + 3) * 4 = 20`, which is wrong. Patching it with ad-hoc "if the next operator is `*`, do it first" checks quickly turns into an unmaintainable tangle that still misses cases like nested parentheses or chained mixed operators. Another brute-force route is a generic backtracking parser that tries every grammar production and rolls back on failure; it handles precedence correctly but can take exponential time on ambiguous input and gives terrible error messages, because when everything backtracks there is no single place that "expected a `)`." Both approaches conflate *recognizing* the structure with *building* it, and neither scales to a real language grammar.

## optimal
The standard hand-written technique is **recursive descent**: one function per grammar rule, the functions calling each other to mirror the grammar's recursion, with a single token of lookahead deciding each branch. Layer the grammar by precedence — a rule per level, each defined in terms of the next-tighter level — and precedence emerges automatically from the call structure. Handle left-associative operators with a loop that folds successive operands into the left side, and handle parentheses by having the tightest rule (`factor`) recursively call `expression` between `(` and `)`, which is what makes the grammar genuinely recursive. Consume tokens through `match`/`expect` helpers so that a missing token becomes a clear syntax error pointing at a real source position (carried over from the lexer). Each function returns an AST node, and the top-level call returns the root of the whole tree.

For expression-heavy grammars with many precedence levels, writing one function per level gets repetitive, so a common refinement is **precedence climbing** (also called Pratt parsing): a single expression function parameterized by a minimum binding power, which consumes an operand and then, in a loop, consumes any operator whose precedence is at least the minimum, recursing with a higher minimum for the right operand. This collapses all the per-level functions into one compact routine driven by a precedence table, handles both left- and right-associative operators cleanly, and is what many production parsers (including several real language front-ends) actually use. When a grammar is too large or changes often, parser **generators** like `yacc`/`bison` (bottom-up LALR) or ANTLL-style tools build the parser from a grammar file instead — but recursive descent and Pratt parsing dominate hand-written front-ends because they are readable, give excellent error messages, and let you drop into custom logic anywhere. Whatever the method, the output is the same: a correctly grouped AST that every later stage can trust.

## complexity
time: O(n) in the number of tokens for an LL(1) recursive-descent or Pratt parser — each token is examined and consumed a constant number of times, with no backtracking, so parsing is linear. Backtracking or ambiguous grammars can degrade to exponential time, which is exactly why predictive parsing (deciding from a single lookahead token) is preferred.
space: O(d) auxiliary stack space where d is the maximum nesting depth of the input (deeply nested parentheses or expressions), because recursion depth tracks grammar nesting. The produced AST itself is O(n) in size, holding roughly one node per operator and operand.
notes: The linear-time guarantee depends on the grammar being unambiguous and free of left recursion — direct left recursion (`expr -> expr '+' term`) makes a naive recursive-descent function loop forever, so it must be rewritten into the looping form. Deeply nested input can overflow the call stack; iterative or explicit-stack parsers avoid that.

## pitfalls
- **Ignoring precedence and associativity.** Building the tree left to right so `2 + 3 * 4` groups as `(2 + 3) * 4`, or `a - b - c` groups right instead of left. Fix: layer the grammar by precedence (a rule per level, tighter operators lower down) and use a left-folding loop for left-associative operators so the tree leans the correct way.
- **Left recursion in a recursive-descent grammar.** A rule like `expr -> expr '+' term` makes the corresponding function call itself immediately with no token consumed, looping forever and overflowing the stack. Fix: rewrite left recursion into iteration — parse one operand, then loop consuming `('+' operand)*` — or switch to precedence climbing.
- **Weak or missing error handling.** Silently returning a partial tree on malformed input, so the error surfaces as garbage three stages later. Fix: use an `expect` helper that raises a precise syntax error (with the line/column from the lexer) the moment a required token is missing, and consider synchronizing to the next statement to recover and report multiple errors.
- **Forgetting to consume the lookahead token.** Peeking at the current token to decide a branch but not advancing past it, so the parser loops on the same token or misaligns the whole stream. Fix: centralize consumption in `advance`/`match` helpers and make every branch that recognizes a token also consume it.
- **Not distinguishing statements from expressions.** Trying to parse everything with one expression rule and then choking on `if`, `while`, or blocks. Fix: give the grammar separate statement productions that dispatch on leading keywords and fall back to an expression statement, keeping expression parsing as a clean sub-grammar.

## interviewTips
- Explain **recursive descent** as "one function per grammar rule, functions calling each other to mirror the grammar," and be ready to show how **layering the grammar by precedence** makes `*` bind tighter than `+` automatically — this is the single most common parsing question and the layered-grammar answer nails it.
- Know the **left-recursion trap** cold: `expr -> expr '+' term` loops forever in recursive descent, and the fix is to rewrite it as a loop (`term ('+' term)*`). Mentioning this unprompted signals you have actually written a parser, not just read about one.
- Contrast **top-down (LL, recursive descent / Pratt)** with **bottom-up (LR / LALR, as in yacc/bison)**: top-down is easy to hand-write with great error messages; bottom-up handles a wider class of grammars and is what generators produce. Naming precedence climbing (Pratt parsing) as the compact alternative for expressions is a strong bonus.

## keyTakeaways
- Parsing turns the lexer's flat token stream into an **abstract syntax tree** whose shape encodes grouping, precedence, and associativity — so `2 + 3 * 4` becomes `Add(2, Mul(3, 4))` and every later stage inherits the correct structure for free.
- **Recursive descent** maps each grammar rule to a function; layering the grammar by precedence (loosest rule on top, defined in terms of the next-tighter rule) makes operator precedence emerge automatically, and a left-folding loop gives left-associativity. **Precedence climbing / Pratt parsing** is the compact single-function alternative.
- Predictive LL(1) parsing runs in **O(n)** with one token of lookahead and no backtracking; watch for **left recursion** (rewrite it as iteration) and use an `expect`-style helper to turn missing tokens into precise syntax errors with source positions.

## code.python
```python
# Recursive-descent parser: one function per precedence level.
# tokens are (kind, text) pairs; NUMBER/'+' '-' '*' '/' '(' ')' and EOF.
class Parser:
    def __init__(self, tokens):
        self.toks, self.i = tokens, 0

    def peek(self):    return self.toks[self.i]
    def advance(self): tok = self.toks[self.i]; self.i += 1; return tok
    def match(self, text):
        if self.peek()[1] == text: self.advance(); return True
        return False
    def expect(self, text):
        if not self.match(text):
            raise SyntaxError(f"expected {text!r}, got {self.peek()[1]!r}")

    def parse(self):                       # entry point -> root node
        node = self.expression()
        self.expect("EOF" if self.peek()[0] == "EOF" else self.peek()[1])
        return node

    def expression(self):                  # loosest: + and -
        node = self.term()
        while self.peek()[1] in ("+", "-"):
            op = self.advance()[1]
            node = ("bin", op, node, self.term())   # left-fold
        return node

    def term(self):                        # tighter: * and /
        node = self.factor()
        while self.peek()[1] in ("*", "/"):
            op = self.advance()[1]
            node = ("bin", op, node, self.factor())
        return node

    def factor(self):                      # tightest: number or ( expr )
        kind, text = self.peek()
        if kind == "NUMBER":
            self.advance(); return ("num", float(text))
        if text == "(":
            self.advance(); node = self.expression(); self.expect(")"); return node
        raise SyntaxError(f"unexpected token {text!r}")
```

## code.javascript
```javascript
// Recursive descent: one function per precedence level.
function makeParser(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const advance = () => tokens[i++];
  const match = (t) => (peek().text === t ? (i++, true) : false);
  const expect = (t) => {
    if (!match(t)) throw new Error(`expected '${t}', got '${peek().text}'`);
  };

  function expression() {                    // + and -
    let node = term();
    while (peek().text === "+" || peek().text === "-") {
      const op = advance().text;
      node = { type: "bin", op, left: node, right: term() };  // left-fold
    }
    return node;
  }
  function term() {                          // * and /
    let node = factor();
    while (peek().text === "*" || peek().text === "/") {
      const op = advance().text;
      node = { type: "bin", op, left: node, right: factor() };
    }
    return node;
  }
  function factor() {                        // NUMBER or ( expr )
    const t = peek();
    if (t.kind === "NUMBER") { advance(); return { type: "num", value: +t.text }; }
    if (t.text === "(") { advance(); const n = expression(); expect(")"); return n; }
    throw new Error(`unexpected token '${t.text}'`);
  }
  return { parse: () => expression() };
}
```

## code.java
```java
import java.util.*;

public class Parser {
    // Node: either a number leaf or a binary op with two children.
    sealed interface Node permits Num, Bin {}
    record Num(double value) implements Node {}
    record Bin(String op, Node left, Node right) implements Node {}

    private final List<String[]> toks;  // each token: {kind, text}
    private int i = 0;
    Parser(List<String[]> toks) { this.toks = toks; }

    private String[] peek() { return toks.get(i); }
    private String[] advance() { return toks.get(i++); }
    private boolean match(String t) {
        if (peek()[1].equals(t)) { i++; return true; }
        return false;
    }
    private void expect(String t) {
        if (!match(t)) throw new RuntimeException("expected '" + t + "', got '" + peek()[1] + "'");
    }

    Node parse() { return expression(); }

    private Node expression() {              // + and -
        Node node = term();
        while (peek()[1].equals("+") || peek()[1].equals("-")) {
            String op = advance()[1];
            node = new Bin(op, node, term());   // left-fold
        }
        return node;
    }
    private Node term() {                    // * and /
        Node node = factor();
        while (peek()[1].equals("*") || peek()[1].equals("/")) {
            String op = advance()[1];
            node = new Bin(op, node, factor());
        }
        return node;
    }
    private Node factor() {                  // NUMBER or ( expr )
        String[] t = peek();
        if (t[0].equals("NUMBER")) { advance(); return new Num(Double.parseDouble(t[1])); }
        if (t[1].equals("(")) { advance(); Node n = expression(); expect(")"); return n; }
        throw new RuntimeException("unexpected token '" + t[1] + "'");
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <memory>
#include <stdexcept>

struct Token { std::string kind, text; };

struct Node {
    bool isNum;
    double value;          // used when isNum
    std::string op;        // used when !isNum
    std::shared_ptr<Node> left, right;
};

class Parser {
    std::vector<Token> toks;
    size_t i = 0;
    Token& peek() { return toks[i]; }
    Token advance() { return toks[i++]; }
    bool match(const std::string& t) {
        if (peek().text == t) { i++; return true; }
        return false;
    }
    void expect(const std::string& t) {
        if (!match(t)) throw std::runtime_error("expected '" + t + "', got '" + peek().text + "'");
    }
    std::shared_ptr<Node> num(double v) {
        auto n = std::make_shared<Node>(); n->isNum = true; n->value = v; return n;
    }
    std::shared_ptr<Node> bin(std::string op, std::shared_ptr<Node> l, std::shared_ptr<Node> r) {
        auto n = std::make_shared<Node>(); n->isNum = false; n->op = op; n->left = l; n->right = r; return n;
    }
public:
    Parser(std::vector<Token> t) : toks(std::move(t)) {}
    std::shared_ptr<Node> parse() { return expression(); }

    std::shared_ptr<Node> expression() {          // + and -
        auto node = term();
        while (peek().text == "+" || peek().text == "-") {
            std::string op = advance().text;
            node = bin(op, node, term());         // left-fold
        }
        return node;
    }
    std::shared_ptr<Node> term() {                // * and /
        auto node = factor();
        while (peek().text == "*" || peek().text == "/") {
            std::string op = advance().text;
            node = bin(op, node, factor());
        }
        return node;
    }
    std::shared_ptr<Node> factor() {              // NUMBER or ( expr )
        Token t = peek();
        if (t.kind == "NUMBER") { advance(); return num(std::stod(t.text)); }
        if (t.text == "(") { advance(); auto n = expression(); expect(")"); return n; }
        throw std::runtime_error("unexpected token '" + t.text + "'");
    }
};
```
