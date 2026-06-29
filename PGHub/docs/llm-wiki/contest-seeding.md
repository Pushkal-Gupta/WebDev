# contest-seeding

How PGArena **internal** contests are seeded. These are virtual contests built from
our own problem catalog (a curated set of problems + points + a clock) — separate
from the *external* contest aggregation (`PGcode_external_contests`, the
LeetCode/Codeforces/AtCoder calendar). Don't conflate the two; see
[`entranthub-visualgo-integration.md`](./entranthub-visualgo-integration.md).

## Tables

- **`PGcode_contests`** — one row per contest. Columns used by the seeders:
  `slug` (unique key), `name`, `description`, `duration_minutes`, `starts_at`,
  `ends_at`, `difficulty` (Beginner|Intermediate|Advanced|Mixed), `is_featured`,
  `position`.
- **`PGcode_contest_problems`** — join table: `contest_slug`, `problem_id`,
  `position`, `points`. Unique on `(contest_slug, problem_id)`.
- `PGcode_user_contest_attempts` — per-user attempt state (started/finished),
  written by `ContestDetail.jsx`. Not touched by seeders.

## The seeder pattern (`scripts/seed-contests-batch*.js`)

Each batch is idempotent: deterministic problem pick + upsert on `slug`. Re-running
yields the same contest. Shape of one contest spec:

```js
{ slug: 'dp-gauntlet', name: 'DP Gauntlet', description: '…',
  duration_minutes: 150, difficulty: 'Advanced', is_featured: true,
  position: 13, pickN: 24, topics: ['dp','2d-dp'], difficulties: ['Easy','Medium','Hard'] }
```

Flow per contest:

1. `idsBy(topics, difficulties)` — query `PGcode_problems` for ids in those
   `topic_id`s + `difficulty`s, filtered to `method_name IS NOT NULL` (gradable only).
2. `pick(candidates, pickN, salt=slug)` — **deterministic** Fisher-Yates seeded from
   the slug string (not `Math.random`), so the same problems are chosen every run.
3. `pointMap(chosen)` — points by difficulty: `{ Easy:100, Medium:250, Hard:450 }`.
4. Upsert the contest row (`onConflict: 'slug'`), `starts_at = now`,
   `ends_at = now + 60 days`.
5. Upsert link rows into `PGcode_contest_problems` (`onConflict: 'contest_slug,problem_id'`),
   each with `position` and `points`.

Env: auto-loads `.env`; needs `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
Run: `node scripts/seed-contests-batch3.js`.

## The valid `topic_id` values (22)

Topics referenced across the batches — use only these when adding a contest, or
`idsBy` returns no candidates:

```
arrays  strings  two-pointers  sliding-window  binary-search  stack  queue
linkedlist  trees  tries  heap  graphs  advanced-graphs  greedy  intervals
backtracking  recursion  dp  2d-dp  bit-manipulation  math  geometry
```

A spec can list several topics; difficulties can narrow the pool
(`['Medium','Hard']`, `['Easy']`, or all three).

## How contests render

- **`/contests`** → `ContestsIndex.jsx` reads `useContests()` (queries
  `PGcode_contests` ordered by `position`) and lays them out via
  `ContestsGalleryGrid.jsx`. The external calendar + LeetCode analytics live in
  sibling tabs (`ExternalContestsCalendar.jsx`, `LeetCodeAnalytics.jsx`).
- **`/contests/:slug`** → `ContestDetail.jsx` reads the contest row +
  `PGcode_contest_problems` (`useContest(slug)`, `useContestProblems(slug)` in
  `queries.js`) and tracks attempts in `PGcode_user_contest_attempts`.

## Adding a batch

1. Copy `seed-contests-batch3.js`, bump the file number, add contest specs with
   unused `slug`s and `position`s past the current max.
2. Keep `topics` within the 22 above; set sensible `pickN`/`duration_minutes`.
3. `node scripts/seed-contests-batchN.js`, then load `/contests` to confirm they
   appear and open.

> Idempotency note: changing a contest's `topics`/`pickN` and re-running re-picks
> (salt is the slug, so the pick is stable per slug but the candidate pool changed).
> Stale links aren't auto-deleted — the upsert only adds/updates. Prune manually if
> you shrink a contest.

---
*Last updated: 2026-06-27.*
