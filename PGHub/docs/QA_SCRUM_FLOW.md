# QA Scrum Flow

The standing QA orchestration for PGHub. The main loop acts as **Scrum Master**:
it keeps the backlog populated with identifier sweeps and drains it through fixed
role-based teams. **Run a cycle whenever `QA_BACKLOG.md` is non-empty.**

## Roles

- **Scrum Master** (main loop) — owns `QA_BACKLOG.md`, runs identifier sweeps,
  assigns each backlog item to a team, merges results, re-prioritises, never
  lets the backlog sit idle.
- **Identifier** — read-only sweep of an assigned area (a route / component
  family). Emits backlog items: `{id, area, severity P0|P1|P2, title, file, repro, expected}`.
  Several run in parallel, each blind to the others (multi-modal: by-route,
  by-renderer, by-data-flow, by-theme, by-responsive-width).
- **Fixer** — implements the fix for one item on its file(s).
- **Runner** — runs `npm run lint` + `npm run build` (and any targeted check),
  reports pass/fail with output. A failure bounces the item back to the Fixer.
- **Verifier** — confirms the fix actually resolves the reported repro (reasons
  through the changed code against the `expected`).
- **Reviewer** — quality-bar pass: theme tokens (no hardcoded color), no emoji,
  no inner scrollbars, no empty space, voice rules, hook ordering.
- **UI agent** — renders/inspects the surface (screenshot harness or DOM probe)
  to confirm the visual result matches intent.
- **QA-Verifier ×2** — two independent final sign-offs; an item is **Done** only
  when both pass. Disagreement → back to Fixer with the dissent noted.

## Pipeline (per backlog item)

```
Identify → Fix → Run → Verify → Review → UI → QA-Verify×2 → Done
                  �‾‾‾‾‾‾‾‾‾‾‾‾ any failure bounces to Fix ‾‾‾‾‾‾‾‾‾‾‾‾↾
```

Items flow independently (pipeline, not barrier) — item A can be in Review while
item B is still being Fixed. Non-overlapping files are assigned to concurrent
teams; collisions on shared files (Workspace, MLLesson, queries.js, theme.css)
are serialised by the Scrum Master.

## Backlog format (`QA_BACKLOG.md`)

```
- [ ] P0 <id> — <title> · file:`<path>` · repro: <how> · expect: <what>
- [x] P1 <id> — <title>  (Done: <one-line resolution>)
```

`P0` = wrong output / crash / data loss / shippability blocker (drop everything).
`P1` = broken UX / visible defect. `P2` = polish.

## Cadence

1. If `QA_BACKLOG.md` has open items → drain them through teams first.
2. When the backlog empties → run an identifier sweep to refill it.
3. Repeat. The backlog is never intentionally left at zero while the platform
   has un-audited surfaces.

Implemented as the re-runnable `qa-scrum` workflow (`docs/workflows/qa-scrum.js`).
