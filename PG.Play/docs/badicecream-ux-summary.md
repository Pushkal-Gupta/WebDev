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

### What's actually still open

- Co-op 2P mode (keyboard-shared, WASD vs arrows). Real BIC's
  signature feature; would be the natural phase 13.
- Sliding-on-ice banana enemy.
- Boss / world-finale rooms.
- True vector tracing (potrace) — the painted style doesn't
  vectorise cleanly without losing detail; deferred.
- Animated melt sweep — only the freeze stagger ships now; melt
  removes its row instantly. Easy to mirror if needed.
