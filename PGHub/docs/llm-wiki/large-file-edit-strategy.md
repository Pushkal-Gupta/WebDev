# large-file-edit-strategy

**Stakes:** `src/content/mlContent.js` is ~7,000 lines. Three separate agent waves stalled trying to insert new lessons into it. Two more died on `src/content/problemContent.js` (~280,000 lines). This is the single most common reason a dispatched agent goes silent.

## The failure mode (observed)

Agent reads the file, tries to insert a 200-line lesson between two existing lessons, plans a multi-edit sequence — and never writes anything. The session watchdog kills it at 600s. Result: no file change, no progress, just a dead agent.

Both `mlContent.js` and `problemContent.js` are big enough that:

- Loading the file into context eats 10–25% of the agent's budget.
- Planning an insertion in plain prose takes a long time.
- The Edit tool then fails because the agent's `old_string` doesn't match — too much context drift between read and edit.

## What works

**1. Use a script, not an Edit.** For RICH_CONTENT or PAYLOAD-style data, write a small `scripts/push-X.mjs` that appends inline. Don't try to edit the giant file in place.

```js
// scripts/push-rich-content.js style:
const ROWS = { 'two-sum': {...}, 'three-sum': {...} };
for (const [slug, row] of Object.entries(ROWS)) {
  await sb.from('PGcode_problems').update({ ... }).eq('id', slug);
}
```

**2. For mlContent.js specifically — DON'T have agents write lessons into it.** Build the viz component as a separate file, register it in `MLLesson.jsx`'s `VIZ_REGISTRY`, and let the human author wire the lesson text by hand later. Three waves have proved this is faster.

**3. If you MUST edit the big file, use a single targeted Edit with tight `old_string` context.** Two specific lines as the anchor, not 20. The smaller the anchor, the less the agent can drift.

**4. Single Write per insertion.** If you're inserting a lesson, plan the entire lesson object as one JS literal, then do ONE Edit that places it at the boundary. Never sequence multiple Edits inside the file.

## Files known to trigger this

- `src/content/mlContent.js` — 7k lines (stalls confirmed Wave 6, Wave 11)
- `src/content/problemContent.js` — 280k lines (stalls confirmed Wave 6)
- `src/content/courses.js` — 7.6k lines (one stall observed; smaller items work)
- `src/content/dsaTutorial.js` — 3.2k lines (works most of the time)
- `src/components/Workspace.jsx` — 1.3k lines but user-protected, don't touch anyway

## When the stall happens anyway

It looked like progress, the agent reported "I'll insert at line N…" and never wrote. Check:

```
ls /tmp/<agent-id>.output
grep "wrote\|edited\|applied" the.log
```

If no actual write happened, redispatch with a tighter scope — usually splitting the work into 2 agents (one for the script, one for the registry edit) recovers cleanly.

---
*Last updated: 2026-06-10 — pattern observed across waves 6, 11, 13.*
