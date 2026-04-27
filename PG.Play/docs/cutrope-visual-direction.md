# Cut-the-Rope-style game — visual direction

## Mood

A premium toy-box diorama. The puzzle reads as a small, lit object
on a warm shelf: glossy candy on a soft-yellow rope; matte painted
plaster walls in the back; a gentle key light from upper-left. Not
a video-game UI, not a flat 2D board.

The keyword is **tactile**. Every object should look like it could be
picked up with two fingers.

## Camera

Orthographic. Frustum height ~12 world units. Camera at Z=10 looking
at the gameplay plane. The vertical axis is the puzzle's "up"; gravity
is +Y in screen space.

A subtle depth-of-field-like effect comes from the backdrop being a
slightly darker / slightly desaturated layer, not from a real DOF pass
(those cost too much for the per-game budget).

## Three worlds (theme rotation across the 10 levels)

| World | Levels | Backdrop palette | Floor / surface | Mood notes |
|---|---|---|---|---|
| **Sweet Shop** | 1–4 | Cream `#fff3e2`, soft pink `#ffd6cc`, warm gold `#f0b35b` | Wooden shelf with subtle grain | Bakery shop window. The first one a player sees. Inviting, low contrast. |
| **Greenhouse** | 5–7 | Soft mint `#cfeec5`, dusty terracotta `#c97e5a`, deep moss `#4f7d4f` | Damp clay tile + leaf litter | Botanical / quiet outdoors. Bubbles introduced here read as soap-on-water. |
| **Workshop** | 8–10 | Slate `#3d4855`, copper `#c8784e`, ember `#ff7b3a` | Brushed steel + warm wood trim | Tinkerer's bench. Blowers, moving cogs, sparks. |

## Material palette

| Object | Material |
|---|---|
| **Candy** | Saturated pink-red core (`#ff4d6d`) with a glossy lambert + small fresnel rim. Wrapped ends are warm yellow `#ffe14f` (Sweet Shop) / leaf-green `#9ddb8d` (Greenhouse) / brassy `#e2b264` (Workshop). |
| **Rope** | Warm yellow-cream `#e8c46f` core, slightly desaturated highlight, very thin outline. Renders as a 2-pixel-thick line with a slight bow. |
| **Anchor pin** | Brushed steel `#9aa7b3` (Sweet Shop) / mossy bronze `#8c8a4f` (Greenhouse) / hot copper `#ce744a` (Workshop). Round bevel. |
| **Star** | Saturated gold `#ffd24a` body, white inner highlight, soft halo additive plane behind. Slow self-rotation. |
| **Target creature** | A friendly puff-creature called **Mochi**. Soft round body in mint-green `#c2e5b8` (Sweet Shop) / coral `#ee9870` (Greenhouse) / lavender `#c7a6e2` (Workshop). White belly, dot eyes, expressive but minimal. |
| **Bubble** | Translucent pearly white with iridescent rim (fresnel). 0.7 opacity, additive highlight. |
| **Blower** | Faceted nozzle. Renders a faint cone of motes drifting along its force vector. |
| **Spike** | Steel-blue `#5a6a7a` triangle bank. Sharp shadow underneath sells "this hurts." |

## Lighting

- One key directional `(0.7, -0.6, 0.4)` warm `#ffd9a8` intensity ~1.4.
- One fill directional `(-0.5, -0.2, 0.6)` cool `#cde0ff` intensity ~0.4.
- Ambient warm `#fff5e7` intensity ~0.25.
- No shadows on the gameplay plane (cost). Soft fake AO under the candy:
  a darkened ellipse on the floor that follows X position.

## Backdrop

Each world has a **flat backdrop plane** at Z=-2. It's a procedural
gradient + a couple of decorative meshes (e.g. shelf brackets in the
Sweet Shop world; potted ferns in the Greenhouse). The decorative
meshes never cross the gameplay plane.

A subtle vignette (radial darkening) at the edges sells the diorama
feel.

## Animations

- **Candy idle**: tiny rotational wobble proportional to rope velocity.
  Squash on rope-cut moment (vertical stretch over 120ms).
- **Star collect**: scale-burst to 1.4× then 0; eight radial sparkle
  particles; sound cue.
- **Target idle**: slow vertical bob (sin wave, period ~2.4 s, amp 0.05u).
- **Target anticipate**: when candy is within 1.5u and falling, body
  leans toward the candy, mouth opens.
- **Target chomp**: 200ms close-mouth animation + small ground-impact
  particle puff + happy sound.
- **Target sad** (fail): mouth corners drop, eyes shut briefly. 600ms
  before fail-overlay shows.
- **Bubble pop**: 6 rim shards radiate; a `pop` cue plays.
- **Level complete**: vignette warms; small confetti emitter from above;
  star summary card slides up over a 280ms ease-out.
- **Level fail**: candy splat (scale Y 0.4, opacity 0.7) + dim overlay.

## UI typography + chrome

- HUD chips reuse the platform `.hud-chip` style. Top bar centered on
  Sweet-Shop levels; flush-left on Workshop levels (heavier industrial
  vibe).
- Modal cards reuse `.glass-panel` style from the platform.
- Numerals are the platform's mono font for star counts; sans for body.

## Things to avoid

- Hyper-realistic textures.
- Neon gradients / synthwave palettes.
- Heavy bloom.
- A "level cleared" stamp that obscures the candy's final position.
- A target creature that looks angry — this is a friendly game.
