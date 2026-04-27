# Frost Fight (`badicecream`) — UX Audit

_Date: 2026-04-27_

The route `/game/badicecream` resolves to `src/games/FrostFightGame.jsx` (the
file is internally branded "Frost Fight" — an original puzzle-arcade riff on
the Bad Ice-Cream genre, not a clone). This audit covers the live build at
`https://pushkalgupta.com/PG.Play/dist/index.html#/game/badicecream` and the
matching source on `main`.

## 1. Current state

- The page mounts inside `GameShell` (`src/components/GameShell.jsx`), which
  already gives every game a 100 dvh dark stage, idle-fading floating chrome
  cluster (Exit · Pause · Fullscreen), shortcut keys (P/M/F/R/Esc), and a
  pause overlay. Fullscreen is auto-requested on first paint.
- `FrostFightGame` renders three DOM zones inside that shell:
  1. `.frost-bar` — flex row of uppercase mono text (Room · Fruit · Deaths · Time)
  2. `.frost-canvas` — 22×13 grid maze drawn on a fluid canvas
  3. `.frost-tip` — sentence of design copy
  4. `.frost-hint` — uppercase mono line of controls
- Tile size is fixed at `T = 36`, board is `792 × 468` px. `sizeCanvasFluid`
  scales the buffer to the actual parent box, but the in-game render scale
  is clamped to `1.6` (FrostFightGame.jsx:193).
- Touch shows an inline 4-button d-pad + ACTION pill drawn inside the canvas
  wrapper. The shell separately can mount `VirtualControls` for games listed
  in `useVirtualControls.jsx`, and `badicecream` is in that list.

## 2. Problems

### Layout / proportion
- **`.frost { max-width: 860px }`** still lives in `styles.css` (line 2916).
  It is overridden by `.game-shell-viewport-inner > * { max-width: none !important }`,
  but the intent is wrong — `.frost` should *want* the whole stage.
- **Render scale is hard-capped at 1.6×.** On a 1920×980 fullscreen viewport,
  the natural fit is ~2.1× by height. Capping at 1.6× draws the board at
  ≈1267 × 749 px and leaves ~650 px of empty `#000` band on each side.
- **HUD/tip/hint stack consumes vertical chrome the canvas can't use.** Each
  is content-height; together they steal ~110 px of stage height with weak
  hierarchy.
- The in-canvas backdrop is a frost-pane gradient that looks fine when the
  canvas fills the screen, but with the 1.6× cap the gradient is bounded by
  the canvas rect — surrounding shell stays flat black, breaking immersion.

### HUD / typography
- Single row of `--font-mono`, 0.72 rem, uppercase, with `<b>` highlights —
  reads as debug telemetry, not a HUD.
- No tabular numerals, no animation on change, no grouping (room/fruit are
  primary; deaths/time are secondary; controls are tertiary — currently
  flattened to one tier).
- "Play again" appears as a small ghost button in the bar instead of an
  overlay celebration.

### Footer / hints
- `.frost-tip` and `.frost-hint` stack two lines of low-design text. The
  hint is a perpetual reminder, the tip is per-level — but they look almost
  identical, creating noise.
- No keycap visualisation, no contextual hints (e.g. "all clear — head for
  the flag", "watch the corner"), no compact mode for narrow viewports.

### State feedback
- Death uses canvas shake + red flash but the HUD never reacts.
- Fruit pickup has no UI feedback.
- Level transition is instantaneous (`setLevelIdx(i+1)` re-mounts the loop)
  with no intro card.
- Final win renders the same `.frost-tip` line — there is no end-screen.

### Touch
- The inline d-pad inside the canvas wrapper is hand-rolled. The shell's
  shared `VirtualControls` mounts on top because `badicecream` is in the
  `useVirtualControls` map. Result: two control surfaces, one of which
  goes off-screen on small displays.

### Accessibility
- HUD text is mono-uppercase 0.72 rem with `--text-mute` — borderline
  contrast and small for telemetry users care about.
- No `aria-live` for fruit-collected or death events.
- Reduced-motion is respected by framer-motion in the lobby but inside the
  game we don't honour it for camera shake / flash.

## 3. Opportunities

- The shell already does the heavy lifting (dark backdrop, fullscreen,
  pause). The game just needs to stop fighting it and use it.
- Lifting the scale cap and removing `.frost { max-width }` puts the board
  at 2× the visual mass on desktop with no engine changes.
- Promoting the HUD to chip components matches the rest of the site's
  premium pages (Era Siege uses `.es-topbar` chips with `.es-stat-num` —
  same pattern fits here).
- The genre's signature is **icy/cold** — we already have cold blue tokens.
  Pushing them as a coherent theme on the surrounding shell (board frame
  glow, vignette, light film grain) is restraint, not decoration.
- A bottom rail with keycaps + a level tip line replaces the two ad-hoc
  text rows with one designed surface and supports contextual updates
  ("Press F for fullscreen", "All fruit collected — find the exit").

## 4. Constraints

- **Do not touch sim**: `parseLevel`, the loop's input handling, the enemy
  AI, the freeze/melt logic, the scoring tuple — all stay byte-identical.
- **Touch d-pad** must keep working. We will route it through the shell's
  `VirtualControls` (already mapped) and remove the inline duplicate, OR
  leave the inline as the canonical and de-list the game from the shell
  binding. Picking the inline route since it's tuned to the freeze/melt
  pacing (`MOVE_TIME` rate-limit comments).
- **Score submission** must keep firing once with the exact same payload.
- The shell auto-requests fullscreen on mount; the redesign must look right
  in *both* fullscreen and windowed modes.
- The page must keep working on small viewports — Frost Fight is desktop-first
  but the lobby allows phones.

## 5. Proposed direction

A single full-bleed scene with three zones:

```
┌──────────── TOP HUD (chips) ────────────────────┐
│ Room ▸ Fruit ▸ Deaths ▸ Time            ▼ ▼ ▼ │
├─────────────────────────────────────────────────┤
│                                                 │
│            STAGE                                │
│      ╔═══════════════════════╗                  │
│      ║   inset, framed       ║   ← board with   │
│      ║   board (large)       ║     soft outer   │
│      ║                       ║     glow         │
│      ╚═══════════════════════╝                  │
│                                                 │
├──────── BOTTOM RAIL (keycaps · tip) ────────────┤
│ [WASD] move  [SPACE] freeze · "Pantry — corner…"│
└─────────────────────────────────────────────────┘
```

- **Stage backdrop** is a layered gradient (deep navy → cold slate) with a
  large soft frost halo behind the board.
- **Board frame** is a 1 px inner ice highlight + soft cyan outer glow,
  animated subtly when a level loads or completes.
- **Render scale** is `min(stageW / W, stageH / H)` clamped only to a
  sane upper bound (3.0) so big screens go big without losing crispness.
- **HUD chips** render with tabular numerics, animate the value on change,
  pulse the fruit chip when count hits zero.
- **Bottom rail** combines a keycap strip and a single tip line that swaps
  for contextual hints (level tip → "all clear, head for the exit" → "press
  R to restart").
- **Overlays**: a one-second "ROOM 2 · COLD ROOM" sweep at level start,
  a "ROOM CLEAR" chip on transition, a "FROZEN" tag on death respawn
  countdown, and a final win card that replaces the Play-again-in-the-bar
  with an actual end screen. All use the existing framer-motion patterns.

Code shape:
- Keep `FrostFightGame.jsx` as the single component; extract the new
  surfaces into a `frost-fight/` ui folder (`Hud.jsx`, `BottomRail.jsx`,
  `Overlay.jsx`).
- New CSS lives under a clearly-namespaced `.ff-*` class set; the legacy
  `.frost-*` rules get deleted.
