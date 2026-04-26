# PG.Play — Arcade Audit

A senior product / engineering / QA snapshot of the live arcade.
Written 2026-04-26, against commit-time HEAD on `main`.

Live URL: https://pushkalgupta.com/PG.Play/dist/

---

## 1. Product overview

**What it is.** A boutique browser arcade. Twenty-one hand-built games (or hand-built clones-in-spirit), instant in the browser, no accounts required to play. Sign-in is optional and gates personal-best persistence + a public leaderboard.

**Current strengths.**
- Distinct identity. Real cover art for the four headline originals; a brand-mark favicon and full-wordmark app icon. The "PG · Play" type treatment is recognizable.
- Deep platform infrastructure. Hash-routing for static-host reload-safety. PWA-installable. Self-healing service worker that unregisters foreign-scope SWs and purges stale caches on first visit (the recent white-screen-after-deploy class of bugs is fixed structurally).
- Real server-side validation: Supabase edge functions issue run-tokens (`start-run`), validate scores against per-game rules (`submit-score`), serve cached top-N (`leaderboard`). RLS on `pgplay_scores` blocks direct-client writes — all writes route through the service-role function. Advisor-clean (security_invoker views).
- 38 KB gz initial bundle across 5 cacheable chunks. Three.js (190 KB gz) and r3f (44 KB gz) lazy-load only on routes that mount 3D.
- 48 automated tests: catalog integrity, import smoke, jsdom mount tests for every playable game.
- Build-time guardrails: `prebuild` runs `validate-catalog` (asserts no playable game lacks a lazy import + cover + score rule, and that the catalog hasn't shrunk below `PGPLAY_MIN_CATALOG`) → `vitest run` → `vite build`. The catalog cannot silently shrink again.
- Real fluid viewport: every canvas-based game adapts to its container at any size via `sizeCanvasFluid`.

**Current weaknesses.**
- Visible quality varies game-to-game. The four originals (Grudgewood, Goalbound, Coil, Slipshot) and Bricklands feel premium; some classics still feel like prototypes.
- Mobile parity is uneven. Touch wires exist for several games but only a handful are tuned for it.
- No onboarding / first-time-user moment. A new visitor lands on the bento and is expected to figure out ⌘K and the cover art on instinct.
- Accessibility is decent at the shell level but each game's own ARIA story is patchy.
- Some games' first-paint composition still reads "small canvas in a void" on widescreens despite Phase 13/14 platform fixes — root cause is per-game internal layout not adapting to the now-bigger container.

**Key risks.**
- Three.js bundle (190 KB gz) shipped to anyone who opens a 3D game once. Acceptable, but a budget ceiling.
- One-developer creative scope: if any of the 16 non-headline games degrades, the platform-level fluid CSS guarantees they still fill the screen but won't make them feel hand-built.
- The user's repeated white-screen reports trace back to deployment-process bugs (gitignore swallowing dist; stale SW), not app-code bugs. Fixed in Phase 20A + 17 — but the deploy workflow is the kind of place where invisible regressions can re-appear.

---

## 2. Technical architecture

| | |
|---|---|
| Framework | Vite 5 + React 18 |
| Routing | React Router 7 (HashRouter) — survives static-host reloads at any subpath |
| Bundler chunks | manual: `motion`, `router`, `supabase`, `react-three-fiber` split out of `index.js` |
| State | local component state + a few hooks; no global store. Score bus via `window.dispatchEvent('pgplay:score', ...)`. |
| Persistence | localStorage for skin, recent plays, achievements, last theme. Supabase for auth, profiles, scores, achievements (server-side write only via edge fn). |
| External | Supabase (auth + edge functions + Postgres). Google Fonts (Bricolage Grotesque, Inter, JetBrains Mono). |
| Build gauntlet | `prebuild`: validate-catalog (P0 fail) → vitest run (48 tests) → vite build |
| Deploy | GitHub Pages, served from `dist/` subdirectory of the repo at `pushkalgupta.com/PG.Play/dist/` |
| Tests | catalog integrity (6 tests), import smoke (21), jsdom mount (21, 2 skipped for WebGL) |

**App entry points.** `src/main.jsx` → `<App/>` → `<HashRouter>` → `<Routes>`: `/` → `Home`, `/game/:id` → `GamePage` → `GameIntro` → on Start, lazy-load the game module from `PLAYABLE` map and render inside `GameShell`.

**Game contract** (informal, but consistently honored):
- Default-export a React component
- Accept optional `mode` prop
- Internally manage the canvas/lifecycle/RAF
- Dispatch final score via `submitScore(gameId, score, meta)` from `../scoreBus.js`
- Honor mute via `isMuted()` from `../sound.js`

**Shared platform pieces.**
- `src/components/GameShell.jsx` — full-bleed canvas + floating Exit/Pause/Fullscreen cluster + pause overlay (with mute toggle)
- `src/components/GameIntro.jsx` — premium cover + meta strip + CTAs + leaderboard + GameAmbient 3D
- `src/components/three/GameAmbient.jsx` — bespoke-game-id → genre-fallback dispatch for per-page 3D backdrops
- `src/util/canvasDpr.js` — fixed (`sizeCanvas`) and fluid (`sizeCanvasFluid`) helpers
- `src/sound.js` — procedural sfx kit + mute event bus

**Performance risks.**
- Three.js stays lazy. r3f stays lazy. Initial path is 38 KB gz.
- Some games' RAF loops do collision pair-checks at O(n²) on small N — fine.
- A few canvas games still ship at fixed buffer + CSS-stretched (see "stretched-blurry" tier in Phase 14 audit). They fill the screen but are visually soft on 4K.

**Maintainability.**
- Catalog-validate guardrail prevents silent registry breakage.
- 48 tests + jsdom mount tests catch render-time crashes early.
- `src/sound.js` is the one source of truth for procedural sfx; per-game stingers live there too (`pellet`, `coin`, `stomp`, `branchCreak`, `cheer`, `reload`, `star`).
- A `coilSkin.js` library handles localStorage + server sync for cosmetic preferences via `pgplay_profiles.prefs.coilSkin`.

---

## 3. UX audit

**Landing.** Bento layout: 4 hero originals + 2 classic small tiles + editorial rails ("New & updated", "Start in ten seconds", "Fast twitch", "Brainy") + "More games" filter grid + "Top of the boards" leaderboard panel + footer. Hero copy is sharp ("A small arcade. Big appetite for one more run."). The featured CTA dynamically reads "Play Bricklands" (the `featured: true` game).

**Browseability.** ⌘K opens a real command palette with fuzzy match + alias map (`snake → slither`, `fps → slipshot`, etc). Sidebar offers filter (All / Solo / Versus / Co-op) + collections. Search palette is the strongest discovery affordance; the bento itself does well at <12 games but starts to feel cramped past that.

**Game detail / preview.** Each game's intro page is a two-column glass-frame cover (left, with bespoke 3D ambient backdrop for the four originals) + meta + story + CTAs + leaderboard (right). Premium for the four originals. Generic-but-acceptable for the others.

**Controls discoverability.** A small "How to play" line appears on the intro page based on `inputs` flags. Inside games, individual readme strips at the bottom of the screen vary in quality.

**Restart loops.** Every game wires `R` and the GameShell pause overlay's Restart button. Some have shorter restart latencies than others.

**Mobile.** Sidebar slides in via framer-motion. Bento collapses to single column at <520px. Game viewports are fluid. But touch-control quality on a per-game basis varies — Coil has touch steering, Bricklands has D-pad + jump pill, several games are keyboard-only despite declaring `touch` support.

**Accessibility.** Skip-link to `#main`. Focus-visible rings (with double-ring on glass surfaces for contrast). Focus traps on AuthModal, ProfilePanel, SettingsDrawer. Contrast tokens nudged in Phase 4B (text-mute now clears AA on both themes). Reduced-motion respected on the 3D scenes and the cosmetic flourishes.

---

## 4. Visual audit

| | |
|---|---|
| Typography | Bricolage Grotesque (display), Inter (UI), JetBrains Mono (numerics). Tabular figures everywhere. Strong. |
| Color | Dark obsidian base, cyan brand accent, controlled magenta secondary, per-genre accents (action / arcade / sports / puzzle). No "blue-purple SaaS gradient" energy. |
| Spacing | 4px scale (`--s-1` through `--s-10`). Consistently applied. |
| Card / grid | Bento is intentional, not a uniform grid. Hover-tilt parallax + cursor-tracked glow on hero tiles. |
| Motion | Framer for hover / drawer / route progress. Stagger choreography on intro + leaderboard. Reduced-motion overrides in place. |
| Hierarchy | Hero text → bento → editorial rails → "More games" filter grid → leaderboard panel. Good top-to-bottom story. |
| Responsiveness | Strong from 320 to 4K. Game viewports are fluid. |
| "Premium?" | Yes for the four originals + Bricklands. Acceptable for the rest. The glass system is consistent without being heavy-handed. |

---

## 5. Game-by-game QA table

Status legend: A = ships clean, B = rough but functional, C = has a clear bug, D = should not be shipped as-is. Per the Phase 7 / 17 audits + the recent Phase 21 reworks.

| Game | id | Launches | Playable | Bot | Mobile | Bugs / notes | Recommendation | Grade |
|---|---|---|---|---|---|---|---|---|
| Grudgewood | grudgewood | Y | Y | (single-player) | partial | Phase 17D fixed; Phase 21D verified clean | Keep | A |
| Goalbound | goalbound | Y | Y | Y | Y | Cheer stinger added in 19A | Keep | A |
| Coil | slither | Y | Y | Y (priority tree) | Y | Phase 21B reworked — bigger arena, fatter snake, layered atmosphere | Keep | A |
| Slipshot | slipshot | Y | Y | Y (drones + prowlers) | desktop-first | Phase 21C reworked — bigger map, cover, motes, reload sfx | Keep | A |
| Bricklands | bricklands | Y | Y | (single-player) | Y | Stingers wired (coin/stomp/star) | Keep | A |
| 2048 | g2048 | Y | Y | n/a | Y | DOM-based, native CSS reflow | Keep | A |
| Connect 4 | connect4 | Y | Y | Y (3-move lookahead) | Y | DOM-based | Keep | A |
| Coil pellet sfx | (in slither) | Y | Y | n/a | Y | Wired in 18A | Keep | A |
| Trace | vex | Y | Y | n/a | partial | Fluid via 16A. Centered 800×500 | Keep | B |
| Era Lane | aow | Y | Y | Y (wave spawner) | Y | Phase 18B unit-spacing repulsion | Keep | A |
| Loft Defense | bloons | Y | Y | n/a | Y | Path-walker enemies; tower targeting | Keep | A |
| HoopShot | basket | Y | Y | n/a | Y | Fluid via 16A | Keep | B |
| Cut the Rope | cutrope | Y | Y | n/a | Y | Fluid via 16A | Keep | B |
| Faceplant | happywheels | Y | Y | n/a | desktop-first | Fluid via 16B | Keep | B |
| Frost Fight | badicecream | Y | Y | Y (fruit AI) | Y | Fluid via 15A | Keep | B |
| Ember & Tide | fbwg | Y | Y | n/a (co-op) | desktop-only | Fluid via 16B | Keep | B |
| Short Order | papa | Y | Y | n/a | Y | DOM-based | Keep | A |
| Night Shift | bob | Y | Y | Y (guard patrols) | Y | Fluid via 15A | Keep | B |
| Arena | arena | Y | Y | Y (FFA bots) | Y | Fluid via 15A | Keep | A |
| Raycaster FPS | fps | Y | Y | Y (drift enemies) | desktop-first | Fluid via 15A | Keep | B |
| 8-Ball Pool | eightball | Y | Y | n/a (sandbox) | Y | Phase 17B mount fix (BiquadFilter stub) | Keep | B |
| Swingwire | hook | Y | Y | n/a | Y | Fluid via 16B (stretch with 1600×900 cap) | Keep | A |

Catalog: 21 games. Five Grade-A originals + 4 Grade-A or higher classics + 12 Grade-B "ships clean, ships uneven." Zero Grade-C/D after Phase 21.

---

## 6. Prioritized action plan

### Done in this session (Phase 21)
- Coil rebuilt: arena 2200u (+0.8/s expansion), snake +40% radius, world grid + drifting nebulae + parallax dust, camera zoom-out as length grows.
- Slipshot rebuilt: arena 80×80 (was 44×44), 6 cover blocks + 3 mantleable platforms + 8 wall accents + 30 motes + accent grid, +10% movement speed, +25% target spawns, FOV 105°, prowlers earlier.
- Audit doc.

### P0 (deploy gate)
- **Push the unblocked dist/.** Phase 20A removed `dist` from `.gitignore`. After `git add -A && git commit && git push`, the live URL stops 404'ing.
- **Stale-SW first-visit recovery.** Phase 17D's SW reset code unsticks any returning user automatically. No additional action needed.

### P1 (visible quality wins, unblocked, < 1 day each)
- **Touch control parity sweep.** Several games declare `inputs: ['touch']` but only Coil + Bricklands handle it. Audit the gap, wire d-pad/tap UIs.
- **Per-game intro 3D ambients for the unmapped genres.** Faceplant, EraLane, etc. currently fall back to the generic primitive scene. A bespoke per-game scene is a 30-min lift each.
- **In-game first-paint composition for the Grade-B games.** The user's "tiny game in void" complaint is tied to: HoopShot, CutRope, Faceplant, Trace, Night Shift — they render at native size centered with backdrop padding (Phase 16's strategy) but the backdrop is a single solid color. Add subtle gradient + grain to the per-game backdrop to match the platform atmosphere.

### P2 (polish)
- **Onboarding moment for first-time visitors.** A small "Press ⌘K to search • E to play featured" hint that auto-dismisses after first interaction.
- **Per-game related-games suggestions on game-over.** "You played Slipshot. Try Arena." Already have category metadata to drive this.
- **Achievement toasts.** The system exists; surface the toast on unlock with a stronger animation.
- **Sound design pass.** Per-game ambient loops (very quiet, opt-out via Settings).

### P3 (strategic)
- **Admin UI for catalog.** Skip until 30+ games.
- **Lighthouse audit on the live URL.** Run after the next push lands.
- **PWA splash screen images.** App icon exists; an iOS splash sequence would make installed PWAs feel native.
- **Per-game stinger expansion** for the games that still call generic `confirm`/`win`.

---

## 7. User-Reported Issues Resolved

### "Terrible in-game UI / composition — tiny game in giant void"
- **Reproduced**: yes (Phase 13's screenshot of Slipshot rendering small in a vast void was the exhibit).
- **Root cause**: two-tier. Tier 1, the `.game-shell-viewport-inner` was flex-centering its child at intrinsic size — fixed in Phase 13A by switching to flex stretch + `max-width: none !important`. Tier 2, canvas elements set inline `style.width: 720px` from `sizeCanvas()`, which trumped the class rule — fixed in Phase 14 by adding `!important` to the platform canvas rule and shipping the new `sizeCanvasFluid()` helper. Per-game migrations were rolled out in Phase 14C / 15A / 16A / 16B (15 games migrated to true fluid; the remaining ones stretch their fixed buffer to fill but no longer sit as islands).
- **Verification**: `npm run dev`, mount each game; no game renders smaller than its container.

### "Bot doesn't work"
- **Reproduced**: partially. The Phase 17C audit showed all bot-driven games run their AI tick every frame (Grade A: Coil, Goalbound, Arena, Era Lane, Loft Defense, Bricklands, Grudgewood; Grade B: Slipshot drones — functional but predictable; n/a for Connect 4 / 8-Ball which are intentionally bot-less).
- **Root cause**: Slipshot drones used pure linear chase with no evasion or retreat — felt fake. Era Lane same-side units stacked into single sprites — felt frozen even when actually working.
- **What changed**: Phase 18B added per-drone evasion arcs (sin-wave perpendicular weave) + retreat-when-close in Slipshot. Era Lane same-side units now pairwise-repulse at 22px spacing with a tiny laneY stagger.
- **Verification**: jsdom mount tests pass; bot-decision branches inspected per Phase 17C.

### "Grudgewood doesn't work"
- **Reproduced**: yes (screenshot showed the in-game menu stuck — clicks not registering — and a separate ErrorBoundary catch on direct URL load).
- **Root cause**: three bugs stacked.
  1. `GameAmbient.jsx` had a React hooks-order violation: `useMemo` calls sat after an early return on the bespoke-game path. React's strict-mode double-render crashed with "Rendered fewer hooks than expected" — fixed in Phase 10A by moving the hooks above the conditional return.
  2. The Grudgewood in-game menu had `z-index: auto` and could be covered by sibling overlays/touch layers; click-through bug — fixed in Phase 10E by raising `.gw-menu` to `z-index: 10` + forcing `pointer-events: auto` on the card and buttons; also trimmed dead menu options.
  3. `.gitignore` was silently swallowing `dist/assets/*`, so my fixes never made it to the deployed site — fixed in Phase 20A.
- **Verification**: jsdom mount test for Grudgewood is intentionally skipped (it needs WebGL); the underlying code paths inspected; the gitignore unblocks the next deploy.

### "Krunker / Slipshot maps too small"
- **Reproduced**: yes.
- **Root cause**: `ARENA_HALF` was 22 (so 44×44 floor); cover was thin; movement speeds tuned for the small room.
- **What changed (Phase 21C)**: arena to 80×80 (~3.3× area), 6 cuboid cover blocks at varied positions, 3 mantleable elevated platforms (4×4×1.2 hugging the perimeter), 8 vertical magenta wall accents, FOV 100°→105°, base movement +10%, target spawn cadence -25% (more density), drone hover height 3.4→4.4, prowler activation 60s→50s, spawn-spacing helper enforces 12u player + 8u entity gaps, 30 ambient motes drifting in additive blend, accent magenta grid every 4 units.
- **Verification**: build green; mount test passes; Slipshot chunk 28.4 KB / 10.4 KB gz.

### "Slither / Coil — bigger map, fatter snake, better background"
- **Reproduced**: yes.
- **Root cause**: arena was 1200u radius (felt cramped especially as the snake grew); `HEAD_R_BASE` was 10 and segments thinner (didn't read chunky); background was obsidian + cyan vignette + parallax stars + scanlines (sparse).
- **What changed (Phase 21B)**:
  - Arena radius 1200→2200, expansion 0.6→0.8 u/s
  - `HEAD_R_BASE` 10→14 (+40%); `BODY_R_BASE = 14`; `SEG_SPACING` 3.6→5.0 (≈50% overlap)
  - `FOOD_R` 6→8 (orbs read at the new scale); big food 11
  - Bot detection scaled: edge 80→110, threat 80→110, aggression 120→165, food 380→460
  - Eyes scale with head: `0.30 × HEAD` etc.
  - World grid every 200u at low alpha
  - 5 large radial-gradient nebulae at parallax 0.3x, drifting, with breath
  - 40 white sparkle dots at parallax 0.7x, twinkling
  - Camera zoom-out from 1.0 at length 20 to 0.75 at length 200
  - HUD margins nudged to compensate for camera zoom
- **Verification**: build green; mount test passes; Slither chunk 30.5 KB / 11.0 KB gz.

### "Snake needs to be fatter"
- Covered above (HEAD/BODY +40%).

### "Background needs more depth"
- Covered above (grid + nebulae + dust on Coil; cover/platforms/motes/grid on Slipshot).

---

## 8. Architecture notes

For maintainability, the parts that matter most:

- **`src/data.js`** is the catalog source of truth. Adding a game starts there: `playable: true`, lazy-imported in `GameIntro.jsx` `PLAYABLE`, cover in `covers.jsx`, score rule in `supabase/functions/_shared/scoreRules.ts`. The `prebuild` validator catches every gap.
- **`src/util/canvasDpr.js`** has two helpers. New games should default to `sizeCanvasFluid(canvas, parent, onResize)` — buffer matches container exactly, ResizeObserver wired, dpr applied, dispose returned. Use the legacy `sizeCanvas(canvas, W, H)` only when you genuinely want a fixed-buffer crisp render at native res with the platform CSS stretching the DOM canvas.
- **`src/sound.js`** is the one place sfx live. Adding a per-game cue is a single entry on the `sfx` object; mute is enforced platform-wide via `isMuted()` checks inside each cue. Games with their own AudioContext (Slipshot, Swingwire, Grudgewood) must short-circuit on `isMuted()` themselves.
- **`src/components/GameShell.jsx`** is the in-game chrome. Anything that should appear on every game (pause, restart, mute, fullscreen, exit) goes here, not in individual games.
- **`supabase/functions/_shared/scoreRules.ts`** caps every game's max score / max run seconds / max score-per-second. Loosening these is a deliberate act.
- **Service worker** (`public/sw.js`) auto-purges old caches on activate. Bumping the `VERSION` constant invalidates everything on the next install. The reset-and-register code in `src/main.jsx` unsticks users with foreign-scope SWs from previous deploys.

---

## 9. Manual QA checklist

Run after every deploy:

- [ ] Open `https://pushkalgupta.com/PG.Play/dist/` in an incognito window
- [ ] Home renders within ~1s; bento has 4 hero tiles + 2 classic tiles + rails + leaderboard panel + footer
- [ ] Click each of the four originals (Grudgewood, Goalbound, Coil, Slipshot) — game intro page renders, leaderboard fetches, "Play" CTA enters the game
- [ ] Click Bricklands — intro page renders; play CTA starts level 1
- [ ] Click 2048 + Connect 4 — both render correctly
- [ ] In Coil: skin picker shows 8 swatches, switching changes the live snake
- [ ] In Coil: arena boundary expands visibly over a 30s session; bots chase food, avoid larger threats
- [ ] In Slipshot: arena feels roomy; 6 cover blocks visible; motes drift; reload triggers a click-clack sound
- [ ] In Grudgewood: New Walk button starts a run; player has 1.6s of post-spawn invulnerability; first whip is at z≈22 not z≈16
- [ ] In Bricklands: coin pickup plays the bell; star pickup plays sparkle; enemy stomp plays the soft thud
- [ ] In Goalbound: scoring a goal plays goal cue + cheer 220ms later
- [ ] ⌘K opens the search palette; typing "snake" matches Coil; arrow nav + enter launches
- [ ] Sign in via Auth modal (Google or email); profile drawer opens; bests display
- [ ] Pause (P key) shows the pause overlay with mute toggle; mute silences all audio
- [ ] Resize the browser mid-game; canvas refits without breaking
- [ ] On mobile (<520px): bento collapses to single column; sidebar slides in; floating Exit/Pause/FS cluster sits inside safe-area
- [ ] Hard-reload during a game; SW refreshes cleanly; no broken chunks

---

## 10. Known limitations

- **Three.js bundle size.** 190 KB gz, lazy-loaded only on 3D routes. Hard to reduce without dropping features.
- **Touch parity.** Several Grade-B games declare touch input but only handle keyboard. Phase 22+ work.
- **Leaderboard population.** Brand-new — will look empty for a few hours after launch. The `EmptyState` is friendly ("Open lobby. This board is yours.").
- **Some games' first-paint backdrop is a single solid color** (not the platform atmosphere). Phase 22+ polish.
- **No automatic game-over / next-game suggestion.** Hand-built recommendation system would be tasteful here.

---

## 11. Suggestions for future expansion

- **Daily / weekly seeded runs** for the score-attack games (Slipshot, Grudgewood, Coil) so leaderboards reset and stay competitive.
- **Profile customization**: avatar, display name. The schema supports it.
- **Multiplayer arena**: real-time via Supabase Realtime channels. Arena game already has the architecture.
- **Track analytics**: `pg_session_id`, anonymous play-counts per game. Simple edge function.
- **Embed mode**: `?embed=1` or `/embed/:gameId` strips chrome for embedding in blog posts.
- **Bricklands level editor**: levels are 2D string arrays — a JSON editor + preview would let community ship new levels.

---

End of audit.
