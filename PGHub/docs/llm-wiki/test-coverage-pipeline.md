# test-coverage-pipeline

The end-to-end plan for driving 3788 problems to "all good code passes, no bad code passes." Updated as stages land.

## The bar (locked, per user 2026-06-10)

> All good code that matches the required logic passes. No bad code of any kind passes. Ever.

Mechanics:
- **Floor:** ≥50 test cases per problem (hard minimum).
- **Ceiling:** dynamic — some problems need 989, some need 50.
- **3 explained samples** per problem (in description + viz).
- **White-box guarantee:** mutation testing must confirm every plausible-but-wrong code variant fails ≥1 test.

## Stage 1 — bulk-grow procedural

Tool: `scripts/multiply-test-cases.js --all --difficulty X --target 50`. Procedural input generation per param-type tree, graded through Judge0 against the canonical Python, merged into `test_cases`. Idempotent (dedupes by `JSON.stringify(inputs)`).

Status: 3 processes running (Easy/Medium/Hard). Progress slow because Judge0 is the bottleneck. Catalog at ~259/3788 (6.8%) of problems with ≥50 cases at last check.

## Stage 2 — LC scrape

Tool: `scripts/scrape-lc-testcases.js --all`. Pulls LC's `exampleTestcases` GraphQL field for each problem with a `leetcode_url`. Polite rate-limited (2s between requests). Each pulled case is re-graded through Judge0 and merged.

Status: Running. ~431 problems pulled at last check (of 3338 with LC URLs).

## Stage 3 — mutation testing

Tool: `scripts/mutation-test.js --all --augment`. For each problem, generates 15–25 mutation variants of the canonical Python (off-by-one, flipped comparators, dropped edges, etc.) and grades each against the test set. Any mutation that PASSES 100% of tests reveals a gap; the script auto-constructs a counterexample input and appends it to `test_cases`.

Status: Running (PID 2162). Foreground smoke test on `binary-search`: 8/8 mutations caught, 0 gaps. The hard problems will start appearing in the catalog tail.

## Stage 4 — explained_samples

3 worked test cases per problem with prose explanations, rendered in Workspace's Examples panel and the SolutionView viz.

Status: 144/3788 backfilled (3.8%). Schema migration 47 applied, rendering branch added in Workspace.jsx + SolutionView.jsx. Batches 1–6 done. See [`explained-samples-backfill.md`](./explained-samples-backfill.md).

## Stage 5 — verify-prune

Tool: `scripts/verify-prune-tests.js`. For each problem, runs the canonical Python against every existing test case; drops any case where canonical output ≠ stored expected.

Status: Sample done (10 Easy problems, 138/435 = 31.7% would be dropped). Full sweep PID 9453 running but capped at 1000 candidates by PostgREST. **Critical finding:** 75/138 bad cases are from a stored-data bug (Pattern 1 — JSON double-quoting). DO NOT run `--apply` blindly. See [`pattern-1-quoting-bug.md`](./pattern-1-quoting-bug.md).

## Stage 6 — re-audit + publish

Tool: `scripts/refresh-status.mjs`. Re-queries the DB and rewrites the tables in `status.md` with current numbers + delta since last run.

Status: Working. Run after every wave that moves a number.

## Where the work goes next

Priority order based on findings:

1. **Fix Pattern 1** before any `--apply` on verify-prune. Otherwise we delete cases that are salvageable.
2. **Paginate the all-catalog scripts** so they don't cap at 1000.
3. **Continue explained_samples backfill** — fastest dimension to move, agent-friendly, no Judge0 dependency.
4. **Let bulk-grow + mutation-test + LC scrape grind** — they're background processes, just check progress occasionally.
5. **Re-run verify-prune after Pattern 1 fix** to see the corrected bad-case count.

## Scripts inventory

| Script | Stage | Status |
|---|---|---|
| `multiply-test-cases.js` | Stage 1 | working, capped at 1000/page |
| `bulk-grow-test-cases.js` | Stage 1 | works on a fixed list |
| `scrape-lc-testcases.js` | Stage 2 | working |
| `mutation-test.js` | Stage 3 | working, `--augment` flag |
| `backfill-explained-samples-batch<N>.mjs` | Stage 4 | one per batch of 30 |
| `verify-prune-tests.js` | Stage 5 | per-slug; aggregate via wrapper |
| `fix-pattern1-quoting.mjs` | Stage 5 prep | TBD |
| `verify-prune-all-paginated.mjs` | Stage 5 | TBD |
| `refresh-status.mjs` | Stage 6 | working, idempotent |

---
*Last updated: 2026-06-10.*
