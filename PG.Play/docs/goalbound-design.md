# Goalbound — design spec

*Original arcade football title inspired by public references to
"football heads" browser games. Not a clone — the brief asked for
the feel without the IP. See `ui-audit.md` for what the previous
"Football Legends" entry was.*

## Identity

- **Title:** Goalbound.
- **Tagline:** *One pitch. One minute. All yours.*
- **Fantasy:** two rivals duel on a tiny side-view pitch under dusk
  stadium lights. Cyan athlete vs ember athlete. Oversized boots,
  clean architectural silhouettes. No big heads, no one-leg
  grotesques — own the genre feel, drop the caricature.
- **Palette:** brand cyan (`#00e8d0`) vs ember orange (`#ff8855`),
  dusk pitch (`#1a2f3e`). Stadium lights in `#ffe6a8`.
- **Cover art:** `src/covers.jsx#Cover_Goalbound` — low-angle pitch
  at dusk, two silhouettes leaping for an airborne ball, a stadium
  light arc overhead.

## Modes

| Mode           | Players | Notes |
|----------------|---------|-------|
| Quick Match    | 1 vs AI | 60s match, 3 difficulty tiers (Casual / Pro / Legend). First to 3 or timer-out; golden goal on tie. |
| Local Versus   | 2 hotseat | Same keyboard. Desktop-only (hidden on < 820px viewport with a "Best on desktop" message). |
| Penalty Shootout | 2 hotseat | 5 alternating rounds, kicker + keeper on the same phone. No simultaneous inputs — works natively on one mobile device. |

## Physics constants

| Name | Value | Notes |
|------|-------|-------|
| Pitch width | 760 | Virtual units |
| Pitch height | 420 | |
| Floor Y | 360 | Ground collision line |
| Gravity | 1500 u/s² | |
| Player move | 260 u/s | Ground speed |
| Player jump | -540 u/s | Instant impulse |
| Ball friction (air) | 0.995 | |
| Ball bounce (ground) | 0.58 | |
| Ball bounce (walls) | 0.75 | |
| Kick range | 42 | Foot-to-ball contact threshold |
| Kick power | 460 u/s | Scaled by random 1.05–1.15 |
| Kick cooldown | 0.35s | Per-player |
| Goal mouth width | 70 | Goal height 140, ground-tied |
| Match seconds | 60 | |
| Golden-goal seconds | 45 | Only on tied timer-out |
| Win goals | 3 | Early-stop threshold |

## Controls

| Input | P1 (Home) | P2 (Away, versus mode) |
|-------|-----------|------------------------|
| Move  | A / D     | ← / → |
| Jump  | W         | ↑ |
| Kick  | S (or Space) | / (or Shift) |

Touch (mobile, via `src/input/useVirtualControls.jsx`):
- `goalbound` binding surfaces a D-pad (A/D) + Jump (W) + Kick (S).
- Virtual controls only render on `(max-width: 820px), (pointer: coarse)`.

## AI design

Three tiers (see `AI_TIERS` in `GoalboundGame.jsx`):

- **Casual** — 260ms react, large aim wobble, 25% contest-air, slow
  counterattack. Misses most air balls.
- **Pro** — 160ms react, tighter aim, 55% contest-air, punishes
  neutral positioning.
- **Legend** — 80ms react, tight aim, always contests air balls,
  preemptively defends the goal line.

The AI uses a simple `{ goToX, jump, kick }` state machine,
re-decided every `reactTime + jitter`. No pathfinding, no
prediction tree — it's a 1D line with a jump axis.

## Audio

Synthesized via `src/sound.js`. New cues: `sfx.kick`, `sfx.bounce`,
`sfx.goal`, `sfx.whistle`, `sfx.save`. All Web Audio oscillator
envelopes — no samples. Mute flag shared with the rest of the app.

## Integration

- Registered in `src/data.js` as `{ id:'goalbound', ... }`,
  replacing the legacy `football` entry.
- Lazy-loaded in `src/components/GameIntro.jsx#PLAYABLE`.
- Score bus: `submitScore('goalbound', score, meta)` on match end
  with `{ mode, difficulty, scored, conceded, reason, won }` in meta.
- Featured on home hero (moved from fbwg since fbwg is still a
  metadata-only stub).
- Appears in `originals`, `twitch`, `pass-the-laptop`, `phone-friendly`
  collections, and in `EDITORS_PICKS`.
- Achievement ids (stub — wiring through `useAchievements.js` is
  deferred): `goalbound_first_win`, `goalbound_clean_sheet`,
  `goalbound_hat_trick`, `goalbound_legend_beat`, `goalbound_golden_goal`.

## Out of scope (v1)

- Gamepad input.
- Tournament bracket / series mode.
- Character picker / skins.
- Advanced ball physics (spin, dribble).
- Replay system.

## Play-tuning levers

All tuning constants live at the top of `src/games/GoalboundGame.jsx`.
Common dials:

- Make games shorter: drop `MATCH_SECONDS` from 60 to 45.
- Make goals easier: raise `KICK_POWER` or enlarge `GOAL_W`.
- Make Pro feel like Legend: shrink `AI_TIERS.pro.reactTime`.
- Make jump arcs loftier: make `PLAYER_JUMP` more negative or drop
  `GRAVITY`.

Keep the pitch size fixed — the reset coordinates and AI math
assume `W = 760`.
