---
slug: test-integration-e2e
module: testing-swe
title: The Testing Pyramid — Unit, Integration, and End-to-End
subtitle: Why a healthy suite is mostly fast unit tests at the base, fewer integration tests in the middle, and a thin cap of slow end-to-end tests — and what goes wrong when you flip it upside down.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: [test-unit-tdd]
relatedProblems: []
references:
  - title: "Martin Fowler — The Practical Test Pyramid"
    url: "https://martinfowler.com/articles/practical-test-pyramid.html"
    type: article
  - title: "Martin Fowler — TestPyramid (bliki)"
    url: "https://martinfowler.com/bliki/TestPyramid.html"
    type: article
  - title: "Martin Fowler — UnitTest (bliki)"
    url: "https://martinfowler.com/bliki/UnitTest.html"
    type: article
  - title: "Martin Fowler — Eradicating Non-Determinism in Tests"
    url: "https://martinfowler.com/articles/nonDeterminism.html"
    type: article
  - title: "Playwright — Getting started"
    url: "https://playwright.dev/docs/intro"
    type: docs
status: published
---

## intro
A test suite is not one thing; it is a stack of thin layers that each check a different-sized slice of your system. At the bottom sit **unit tests** that exercise one function or class in isolation. Above them, **integration tests** wire a few real pieces together — a service and its database, a handler and its dependencies — to confirm they actually agree at the seams. At the very top, a handful of **end-to-end** tests drive the whole application the way a user would, through the real UI and the real stack. The **testing pyramid** is the rule of thumb for how many of each you should own.

## whyItMatters
The shape of your suite decides how fast you find bugs and how much you trust a green build. Unit tests run in milliseconds, so hundreds of them give a tight feedback loop you can run on every keystroke; end-to-end tests take seconds each, spin up browsers and servers, and flake when the network hiccups. Lean too hard on the slow, wide tests and your suite becomes a twenty-minute gamble that engineers learn to ignore or re-run until green. Get the proportions right and you catch most defects in the layer that is cheapest to run, fastest to debug, and most precise about *where* the problem lives — which is the whole point of automated testing.

## intuition
Picture the suite as a literal pyramid, and let the width of each layer stand for how many tests live there. The **base is wide** because unit tests are cheap in every way that matters: they touch one small piece, need no network or database, run in memory, and finish in milliseconds. You can afford thousands of them, and when one fails it points a finger at a single function — the bug has nowhere to hide.

The **middle is narrower**. Integration tests are more expensive because they involve something real — an actual database, a message queue, an HTTP call between two services. Each one buys you confidence that the *contracts between components* hold, which unit tests with their mocks can never prove. But each also costs more setup, more runtime, and more ways to break, so you write fewer of them and aim each at a genuine seam.

The **top is a thin cap**. End-to-end tests launch the entire application and drive it like a user clicking through a browser. One of them can validate that login, routing, the API, the database, and rendering all cooperate — enormous confidence per test. That same breadth is why they are slow, brittle, and vague when they fail: a red E2E run tells you *something* down the stack broke, not *what*. So you keep only a few, covering the critical journeys money and users actually depend on.

The key idea is a tradeoff running up the pyramid: as you climb, each test gives more **confidence** that the real system works, but costs more **time**, more **money**, and more **flakiness**. As you descend, tests get faster, cheaper, and more precise but check smaller slices. A good suite spends most of its checks where they are cheap and precise, and reserves the expensive, high-confidence checks for the few paths that justify them.

The classic failure mode is the **ice-cream cone**: a fat scoop of end-to-end tests on top, almost nothing underneath, propped up by manual QA. It looks reassuring — "we test through the real UI!" — but it is the pyramid inverted, and it is slow, flaky, and brutal to maintain.

## visualization
```
                       /\
                      /  \        E2E  ·  ~5-15 tests
                     / E  \       slow (seconds)  · high confidence
                    /  2   \      brittle · vague on failure
                   /   E    \
                  /----------\
                 /            \   INTEGRATION · ~50-200 tests
                /  INTEGRATION \  medium (100s of ms) · real deps
               /                \ contracts between components
              /------------------\
             /                    \  UNIT  ·  ~1000s of tests
            /        UNIT          \ fast (ms) · precise on failure
           /                        \ one function/class in isolation
          /--------------------------\
   speed  ^ fast .......... slow ^  confidence ^ narrow .... broad ^
```

## bruteForce
The naive instinct is: "real users click the UI, so test the way a user would — through the UI, end to end, for everything." Every feature gets an end-to-end test that logs in, navigates, fills forms, and asserts on rendered pixels. It feels maximally realistic and it does catch integration bugs. But it produces the **ice-cream cone**: the expensive, slow, flaky layer carries the whole suite. Runs take many minutes, a single unrelated timeout reddens the build, and locating the actual defect means replaying a full browser session. The suite becomes something engineers avoid rather than trust.

## optimal
Distribute tests so each defect is caught by the *cheapest* layer that can catch it, and let higher layers only cover what lower layers structurally cannot.

**Unit tests** own business logic, edge cases, and branching. Pure functions, validation rules, calculations, state machines — anything you can exercise without I/O belongs here. They are the bulk of the suite because a bug in a formula or a boundary condition should never require a browser to surface. Keep them isolated: no real database, no network, so they stay in the millisecond range and never flake.

**Integration tests** own the seams. Does the repository actually persist and read back the right rows against a *real* database? Does the HTTP handler wire the request through to the service and return the right status? Here you deliberately use real collaborators — an in-memory or containerised database, a real router — because the whole value is proving the contract holds where mocks would have lied. Write enough to cover every important boundary, but no more, since each costs real setup and runtime.

**End-to-end tests** own the critical user journeys, and only those. Sign-up, login, checkout, the one workflow whose breakage means lost revenue. A few well-chosen E2E tests confirm the assembled system genuinely works from the outside; that is confidence nothing below can provide. Keep the set small so its slowness and brittleness stay bounded.

**Dealing with flakiness** is non-negotiable at the top. A test that passes and fails without code changes is worse than no test: it trains the team to ignore red. Quarantine flaky tests immediately, then fix the root cause — usually a race condition, a hard-coded `sleep`, shared state between tests, or reliance on a live external service. Prefer explicit waits for a *condition* over fixed delays, reset state between runs, and stub third-party services you do not control. A high, slow layer of *reliable* tests beats a tall pile of coin-flips.

**When to reach for each**: default to unit; climb only when the thing you need to verify genuinely spans components (integration) or genuinely spans the whole system as the user sees it (E2E). If a unit test can prove it, an E2E test proving the same thing is waste.

## complexity
time: Runtime per layer differs by orders of magnitude — a unit test is roughly **~1ms**, an integration test **~10-100ms** (real I/O, DB round-trips), an end-to-end test **~1-10s** (browser + full stack boot). Total suite time is dominated by the widest slow layer, which is exactly why an inverted pyramid produces multi-minute runs while a healthy one finishes fast.
space: Maintenance cost rises with height. A unit test breaks only when its one unit changes; an E2E test is coupled to the entire stack, so unrelated UI or infra changes ripple into it, and each is expensive to debug and keep green. Fixture and environment setup (databases, browsers, seed data) also grows heavier up the pyramid.
notes: Optimise for the *aggregate* — cheapest-layer-that-catches-it minimises both wall-clock feedback time and long-term upkeep. Flaky high-level tests silently inflate cost by triggering re-runs and eroding trust in the whole suite.

## pitfalls
- **Flaky tests** — a test that passes and fails nondeterministically (races, fixed `sleep`s, shared state, live third-party calls) destroys trust in the whole suite. Fix: quarantine it out of the main run, find the root cause, wait on explicit conditions instead of timers, isolate state per test, and stub external services.
- **The inverted pyramid / ice-cream cone** — most coverage sits in slow, brittle E2E tests with almost nothing underneath. Fix: push each check down to the lowest layer that can catch it; convert redundant E2E scenarios into fast unit and integration tests, keeping only critical-journey E2E.
- **Testing implementation details through E2E** — asserting on specific DOM structure, CSS classes, or internal wiring from an end-to-end test makes it break on every harmless refactor. Fix: assert on user-visible behaviour and outcomes, use stable roles/test-ids for selectors, and push logic checks down to unit tests.
- **Slow feedback loops** — a suite that takes twenty minutes gets skipped, so bugs land unnoticed. Fix: keep the fast unit layer runnable in seconds locally and on every commit, run the heavy integration/E2E layers in parallel and/or on a later CI stage, and never let the slow layer gate the tight inner loop.

## interviewTips
- Draw the pyramid and name the three layers with their tradeoff — up the pyramid gives more confidence but costs more time and flakiness; down gives speed and precise failure localisation. That framing signals you understand *why* the shape exists, not just its name.
- Call out the ice-cream-cone anti-pattern by name and explain its symptoms (slow, flaky, hard-to-debug builds) — interviewers love a candidate who can diagnose an inverted suite and prescribe pushing tests down a layer.
- Have a concrete flakiness story: replace `sleep(2)` with waiting on a condition, isolate shared state, or stub a third-party API — it shows you have actually maintained a real suite, not just read about one.

## keyTakeaways
- A healthy suite is a pyramid: many fast, precise unit tests at the base, fewer integration tests proving the seams, and a thin cap of slow, high-confidence end-to-end tests over critical journeys.
- Climbing the pyramid trades speed, cost, and reliability for breadth of confidence — so catch each bug in the cheapest layer that can catch it and reserve E2E for what only E2E can verify.
- The ice-cream cone (E2E-heavy, flaky, slow) is the canonical anti-pattern; fix it by pushing tests down and by eliminating flakiness at the root rather than tolerating red builds.

## code.javascript
```javascript
// ---------- UNIT TEST ----------
// Exercises one pure function in isolation. No I/O, runs in ~1ms.
// Vitest / Jest style.
import { describe, it, expect, vi } from 'vitest';
import { applyDiscount } from '../src/pricing.js';

describe('applyDiscount (unit)', () => {
  it('takes the percentage off', () => {
    expect(applyDiscount(100, 0.2)).toBe(80);
  });
  it('never returns a negative price', () => {
    expect(applyDiscount(10, 2)).toBe(0); // clamped at zero
  });
});

// ---------- INTEGRATION TEST ----------
// Wires the real service to a real (test) database. Slower: real I/O.
import { OrderService } from '../src/orderService.js';
import { makeTestDb } from './helpers/testDb.js';

describe('OrderService + database (integration)', () => {
  it('persists an order and reads it back', async () => {
    const db = await makeTestDb();            // real, disposable DB
    const service = new OrderService(db);

    const id = await service.create({ item: 'book', price: 100 });
    const stored = await service.findById(id); // round-trips through the DB

    expect(stored.price).toBe(100);
    await db.destroy();                        // reset state between tests
  });
});

// ---------- END-TO-END TEST ----------
// Drives the whole app through a real browser. Slowest, most confidence.
// Playwright style.
import { test, expect as pwExpect } from '@playwright/test';

test('user can log in and reach the dashboard (e2e)', async ({ page }) => {
  await page.goto('https://app.example.com/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Assert on user-visible outcome, not internal DOM structure.
  await pwExpect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

## code.python
```python
# ---------- UNIT TEST ----------
# One pure function, no I/O, runs in ~1ms. pytest style.
from pricing import apply_discount


def test_apply_discount_takes_percentage_off():
    assert apply_discount(100, 0.2) == 80


def test_apply_discount_never_negative():
    assert apply_discount(10, 2) == 0  # clamped at zero


# ---------- INTEGRATION TEST ----------
# Real (test) database via a fixture. Slower: real I/O, real round-trip.
import pytest
from order_service import OrderService
from helpers.test_db import make_test_db


@pytest.fixture
def db():
    conn = make_test_db()   # real, disposable database
    yield conn
    conn.destroy()          # reset state between tests


def test_persists_and_reads_back_order(db):
    service = OrderService(db)
    order_id = service.create(item="book", price=100)
    stored = service.find_by_id(order_id)   # round-trips through the DB
    assert stored.price == 100


# ---------- END-TO-END TEST ----------
# Drives the whole app through a real browser. Slowest, most confidence.
# Playwright for Python style.
from playwright.sync_api import Page, expect


def test_login_reaches_dashboard(page: Page):
    page.goto("https://app.example.com/login")
    page.get_by_label("Email").fill("demo@example.com")
    page.get_by_label("Password").fill("correct-horse")
    page.get_by_role("button", name="Sign in").click()

    # Assert on user-visible outcome, not internal wiring.
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()
```
