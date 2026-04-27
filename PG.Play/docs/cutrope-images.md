# Cut-the-Rope-style game — asset request list

> **Note on filename**: the prompt asked for `docs/images.md`. That path
> already belongs to Era Siege. This file is the Cut-the-Rope-scoped
> equivalent. Treat it as the project's single source of truth for
> Cut-the-Rope assets.

Everything in this list is **optional for v1 to ship**. The game runs end-to-end
with procedural Three.js materials. These assets are the polish pass that
replaces placeholder geometry/materials with hand-authored art.

Place all delivered assets under `src/games/cut-rope/assets/`, organized by
folder. The level loader (`src/games/cut-rope/levels/loader.js`) checks
for the file at runtime; if present it swaps the procedural material/mesh,
otherwise it falls back to procedural.

## Priority key

- **C — Critical**: ship-quality polish requires it.
- **I — Important**: visible improvement, but procedural fallback is acceptable.
- **O — Optional**: nice-to-have, only worth doing once everything else is shipping.

---

## 1 — Candy variants (3, one per world)

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Candy — Sweet Shop | `assets/candy/sweetshop.png` | PNG sprite | Transparent | 256×256 | Replaces procedural pink-red mesh on world 1 levels. | Glossy hard candy, bright cherry-pink core (`#ff4d6d`), warm gold wrappers (`#ffe14f`), tiny highlight gleam top-left, soft shadow under. | C |
| Candy — Greenhouse | `assets/candy/greenhouse.png` | PNG sprite | Transparent | 256×256 | World 2 palette. | Lime-green core (`#9ddb6a`), leaf-green wrappers (`#5fa64a`), slight translucency. | C |
| Candy — Workshop | `assets/candy/workshop.png` | PNG sprite | Transparent | 256×256 | World 3 palette. | Caramel-amber core (`#d97a2a`), brassy wrappers (`#e2b264`), warm gleam. | C |
| Candy — 3D mesh | `assets/candy/candy.glb` | glTF binary | n/a | ~5K tris | Preferred over sprite if 3D is the chosen direction. | Single mesh with three material slots (core / wrapper / gleam). Diffuse + roughness only. | I (alternate) |

## 2 — Rope material

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Rope tile texture | `assets/rope/rope-warmcream.png` | PNG, tileable | n/a | 64×256 (vertical tile) | Replaces the 1px-thick line rope. Tiles along the rope mesh. | Twisted-fiber pattern, warm cream core (`#e8c46f`) with slightly darker veins. Tileable on long axis. | I |
| Rope cut sparkle | `assets/rope/cut-sparkle.png` | PNG sprite | Transparent | 128×128 | One-frame puff at the cut location. | 8 short white-yellow lines burst, additive-blend friendly. | I |

## 3 — Anchor pin (3 world variants)

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Pin — Sweet Shop | `assets/anchors/pin-steel.png` | PNG sprite | Transparent | 96×96 | Brushed steel pushpin. Renders ~24 px in-game. | Slightly bevelled, top-light gleam, subtle drop shadow. | I |
| Pin — Greenhouse | `assets/anchors/pin-bronze.png` | PNG sprite | Transparent | 96×96 | Mossy bronze. | Same shape, mossy patina. | I |
| Pin — Workshop | `assets/anchors/pin-copper.png` | PNG sprite | Transparent | 96×96 | Hot copper. | Same shape, polished copper. | I |

## 4 — Star collectible

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Star body | `assets/stars/star-gold.png` | PNG sprite | Transparent | 128×128 | Replaces procedural 5-point star. | Saturated gold (`#ffd24a`), classic 5-point shape, white inner highlight, soft warm halo painted into alpha. | C |
| Star burst sparkle | `assets/stars/burst.png` | PNG sprite | Transparent | 256×256 | Particle texture for collect FX. | 12 radial spokes, white-warm gradient, additive-blend. | I |
| Star ghost | `assets/stars/star-ghost.png` | PNG sprite | Transparent | 128×128 | After collect, faint outline at the original spot for 200 ms. | Outlined-only star, 0.4 alpha. | O |

## 5 — Mochi (target creature)

The genre's target character is the heart of the visual identity. We need a
clean, original design.

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Mochi — front idle (Sweet Shop) | `assets/mochi/mochi-front-idle.png` | PNG sprite sheet | Transparent | 4 frames × 256×256 | Idle blink loop. Replaces procedural ellipse-with-teeth. | Round mint-green body (`#c2e5b8`) with white belly, two black dot eyes (with closed-blink frame), tiny mouth, gentle smile. Reads at 96 px in-game. | C |
| Mochi — front anticipate | `assets/mochi/mochi-front-anticipate.png` | PNG sprite sheet | Transparent | 6 frames × 256×256 | Plays when candy is in range and falling. | Eyes track up, mouth opens partially over 6 frames; body squashes downward in last frame. | C |
| Mochi — chomp | `assets/mochi/mochi-chomp.png` | PNG sprite sheet | Transparent | 4 frames × 256×256 | Successful catch. | Mouth fully open, body reaches up, snap closed, return to idle. | C |
| Mochi — sad | `assets/mochi/mochi-sad.png` | PNG sprite sheet | Transparent | 3 frames × 256×256 | Fail. | Mouth corners drop, eyes squint, single ear flop. | C |
| Mochi — Greenhouse palette | `assets/mochi/mochi-coral-frames.zip` | ZIP of PNG sheets | Transparent | Same dims | Coral palette variant, all four states. | Body recoloured to `#ee9870`, white belly, eyes unchanged. | I |
| Mochi — Workshop palette | `assets/mochi/mochi-lavender-frames.zip` | ZIP of PNG sheets | Transparent | Same dims | Lavender variant, all four states. | Body `#c7a6e2`, otherwise unchanged. | I |
| Mochi — silhouette test | `assets/mochi/silhouette-test.png` | PNG | Opaque | 256×256 | Pure-black silhouette check. The character must read in silhouette alone. | Just the body shape, no detail. | C |

**Design must-haves:**
- Friendly, never angry or scary.
- Distinct silhouette: round body with two small ear-tufts on top.
- Eyes are the focal point; do not give him a complicated mouth.
- No fingers or hands.
- Never copies a known mascot pose, palette, or expression.

## 6 — World backdrop panels

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Sweet Shop backdrop | `assets/worlds/sweetshop-backdrop.png` | PNG | Opaque | 2048×1280 | Wall behind the gameplay plane. | Cream wall with horizontal wainscoting, two simple shelf brackets, one painted poster (no readable text). Soft warm gradient. | I |
| Greenhouse backdrop | `assets/worlds/greenhouse-backdrop.png` | PNG | Opaque | 2048×1280 | Damp clay wall with arched window + faint fern silhouettes. | Soft mints; slight moisture sheen; no people, no animals. | I |
| Workshop backdrop | `assets/worlds/workshop-backdrop.png` | PNG | Opaque | 2048×1280 | Brushed-steel wall + tool silhouettes + warm pendant light. | Slate base, copper highlights, warm lantern glow upper-right. | I |
| Floor / shelf strip | `assets/worlds/shelf-strip-{world}.png` | PNG, tileable | n/a | 256×128 | Repeats horizontally as the gameplay floor. Three variants: `sweet`, `green`, `work`. | Warm wood / clay tile / brushed steel respectively. | I |

## 7 — Hazards

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Spike row | `assets/hazards/spikes.png` | PNG sprite | Transparent | 384×96 | Bank of 6 spikes for level 7+. | Steel-blue triangles (`#5a6a7a`), sharp shadow under, single tip highlight. | I |
| Hazard splash | `assets/hazards/splash.png` | PNG sprite | Transparent | 256×256 | One-frame splat on candy-on-spike fail. | Pink wash + small candy fragments. | O |

## 8 — Bubble (mechanic)

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Bubble body | `assets/devices/bubble.png` | PNG sprite | Transparent | 256×256 | Replaces procedural translucent sphere. | Pearly white with iridescent rim (subtle blue→pink shift). 70 % opacity. Soft ambient highlight. | I |
| Bubble pop | `assets/devices/bubble-pop.png` | PNG sprite sheet | Transparent | 4 frames × 256×256 | Pop animation. | Six rim shards radiate then fade. | I |

## 9 — Blower (mechanic)

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Blower nozzle | `assets/devices/blower.png` | PNG sprite | Transparent | 192×128 | Replaces procedural cylinder. | Brushed-steel funnel with copper rim. Visible nozzle direction. | I |
| Blower draft motes | `assets/devices/blower-motes.png` | PNG sprite | Transparent | 256×256 | Subtle drifting dust pattern; particles use this as their sprite. | Fine white-warm dust. Fully additive. | O |

## 10 — Moving anchor (mechanic)

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Track rail | `assets/devices/track-rail.png` | PNG, tileable | n/a | 128×16 | Horizontal track strip the moving anchor runs along. | Brushed steel + tiny rivets. | O |

## 11 — Spider / thief (V2 mechanic, listed for forward planning)

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Spider — descend | `assets/devices/spider-descend.png` | PNG sprite sheet | Transparent | 6 frames × 192×192 | Walks down a rope. | Friendly cartoon, two big eyes, no fangs. | O (V2) |
| Spider — happy | `assets/devices/spider-happy.png` | PNG sprite sheet | Transparent | 4 frames × 192×192 | Plays when spider steals candy. | Smiles, candy in front. | O (V2) |

## 12 — Particle sprites

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Confetti shards | `assets/fx/confetti.png` | PNG sprite sheet | Transparent | 8 cells × 64×64 | Instanced quads on level-cleared. | Mixed warm colours, simple rectangles + diamonds. | I |
| Sparkle dot | `assets/fx/sparkle.png` | PNG sprite | Transparent | 32×32 | Star-collect particle. | Single bright dot + cross flare. | I |
| Smoke puff | `assets/fx/puff.png` | PNG sprite | Transparent | 128×128 | Used by chomp + bubble-pop. | Soft white-grey radial. | O |

## 13 — UI panels (Cut-the-Rope-specific)

The platform supplies most chrome (`.btn`, `.glass-panel`, `.hud-chip`).
These are the cut-rope-only panels.

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Level-complete card frame | `assets/ui/level-complete-frame.png` | PNG (9-slice) | Transparent | 768×512 | Frame behind the stars summary. | Soft warm paper, scalloped border, subtle drop shadow. | O |
| Star pip on / off | `assets/ui/star-pip-on.png` / `star-pip-off.png` | PNG sprites | Transparent | 64×64 | HUD chip showing earned stars in level select. | Same star design as in-game collectible, smaller and stylized. | I |
| Lock icon | `assets/ui/lock.png` | PNG sprite | Transparent | 64×64 | Locked level in level select. | Brass padlock, no chain, soft drop shadow. | I |

## 14 — Level select thumbnails

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Per-level thumbnail | `assets/levels/thumb-l1.png` … `thumb-l10.png` | PNG | Opaque | 320×200 | Pre-rendered preview of each level's start state. | Top-down lit shot of the level on the relevant world backdrop. | O |

## 15 — Tutorial callouts

| Asset | File | Type | Background | Dimensions | Purpose | Style notes | Priority |
|---|---|---|---|---|---|---|---|
| Tap cursor cue | `assets/ui/tap-cue.png` | PNG sprite sheet | Transparent | 4 frames × 96×96 | "Tap" pulse over the rope on level 1. | Concentric ripple + finger silhouette. Loops. | I |
| Swipe arrow cue | `assets/ui/swipe-cue.png` | PNG sprite sheet | Transparent | 4 frames × 192×96 | "Drag across" hint on the multi-rope level. | Trailing arrow with motion-blur dots. | I |

---

## Delivery format

Preferred:
- 32-bit PNG, straight alpha (not premultiplied).
- One file per asset (no atlas packing — engine packs at build time).
- ZIPs OK for character variant sets where each variant has many frames.

For 3D meshes:
- glTF Binary (`.glb`) only.
- One material per slot, no embedded textures unless a single map.
- No animations baked into the mesh — runtime drives transforms.

## What does NOT need an asset

- Backdrops on platform cards / modals (CSS gradient handles it).
- Score numerals (platform mono font).
- Game route (HashRouter; no special asset).
- Favicons (platform-wide).

## Hand-off process

1. Drop new files into `src/games/cut-rope/assets/...` matching the structure above.
2. The level loader checks for the file at runtime; if present, swaps the procedural material/mesh; if not, falls back to procedural.
3. No code changes required for routine asset swaps.
