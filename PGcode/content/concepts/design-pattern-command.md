---
slug: design-pattern-command
module: foundations
title: Command Pattern
subtitle: Wrap requests as objects for undo, queueing, and logging
difficulty: Intermediate
position: 402
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/command
  - https://martinfowler.com/bliki/CommandOrientedInterface.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
The Command pattern turns a request into a standalone object that carries all data needed to perform it later. Instead of calling a method directly, you build a Command and hand it to an invoker. This indirection unlocks undo stacks, deferred execution, transactional batching, scriptable macros, and audit logs.

## whyItMatters
UI buttons, keyboard shortcuts, network handlers, and CLI parsers all dispatch actions. Hard-wiring action code into each entry point creates duplication and makes features like undo or replay structurally impossible. Commands provide a single object that bundles the receiver, the operation, and the arguments, decoupling triggers from implementation.

## intuition
Think of a restaurant order ticket. The waiter writes down what you want, slides it across the counter, and the cook executes when ready. The ticket can be queued, re-prioritized, or cancelled. Nothing on the ticket tells the cook how to make the dish — it just names what to do and to whom.

## visualization
Picture three boxes: the invoker (button), the command (ticket), and the receiver (kitchen). The invoker holds a reference to a command and calls execute. The command knows the receiver and what method to invoke. A history list of executed commands enables undo by calling undo on each in reverse.

## bruteForce
Wiring callbacks directly into UI handlers spreads business logic across the view layer. Adding undo means manually capturing previous state at every callsite. Logging actions for analytics duplicates that capture again. Macro recording becomes nearly impossible without invasive instrumentation.

## optimal
Define a Command interface with execute and optionally undo. Concrete commands hold the receiver and parameters needed. The invoker accepts any Command and runs it. A history stack supports undo and redo. Composite commands batch multiple operations into a transaction. Serialization enables queueing across processes.

## complexity
Each command execution is O(1) overhead beyond the wrapped operation itself. Undo history grows O(n) in number of executed commands. Memory per command depends on captured arguments and any state needed for reversal.

## pitfalls
Forgetting to capture mutable arguments by value leads to broken undo when the original object changes. Commands that mutate shared state must coordinate to avoid stale undo data. Storing huge payloads in history blows memory — prefer snapshots of just the deltas. Async commands need a way to report completion.

## interviewTips
Frame Command as the foundation of any undo system. Mention text editors, transactional databases, and message queues as real users. If asked to design a task scheduler or an action history, propose this pattern first. Distinguish from Strategy: Command captures a request; Strategy swaps an algorithm.

## code.python
```python
class Command:
    def execute(self): ...
    def undo(self): ...

class AddText(Command):
    def __init__(self, doc, text):
        self.doc, self.text = doc, text

    def execute(self):
        self.doc.content += self.text

    def undo(self):
        self.doc.content = self.doc.content[:-len(self.text)]

class Editor:
    def __init__(self):
        self.history = []

    def run(self, cmd):
        cmd.execute()
        self.history.append(cmd)

    def undo(self):
        if self.history:
            self.history.pop().undo()
```

## code.javascript
```javascript
class AddText {
  constructor(doc, text) { this.doc = doc; this.text = text; }
  execute() { this.doc.content += this.text; }
  undo() { this.doc.content = this.doc.content.slice(0, -this.text.length); }
}

class Editor {
  constructor() { this.history = []; }
  run(cmd) { cmd.execute(); this.history.push(cmd); }
  undo() { const cmd = this.history.pop(); if (cmd) cmd.undo(); }
}
```

## code.java
```java
import java.util.ArrayDeque;
import java.util.Deque;

interface Command { void execute(); void undo(); }

class AddText implements Command {
    private final StringBuilder doc;
    private final String text;
    AddText(StringBuilder doc, String text) { this.doc = doc; this.text = text; }
    public void execute() { doc.append(text); }
    public void undo() { doc.delete(doc.length() - text.length(), doc.length()); }
}

class Editor {
    private final Deque<Command> history = new ArrayDeque<>();
    public void run(Command c) { c.execute(); history.push(c); }
    public void undo() { if (!history.isEmpty()) history.pop().undo(); }
}
```

## code.cpp
```cpp
#include <stack>
#include <string>

struct Command {
    virtual void execute() = 0;
    virtual void undo() = 0;
    virtual ~Command() = default;
};

struct AddText : Command {
    std::string& doc;
    std::string text;
    AddText(std::string& d, std::string t) : doc(d), text(std::move(t)) {}
    void execute() override { doc += text; }
    void undo() override { doc.erase(doc.size() - text.size()); }
};

class Editor {
    std::stack<Command*> history;
public:
    void run(Command* c) { c->execute(); history.push(c); }
    void undo() { if (!history.empty()) { history.top()->undo(); history.pop(); } }
};
```
