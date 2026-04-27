# Era Siege — Tech Architecture

## Stack constraint
PG.Play is Vite 5 + React 18 + JavaScript (no TypeScript yet). Era Siege
follows the host: ESM modules, plain JS with JSDoc-style comments where
useful, Canvas2D for rendering, React only for the surrounding HUD.

The brief asked for TypeScript / Zustand / Howler — those are not present
in the host project, and dragging them in for one game would balloon the
bundle. The same architectural goals (framework-agnostic sim, data-driven
content, isolated rendering) are achievable in plain ESM and that is what
ships.

## Folder layout
```
src/games/
  EraLaneGame.jsx          # public entrypoint — re-exports default from era-siege/
  era-siege/
    index.jsx              # React shell: mounts canvas + HUD, owns lifecycle
    boot.js                # session/match construction & teardown
    engine/
      loop.js              # fixed-step sim, render interpolation, RAF/visibility
      renderer.js          # Canvas2D draw passes (sky, parallax, units, FX, HUD overlays)
      input.js             # keyboard + touch routing into sim intents
      audio.js             # cue mapping → src/sound.js
      assets.js            # static palette/atlas getters (no network at runtime)
    sim/
      world.js             # MatchState factory + tick orchestrator
      entities.js          # entity store + id allocator
      base.js              # base hit/death + base-damage bounty
      unit.js              # unit spawn + tick + targeting + windup
      turret.js            # turret build / upgrade / sell / tick
      projectile.js        # projectile spawn + tick + impact
      combat.js            # damage application + death cleanup
      economy.js           # gold accrual, kill bounty, XP grant
      progression.js       # era unlock, evolve action, evolve buff
      ai.js                # enemy director: spawn cadence, tech pacing, special use
      specials.js          # special activation + impact resolution
      effects.js           # screen shake, flash queue, damage-number queue
      collision.js         # AABB / range checks
      match.js             # win/lose detection + score formula
    content/
      eras.js              # 5 eras: id, label, xpToEvolve, evolveCost, palette, units, turret, special
      units.js             # 15 units: hp, dmg, range, speed, windup, cooldown, bounty, sprite
      turrets.js           # 5 turret tiers (one per era), per-slot upgrade graph
      specials.js          # 5 specials: cooldown, telegraph, damage profile, vfx
      difficulties.js      # skirmish / standard / conquest tuning multipliers
      balance.js           # global constants (BASE_HP, GOLD_RATE_BASE, XP_KILL_RATIO, etc.)
      palette.js           # per-era palette swatches used by renderer + HUD
    ui/
      HUD.jsx              # top bar + bottom dock + side rails
      UnitDock.jsx         # 3 unit cards with cost/cooldown
      TurretRack.jsx       # 3 turret slots
      EraBadge.jsx         # era pill + xp arc + evolve button
      SpecialButton.jsx    # special with cooldown radial
      Tutorial.jsx         # one-time inline hints
      ResultPanel.jsx      # victory/defeat overlay
      DifficultyChip.jsx   # current difficulty pill
    utils/
      math.js              # clamp, lerp, vec2 helpers
      random.js            # seedable RNG
      objectPool.js        # pool factory used for projectiles + particles
      eventBus.js          # tiny pub/sub between sim and React HUD
      ids.js               # monotonic id allocator
    styles.css             # game-scoped CSS (extends src/styles.css)
    tests/
      sim.world.test.js
      sim.combat.test.js
      sim.progression.test.js
      sim.ai.test.js
      sim.specials.test.js
```

## Why JS, not TS
- The whole PG.Play repo is JS today. Adding TS just for one game would
  pull in `@types/react`, fork tooling, and split conventions.
- Schema definitions still live in single source-of-truth content files
  with JSDoc typedefs, so editor tooltips work without adding a compiler.

## Simulation contract
Sim is **framework-agnostic**: no React, no DOM, no Howler, no Supabase. It
exports pure functions that take a `MatchState` and a `dt` (seconds) and
return a new state delta or mutate in place (mutate-in-place for
performance — see "Performance" below).

```
match = createMatch({ difficulty, seed })
tick(match, dtSeconds, intents)
   -> { events: [{ kind, ... }, ...] }
isOver(match) -> { winner: 'player' | 'enemy' | null }
score(match) -> 0..100
```

`intents` is the player input bus for that tick: `{ spawn: ['unitId'], buildTurret: { slot, turretId }, special: bool, evolve: bool, sell: { slot } }`.

The sim emits **events**, never reaches up. The React HUD subscribes to
the event bus to drive HUD highlights, the renderer consumes them for
flash/shake/damage-numbers.

## React shell responsibilities
- Mount the canvas, run the RAF loop, route input to sim intents.
- Mirror a *minimal* subset of MatchState into React state (gold, XP, era,
  base HPs, unit cooldowns, special cooldown, status). The full
  entity list never crosses the React boundary — it stays in sim.
- Render the HUD components, which read only from that minimal mirror.

State sync uses `requestAnimationFrame` batching: the React mirror is
written at most once per frame, and only when a tracked field actually
changed. This is what keeps React's `useState` / `useReducer` cheap
even at 60 Hz simulation.

## Render contract
```
renderFrame(ctx, match, view, alpha)
```
- `view` = current viewport size + lane bounds (from `sizeCanvasFluid`).
- `alpha` = render interpolation factor (0..1), used to lerp unit/projectile
  positions between simulation steps.

Pass order:
1. Sky gradient (era-tinted).
2. Mountain silhouettes (era-tinted).
3. Parallax mid-layer (era-specific).
4. Ground band.
5. Bases (with per-era flag/silhouette).
6. Turrets (3 slots per side).
7. Units (back-to-front by y, then by id).
8. Projectiles.
9. Hit FX + damage numbers.
10. Era flash overlay (during evolve).
11. Screen shake offset is applied to the canvas transform before passes 1–10.

HUD draws in React (HTML/CSS). Canvas only owns the simulation surface.

## Loop
- Fixed-step simulation at **60 Hz** (`SIM_DT = 1/60`).
- Render is RAF-driven; the loop drains accumulator with `tick()` calls
  before drawing.
- Cap accumulator at 4 sim steps (~67ms) to avoid spiral-of-death after a
  long stall.
- Tab-hidden pauses the accumulator and the audio context.
- React unmount stops the RAF, disposes the canvas resize observer, and
  resets the React mirror.

## Performance
- Object pools for **projectiles** and **particles** (most frequent
  spawn/destroy). Units & turrets are pooled per match (max ~80 units +
  6 turrets).
- The render path **never allocates** in the hot path — colors, gradients
  and font strings are precomputed per-era.
- HUD writes batched per frame with shallow-equal guards.
- Damage numbers cap at 24 simultaneous; new ones replace the oldest.
- Particle cap at 80 (auto-low-effects scales this to 24).

## Determinism
- All RNG flows through one seedable Mulberry32 in `utils/random.js`.
- Sim state is JSON-serialisable (no functions, no DOM refs) so a state
  snapshot can be diffed in tests.
- The renderer is pure: same MatchState + view → same pixels.

## Mobile
- Canvas fills the play area via `sizeCanvasFluid`.
- HUD CSS uses `@media (max-width: 720px)` to collapse the unit dock to a
  3-column horizontal strip.
- Touch input maps tap → spawn, hold → tooltip.
- The auto-low-effects detector watches frame time; if rolling avg
  exceeds 22ms over 3s on mobile, particles & damage numbers are cut.

## Persistence
- Tutorial-dismissed flag → `localStorage` (`era-siege:tutorial-dismissed`).
- Best-difficulty unlocked → `localStorage` (`era-siege:max-difficulty`).
- Falls back to in-memory if `localStorage` throws (private mode).

## Telemetry
- An event bus exposes `match_start`, `match_end`, `era_reached`,
  `evolve_clicked`, `unit_spawned`, `turret_built`, `special_used`,
  `low_gold_error`. v1 ships a no-op transport; the contract is in place
  for a future hook.

## Score submission
- Same `submitScore('aow', score, meta)` contract as the existing version.
- `score` is 0..100 (matches the existing supabase rule).
- `meta`: `{ era, time, defeat?, difficulty, units, turrets, specials }`.

## Build size budget
- Era Siege module: **<35 KB gzipped** (sim + content + HUD + renderer).
- No new top-level dependencies. All audio comes from `src/sound.js`.

## Code style
- Match the surrounding repo: 2-space indent, single quotes, no semicolons
  optional (matches the rest of `src/games/`), `function` for top-level
  exports, arrow functions for callbacks.
- JSDoc typedefs in content files for editor tooltips.
- No emoji in code per project convention.
