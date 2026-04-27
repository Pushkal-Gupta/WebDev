# Cut-the-Rope-style game — current-state audit

## What exists today

A single-file 2D canvas prototype at `src/games/CutRopeGame.jsx` (~350 LOC).
The game is wired into the platform identically to every other game, but the
gameplay is the bare minimum: three hand-coded levels, idealized pendulum
physics on a single rope, tap-to-cut, three stars, a "creature" target, a
free-fall after the cut, win on overlap with the target's footprint, lose
on falling out of bounds.

### Wiring

| Wiring point | File | Status |
|---|---|---|
| Game id | `cutrope` (in `src/data.js:85`) | OK |
| Lazy import | `src/components/GameIntro.jsx:42` | Re-export shim friendly — points at `CutRopeGame.jsx` |
| Smoke test | `test/games.smoke.test.js:18` | Same |
| Cover SVG | `src/covers.jsx` | OK |
| Score rule | `supabase/functions/_shared/scoreRules.ts:40` | **Broken** — `maxScore: 30` but the current code submits up to 500. Edge fn drops every score silently. |
| Mount test | jsdom auto-discovery via `data.js` | OK |

### What works

- The pendulum physics looks right at rest: candy hangs straight down, a click
  near the rope cuts cleanly, gravity takes over.
- The cut hit-test (`distToSegment`) uses the post-Phase-27A scale-fit math, so
  a click on the rope is interpretable on any viewport.
- Star pickup AABB is generous enough that swing-arcs collect them.

### What is broken or missing

| # | Problem | Why it matters |
|---|---|---|
| 1 | Pendulum is "ideal" — angle integrated, length fixed. No verlet, no actual rope, no sag, no break-on-overstretch. | The signature feel of the genre is the rope as a soft physical object. The current sim feels like a swinging dot, not candy on a string. |
| 2 | Single rope per level. No multi-rope cut-order puzzles. | Two-rope timing puzzles are the genre's first real puzzle. |
| 3 | No rope cutting *animation*. Cut state flips instantly. | Reads as a glitch, not a satisfying interaction. |
| 4 | No swipe-cut. Tap-only. | Mouse drag / touch swipe is the canonical input — players expect to draw a line through the rope. |
| 5 | Only 3 hand-coded levels, all on the same coordinate range. No progression. | A first release needs at least 10–15 levels. |
| 6 | "Om Nom" branded character name in code. The drawing pattern (green ellipse + teeth) is a recognizable copy. | Legal risk and UX shame. The user explicitly said *original presentation*. |
| 7 | No bubbles, blowers, spikes, spiders, moving anchors. | These are the mechanics that make the genre interesting past level 5. |
| 8 | No level select, no progression UI, no star-summary screen. | Players can't replay specific levels or see their star totals. |
| 9 | Flat 2D canvas. No lighting, no depth, no diorama. | The user explicitly wants 3D / 2.5D presentation. |
| 10 | No audio. Platform has `sfx.click/win/lose/star` but the game doesn't call them. | Genre relies heavily on audio satisfaction loops. |
| 11 | No physics juice on the candy: no squash/stretch, no spin, no air drag variation. | Reads as a sprite, not a tactile object. |
| 12 | No fail-state animation. State flips to `'lost'` and a button appears. | Should be a quick "splat" + auto-retry. |
| 13 | Stars use a flat fill. No collection FX, no sound. | Genre uses bright sparkle bursts on collect. |
| 14 | Score rule maxScore=30 but submission shape is `stars*100+200` → 500. **Every score has been silently dropped.** | Leaderboard for cutrope has been blank for the entire deploy. |
| 15 | Score rule grants 200pt completion bonus regardless of stars — 0-star clear scores 200, 3-star scores 500. Doesn't reward stars enough. | Replay incentive is broken. |
| 16 | No hint system. First-time players have to guess "tap the rope". | Onboarding cost is paid by every visitor. |

## The user-reported "not working at all"

I cannot reproduce a *literal* "doesn't render" failure on the current build —
the level loads, the candy hangs, the rope can be tapped. The user's complaint
is the broader "this is a primitive prototype, not a real game." Treating that
as the reproducible bug.

## Decision: rebuild, don't patch

The current file is small enough and far enough from the target that a patch
trail would be longer than a clean rewrite. The rebuild target is a 2.5D
Three.js scene with verlet rope physics on a 2D gameplay plane, modular code
under `src/games/cut-rope/` mirroring `src/games/grudgewood/`, ten hand-built
levels covering rope-cut + bubble + blower + spike + moving-anchor, full audio
wiring through the platform's `sfx` bus, and a proper landing → level-select →
gameplay → complete UI flow.

The platform integration stays as-is. The new module is mounted via a tiny
re-export shim at `src/games/CutRopeGame.jsx` so `GameIntro.jsx`, the smoke
tests, and the catalog validator don't need to change. The Supabase score
rule does need a one-line edit to lift `maxScore` to 50 so the new
"5×stars + 1×level" submission shape lands.

## Bundle budget

Current chunk: 5.73 KB / 2.5 KB gz (very small because it has so little
content). After rebuild, target ≤ 30 KB gz for the cut-rope-specific code
(meeting the per-game budget in `CONTRIBUTING.md`). Three.js is already in
`react-three-fiber.esm` / `three.module` chunks — shared, not new weight.

No new dependencies. Verlet rope physics is ~120 LOC of bespoke code; no
need for `cannon-es` or `rapier` (both would dominate the per-game budget
and pollute the rest of the catalog with a physics dependency they don't
use).
