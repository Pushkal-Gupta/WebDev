---
slug: event-sourcing
module: sd-microservices
title: Event Sourcing + CQRS
subtitle: Persist every change as an event, derive state by replay — perfect audit trail, time-travel debugging, easy projections.
difficulty: Advanced
position: 13
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Most apps store current state — "user 7's balance is $200". **Event sourcing** flips that: store every state-changing event ("user 7 deposited $50 on 2024-01-15", "user 7 withdrew $20 on 2024-01-16"), and the current balance is just the result of replaying those events. Combined with **CQRS** (Command Query Responsibility Segregation) — separate writes (event commands) from reads (projected views) — you get audit trails, easy debugging, fearless schema migrations, and read scaling.

## whyItMatters
Financial systems, ledgers, version-control systems (Git), collaborative editors (Figma), most blockchains — they're all event-sourced. The advantages: every change is permanent and auditable; you can replay history to debug or rebuild views; new read models can be added without changing writes; schema migrations are just rewriting the projection.

Tradeoffs: more storage, more complexity, eventual consistency between writes and reads.

## intuition
- **Command**: an intent ("deposit $50 to account 7").
- **Event**: a fact ("account 7 was credited $50 at T"). Past tense, immutable, never deleted.
- **Aggregate**: a chunk of state (one account) that processes commands and emits events.
- **Projection**: a read model — a denormalized view computed from events ("current balance," "monthly statement").

To query "what's the balance?": don't store it directly. Fold events: balance = sum of deposits − sum of withdrawals.

## visualization
```
Events for account 7 (immutable log):
  T=1  AccountOpened          { initial: $0 }
  T=2  Deposited               { amount: $100 }
  T=3  Withdrew                { amount: $20 }
  T=4  Deposited               { amount: $50 }

Projection "current balance" (fold):
  $0 → +100 → -20 → +50 = $130

Projection "monthly_statement" (group by month, sum):
  2024-01: deposits=150, withdrawals=20, net=+130
```

## bruteForce
Store current balance directly. Update on every transaction. Simple, fast — but loses history. Can't answer "what was the balance on Jan 10?" without a separate audit table that's almost certainly inconsistent.

## optimal
**Write path** (command handler):
```
def handle_deposit(account_id, amount):
    account = load_account(account_id)        # replay events
    if amount <= 0: raise ValueError
    event = Deposited(account_id, amount, time.now())
    append_event(account_id, event)
    publish(event)                             # to event bus → projections
```

**Load aggregate by replay**:
```
def load_account(account_id):
    state = AccountState()
    for ev in events_for(account_id):
        state = apply(state, ev)
    return state
```

**Snapshots**: replaying 1M events on every load is slow. Periodically snapshot the aggregate state (e.g., every 1000 events) and replay only events newer than the snapshot.

**Projections**: a worker subscribes to the event stream and updates denormalized read models (current_balance, statement, leaderboard, etc.).

**Eventual consistency**: after a write, projections lag by a few ms. Read-after-write quirks need explicit "wait for projection" or "read from write side."

## complexity
- **Write**: O(1) — append event.
- **Load by replay**: O(events_per_aggregate); with snapshots O(events_since_snapshot).
- **Storage**: events are append-only — orders of magnitude more than current-state-only.
- **Eventual consistency window**: typically 10ms–1s between write and projection update.

## pitfalls
- **Replaying huge event streams without snapshots**: O(n) per aggregate load. Snapshot every N events.
- **Mutating events after-the-fact**: forbidden. Events are facts. To "fix" a wrong event, emit a compensating event (e.g., `BalanceCorrected { delta: -100 }`).
- **Schema drift in event payloads**: events live forever. Use schema evolution (additive fields, versioned event types).
- **Read-after-write expectations**: the read side is eventually consistent. UI needs to show "saved" without waiting for the projection, or wait for an ack from the projection.
- **Confusing events with messages**: events describe the past (`DepositCompleted`); commands ask for the future (`Deposit`). Don't mix.

## interviewTips
- For "design an audit-log system," "design a banking ledger," "design a collaborative editor" → event sourcing.
- Always pair with **CQRS** — read and write are separate concerns.
- Mention **snapshots** and **projections** without prompting.
- For senior interviews, discuss the **eventual-consistency UX problem** and how to mitigate (optimistic UI, server ack on the write side).
- Compare with **CRUD + audit table** (simpler, less powerful) and **bitemporal databases** (history + validity intervals — strictly more powerful but rare).

## code.python
```python
class AccountEvent:
    def __init__(self, type_, amount, ts):
        self.type, self.amount, self.ts = type_, amount, ts

events = []

def deposit(account_id, amount):
    events.append(AccountEvent('Deposited', amount, time.time()))

def withdraw(account_id, amount):
    bal = current_balance(account_id)
    if bal < amount: raise ValueError("insufficient")
    events.append(AccountEvent('Withdrew', amount, time.time()))

def current_balance(account_id):
    return sum(e.amount if e.type == 'Deposited' else -e.amount for e in events)
```

## code.javascript
```javascript
const events = [];

function deposit(amount) { events.push({ type: 'Deposited', amount, ts: Date.now() }); }
function withdraw(amount) {
  if (currentBalance() < amount) throw new Error("insufficient");
  events.push({ type: 'Withdrew', amount, ts: Date.now() });
}
function currentBalance() {
  return events.reduce((bal, e) => bal + (e.type === 'Deposited' ? e.amount : -e.amount), 0);
}
```

## code.java
```java
import java.util.*;
class Ledger {
    record Event(String type, long amount, long ts) {}
    final List<Event> events = new ArrayList<>();
    void deposit(long amount) { events.add(new Event("Deposited", amount, System.currentTimeMillis())); }
    void withdraw(long amount) {
        if (currentBalance() < amount) throw new IllegalStateException("insufficient");
        events.add(new Event("Withdrew", amount, System.currentTimeMillis()));
    }
    long currentBalance() {
        return events.stream()
            .mapToLong(e -> e.type().equals("Deposited") ? e.amount() : -e.amount())
            .sum();
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
struct Event { std::string type; long long amount; long long ts; };
class Ledger {
    std::vector<Event> events;
public:
    long long balance() const {
        long long b = 0;
        for (const auto& e : events) b += (e.type == "Deposited" ? e.amount : -e.amount);
        return b;
    }
    void deposit(long long a, long long ts) { events.push_back({ "Deposited", a, ts }); }
};
```
