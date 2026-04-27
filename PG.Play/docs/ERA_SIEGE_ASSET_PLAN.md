# Era Siege — Asset Plan

## Strategy
PG.Play's other originals (Goalbound, Coil, SLIPSHOT, Grudgewood,
Bricklands) ship with **zero external sprites** — everything draws from
geometric primitives, gradients, and shapes. Era Siege follows that
constraint for v1 because:

1. **License safety.** No risk of a copyrighted asset slipping in.
2. **Bundle size.** The host site's first paint is 38 KB gz. A sprite
   atlas would multiply this. A geometric era set adds ~2 KB.
3. **Themed coherence.** All five eras read as the same hand drawn the
   silhouettes; a stock asset import would split the visual language.
4. **Recolorability.** Every primitive accepts the era palette directly,
   so era progression *feels* like a palette shift in real time.

A future v2 may swap to a hand-drawn sprite atlas (or a paid
commercial-license atlas) once the gameplay is locked. The asset
search references below are kept ready for that swap.

## v1 visual recipe

### Bases
- 76×86 stylised wall block with crenellations.
- Per-era flag: triangular pennant on a 30 px pole.
- Per-era trim: a 2-px stripe in `palette.banner` along the top rim.
- HP bar above the wall in `palette.banner` → red gradient.

### Units
- Drawn from 4 primitives: oval head, rectangle torso, two trapezoidal
  legs, weapon glyph.
- Per-unit `colorBody`, `colorTrim`, `weaponShape`.
- Walk cycle: 6-frame leg rock implemented as `sin(time * speed)` y-offset
  on the legs; no atlas frames needed.
- Attack windup: subtle scale + 4-px forward lean, then a 60ms colour
  flash of the weapon glyph at impact.
- Death: a 280-ms ragdoll (2-axis rotation + alpha fade), no extra art.

### Turrets
- Drawn from 3 primitives: base plate (rect with bevel), pivot mast,
  barrel/lance/bell.
- Per-era turret `kind` swaps the barrel primitive:
  - `crossbow` (era 1): two diagonal lines + a bowstring.
  - `bell`     (era 2): trapezoid muzzle.
  - `cannon`   (era 3): wide rectangle with a flange.
  - `tesla`    (era 4): three vertical prongs + arc-flicker overlay.
  - `lance`    (era 5): a tapered triangle with a void-glow.

### Projectiles
- Two primitives:
  - **Bolt:** 2-px-thick line trail.
  - **Orb:**  6-px-radius gradient circle.

### Backgrounds
- Three z-layers, each generated from a fixed seed per era:
  - Sky: 2-stop linear gradient from `palette.sky[0]` to `palette.sky[1]`.
  - Mountains: 12-vertex polyline with seed-driven height noise.
  - Mid: era-specific motif (smoke columns, lantern dots, lightning rods,
    void rifts) drawn as primitives at 30% alpha.

### HUD
- All in HTML/CSS using existing PG.Play tokens (`var(--surface-1)`,
  `var(--accent)`, etc.) so dark theme parity is automatic.

### Particles
- 6-frame additive sparks for hits.
- 12-frame ash/spark trails for the era-up flash.

### Effects (era flash)
- Full-screen overlay rect at 35% alpha in `palette.flash`.
- A 600-ms ease-out alpha decay.
- A 12-px screen shake decay over 250ms.

## Asset categories (for future v2 swap)

The format below matches `THIRD_PARTY_ASSETS.md`. Search references and
license notes are kept ready in case we move to bought/licensed art.

```
Asset Category: Unit sprite sheet
Needed For: Era 1 frontline (Ember Runner)
Search Query: "site:itch.io tribal warrior side-view sprite commercial license"
Search Query: "site:opengameart.org tribal warrior CC0"
Search Query: "site:craftpix.net side scroller tribal sprites"
Must Have: 6-frame walk + 4-frame attack + death, side-view
License: CC0 or commercial-license
Format: PNG sprite sheet (atlas)
Path: public/games/era-siege/sprites/units/era1-frontline.png
Notes: Recolour to ember palette. Adapt silhouette to be readable at 40 px.
```

(See `THIRD_PARTY_ASSETS.md` for the full list across all 15 units, 5
turret tiers, 5 backgrounds, UI, projectiles, effects, and audio.)

## File path plan
```
public/games/era-siege/
  sprites/
    units/
    turrets/
    projectiles/
    bases/
  backgrounds/
    era1/
    era2/
    ...
  ui/
  audio/
    sfx/
    music/
```
v1 leaves these directories empty — code generates everything. The
directory tree is created so future sprite swaps are a `git mv` away.

## Cover (lobby)
The existing PG.Play cover system uses an SVG component in
`src/covers.jsx` (`Cover_AoW`). v1 refreshes that SVG to match the new
era palette set: a five-band gradient, three silhouettes, a banner stripe
in era-3 brass. No raster cover required.

## Audio assets
See `ERA_SIEGE_AUDIO_PLAN.md`. v1 reuses PG.Play's `src/sound.js`
procedural mixer — no audio files ship.
