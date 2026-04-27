# Frost Fight — UX Implementation Plan

_Companion to `badicecream-ux-audit.md`. Concrete, ordered._

## 0. Non-goals
- No changes to sim, AI, level data, scoring formula, or score submission.
- No new third-party deps.
- No global theme changes — work is local to the Frost Fight route.

## 1. Folder + file changes

```
src/games/
├── FrostFightGame.jsx              (refactor: split DOM, lift scale cap, plumb hooks)
└── frost-fight/                    (new)
    ├── ui/
    │   ├── Hud.jsx                 — top chips
    │   ├── BottomRail.jsx          — keycaps + contextual tip
    │   └── Overlay.jsx             — level intro / clear / win
    └── theme.css                   — scoped .ff-* tokens & layout

src/styles.css
└── delete legacy .frost-* block (lines ~2908–2953)
└── add @import or paste of theme.css contents (paste — codebase keeps a single styles.css)
```

We won't fragment styles — the project's convention is one `styles.css`. The
new `.ff-*` rules go inline in `styles.css`, replacing the old `.frost-*`.

## 2. DOM structure (target)

```jsx
<div className="ff-root" data-state={status}>
  <header className="ff-hud" aria-label="Game status">
    <Hud …/>                {/* chips */}
  </header>

  <main className="ff-stage" ref={stageRef}>
    <div className="ff-stage-bg" aria-hidden />        {/* backdrop layers */}
    <div className="ff-board-frame" ref={frameRef}>
      <canvas ref={canvasRef} className="ff-board" />
    </div>
    <Overlay …/>            {/* level intro / clear / win */}
    {isTouch && <TouchPad …/>}
  </main>

  <footer className="ff-rail" aria-label="Controls">
    <BottomRail …/>
  </footer>
</div>
```

The root is `display:grid; grid-template-rows: auto 1fr auto`. `ff-stage`
is `position:relative; min-height:0` so the stage owns the rest of the
viewport.

## 3. Scaling system

Replace the inline `sizeCanvasFluid` callback with a custom layout pass:

1. Track the stage rect via `ResizeObserver(stageRef.current)` and
   `fullscreenchange`.
2. On each tick, compute usable `cssW`, `cssH` (the stage minus the
   board-frame padding — frame is a 6-px inset shadow, no extra padding
   needed).
3. Use `floor(min(cssW/W, cssH/H) * 100) / 100` and clamp to
   `[0.5, 3.0]`. The cap of 3.0 keeps tile lines crisp at 4K; the floor
   keeps mobile readable.
4. Write CSS variable `--ff-board-w`, `--ff-board-h` in pixels so the
   board-frame chrome aligns to the same dims.
5. Canvas backing buffer is `cssW × cssH × dpr` (capped 2). The board is
   centered inside that buffer via `translate((cssW - dispW)/2, …)`.

This keeps the existing in-canvas draw call topology — only the cap is
relaxed.

## 4. HUD

Chips, left-to-right:

| chip | content | tier |
|---|---|---|
| Room | `1 / 3 — Pantry` | primary |
| Fruit | `0 / 5` (animates, pulses on zero) | primary |
| Deaths | `2` | secondary |
| Time | `0:42` (mm:ss, tabular) | secondary |

Each chip = `<div class="ff-chip"><span class="ff-chip-label">…</span><b class="ff-chip-num">…</b></div>`.

Numerics use `font-variant-numeric: tabular-nums`. On value change we run
a 220 ms pop animation (scale 1 → 1.08 → 1) via a `key`-bumped framer
component or a manual transition. We already use framer-motion in
`GameIntro`, so we use the same.

Death increments the deaths chip and triggers a 350 ms red glow on the
chip outline (`box-shadow` keyframe via `data-pulse`).

## 5. Bottom rail

Layout: three columns on desktop, stacked on small.

```
[ keycaps strip ]   ·   [ contextual tip ]   ·   [ secondary actions ]
```

Keycaps: `<kbd class="ff-key">W</kbd>` etc. — a simple cap chip with
inset shadow. Order:
- Movement: WASD / arrows
- Freeze: SPACE
- Restart: R

Tip line evolves:
- mount: level tip ("Pantry — Freeze a tile…")
- on first move: switch to "Collect every fruit, then reach the flag."
- when fruitsLeft === 0: "All clear — head for the flag."
- after death: "Touched — respawning…" (1 s, then back)
- on level transition: "Room 2 — Cold Room" briefly, then that level's tip

Secondary actions are the `Play again` button only when status === 'won',
otherwise the column collapses.

Compact viewport (< 720 px): the rail wraps and tip + keycaps stack.

## 6. Overlays

All are framer-motion fades (`useReducedMotion` short-circuits to
opacity-only).

- **Level intro** — full-stage card on level mount, fades out after 1.1 s.
  Text: `ROOM 2` (eyebrow) over `Cold Room` (display) + level tip line.
- **Level clear chip** — small badge top-center on transition, lives
  600 ms.
- **Death indicator** — a red `FROZEN` chip at the player's tile rendered
  as DOM (positioned via the same scale math), fades during the 0.9 s
  respawn.
- **Win card** — full-stage glassy card: stats summary, primary "Play again",
  secondary "Back to lobby". Replaces the in-bar button.
- **Pause** — already handled by `GameShell`. We just listen for `paused`
  via `onPauseChange` and dim our HUD accordingly.

## 7. Atmosphere

Inside `.ff-stage-bg`:
- Layer 1: `linear-gradient(180deg, #0d1622 0%, #16243a 60%, #0c1828 100%)`
- Layer 2: a giant radial halo (~70 vmin) behind the board, cyan glow at
  10 % opacity.
- Layer 3: very faint noise via repeating-radial-gradient (no `.svg`).

Inside `.ff-board-frame`:
- 1 px inset ice highlight (top-left) + 1 px inset deep-blue shadow
  (bottom-right) for slight bevel.
- Outer soft drop-shadow `0 12px 40px rgba(58, 200, 240, 0.12)`.
- On level intro: a `box-shadow` flash that fades out.

## 8. Motion budget

- HUD chip number: 220 ms scale pop on change.
- Fruit chip 0/N pulse: 1.2 s ease-in-out, 2 cycles.
- Level intro: 220 ms fade-in, 700 ms hold, 280 ms fade-out.
- Level clear chip: 220 ms slide+fade in, 380 ms hold, 200 ms fade.
- Death FROZEN tag: instant in, 0.9 s fade-out.
- Board frame glow on intro: 600 ms ease-out fade.
- All halted under `prefers-reduced-motion`.

## 9. Accessibility

- HUD wrapped in `<header>` with `role="status"` on dynamic chips.
- Bottom rail `<footer>`.
- Overlay text in `aria-live="polite"` regions where appropriate.
- Keycaps have visible focus rings if they ever become buttons (they're
  not — pure label `<kbd>`).
- Reduced motion respected via `useReducedMotion` from framer-motion.

## 10. Files to edit / add

```
ADD     src/games/frost-fight/ui/Hud.jsx
ADD     src/games/frost-fight/ui/BottomRail.jsx
ADD     src/games/frost-fight/ui/Overlay.jsx
EDIT    src/games/FrostFightGame.jsx
EDIT    src/styles.css                      (replace .frost-* block)
EDIT    src/input/useVirtualControls.jsx    (remove badicecream — use inline)
ADD     docs/badicecream-ux-audit.md        (this commit)
ADD     docs/badicecream-ux-plan.md         (this commit)
ADD     docs/badicecream-visual-direction.md (this commit)
```

## 11. QA checklist

- Wide desktop (1920×1080 fullscreen): board ≥ 80 % stage height, no
  wasted horizontal voids; HUD reads at a glance from 2 m.
- Laptop 1440×900: board still feels large; no cramped feeling.
- Narrow 768×1024 portrait: rail stacks gracefully, board fits.
- Touch d-pad still triggers movement.
- Pause works (P / overlay button).
- Fullscreen toggles (F) without the canvas going blurry.
- Restart (R) zeros deaths/time and reloads level 1.
- Score submits exactly once on first win.
- Reduced motion: no shake, no scale pop, no flash.
