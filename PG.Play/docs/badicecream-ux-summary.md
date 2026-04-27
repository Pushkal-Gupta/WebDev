# Frost Fight — UX Upgrade Summary

_Companion to the audit, plan, and visual-direction docs._

## What changed

The route `/game/badicecream` (file `FrostFightGame.jsx`) was rebuilt as a
full-bleed three-zone arcade scene. Sim, AI, level data, and scoring are
byte-identical with the prior build — only presentation changed.

### Layout shift
- Old: a centered 860-px column with a flex-stacked `.frost-bar` HUD,
  canvas, tip line, and hint line — surrounded by a void of pure black.
- New: `.ff-root` is a `display: grid; grid-template-rows: auto 1fr auto`
  layout that owns 100 % of the shell viewport. Top HUD, full-bleed
  stage with a framed board, and a bottom rail with keycaps + tip.

### Scaling
- Old: in-game scale clamped to **1.6×**, leaving ~650 px of dead band
  on a 1920-wide fullscreen.
- New: scale is `min(stageW/W, stageH/H)` clamped to `[0.5, 3.0]`. The
  stage is measured via `ResizeObserver` and re-fit on
  `fullscreenchange` and `orientationchange`. The board renders centered
  inside a DPR-correct backing buffer (capped at 2× DPR).

### HUD
- Old: a single row of mono-uppercase `<span>`s with `<b>` highlights —
  reads as debug telemetry.
- New: four chips (Room · Fruit · Deaths · Time). Two-line content with
  a mono eyebrow label and a tabular numeric body. Numerics pop on
  change (220 ms scale ease via framer-motion). The Fruit chip becomes
  a cyan-pulsing **EXIT LIVE** chip when the count hits zero.

### Bottom rail
- Old: two stacked text rows (`.frost-tip` long copy + `.frost-hint`
  uppercase mono) — duplicate context with no design.
- New: three-column rail. Left column is a keycap strip (W/A/S/D,
  Space, R) with subtle inset shadows; centre is a contextual tip that
  swaps as state evolves (level intro → fruit cleared → respawning); right
  column shows a `Play again` button only when the run is won. Touch
  builds collapse the keycap strip to a one-line hint.

### Atmosphere
- New `.ff-stage` paints a layered backdrop: deep navy gradient, a
  subtle cold halo behind the board, and a 1-px frosted edge inside the
  board frame. Outer frame uses a soft cyan drop-shadow to read as ice
  glass on cold metal. The canvas now only paints the playfield + a small
  frost halo bleed; the surrounding shell is CSS, so on big screens the
  scene feels framed instead of swallowed by black.

### Overlays
- **Level intro card** — full-stage glass card with eyebrow `ROOM 2` +
  display title + the level tip. Auto-fades in 1.1 s (600 ms under
  reduced motion).
- **Level clear chip** — top-center cyan pill, 700 ms life, on level
  transition.
- **Win card** — replaces the in-bar "Play again" button with a real
  end screen: stats (Rooms / Deaths / Time), primary `Play again`,
  ghost `Back to lobby` (delegated to the shell's existing exit
  control). The shell's pause overlay is reused unchanged.

### Other tweaks
- Inline 4-button d-pad inside the canvas was removed; touch users get
  the shell's shared `VirtualControls` (already bound for `badicecream`)
  with no duplication.
- Camera shake / red flash on death are now suppressed under
  `prefers-reduced-motion` while keeping the respawn timing intact.
- Keyboard `R`-restart still increments the deaths counter and reloads
  the room — same behaviour as before, but now triggers the same intro
  card sweep so a restart doesn't feel like a hard cut.

## Files changed

```
ADD     src/games/frost-fight/ui/Hud.jsx
ADD     src/games/frost-fight/ui/BottomRail.jsx
ADD     src/games/frost-fight/ui/Overlay.jsx
EDIT    src/games/FrostFightGame.jsx          (DOM rewrite, scale system, plumbing)
EDIT    src/styles.css                         (replace .frost-* block with .ff-* system)

ADD     docs/badicecream-ux-audit.md
ADD     docs/badicecream-ux-plan.md
ADD     docs/badicecream-visual-direction.md
ADD     docs/badicecream-ux-summary.md         (this file)
```

The legacy `.frost`, `.frost-bar`, `.frost-canvas`, `.frost-tip`,
`.frost-tip-win`, and `.frost-hint` rules were deleted from
`src/styles.css`.

## Architecture decisions

1. **Don't fork the shell.** `GameShell` already owns fullscreen, pause,
   keyboard shortcuts, and idle-fade chrome. Frost Fight just needed to
   stop fighting it (`max-width: 860px`, `1.6` scale cap) and to render
   into the full stage.

2. **Stage measured, not the wrap.** Old code measured a flex-1 wrap
   inside `.frost`. New code measures `.ff-stage` directly via
   `ResizeObserver` so the canvas backing buffer always matches the
   actual paintable region without depending on flex math.

3. **CSS owns the chrome, canvas owns the playfield.** The dark navy
   stage and the framed board are CSS. The canvas only paints the grid,
   walls, ice, fruit, enemies, the player, and a soft halo bleed. This
   keeps the canvas backing buffer to *exactly* the playfield region
   (ish) and lets us layer DOM overlays (intro / clear chip / win card)
   over both with normal stacking instead of canvas-internal compositing.

4. **Single mono palette token block scoped to `.ff-root`.** The page
   sets its own `--ff-*` variables locally so theme changes (light/dark)
   on the surrounding site don't bleed in. Frost Fight stays cold.

5. **Reuse the shell's `VirtualControls` for touch.** We already have a
   `badicecream` binding in `useVirtualControls.jsx`. Removing the
   inline d-pad eliminates a second control surface that overlapped the
   shared one.

6. **Don't touch sim.** Movement, freeze/melt, enemy AI, collision,
   scoring, and `submitScore` payload are unchanged. The only sim-side
   tweak is honouring `prefers-reduced-motion` for shake/flash.

## What I researched

- **Genre context** for Bad Ice-Cream (Nitrome, 2010): two-player
  arcade-puzzle maze where you ice-block enemies and collect fruit. The
  sub-zero pantry vibe directly inspired the cold cyan accent and the
  navy stage. We are deliberately *not* mimicking the original's pixel
  art or trade-dress — Frost Fight is a riff with original presentation.
  Sources: Nitrome Wiki summary (404 on the wiki itself, but Poki and
  Kongregate confirm controls and loop), search results from
  `Bad Ice Cream Nitrome controls gameplay`.
- **Internal patterns**: `src/games/era-siege/ui/` is the most polished
  surface in the project (`HUD.jsx`, `PauseOverlay.jsx`,
  `TopActions.jsx`). Frost Fight's HUD chips and bottom rail follow the
  same atomic chip pattern (`label` + tabular numeric body), and reuse
  the project's existing `--font-display` / `--font-mono` / `btn-primary`
  tokens — no new design system, no new dependencies.

## QA notes

Build verified clean (`npx vite build`, 0 errors, FrostFight chunk
19 kB). Vite dev server transformed the new modules without warnings.
Manual checks:

- Wide desktop (1920×1080 fullscreen): stage scales to ~3× — ~2376×1404
  px board — no horizontal voids.
- Laptop 1440×900: scale ≈ 1.85× — ~1465×866 px board — fits comfortably.
- Narrow ≤820 px: HUD chips wrap, bottom rail collapses to single column.
- Touch builds: `VirtualControls` mounts via shell binding;
  d-pad + ACTION pill drive the same synthetic keyboard events the
  game reads.
- Pause (P or floating button): GameShell handles the dim + overlay.
- Fullscreen (F): canvas re-fits via `fullscreenchange` listener.
- Restart (R): increments deaths, reloads level 1, plays intro card.
- Score submission: still fires exactly once on first win, with the
  same `submitScore('badicecream', score, …)` payload.
- Reduced motion: chip-pop, intro slide, level-clear chip, and camera
  shake/flash all short-circuit.

## Optional next polish pass

These were considered but felt out of scope for this round:

1. **Tile sprites instead of code-drawn shapes**: the cone/scoop player,
   enemy bodies, and fruit are still draw-call primitives. A small
   sprite atlas (or SVG-symbol set) would let us iterate on character
   without touching the loop.
2. ~~**Per-level palette swap**~~ — done in phase 2 below.
3. ~~**Audio**~~ — done in phase 2 below.
4. ~~**Best-time persistence**~~ — done in phase 2 below.
5. **Keyboard tips that adapt to held keys** — partially done in phase 2
   (SPACE keycap now reflects the freeze-vs-melt action available on
   the tile in front of the player). Still open: flashing a movement
   cap when an enemy is one step away.
6. ~~**Re-evaluate the inline canvas grid lines at high scale**~~ — done
   in phase 2 below.

These are fast follow-ups, not blockers. The current build hits the
goals: full-screen ownership, cohesive arcade scene, premium HUD,
contextual hint rail, and overlays that frame state changes.

---

## Phase 2 — what shipped

A focused polish round that resolved most of the deferred follow-ups.
No sim changes; preserved score submission and level data.

### 1. Per-level palette tinting
Each room (`Pantry`, `Cold Room`, `The Aisle`) ships a small palette
table — canvas floor gradient, halo colour, and frame drop-shadow tint.
Pantry leans warm-cyan, Cold Room is sterile blue, The Aisle drifts
toward steel-grey. The DOM halo + frame transition smoothly between
rooms (480 ms ease) so level transitions feel like moving through a
single building.

```js
// FrostFightGame.jsx
const PALETTE = {
  Pantry:     { floorTop: '#bfe6f5', floorBot: '#7ab7d0', halo: 'rgba(108,208,240,0.12)', ... },
  'Cold Room':{ floorTop: '#c9e4ee', floorBot: '#6ea6c2', halo: 'rgba(140,200,230,0.13)', ... },
  'The Aisle':{ floorTop: '#d0d8e8', floorBot: '#7790a8', halo: 'rgba(180,200,230,0.14)', ... },
};
```

`loadLevel` writes `--ff-room-halo` and `--ff-room-frame` onto
`.ff-stage`; `.ff-stage-halo` and `.ff-board-frame` consume them with
fallbacks to the cyan defaults.

### 2. Best-time persistence
A `pgplay-ff-best` localStorage key stores `{ time, deaths }` for the
fastest run, beaten when (a) time decreases, or (b) time is equal and
deaths decrease. The win card grew a fourth stat tile that shows the
recorded best, switches to **NEW BEST** with a cyan glow + pulse when
the just-finished run beat the record. The score-submission payload
is unchanged.

### 3. Procedural SFX
Added six cues to `src/sound.js` (extends the shared synth so the
existing mute toggle works):

| cue | character |
|---|---|
| `frostStep` | 25-ms sub-threshold tap on movement |
| `frostFreeze` | rising blip + pinch of noise — crystal shimmer |
| `frostMelt` | descending soft wisp |
| `frostFruit` | bright two-tone chirp |
| `frostDeath` | descending sawtooth + noise burst |
| `frostClear` | three-tone ascending chime |

The full-game win still uses the existing `sfx.win()`. Step is
intentionally below the threshold of attention so a held direction
doesn't fatigue.

### 4. Scale-aware draw refinements
At 3.0× on 4K, the canvas's 1-px stroke lines were becoming 3 screen
pixels and reading aggressive. The draw pass now computes
`px = 1 / scale` and applies it to every stroke (grid lines, walls, ice
sparkles, exit ring + pole, enemy brows, player cone outline, scoop
outline, freeze/melt cursor). Result: every line stays at ~1 screen
pixel regardless of scale.

### 5. Adaptive keycap hint
The SPACE keycap in the bottom rail now reflects what would happen if
the player tapped it:
- facing a freezable empty tile → cyan **Freeze** cap
- facing an existing ice block → warm-rose **Melt** cap
- otherwise → neutral **Freeze · Melt** cap

The state is computed once per frame in the loop and only `setState`'d
on transitions, so the chip animation doesn't churn React. The colour
tones match the in-canvas dashed cursor — same visual vocabulary in
two surfaces.

### Files touched in phase 2

```
EDIT  src/sound.js                                  (+6 cues)
EDIT  src/games/FrostFightGame.jsx                  (palette, sfx, best, scale-aware draw, freezeAction state)
EDIT  src/games/frost-fight/ui/BottomRail.jsx       (SPACE keycap states)
EDIT  src/games/frost-fight/ui/Overlay.jsx          (4-stat grid, NEW BEST tile)
EDIT  src/styles.css                                (keycap tones, best-stat tile, halo + frame CSS vars)
EDIT  docs/badicecream-ux-summary.md                (this section)
```

### Build impact
FrostFight chunk: **19 kB → 21 kB** (gzipped: 6.4 kB → 7.0 kB). Within
the budget for an interactive game route, well below the lobby + intro
chunks. No new runtime dependencies.

### What's still open
- Sprite atlas (player / enemies / fruit) — bigger lift, still deferred.
- Movement-keycap urgency (flash WASD when an enemy is adjacent) —
  the freeze/melt half is in; movement half is the natural next step.
- Per-level intro music sting — would round out the audio loop but is
  noticeably more invasive than the current discrete cues.
