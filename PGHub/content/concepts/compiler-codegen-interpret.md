---
slug: compiler-codegen-interpret
module: compilers
title: Code Generation & Interpretation — Running the AST
subtitle: The back end that finally makes a program do something — three ways to execute an AST, from a direct tree-walking interpreter, to lowering the tree into flat stack-machine bytecode run by a virtual machine, to emitting native machine code, plus the basic optimizations that make any of them faster.
difficulty: Advanced
position: 4
estimatedReadMinutes: 15
prereqs: [compiler-semantics-types]
relatedProblems: []
references:
  - title: "Crafting Interpreters — Chapter 7: Evaluating Expressions (tree-walking)"
    url: "https://craftinginterpreters.com/evaluating-expressions.html"
    type: book
  - title: "Crafting Interpreters — Chapter 14: Chunks of Bytecode"
    url: "https://craftinginterpreters.com/chunks-of-bytecode.html"
    type: book
  - title: "Crafting Interpreters — Chapter 15: A Virtual Machine"
    url: "https://craftinginterpreters.com/a-virtual-machine.html"
    type: book
  - title: "Aho, Lam, Sethi & Ullman — Compilers: Principles, Techniques, and Tools (Dragon Book), Ch. 8: Code Generation"
    url: "https://suif.stanford.edu/dragonbook/"
    type: book
status: published
---

## intro
After lexing, parsing, and semantic analysis, you have a validated, type-checked AST — but a tree in memory does nothing on its own. The **back end** is where the program finally runs. There are three classic strategies, trading simplicity for speed. A **tree-walking interpreter** executes the AST directly, recursively evaluating each node. A **bytecode compiler plus virtual machine** first lowers the tree into a flat list of simple instructions for an abstract machine (usually a stack machine), then a compact loop executes those instructions far faster than re-walking a tree. A **native compiler** goes all the way to real machine code the CPU runs directly. Most of the difference between a scripting language, a JIT-compiled runtime, and an ahead-of-time compiled language comes down to which of these you pick and how far you push the optimizations along the way.

## whyItMatters
This is the stage that determines whether your language is a toy or a tool. The same AST can run 10 to 100 times faster as bytecode than as a tree walk, and faster still as native code, so the back-end choice is the single biggest lever on execution speed. Understanding it explains the whole landscape of language implementations: why CPython compiles to bytecode and runs it on a VM, why the JVM and .NET ship bytecode that a JIT turns into machine code at runtime, why Lua and Ruby have stack-based VMs, why C and Rust compile straight to native code, and why a quick embedded scripting language might just walk the tree. It also explains stack traces, `PUSH`/`ADD`-style disassembly, and why `-O2` makes your program faster without changing what it computes. Even if you never write a compiler back end, this is the mental model behind every "how does my code actually run" question, and it is a staple of systems interviews.

## intuition
Start with the simplest thing that works: a **tree-walking interpreter**. To evaluate a node you look at its kind and act accordingly. A number literal evaluates to its value. A binary node like `Add(left, right)` recursively evaluates its two children to get two values, then adds them. A variable reads from an environment; an `if` evaluates its condition and then one branch. Evaluation is just a recursive walk that returns a value at each node — beautifully direct, and exactly how you would compute `Add(2, Mul(3, 4))` by hand: evaluate `Mul(3,4)` to `12`, evaluate `2`, add to get `14`. The cost is that every execution re-walks the tree, chasing pointers and re-dispatching on node kinds, which is slow for hot loops that run the same nodes millions of times.

The key insight of a **bytecode VM** is to do the tree walk *once*, ahead of time, and record the result as a flat sequence of tiny instructions. A **stack machine** makes this especially clean. To compile `2 + 3 * 4`, you emit instructions in a specific order: `PUSH 2`, then for the multiplication `PUSH 3`, `PUSH 4`, `MUL`, then `ADD`. Notice this is exactly a post-order traversal of the AST — you emit the code for a node's children before the operator that combines them, so operands are already on the stack when the operator runs. Executing this is a tight loop over a byte array: `PUSH` pushes a value, `ADD` pops two and pushes their sum, `MUL` pops two and pushes their product. Walk the list once and the stack holds the answer. There is no tree to chase and no recursive dispatch — just a `while` loop and a `switch` on the current opcode — which is why VMs crush tree walkers on speed while staying portable and easy to implement.

Going further, a **native compiler** maps the same operations onto real CPU registers and instructions, so `ADD` becomes an actual `add` on the hardware with no interpreter loop at all — fastest of all, but tied to a specific instruction set and far more work to build correctly. Between generating code and running it, compilers apply **optimizations** that preserve meaning while cutting work: **constant folding** computes `2 + 3` at compile time into `5`; **dead-code elimination** deletes code whose result is never used; **common-subexpression elimination** computes a repeated expression once. These are transformations on the AST or an intermediate representation, and even a handful of them noticeably speeds up real programs. The unifying idea across all three back ends is *lowering*: repeatedly rewriting the program into a form closer to the machine — tree, to linear bytecode, to registers — executing at whichever level you stop.

## visualization
```
 AST for  2 + 3 * 4            compile (post-order) -> bytecode:
        (+)                       PUSH 2
       /   \                      PUSH 3
      2    (*)                    PUSH 4
          /  \                    MUL       <- children emitted before parent
         3    4                   ADD

 stack machine executes the bytecode, one instruction at a time:
   PUSH 2 -> [2]          MUL -> [2, 12]   (pop 3,4 push 12)
   PUSH 3 -> [2, 3]       ADD -> [14]      (pop 2,12 push 14)
   PUSH 4 -> [2, 3, 4]    result on top of stack = 14

 optimization pass first:  PUSH 2, PUSH 12(=3*4), ADD  -> or even  PUSH 14
                           (constant folding collapses known math)
```

## bruteForce
The baseline back end is the pure **tree-walking interpreter**, and it is genuinely the right choice for a prototype, a config language, or an embedded scripting layer where simplicity matters more than speed. Its weakness is performance: every time control reaches a node it re-dispatches on the node's kind, follows child pointers scattered across the heap, and box-allocates intermediate values, so a loop body pays the full interpretation overhead on every iteration. For a hot inner loop executed millions of times, re-walking the same subtree each pass is enormously wasteful compared to executing a precompiled instruction stream. A second brute-force trap is generating code with no optimization at all — emitting a `PUSH`/`ADD` for `2 + 3` that runs at execution time instead of folding it to a constant, or leaving obviously dead branches in the output. The generated program is correct but does needless work on every run. These approaches are fine as a starting point and terrible as an endpoint for anything performance-sensitive.

## optimal
The workhorse design for a fast, portable language is a **bytecode compiler feeding a stack-machine virtual machine**. A compilation pass walks the AST in **post-order**, emitting instructions so that each node's operands are produced before the operator that consumes them: literals emit a `PUSH` (often via a constant pool), binary operators emit their operands' code then an `ADD`/`SUB`/`MUL`/`DIV`, variables emit `LOAD`/`STORE` against local slots, and control flow emits conditional and unconditional `JUMP`s to byte offsets. The result is a compact `chunk` of bytecode plus a constant table. The VM is then a tight dispatch loop: fetch the opcode at the instruction pointer, `switch` on it, mutate a value stack, and advance — `PUSH` pushes, `ADD` pops two and pushes the sum, `JUMP` sets the instruction pointer. Because the tree walk happened once at compile time, the hot loop never re-traverses the tree, which is the entire performance win. This is essentially how CPython, Lua, and the JVM's interpreter tier work.

Layered on top are two things that separate a toy from a real implementation. First, **optimizations**, applied to the AST or an intermediate representation before or during code emission: **constant folding** (`2 + 3` becomes `5`), **constant propagation**, **dead-code elimination** (drop code whose result is never observed), **common-subexpression elimination** (compute a repeated expression once), and **peephole optimization** (rewrite short instruction sequences into cheaper ones, e.g. collapsing a redundant `PUSH`/`POP`). Each preserves observable behavior while removing work, and even a small suite meaningfully speeds real code. Second, for maximum speed, **native code generation** — either ahead-of-time (as C, Go, and Rust do, mapping the IR onto registers and real instructions via register allocation and instruction selection) or **just-in-time**, where a VM like the JVM or V8 starts by interpreting bytecode and then compiles the *hot* paths to machine code at runtime, getting fast startup and fast steady-state at once. The choice among tree-walk, bytecode VM, and native is a spectrum of lowering: stop at the tree for simplicity, at bytecode for a great portability/speed balance, or at machine code for raw performance.

## complexity
time: A tree-walking interpreter runs in O(m) where m is the number of node-evaluations performed during execution — a loop body of k nodes run t times costs O(k·t) with a large constant per node (dispatch + pointer chasing). A bytecode VM runs the same program in O(i) instruction dispatches with a much smaller constant, typically an order of magnitude or two faster in practice. Compiling the AST to bytecode is a one-time O(n) post-order pass. Native code removes the interpreter constant entirely.
space: Tree-walking uses O(h) call-stack depth for the recursion (h = expression/nesting height) plus the environment. A bytecode VM stores O(n) instructions and a constant pool, plus an O(d) operand stack where d is the maximum expression depth. Optimizations may shrink the emitted code (folding, dead-code elimination) at the cost of O(n) analysis space.
notes: The dominant speed driver is *how often you re-interpret the same structure* — compiling the tree walk away into linear bytecode is why VMs beat tree walkers. Optimizations trade one-time compile-time work for repeated run-time savings, which pays off exactly when code runs more than once.

## pitfalls
- **Shipping a tree-walking interpreter for performance-critical code.** Re-walking the AST every iteration pays full dispatch and pointer-chasing overhead per node, crippling hot loops. Fix: compile the AST once into flat bytecode and run it on a stack VM; reserve tree-walking for prototypes, config languages, or cold code.
- **Emitting bytecode in the wrong order for a stack machine.** Producing the operator before its operands leaves the stack empty when the operator runs. Fix: emit in strict **post-order** — a node's children's code before the node's own opcode — so operands are already on the stack; this is the invariant that makes a stack VM work.
- **Optimizations that change observable behavior.** Constant-folding across an operation that could overflow, trap, or have side effects, or eliminating "dead" code that actually performs I/O. Fix: only fold pure, total subexpressions and only eliminate code with no observable effect; when in doubt, preserve the operation.
- **Unbalanced stack effects across instructions or branches.** An opcode that pops the wrong number of values, or two branches of an `if` that leave the stack at different depths, corrupting everything after the join. Fix: define and verify each instruction's net stack effect, and ensure both arms of any branch leave the operand stack at the same height.
- **Assuming native code is always the right endpoint.** Jumping straight to machine-code generation adds register allocation, instruction selection, and platform portability burdens that a bytecode VM avoids. Fix: match the back end to the goal — bytecode VM for portability and a great speed/effort ratio, JIT or AOT native only when profiling shows the interpreter loop is the bottleneck.

## interviewTips
- Lay out the **three back ends** and their tradeoffs in one breath: tree-walking (simplest, slowest), bytecode + stack VM (portable, ~10–100x faster because the tree walk happens once), native code (fastest, platform-specific). Naming real examples — CPython/Lua bytecode VMs, the JVM/V8 JIT, C/Rust AOT — shows breadth.
- Be able to **hand-compile** a small expression like `2 + 3 * 4` to stack bytecode (`PUSH 2, PUSH 3, PUSH 4, MUL, ADD`) and explain that this order is a **post-order traversal**, so operands are on the stack before their operator. Then trace the stack executing it to `14`.
- Know a few **optimizations** and why they are safe: constant folding, dead-code elimination, common-subexpression elimination, peephole. The key point interviewers want is that optimizations must **preserve observable behavior** — you can only fold pure expressions and only delete code with no side effects.

## keyTakeaways
- The back end executes the validated AST via a spectrum of **lowering**: a tree-walking interpreter runs the tree directly (simplest, slowest), a bytecode compiler + stack VM runs a flat instruction list (portable, far faster because the walk happens once), and native code generation targets the CPU directly (fastest, platform-specific).
- Compiling to stack bytecode is a **post-order** emission — a node's children's instructions before its own opcode — so `2 + 3 * 4` becomes `PUSH 2, PUSH 3, PUSH 4, MUL, ADD`, which a tight fetch-decode-execute VM loop runs against an operand stack to produce `14`.
- **Optimizations** (constant folding, dead-code and common-subexpression elimination, peephole) trade one-time compile work for repeated runtime savings and must **preserve observable behavior** — fold only pure expressions, delete only side-effect-free code.

## code.python
```python
# Two back ends over the same AST: a tree-walker, and a bytecode
# compiler + stack VM. AST nodes: ('num', v) and ('bin', op, l, r).

# 1) Tree-walking interpreter: recurse and return a value per node.
def walk(node):
    if node[0] == "num": return node[1]
    _, op, l, r = node
    a, b = walk(l), walk(r)                 # evaluate children first
    return {"+": a + b, "-": a - b, "*": a * b, "/": a / b}[op]

# 2) Compile to stack bytecode via POST-ORDER emission.
def compile_ast(node, code):
    if node[0] == "num":
        code.append(("PUSH", node[1]))
    else:
        _, op, l, r = node
        compile_ast(l, code)                # children before parent
        compile_ast(r, code)
        code.append(({"+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV"}[op],))
    return code

# 3) The virtual machine: a tight fetch-decode-execute loop.
def run(code):
    stack = []
    for instr in code:
        op = instr[0]
        if op == "PUSH":
            stack.append(instr[1])
        else:
            b = stack.pop(); a = stack.pop()
            stack.append({"ADD": a + b, "SUB": a - b,
                          "MUL": a * b, "DIV": a / b}[op])
    return stack.pop()

# constant folding: collapse a bin node of two literals.
def fold(node):
    if node[0] == "num": return node
    _, op, l, r = node
    l, r = fold(l), fold(r)
    if l[0] == "num" and r[0] == "num":
        return ("num", walk(("bin", op, l, r)))
    return ("bin", op, l, r)
```

## code.javascript
```javascript
// Tree-walker + bytecode compiler + stack VM over the same AST.
// nodes: { type:'num', value } and { type:'bin', op, left, right }.

function walk(node) {                            // tree-walking interpreter
  if (node.type === "num") return node.value;
  const a = walk(node.left), b = walk(node.right);
  return { "+": a + b, "-": a - b, "*": a * b, "/": a / b }[node.op];
}

const OP = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV" };
function compile(node, code = []) {              // POST-ORDER emission
  if (node.type === "num") { code.push(["PUSH", node.value]); return code; }
  compile(node.left, code);                      // children before parent
  compile(node.right, code);
  code.push([OP[node.op]]);
  return code;
}

function run(code) {                             // stack VM
  const stack = [];
  for (const [op, arg] of code) {
    if (op === "PUSH") { stack.push(arg); continue; }
    const b = stack.pop(), a = stack.pop();
    stack.push({ ADD: a + b, SUB: a - b, MUL: a * b, DIV: a / b }[op]);
  }
  return stack.pop();
}

function fold(node) {                            // constant folding
  if (node.type === "num") return node;
  const left = fold(node.left), right = fold(node.right);
  if (left.type === "num" && right.type === "num")
    return { type: "num", value: walk({ type: "bin", op: node.op, left, right }) };
  return { type: "bin", op: node.op, left, right };
}
```

## code.java
```java
import java.util.*;

public class Backend {
    sealed interface Node permits Num, Bin {}
    record Num(double value) implements Node {}
    record Bin(String op, Node left, Node right) implements Node {}

    // Tree-walking interpreter.
    static double walk(Node n) {
        if (n instanceof Num num) return num.value();
        Bin b = (Bin) n;
        double x = walk(b.left()), y = walk(b.right());   // children first
        return switch (b.op()) {
            case "+" -> x + y; case "-" -> x - y;
            case "*" -> x * y; default -> x / y;
        };
    }

    // Compile to stack bytecode via POST-ORDER emission.
    static void compile(Node n, List<String[]> code) {
        if (n instanceof Num num) { code.add(new String[]{"PUSH", String.valueOf(num.value())}); return; }
        Bin b = (Bin) n;
        compile(b.left(), code);                          // children before parent
        compile(b.right(), code);
        String opc = switch (b.op()) {
            case "+" -> "ADD"; case "-" -> "SUB"; case "*" -> "MUL"; default -> "DIV";
        };
        code.add(new String[]{opc});
    }

    // Stack VM: fetch-decode-execute loop.
    static double run(List<String[]> code) {
        Deque<Double> stack = new ArrayDeque<>();
        for (String[] instr : code) {
            if (instr[0].equals("PUSH")) { stack.push(Double.parseDouble(instr[1])); continue; }
            double y = stack.pop(), x = stack.pop();
            stack.push(switch (instr[0]) {
                case "ADD" -> x + y; case "SUB" -> x - y;
                case "MUL" -> x * y; default -> x / y;
            });
        }
        return stack.pop();
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <memory>

struct Node {
    bool isNum;
    double value;                       // when isNum
    std::string op;                     // when !isNum
    std::shared_ptr<Node> left, right;
};

// Tree-walking interpreter.
double walk(const std::shared_ptr<Node>& n) {
    if (n->isNum) return n->value;
    double a = walk(n->left), b = walk(n->right);   // children first
    if (n->op == "+") return a + b;
    if (n->op == "-") return a - b;
    if (n->op == "*") return a * b;
    return a / b;
}

struct Instr { std::string op; double arg; };

// Compile to stack bytecode via POST-ORDER emission.
void compile(const std::shared_ptr<Node>& n, std::vector<Instr>& code) {
    if (n->isNum) { code.push_back({"PUSH", n->value}); return; }
    compile(n->left, code);                          // children before parent
    compile(n->right, code);
    std::string opc = n->op == "+" ? "ADD" : n->op == "-" ? "SUB"
                    : n->op == "*" ? "MUL" : "DIV";
    code.push_back({opc, 0});
}

// Stack VM.
double run(const std::vector<Instr>& code) {
    std::vector<double> stack;
    for (const auto& instr : code) {
        if (instr.op == "PUSH") { stack.push_back(instr.arg); continue; }
        double b = stack.back(); stack.pop_back();
        double a = stack.back(); stack.pop_back();
        if (instr.op == "ADD") stack.push_back(a + b);
        else if (instr.op == "SUB") stack.push_back(a - b);
        else if (instr.op == "MUL") stack.push_back(a * b);
        else stack.push_back(a / b);
    }
    return stack.back();
}
```
