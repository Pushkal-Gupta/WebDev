# Cut-the-Rope-style game — implementation plan

## Architecture

Modeled on `src/games/grudgewood/`: a folder of focused modules, an
`index.jsx` that owns the canvas + Three.js renderer + RAF loop + UI tree,
and a per-game CSS file. Three.js is bundled with the chunk via standard
ES imports; no `@react-three/fiber` (that pulls a fiber reconciler we don't
need for a pure simulation scene).

```
src/games/cut-rope/
  index.jsx              Root component. Owns canvas, RAF loop, UI tree.
  styles.css             Per-game styles.
  engine.js              Three.js renderer + scene + camera + lights setup.
  state.js               Progression model (current level, stars per level).
                         Mirrors via localStorage; one-key blob.
  audio.js               Thin wrapper over `src/sound.js` adding the
                         per-game stingers (rope-cut whoosh, candy thud,
                         star sparkle, target chomp, level cleared).
  physics/
    verlet.js            Verlet integrator (point + rope-segment chain).
    constraints.js       Distance constraints, anchor pins, candy point.
    cut.js               Swipe-path → segment-intersection cutter.
  entities/
    candy.js             3D mesh + state. Wraps a verlet point.
    rope.js              3D mesh + state. Wraps a verlet chain.
    anchor.js            Static pin point + 3D mesh.
    star.js              3D mesh + collected/uncollected state + FX hook.
    target.js            Friendly creature ("Mochi"). Mesh + animation
                         states (idle / anticipate / chomp / sad).
    bubble.js            Encloses candy, applies +Y force, pop on tap.
    blower.js            Static fan-cone region applying directional force.
    spike.js             Static hazard. Lethal on candy contact.
    moving-anchor.js     Anchor on a path or rotation. Drives rope endpoint.
  levels/
    schema.js            Level data type definition + validation helpers.
    data.js              The 10 hand-built levels for v1.
    loader.js            Materializes a level into entities, attaches to
                         the scene, registers physics bodies.
  ui/
    Hud.jsx              Top bar: level, stars, retry, pause, mute, fs.
    StartScreen.jsx      Landing card.
    LevelSelect.jsx      Grid of levels with star totals + locked state.
    PauseMenu.jsx        Pause overlay.
    LevelComplete.jsx    Stars summary, next-level CTA, retry.
    LevelFail.jsx        Splat overlay with auto-retry CTA.
    Tutorial.jsx         Per-level contextual hint, fades on first action.
  fx/
    particles.js         Star-burst, candy-trail, success-confetti emitters.
    flash.js             Brief screen-flash on level cleared.

src/games/CutRopeGame.jsx       (re-export shim — single line, retained for
                                 unchanged platform wiring)
```

## Bundle plan

- Three.js stays in the existing shared `three.module` chunk (lazy).
- The cut-rope chunk holds engine bootstrap + entities + level data + UI.
- Target: ≤ 30 KB gz for `CutRopeGame-*.js`.
- Per-game CSS lives under `cut-rope/styles.css`, sourced from `index.jsx`.

## Physics model

Rope = chain of N verlet points joined by distance constraints.
Each verlet point: `{ x, y, prevX, prevY, pinned }`. One step:

1. **Integrate**: each non-pinned point uses `(x', y') = (2x - prevX,
   2y - prevY) + a·dt²` where `a = (0, gravity)`. Damping `0.992`.
2. **Constraints**: relax distances iteratively (~6 iterations, Jakobsen
   relaxation). Convergence is fine for a 10-segment rope at 60 Hz.
3. **Anchors**: pinned points clamp back to their anchor each step.
4. **Cut**: removing a constraint drops one rope segment.
   The candy then becomes governed only by the remaining ropes
   (or by the gravity-only free-fall if no rope is left).
5. **Bubble**: when a candy is bubbled, gravity sign flips for that point
   and damping doubles. Pop = revert.
6. **Blower**: every step, points inside a blower's frustum receive the
   blower's `force` vector added to their integrated velocity.

Rope segments: 10–14 typically. Candy mass = 1 (sim is point-mass; visuals
are 3D).

## Cut detection

Track the pointer's path during a drag (`pointermove` while button down or
`touchmove`). Each frame, test the new path segment against every active
rope's set of segments. Hit = first cut at the intersected segment index;
the rope splits into "free portion" + the candy-side portion that detaches.

This generalizes to multi-rope cuts: a single swipe across two ropes cuts
both. Speed of swipe doesn't matter (the test is geometric).

## Camera + scene

- Three.js orthographic camera. Plane is XY; gameplay coords map 1:1 to
  world units; negative Y = "up". Camera at Z=10 looking at origin.
- Frustum height fixed (e.g. 12 world units); width adapts to aspect so
  side margins on widescreen become diorama backdrop, not dead space.
- Scene tree: world group → backdrop diorama → entity group.
- Lighting: one warm key directional light + one cool fill, ambient ~0.25.
  No shadows on the gameplay plane (candy/rope are bright meshes; soft AO
  comes from the diorama materials).

## Level schema (data-driven)

```js
{
  id: 'world1-l1',
  world: 1,
  number: 1,
  name: 'First taste',
  hint: 'Tap the rope to cut it.',
  camera: { centerY: 0, height: 12 },
  anchors: [
    { id: 'a1', x: 0, y: 4 },
  ],
  candy: { x: 0, y: 0 },
  ropes: [
    { from: 'a1', toCandy: true, length: 4, segments: 12 },
  ],
  stars: [
    { x: -1.2, y: 1.2 },
    { x: 1.5, y: -0.4 },
    { x: 0, y: -2.4 },
  ],
  target: { x: 0, y: -4.6 },
  hazards: [],
  devices: [],   // bubbles, blowers, moving anchors
  win: { kind: 'feed-target' },
}
```

The loader materializes this into entities, registers verlet points, sets
up the rope chains' distance constraints, and binds visual meshes.

## Progression

- Stars per level live in localStorage under `pgplay-cutrope-progress`.
  Shape: `{ levels: { [id]: { bestStars, cleared: true|false } } }`.
- Mirrored to Supabase only via the existing platform `submitScore` bus
  (no new tables).
- Score submission shape per level: `score = stars` (0-3), with
  `meta: { level, world, time, stars }`. Edge function maxScore bumps
  to **3** (we drop the legacy "+200 completion" bonus). Total best is
  the highest stars on any single level — leaderboard meaning is "anyone
  who got 3 stars."
- A "world-cleared" milestone unlocks an achievement
  (`cutrope-perfect` already exists in `useAchievements.js`).

## Input

- Pointer drag → cut path. Mouse and touch unified via Pointer Events.
- Tap on a bubble pops it.
- Tap on the screen during pause / overlays passes through to the UI.
- Keyboard: `R` retry, `Esc` pause, space resumes.

## Audio

- Reuse `src/sound.js` cues: `click hover open confirm win lose
  achievement star`.
- Add per-game stingers in `audio.js` that wrap the global cues into
  contextual events: `ropeCut(volume)`, `candySwing()`, `starGet()`,
  `bubblePop()`, `blowerLoop()` (sustained), `targetChomp(success?)`,
  `levelClear()`, `levelFail()`.
- All cues short-circuit on `isMuted()`.

## Visual style

See `cutrope-visual-direction.md`. Diorama-toy-box look, soft warm
lighting, glossy candy, painted-plaster backdrop. Three world themes
(Sweet Shop / Garden / Workshop) cycled across the 10 levels.

## Mechanics roll-out

See `cutrope-mechanics-roadmap.md`. v1 ships with: rope-cut, multi-rope,
bubble, blower, spike, moving-anchor. Spider/thief and gravity switch
ship in v2.

## Implementation phases

| Phase | Scope | Output |
|---|---|---|
| **A — Audit & plan** | This doc + 4 sibling docs. No code yet. | Five docs in `docs/` |
| **B — Engine + verlet** | Three.js bootstrap + verlet rope sim. Smoke test: rope hangs and swings. | `engine.js`, `physics/*`, basic `entities/rope.js`, `entities/anchor.js`, `entities/candy.js` |
| **C — Cut + win** | Swipe-cut, target chomp, star collect, fail-on-out-of-bounds. | `physics/cut.js`, `entities/star.js`, `entities/target.js`, `levels/data.js` (3 starter levels) |
| **D — Mechanics** | Bubble, blower, spike, moving anchor. | `entities/bubble.js`, `entities/blower.js`, `entities/spike.js`, `entities/moving-anchor.js` |
| **E — Levels** | 10 hand-built levels stretching mechanics. | `levels/data.js` filled out |
| **F — UI** | StartScreen, LevelSelect, Hud, LevelComplete, LevelFail, Tutorial. | `ui/*` |
| **G — Audio + juice** | Audio wires, particle FX, candy squash, target animations, screen flash. | `audio.js`, `fx/*`, polish in entities |
| **H — Score rule + cleanup** | Bump `scoreRules.ts` maxScore. Delete the old single-file game. Smoke + mount tests pass. | `supabase/functions/_shared/scoreRules.ts`, removed `CutRopeGame.jsx` body |

## Risks / non-goals

- **Real-time multiplayer**: out of scope (matches the platform's
  single-player score-attack pattern).
- **Procedurally generated levels**: out of scope. Hand-built only.
- **Asset texturing pipeline**: v1 ships with procedural materials only.
  All texture/PNG assets are listed in `images.md` and replace placeholder
  meshes when the user provides them; nothing in the gameplay code
  depends on those assets shipping.
- **iOS Safari WebGL quirks**: the existing 3D ambients and Grudgewood
  already pass on iOS; the same patterns apply.
