---
slug: test-mocking-doubles
module: testing-swe
title: Test Doubles and Dependency Injection
subtitle: Stand-in objects — dummies, stubs, spies, mocks, and fakes — that replace slow or awkward collaborators so a unit test stays fast, deterministic, and isolated, and the injection seam that makes swapping them possible.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: [test-unit-tdd]
relatedProblems: []
references:
  - title: "Martin Fowler — Mocks Aren't Stubs"
    url: "https://martinfowler.com/articles/mocksArentStubs.html"
    type: article
  - title: "Martin Fowler — TestDouble"
    url: "https://martinfowler.com/bliki/TestDouble.html"
    type: article
  - title: "Jest — Mock Functions"
    url: "https://jestjs.io/docs/mock-functions"
    type: article
  - title: "Python docs — unittest.mock"
    url: "https://docs.python.org/3/library/unittest.mock.html"
    type: article
  - title: "pytest — How to monkeypatch/mock modules and environments"
    url: "https://docs.pytest.org/en/stable/how-to/monkeypatch.html"
    type: article
status: published

---

## intro
A unit test is only useful when it runs fast, gives the same answer every time, and fails for exactly one reason. Real collaborators break all three promises: a payment gateway is slow and charges money, a database needs a running server, a clock advances on its own, an email service sends actual mail. A **test double** is a stand-in object you hand to the code under test in place of one of those real collaborators, so the test exercises your logic without dragging the whole world along. The umbrella term covers five distinct kinds — dummy, stub, spy, mock, and fake — each shaped for a different job.

## whyItMatters
Confusing the five kinds of double is one of the most common sources of tests that either prove nothing or shatter on every refactor. Reach for a stub when you only need a canned answer, a mock when the *interaction itself* is the thing under test, a fake when you want realistic behaviour without the real infrastructure — and the test stays clear and durable. Get it wrong and you write tests that pass no matter what the code does, or tests so glued to internal call sequences that changing a private method breaks fifty of them. On top of that, doubles only work if the code was written to accept them, which forces the deeper skill: **dependency injection**. Interviewers probe this precisely because it separates people who write tests from people who design testable systems.

## intuition
Think of a film shoot. The lead actor does not personally leap off the exploding building — a **stunt double** who looks close enough stands in for the shot that would be dangerous, slow, or expensive to do for real. Test doubles are exactly this: cheap, safe stand-ins for collaborators that are dangerous, slow, or expensive to use for real inside a test. The five kinds differ in how much acting they do.

A **dummy** is a body in the crowd — passed only to fill a required parameter slot, never actually used. You need *something* in that argument, its value is irrelevant, so you hand in a placeholder. A **stub** has one line: it returns a hard-coded answer when asked. `getUser()` on a stub always returns the same fake user, no logic behind it, just a canned response so the code under test can proceed. A **spy** is a stub that also keeps a diary — it returns canned answers *and* records how it was called, so afterwards you can ask "were you called, how many times, with what arguments?" A **mock** is the most opinionated: you tell it in advance exactly which calls to expect, and it fails the test itself if reality does not match that script. A **fake** is a full working stand-in with real behaviour but a shortcut implementation — an in-memory dictionary standing in for a database: it genuinely stores and retrieves, it is just not production-grade.

Underneath the five kinds lies the split Fowler drew: **state verification versus behaviour verification**. With a stub or fake you run the code, then assert on the *resulting state* — what value came back, what the object now holds. With a mock or spy you assert on the *interactions* — that a particular method was called with particular arguments. State verification asks "did we get the right answer?"; behaviour verification asks "did we make the right calls?" Both need a **seam** where the real collaborator can be swapped for the double, and that seam is **dependency injection**: instead of a unit reaching out and constructing its own database or HTTP client, it receives that collaborator from outside — through a constructor argument, a function parameter, or a setter. Hand it the real thing in production, hand it a double in the test. No seam, no swap, no unit test.

## visualization
```
  UNIT TEST WITH THE REAL DEPENDENCY (slow, flaky, not isolated)

     [ OrderService.checkout() ]
              |  calls save()
              v
     ====== injection seam ======
              |
              v
     [ Postgres over network ]  <- ~180 ms, needs a running DB,
                                    fails if the network blips


  SAME UNIT WITH A DOUBLE SWAPPED AT THE SEAM (fast, isolated)

     [ OrderService.checkout() ]
              |  calls save()
              v
     ====== injection seam ======
              |
              v
     [ InMemoryRepo (fake/stub) ]  <- ~0.2 ms, no network,
                                      deterministic every run
```

## bruteForce
The naive approach is to test against the real thing: point the test at a live database, call the real payment API, hit the actual network. It feels honest — you are exercising production code paths — but as a *unit* test it fails on every axis. It is **slow**: a round trip to Postgres or an HTTP endpoint is milliseconds to seconds, and a suite of thousands of them turns a two-second run into ten minutes. It is **flaky**: the network drops, the shared test database has stale rows from another run, the third-party API rate-limits you, so the same code passes and fails at random. And it is **not isolated**: when it goes red you cannot tell whether *your* logic broke or the database did, so the test has stopped pinpointing anything.

## optimal
Start from the seam. Write the unit so every awkward collaborator arrives from outside — a repository passed to the constructor, a `fetch` function passed as an argument, a clock injected rather than called as `Date.now()`. That is **dependency injection**, and it is the precondition for everything else: with the seam in place you hand the real collaborator to production and a double to the test, changing nothing about the unit itself.

Then pick the *smallest* double that does the job. If the code just needs data to flow, use a **stub** or a **fake** and verify **state** — run the method, assert on what came back or what the fake now contains. State verification is the default because it couples the test to the observable outcome, not to how the code achieved it, so the test survives refactors. Only reach for a **mock or spy** when the interaction genuinely *is* the behaviour under test: that an email was sent, that a payment was charged exactly once, that a cache was written to. There the call itself is the outcome you care about, so **behaviour verification** — asserting the method was called with the right arguments — is warranted.

The trap at the other extreme is **over-mocking**. When a test mocks every collaborator and asserts on every call, it stops testing behaviour and starts testing the code's internal wiring — a mirror of the implementation that breaks the moment you rename a method or reorder two calls, without any real bug. The discipline that keeps this in check: **mock at boundaries you don't own, not your own code.** Double the database driver, the HTTP client, the clock, the third-party SDK — the edges where your system meets the outside world. Do *not* mock your own domain objects and pure functions; let those run for real, because that is the logic the test exists to protect. A test that stubs out the very thing it claims to verify proves nothing at all.

## complexity
time: A double turns a collaborator call from milliseconds (network / disk) into microseconds (in-memory), so a suite of N unit tests goes from minutes to well under a second — the whole reason doubles exist is this speedup plus determinism.
space: Negligible per double — a stub is a closure or a tiny object; a fake holds its data in an in-memory structure sized to the test's fixtures, not production volumes.
notes: The real cost is not runtime but **coupling**. Every behaviour-verified mock ties the test to an implementation detail (a specific method, argument shape, call count). More mocks means faster, more isolated tests but higher coupling to *how* the code works; more state verification with fakes means slightly heavier tests but far lower coupling. The engineering judgement is trading test isolation against brittleness.

## pitfalls
- **Over-mocking every collaborator.** Mocking everything and asserting on every call produces a test that is a mirror of the implementation — it breaks on refactors that fix nothing and passes over real bugs in the un-mocked seams. Fix: mock only the awkward boundary; let your own logic and value objects run for real, and verify state where you can.
- **Mocking what you don't own.** Building a mock of a third-party library's exact API means your test encodes *your assumption* of how that library behaves, which can silently drift from reality on an upgrade. Fix: wrap the third-party dependency in a thin adapter you *do* own, and mock the adapter; verify the adapter itself against the real library in a separate integration test.
- **Brittle behaviour verification.** Asserting the exact sequence, count, and arguments of internal calls couples the test to implementation choices that are not part of the contract. Fix: prefer state verification (assert on the returned value or resulting state); reserve interaction assertions for cases where the call *is* the observable effect (email sent, payment charged).
- **Stubbing so much the test proves nothing.** If you stub the method that contains the logic under test, the test only confirms your stub returns what you told it to. Fix: stub the *inputs and collaborators* around the code under test, never the behaviour you are trying to verify; keep a clear line between the unit and its doubles.

## interviewTips
- Be able to name and distinguish all five doubles in one breath — dummy fills a slot, stub returns canned data, spy records calls, mock pre-programs and self-verifies expectations, fake is a working lightweight implementation — then state the deeper split: stubs/fakes support state verification, mocks/spies support behaviour verification.
- When asked how you make code testable, lead with dependency injection: the unit receives its collaborators through a constructor or parameter rather than constructing them, creating the seam where a double slots in. No seam, no unit test.
- If handed a brittle suite, diagnose over-mocking: too many behaviour-verified mocks glued to internal calls. Prescribe mocking at boundaries you don't own, wrapping third-party APIs in adapters, and shifting to state verification with fakes wherever the outcome is observable.

## keyTakeaways
- The five test doubles are distinct tools: dummy (slot-filler), stub (canned answer), spy (records calls), mock (pre-programmed self-verifying expectations), and fake (working lightweight implementation) — pick the smallest one that does the job.
- Dependency injection is the enabling seam: a unit that receives its collaborators from outside can be handed the real thing in production and a double in the test, without changing the unit.
- Prefer state verification with stubs and fakes for durability; reserve behaviour verification with mocks and spies for when the interaction itself is the outcome; mock at boundaries you don't own and never over-mock your own logic.

## code.javascript
```javascript
// A service that depends on an injected repository and an injected mailer.
// Dependency injection = both collaborators arrive through the constructor,
// so the test can hand in doubles instead of a real DB and real email server.
class OrderService {
  constructor(repo, mailer) {
    this.repo = repo;     // seam 1: data access
    this.mailer = mailer; // seam 2: side-effecting boundary we don't own
  }

  async checkout(userId, cart) {
    if (cart.length === 0) throw new Error('empty cart');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const order = await this.repo.save({ userId, total, status: 'paid' });
    await this.mailer.send(userId, `Order ${order.id} confirmed`);
    return order;
  }
}

// --- Jest test ---

test('checkout persists the order (state verification with a STUB/FAKE)', async () => {
  // Fake repo: a real, working in-memory implementation, not production-grade.
  const saved = [];
  const repoFake = {
    save: async (order) => {
      const stored = { id: saved.length + 1, ...order };
      saved.push(stored);
      return stored;
    },
  };
  // Stub mailer: canned no-op answer; we don't verify it here.
  const mailerStub = { send: async () => undefined };

  const service = new OrderService(repoFake, mailerStub);
  const order = await service.checkout('u1', [{ price: 30 }, { price: 12 }]);

  // Assert on RESULTING STATE, not on how it was achieved.
  expect(order).toEqual({ id: 1, userId: 'u1', total: 42, status: 'paid' });
  expect(saved).toHaveLength(1);
});

test('checkout sends exactly one confirmation email (behaviour verification with a MOCK/SPY)', async () => {
  const repoStub = { save: async (o) => ({ id: 7, ...o }) };
  // jest.fn() is a spy: it returns a canned value AND records every call.
  const sendSpy = jest.fn().mockResolvedValue(undefined);
  const mailerMock = { send: sendSpy };

  const service = new OrderService(repoStub, mailerMock);
  await service.checkout('u1', [{ price: 5 }]);

  // Here the CALL itself is the outcome we care about, so we verify interaction.
  expect(sendSpy).toHaveBeenCalledTimes(1);
  expect(sendSpy).toHaveBeenCalledWith('u1', 'Order 7 confirmed');
});
```

## code.python
```python
# Same service, injected collaborators. Dependency injection via __init__ args
# gives the test a seam to swap the real repo/mailer for doubles.
from unittest.mock import Mock
import pytest


class OrderService:
    def __init__(self, repo, mailer):
        self.repo = repo      # seam 1: data access
        self.mailer = mailer  # seam 2: boundary we don't own

    def checkout(self, user_id, cart):
        if not cart:
            raise ValueError("empty cart")
        total = sum(item["price"] for item in cart)
        order = self.repo.save({"user_id": user_id, "total": total, "status": "paid"})
        self.mailer.send(user_id, f"Order {order['id']} confirmed")
        return order


# --- STATE verification with a FAKE (real in-memory behaviour) ---

class InMemoryRepo:
    def __init__(self):
        self.rows = []

    def save(self, order):
        stored = {"id": len(self.rows) + 1, **order}
        self.rows.append(stored)
        return stored


def test_checkout_persists_order():
    repo = InMemoryRepo()
    mailer = Mock()  # stub-style: calls are no-ops we don't assert on here
    service = OrderService(repo, mailer)

    order = service.checkout("u1", [{"price": 30}, {"price": 12}])

    # Assert on resulting state, decoupled from the implementation.
    assert order == {"id": 1, "user_id": "u1", "total": 42, "status": "paid"}
    assert len(repo.rows) == 1


# --- BEHAVIOUR verification with a MOCK/SPY (the call is the outcome) ---

def test_checkout_sends_one_email():
    repo = Mock()
    repo.save.return_value = {"id": 7, "user_id": "u1", "total": 5, "status": "paid"}
    mailer = Mock()  # Mock records every call for later assertion
    service = OrderService(repo, mailer)

    service.checkout("u1", [{"price": 5}])

    mailer.send.assert_called_once_with("u1", "Order 7 confirmed")


# --- monkeypatch: inject a double at a module boundary you don't own ---

def test_checkout_with_monkeypatched_clock(monkeypatch):
    # When a collaborator is a module-level function rather than a ctor arg,
    # pytest's monkeypatch replaces it at the seam for the duration of the test.
    import time
    monkeypatch.setattr(time, "time", lambda: 1_700_000_000.0)
    assert time.time() == 1_700_000_000.0
```
