# PG.Play

A small, hand-built browser arcade. Twenty-one games, no accounts required, instant play.

Live: [pushkalgupta.com/PG.Play/dist/](https://pushkalgupta.com/PG.Play/dist/)

```
21 games  ·  5 originals  ·  1 Mario-style platformer  ·  4 bespoke 3D scenes
38 KB gz first paint  ·  PWA-installable  ·  Hash-routed for any static host
48 tests across catalog + import + jsdom mount
4 Supabase migrations + 3 edge functions for run-validated leaderboards
```

---

## What it is

The site is built around five hand-made originals:

| game | reference | what it is |
|---|---|---|
| **Grudgewood** | trees-hate-you.com | 3D rage platformer. The forest is hostile. |
| **Goalbound** | dvadi.com | 1v1 60-second arcade soccer. |
| **Coil** | slither.io | Snake battle royale (single-player + bots). |
| **SLIPSHOT** | krunker.io | Movement-first FPS score attack. |
| **Bricklands** | classic platformers | Three short worlds. One bouncy hero. |

Plus 16 quieter pieces: 2048, Connect 4, 8-Ball Pool, Cut the Rope, Hoop Shot, Trace, Era Lane, Loft Defense, Short Order, Frost Fight, Night Shift, Arena, Faceplant, Raycaster FPS, Ember & Tide, Swingwire.

The four originals are **clones in spirit, not in code** — none use external assets or iframe-embedded reference games. Bricklands has zero Nintendo art.

---

## Quick start

```sh
git clone <repo>
cd PG.Play
cp .env.example .env.local       # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev                      # dev server at http://localhost:5180/
npm run build                    # full prebuild gauntlet + production build → dist/
npm test                         # vitest run (48 tests)
```

The build is hash-routed (`#/`, `#/game/<id>`) so it works on any static host with no rewrite rules. Deploys to GitHub Pages from the repo's `dist/` subdirectory at `pushkalgupta.com/PG.Play/dist/`.

---

## Deploy

```sh
npm run deploy                   # validates, tests, builds, prints commit + push commands
```

After the script:

```sh
git add -A
git commit -m "deploy: <description>"
git push origin main
```

GitHub Pages picks up the `dist/` directory. The first navigation any returning user makes auto-purges any stale Service Worker from a previous deploy (see `src/main.jsx`).

---

## Catalog discipline

The catalog **cannot silently shrink**. Every `npm run build` runs `scripts/validate-catalog.mjs` first via the `prebuild` script. It fails the build if:

- a `playable: true` game is missing its lazy import in `GameIntro.jsx` PLAYABLE map
- a `playable: true` game is missing its cover in `covers.jsx`
- two games share an id
- the visible catalog drops below `PGPLAY_MIN_CATALOG` (default 12)

If you want a smaller roster, set the env explicitly: `PGPLAY_MIN_CATALOG=4 npm run build`. Otherwise the build refuses — that's the point.

---

## Architecture

```
src/
  pages/
    Home.jsx               Bento lobby, hero, "More games" filter grid, leaderboards, footer
    GamePage.jsx           Routes /game/:id — issues run-token, hands off to GameIntro
  components/
    Card.jsx               Bento tile (hero / standard variants, 3D mouse tilt on hero)
    GameIntro.jsx          Premium per-game lobby (cover + meta + CTAs + leaderboard)
    GameShell.jsx          Immersive in-game wrapper (full-bleed, floating Exit/Pause/FS)
    Leaderboard.jsx        Per-game top-N, glass-medal pills + skeletons
    HomeLeaderboard.jsx    "Top of the boards" panel on home
    SearchPalette.jsx      ⌘K fuzzy command palette
    AuthModal.jsx          Email + Google sign-in
    ProfilePanel.jsx       Profile drawer (display name editor, bests, achievements)
    SettingsDrawer.jsx     Theme + sound + data drawer
    Footer.jsx             Real footer with columns
    Sidebar.jsx            Left nav rail
    Onboarding.jsx         First-visit tip
    ShortcutsModal.jsx     `?` opens platform shortcuts cheat-sheet
    AchievementToast.jsx   Glass landing for unlock events
    ErrorBoundary.jsx      Catches uncaught render errors
    states/                Skeleton, EmptyState, ErrorState, LoadingBar
    three/                 HomeHero3D, per-game ambient scenes
    game-shell/            Toolbar, Overlays
  games/                   Each game is its own component (lazy-loaded).
    grudgewood/            Three.js, modular (engine, world, traps, levels)
    goalbound/             Canvas2D, modular (engine, screens, store)
    SlitherLiteGame.jsx    Coil, Canvas2D, single file
    SlipshotGame.jsx       Three.js, single file
    BricklandsGame.jsx     Side-scrolling platformer, Canvas2D
    Game2048.jsx, Connect4Game.jsx, ...
  hooks/                   useSession, useFavorites, useBests, useAchievements,
                           useLeaderboard, useTheme, useCanRender3D, useDocumentMeta,
                           useRecent
  lib/
    runToken.js            start-run + token cache for score submission
    fuzzyMatch.js           Sublime-style fuzzy scorer for search palette
    coilSkin.js            localStorage + server-mirrored skin pref (Coil)
  util/canvasDpr.js        Fluid + fixed canvas sizing helpers
  data.js                  Game registry — single source of truth
  supabase.js              Client init (throws if env missing)
  scoreBus.js              window CustomEvent('pgplay:score') bus
  styles.css               All app styles (per-game CSS lives next to its game)

supabase/
  migrations/              v1 init → v2 RLS hardening → v3 prefs → v3.1 security_invoker
  functions/
    start-run/             Issues 30-min run tokens for score submission
    submit-score/          Validates JWT + token + score range + rate limit
    leaderboard/           Public top-N read, edge-cached 15s
    _shared/               cors.ts + scoreRules.ts (per-game caps)
```

### Data flow when a player runs a game

1. User opens `#/game/<id>`
2. `GamePage` calls `startRun(id)` — `start-run` edge fn inserts a row in `pgplay_runs`, returns `run_id`
3. `GameIntro` shows cover + leaderboard. Click **Start** → `GameShell` mounts the game
4. Game runs. On end, dispatches `window.dispatchEvent('pgplay:score', { gameId, score, meta })`
5. `App.jsx` listens, calls `useBests.submit` → `submit-score` edge fn with `(game_id, score, run_id, meta)`
6. Edge fn validates: JWT → user; run_id matches user+game, not expired, not consumed; score within `GAME_RULES`; rate limit. Inserts into `pgplay_scores`, marks run consumed
7. `pgplay_leaderboard` view materialises the new row; the leaderboard edge fn picks it up on next read (≤15s cache)

---

## Adding a game

1. **Component** — create `src/games/MyGame.jsx`. On end, `submitScore('myid', score, { time, ...optional })` from `../scoreBus.js`.
2. **Registry** — add an entry to `GAMES` in `src/data.js` with `playable: true`, a category, tagline, story.
3. **Cover** — add an SVG component to `GAME_COVERS` in `src/covers.jsx`. (Or for headline games, drop a 1024×1280 PNG in `assets/source-covers/` and run `npm run optimize:covers` — `PhotoCover` handles WebP responsive variants automatically.)
4. **Lazy import** — register it in `PLAYABLE` in `src/components/GameIntro.jsx`.
5. **Server-side score validation** — add a rule for the new game in `supabase/functions/_shared/scoreRules.ts` with `minScore` / `maxScore` / `maxRunSeconds` / `maxScorePerSecond`. Re-deploy with `supabase functions deploy submit-score`.
6. **Smoke test** — add the lazy importer to `test/games.smoke.test.js` so the suite covers the new game.
7. **Genre accent** — map `cat` → genre in `Card.jsx` and `GameIntro.jsx` if it's a new genre family.
8. **Bento slot** — if the game should be one of the four hero tiles, add its id to `EDITORS_PICKS` in `data.js` and remove an existing one (or expand the bento layout in `styles.css`).

The catalog validator + smoke test will fail if any of 1-6 is missed.

---

## Game contract

Every game module:

- Default-exports a React component
- Accepts an optional `mode` prop (default `null`)
- Internally manages its canvas / RAF lifecycle
- Calls `submitScore(gameId, score, meta)` from `../scoreBus.js` on its natural end state
- Honors mute via `isMuted()` from `../sound.js` if it manages its own AudioContext
- Cleans up listeners / timers / RAFs on unmount

For a fluid canvas, use `sizeCanvasFluid(canvas, parentEl, (cssW, cssH) => ...)` from `../util/canvasDpr.js`. The helper resizes the buffer to the actual `clientWidth × clientHeight × dpr`, observes the parent for changes, and applies the dpr setTransform — your render math runs in CSS pixels.

For spawn-safety, mainstream patterns (already used across the catalog):

- **Action games** with enemies that can hit immediately: 1-1.6s post-spawn invulnerability + visual flash
- **Score-attack games** with a countdown: a `'ready'` state that doesn't tick the timer until first input
- **Level games**: spawn area free of hazards within ~80px

See `ARCADE_AUDIT.md` for the per-game application of these patterns.

---

## Server-side

Supabase project ref `ykpjmvoyatcrlqyqbgfu`. Migrations under `supabase/migrations/`. Edge functions under `supabase/functions/`. Initial setup:

```sh
supabase link --project-ref ykpjmvoyatcrlqyqbgfu
supabase db push
supabase functions deploy start-run submit-score leaderboard
```

The `pgplay_scores` table has **no client-write RLS** — all writes route through the `submit-score` edge function (service role). Views are `WITH (security_invoker = true)` so reads respect caller's RLS.

Database tables:

```
pgplay_profiles      — user_id, display_name, color, prefs (jsonb)
pgplay_favorites     — user_id × game_id
pgplay_scores        — user_id, game_id, score, meta (jsonb), run_id, created_at
pgplay_runs          — server-issued run tokens with TTL
pgplay_achievements  — user_id × achievement
```

Views (all SECURITY INVOKER):

```
pgplay_best                       — max(score) per (user_id, game_id)
pgplay_leaderboard                — top scorer name + score per game
pgplay_recent_submission_count    — rate-limit signal for submit-score
```

---

## Sound

`src/sound.js` is the single source of truth for procedural sfx. Adding a per-game cue is a single object entry; mute is enforced by `isMuted()` short-circuits inside each cue. Games with their own AudioContext (Slipshot, Swingwire, Grudgewood) call `isMuted()` themselves to honor the platform mute toggle.

Available cues today: `click hover open confirm win lose achievement shot kick bounce goal whistle save axeReveal error pellet coin stomp reload branchCreak cheer star`.

---

## Stack

- Vite 5 · React 18 · React Router 7 (HashRouter)
- framer-motion for the motion system
- @react-three/fiber 8 + three for the 3D scenes (lazy-loaded)
- Supabase JS for auth + data + edge function invocation
- vitest 3 + jsdom for tests

Bundle splits into 5 cacheable chunks: `index` (38 KB gz), `motion` (43 KB gz), `router` (58 KB gz), `supabase` (52 KB gz), `react-three-fiber` (44 KB gz, lazy). Three.js (190 KB gz) lazy-loads only on routes that mount 3D.

---

## Documentation map

- [`ARCADE_AUDIT.md`](./ARCADE_AUDIT.md) — full audit per the senior-engineer brief: product overview, technical architecture, UX/visual audit, **per-game QA table**, prioritized action plan, **user-reported issues resolved**, manual QA checklist, future expansion ideas.
- [`README.md`](./README.md) — this file. Architecture, deploy, contract, conventions.
- The catalog validator (`scripts/validate-catalog.mjs`) is itself documentation: it lists every required field, every required wiring point, and every constraint that must hold.

---

## References

The four originals are clones in spirit, not in code, of:

- `trees-hate-you.com` (Grudgewood)
- `dvadi.com` (Goalbound)
- `slither.io` (Coil)
- `krunker.io` (SLIPSHOT)

Bricklands is original work inspired by classic side-scroll platformers without using any copyrighted Nintendo art or audio.

The site does not iframe-embed any external games.

---

## Built by

[Pushkal Gupta](https://pushkalgupta.com).
