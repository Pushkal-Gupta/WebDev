# PG.Play

A boutique browser arcade. Four hand-built originals, two quiet classics.

- **Grudgewood** — 3D rage platformer. The forest is hostile.
- **Goalbound** — 1v1 arcade soccer.
- **Coil** — slither.io-style snake battle royale (single-player vs bots).
- **SLIPSHOT** — krunker-style FPS score attack.
- **2048**, **Connect 4** — classics.

Live at `pushkalgupta.com/PG.Play/`.

---

## Run

```sh
cp .env.example .env.local        # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev                       # http://localhost:5180/
npm run build                     # static build → dist/
```

Build is hash-routed (`#/`, `#/game/<id>`) so it works on any static host with no rewrite rules.

---

## Architecture

```
src/
  pages/                  Routes
    Home.jsx              Bento lobby, search trigger, hero, leaderboards
    GamePage.jsx          /game/:id — issues run-token, hands off to GameIntro
  components/
    Card.jsx              Bento tile (hero / standard variants, 3D tilt)
    GameIntro.jsx         Premium per-game lobby (cover + meta + CTAs + leaderboard)
    GameShell.jsx         Immersive in-game wrapper (full-bleed, floating Exit/Pause/FS)
    Leaderboard.jsx       Top-N for one game (glass, medals, stagger, skeletons)
    HomeLeaderboard.jsx   "Top of the boards" panel (one row per game)
    SearchPalette.jsx     ⌘K command palette with fuzzy match
    AuthModal.jsx         Email/Google sign-in
    ProfilePanel.jsx      User profile + bests + achievements drawer
    SettingsDrawer.jsx    Theme / sound / data drawer
    Footer.jsx            Real footer with columns
    Sidebar.jsx           Left nav rail
    ErrorBoundary.jsx     Catches uncaught render errors
    states/               Skeleton, EmptyState, ErrorState, LoadingBar
    three/                HomeHero3D, GameAmbient (lazy r3f scenes)
    game-shell/           Toolbar, Overlays (pause/help/end)
  games/                  Each game is its own component (lazy-loaded).
    grudgewood/           Three.js, modular (engine, world, traps, levels)
    goalbound/            Canvas2D, modular (engine, screens, store)
    SlitherLiteGame.jsx   Canvas2D, single file
    SlipshotGame.jsx      Three.js, single file
    Game2048.jsx, Connect4Game.jsx, ...
  hooks/                  useSession, useFavorites, useBests, useAchievements,
                          useLeaderboard, useTheme, useCanRender3D, useSession
  lib/
    runToken.js           start-run + token cache for score submission
    fuzzyMatch.js         Sublime-style fuzzy scorer for search
  data.js                 Game registry (only `playable: true` shows on home)
  supabase.js             Client init (throws if env missing)
  scoreBus.js             window CustomEvent('pgplay:score') bus
  styles.css              All app styles (per-game CSS lives next to each game)
supabase/
  migrations/             v1 init + v2 hardening (run-tokens, RLS lock-down)
  functions/
    start-run/            Issues 30-min run tokens for score submission
    submit-score/         Validates JWT + token + score range + rate limit
    leaderboard/           Public top-N read, edge-cached 15s
    _shared/              cors.ts + scoreRules.ts (per-game score caps)
```

### Data flow when a player runs Grudgewood

1. User opens `#/game/grudgewood`.
2. `GamePage` calls `startRun('grudgewood')` → edge function inserts a row in `pgplay_runs` and returns `run_id`.
3. `GameIntro` shows cover + leaderboard. Click **Start** → `GameShell` mounts the game.
4. Game runs; on death/end it dispatches `window.dispatchEvent('pgplay:score', { gameId, score, meta })`.
5. `App.jsx` listens, calls `useBests.submit` → `submit-score` edge function with `(game_id, score, run_id, meta)`.
6. Edge function validates: JWT → user; run_id matches user+game, not expired, not consumed; score within `GAME_RULES`; rate limit. Inserts into `pgplay_scores`, marks run consumed.
7. `pgplay_leaderboard` view materializes the new row; the leaderboard edge function picks it up on next read (≤15s cache).

---

## Catalog discipline

The catalog **cannot silently shrink**. Every `npm run build` runs `scripts/validate-catalog.mjs` first (via the `prebuild` script in `package.json`). It fails the build if:

- a `playable: true` game is missing its lazy import in `GameIntro.jsx` PLAYABLE map
- a `playable: true` game is missing its cover in `covers.jsx`
- two games share an id
- the visible catalog drops below `PGPLAY_MIN_CATALOG` (default 12)

If you want a smaller roster, set the env var explicitly: `PGPLAY_MIN_CATALOG=4 npm run build`. Otherwise the build fails — that's the point.

Run the validator any time:

```sh
npm run validate:catalog
```

The validator is intentionally noisy on purpose: when something falls off the catalog (a thumbnail goes missing, a slug gets renamed, a game gets accidentally hidden), the build is the signal. There is no "looks fine on my machine" path that ships a half-empty arcade.

---

## Adding a game

1. **Component**: create `src/games/MyGame.jsx`. On end, dispatch `submitScore('myid', score, { time, ...optional })` from `src/scoreBus.js`.
2. **Registry**: add an entry to `GAMES` in `src/data.js` with `playable: true`, a category, tagline, story.
3. **Cover**: add an SVG component to `GAME_COVERS` in `src/covers.jsx`.
4. **Lazy import**: register it in `PLAYABLE` in `src/components/GameIntro.jsx`.
5. **Server-side score validation**: add a rule for the new game in `supabase/functions/_shared/scoreRules.ts` with `minScore` / `maxScore` / `maxRunSeconds` / `maxScorePerSecond`. Re-deploy the function.
6. **Genre accent** (optional): map `cat` → genre in `Card.jsx` and `GameIntro.jsx` if it's a new genre family.
7. **Bento slot**: if the game should be one of the four hero tiles, add its id to `EDITORS_PICKS` in `data.js` and remove an existing one (or expand the bento layout in `styles.css`).

---

## Server-side

Supabase project ref `ykpjmvoyatcrlqyqbgfu`. Migrations in `supabase/migrations/`. Edge functions in `supabase/functions/`. Deploy commands:

```sh
supabase link --project-ref ykpjmvoyatcrlqyqbgfu
supabase db push
supabase functions deploy start-run submit-score leaderboard
```

The `pgplay_scores` table has **no client-write RLS** — all writes go through the `submit-score` edge function (service role). This is the trust boundary.

---

## Stack

- Vite 5 · React 18 · React Router 7 (HashRouter)
- framer-motion for the motion system
- @react-three/fiber 8 + three for the 3D scenes (lazy-loaded)
- Supabase JS for auth + data + edge function invocation

Bundle: ~190 KB gzipped initial; Three.js (~190 KB gz) and r3f (~44 KB gz) split out as their own chunks and only load on routes that need them.

---

## Social preview / OG image

`public/og.svg` is a 1200×630 SVG used for `og:image` and `twitter:image`. Discord, Slack, and iMessage render SVG OG images cleanly. Facebook and Twitter prefer PNG/JPG — until you ship a converted bitmap, the preview falls back to the linked URL on those platforms. To convert in one step:

```sh
# any of these one-liners will work
npx sharp-cli -i public/og.svg -o public/og.png resize 1200 630
# or
rsvg-convert -w 1200 -h 630 public/og.svg -o public/og.png
```

After producing `public/og.png`, update the `og:image` URL in `index.html` from `og.svg` to `og.png`.

---

## References

The four originals are clones in spirit, not in code, of:

- `trees-hate-you.com` (Grudgewood)
- `dvadi.com` (Goalbound)
- `slither.io` (Coil)
- `krunker.io` (SLIPSHOT)

We don't iframe-embed them. The lobby and game shell take inspiration from Friv-style discovery (visual density, instant click) without copying the layout.
