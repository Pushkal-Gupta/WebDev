# Frost Fight — Visual Direction

_Companion to the audit + plan. Short, opinionated._

## 1. Mood

Cold arcade. Sub-zero pantry at night. The stage feels like glass over
ice, lit from below by a faint cyan filament. The board is the warm
spot in a cold room — mostly because the player and the fruit are warm
colours against that cold field.

Not glassy SaaS. Not neon. Not a "game launcher" hero. A focused arcade
scene.

## 2. Palette (scoped to the route)

```
--ff-bg-0      #07101c    deep navy, top of stage gradient
--ff-bg-1      #0f1c30    mid stage
--ff-bg-2      #0a1424    bottom of stage gradient
--ff-frost     #6cd0f0    cyan accent (highlights, exit, focus rings)
--ff-frost-soft  rgba(108, 208, 240, 0.12)   for halos / shadows
--ff-ice-edge  rgba(255, 255, 255, 0.08)   inner highlight on the frame
--ff-text      #e8f0f6
--ff-text-dim  rgba(232, 240, 246, 0.55)
--ff-fruit     #ff5b7e    used only for the fruit chip pulse + canvas
--ff-warning   #ffb86b    death-state HUD glow
```

The board *internals* (walls, fruit, enemies, ice) keep their existing
canvas colours — they're the reference and they're tuned. We're shaping
the room around the board, not repainting the board.

## 3. Type

Use the existing site stack:

- Display / chip numerics: `--font-display` (already loaded), tabular
  numerics, weight 700, slight `letter-spacing: -0.01em` on big numbers.
- Eyebrow / label: `--font-mono`, 0.66 rem, uppercase, `letter-spacing:
  0.16em`, colour `--ff-text-dim`.
- Body / tip: `--font-sans`, 0.9 rem, weight 500.
- Keycap: `--font-mono`, 0.78 rem, uppercase, weight 600.

## 4. Spacing rhythm

Everything sits on an 8 px grid except keycaps (4 px tight grid). Top
HUD chrome height is `clamp(56px, 6vmin, 72px)`. Bottom rail is the same.
Stage is everything in between.

## 5. Board frame

```
.ff-board-frame
  width: var(--ff-board-w)
  height: var(--ff-board-h)
  border-radius: 18px
  box-shadow:
    inset  0  0  0 1px var(--ff-ice-edge),         /* highlight */
    inset  0 -1px 0 1px rgba(0, 0, 0, 0.45),       /* deep edge */
    0 16px 48px rgba(58, 200, 240, 0.10),           /* outer cyan glow */
    0 36px 80px rgba(0, 0, 0, 0.5);                 /* lift from page */
```

When a level loads, the outer glow briefly intensifies for 600 ms then
settles.

## 6. HUD chips

Each chip is `padding: 10px 14px; border-radius: 14px; background:
rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
backdrop-filter: blur(8px);`.

Two-row content:
- Top: tiny eyebrow label (`ROOM`, `FRUIT`, etc.).
- Bottom: large numeric value, then a smaller secondary unit (`/3`,
  `s`, `Pantry`).

The fruit chip's eyebrow turns cyan when the count hits zero, and the
chip outline pulses cyan twice. That's the whole celebration cue.

## 7. Bottom rail

```
[ ⌨︎ Keycaps ] · [ — context tip — ] · [ optional CTA ]
```

Keycaps look like:

```
.ff-key { padding: 4px 8px; min-width: 22px; border-radius: 6px;
         border: 1px solid rgba(255,255,255,0.10);
         background: linear-gradient(180deg, rgba(255,255,255,0.05),
                                              rgba(255,255,255,0.02));
         box-shadow: inset 0 -1px 0 rgba(0,0,0,0.5),
                     0 1px 0 rgba(255,255,255,0.04);
         font: 600 0.78rem/1 var(--font-mono);
         color: var(--ff-text);
         text-transform: uppercase; }
```

Keycaps are flat-top, slightly bottom-shadow. They feel like cap-rock,
not Mac chiclets.

## 8. Overlays

- **Level intro** — full-stage glass card centered. `padding: 40px 56px;
  background: rgba(7, 16, 28, 0.55); backdrop-filter: blur(18px); border:
  1px solid rgba(255, 255, 255, 0.06)`.
  Eyebrow `ROOM 2 · COLD ROOM`, display body the level tip.
- **Level clear chip** — top-center pill, `background: var(--ff-frost);
  color: #07101c; padding: 10px 22px; border-radius: 999px;`.
- **Frozen on death** — small chip at player tile, 12 px above tile,
  `background: rgba(7, 16, 28, 0.85); color: var(--ff-frost)`.
- **Win card** — same body as level intro plus stats grid (deaths, time,
  best). Two CTAs (`Play again` primary, `Back to lobby` ghost).

## 9. Don't list

- No purple/pink generative gradients. The frost cyan is the only accent.
- No animated background "stars" or particles. The stage is still.
- No bevels. We use 1 px highlights and shadows, never 3-px chrome.
- No icon noise. Lucide icons only where they earn the space (the `play`
  glyph in primary CTAs is fine; nothing else).
- No emoji.
