# agent-dispatch-recipes

What works and what doesn't when dispatching parallel sub-agents in this repo. Synthesized from 13 waves of agent fanout.

## The fundamental rule

**Agents must touch DISJOINT files.** Two agents editing `MLLesson.jsx` in parallel will produce one corrupted file. Always plan the file footprint before dispatching.

## Wave templates that have worked

### Template A — file-disjoint fanout (5 agents)

| Agent | Files touched |
|---|---|
| New ML viz component | `src/components/ml/viz/<Name>Viz.jsx`, `src/components/ml/MLLesson.jsx` (import + registry only) |
| New DSA viz component | `src/components/learn/viz/<Name>Viz.{jsx,css}` only |
| New concept | `content/concepts/<slug>.md` only |
| Explained-samples backfill | `scripts/backfill-explained-samples-batch<N>.mjs` only |
| Script: lint cleanup / audit | `scripts/*.mjs` only |

This is the safest pattern. Five agents, zero file collisions, ~80% landing rate.

### Template B — write the script, not the data

For any task that processes 10+ data items (problems, concepts, etc.): tell the agent to write a hardcoded-PAYLOAD script and run it. Don't ask the agent to edit individual rows in a giant file. See [`large-file-edit-strategy.md`](./large-file-edit-strategy.md).

### Template C — background sweep + foreground sample

For long-running operations (verify-prune sweep, mutation test, bulk-grow): the agent runs ONE problem in foreground (to confirm the tooling works + collect timing), then `nohup ... &` launches the full sweep in background. Reports back the PID + ETA without blocking.

See [`judge0-and-backgrounds.md`](./judge0-and-backgrounds.md).

## Anti-patterns (DO NOT)

### Don't fan out two agents on the same data file

Three agents in Wave 6 all tried to add lessons to `mlContent.js`. All three stalled. Even when they don't stall, the last writer wins and the others' work is silently lost.

### Don't dispatch 5 agents that all run Judge0 at once

The Supabase Edge Function `run-code` is the bottleneck. 3+ concurrent Judge0-heavy agents share the same backend; throughput drops to 1/3rd or worse. Better to run them sequentially. The exception is background scripts at low QPS (multiply-test-cases, scrape-lc-testcases) — those self-rate-limit.

### Don't trust agent reports without verifying

Agents have claimed "build clean, all tests pass" while leaving the build broken. After every wave, check:

```bash
npm run build 2>&1 | tail -3
ls <expected-output-files>
node scripts/refresh-status.mjs  # confirms DB-touching work actually moved numbers
```

### Don't dispatch agents during session-limit windows

Anthropic session limits reset at midnight local time. If you're close to the limit, dispatched agents will die mid-run with `You've hit your session limit · resets…` — same as a stall. Schedule a 3600s heartbeat to bridge the gap; resume after reset.

## Prompts that produce good agents

- **Lead with constraints**, not goals. "No emoji. No `overflow: auto`. Theme tokens only. Lucide icons only." — these go first, before the build description.
- **Cite specific reference files.** "See `RabinKarpViz.css` for class-name convention." Half the lint issues disappear when an agent has a concrete file to mirror.
- **Set the wall time budget.** "After 3 files, run `npm run build`." Otherwise agents do all their writes and only check at the end, then can't unwind broken state.
- **Tell them when to stop.** "Don't try to be clever about `viz_anchor`. Leave it null." Without this, agents will spend 200s drift-thinking about an optional field.

## After every wave

1. Check actual build state — never just trust the report.
2. Update `status.md` with `node scripts/refresh-status.mjs`.
3. Move the wave's task to `[completed]` in TaskList.
4. Create the next wave's task BEFORE dispatching so the heartbeat picks it up.

---
*Last updated: 2026-06-10 — 13 waves of fanout observed.*
