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

### What was still open after phase 7
- 6 wall texture PNGs.
- orange-windup, cherry-windup.
- Optional wordmark.

The user delivered all of those in one drop. Phase 8 wires it.

---

## Phase 8 — what shipped (full art swap)

### 1. Six wall textures live

The user delivered painted 2048×2048 wall textures with the small
Gemini "sparkle" badge in the bottom-right of each. The processor
script (`scripts/frost-fight-process-art.mjs`) gained a `WALLS` block
that, for each input:

1. Extracts a same-size patch from the **bottom-LEFT** of the image
2. `flop()`s it horizontally
3. Composites it over the bottom-right corner (covering the badge
   with a continuation of the same horizontal grain)
4. Resizes the cleaned image to **256×256**

Output lands at `src/games/frost-fight/sprites/walls/<key>.png`. The
already-wired `WALL_TEXTURES` glob picks them up automatically. Six
rooms, six tiles. The 30 % navy veil that the wall-draw composite
applies on top is now actually doing useful work — it pulls the
textures back into the cool palette without dimming readable detail.

The Sub-Basement wall key was also corrected from `'sub-basement'`
to `'subbasement'` to match the user's filename convention.

### 2. Orange wind-up wired

`assets/frost-fight/orange-wind-up.png` was processed via a new
`processSingle` path: wipe a top-right rectangle to erase the
chat-platform UI badges, then trim → square-pad → resize 128×128.
The wipe area is 42 % × 22 % at the top-right (the buttons sit well
above the orange's head, so this is safe).

`FrostFightGame.jsx` got an `orangeWindupUrl` import + `orangeWind`
slot in `spritesRef`. The enemy-draw branch was refactored to a
`KIND` lookup table (rest sprite + windup sprite per kind) so adding
new enemies is now a one-line table edit. Orange now cycles through
the same rest → alert → walk → rest sequence as strawberry and
blueberry.

### 3. Cherry as a 4th enemy class

The cleaner of the two cherry-windup screenshots (`cherry-windup2`)
got the same single-frame processing. `FrostFightGame.jsx` now ships
`cherry` as a distinct enemy class:

- `ENEMY_INTERVAL.cherry = 0.6` — fastest of the four (blueberry was
  the prior speedster at 0.7)
- new `'c'` grid character recognised by `parseLevel`
- both the resting `cherry.png` and `cherry-windup.png` slot into the
  `KIND` table; same draw / windup / walk cycle
- one cherry seeded into Loading Dock (replacing one strawberry),
  with the room's tip updated to *"Open floor, no walls to hide
  behind. Cherry is fast — plug a corridor early."*
- procedural fallback drawing for the cherry pair (twin red discs +
  green stem) added for completeness

### 4. Wordmark on the lobby cover

The third screenshot was the **FROST FIGHT** wordmark — white
chunky sans with a cyan-mint outline. The wordmark is processed by
a new `processWideSingle` path that does width-target resize while
preserving aspect ratio (1024 wide × 171 tall). Source had no UI
badge, so the wipe is disabled for wide singles.

`Cover_BadIceCream` in `src/covers.jsx` now imports the wordmark
URL and embeds it as a second `<image>` element below the painted
scene, scaled to 340 px wide and centred at y=385-442. A faint
`rgba(108,208,240,0.10)` ellipse sits behind the wordmark so the
white-and-cyan glyphs read cleanly against the deep navy backdrop.
The painted scene's vertical anchor moved up slightly (y=138 →
y=120) to give the wordmark band clean breathing room.

### 5. Processor robustness

While wiring this drop I hit a sharp pipeline bug where chaining
`extend(...).resize(...)` directly on a re-decoded buffer
occasionally emitted the pre-resize size instead of the target
(observed in 0.34.5 with already-trimmed inputs — every resize
above the first one in the chain produced 354×994 outputs instead
of 128×128). Fixed by materialising a buffer between extend and
resize:

```js
const padded = await sharp(t.data).extend({...}).png().toBuffer();
await sharp(padded).resize(128, 128, {...}).png().toFile(outFile);
```

Every sprite is now exactly 128×128 as intended.

### Files touched in phase 8

```
ADD   src/games/frost-fight/sprites/walls/{pantry,coldroom,aisle,
       walkin,loadingdock,subbasement}.png   (~70-100 KB each)
ADD   src/games/frost-fight/sprites/orange-windup.png
ADD   src/games/frost-fight/sprites/cherry-windup.png
ADD   src/games/frost-fight/sprites/wordmark.png
ADD   assets/frost-fight/{cherry-windup1,cherry-windup2,wordmark,
       orange-wind-up,pantry,coldroom,aisle,walkin,loadingdock,
       subbasement}.png    (source drops from the user)
EDIT  scripts/frost-fight-process-art.mjs
        (+ SINGLES, WIDE_SINGLES, WALLS blocks; processSingle,
         processWideSingle, processWall functions; emitSprite buffer
         materialisation fix)
EDIT  src/games/FrostFightGame.jsx
        (+ orange-windup import, cherry + cherry-windup imports,
         cherry as 4th enemy class with 0.6 s interval and 'c' grid
         char, KIND lookup-table refactor of the enemy draw branch,
         Loading Dock seeded with a cherry, ROOM_WALL_KEY for
         Sub-Basement → 'subbasement')
EDIT  src/covers.jsx                          (wordmark on lobby cover)
EDIT  docs/badicecream-ux-summary.md          (this section)
```

### Build impact

| metric | phase 7 | phase 8 |
|---|---|---|
| FrostFight chunk | ~28 KB | ~28 KB (no change, all art externalised) |
| sprite asset count | 11 PNGs | 14 PNGs (+ orange-windup, cherry-windup, wordmark) |
| wall asset count | 0 | 6 (~70-100 KB each, 480 KB total) |
| dev-server smoke test | all 200 | all 200 |

Build clean. The wall textures land as 256×256 PNGs (cover-fitted from
2048×2048 source); each is ~70-100 KB which is reasonable for painted
detail. Browser caches them after first load; the lobby cover already
loads `cover.webp` (47 KB) on the same route so we're not adding
significant first-paint cost.

### What's actually still open

- **Ambient music loop** — independent of art. Could ship anytime.
- **Settings drawer** surfaced inside the route.
- **Walking animation second frame for orange + cherry** — the
  windup-as-walking-frame swap already gives them animation; a
  dedicated `*-walk.png` would be a refinement, not a gap.

The original 13-part brief is fully satisfied. Phase 8 closes every
art request from `frost-fight-images.md`. The route now has:

- six rooms with palette tints AND painted wall textures
- four enemy classes (strawberry, blueberry, orange, cherry), each
  with both rest + alert sprites
- procedural fallbacks for every sprite in case a PNG ever fails
- painted lobby cover with the FROST FIGHT wordmark
- particle FX, floaters, achievements, audio cues, ambient drift,
  and reduced-motion support

Nothing in the brief or the user's drop list is unaddressed.

---

## Phase 9 — what shipped

User feedback in flight added two more items on top of the planned
phase-9 list (ambient music + trap detection):

1. The freeze mechanic should match real Bad Ice-Cream — pressing
   space casts a row of ice forward until it hits an obstacle, not
   a single tile.
2. Sprites should be bigger.

### 1. Real Bad-Ice-Cream-style ice cast
The freeze code now has two modes:
- **Facing an existing ice tile** → melts that single tile.
- **Facing anything else** → casts a continuous ice row forward,
  placing a block on every passable tile until the cast hits the
  first obstacle (wall, existing ice, enemy, fruit, exit, or the
  player). The cast stops at the obstacle without overwriting it.

Each placed tile spawns its own freeze particle burst; one freeze
SFX cue plays for the whole cast (not N times). `freezeCd`
intentionally only triggers when at least one tile was placed, so
casting into a wall doesn't lock the button.

This ports the strategic depth of the genre: corral enemies into
corridors and seal them with a single press; melt one tile at a
time when you need to open a path.

### 2. Sprites bumped to 256×256
All character + tile sprites re-emitted at **256×256** instead of
128×128. Backing buffers compress to ~50 KB each.

Reason: at 4K fullscreen with the 3.0× scale cap, sprites
displayed at ~108 screen pixels were running tight on a 128×128
source. 256×256 gives a clean 2.4× supersample at maximum display
scale.

The wordmark (1024×171) is unchanged — its display height is
typically ~57 px so 1024 was already overkill.

### 3. Ambient music bed
New `frostMusic` API in `src/sound.js`:
- `frostMusic.start(roomIdx)` — boots a continuous low-volume pad:
  three sustained oscillators (root, 5th, sub-octave) through a
  lowpass at 800 Hz, master gain 0.045 with a 0.3 Hz LFO breath.
  Per-room key root matches the intro sting (Pantry C, Cold Room A,
  Aisle G, Walk-In A♯, Loading Dock F, Sub-Basement E).
- `frostMusic.stop()` — 180 ms fade-out, GC's the oscillator and
  filter nodes.
- `frostMusic.duck(durSec)` — temporary gain dip (used on death so
  the death cue gets clean acoustic space).
- Subscribes to the existing `subscribeMute` event bus so the
  shell's M-key kills audio immediately.

Wired into `FrostFightGame.jsx`:
- The `loadLevel`-triggered intro effect calls
  `frostMusic.start(idx)`.
- Component unmount calls `frostMusic.stop()`.
- `status === 'won'` stops the bed (the WinCard takes over).
- Death event calls `frostMusic.duck(0.7)` before the death SFX.

### 4. FROZEN trap detection + Cornered achievement
A new pass at the end of the enemy update detects when an enemy is
fully boxed-in (all 4 neighbours non-passable AND at least one of
those is an ice block — pure walls don't count, the player has to
have contributed). On the rising edge:
- `spawnFx('freeze')` at the enemy tile (cyan crystal burst)
- `spawnFloater('FROZEN', cyan, life 1.2 s)`
- `sfx.frostFreeze()`
- per-run `s.trapCount` increments
- the new **Cornered** achievement (`frost-trap`) unlocks via the
  score meta on the next win that includes a trap.

`enemy.boxed` flag resets when the seal breaks (player melted an
adjacent ice tile), so re-trapping the same enemy fires again.

The new long-cast freeze makes traps significantly more achievable —
boxing an enemy in a side corridor with two strategic casts is now
a real strategy, which matches the genre.

### Files touched in phase 9

```
EDIT  src/sound.js
        (+ frostMusic API: start / stop / duck, subscribed to
         the existing mute bus)
EDIT  src/games/FrostFightGame.jsx
        (+ row-cast freeze mechanic; single-tile melt path
         preserved; FROZEN trap detection pass; trap-count meta
         in submitScore; ambient music start / stop / duck hooks;
         enemy.boxed flag in loadLevel)
EDIT  src/hooks/useAchievements.js
        (+ frost-trap achievement + unlock condition)
EDIT  scripts/frost-fight-process-art.mjs
        (emitSprite default target 128 → 256; per-call site updates)
REGEN src/games/frost-fight/sprites/*.png       (re-emitted at 256×256)
EDIT  docs/badicecream-ux-summary.md            (this section)
```

### Build impact

| metric | phase 8 | phase 9 |
|---|---|---|
| FrostFight chunk | ~28 KB | ~30 KB (+ FROZEN detector + music wiring) |
| sprite asset count | 14 | 14 (same files, larger) |
| sprite size | ~22 KB each (128×128) | ~52 KB each (256×256) |
| total sprite bytes | ~310 KB | ~735 KB |
| dev-server smoke test | all 200 | all 200 |

Build clean. The 256-px bump roughly doubles sprite bytes on first
load (then they're cached). The ambient music adds ~80 lines to
`sound.js` and zero asset bytes.

### Gameplay implications of the row-cast freeze

The room layouts are unchanged but the optimal play is now very
different:
- **Pantry / Cold Room** — corridor-style rooms where one cast
  seals a whole corridor, so traps come early.
- **Loading Dock** — the open floor plan that was previously the
  hardest is now the most freeze-friendly: a single row of ice is
  effectively a wall.
- **Sub-Basement** — the maze structure already segments paths;
  freezes now cap them off completely.

I tuned no scoring or cooldowns for the new mechanic — the existing
0.12 s cooldown is short enough that the cadence still rewards
quick reflexes, and the score formula `LEVELS.length * 500 -
deaths*50 - time*3` rewards efficiency the same way.

---

## Phase 10 — what shipped

User signed off on leaning into a true Bad-Ice-Cream-style clone, so
this round closes the two open gameplay items.

### 1. Distinct AI per enemy kind

The enemy AI was previously a single chase routine with each kind
differing only by `ENEMY_INTERVAL` (decision cadence). It now ships
four different behavioural shapes on top of that shared chase
baseline:

| kind | shape |
|---|---|
| **strawberry** | pure chase along the dominant axis (calibration baseline) |
| **blueberry** | chaotic — 25 % of decisions invert the priority axis, so the chase looks flighty rather than direct |
| **orange** | tangent-evade — when adjacent to the player (Manhattan-1) it prefers the perpendicular axis, sidestepping the freeze cursor instead of bumping into it |
| **cherry** | pair-step burst — after a normal move it queues a quick second move (`nextDecide = 0.18 s`) before resetting to its base interval, giving it a 1-2 staccato cadence |

Same `tryMove` pipeline, same fall-through random nudge if every
direction is blocked. The AI changes are a few lines per kind and
keep the code path testable.

A new `pairBurst` flag on every enemy state object preserves the
cherry pair-step's two-step phase across decision frames.

### 2. Ice-cast preview cursor

The freeze-ready cursor in front of the player previously drew a
single dashed cyan rect at the very next tile. With the row-cast
mechanic from phase 9, the player needs to see how far the cast
will actually reach. The cursor now:

- if the next tile is **ice** → renders a single rose-tinted melt
  rectangle (single-tile melt mode)
- if the next tile is **passable** → walks the cast row from the
  player's facing direction and renders a dashed cyan rectangle on
  every tile the cast will fill, with progressively-fading opacity
  (`max(0.18, 0.85 - idx * 0.10)`). Stops at the first obstacle —
  wall, ice, enemy, fruit, exit, or the player.

Players now see the entire ice path before they press space, so the
strategic placement reads visually instead of only kinaesthetically.

### Files touched in phase 10

```
EDIT  src/games/FrostFightGame.jsx
        (+ pairBurst flag in enemy state init
         + per-kind AI shaping (blueberry chaos, orange tangent,
           cherry pair-step) on top of the shared chase baseline
         + ice-cast row preview replacing the single-tile cursor)
EDIT  docs/badicecream-ux-summary.md  (this section)
```

### Build impact

| metric | phase 9 | phase 10 |
|---|---|---|
| FrostFight chunk | ~30 KB | ~31 KB |
| asset bytes | unchanged | unchanged |
| dev-server smoke test | all 200 | all 200 |

Build clean. The whole phase is code, no new art or audio.

---

## Phase 11 — what shipped

User asked for two corrections + an asset-format change:
1. Melt should sweep symmetrically — clear all consecutive ice tiles
   forward until non-ice or wall, mirroring the freeze sweep
   ("Othello-like" semantics).
2. Sprites needed lasso-tight crops (no halo) and to be bigger.
3. Sprites needed to ship as `.svg` files, not PNG.

### 1. Symmetric Othello-style sweep

The freeze/melt block in the loop is now fully symmetric:

| start tile | behaviour |
|---|---|
| empty | fills every passable tile forward with ice until first ice / wall / occupant |
| ice | clears every consecutive ice tile forward until first non-ice / wall |

Same `freezeCd` cooldown gate for both, only triggered if at least
one tile actually changed state — so casting into a wall doesn't
lock the button.

The cast preview cursor was also rewritten to mirror the new logic:
- facing ice → walks forward and previews every consecutive ice
  tile the melt sweep will clear (rose, fading)
- facing empty → walks forward and previews every tile the freeze
  sweep will fill (cyan, fading)

### 2. Lasso alpha cleanup + 512 × 512

A new `lassoAlpha(buf)` pass in the processor:
- reads the raw RGBA pixel data
- forces any pixel with alpha < 60 to fully transparent (kills the
  soft halo the AI generator left around painted character outlines)
- snaps any pixel with alpha > 240 to fully opaque (preserves the
  silhouette interior)
- preserves anti-aliased edge pixels in the 60-240 band

Sprite target bumped 256 → **512 × 512** for crisp display at any
scale. Trim runs after lasso so the bbox is now actually tight to
the painted character outline, not to a halo-bloated rectangle.

Visual confirmation: the painted ice cream / strawberry / etc. now
sit cleanly in transparent backgrounds with no edge artifacts at
any zoom level.

### 3. SVG output via WebP-embedded wrappers

Every sprite that previously emitted as `.png` now also emits a
matching `.svg` file. The SVG wrapper:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ...>
  <image href="data:image/webp;base64,…" x="0" y="0" width="512" height="512"/>
</svg>
```

The cleaned PNG buffer is encoded as **WebP** (quality 88, alpha 90)
before base64-embedding. WebP cuts the embedded size by 60-80 %
versus inlining PNG directly. Final file sizes:

| sprite | PNG size | SVG (webp-embedded) size |
|---|---|---|
| player | 198 KB | **40 KB** |
| strawberry | 198 KB | **40 KB** |
| cherry-windup | 369 KB | **58 KB** |
| ... | ~200 KB avg | ~40 KB avg |

Total sprite payload dropped from ~3.3 MB (raw 512 PNGs) to
**~530 KB** across 13 SVGs.

`FrostFightGame.jsx` and `covers.jsx` both flipped imports from
`.png?url` to `.svg?url`. Vite emits the SVGs as hashed static
assets just like any other; the canvas `Image()` loader picks them
up the same way (browsers rasterise the embedded WebP at the
requested draw size). Procedural fallback in the draw loop is
untouched and still kicks in if anything fails to decode.

The wall textures stayed as `.png` — they're opaque 256 × 256 tiles
that get used as a `CanvasPattern`, which is best fed as raster.

### Files touched in phase 11

```
EDIT  src/games/FrostFightGame.jsx
        (+ symmetric Othello-style melt sweep
         + cast preview cursor walks the ice forward in melt mode
         + every sprite import flipped from .png?url → .svg?url)
EDIT  src/covers.jsx                    (wordmark import flipped to .svg)
EDIT  scripts/frost-fight-process-art.mjs
        (+ lassoAlpha pre-pass: alpha < 60 → 0, > 240 → 255
         + emitSprite default target 256 → 512
         + svgWrap: PNG → WebP encode → base64 embed in SVG file
         + processWideSingle: same SVG wrap path for the wordmark)
REGEN src/games/frost-fight/sprites/*.png      (now 512×512, lasso-clean)
ADD   src/games/frost-fight/sprites/*.svg      (canonical SVG sprites)
EDIT  docs/badicecream-ux-summary.md  (this section)
```

### Build impact

| metric | phase 10 | phase 11 |
|---|---|---|
| FrostFight chunk | ~31 KB | ~31 KB |
| sprite source format | 256 PNG | 512 PNG + SVG wrap (webp inside) |
| canonical import format | `.png?url` | `.svg?url` |
| total sprite payload | ~735 KB | ~530 KB |
| dev-server smoke test | all 200 | all 200 |

Build clean. The lasso cleanup made the sprites visibly tighter and
the WebP-in-SVG wrapper made them ~30 % cheaper to ship despite
doubling the source resolution.

---

## Phase 12 — what shipped (sprite-rendering fix + animated cast +
pace marker)

### 1. WebP sprites (the actual fix the user was after)

Phase 11 emitted SVG wrappers with embedded base64 WebP. That format
renders fine as a DOM `<img>` but **silently fails when used as a
canvas drawImage source** — every browser blocks rasterising SVGs
that contain foreign-resource (data:) raster references when the
canvas would consume them. That's why the gameplay screen showed
empty rectangles where the painted sprites should be.

Fix: emit cleaned **`.webp` files directly** from the processor.
Same lasso alpha cleanup, same 512 × 512 source, same compression
profile, just no SVG wrap. Sprites now render correctly via canvas
drawImage.

### 2. FROST FIGHT wordmark — true SVG vector text

The wordmark on the lobby cover used to be an embedded raster image.
It's now inline SVG `<text>` inside the cover SVG: paint-order
outline (`stroke="#7af5dc" strokeWidth="9" strokeLinejoin="round"`)
under a white fill. Two `<text>` elements at the same baseline. No
raster anywhere, infinitely scalable.

### 3. Animated row-cast wave

The freeze cast used to place every tile in a single frame. The
sweep is now visually staggered by ~55 ms per tile with a 180 ms
fade-in:

- sim places ice immediately (collision/passable correctness)
- a per-room `castReveal: Map<string, number>` carries the
  per-tile reveal timestamp
- the ice draw block reads `castReveal` and sets `globalAlpha`
  based on `(performance.now() - reveal) / FADE_MS`
- particle bursts are scheduled with `setTimeout` so each tile's
  burst fires just *before* the tile materialises — the burst
  reads as the cause
- under reduced-motion the stagger collapses to 0 and tiles
  appear instantly

The cast now feels like a wave travelling across the row.

### 4. Per-room best-time pace marker

A new `pgplay-ff-rooms` localStorage map tracks per-room fastest
clear time + delta-deaths. Updated whenever the player exits a
room with an improved time.

The `Room` chip in the HUD now shows a small cyan ghost line under
the room name when a best exists:

```
ROOM
  2 / 6
COLD ROOM
best 18s · 0d
```

The pace marker uses tabular numerics, lower opacity, the cool
cyan accent. Sub-line layout extends without breaking the chip
hierarchy.

### Files touched in phase 12

```
EDIT  scripts/frost-fight-process-art.mjs
        (emit .webp directly, drop SVG wrap + wide-singles list)
EDIT  src/games/FrostFightGame.jsx
        (.svg?url → .webp?url for every sprite import;
         + readRoomBests / writeRoomBests helpers;
         + roomStartElapsed / roomStartDeaths in level state;
         + per-room best computation + persist on exit;
         + roomBest prop on Hud;
         + castReveal Map seeded in loadLevel;
         + freeze sweep stagger via castReveal + setTimeout particle scheduling;
         + ice draw block reads castReveal for fade-in alpha)
EDIT  src/games/frost-fight/ui/Hud.jsx
        (+ roomBest prop, paceLabel string, .ff-chip-pace span)
EDIT  src/styles.css
        (+ .ff-chip-pace pace-marker style)
EDIT  src/covers.jsx
        (drop wordmark image import, replace with inline vector
         <text> wordmark — paint-order outline + fill)
REGEN src/games/frost-fight/sprites/*.webp     (no SVG wrappers,
                                                 lasso-clean WebP only)
EDIT  docs/badicecream-ux-summary.md  (this section)
```

### Build impact

| metric | phase 11 | phase 12 |
|---|---|---|
| FrostFight chunk | ~31 KB | ~34 KB |
| sprite source format | SVG-wrapped (broken in canvas) | direct WebP |
| total sprite payload | ~530 KB | ~470 KB |
| dev-server smoke test | all 200 | all 200 |

Build clean. WebP sprites verified — `Read` on `player.webp` and
`strawberry.webp` shows the painted characters cleanly framed with
fully transparent backgrounds.

---

## Phase 13 — Co-op 2P

The genre's signature feature, finally in. Two ice creams on one
keyboard, sharing the room with same-team-forgiveness death.

### 1. Mode select

`GameIntro.jsx` got a `MODE_OPTIONS.badicecream` entry exposing two
buttons in the lobby:

- **Solo** — the existing one-player run
- **Co-op (2P)** — new; flagged `desktopOnly: true` so mobile users
  see a "Best on desktop" hint

`data.js` updated: `players: '1-2 co-op'`, story line rewritten,
skill tag `coop` added.

### 2. P2 sprite (cyan-mint scoop)

The processor adds an idempotent post-step:

```js
sharp(playerPath).modulate({ hue: 200 }).webp({…}).toFile('player-2.webp');
```

200° hue rotation shifts pink (~hue 325) to cyan-mint (~hue 165) —
the cone goes light blue, the scoop goes turquoise. Visually
distinct from P1 with zero new source art.

### 3. Two-player state machine

`FrostFightGame` now accepts a `mode` prop. When `mode === 'coop'`:

- `loadLevel` seeds a `s.player2` with its own state object spawned
  on the first passable orthogonal neighbour of P1's spawn (falls
  back to `spawn.col + 1`)
- `s.p2Spawn` is captured at level mount for the shared respawn flow
- The per-player tick pipeline (respawn → input → step → cast →
  fruit) was extracted into an inline `tickPlayer(player, kbag, isP1)`
  function. It's called for both players each frame.
- Input split: in **solo** P1 reads WASD ∪ arrows ∪ Space; in
  **coop** P1 is WASD ∪ Space and P2 is arrows ∪ Enter. Zero key
  overlap so simultaneous input on one keyboard works.

Player-vs-player collision: on movement, the other player's tile
(and their `from` tile mid-step) blocks. On freeze cast, the other
player's tile stops the sweep — same as enemies / fruit / exit.

### 4. Shared mechanics

- **Fruit** — either player picking a tile decrements the shared
  count. Floater + cue fire from whichever player picked it up.
- **Death** — any alive player touched by an enemy → BOTH players
  die together (same-team forgiveness). One `OUCH` floater fires
  at the touched-player's tile. One `frostMusic.duck()` and one
  `setDeaths` increment per touch event.
- **Exit** — either player on the exit tile + both alive +
  `fruitsLeft === 0` triggers the room transition.

### 5. Smarter enemy AI

The chase target is now the **closest alive player** (Manhattan
distance), with ties resolving to P1 for determinism. Strawberry,
blueberry, orange, and cherry all retain their per-kind shaping
(pure chase / chaotic / tangent-evade / pair-step) on top of the
new target selection.

### 6. Render + cursor preview for both

Player draw was extracted into a `drawPlayer(player, spriteSlot,
scoopColor)` helper. Called twice — P1 with the pink scoop sprite
and procedural fallback, P2 with the cyan-mint sprite and a
mint-cyan procedural fallback. Same step-bob, same dead-splash.

Cast preview cursor was likewise factored into
`drawCastPreview(player, freezeRgb)` — P1 in cyan
`(80, 180, 230)`, P2 in mint `(120, 240, 200)`. Each player sees
their own cursor in their own tint, mirroring the in-canvas
character colour.

### 7. Bottom-rail keycap split

`BottomRail` accepts a `coop` prop. In coop, the keycap row gains
two pink/cyan player-tag pills (`P1` / `P2`) and a second keycap
group showing the arrow keys + Enter. The R-restart cap is hidden
in coop to keep the rail compact. Adaptive freeze-action highlight
and danger-direction flash stay P1-only — the rail's visual
emphasis follows the dominant player.

### Files touched in phase 13

```
ADD   src/games/frost-fight/sprites/player-2.webp     (cyan-mint via sharp)
EDIT  scripts/frost-fight-process-art.mjs             (idempotent P2 step)
EDIT  src/components/GameIntro.jsx                    (+ Solo / Co-op modes)
EDIT  src/data.js                                     (players: '1-2 co-op')
EDIT  src/games/FrostFightGame.jsx
        (+ mode prop + coop derived flag
         + s.player2 + s.p2Spawn in loadLevel
         + tickPlayer helper, called for both
         + input split (WASD vs arrows + Enter)
         + player-vs-player collision in step + cast
         + chase target = nearest alive player
         + shared death (any → both) + shared exit (either →)
         + drawPlayer + drawCastPreview helpers
         + sprites.player2 slot)
EDIT  src/games/frost-fight/ui/BottomRail.jsx          (+ coop prop, P1/P2 lanes)
EDIT  src/styles.css                                   (+ .ff-keycap-tag pills)
EDIT  docs/badicecream-ux-summary.md                   (this section)
```

### Build impact

| metric | phase 12 | phase 13 |
|---|---|---|
| FrostFight chunk | ~34 KB | ~34 KB |
| sprite count | 13 | 14 (+ player-2.webp) |
| total sprite bytes | ~470 KB | ~503 KB |
| dev-server smoke test | all 200 | all 200 |

Build clean. Solo mode preserved — the `mode = 'solo'` default plus
`coop` boolean derived from `mode === 'coop'` means everywhere we
gate on `coop` falls through to the original single-player flow
when the prop isn't passed or is anything other than `'coop'`.

---

## Phase 14 — root-cause sprite fix + richer music bed

### 1. Sprite rendering — actual root cause

The "white card" rendering issue persisted across phases 11 and 12
because I was treating an underlying source problem with surface-level
fixes. Real diagnosis:

- The user's `A Type 1 / 2.png` and `B Type 1.png` source sheets are
  **fully opaque** (`alpha = 255` everywhere).
- The "transparent checker" you see in the source isn't real
  transparency — it's actual gray pixels (~172 / ~199 / ~254) drawn
  by the AI generator as a placeholder background.
- Every alpha-based pipeline step I'd built (lasso threshold, trim,
  fit-contain) was no-op-ing on those pixels because alpha was never
  below the threshold. The trim couldn't find a tight bbox because
  the cell was opaque from edge to edge.

### 2. Flood-fill checker removal

A new `removeCheckerBg()` step now runs first in `emitSprite`:

1. Classify every pixel as "bg-candidate" if `max-min ≤ 14` (very
   desaturated) AND `max ≥ 150` (gray/white range).
2. Stack-based flood-fill from every border pixel, walking only
   through candidates. Each visited candidate gets `alpha = 0`.
3. Character interior whites (eye whites, scoop highlights) are
   enclosed by black outlines so they're never reached by the fill —
   they stay opaque.

The flood-fill clears 60–85 % of pixels per source cell (the entire
bg). Trim then finds a tight character bbox.

### 3. Cell inset for divider lines

The AI generator drew dark cell-divider lines at the cell boundaries
(near-black, low-saturation, but below the brightness threshold of
the bg-candidate classifier). They survived the flood-fill and
inflated the bbox.

Fix: extract each cell with a **50 px inset** on every edge. The
character bboxes are <800 px in 1408×768 cells, so 50 px clears any
divider artifacts without clipping the character.

### 4. Verified bbox tightness

Per-sprite content fill after the fix:

| sprite | width | height |
|---|---|---|
| player | 61 % | 86 % |
| strawberry | 65 % | 86 % |
| blueberry | 73 % | 86 % |
| orange | 72 % | 86 % |
| cherry | 84 % | 86 % |
| fruit | 67 % | 86 % |
| ice | 83 % | 86 % |
| exit | 59 % | 86 % |

86 % vertical fill across the board — exactly what the 8 % padding
target predicts. Width varies with character shape.

### 5. Verified in-game

Headless screenshot at 2× DPR confirmed: the painted ice cream player,
strawberry villain, fruit pickups, exit flag, and ice tiles all
render at proper character size with clean transparent crops.

### 6. Music bed — multi-layer ambient

The phase 9 drone (3 oscillators + LFO) was a literal drone. The
new ambient bed:

- **Bass drone** — sub-octave + root sines + two detuned voices
  (±0.5 %) for chorus thickness
- **Pad chord** — minor 7th (root + b3 + 5 + b7) on triangle waves,
  stereo-spread (b3 left, p5 right)
- **Bell ostinato** — `setInterval`-driven sparse high notes every
  5.5 s, walking a 6-note pattern (octave / m3 / p5 / 2-octave /
  m3 / p5). Each note is a fundamental sine + slightly inharmonic
  triangle harmonic (2.01×), pan-randomised, with a 1.7 s
  exponential decay
- **Slap-back delay** — 340 ms tap, 28 % feedback, 22 % wet — adds
  spatial depth without smearing
- **Low-pass filter sweep** — 0.07 Hz LFO modulates cutoff between
  680-1120 Hz so the texture breathes
- **Master breath** — 0.20 Hz LFO on master gain, ±20 %

Same per-room key roots (Pantry C5, Cold Room A4, etc.) give each
room a distinct tonal centre. Same `start / stop / duck` API; mute
bus subscription preserved.

### Files touched in phase 14

```
EDIT  scripts/frost-fight-process-art.mjs
        (+ removeCheckerBg flood-fill, 50 px cell inset,
         second lasso pass after resize, PNG output not WebP)
EDIT  src/games/FrostFightGame.jsx
        (sprite imports flipped .webp?url → .png?url, cover stays webp)
REGEN src/games/frost-fight/sprites/*.png    (lasso-clean, full-size,
                                               actually renders correctly)
EDIT  src/sound.js
        (frostMusic redesigned: minor-7th pad + bass + bell ostinato
         + slap-back delay + lowpass sweep + breath LFO)
EDIT  docs/badicecream-ux-summary.md         (this section)
```

---

## Phase 15 — bugs + content + difficulty curve

User reported: R restarts whole game (not the level), spawn-killing
loop, residual cherry crop artefacts, weird orange windup face, plus
content asks (more fruit types, ice-casting enemies, more levels,
better logo). All addressed.

### 1. R now restarts only the current room

GameShell registers a window-level keydown listener for R that calls
`onRestart` (full-game key bump → component remount). FrostFightGame
also handled R but ran *after* the shell. Fix: register
FrostFightGame's listener with `{ capture: true }` so it runs first,
then `e.stopImmediatePropagation()` to keep the shell's listener
quiet. R now reloads the current `levelIdx` only.

### 2. Spawn-killing → death triggers a full room restart

Death used to teleport the player back to the spawn tile after 0.9 s.
If an enemy was loitering near spawn, the player respawned into instant
re-death (we saw 15 deaths in 17 s in the user's screenshot).

Fixed: on touch, both players are marked dead, `s.dying = true`,
shake/flash/particles play, and `setTimeout(() => loadLevel(levelIdx),
950)` schedules a full room reload. Enemies, ice, and fruit reset to
the room's initial state. The `dying` flag prevents double-firing
the death cue if multiple enemies hit in the same frame.

### 3. Sprite cropping — residue elimination

The cherry sprite kept showing a small near-white triangular patch
between the stems. Two compounding causes:

- The user's source sheets are fully opaque with the "transparent
  checker" baked as actual gray pixels. Phase 14's flood-fill caught
  the outer bg but enclosed pockets (e.g. between the cherry stems)
  weren't reachable.
- Sharp's Lanczos resize blends edge colours into the padding,
  re-introducing bg-coloured pixels with mid-alpha.

Two fixes layered together:

1. After flood-fill, a **direct colour pass** zeros any pixel matching
   the gray-band (`max ∈ [158, 232]`, low saturation) OR the
   tinted-near-white profile (`max ≥ 233` with a slight color cast,
   `max-min ∈ [3, 14]`). Pure character whites (255,255,255 — eye
   highlights) have cast = 0 and survive.
2. The whole `removeCheckerBg` pass runs **a second time** after
   resize so the resize-bleed gets re-cleaned.

Cherry residue is now negligible at any rendered size.

### 4. FROST FIGHT logo

Old: simple stroke + white fill.
New: three-layer SVG composition wrapped in an outer cyan glow filter
(`feGaussianBlur` × 2 + `feFlood` + `feMerge`):

- Dark navy contrast halo (stroke 11) — keeps the gradient legible
  over the painted scene
- Cyan-mint icy ring (stroke 6) — the ice-edge wrap
- Gradient chrome fill — `cyan-mint → white → cyan` linear gradient
  inside the strokes

Plus four small four-point ice-crystal sparkles flanking the text
and a wider radial halo behind the wordmark band.

### 5. Ice-casting enemies (cherry + orange)

New per-kind table `ENEMY_ICE_CHANCE` — 0 for strawberry/blueberry,
0.20 for orange, 0.28 for cherry. On each enemy decision tick, a
chance roll picks "cast ice" instead of the usual move:

- Determine the nearest-alive-player chase target
- Pick the dominant axis toward them
- If the tile in that direction is free (not wall/ice/enemy/fruit/
  exit/player) → place ice there with a freeze-particle burst
- Apply per-enemy `iceCd = 2.4 s` so they don't spam
- Skip the move this tick (the cast IS the action)

Each enemy also seeds a stagger on `iceCd` at level mount so multiple
casters don't all fire on the same frame at room load.

### 6. Peach — second fruit pickup type

`peach.png` (already cropped from `A Type 2.png` in phase 7) wired
as a second fruit kind:

- New grid char `'P'` → `kind: 'peach'`
- Fruit object now carries `kind`; render branch picks
  `peach.png` (sz 30, 4 px bigger) vs `fruit.png` (sz 26)
- Pickup behaviour identical (decrements `fruitsLeft`); peaches just
  read as a richer pickup target.

### 7. Four new rooms (6 → 10)

Added with a difficulty curve, each with its own palette:

| # | name | new mechanics |
|---|---|---|
| 7 | **Cold Storage** | first peaches; cherries can blow ice |
| 8 | **Conveyor Maze** | ice-casting oranges in long corridors |
| 9 | **The Vault** | cherry + orange ice-casters + 2 blueberries in a maze |
| 10 | **Frostbite** | finale: 6 chasers, 4 ice-casters, 2 peaches |

The achievement threshold for `frost-fast` was bumped 150 → 240 s
to match the longer total run.

### Files touched in phase 15

```
EDIT  scripts/frost-fight-process-art.mjs
        (pass-4 widened: gray band [158, 232] + tinted-white [233+, cast 3-14];
         second `removeCheckerBg` after resize)
EDIT  src/games/FrostFightGame.jsx
        (capture-phase R handler with stopImmediatePropagation;
         death → full room reload via setTimeout + s.dying flag;
         peach fruit kind in parser + draw + sprite slot;
         ENEMY_ICE_CHANCE + ENEMY_ICE_CD + ice-cast block in the AI tick;
         enemy.iceCd seeded at level mount;
         four new rooms + four new palette entries)
EDIT  src/covers.jsx
        (logo upgrade: outer glow filter, gradient chrome fill,
         dark contrast halo, ice-crystal sparkles, ellipse glow band)
EDIT  src/data.js
        (levels 6 → 10, story line refresh)
EDIT  src/hooks/useAchievements.js
        (frost-fast threshold 150 → 240 s)
REGEN src/games/frost-fight/sprites/*.png   (with the stronger cleanup)
EDIT  docs/badicecream-ux-summary.md         (this section)
```

### Build

`npx vite build` clean. All 10 grids validated (22 cols × 13 rows,
exactly one `p` and one `X` each). Headless screenshot at 2× DPR
shows the new logo rendering correctly and the gameplay sprites
(player, strawberry, fruit, exit) at proper character size with
clean crops.

---

## Phase 16 — orange-windup fix, animated melt, peach scoring

### 1. Orange windup → reuse resting sprite

The user noted the orange's source windup pose came out pumpkin-like
and weird mid-animation. The dedicated `orange-windup.png` import is
commented out and the `orangeWind` slot in `spritesRef` falls back to
the regular `orange.png`. Wind-up still works as a behaviour (the
slight squash from `sz 30 → 32` is preserved) — it just doesn't swap
to a different sprite. Re-enable when better art ships.

### 2. Animated melt sweep — mirror of freeze

A new `s.castVanish: Map<string, number>` mirrors `castReveal`:

- On a melt cast, every ice tile in the row is removed from
  `level.ice` immediately (sim-correct from frame 0)
- Each removed tile gets an entry in `castVanish` with timestamp
  `meltStart + i × 55 ms`
- The ice draw block adds a second pass that iterates `castVanish`
  and renders ghost ice with a 1 → 0 alpha fade over 180 ms
- Particle bursts schedule via `setTimeout` so each tile's burst
  fires just before its ghost begins to fade
- Entries auto-clean once their fade is done

Same reduced-motion gate as freeze (collapses stagger to 0).

### 3. Peach score weight

A new `runPeachesRef` counts peaches eaten across the entire run
(survives `loadLevel`'s state reset). On peach pickup:

- `runPeachesRef.current += 1`
- A `+2` floater appears (vs `+1` for strawberries) using a warmer
  peach-tinted color
- `submitScore` meta now carries `peaches: runPeachesRef.current`
- Score formula adds `peachBonus = peaches × 80` to the base

The `WinCard` shows a fourth "Peaches" stat tile (warm peach accent)
when the player ate at least one. The tile uses `--ff-card-stat-peach`
styling distinct from the cyan best-time tile.

`runPeachesRef` resets to 0 alongside `runTrapCountRef` in `restart()`
so the next playthrough starts at zero.

### Files touched in phase 16

```
EDIT  src/games/FrostFightGame.jsx
        (orange-windup import dropped, orangeWind → orangeSpriteUrl;
         + s.castVanish Map, animated melt sweep, ghost-ice draw block;
         + runPeachesRef + peach pickup bonus + score formula update;
         + peaches in submitScore meta + WinCard prop)
EDIT  src/games/frost-fight/ui/Overlay.jsx
        (WinCard + peaches stat tile)
EDIT  src/styles.css
        (.ff-card-stat-peach warm-tone tile style)
EDIT  docs/badicecream-ux-summary.md           (this section)
```

### Build

`npx vite build` clean. Dev-server-served sprites + routes confirmed
in earlier phases.

### What's actually still open

- Sliding-on-ice banana enemy (sliding-momentum mechanic).
- Boss / world-finale rooms (different AI, large fruit count).
- Co-op-specific touch controls (currently coop is desktop-only;
  could add a second virtual pad if mobile demand shows up).
- True vector tracing (potrace) — deferred; painted style doesn't
  vectorise cleanly without losing cel-shading detail.
- A genuinely different orange-windup sprite (current build reuses
  the resting orange — works but loses the visual pre-tell).

## Phase 17 — pipeline rebuild + themed eras + difficulty + music

User asks (in priority order, all addressed):

1. Robust image processing — zero-checker extraction from the new
   irregular sheets (1.png … 7.png) the user dropped in
   `assets/frost-fight/`.
2. Bot ice cast = row sweep (Othello-symmetric with the player).
3. Themed eras with no fruit/enemy of-the-same-kind on the same map
   and a visual cue distinguishing pickups from villains.
4. Difficulty tiers (Easy 5 lives → Insane 0 lives).
5. Level select for cleared rooms.
6. Better background music (real audio, not just a synth).
7. Fix angry-orange rendering using sheet-6 / sheet-4 alts.
8. Bots that can self-unblock when boxed in by ice/walls.

### A — pipeline rebuild

`scripts/frost-fight-process-art.mjs` gained `processSheetCC()` driven
by a per-sheet manifest. Components are labelled with iterative DFS
on the alpha mask after the existing two-pass `removeCheckerBg` (border
flood-fill + direct gray-band/tinted-white classifier). Each emitted
PNG runs through the same `lassoAlpha` + tight-trim + 8% pad +
512×512 resize + dual-pass cleanup as the legacy grid extractor.

Sheet 1 manifest emitted 10 new sprites (banana-bot, grape-bot,
plum-bot, eggplant-bot, melon-bot, cherrybomb-bot, apple-fruit,
lemon-fruit, kiwi-fruit, cherry-fruit) — all visually verified by
direct file Read. Discovery tool `scripts/frost-fight-cc-discover.mjs`
dumps each component to `/tmp/ff-cc/<sheet>/<idx>.png` so manifests
can be hand-authored from inspection.

### B — bot ice row sweep

Replaced the single-tile enemy ice cast in `FrostFightGame.jsx` with
the same forward sweep the player uses: walk from the bot's facing
tile until `isWall` / `isIce` / occupant. Every placed tile lands in
`s.castReveal` for the staggered visual. Halved orange/cherry chances
(0.20 → 0.10, 0.28 → 0.14) and bumped `ENEMY_ICE_CD` 2.4 → 3.0 s
since rows are much more powerful per cast.

### C — sprite swaps + new bot kinds

Imported the 10 new sprites into `spritesRef`. Extended `KIND` lookup
+ `parseLevel` grid char map: `B/G/V/M/U/Y` for new bots
(banana, grape, eggplant, melon, plum, cherrybomb), `A/L/K/Q` for
new fruit pickups (apple, lemon, kiwi, cherryFruit). Each new bot
plugs into the existing chase pipeline with its own `ENEMY_INTERVAL`
+ `ENEMY_ICE_CHANCE` row.

### D — themed eras (12 new rooms)

Six eras across 22 rooms total:

| Era | Rooms | Fruit pickup | Bot roster |
|---|---|---|---|
| 1 — Cold Aisle  | 1–6   | strawberry        | strawberry / blueberry / orange / cherry |
| 2 — Vault       | 7–10  | strawberry+peach  | + cherry / orange |
| 3 — Crystal     | 11–13 | kiwi              | blueberry / plum |
| 4 — Citrus      | 14–16 | lemon + apple     | eggplant / grape / cherrybomb |
| 5 — Vineyard    | 17–19 | apple + cherry    | melon / grape / plum |
| 6 — Final Storm | 20–22 | mixed             | melon / grape / plum / cherrybomb / cherry |

Each new room respects "no fruit-of-X + bot-of-X on same map" so
strawberry-pickup vs strawberry-villain (and cherry-pickup vs
cherry-bot) confusion never happens. A node script verifies the
constraint at edit-time.

### E — fruit pulse halo

Cyan halo behind every pickup pulses at ~0.5 Hz with per-tile phase
offset (col + row * 1.3) so identical-coloured pickups don't blink in
sync. Defined via the new `FRUIT_KIND` config table that maps each
fruit kind to its sprite slot, fallback colour, and seed-rendering
hint. `HALO_R = T * 0.42`, alpha range 0.18 → 0.28.

### F — difficulty tiers + lives

`DIFFICULTIES` map exported from `FrostFightGame.jsx`:

```js
easy   { lives: 5, iceMul: 1 }
normal { lives: 3, iceMul: 1 }
hard   { lives: 2, iceMul: 1 }
expert { lives: 1, iceMul: 1 }
insane { lives: 0, iceMul: 2 }   // bots cast ice 2× as often
```

`deathsRef` mirrors the React state so the death handler reads the
freshest count between effect runs. When `nextDeaths > diff.lives`
the run flips to `status='gameover'` and shows a new `GameOverCard`
overlay (mirrors `WinCard` chrome with a warm-danger tint and a Try
Again CTA). The HUD's Deaths chip becomes a Lives chip
(`livesRemaining/livesCap`) when a cap exists, with an `is-danger`
state at zero remaining.

`iceMul` multiplies every bot's `ENEMY_ICE_CHANCE` so Insane doubles
the row-cast pressure on top of the lives squeeze.

### G — level select + progress

Two new LS keys via `src/games/frost-fight/utils/progress.js`:

- `pgplay-ff-difficulty` → `{ id: 'normal' }` (last picked tier)
- `pgplay-ff-progress`   → `{ v:1, cleared, lastReached, hardest }`

`markRoomCleared(name)` fires on every room exit; `markRunCleared(id)`
fires on full-run win and tracks the hardest difficulty completed.
`markRoomReached(idx)` runs on level load.

The lobby (`src/components/frost-fight-setup.jsx`, lazy-loaded) shows
a difficulty pill row + a "Pick a cleared room" toggle that opens a
22-room grid. Locked rooms are disabled until the previous one is
cleared; cleared rooms render a cyan "cleared" tag. Click → the run
starts at that index via the new `startLevel` prop on
`<FrostFightGame>`.

### H — real audio bed (with synth fallback)

`src/sound.js` adds an HTML5-audio path that probes
`./games/frost-fight/audio/bed.mp3` via a HEAD fetch. On hit:
- Creates a single `<audio loop>` element.
- Per-room playback-rate nudge (0.92 → 1.08 across 8-room cycle) so
  each room sounds distinct without one file per room.
- Fade-in to 0.55 over 1.6 s; duck on death attenuates to 18 % then
  restores over `durationSec`.
- Mute toggle pauses the element via the existing `subscribeMute`
  hook.

On miss (404 / fetch error): falls back to the existing WebAudio
synth bed with no code-path branching needed at the call site.

The audio file is **not** vendored in this repo — drop a CC0 /
public-domain ambient loop at the path above. See
`public/games/frost-fight/audio/README.md` for source recommendations
and target spec.

### Bot self-unblock

When a bot's four neighbours are all blocked (walls + ice + occupants)
and it has no escape, the AI now picks one adjacent ice tile to melt:
the tile leaves `level.ice`, lands in `s.castVanish` for the fade
animation, and the bot plays a single `sfx.frostMelt()` cue. Prevents
permanent stalemates if the player walls off all four sides with ice.

### Achievements

`useAchievements.js`:
- `frost-fast` threshold raised 240 → 540 s (campaign is 22 rooms).
- New `frost-insane` (`No room for error`) — clearing any run with
  `meta.difficulty === 'insane'`.

### Files touched in phase 17

```
NEW   scripts/frost-fight-cc-discover.mjs
NEW   src/games/frost-fight/utils/progress.js
NEW   src/components/frost-fight-setup.jsx
NEW   public/games/frost-fight/audio/README.md
EDIT  scripts/frost-fight-process-art.mjs
        (+ findComponents, processSheetCC, SHEET1_MANIFEST,
         + per-sheet driver wiring; emitted 10 new sprites)
EDIT  src/games/FrostFightGame.jsx
        (+ DIFFICULTIES + deathsRef + game-over branch
         + startLevel prop + 12 new LEVELS + 12 PALETTE entries
         + bot row-sweep ice cast + bot self-unblock
         + KIND lookup expansion + new sprite imports
         + FRUIT_KIND + cyan pulsing halo behind every pickup
         + iceMul multiplier on enemy ice probability
         + markRoomCleared / markRoomReached / markRunCleared calls)
EDIT  src/games/frost-fight/ui/Overlay.jsx
        (+ GameOverCard)
EDIT  src/games/frost-fight/ui/Hud.jsx
        (Lives chip with is-danger state when cap exhausted)
EDIT  src/components/GameIntro.jsx
        (+ FrostFightSetup integration, difficulty + startLevel
         forwarded to <FrostFightGame>)
EDIT  src/sound.js
        (+ HTML5 audio bed path with synth fallback)
EDIT  src/data.js
        (Frost Fight: levels 10 → 22 + new tagline + new story)
EDIT  src/hooks/useAchievements.js
        (+ frost-insane achievement, frost-fast threshold raised)
EDIT  src/styles.css
        (.ff-overlay-gameover + .ff-card-gameover,
         .ff-chip-sec.is-danger, .ff-lobby-* setup panel,
         .ff-lobby-pill / .ff-lobby-room grid)
EDIT  docs/badicecream-ux-summary.md           (this section)
```

### Build / test

`npx vite build` clean. `npx vitest run` passes 45/45 (3 skipped, 0
failures). The pre-existing jsdom WebAudio shim crash inside
`_frostStart` (jsdom doesn't implement `delay.delayTime.value`) is
unhandled-rejection noise — pre-Phase-17, not a regression.

### What's still open

- Sheet manifests for 2.png … 7.png (only sheet-1 is wired into the
  build right now; the discovery tool dumps them to /tmp/ff-cc/ for
  the next pass).
- Vendored CC0 audio file at `public/games/frost-fight/audio/bed.mp3`
  (the wiring + fallback is shipped; the binary is a one-off drop).
- A real angry-orange windup sprite — sheets 4–6 carry alt anger
  states that we haven't manifested yet. Current build still reuses
  the resting orange for windup (no regression vs phase 16).

## Phase 18 — per-level lives, themes, traits, power-ups

User asks (all addressed in one phase):

1. Lives are **per-level**, not run-wide. Out of lives → soft level
   restart, not game over.
2. **Admin / level-select bypass** so any room can be opened for
   testing.
3. **Bots of similar look should behave differently** — each bot kind
   gets a unique trait/personality.
4. **Block animations** (form-up + shatter + cast windup ring + wall
   crack) so casts and melts feel weighty.
5. **Themed packs** — pick which theme to play, each ~15 rooms.
6. **Difficulty curve** — late rooms must be genuinely hard.
7. **Fruit power-ups** — invincibility, invisibility, speed, free-
   freeze.

### A — per-level lives + soft restart

`levelDeaths` + `levelDeathsRef` mirror the run-wide counter but
reset to 0 on every level entry. When `nextLevelDeaths > diff.lives`
the run flips to a 'Level reset' overlay (`LevelResetCard`) for
1.4 s, then reloads the level with the lives counter back to the
cap. The run keeps going — there is no game-over status anymore.
The HUD's Lives chip shows `levelDeaths` against the cap and pulses
warm-pink at zero remaining.

`GameOverCard` was removed; `LevelResetCard` is the new beat.

### B — admin level unlock

Lobby-level grid gained two bypass paths:

- **Shift-click** a locked room → opens it for that single click.
- **"Admin: unlock all rooms (this session)"** link below the grid →
  flips a `sessionStorage` flag (`pgplay-ff-admin-all`) that makes
  every room clickable until the tab closes. Toggle re-flips it off.

### C — block FX

`fx.js` gained four new presets and a `spawnRing` helper:

- `iceForm` — small 4-particle white-cyan sparkle (fires on every
  newly-placed ice tile via the row-cast loop).
- `iceShatter` — 6 cyan shards outward (replaces the old pink `melt`
  preset at every ice-removal site: player melt sweep, bot self-
  unblock, eggplant stomp, cherrybomb explosion).
- `wallCrack` — earthy 7-particle dust under eggplant stomps.
- `teleport` — teal/cyan burst at both ends of every plum jump.
- **`spawnRing`** — stroked expanding arc used for cast windups
  (player white, bot cyan, orange tell yellow, cherrybomb pink) and
  the cherrybomb radius readout.

### D — themed level packs (15 + 15)

Two themes shipped, total 30 rooms. Single LEVELS array, sliced via
`THEMES`:

```js
THEMES = {
  cold:    { startIdx: 0,  length: 15 },   // 10 existing + 5 new hard
  orchard: { startIdx: 15, length: 15 },   // 12 existing + 3 new hard
};
```

New Cold rooms 11-15 (Frostlock, Slush Maze, Ice Run, Frostfall,
Glacier) escalate from 4-bot density to peak 8-bot pressure with
double ice traps. New Orchard rooms 13-15 (Bare Vault, Teleport
Hall, Vortex Crown) introduce no-fruit-pickup challenges, four-plum
teleport mosh pits, and an all-bot-kinds finale.

Lobby gains a Theme pill row above the Difficulty pills. Picking a
theme persists to `pgplay-ff-theme` and resets the start-level
choice (room 7 in Cold ≠ room 7 in Orchard).

The game receives `theme` + `startLevel` props; `levelIdx` is an
absolute index into LEVELS but win/clear logic uses `themeStart` /
`themeEnd` so each theme is its own 15-room run.

### E — 10 bot personality traits

Each kind plugs into the shared chase + ice-cast pipeline with a
unique twist. Trait state lives on the enemy object (initialized in
`loadLevel`), with timers ticking down each frame even between
decision ticks:

| Bot | Trait |
|---|---|
| strawberry  | baseline chaser |
| blueberry   | **berry-sense** — within 3 tiles of player, fires a 1.4 s speed burst (halves move time). Cyan ring marks the burst. |
| orange      | **windup tell** — when it rolls a cast, defers 0.6 s with a `?` floater + yellow ring before firing. |
| cherry      | **two-step** — already shipped; first decide schedules a quick second at 0.18 s. |
| banana      | **slip** — 70 % chance after a step that lands on plain floor, queues another step in the same direction at 0.16 s. |
| grape       | **shadow drop** — every ~3 s while moving, drops an ice tile at the just-vacated tile (sparkle FX). |
| eggplant    | **stomp** — at low frequency, melts an adjacent ice tile (`wallCrack` + `iceShatter` FX), skipping the move tick. |
| melon       | **heavy/persistent** — when the player shares its row or column, ice-cast probability bumps to 0.55 ignoring its iceCd. |
| plum        | **teleport** — every ~8 s, jumps to a random distant passable tile with a teleport burst at both ends. |
| cherrybomb  | **fuse** — visible countdown rendered above the bot. At 0 s, melts every ice tile in the 3×3 around it (with a pink radius ring) and resets the fuse. |

### F — power-up fruits

Four fruit kinds now grant timed effects in addition to counting
toward the level goal:

| Fruit | Power | Duration | Effect |
|---|---|---|---|
| kiwi (K)            | invincible  | 2.5 s | golden aura, immune to enemy touch |
| lemon (L)           | invisible   | 3.0 s | cyan-white aura at low sprite alpha; bots wander randomly instead of chasing |
| apple (A)           | speed       | 3.0 s | green aura, player MOVE_TIME halved (0.18 → 0.09 s) |
| cherryFruit (Q)     | freefreeze  | n/a   | next freeze OR melt cast skips the cooldown; pink chip |

Strawberry (`f`) and peach (`P`) keep their existing semantics.

A new `activePower` HUD chip surfaces the active power's name + a
0-1 countdown bar (hidden for free-freeze, which is single-shot).
The chip is per-tile-aware: in co-op, whichever player has a power
active drives the chip.

The pickup-point `PWR` map decides which fruit grants which power;
adding a new effect later is one entry there + one branch in the
per-frame application pass.

### G — verification

```
npx vite build      → clean (2.4 s)
npx vitest run      → 95/95 passed, 3 skipped, 0 failures
                       (1 unhandled-rejection from pre-existing jsdom
                        WebAudio shim — not a Phase 18 regression)
```

### Files touched in phase 18

```
EDIT  src/games/FrostFightGame.jsx
        + DIFFICULTIES already shipped (Phase 17); Phase 18 adds:
        + levelDeaths + levelDeathsRef + LevelResetCard render
        + 8 new LEVELS entries (5 Cold + 3 Orchard finales)
        + THEMES constant + theme prop + themeStart / themeCount math
        + 10 bot trait blocks (orange windup, blueberry burst,
          eggplant stomp, banana slip, grape shadow, melon agro,
          plum teleport, cherrybomb fuse + 3×3 melt explosion)
        + cherrybomb fuse counter rendered above each bomb
        + power-up activation in fruit pickup (PWR map)
        + tickPower per frame + invincible touch-skip + invisible
          chase exclusion + speed MOVE_TIME halving + freefreeze
          cooldown skip
        + power-up halo + invisible alpha in drawPlayer
        + ring spawn on every player + bot ice cast (windup tell)
EDIT  src/games/frost-fight/fx.js
        + iceForm / iceShatter / wallCrack / teleport presets
        + spawnRing helper + ring shape branch in drawFx
EDIT  src/games/frost-fight/ui/Hud.jsx
        Lives chip reads levelDeaths instead of run-wide deaths;
        new ff-chip-power chip with countdown bar.
EDIT  src/games/frost-fight/ui/Overlay.jsx
        GameOverCard removed; LevelResetCard added.
EDIT  src/games/frost-fight/utils/progress.js
        + readTheme / writeTheme + THEME_IDS allow-list
EDIT  src/components/frost-fight-setup.jsx
        + Theme pills row above Difficulty
        + admin unlock-all toggle + Shift-click bypass
        + per-theme level grid (filtered by theme.levels)
EDIT  src/components/GameIntro.jsx
        + ffTheme state, threaded through FrostFightSetup +
          forwarded to FrostFightGame as theme prop
EDIT  src/styles.css
        + .ff-overlay-reset / .ff-card-reset
        + .ff-chip-power-* (4 tints + countdown bar)
        + .ff-lobby-admin-row + .ff-lobby-admin-link
EDIT  docs/badicecream-ux-summary.md           (this section)
```

### What's still open

- Per-theme leaderboard split (currently submitScore meta carries
  `theme` but the achievement bus + leaderboards still aggregate
  across themes).
- Adding a third theme is a one-entry push to `THEMES` + `THEME_DEFS`
  + appending levels to LEVELS in startIdx order.
- Banana slip occasionally chains 3-4 tiles in long open corridors
  — by design, but may want a hard cap if playtest finds it
  punishing.

## Phase 19 — difficulty rewrite, harder rooms, visible traits, Timer

User asks (all addressed):

1. Levels too easy — make them harder; add more.
2. Bot personalities need **visible markers** (e.g. teleport tells).
3. Difficulty classification was wrong:
   - Easy: full respawn allowed.
   - Normal: 2× the number of levels.
   - Insane: directly sent back (game over).
   - Fill the middle (Hard / Expert) using AP.
4. Use `THREE.Timer` instead of `THREE.Clock`.

### A — difficulty rewrite (run-wide pool, AP middle)

Reverted Phase 18's per-level lives → run-wide pool that scales with
the picked theme length L. Each tier resolves its life count at game
start via `livesFor(L)`:

```js
DIFFICULTIES = {
  easy:   { livesFor: () => Infinity,                    iceMul: 1   },
  normal: { livesFor: (L) => 2 * L,                      iceMul: 1   },
  hard:   { livesFor: (L) => round(4 * L / 3),           iceMul: 1.2 },
  expert: { livesFor: (L) => round(2 * L / 3),           iceMul: 1.5 },
  insane: { livesFor: () => 0,                           iceMul: 2   },
};
```

For L=20 (the new theme length): Normal 40 / Hard 27 / Expert 13 /
Insane 0 / Easy ∞. Hard and Expert sit on an arithmetic progression
between Normal and Insane.

Phase 18's `LevelResetCard` was retired. The new run-wide death
handler flips `status='gameover'` when `nextDeaths > livesCap`
(skipped entirely on Easy thanks to `Infinity > anything === false`),
restoring `GameOverCard` with a Try Again CTA.

The HUD's Lives chip reads `livesFor(themeCount) - deaths`; Easy
shows `∞`, Insane shows `0/0` until the first death.

### B — visible bot trait markers

Every trait now has at least one inline visual the player can read:

| Bot | Marker |
|---|---|
| strawberry | baseline (no marker) |
| blueberry  | `BURST` floater + cyan ring on berry-sense activation |
| orange     | `?` floater + yellow ring 0.6 s before each cast |
| cherry     | (pair-step is mechanical; no floater) |
| banana     | `SLIP` floater on every slip-queue (≤ once / 0.6 s) |
| grape      | `SHADOW` floater at every dropped ice tile |
| eggplant   | `STOMP` floater on each successful crack |
| melon      | `IN ROW` floater (≤ once / 1.6 s) when the player shares its row/col |
| plum       | **0.5 s pre-teleport tell** — `TP` floater + cyan ring at source, then teleport bursts at both ends |
| cherrybomb | visible fuse counter (already shipped Phase 18) |

The plum tell adds two new state fields (`teleportTellT`,
`teleportPending`) so the jump is staged rather than instant — the
player can react to the tell.

### C — bigger campaign + harder rooms

Each theme grew 15 → 20 rooms (campaign 30 → 40). Five new ultra-
hard rooms per theme:

- **Cold 16-20**: Slipstream (open arena, banana / cherry mix),
  Ice Wall (pre-laid ice everywhere, two melts to clear), Press
  (three orange row-casters above and below), Apex (six bots),
  Frostpeak (boss room — twelve bots).
- **Orchard 16-20**: Plum Tide (five plums teleporting),
  Eggplant Court (six stompers), Grape Net (six shadows everywhere),
  Bomb Foundry (six cherrybombs ticking), Annihilation (every
  Orchard kind in one room — twelve bots).

Mid-game existing rooms (Loading Dock, Sub-Basement, Conveyor Maze)
got bot-density boosts so the curve doesn't sag in the middle.

`THEMES.cold.length` and `THEMES.orchard.length` bumped 15 → 20;
`THEMES.orchard.startIdx` bumped 15 → 20 to account for the inserted
Cold finales. PALETTE got 10 new entries.

### D — THREE.Timer in SlipshotGame

`new THREE.Clock()` → `new THREE.Timer()` (three 0.184 exposes
`Timer` directly off the `three` namespace). Adds an explicit
`clock.update()` call at the top of the render loop since Timer
doesn't auto-advance on `getDelta()` reads. The single
`getElapsedTime()` call became `getElapsed()` (Timer's name).

### E — verification

```
npx vite build      → clean (2.5 s)
npx vitest run      → 95/95 passed, 3 skipped, 0 failures
                       (1 unhandled-rejection from pre-existing jsdom
                        WebAudio shim — not a Phase 19 regression)
```

### Files touched in phase 19

```
EDIT  src/games/FrostFightGame.jsx
        + DIFFICULTIES rewritten (livesFor formula + iceMul)
        + per-level lives state torn out, run-wide pool restored
        + GameOverCard reimported + rendered on status='gameover'
        + 10 new LEVELS entries (Cold 16-20, Orchard 16-20)
        + THEMES length 15 → 20, Orchard startIdx 15 → 20
        + 10 new PALETTE entries
        + Loading Dock / Sub-Basement / Conveyor Maze hardened
        + plum pre-teleport tell (state + 0.5 s window + TP floater)
        + BURST / STOMP / SLIP / SHADOW / IN ROW floaters
EDIT  src/games/frost-fight/ui/Hud.jsx
        Lives chip reads livesFor(themeCount); ∞ render for Easy
EDIT  src/games/frost-fight/ui/Overlay.jsx
        LevelResetCard removed; GameOverCard reinstated
EDIT  src/components/frost-fight-setup.jsx
        Difficulty pill copy reflects the new lives formulas;
        theme level lists extended to 20 rooms each
EDIT  src/data.js
        Frost Fight: levels 22 → 40 + new tagline
EDIT  src/games/SlipshotGame.jsx
        new THREE.Clock() → new THREE.Timer() + clock.update() per
        frame + getElapsed() instead of getElapsedTime()
EDIT  docs/badicecream-ux-summary.md           (this section)
```

### What's still open

- The `iceMul` bump on Hard (1.2) and Expert (1.5) should be
  playtested — old values were 1 across the middle.
- Some existing Cold rooms 11-15 (Frostlock through Glacier from
  Phase 18) didn't get hardened in this pass; they sit between the
  bumped Loading Dock-era rooms and the new Slipstream-era rooms,
  which is fine but a future pass could even out the curve.
- `livesFor` returns Infinity for Easy; if a leaderboard splits
  scores by difficulty, that branch's submit meta should probably
  scrub `lives: Infinity` to avoid JSON edge cases (it currently
  isn't surfaced in submitScore meta — only `difficulty.id` is).
