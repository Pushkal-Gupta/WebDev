---
slug: compiler-lexing
module: compilers
title: Lexing — Turning Source Text into Tokens
subtitle: The first stage of every compiler and interpreter — a scanner that reads raw characters one at a time and groups them into meaningful tokens, driven by a tiny state machine that recognizes identifiers, numbers, strings, operators, and keywords while quietly discarding whitespace and comments.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Crafting Interpreters — Chapter 4: Scanning"
    url: "https://craftinginterpreters.com/scanning.html"
    type: book
  - title: "Crafting Interpreters — Chapter 16: Scanning on Demand"
    url: "https://craftinginterpreters.com/scanning-on-demand.html"
    type: book
  - title: "Aho, Lam, Sethi & Ullman — Compilers: Principles, Techniques, and Tools (Dragon Book), Ch. 3: Lexical Analysis"
    url: "https://suif.stanford.edu/dragonbook/"
    type: book
  - title: "Wikipedia — Lexical analysis"
    url: "https://en.wikipedia.org/wiki/Lexical_analysis"
    type: article
status: published
---

## intro
A source file arrives at the compiler as one long, flat string of characters — no structure, no meaning, just bytes. Before anything can be parsed or executed, that stream has to be chopped into the atoms of the language: the keyword `while`, the identifier `count`, the number `42`, the operator `<=`, the string `"hi"`. This chopping is **lexical analysis**, or **lexing**, and the component that does it is the **lexer** (also called a scanner or tokenizer). It reads the input left to right, one character at a time, and emits a sequence of **tokens** — small tagged records that say "this is a NUMBER with value 42" or "this is an IDENTIFIER named count." Everything downstream works on tokens, never on raw text, which is why the lexer is the foundation the whole compiler stands on.

## whyItMatters
Lexing is where messy human text becomes clean, uniform data. By collapsing runs of characters into typed tokens and throwing away whitespace and comments, the lexer shrinks the problem the parser has to solve by an order of magnitude: instead of reasoning about individual letters, the parser reasons about a short list of categories. This separation of concerns is one of the oldest and most durable ideas in compiler design, and it shows up far beyond compilers — every syntax highlighter, linter, code formatter, template engine, configuration parser, and query language starts with a lexer. Understanding how scanning works also demystifies a whole class of everyday errors: "unterminated string literal," "unexpected character," and "invalid token" are all messages the lexer produces. When you can picture the cursor advancing through the source and the state machine switching modes, those errors stop being mysterious and start being obvious.

## intuition
Imagine reading a sentence in a language whose words run together with no spaces, and your job is to draw a box around each word as you go. You scan left to right, and at each character you ask a simple question: does this character continue the word I am currently building, or does it start a new one? A letter after a letter extends an identifier; a digit after a digit extends a number; but a `+` after a letter means the identifier just ended and an operator begins. This one-character-of-lookahead decision, repeated across the whole input, is the entire heart of lexing.

The lexer is best understood as a small **state machine**. It starts in a neutral "between tokens" state. When it sees the first meaningful character, it decides which kind of token is beginning and enters a matching state — "reading an identifier," "reading a number," "reading a string." It stays in that state, consuming characters that belong, until it hits one that does not, at which point the token is complete: the lexer emits it and returns to the neutral state to begin again. This is the principle of **maximal munch** — always consume the longest run of characters that still forms a valid token, so `>=` is read as one token rather than `>` followed by `=`, and `count1` is one identifier rather than `count` followed by `1`.

Two subtleties give lexers their real character. First, keywords are not special to the scanner at first: `while` looks exactly like an identifier as it is being read. The usual trick is to scan the whole word as an identifier, then look it up in a small table of reserved words and re-tag it as a keyword if it matches. Second, whitespace and comments are recognized and then **discarded** — the lexer consumes them so it can find where the next real token begins, but emits nothing for them. The result is a stream that carries only what the parser cares about, each token tagged with its type, its literal text (the "lexeme"), and usually a source position for error reporting. Formally this is the machinery of **regular expressions** and the **deterministic finite automata** (DFAs) they compile to, but you can build a perfectly good lexer by hand with nothing more than a loop, a cursor, and a switch statement.

## visualization
```
 source:  c o u n t   < =   4 2
          ^cursor scans left -> right, one char at a time

 state machine (what the scanner is currently reading):
   START --letter--> IDENT --letter/digit--> IDENT --(other)--> emit
   START --digit---> NUMBER -----digit------> NUMBER -(other)--> emit
   START --" -------> STRING ----any but "---> STRING ---"----> emit
   START --< -------> maybe OP; peek next: '=' -> "<=" else "<"

 emitted token stream (whitespace discarded):
   [ IDENT "count" ] [ OP "<=" ] [ NUMBER 42 ] [ EOF ]
        keyword?          two-char           literal
     look up table       maximal munch      value = 42
```

## bruteForce
The most naive scanner treats every character position as a fresh start and tries to match each token type from scratch, or worse, runs a full regular-expression engine at the current offset for every possible token kind and picks whichever matches. This works but is wasteful: it re-examines characters, backtracks, and scales poorly on large files. A closely related trap is scanning without lookahead — deciding a token is finished the moment the current character does not extend it, but forgetting that some tokens need to peek one character ahead to distinguish `<` from `<=` or `/` (divide) from `//` (comment). Naive scanners also tend to special-case keywords inline, scattering `if (matches "while") ...` checks through the code, which is brittle and slow. These approaches produce correct tokens on easy input but fall apart on the boundary cases — two-character operators, keywords that are prefixes of identifiers, numbers with decimal points — that real source code is full of.

## optimal
A production lexer is a single left-to-right pass with **one character of lookahead** and no backtracking, running in linear time in the length of the source. Keep a cursor at the current offset and a `start` marker at the beginning of the token being built. At each step, read the character under the cursor and switch on it: if it starts an identifier (a letter or underscore), consume the maximal run of identifier characters, then look the resulting lexeme up in a hash table of reserved words to decide whether it is a keyword or a plain identifier. If it starts a number, consume digits (and a single decimal point if present). If it is a quote, consume until the closing quote, reporting an "unterminated string" error if the input ends first. For operators, read the character and **peek** at the next one to greedily match the longest operator: see `<`, peek for `=`, emit `<=` if present else `<`. Whitespace and comments are consumed and produce no token. Each emitted token carries its type, the exact lexeme, and the source line and column so later stages can produce good error messages.

This design — a hand-written scanner driven by a switch and a peek — is what most real compilers actually ship, including many industrial ones, because it is fast, debuggable, and gives precise control over error recovery. The theoretical underpinning is that each token type is described by a **regular expression**, the union of those expressions compiles to a single **DFA**, and the DFA is exactly the state machine your switch statement implements by hand. Tools like `lex`/`flex` generate that DFA automatically from a list of regex rules, which is convenient for simple languages, but hand-writing the scanner wins when you need custom error messages, string interpolation, significant indentation (as in Python), or context-sensitive tokens. Either way the invariants are the same: one pass, maximal munch, keyword table lookup, and a token stream that hides every whitespace character from the parser.

## complexity
time: O(n) in the number of input characters. Each character is examined a constant number of times — consumed once, with at most one extra peek for lookahead — so scanning is linear regardless of the number of token types. Keyword classification is an O(1) hash-table lookup per identifier. There is no backtracking in a well-formed lexer, which is what keeps it linear rather than quadratic.
space: O(1) working state beyond the output — a cursor, a start marker, and the current line/column. The emitted token stream is O(t) where t is the number of tokens (at most n), and interning identifier/string lexemes into a table costs O(u) in the number of unique strings. A generated DFA also stores a fixed transition table whose size is independent of the input.
notes: The dominant cost driver is the single linear pass, so lexers are almost never the bottleneck; parsing and semantic analysis cost far more. Maximal munch is what makes lookahead necessary — without it, multi-character operators and keyword/identifier disambiguation break.

## pitfalls
- **Forgetting maximal munch (greedy longest match).** Emitting `>` then `=` instead of the single token `>=`, or splitting `count1` into `count` and `1`. Fix: always consume the longest run of characters that still forms a valid token, peeking ahead for multi-character operators before committing to the shorter one.
- **Treating keywords as a separate scanning mode.** Trying to match `while`, `if`, `return` directly in the character loop leads to bugs where `whileLoop` is misread as the keyword `while` followed by `Loop`. Fix: scan the whole word as an identifier first, then look it up in a reserved-word table and re-tag only on an exact, complete match.
- **Not tracking line and column positions.** A lexer that emits bare token types with no source location leaves every downstream error message unable to point at the offending code. Fix: advance a line counter on each newline and record the start position on every token so the parser and type checker can report `line:col`.
- **Mishandling end-of-input inside a token.** Reaching EOF in the middle of a string literal, block comment, or number and either looping forever or crashing. Fix: check for end-of-input on every character consumed inside a multi-character token and emit a clear "unterminated literal" error instead of running off the end.
- **Letting comments and whitespace leak into the token stream.** Emitting tokens for spaces or `//` comments forces the parser to filter them, complicating every grammar rule. Fix: consume whitespace and comments in the scanner and emit nothing for them, so the parser only ever sees real tokens.

## interviewTips
- Describe a lexer as a **linear left-to-right pass with one character of lookahead**, and be ready to sketch the state machine: START branches to IDENT, NUMBER, STRING, or OPERATOR based on the first character, each state consuming its maximal run before emitting. Mentioning maximal munch by name signals you know why lookahead is required.
- Explain the **keyword-versus-identifier** trick: scan the word as an identifier, then consult a reserved-word table. This is a classic follow-up, and the table-lookup answer shows you understand why keywords are not a special scanning state.
- Connect the hand-written scanner to theory: each token is a **regular expression**, their union is a **DFA**, and your switch statement is that DFA by hand — which is exactly what `lex`/`flex` generate. Being able to move between the practical and formal views is what interviewers are probing for.

## keyTakeaways
- Lexing is the compiler's first stage: it reads raw source characters left to right and groups them into typed **tokens** (identifier, number, string, operator, keyword), discarding whitespace and comments so the parser works on a clean, uniform stream.
- The lexer is a small **state machine** applying **maximal munch** — always consuming the longest valid token — with one character of lookahead to distinguish multi-character operators like `<=`; keywords are scanned as identifiers and then re-tagged via a reserved-word table.
- Scanning runs in **O(n)** time with a single pass and no backtracking; recording each token's source position is essential for good error messages, and the whole design is the practical form of the regular-expression-to-DFA theory that generators like `flex` automate.

## code.python
```python
# A hand-written scanner: one linear pass, one char of lookahead, maximal munch.
KEYWORDS = {"if", "else", "while", "return", "true", "false"}

def scan(src):
    tokens, i, line, n = [], 0, 1, len(src)
    def emit(kind, text): tokens.append((kind, text, line))
    while i < n:
        c = src[i]
        if c == "\n":
            line += 1; i += 1
        elif c.isspace():
            i += 1                                  # discard whitespace
        elif c == "/" and i + 1 < n and src[i + 1] == "/":
            while i < n and src[i] != "\n": i += 1  # discard line comment
        elif c.isalpha() or c == "_":
            start = i
            while i < n and (src[i].isalnum() or src[i] == "_"): i += 1
            word = src[start:i]
            emit("KEYWORD" if word in KEYWORDS else "IDENT", word)
        elif c.isdigit():
            start = i
            while i < n and (src[i].isdigit() or src[i] == "."): i += 1
            emit("NUMBER", src[start:i])
        elif c == '"':
            start, i = i, i + 1
            while i < n and src[i] != '"': i += 1
            if i >= n: raise SyntaxError(f"unterminated string at line {line}")
            i += 1; emit("STRING", src[start:i])
        elif c in "<>=!":                           # peek for two-char operators
            if i + 1 < n and src[i + 1] == "=":
                emit("OP", src[i:i + 2]); i += 2
            else:
                emit("OP", c); i += 1
        elif c in "+-*/(){};,":
            emit("OP", c); i += 1
        else:
            raise SyntaxError(f"unexpected char {c!r} at line {line}")
    emit("EOF", "")
    return tokens
```

## code.javascript
```javascript
// One linear pass, one char of lookahead, maximal munch.
const KEYWORDS = new Set(["if", "else", "while", "return", "true", "false"]);
const isAlpha = (c) => /[A-Za-z_]/.test(c);
const isAlnum = (c) => /[A-Za-z0-9_]/.test(c);

function scan(src) {
  const tokens = [];
  let i = 0, line = 1;
  const emit = (kind, text) => tokens.push({ kind, text, line });
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") { line++; i++; }
    else if (/\s/.test(c)) { i++; }                       // discard whitespace
    else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;       // discard comment
    } else if (isAlpha(c)) {
      const start = i;
      while (i < src.length && isAlnum(src[i])) i++;
      const word = src.slice(start, i);
      emit(KEYWORDS.has(word) ? "KEYWORD" : "IDENT", word);
    } else if (/[0-9]/.test(c)) {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      emit("NUMBER", src.slice(start, i));
    } else if (c === '"') {
      const start = i++;
      while (i < src.length && src[i] !== '"') i++;
      if (i >= src.length) throw new Error(`unterminated string at line ${line}`);
      i++; emit("STRING", src.slice(start, i));
    } else if ("<>=!".includes(c)) {                       // peek for "<=" etc.
      if (src[i + 1] === "=") { emit("OP", src.slice(i, i + 2)); i += 2; }
      else { emit("OP", c); i++; }
    } else if ("+-*/(){};,".includes(c)) {
      emit("OP", c); i++;
    } else {
      throw new Error(`unexpected char '${c}' at line ${line}`);
    }
  }
  emit("EOF", "");
  return tokens;
}
```

## code.java
```java
import java.util.*;

public class Lexer {
    static final Set<String> KEYWORDS =
        Set.of("if", "else", "while", "return", "true", "false");

    record Token(String kind, String text, int line) {}

    static List<Token> scan(String src) {
        List<Token> out = new ArrayList<>();
        int i = 0, line = 1, n = src.length();
        while (i < n) {
            char c = src.charAt(i);
            if (c == '\n') { line++; i++; }
            else if (Character.isWhitespace(c)) { i++; }          // discard
            else if (c == '/' && i + 1 < n && src.charAt(i + 1) == '/') {
                while (i < n && src.charAt(i) != '\n') i++;        // comment
            } else if (Character.isLetter(c) || c == '_') {
                int s = i;
                while (i < n && (Character.isLetterOrDigit(src.charAt(i))
                        || src.charAt(i) == '_')) i++;
                String w = src.substring(s, i);
                out.add(new Token(KEYWORDS.contains(w) ? "KEYWORD" : "IDENT", w, line));
            } else if (Character.isDigit(c)) {
                int s = i;
                while (i < n && (Character.isDigit(src.charAt(i))
                        || src.charAt(i) == '.')) i++;
                out.add(new Token("NUMBER", src.substring(s, i), line));
            } else if ("<>=!".indexOf(c) >= 0) {                  // peek ahead
                if (i + 1 < n && src.charAt(i + 1) == '=') {
                    out.add(new Token("OP", src.substring(i, i + 2), line)); i += 2;
                } else { out.add(new Token("OP", String.valueOf(c), line)); i++; }
            } else if ("+-*/(){};,".indexOf(c) >= 0) {
                out.add(new Token("OP", String.valueOf(c), line)); i++;
            } else {
                throw new RuntimeException("unexpected char '" + c + "' line " + line);
            }
        }
        out.add(new Token("EOF", "", line));
        return out;
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <unordered_set>
#include <cctype>
#include <stdexcept>

struct Token { std::string kind, text; int line; };

static const std::unordered_set<std::string> KEYWORDS = {
    "if", "else", "while", "return", "true", "false"
};

std::vector<Token> scan(const std::string& src) {
    std::vector<Token> out;
    size_t i = 0, n = src.size();
    int line = 1;
    while (i < n) {
        char c = src[i];
        if (c == '\n') { line++; i++; }
        else if (std::isspace((unsigned char)c)) { i++; }          // discard
        else if (c == '/' && i + 1 < n && src[i + 1] == '/') {
            while (i < n && src[i] != '\n') i++;                    // comment
        } else if (std::isalpha((unsigned char)c) || c == '_') {
            size_t s = i;
            while (i < n && (std::isalnum((unsigned char)src[i]) || src[i] == '_')) i++;
            std::string w = src.substr(s, i - s);
            out.push_back({KEYWORDS.count(w) ? "KEYWORD" : "IDENT", w, line});
        } else if (std::isdigit((unsigned char)c)) {
            size_t s = i;
            while (i < n && (std::isdigit((unsigned char)src[i]) || src[i] == '.')) i++;
            out.push_back({"NUMBER", src.substr(s, i - s), line});
        } else if (std::string("<>=!").find(c) != std::string::npos) {  // peek
            if (i + 1 < n && src[i + 1] == '=') {
                out.push_back({"OP", src.substr(i, 2), line}); i += 2;
            } else { out.push_back({"OP", std::string(1, c), line}); i++; }
        } else if (std::string("+-*/(){};,").find(c) != std::string::npos) {
            out.push_back({"OP", std::string(1, c), line}); i++;
        } else {
            throw std::runtime_error("unexpected char at line " + std::to_string(line));
        }
    }
    out.push_back({"EOF", "", line});
    return out;
}
```
