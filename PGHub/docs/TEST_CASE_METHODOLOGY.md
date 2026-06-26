# Test-case quality methodology — how we guarantee correct code passes and wrong code fails

This is the process PGcode uses to make its auto-grader **trustworthy**: for every problem, a
correct submission is accepted and an incorrect one is rejected. We do not chase a fixed
test-case count — a problem gets **as many cases as it needs** (some need 30, some need 800),
decided by objective coverage signals, not a round number.

## The bar

For a problem to be "graded-trustworthy":
1. **Soundness** — the canonical solution passes every stored case (no false negatives: correct code is never wrongly rejected).
2. **Adequacy** — the case set distinguishes the canonical from *every* plausible wrong solution (no false positives: wrong code is never wrongly accepted).
3. **Self-consistency** — every case's `expected` was produced by the canonical itself, so the oracle and the cases can never disagree.

A fixed "50 cases" target is a floor, not the goal. Adequacy is the goal.

## The pipeline (per problem)

Everything runs against Judge0 (self-hosted for unlimited throughput — see
[`JUDGE0_SELF_HOST.md`](./JUDGE0_SELF_HOST.md)). The canonical Python solution is the single
source of truth (the **oracle**).

### 1. Oracle verification (soundness gate)
The canonical solution is compiled and run against the problem's existing cases. If it fails
any case, that case is **pruned** (bad `expected` / malformed `inputs`) — never patched around.
`scripts/verify-prune-tests.js` / `verify-prune-all-paginated.mjs`.

### 2. Case generation with input-domain coverage
Inputs are generated to exercise the problem's input space deterministically, not randomly:
- **Boundaries**: empty, single element, all-equal, min/max length.
- **Numeric edges**: negatives, zero, `int32` bounds, off-by-one neighbours.
- **Structural**: sorted / reverse-sorted / duplicates / adversarial sequences for the pattern.
- **Domain-specific**: for strings — binary/digit/paren/unicode charsets; for graphs — cycles, disconnected, self-loops; for trees — skewed, balanced, single-node.

Each generated input is run through the oracle to produce its `expected` (so cases are correct
by construction). `scripts/bulk-grow-test-cases.js` with the **verify gate**: a freshly generated
case is re-graded against the canonical and dropped on any mismatch.

### 3. Branch / path coverage
A case set that never takes a branch can't catch a bug on that branch. We instrument the
canonical (Python `sys.settrace` / branch counting) and require the case set to **hit every
branch and both sides of every conditional** in the canonical. Uncovered branches drive
generation of inputs that reach them. (Target: 100% branch coverage of the canonical; loops
covered at 0/1/many iterations.)

### 4. Mutation testing (adequacy gate — the core guarantee)
This is what makes "wrong code fails" objective. We generate **mutants** of the canonical —
small, semantically-meaningful wrong variants — and run each against the case set:
- **Mutation operators**: relational (`<`↔`<=`, `>`↔`>=`), arithmetic (`+`↔`-`, `*`↔`//`),
  boundary (`n`↔`n-1`, `n+1`), off-by-one in ranges/indices, boolean (`and`↔`or`, negate),
  return-value tweaks, dropped/duplicated steps, `==`↔`!=`, constant perturbation.
- A mutant that the case set **rejects** (produces a different output on at least one case) is
  **killed** — good, the suite caught that bug class.
- A mutant that **survives** (passes every case) is a hole: the suite would let an equivalent
  wrong submission through. We synthesize an input that distinguishes canonical from the surviving
  mutant and **add it as a new case**, then re-run.
- We iterate until the **mutation score = 100%** (every non-equivalent mutant killed), or flag
  genuinely-equivalent mutants (rare) for manual note.

The number of cases a problem ends with is **whatever it takes to reach mutation score 100% with
full branch coverage** — that is the per-question "proper amount". Branchy / numeric problems
need many; a one-line problem needs few.

### 5. Regression
On any change to a problem (new cases, edited canonical, schema change), steps 1, 3, 4 re-run.
The canonical must still pass (no regression in soundness) and the mutation score must stay 100%
(no regression in adequacy). The watchdogs (`grow-watchdog.sh`) loop this continuously so coverage
only ever ratchets up.

## Why this catches real wrong submissions

A user's wrong submission is, in effect, an unseen mutant. If our mutation suite kills every
small mutation of the canonical AND covers every branch, then a wrong submission has to differ
from the canonical on some input we've already covered → it fails at least one case. The residual
risk is a wrong solution that differs from the canonical *only* on inputs no mutant exercised;
branch coverage + boundary/adversarial generation shrink that to near-zero.

## Adaptive sizing, not a fixed 50

| Problem shape | Typical cases to reach 100% mutation score |
|---|---|
| One-pass scalar (e.g. sum parity) | ~30–60 |
| Multi-branch / DP / greedy | ~80–300 |
| Graph / tree / heavy edge cases | ~300–800+ |

The drive **does not stop at 50** — it keeps generating until the adequacy + coverage gates pass
for that specific problem.

## Infrastructure

- **Judge0** — code execution + grading oracle. Self-hosted via Docker/colima for unlimited
  submissions (the public CE rate-limits and would make mutation testing infeasible). See
  [`JUDGE0_SELF_HOST.md`](./JUDGE0_SELF_HOST.md).
- **Scripts**: `bulk-grow-test-cases.js` (generate + verify-gate), `verify-prune-*` (soundness),
  `mutation-test.mjs` (adequacy — generate/kill mutants), the `*-watchdog.sh` loops (continuous
  regression), `audit-solutions.mjs` / `refresh-status.mjs` (coverage reporting).

## How the work is run (the "scrum")

The drive is executed as structured agent sprints, each with explicit roles so quality is owned,
not assumed:
- **Generators** — produce candidate inputs / canonicals for a disjoint slice of problems.
- **Verifiers (mutation + coverage)** — run the adequacy/coverage gates; a finding is a surviving
  mutant or an uncovered branch, reported with the exact distinguishing input to add.
- **Reviewers** — independent pass on a sample: confirm the canonical is genuinely correct (not
  just self-consistent), spot equivalent-mutant false alarms, enforce house bars.
- **Orchestrator** — partitions work into non-colliding slices, merges results, re-audits after
  each sprint, and never lets the queue go empty (the watchdogs are the standing background sprint).

Progress is tracked in the task list and `STATUS.md` (live coverage numbers, Δ per refresh).
