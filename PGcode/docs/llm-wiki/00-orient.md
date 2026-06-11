# 00 · Orient

If you're a coding agent landing in this repo, read this page first. It's 60 seconds. It points you at the right wiki page for what you're about to do.

## What is this repo?

PGcode — a DSA / interview-prep / ML-DL-AI learning platform. ~3800 problems with graded test cases, ~440 concept references, ~150 ML lessons, ~100 interactive SVG viz components, three in-browser code playgrounds (Python via Judge0, Web HTML/CSS/JS, SQL via sql.js).

## What you should read by task

| If you're about to… | Read |
|---|---|
| Write a new SVG viz component (DSA or ML) | [`viz-component-patterns.md`](./viz-component-patterns.md), [`scrollbar-rule.md`](./scrollbar-rule.md) |
| Edit `src/content/mlContent.js` | [`large-file-edit-strategy.md`](./large-file-edit-strategy.md) **before you touch it** |
| Add a new `content/concepts/*.md` | [`concept-audit-checklist.md`](./concept-audit-checklist.md) |
| Backfill `explained_samples` for a batch of problems | [`explained-samples-backfill.md`](./explained-samples-backfill.md) |
| Run any Judge0 work or launch a background script | [`judge0-and-backgrounds.md`](./judge0-and-backgrounds.md) |
| Modify any CSS at all | [`scrollbar-rule.md`](./scrollbar-rule.md) — single hardest rule in the repo |
| Dispatch parallel sub-agents | [`agent-dispatch-recipes.md`](./agent-dispatch-recipes.md) |
| Touch test cases or canonical solutions | [`test-coverage-pipeline.md`](./test-coverage-pipeline.md), [`pattern-1-quoting-bug.md`](./pattern-1-quoting-bug.md) |

## Constraints you cannot override

- `CLAUDE.md` at repo root has hard rules. They beat best-practice intuition every time. Re-read them when in doubt.
- Workspace.jsx, RoadmapView.jsx, dryrun/DryRunViewer.jsx, and the roadmap `TopicNode.*` files are **user-protected**. Do not refactor without explicit ask.
- The user runs `git commit` / `git push`. Never do it without explicit ask.
- The user hates inner scrollbars more than anything. See [`scrollbar-rule.md`](./scrollbar-rule.md).

## The stage 1–6 mental model for test coverage

The biggest ongoing work is driving all 3788 problems to ≥50 verified test cases. The pipeline:

1. **Stage 1 — bulk-grow** (`scripts/multiply-test-cases.js`): procedurally generate inputs, grade through Judge0, merge.
2. **Stage 2 — LC scrape** (`scripts/scrape-lc-testcases.js`): pull LC's own samples for parity.
3. **Stage 3 — mutation testing** (`scripts/mutation-test.js --augment`): plant code mutations; any mutation that passes 100% of tests reveals a gap; counterexample gets appended.
4. **Stage 4 — explained_samples**: 3 worked test cases per problem with prose explanations.
5. **Stage 5 — verify-prune** (`scripts/verify-prune-tests.js`): drop test cases where canonical disagrees with stored expected.
6. **Stage 6 — re-audit & publish** (`scripts/refresh-status.mjs`): rewrite the tables in `status.md`.

See [`test-coverage-pipeline.md`](./test-coverage-pipeline.md) for which stage to attack next.

## When you finish work

Update `status.md` if your work moved one of the numbers. The script does this for you: `node scripts/refresh-status.mjs`.
