# PG.Play — platform audit

*Honest snapshot of the codebase as of this writing. Scoped to the things that
should drive the next few build sessions, not everything.*

## Tech stack

- **Vite + React 18** (`type: module`), no SSR.
- **Three.js** for 3D (`SlipshotGame.jsx` only).
- **Supabase** (`@supabase/supabase-js`) for auth, favorites, scores,
  achievements, realtime broadcast (Arena lobby).
- **Canvas 2D** + `requestAnimationFrame` for every 2D game.
- **Web Audio synth** (`src/sound.js`) — no sample files.

## Module map

```
src/
├─ App.jsx               — app shell, state, routing via view flags
├─ data.js               — GAMES registry, FILTERS, COLLECTIONS
├─ scoreBus.js           — `submitScore(id, score, meta)` event dispatch
├─ sound.js              — procedural SFX + mute toggle
├─ supabase.js           — browser client (public anon key)
├─ icons.jsx             — shared inline SVG icon set
├─ covers.jsx            — per-game SVG cover art
│
├─ components/
│   ├─ App shell:        Sidebar, SettingsDrawer, ProfilePanel, AuthModal, AchievementToast
│   ├─ Home surface:     FeaturedHero, Collection, Card, FilterTabs (deprecated)
│   └─ Game surface:     GameIntro (launcher + lazy game host)
│
├─ games/                — one component per playable title
│
└─ hooks/
    ├─ useSession.js     — Supabase auth state
    ├─ useFavorites.js   — local-first, syncs on sign-in
    ├─ useBests.js       — personal bests per game
    └─ useAchievements.js — local-first, toast on unlock, DB sync
```

## What works

1. **Design system.** One accent (`#00fff5`), one radius scale, one shadow,
   four-token spacing, Lora display + Inter body + Space Mono eyebrow. Every
   surface reuses these.
2. **Shell flow.** Sidebar filters → card grid → hero → intro → play stage is
   coherent. Profile + Settings drawers consistent.
3. **Code-split games.** `GameIntro.jsx` uses `React.lazy` so Three.js (~130 KB
   gzipped) only loads when Slipshot is opened. Home bundle is ~118 KB gzipped.
4. **Ten playable titles**: Connect 4, 8-Ball, 2048, Cut the Rope, Stickman
   Hook, Raycaster FPS, Arena (top-down multiplayer), Slipshot (3D solo
   score-attack), Grudgewood (trap rage platformer), Nightcap (7-room motel).
5. **Platform systems.** Supabase auth works; favorites/bests/achievements
   merge local → DB on sign-in and vice versa; achievement toasts fire via
   event bus; personal best shown on cards and intro.

## What's weak

### Registry schema is thin
Current `GAMES` entries only have `id, name, cat, kind, players, levels,
tagline, story, [playable], [featured], [badge]`. No device/mobile info, no
input metadata, no skill tags, no session length. This blocks:
- Mobile-friendly badges / filter on cards.
- "Best for short sessions" / "Brainy" collections driven by data (today
  collections hardcode `ids`).
- Recommendations and detail-page affordances.

### No mobile adaptation
Every desktop-primary game (Slipshot, FPS, Grudgewood, Nightcap, Stickman Hook)
renders on a phone but is unplayable there. No virtual d-pad, no gesture
abstraction, no orientation lock, no "needs keyboard" warning UI.

### Library gap
10 of 21 cover tiles still route to the `PlayPlaceholder` component: Football,
Basket, Bob the Robber, Bad Ice Cream, Age of War, Vex, Papa's Pizzeria,
Bloons TD, Slither.io, Happy Wheels, Fireboy & Watergirl. Fine as marketing
for the future roadmap, bad as a promise.

### Game intro is doing the job of a detail page
`GameIntro.jsx` is a single surface that handles lobby preview, mode picker,
and play stage. No controls diagram, no "why we picked this," no related
games, no stats. Good enough for now; not the brief's target.

### IP-risk legacy IDs
`slither`, `bloons`, `happywheels`, `fbwg`, `badicecream`, `bob`, `aow`,
`papa`, `basket`, `football`, `vex` still use the exact franchise game names
in `name:` / `story:` copy. When we implement them, they'll need original
renames in the same pattern as Slipshot (← KrunkerLite) and Grudgewood
(← TreesHateYou).

### Scoring / achievement coverage is uneven
Score submission fires from ~7 games; achievements reference specific IDs.
When new games ship they need individual wiring; no shared contract yet
(e.g. a game could expose `{ onRunEnd(outcome) }` instead of importing the
score bus directly).

### Sound is universal but thin
`sound.js` has 8 cues. Games themselves don't emit hit/kill/pickup sounds.
That's fine for chrome but leaves gameplay feeling silent.

### Performance
Bundle hygiene is good after the split. Slipshot's 133 KB chunk dominates but
only loads on open. No obvious runtime jank in 2D games; Slipshot's
per-frame ray/collision is the one to watch if we add enemies.

## Accessibility gaps

- Focus rings are wired, but game canvases aren't keyboard-reachable.
- No `prefers-reduced-motion` guards.
- Game canvases don't have alt-text / role annotations.
- Color contrast is mostly fine; the `.card-fav` heart on dark cover art is
  borderline when unfavored.

## Recommendation for the next sessions

1. **This session**: docs + schema extension + Slither-lite (touch-native,
   library-completing, low risk).
2. **Next session**: mobile adaptation — build a shared `useVirtualControls`
   hook + on-screen d-pad. Adapt Grudgewood + Nightcap.
3. **Session after**: ship Wave 2 games (Bloons-style, Papa's-style,
   Basket Champs-style — all touch-native) with original renames.
4. **Later**: Wave 3 (harder action titles), then the flagship Fireboy &
   Watergirl-inspired co-op as a dedicated pass.

See `game-roadmap.md` for the detailed sequence.
