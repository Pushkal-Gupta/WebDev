# Era Siege — Deployment Plan

## Host context
PG.Play deploys to GitHub Pages at
`https://pushkalgupta.com/PG.Play/dist/`. The build is hash-routed
(`#/`, `#/game/<id>`) so every URL works on a static host without
rewrite rules. Era Siege inherits this — no infrastructure changes.

## Bundle integration
- Era Siege is **lazy-loaded** by `src/components/GameIntro.jsx` via
  the existing `PLAYABLE.aow` entry. The chunk is fetched only when the
  player lands on the Era Siege intro page.
- Vite's automatic code-splitting puts the entire `era-siege/` tree
  into one chunk per the existing `manualChunks` config (no special
  case needed).
- Chunk size budget: **<35 KB gzipped** for sim+HUD+content+renderer.

## Cache headers (GitHub Pages convention, already in place)
- `dist/index.html`: short cache (browser default).
- Hashed JS/CSS: max-age=31536000 immutable (Vite-emitted, GH Pages
  serves with the right headers via the existing setup).
- The PWA service worker in `src/main.jsx` auto-purges on stale hash
  detection — Era Siege benefits automatically.

## Compression
- GH Pages serves gzip and brotli automatically.
- No raster assets ship in v1; if v2 adds sprites:
  - Sprite atlases packed via a build script (not implemented v1).
  - WebP for sprites, OGG for audio.
  - Lazy-load era 4–5 atlases until era 3 is reached.

## Deployment commands (existing PG.Play flow)
```sh
npm run validate:catalog   # confirms aow has cover + lazy import + entry
npm test                   # runs vitest including Era Siege sim tests
npm run build              # vite build → dist/
git add -A
git commit -m "feat(era-siege): production rebuild over Era Lane"
git push origin main
# GitHub Pages picks up dist/ on the configured branch
```

The existing prebuild script is unchanged. Era Siege passes through it
unchanged because it stays under id `aow`.

## Optional backend (not shipping v1)
The brief asks for a backend schema proposal even when not shipping.
PG.Play already has Supabase (`ykpjmvoyatcrlqyqbgfu`). Era Siege's
score submission flows through the existing
`pgplay_runs` / `pgplay_scores` infrastructure under the existing
`aow` rule (see `supabase/functions/_shared/scoreRules.ts:34`).

The schema below is **reserved** for future Era-Siege-specific
features (challenges, leaderboards by difficulty, content versioning).

### Future tables (none added v1)
```sql
-- A challenge seed of the day; the client uses the seed to deterministically
-- replay the same enemy AI rolls.
create table era_siege_daily_challenge (
  id            bigserial primary key,
  challenge_date date not null unique,
  seed          bigint not null,
  modifier_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- Versions of the balance/content payload, so a client can detect a stale
-- session and warn the player when leaderboard rules change.
create table era_siege_content_versions (
  id           bigserial primary key,
  version      text not null unique,
  manifest_json jsonb not null,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- A live-tunable balance overlay that production can ship without a deploy.
-- The client merges the active row over the static balance.js values.
create table era_siege_balance_overrides (
  id           bigserial primary key,
  version      text not null unique,
  overrides_json jsonb not null,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Per-difficulty score tracking, mirroring pgplay_scores but with difficulty.
create table era_siege_scores (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  score        int not null check (score between 0 and 100),
  difficulty   text not null check (difficulty in ('skirmish','standard','conquest')),
  era          int not null check (era between 1 and 5),
  time_sec     int not null,
  meta         jsonb not null default '{}'::jsonb,
  run_id       uuid references pgplay_runs(id),
  created_at   timestamptz not null default now()
);
create index on era_siege_scores (difficulty, score desc, created_at);
```

### Future edge functions (none added v1)
- `GET /api/era-siege/daily-seed` — returns today's seed + modifiers.
- `GET /api/era-siege/content-manifest` — returns active content
  version + active balance overrides.
- `POST /api/era-siege/score` — wraps the existing `submit-score`
  contract, accepts a `difficulty` field, validates against a
  per-difficulty score cap (skirmish: 80, standard: 100, conquest: 100).

These remain **proposals**. Era Siege v1 reuses the existing
`submitScore('aow', score, meta)` path and the existing
`pgplay_scores` row.

## Rollout plan
1. Merge to `main`.
2. `npm run deploy` (existing script) builds & verifies.
3. Push to `main` — GH Pages picks up `dist/`.
4. The site's stale-SW purge ensures returning visitors get the new
   chunk on their next navigation.
5. Smoke-check the live URL in desktop + mobile.
6. Watch the existing `aow` leaderboard for plausible scores. The
   maxScore (100) and maxRunSeconds (3600) supabase rule continues to
   gate cooked submissions.

## Rollback
If a release breaks Era Siege, revert the merge commit and re-run
`npm run deploy`. Era Lane's old code path is preserved in git history;
restoring it is a `git revert` away. No data migration required —
scores are forward-compatible (same id, same score range).
