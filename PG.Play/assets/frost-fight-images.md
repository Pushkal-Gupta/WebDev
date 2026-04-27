# Frost Fight — Image Generation Spec

This file is a drop-in for any image generator (Nano Banana, Imagen,
Midjourney, Stable Diffusion, etc.). Each entry is a fully-formed
prompt with explicit size, palette, output format, and the project
file path the result should land in.

The project is currently using hand-authored SVG sprites from
`src/games/frost-fight/sprites/` — those still work. The PNGs below
are **optional upgrades** that would buy more polish (richer shading,
softer edges, painted look) at the cost of larger byte size. Drop a
PNG into the listed `assets/` path and the build script in this repo
can downscale + emit it; if the path is left empty the SVG fallback
still ships.

> **Style anchor:** flat 2D illustration → soft cel-shaded with one
> highlight + one shadow band. Cold colour temperature throughout.
> Thick clean black outline (3-4 px relative to character size). No
> noise, no gradient backgrounds, no text, no signature, no watermark,
> no UI, no shadow on the ground.

> **Background rule:** every output must have a fully transparent
> background (alpha channel). The character or item fills 70-80 % of
> the frame, perfectly centered, with even margin on all sides.

---

## Phase A — character + item upgrades

These four would replace the existing `*.svg` files in
`src/games/frost-fight/sprites/`. Drop the resulting `.png` into the
matching path; either keep the `.svg` as a fallback or remove it.

### A1. Player ice cream — `assets/frost-fight/player.png`

```
Cartoon ice cream character mascot, full body, centered, on a fully
transparent background. A tan waffle cone (warm beige #d4a460 with
crisscross diamond lines, soft cream highlight on the upper-left
edge) topped with a single round pink ice cream scoop (#ff8ec6, with
a lighter pink #ffaad4 highlight on the upper-left and a faint cool
shadow #d870a0 on the lower-right).

On the pink scoop: a friendly face — two large white eyes with black
pupils looking forward, small black mouth, slight upturned smile.

Style: soft cel-shaded illustration, single light direction
(upper-left), thick clean black outline (3-4 px). Premium arcade-game
mascot quality, similar in feel to Bad Ice-Cream / Crossy Road
characters. NO text, NO signature, NO watermark, NO logo, NO ground
shadow. The character fills 75 % of the frame, perfectly centered.

Output: 1024 x 1024 PNG with full alpha transparency.
```

### A2. Strawberry villain — `assets/frost-fight/strawberry.png`

```
Cartoon strawberry villain character, full body, centered, on a fully
transparent background. A bright red round strawberry body (#ff4d6d
with a #ff7b96 highlight on upper-left and a #c8324f shadow on the
lower-right) covered in small white seed dots, with a green leafy
crown on top (#2d7a2a, lighter highlight on top edges, darker
shadow #1f5a1f on undersides).

Two tiny stubby black-outlined legs at the base. No arms.

Angry expression: thick angled black eyebrows pointing inward, two
small white eyes with black pupils, small frown.

Style: soft cel-shaded illustration, single light direction
(upper-left), thick clean black outline (3-4 px). Premium arcade
villain quality. NO text, NO signature, NO watermark, NO logo, NO
ground shadow. The character fills 75 % of the frame.

Output: 1024 x 1024 PNG with full alpha transparency.
```

### A3. Blueberry villain — `assets/frost-fight/blueberry.png`

```
Cartoon blueberry villain character, full body, centered, on a fully
transparent background. A bright blue round blueberry body (#35a8ff
with a #7fc6ff highlight on upper-left and a #2080c8 shadow on
lower-right), with a small darker blue stem nub on top (#1a3a7a,
small lighter highlight #2a5aa0).

Two tiny stubby black-outlined legs at the base. No arms.

Angry expression: thick angled black eyebrows pointing inward, two
small white eyes with black pupils, small frown.

Style: soft cel-shaded illustration, single light direction
(upper-left), thick clean black outline (3-4 px). Premium arcade
villain quality. NO text, NO signature, NO watermark, NO logo, NO
ground shadow. The character fills 75 % of the frame.

Output: 1024 x 1024 PNG with full alpha transparency.
```

### A4. Fruit pickup — `assets/frost-fight/fruit.png`

```
A small cute strawberry fruit pickup item, centered on a fully
transparent background. A simple round red strawberry (#ff4d6d, with
a soft #ff7b96 highlight on upper-left) covered in small white seed
dots, with a small green leaf top (#2d7a2a).

NO face, NO eyes, NO expression, NO mouth — this is a collectible
pickup, not a character.

Style: soft cel-shaded illustration, single light direction
(upper-left), thick clean black outline (3-4 px). NO text, NO
signature, NO watermark, NO logo, NO ground shadow. The fruit fills
65 % of the frame, perfectly centered.

Output: 1024 x 1024 PNG with full alpha transparency.
```

---

## Phase B — secondary sprites

### B1. Strawberry wind-up — `assets/frost-fight/strawberry-windup.png`

```
[same prompt as A2 strawberry] but with a slightly squashed body
(wider and shorter, approximately 12 % wider, 5 % shorter), eyes
opened wider (about 25 % larger), and a gritted-teeth open frown
showing small teeth-line strokes. The character looks alert and
about to lunge.
```

### B2. Blueberry wind-up — `assets/frost-fight/blueberry-windup.png`

```
[same prompt as A3 blueberry] but with a slightly stretched body
(approximately 8 % taller, leaning forward), eyes opened wider
(about 25 % larger), and a gritted-teeth open frown showing small
teeth-line strokes. The character looks alert and about to lunge.
```

### B3. Ice block tile — `assets/frost-fight/ice.png`

```
A single semi-transparent ice cube tile, centered on a fully
transparent background. A square block with rounded corners
(approximately 10 % corner radius). Body color light icy blue
#d9ecf5 with a brighter white #ffffff inner top-left facet (about
40 % of the block) and a deeper blue #7ac0e0 lower-right facet for
volume. Two small white sparkle marks across the surface (X-shaped
glints), one larger and one smaller.

Outline thick clean black, 3-4 px.

NO text, NO signature, NO watermark, NO logo, NO ground shadow. The
block fills 90 % of the frame, perfectly centered.

Output: 1024 x 1024 PNG with full alpha transparency.
```

### B4. Exit flag — `assets/frost-fight/exit.png`

```
A small golf-style exit flag, centered on a fully transparent
background. A vertical white pole (#ffffff, thick black outline)
with a triangular flag (#35f0c9 cyan-mint with a brighter #7af5dc
highlight on the upper edge) flying to the right from the upper
third of the pole. A small dark elliptical socket at the base of the
pole hinting at a hole.

Style: clean flat illustration, thick black outline. NO text, NO
signature, NO watermark, NO logo. The flag fills 80 % of the frame,
positioned slightly toward the upper-left (so the flag's right tip
lands roughly at horizontal center).

Output: 1024 x 1024 PNG with full alpha transparency.
```

---

## Phase C — environment textures (optional, larger lift)

Each of the six rooms could swap its solid wall fill for a tiled
texture. Generate each as a **seamless-tile** PNG. The wall colour in
the current build is `#1a2540`; the texture should respect that
overall hue while adding character.

| room          | path                                          | texture brief |
|---------------|-----------------------------------------------|---------------|
| Pantry        | `assets/frost-fight/walls/pantry.png`         | warm-tinted dark navy wood-shelf planks, soft horizontal grain, subtle frosted dust |
| Cold Room     | `assets/frost-fight/walls/coldroom.png`       | dark blue brushed-metal panels with rivet dots at corners, soft cool sheen |
| The Aisle     | `assets/frost-fight/walls/aisle.png`          | dark slate concrete-floor tiles with thin grout lines, faint ice-crystal dusting |
| Walk-In       | `assets/frost-fight/walls/walkin.png`         | dark cobalt insulated-foam panels, slight diagonal seams |
| Loading Dock  | `assets/frost-fight/walls/loadingdock.png`    | dark gunmetal corrugated-steel ribs, faint rust dots |
| Sub-Basement  | `assets/frost-fight/walls/sub-basement.png`   | very dark blue rough concrete, subtle cracks, no light highlights |

```
Seamless tileable texture, 256 x 256 PNG, opaque. Dark base colour
matching the brief above. Soft ambient lighting from upper-left.
Subtle detail — the texture should read as a wall surface, not a
photograph. NO text, NO signature, NO watermark, NO logo, NO border.
The image must tile perfectly when laid edge-to-edge horizontally
and vertically (no visible seams).

Output: 256 x 256 PNG, opaque, no alpha channel.
```

---

## Phase D — cover refresh (optional)

The lobby cover for `badicecream` is currently a JSX component in
`src/covers.jsx`. A painted cover would be a clear upgrade.

### D1. Lobby cover — `assets/frost-fight/cover.png`

```
A painted hero illustration for an arcade puzzle game called Frost
Fight, 1280 x 720 landscape. Centered on a deep frozen-pantry stage:
a small pink-scoop ice cream character (the player) facing forward
mid-step, surrounded by tile-grid pattern lines on a pale icy floor
that recedes slightly into the distance. Behind the player and
slightly off to the sides, two angry fruit characters (one
strawberry-red, one blueberry-blue) approach. Between the characters,
two semi-transparent ice cubes glint with X-shaped sparkles.

Atmosphere: cold sub-zero arcade scene, soft cyan rim-light from
behind, deep navy backdrop with a faint cyan halo around the
characters. A few drifting snow specks in the air. The mood is
playful but tense — this is an arcade puzzle, not a horror.

Style: rich cel-shaded illustration with painterly highlights, thick
clean black outlines on each character, restrained colour palette
(deep navy + cold cyan + warm-pink scoop accent). Premium arcade
key-art quality — think modern indie game cover art.

NO text, NO logo, NO signature, NO watermark, NO UI elements, NO
title bar. Just the scene.

Output: 1280 x 720 PNG, opaque (no alpha needed). The composition
should leave roughly 1/4 of the right side relatively empty so the
lobby's typography column reads cleanly when overlaid.
```

---

## Integration notes

1. Keep all PNGs under `assets/frost-fight/`. They are **source**
   art — the build path runs them through `sharp` for compression /
   resize before they land in `public/` or get inlined.
2. The current SVG sprites stay as fallbacks. Loader code in
   `src/games/FrostFightGame.jsx` already does
   `complete && naturalWidth > 0` gating, so a missing PNG doesn't
   break gameplay.
3. To swap a sprite from SVG to PNG, change the import path in
   `FrostFightGame.jsx`:
   ```js
   import playerSpriteUrl from './frost-fight/sprites/player.png';
   ```
   Vite will inline if under 4 KB or emit as an asset otherwise.
4. ~~Wall textures (Phase C) are not yet wired.~~ — wired in phase 7.
   The draw loop reads from
   `src/games/frost-fight/sprites/walls/<key>.png` via Vite glob —
   drop a tile in and it renders on the next reload. See "Phase E"
   below for the up-to-date prompt set.
5. ~~The cover (Phase D) plugs into `src/covers.jsx`.~~ — wired in
   phase 6 using `Frost-Fight.png` from the user's drop. The painted
   scene already lives at `src/games/frost-fight/sprites/cover.webp`.

---

## Phase E — outstanding asks (post phase-7)

These are what would actually move the needle from this point. Drop
the resulting PNGs into the listed paths and the draw code already
expects them.

### E1. Wall textures — six 256×256 seamless tiles

Already wired. The draw loop uses `import.meta.glob` to discover any
PNG in `src/games/frost-fight/sprites/walls/`. Filename stems map to
room names via this table (declared in `FrostFightGame.jsx`):

| room          | required filename stem            |
|---------------|-----------------------------------|
| Pantry        | `pantry.png`                      |
| Cold Room     | `coldroom.png`                    |
| The Aisle     | `aisle.png`                       |
| Walk-In       | `walkin.png`                      |
| Loading Dock  | `loadingdock.png`                 |
| Sub-Basement  | `sub-basement.png`                |

> The destination path is `src/games/frost-fight/sprites/walls/`. A
> 30 % dark veil is composited on top at runtime so the texture stays
> cool-toned and the grid lines remain readable — design for that.

Single shared brief, room-specific lines below it:

```
A seamless tileable 2D texture, 256 × 256 PNG, opaque.
Photoreal-ish but stylised — soft cel-shaded, gentle ambient
lighting from the upper-left, dark-cool overall colour
temperature so it composites cleanly under a 30 % navy veil. The
image must tile perfectly — no asymmetric highlights, no edge
seams, no centre-only details.

Strict rules: NO text, NO signature, NO watermark, NO logo, NO
border. Output: 256 × 256 PNG, opaque, no alpha.

Subject (one of):
```

| key             | subject line |
|-----------------|---|
| `pantry`        | dark-navy painted wood-shelf planks, soft horizontal grain, faint dust frosting near the seams, hint of ice-crystal glint |
| `coldroom`      | dark blue brushed-steel panels with rivet dots at the corners and faint cool sheen lines |
| `aisle`         | dark slate floor concrete tiles in a 4-tile grid with thin grout lines, faint ice-crystal dusting |
| `walkin`        | dark cobalt insulated-foam panels with subtle diagonal seams every ~50 px |
| `loadingdock`   | dark gunmetal corrugated-steel ribs running vertically, faint rust dots near rib peaks |
| `sub-basement`  | very dark blue rough cast-concrete with subtle hairline cracks, no specular highlights |

### E2. Orange wind-up — `assets/frost-fight/orange-windup.png`

```
Cartoon orange villain character (matching the orange already in
A Type 2.png — bright orange #ff8a3a body with green stem nub on
top, two stubby legs at the base, thick black outline), centered
on a fully transparent background, but in a "wind-up" pose:
slightly squashed body (12% wider, 5% shorter), eyes opened
wider (about 25% larger), and a gritted-teeth open frown showing
small teeth-line strokes. The character looks alert and about to
lunge.

Output: 1024 × 1024 PNG with full alpha transparency.
Style identical to A Type 2's orange — same palette, same outline
weight, same single light direction.
```

Drop into `assets/frost-fight/orange-windup.png` and re-run the
processor (`node scripts/frost-fight-process-art.mjs`) — once that
filename exists in source we wire it into the windup-sprite slot
the same way strawberry-windup is wired today.

### E3. Cherry pair (twins) wind-up — `assets/frost-fight/cherry-windup.png`

```
[same as A Type 2's cherry — two small dark-red round cherry
heads connected by a thin green stem with one shared leaf, each
head with its own angry face, thick black outline] but in a
"wind-up" pose: each head's eyes opened wider, both frowning
mouths gritted with small teeth-line strokes, the two heads
slightly drawn apart (about 8 px more separation) as if about
to spring.

Output: 1024 × 1024 PNG with full alpha transparency.
Style identical to A Type 2's cherry pair.
```

If you ship cherry-windup we'll wire **cherry** as a fourth enemy
class with paired-step behaviour (it moves on alternating ticks so
it cadences differently from blueberry).

### E4. Optional — alternate fruit pickup

The `peach.png` sprite already cropped from `A Type 2.png` is
unused right now. If you'd like to scatter peaches as an
alternative pickup (say, in the Loading Dock room for a worth-
slightly-more bonus score), let me know and I'll wire a `P`
character into the level grid + an optional score multiplier.
No new image needed for that — `peach.png` already exists.

### E5. Optional — frost-fight wordmark

If you ever want a typographic title to layer on the painted lobby
cover (currently the cover scene is text-free and the title text
comes from the surrounding chrome):

```
A clean modern wordmark reading "FROST FIGHT" — chunky
sans-serif, slightly rounded corners, white fill with a 3-px cool
mint-cyan (#7af5dc) outer outline, very faint cyan inner glow.
Centered on a fully transparent background.

Strict rules: NO additional graphics, NO subtitle, NO signature,
NO watermark. Just the wordmark.

Output: 1280 × 320 PNG with full alpha transparency.
```

Drop at `assets/frost-fight/wordmark.png` if you ship it.
