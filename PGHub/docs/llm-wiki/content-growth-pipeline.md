# content-growth-pipeline

How to add Learn **concepts** at scale — the wave pattern behind the "world's
learning hub" push (`docs/CONTENT_GROWTH_PLAN.md`). Every new lesson ships with a
registered interactive viz; there are no text-only pages. Read
[`concept-audit-checklist.md`](./concept-audit-checklist.md) first so you don't
duplicate an existing slug.

## The five steps (author → live)

1. **Author** `content/concepts/<slug>.md` — 13-section template + frontmatter.
2. **Build** an interactive viz `src/components/learn/viz/<Name>Viz.jsx` (+ `.css`).
3. **Register** the slug → component in `src/components/learn/interactiveViz.js`
   (**the orchestrator does this centrally — build agents NEVER edit the registry**).
4. **Import** the markdown to Supabase: `node scripts/import-concepts.js --dry`
   then without `--dry`.
5. **Verify**: `npm run build` + `eslint .` (0) + triple-review; `node scripts/verify.js`
   before calling a wave "shippable".

## 1 — The concept markdown

Frontmatter keys (parsed by `scripts/import-concepts.js`'s tiny YAML reader):
`slug`, `module` (must be a valid `PGcode_modules.slug`), `title`, `subtitle`,
`difficulty` (Beginner|Intermediate|Advanced), `position`, `estimatedReadMinutes`,
`prereqs: []`, `relatedProblems: []`, `references: [{title,url}]`, `status: published`.

Body sections are camelCase `## headings` that become keys; `## code.python` /
`code.javascript` / `code.java` / `code.cpp` fenced blocks fill the `code` JSONB.
Hit the CLAUDE.md bars: intuition ≥200w, optimal ≥200w, ≥8-line ASCII **or** a real
viz, ≥4 pitfalls, all 4 languages. Math uses `\(...\)` / `\[...\]` (KaTeX), never
raw backslashes in a `<code>` tag. Reference `content/concepts/loop-detection.md`.

## 2 + 3 — Viz + central registration (collision rule)

Build the viz to the [`viz-component-patterns.md`](./viz-component-patterns.md) bar
(theme tokens, lucide, `viewBox` reflow, real interactivity). Then map the slug:

```js
// in interactiveViz.js (orchestrator only)
import CalcLimitViz from './viz/CalcLimitViz';
// ...
export const INTERACTIVE_VIZ = {
  // ...
  'calc-limits-continuity': CalcLimitViz,   // slug -> component
};
```

`interactiveViz.js` is a **hard collision point** — many import lines + one big
object literal. When fanning out build agents, each agent creates its viz file(s)
only and is told **not to touch `interactiveViz.js`**; the orchestrator adds all
imports + slug entries in one pass after the wave. (Same discipline as
`MLLesson.jsx`'s `VIZ_REGISTRY` — see [`premium-explorer-viz.md`](./premium-explorer-viz.md).)
Aliases are fine: several adjacent slugs can point at one component. An unregistered
slug renders the static walkthrough only (no crash), so always register + build.

## 4 — Insert the module row (before import)

`import-concepts.js` needs the `module` frontmatter to match an existing
`PGcode_modules.slug`. Either ship a migration (idempotent) —

```sql
-- scripts/migrate-NN-<topic>-module.sql
INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES ('calculus', 'Calculus', 'Limits, derivatives, … interactive visuals.', 16, 'TrendingUp')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      position = EXCLUDED.position, icon = EXCLUDED.icon;
```

`supabase db query --linked --file scripts/migrate-NN-*.sql` — or a service-role
upsert from Node:

```js
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
await sb.from('PGcode_modules').upsert(
  { slug: 'calculus', name: 'Calculus', description: '…', position: 16, icon: 'TrendingUp' },
  { onConflict: 'slug' },
);
```

See [`adding-a-learn-module.md`](./adding-a-learn-module.md) for the full new-subject flow.

## 5 — Import + verify

`import-concepts.js` auto-loads `.env` (needs `VITE_SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY`). Run `--dry` first — it validates the parse and
flags an unknown `module` without writing. Then run live, `npm run build`,
`eslint .`, and dispatch two review agents (accuracy + quality-bar). Update the
**Done log** in `docs/CONTENT_GROWTH_PLAN.md`.

## Wave / sprint structure

`docs/CONTENT_GROWTH_PLAN.md` runs waves of 10–15 lessons: parallel sub-agents
(1 lesson or viz each) → orchestrator central-registers + imports → 2 reviewers →
fix → build → next wave. Sprint 1 (Math foundations: calculus + linear algebra +
probability) shipped 16 lessons / 16 viz, taking the catalog to ~502 concepts.

> Gotcha: after many dev-server restarts, stale `node_modules/.vite` throws phantom
> "X is not defined" runtime errors. `rm -rf node_modules/.vite` and restart.

---
*Last updated: 2026-06-27.*
