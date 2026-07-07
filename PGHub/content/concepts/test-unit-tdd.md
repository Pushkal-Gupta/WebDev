---
slug: test-unit-tdd
module: testing-swe
title: Unit Testing and Test-Driven Development
subtitle: Small, fast, isolated checks on one piece of behaviour at a time — and the red-green-refactor discipline of writing the failing test before the code that satisfies it.
difficulty: Beginner
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — UnitTest"
    url: "https://martinfowler.com/bliki/UnitTest.html"
    type: article
  - title: "Martin Fowler — Test Driven Development"
    url: "https://martinfowler.com/bliki/TestDrivenDevelopment.html"
    type: article
  - title: "Jest — Getting Started"
    url: "https://jestjs.io/docs/getting-started"
    type: docs
  - title: "pytest — Get Started"
    url: "https://docs.pytest.org/en/stable/getting-started.html"
    type: docs
  - title: "Python unittest — Basic example"
    url: "https://docs.python.org/3/library/unittest.html"
    type: docs
status: published
---

## intro
A **unit test** is a small, automated check that exercises one piece of behaviour — usually a single function or method — in isolation and asserts that it produced the result you expected. It runs in milliseconds, needs no database or network, and either passes or fails with a clear message. **Test-driven development (TDD)** flips the usual order: you write that failing test *first*, watch it fail, then write just enough code to make it pass, then clean the code up. The tests become both a safety net and a living specification of what the code is supposed to do.

## whyItMatters
Code that has no tests is code you are afraid to change. Every edit becomes a gamble: fix one thing, silently break another, and only find out when a user does. A trustworthy unit-test suite turns that fear into confidence — you refactor freely because the tests catch regressions the instant you introduce them. Tests also document intent far better than comments: a reader can scan the test names and know exactly what the function guarantees. TDD pushes this further by making tests drive the design, so you write only the code you actually need, keep functions small and testable, and get instant feedback on every step. Interviewers probe this because untested code is the single most common source of production incidents.

## intuition
Think of TDD as a tight three-beat rhythm that you repeat over and over: **red, green, refactor**. In the **red** beat you write a test for behaviour that does not exist yet and run it — it fails, and that red failure is not a mistake, it is a target. A test that has never been seen to fail is worthless, because you have no proof it can detect the bug it is supposed to catch. In the **green** beat you write the smallest, dumbest amount of code that turns the bar green — even a hard-coded return value is fine on the first pass, because the goal is only to satisfy the test, not to be clever. In the **refactor** beat you finally improve the design — rename, extract, de-duplicate — while the green tests guard your back, so you can restructure with a net beneath you. Then you loop: the next red test forces the hard-coded answer to become real logic.

Inside a single test, the shape is **Arrange-Act-Assert (AAA)**. First you **arrange** the world: build the inputs and set up the object under test. Then you **act**: call the one thing you are testing, exactly once. Then you **assert**: compare what came back against what you expected. Keeping these three phases visually separate makes a test readable at a glance and stops the sneaky habit of asserting halfway through the setup.

What separates a good unit test from a flaky one comes down to four properties. It should be **fast** — milliseconds, so you can run thousands without thinking. It should be **isolated** — it does not depend on other tests running first, on shared global state, or on the clock and the network; run it alone or in any order and it behaves identically. It should be **deterministic** — the same input always yields the same verdict, never passing on Tuesday and failing on Friday. And it should have **one reason to fail** — it checks a single behaviour, so when it goes red the name alone tells you what broke, instead of leaving you to bisect a test that asserted twelve unrelated things.

## visualization
```
   TDD loop:  RED  ->  GREEN  ->  REFACTOR  --.
                ^                              |
                '------------------------------'

   [ RED ]      write a failing test        status: FAIL (x)
                  |  run the suite
                  v
   [ GREEN ]    smallest code to pass       status: PASS (check)
                  |  run the suite
                  v
   [ REFACTOR ] clean up, keep tests green  status: PASS (check)
                  |  next requirement
                  '--> back to RED

   Inside one test  -- Arrange / Act / Assert
   ----------------------------------------------
   Arrange:  input = [3, 1, 2]          (set up the world)
   Act:      result = sort(input)       (call it ONCE)
   Assert:   expect result == [1, 2, 3] (one reason to fail)
```

## bruteForce
The naive approach is to skip automated tests and verify by hand: write the whole function, run the app, click through the UI, eyeball the output, and move on. It feels faster at first because there is no test code to write. But manual testing does not scale — every change means re-clicking the same path, you only check the cases you happen to remember, and nobody re-runs yesterday's checks, so old bugs quietly creep back in. "Test after" — writing tests only once the code already works — is a milder version of the same trap: the tests tend to rubber-stamp whatever the code currently does, including its bugs, and you never see them fail, so you never know they actually detect anything.

## optimal
Do it test-first, one small behaviour at a time, and keep each test disciplined. Start every cycle in **red**: write a test that names a specific behaviour and asserts the outcome, run it, and confirm it fails *for the right reason* — a missing function or a wrong value, not a typo in the test. Seeing the failure is what proves the test has teeth.

Then go **green** with the minimum code. Resist the urge to build the general solution immediately; make this one test pass, even crudely. The next test you write will expose the gaps and force the crude version to grow into real logic. This is how TDD keeps you from over-engineering: you only ever write code that some test demanded.

Structure the test body as **Arrange-Act-Assert** and keep the act to a single call. Name tests as sentences describing behaviour, not implementation: `returns_zero_for_empty_list` beats `test1`, because when it fails the name alone is a bug report. Assert on one behaviour per test so there is exactly one reason to fail; if you feel the need to assert five unrelated things, that is five tests wearing a trench coat. Cover the edges deliberately — empty input, a single element, boundaries, negatives, duplicates — because that is where bugs actually live, not in the happy path you already believe works.

Finally, **refactor** with the suite green. Now you improve names, extract helpers, remove duplication in both the code and the tests themselves, all while the green bar confirms behaviour is unchanged. Keep tests **isolated** (no shared mutable state, no reliance on order) and **deterministic** (inject the clock and random seed rather than reading the real ones) so the suite stays trustworthy. A fast, green, trustworthy suite is what lets you keep the loop tight and ship without fear.

## complexity
time: A single unit test should run in **single-digit milliseconds** — no I/O, no sleeps, no network. A whole suite of thousands should finish in seconds so it can run on every save. Anything that touches a real database or waits on a timer has left the "unit" category and belongs in a slower integration tier.
space: Negligible per test — a few in-memory objects arranged in the setup, discarded after the assertion. The real cost is **maintenance surface**: every test is code you must keep passing, so over-specified or brittle tests that assert implementation details cost more to maintain than they are worth.
notes: Optimise for feedback speed and signal. A suite that is slow or flaky gets ignored, and an ignored suite protects nothing — keep tests fast, isolated, and deterministic so the team actually runs them.

## pitfalls
- **Tests that never fail.** Writing the test after the code and only ever seeing it green means you have no proof it can catch a bug. Fix: practise red-green — always watch the test fail first, or temporarily break the code to confirm the test goes red.
- **Multiple reasons to fail in one test.** Asserting several unrelated behaviours means a failure does not tell you what broke and one bug hides others. Fix: split into separate tests, each named for the single behaviour it checks.
- **Non-deterministic / flaky tests.** Depending on `Date.now()`, real random numbers, timezones, or test-execution order makes a test pass sometimes and fail sometimes, so the team learns to ignore red. Fix: inject the clock and the random seed, remove shared mutable state, and make each test set up its own world.
- **Testing implementation instead of behaviour.** Asserting that a private helper was called or checking exact internal structure makes every refactor break the tests even when behaviour is unchanged. Fix: assert on observable outputs and public contracts, not internals.
- **Slow "unit" tests that hit I/O.** Reading a database or calling a network service turns a millisecond check into a second-long one and couples the test to external state. Fix: keep true units in-memory; push database and network checks into a separate, slower integration suite.

## interviewTips
- State the red-green-refactor loop and stress that seeing the test fail first is non-negotiable — it is the only proof the test can detect the bug it targets.
- Describe the four properties of a good unit test (fast, isolated, deterministic, one reason to fail) and give the AAA structure as the way you keep each test readable and single-purpose.
- When asked how you handle time or randomness, say you inject them (pass a clock, seed the RNG) so tests stay deterministic — this shows you understand why flaky suites get abandoned.

## keyTakeaways
- A unit test checks one behaviour in isolation, runs in milliseconds, and gives a clear pass/fail; TDD writes that failing test *before* the code, then makes it pass, then refactors.
- Good tests are fast, isolated, deterministic, and have one reason to fail; inside each test the Arrange-Act-Assert shape keeps it readable and single-purpose.
- The payoff is fearless change: a green, trustworthy suite catches regressions instantly, documents intent, and lets you refactor with a safety net instead of a gamble.

## code.javascript
```javascript
// Jest / Vitest — TDD for a small pure function, written test-first (AAA).
// Requirement: fizzbuzz(n) -> "Fizz" | "Buzz" | "FizzBuzz" | String(n).

// STEP 1 (RED): the test exists before the code, so it fails to even import.
// STEP 2 (GREEN): the minimal implementation below makes every test pass.
export function fizzbuzz(n) {
  if (n % 15 === 0) return 'FizzBuzz';
  if (n % 3 === 0) return 'Fizz';
  if (n % 5 === 0) return 'Buzz';
  return String(n);
}

describe('fizzbuzz', () => {
  test('returns the number as a string when it shares no factor', () => {
    // Arrange
    const input = 1;
    // Act
    const result = fizzbuzz(input);
    // Assert — one reason to fail
    expect(result).toBe('1');
  });

  test('returns "Fizz" for multiples of 3 only', () => {
    expect(fizzbuzz(6)).toBe('Fizz');
  });

  test('returns "Buzz" for multiples of 5 only', () => {
    expect(fizzbuzz(10)).toBe('Buzz');
  });

  test('returns "FizzBuzz" for multiples of both 3 and 5', () => {
    // Edge/boundary case: the combined rule must win over either single rule.
    expect(fizzbuzz(15)).toBe('FizzBuzz');
  });
});
```

## code.python
```python
# pytest + unittest — same TDD cycle for a pure function.
# Requirement: total_price(items) sums {price, qty}, rejecting negatives.

# STEP 1 (RED): write the tests first; they fail because the function is absent.
# STEP 2 (GREEN): the minimal body below makes them pass. STEP 3: refactor freely.
def total_price(items):
    total = 0
    for item in items:
        price, qty = item["price"], item["qty"]
        if price < 0 or qty < 0:
            raise ValueError("price and qty must be non-negative")
        total += price * qty
    return total


# ---- pytest style: one behaviour per test, Arrange / Act / Assert ----
import pytest


def test_empty_cart_totals_zero():
    # Arrange
    items = []
    # Act
    result = total_price(items)
    # Assert
    assert result == 0


def test_sums_price_times_quantity():
    items = [{"price": 3, "qty": 2}, {"price": 5, "qty": 1}]
    assert total_price(items) == 11


def test_rejects_negative_price():
    with pytest.raises(ValueError):
        total_price([{"price": -1, "qty": 2}])


# ---- unittest style: the same checks, xUnit structure ----
import unittest


class TotalPriceTests(unittest.TestCase):
    def test_single_item(self):
        self.assertEqual(total_price([{"price": 4, "qty": 3}]), 12)

    def test_negative_qty_raises(self):
        with self.assertRaises(ValueError):
            total_price([{"price": 2, "qty": -1}])


if __name__ == "__main__":
    unittest.main()
```
