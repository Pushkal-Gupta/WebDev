---
slug: design-pattern-command
module: foundations-patterns
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
- **Photoshop / Figma / VS Code undo stacks**: every edit is a Command pushed onto a history deque so Cmd-Z can call `undo()` in reverse. Without it you'd have to snapshot the entire document on every keystroke.
- **Postgres / MySQL write-ahead logs**: each DML statement is serialised as a command record before commit. Crash recovery replays the log to bring the database back to a consistent state — pure Command pattern at storage scale.
- **Kafka, RabbitMQ, AWS SQS**: producer-side messages are commands; consumers `execute` them out-of-process, hours later, possibly on a different machine. Decoupling sender from receiver is the whole point of message queues.
- **Git**: each commit is a Command applied to a tree; rebase, cherry-pick, and revert work because commits are reified, named, addressable, replayable units of change.
- **Game engines (Unreal, Unity input pipeline)**: keypresses and gestures bind to commands, so the same `JumpCommand` runs whether the trigger is keyboard, gamepad, AI script, or replay file.

Hard-wiring action code into each entry point makes undo, replay, audit, and remote execution structurally impossible. Commands unlock all four.

## intuition
The pattern exists because three forces — when to decide, what to do, who does it — are usually fused into a single method call, and that fusion blocks any feature that needs to defer, replay, or reorder work. A button's click handler that calls `document.insertText("hello")` decides *now*, knows *what*, and dispatches to the *document* in one line. There's no object to hold onto, queue, persist, or invert.

The Command pattern's move is to reify that intent as an object. `InsertTextCommand(document, "hello")` is a value you can construct without firing it. You can hand it to an invoker that runs it immediately, or stash it in a queue, or serialise it to disk and re-execute next session, or push it onto a history stack and call `undo()` to reverse it. The behaviour of the underlying receiver — `document.insertText` — never changes; what changes is that the *invocation* now has a name and an address.

This is why Command shows up everywhere actions need to outlive the moment they were triggered. Database transactions need to replay on recovery. Game inputs need to be recorded for replays. Distributed systems need to send work across the network. Macro recorders need to capture what the user did, not what the user clicked. In every case, the structural requirement is the same: the request must be a *thing*, not an event.

The waiter-and-cook metaphor names the same idea informally. The waiter (invoker) doesn't cook. The ticket (command) carries the order. The cook (receiver) executes when ready. Tickets queue, re-prioritise, void. The kitchen doesn't need to know what front-of-house just decided; the dining room doesn't need to know how a sauce is made. The ticket is the contract that decouples the two.

## optimal
A Command interface with `execute` and (when reversibility matters) `undo`. Concrete commands capture the receiver and the arguments — *by value*, snapshotted at construction time — and the invoker accepts any Command without caring what it does.

```python
from dataclasses import dataclass, field
from typing import Protocol

class Command(Protocol):
    def execute(self) -> None: ...
    def undo(self) -> None: ...

@dataclass
class InsertText:
    doc: "Document"
    text: str
    pos: int
    def execute(self): self.doc.insert(self.pos, self.text)
    def undo(self):    self.doc.delete(self.pos, len(self.text))

@dataclass
class DeleteRange:
    doc: "Document"
    pos: int
    length: int
    _removed: str = ""           # captured at execute time for undo
    def execute(self):
        self._removed = self.doc.read(self.pos, self.length)
        self.doc.delete(self.pos, self.length)
    def undo(self): self.doc.insert(self.pos, self._removed)

class Editor:
    def __init__(self):
        self.history: list[Command] = []
        self.redo_stack: list[Command] = []
    def run(self, cmd: Command):
        cmd.execute()
        self.history.append(cmd)
        self.redo_stack.clear()    # any new action invalidates redo
    def undo(self):
        if self.history:
            cmd = self.history.pop(); cmd.undo(); self.redo_stack.append(cmd)
    def redo(self):
        if self.redo_stack:
            cmd = self.redo_stack.pop(); cmd.execute(); self.history.append(cmd)
```

The pattern is optimal in the sense that it makes the four classic features — undo, redo, replay, queue — drop out for free instead of requiring per-callsite glue. `Editor.undo()` is three lines because every action is a Command; without the pattern, undo would need a per-action handler and snapshot strategy.

The implementation discipline worth naming: (1) capture all mutable arguments by value or snapshot at `execute` time (`DeleteRange` reads the removed text before deleting so `undo` can restore it); (2) clear the redo stack on any new action so the history is a tree, not a graph; (3) for transactional batches, wrap commands in a `MacroCommand` that delegates to a list and undoes in reverse order — atomic groups for free. Memory grows O(history size × per-command payload), so editors with very large diffs typically store deltas rather than full snapshots.

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
