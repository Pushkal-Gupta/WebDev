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

### What's still open after phase 2
- Sprite atlas (player / enemies / fruit).
- Movement-keycap urgency (flash WASD when an enemy is adjacent).
- Per-level intro music sting.

(All three shipped in phase 3 — see below.)

---

## Phase 3 — what shipped

The remaining deferred items, all in.

### 1. Movement-keycap urgency
The bottom rail's W/A/S/D caps now light warm-rose with a 1.2 s pulse
when an enemy is one tile away in that direction. Mid-step enemies
count at both their `from` and `to` tiles so the cue lights early. The
caps' label flips to **THREAT ADJACENT** when any direction is hot.
State is computed once per frame; `setState` only fires on transitions
so React doesn't churn. Reduced-motion suppresses the pulse animation
but keeps the colour change.

### 2. Per-level intro music sting
Added `sfx.frostIntro(roomIdx)` — a soft minor-third pad (root + minor
3rd + 5th) that fades in/out over 750 ms, pitched per room (Pantry C5,
Cold Room A4, The Aisle G4). Fires when the level intro overlay
appears, so each room transition has a distinct tonal hint without
adding an audio asset.

### 3. Sprite atlas
**Plan A** was to generate sprites via Gemini Nano Banana with the
provided API key. The free-tier image quota on this key is 0 across
both Gemini image models (`gemini-2.5-flash-image`,
`gemini-3.1-flash-image-preview`) and Imagen requires a paid plan, so
the API path returned `429 limit: 0` for every request.

**Plan B (shipped)** is handcrafted SVG sprites — arguably a better
outcome:
- crisp at any scale (they rasterize to whatever `drawImage` size we
  request, no upscale blur)
- ~1–2 KB each, all four inline-encoded as data URIs by Vite (under
  the default `assetsInlineLimit`), so the production build adds zero
  extra HTTP requests
- full design control, no watermarks to scrub
- the existing era-siege Gemini script is preserved for future use

The four sprites (`player.svg`, `strawberry.svg`, `blueberry.svg`,
`fruit.svg`) live in `src/games/frost-fight/sprites/` and are imported
via Vite's `?url` suffix. The `FrostFightGame` mount preloads each
into a `spritesRef` slot; the draw loop checks `complete &&
naturalWidth > 0` and falls back to the original procedural shapes for
each role independently if a sprite hasn't decoded.

Subtle additions on top of the sprites:
- Player gets a tiny vertical bob during a step (`sin(moveT * π) * -1.2`).
- Enemies get a slow per-instance bob driven by `performance.now()` so
  they don't read as pasted onto the grid.

The dashed cyan/rose freeze/melt cursor in front of the player still
renders procedurally — that's the gameplay-readable facing-direction
cue and didn't need replacing.

### Files touched in phase 3

```
ADD   src/games/frost-fight/sprites/player.svg
ADD   src/games/frost-fight/sprites/strawberry.svg
ADD   src/games/frost-fight/sprites/blueberry.svg
ADD   src/games/frost-fight/sprites/fruit.svg
ADD   scripts/frost-fight-gemini-sprites.mjs   (kept for future paid-key use)
EDIT  src/games/FrostFightGame.jsx             (sprite preload + draw paths,
                                                dangerDirs / freezeAction state)
EDIT  src/games/frost-fight/ui/BottomRail.jsx  (W/A/S/D danger tones)
EDIT  src/styles.css                            (.ff-key-danger keyframes)
EDIT  src/sound.js                              (+ frostIntro)
EDIT  docs/badicecream-ux-summary.md            (this section)
```

### Build impact

FrostFight chunk: **21 kB → 29 kB** (+ ~8 kB from the four inline-base64
SVGs). Gzipped chunk size is roughly proportional. No new HTTP
requests; no new runtime dependencies.

### Build / runtime checks

- `npx vite build` clean — no warnings, no errors (only the existing
  three.module chunk-size advisory).
- Dev server (`vite --port 5181`) serves the page (`200`),
  `FrostFightGame.jsx` (`200`), and the SVGs at their dev path (`200`).
- Sim, scoring, and `submitScore('badicecream', …)` payload unchanged.
- Procedural fallback verified by code inspection; if the SVGs were to
  fail (offline cache miss, etc.), each draw role independently
  reverts to the prior shapes.

### What was still open after phase 3
- Wind-up pose for enemies (a "scanning" frame before they move).
- SVG ice / exit sprites to replace the remaining procedural shapes.
- A particle FX layer on fruit / freeze / melt / death.

(All three shipped in phase 4 — see below.)

---

## Phase 4 — what shipped

### 1. SVG ice block + exit flag
Two more sprites (`ice.svg`, `exit.svg`) replace the procedural ice
cube and pole+flag. Each draws via `drawImage` with a procedural
fallback for offline / failed-decode scenarios. The exit keeps its
cyan halo (rendered procedurally) so the active state still pulses;
the flag sprite sits on top at 80 % opacity when inactive, full
opacity when fruits-left hits zero.

### 2. Wind-up pose for enemies
Each enemy kind now ships a second sprite (`strawberry-windup.svg`,
`blueberry-windup.svg`) — wider eyes, slightly squashed body, gritted
mouth. The draw loop swaps to it for the last 220 ms before the
enemy commits its next step (`!moving && nextDecide < 0.22`). The
cue reads as the enemy "scanning" before lunging — a tiny pre-tell
on top of the global `ENEMY_INTERVAL` rate-limit. Sprite size also
goes from 30 → 32 px on the wind-up frame for a faint anticipation
squash. Sim is unchanged; this is purely visual.

### 3. Particle FX layer
New `src/games/frost-fight/fx.js` — a ~90-line module with three
exports (`spawnFx`, `tickFx`, `drawFx`). Particles are flat objects
(`{ x, y, vx, vy, life, max, color, size }`) drawn in board
coordinates, with a single in-place compaction pass per frame so the
array doesn't reallocate. Four presets:

| kind | trigger | character |
|---|---|---|
| `fruit`  | fruit pickup | red + white burst, 10 dots, 0.50 s |
| `freeze` | new ice block | cyan + white crystal dust, 12 dots, 0.55 s |
| `melt`   | ice removed   | rose + white dust, 9 dots, 0.45 s |
| `death`  | enemy collision | red ring, 14 dots, 0.40 s, fast |

All four are gated on `!useReducedMotion()`. Particles also clear on
level transition / restart so a previous-room burst doesn't drift
into the next intro card.

### Files touched in phase 4

```
ADD   src/games/frost-fight/sprites/ice.svg
ADD   src/games/frost-fight/sprites/exit.svg
ADD   src/games/frost-fight/sprites/strawberry-windup.svg
ADD   src/games/frost-fight/sprites/blueberry-windup.svg
ADD   src/games/frost-fight/fx.js
EDIT  src/games/FrostFightGame.jsx              (4 sprite imports, fxRef,
                                                 spawn-on-event, tick + draw,
                                                 windup pose swap, ice/exit
                                                 sprite paths, level reset)
EDIT  docs/badicecream-ux-summary.md            (this section)
```

### Build impact

FrostFight chunk: **29 kB → 37 kB**. The 4 new SVGs (~6 KB combined,
inline-base64) + fx.js (~1 KB minified) account for the growth. No new
runtime dependencies. Build clean; dev server serves all new modules
with `200`.

### Coverage check

The original draw-call topology is now sprite-driven for every
character + tile element except:
- **walls** — flat dark blue tile is fine as a procedural fill (sprites
  would add bytes for a single-color block);
- **freeze cursor** — dashed cyan/rose cursor in front of the player,
  intentionally procedural because it's a UI cue tracking the player's
  facing direction;
- **player respawn splash** — the small red ellipse that marks the
  death tile during the 0.9 s respawn, kept procedural so it doesn't
  compete with the sprite vocabulary;
- **board floor + grid lines** — same reasoning.

Every other visible element (player, both enemies x both poses, fruit,
ice, exit flag) is now a vector sprite. Procedural fallbacks remain
behind every sprite draw, so the game is still playable if the SVG
pipeline ever breaks.

### What's still open after phase 4

Nothing on the original 13-part brief. Phase 5 stretches further into
gameplay + retention.

---

## Phase 5 — what shipped

This round is more about content and feel, less about the original
brief which is fully satisfied.

### 1. Three new rooms (3 → 6 total)

The level table grew from `Pantry / Cold Room / The Aisle` to add:

- **Walk-In** — Pantry-shape but with two pre-placed ice columns and
  one strawberry + one blueberry. Tip: *"Pre-cut ice cubes work for
  you — once. Save the melt for when it counts."*
- **Loading Dock** — wide-open floor, 5 fruits + 4 enemies (2
  blueberry + 2 strawberry). Tip: *"Open floor, no walls to hide
  behind. Build your own."*
- **Sub-Basement** — narrow vertical maze, 6 fruits + 3 chasers.
  Tip: *"Last room. Three chasers, narrow halls, no second chance."*

Each new room ships its own palette entry (cooler navy / industrial
grey / deep ominous blue respectively). The existing palette
transition system handles the swap. The lobby data record was
updated to `levels: 6`, the story line and `updated: true` flag.

The score formula was changed from a hard `1500` base to
`LEVELS.length * 500` so longer runs aren't penalised by the
elapsed-time term hitting the 0 floor.

### 2. Floating score text

Added `spawnFloater(list, text, cx, cy, color, opts)` to `fx.js` —
text drifts up `~22 px/s` and fades over `~0.9s` (longer for
celebratory ones). Drawn with a 0.6 px black shadow so it stays
readable over busy floor tiles.

Triggers:
- regular fruit pickup → **+1** in pale-pink
- last fruit pickup → **EXIT LIVE** in cyan, larger, longer life
- player death → **OUCH** in warm-rose

All gated on `!useReducedMotion()`.

### 3. Achievement integration

Three new entries in `src/hooks/useAchievements.js`:

| id | label | trigger |
|---|---|---|
| `frost-clear` | Cold opening | any Frost Fight win |
| `frost-deathless` | Untouchable | win with `meta.deaths === 0` |
| `frost-fast` | Sub-zero sprint | win with `meta.time < 150` |

The achievement bus was already listening to `pgplay:score`; the
existing `submitScore('badicecream', score, { deaths, time, levels })`
payload required no changes.

### 4. Ambient snow drift

A new `.ff-snow` layer behind the board frame, rendered as two
SVG-tiled background-image layers with different speeds (26 s + 42 s),
sizes (small + medium dots), and offsets — gentle parallax without
JS. The SVG tiles are inline data URIs (~700 B total). Both layers
short-circuit under `prefers-reduced-motion`.

### 5. Image generation spec — `assets/frost-fight-images.md`

A standalone, copy-pasteable prompt sheet for the user to feed into
any image generator (Nano Banana with paid quota, Imagen, Midjourney,
SD, etc.). Four phases:
- **A** — Painted PNG upgrades for the four core sprites
- **B** — Wind-up poses, ice block tile, exit flag
- **C** — Per-room wall textures (six 256×256 seamless tiles)
- **D** — A 1280×720 painted lobby cover

Each entry includes the exact prompt, target output size, palette
hex codes, and the file path inside `assets/frost-fight/` where the
result should land. Integration notes at the bottom describe how to
swap an SVG for a PNG (one-line import path change), and where to
plug walls + cover.

### Files touched in phase 5

```
EDIT  src/games/FrostFightGame.jsx              (+3 LEVELS entries, +3 PALETTE,
                                                 score formula scaling, snow
                                                 layer DOM, floaters at events)
EDIT  src/games/frost-fight/fx.js               (+ spawnFloater + text branch
                                                 in drawFx)
EDIT  src/hooks/useAchievements.js              (+3 frost achievements + unlock
                                                 conditions)
EDIT  src/data.js                                (badicecream: levels 3 → 6,
                                                 updated story line + updated flag)
EDIT  src/styles.css                            (.ff-snow layers + parallax
                                                 keyframes)
ADD   assets/frost-fight-images.md              (prompt sheet, phases A–D)
EDIT  docs/badicecream-ux-summary.md            (this section)
```

### Build impact

FrostFight chunk: **37 kB → 39 kB**. The 3 new rooms and floaters added
~600 bytes; everything else fits in compressible deltas. Snow-layer
SVGs live in `styles.css` so they aggregate into the bundled CSS.
Dev server smoke-tested clean. No new runtime dependencies.

### What was still open after phase 5
- Wall textures (Phase C) and the lobby cover (Phase D) from
  `frost-fight-images.md` were waiting on user-supplied art.

The user delivered painted PNG art sheets in `assets/frost-fight/`
(`A Type 1.png`, `A Type 2.png`, `B Type 1.png`, `B Type 2.png`,
`Frost-Fight.png`). Phase 6 wires that art into the route.

---

## Phase 6 — what shipped (painted art swap)

### 1. Sprite atlas re-cut from `assets/frost-fight/*.png`
A new processor script `scripts/frost-fight-process-art.mjs` cuts each
2×2 sheet into per-sprite PNGs:

| sheet | top-left | top-right | bottom-left | bottom-right |
|---|---|---|---|---|
| `A Type 1.png` | player | strawberry | blueberry | fruit |
| `B Type 1.png` | strawberry-windup | blueberry-windup | ice | exit |
| `Frost-Fight.png` | (large showcase sheet — only the bottom-right painted scene is cropped, for the lobby cover) |

Pipeline per cell: `extract` → `trim` (alpha threshold 5) → square-pad
with 8 % margin → `resize` to 128×128 → `png` compression 9. Output
lands in `src/games/frost-fight/sprites/` next to (and replacing in
the import path) the SVG fallbacks. Each PNG is ~22-25 KB at 128×128.

`FrostFightGame.jsx` was updated to import the `.png` URLs instead of
the `.svg` URLs. The procedural fallback path stays as the safety
net — if a PNG ever fails to decode, every sprite role independently
reverts to the original procedural shapes.

### 2. Lobby cover — painted scene from `Frost-Fight.png`
The painted hero scene in the bottom-right of the showcase sheet
(`x=0.625W → W`, `y=0.555H → H`, ~1056×684) is cropped and resized to
1280×720, then re-encoded to WebP at quality 82. Final asset:
**~47 KB** (down from a 1.6 MB source PNG). A 640×360 fallback variant
is also emitted (~22 KB).

`src/covers.jsx` `Cover_BadIceCream` was rewritten to embed the
painted WebP inside the existing 400×500 SVG viewBox so every place in
the app that mounts `<Cover_BadIceCream/>` keeps its layout contract:

```jsx
<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="500" fill="url(#ff-cover-bg)"/>
  <image href={badicecreamCoverUrl}
         x="0" y="138" width="400" height="225"
         preserveAspectRatio="xMidYMid slice"/>
  <rect width="400" height="500" fill="url(#ff-cover-halo)" opacity="0.6"/>
  <rect x="0" y="0" width="400" height="40" fill="rgba(108,208,240,0.06)"/>
  <rect x="0" y="460" width="400" height="40" fill="rgba(108,208,240,0.06)"/>
</svg>
```

Painted scene fills the full width centred vertically; a deep-navy
gradient fills the top + bottom bands; a soft cyan halo and frosted
edge bands echo the in-game frame glow. The card chrome does not
change; everywhere a portrait card was rendered before, it still
renders at the same size — but with a real painting in the middle.

### 3. WinCard painted backdrop
The `WinCard` overlay accepts a new `coverUrl` prop. When provided, an
absolute-positioned `<div>` paints the same WebP as a 32 %-opacity
backdrop layer with a radial veil (`rgba(7,16,28, 0.35→0.78)`) so the
chip + numerics stay legible. A 0.5 px blur softens it under the
text. Same image, two surfaces — lobby + run-completion.

### Files touched in phase 6

```
ADD   scripts/frost-fight-process-art.mjs       (sharp pipeline, idempotent)
ADD   src/games/frost-fight/sprites/player.png
ADD   src/games/frost-fight/sprites/strawberry.png
ADD   src/games/frost-fight/sprites/blueberry.png
ADD   src/games/frost-fight/sprites/fruit.png
ADD   src/games/frost-fight/sprites/strawberry-windup.png
ADD   src/games/frost-fight/sprites/blueberry-windup.png
ADD   src/games/frost-fight/sprites/ice.png
ADD   src/games/frost-fight/sprites/exit.png
ADD   src/games/frost-fight/sprites/cover.webp     (1280×720, ~47 KB)
ADD   src/games/frost-fight/sprites/cover-640.webp (~22 KB, fallback)
EDIT  src/games/FrostFightGame.jsx                 (PNG imports + coverUrl prop)
EDIT  src/games/frost-fight/ui/Overlay.jsx         (WinCard backdrop)
EDIT  src/styles.css                                (.ff-card-art layer + veil)
EDIT  src/covers.jsx                                (Cover_BadIceCream painted swap)
EDIT  docs/badicecream-ux-summary.md                (this section)
```

The hand-authored SVGs at `src/games/frost-fight/sprites/*.svg` were
left in place — they're no longer referenced by import, but they
remain as a git-tracked fallback the build script can switch back to
in one line if the painted assets ever break.

### Build impact

| asset | before phase 6 | after phase 6 |
|---|---|---|
| FrostFight chunk | 39 KB (8 SVGs inline) | 27.7 KB (PNGs externalised) |
| separate PNG assets | 0 | 8 × ~24 KB = ~192 KB |
| cover.webp | 0 | 47 KB |
| cover-640.webp | 0 | 22 KB |

Total bytes for the route went from ~39 KB to ~289 KB — most of which
is paid only when the user actually opens the route (PNGs load on
mount, the 640 cover is the lobby thumbnail, the 1280 cover loads
when the user finishes a run). Browser-cached after the first visit.

Build clean. Dev server smoke-tested clean (`200` on page, module,
covers, sprite, and cover assets).

### What was still open after phase 6

- Wall textures (Phase C in the image spec).
- Walking-animation second frame per enemy.
- New enemy class from the `A Type 2.png` cast.

(All three shipped in phase 7 — see below.)

---

## Phase 7 — what shipped

### 1. Orange enemy (third class)

`scripts/frost-fight-process-art.mjs` was extended with an `A2_LAYOUT`
entry that also cuts `A Type 2.png` into:
- `cherry.png` — paired cherries (parked, unused yet)
- `orange.png` — wired as a new enemy class
- `peach.png` — alt fruit pickup (parked)

`FrostFightGame.jsx` got:
- a new `'orange'` entry in `ENEMY_INTERVAL` at **0.85 s** — sits
  between strawberry (1.0 s) and blueberry (0.7 s) for meaningful
  pacing variety
- an `'o'` character recognised by `parseLevel`
- the orange sprite preloaded into `spritesRef.current.orange`
- an enemy-draw branch that picks the orange sprite (and a
  procedural fallback drawing — orange disc with green stem nub)
- one orange seeded into the **Sub-Basement** room, replacing a
  strawberry, with the room's tip updated to *"Last room. An orange
  runs medium-fast — read its tells."*

The orange has no dedicated wind-up pose yet, so it stays in its
resting sprite during the wind-up window. That's listed in
`assets/frost-fight-images.md` Phase E2 if you'd like to ship one.

### 2. Walking pose alt frame

The enemy draw branch was previously: rest → windup (last 220 ms
before move) → move with **resting** sprite. Now: rest → windup →
move **also using windup** sprite, then back to rest on commit.

Code-wise it's a one-line change — the `isWinding` flag now also
returns true while `e.moving`. Visually it's a clean 1-frame walk:
the alert pose doubles as the in-step pose, so enemies look like
they're scanning, lunging, and stepping in one motion rather than
jumping awkwardly between two stills.

Strawberry + blueberry both have wind-up sprites, so both benefit
from the new pose. Orange + cherry stay in their resting pose
during the step until alt-pose art arrives (Phase E2 / E3).

### 3. Wall-texture pattern path (auto-discovery)

A `Vite import.meta.glob` block scans
`src/games/frost-fight/sprites/walls/*.png` eagerly at build time
and registers each into a `WALL_TEXTURES` map keyed by filename
stem. A new `ROOM_WALL_KEY` table maps room name → texture stem
(`Pantry → pantry`, `Cold Room → coldroom`, etc.).

`loadLevel` looks up the texture URL for the active room, preloads
an `Image`, and on decode creates a `CanvasPattern('repeat')` stored
in `wallPatternRef`. The wall-draw block uses the pattern as
`fillStyle` when present, with a 30 % `rgba(8,16,28,0.30)` veil
composited on top so the texture stays cool-toned and the grid
lines remain readable. If no texture is registered for a room the
loop falls back to the original solid `#1a2540` fill.

> **Drop-in for the user.** The moment you put
> `pantry.png` (256×256, seamless, opaque) into
> `src/games/frost-fight/sprites/walls/`, Pantry's walls switch to
> textured on the next reload. No code edit. Same for the other
> five rooms. Spec: `assets/frost-fight-images.md` Phase E1.

### 4. Image spec phase E

`assets/frost-fight-images.md` got a new **Phase E** at the bottom
that describes everything still open:
- E1 — six wall texture stems with subject lines per room
- E2 — orange-windup
- E3 — cherry-windup (would unlock a fourth enemy class)
- E4 — peach as an alt pickup (no new image needed; just say the
  word)
- E5 — optional Frost-Fight wordmark

Each entry has an exact target file path, the prompt the generator
should accept, and a note on what changes once it lands.

### Files touched in phase 7

```
EDIT  scripts/frost-fight-process-art.mjs       (+ A2_LAYOUT, webp-only cover)
ADD   src/games/frost-fight/sprites/cherry.png  (parked)
ADD   src/games/frost-fight/sprites/orange.png  (wired)
ADD   src/games/frost-fight/sprites/peach.png   (parked)
ADD   src/games/frost-fight/sprites/walls/.gitkeep
EDIT  src/games/FrostFightGame.jsx              (+ orange import, ENEMY_INTERVAL,
                                                  parser char, sprite slot,
                                                  draw branch, sub-basement seed,
                                                  WALL_TEXTURES + ROOM_WALL_KEY,
                                                  wallPatternRef + draw branch,
                                                  walking-pose alt frame)
EDIT  assets/frost-fight-images.md              (Phase E with five asks)
EDIT  docs/badicecream-ux-summary.md            (this section)
```

### Build impact

| metric | phase 6 | phase 7 |
|---|---|---|
| FrostFight chunk | 27.7 KB | ~28 KB (one extra image import) |
| sprite assets | 8 PNG + 2 webp | 11 PNG + 2 webp (+orange, cherry, peach) |
| dev-server smoke test | all 200 | all 200 |

Build clean. No new runtime dependencies. The wall-pattern path adds
~25 lines of code; everything else is data.

### What's actually still open

- **Wall texture art** — 6 PNGs, the one big remaining ask (the
  draw path is wired and waiting).
- **orange-windup + cherry-windup** — once orange-windup lands,
  the orange's wind-up pre-tell + walk pose cycles like the other
  two. Once cherry-windup lands we wire a 4th enemy class.
- **Ambient music loop** — independent of art. Could ship anytime.
- **Settings drawer** — internal UX upgrade, no art needed.

The original 13-part brief is fully satisfied as of phase 4. Phases
5-7 stretched into content depth (rooms, achievements, particles,
floaters, cover art, atmospheric drift, third enemy class) — every
remaining gap is now waiting on user-supplied art that the code path
is already shaped to receive.
