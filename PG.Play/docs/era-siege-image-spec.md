# Era Siege — Image / Animation Spec for Re-bake

This is the authoritative spec for art that lands in
`public/games/era-siege/`. Read this end-to-end before exporting anything;
the rules at the top are the ones that fix the *black-border* problem.

---

## 0. The dark-fringe rule (read this first)

The black halo around every unit silhouette comes from **dark RGB on
semi-transparent edge pixels**. When Photoshop / Krita / Aseprite export
a PNG, the transparent pixels often carry the background colour (black or
deep blue) in their RGB channel — the alpha hides them, but as soon as
the canvas composites them over a different background the dark RGB
bleeds back in as a halo.

**Two ways to author so this never happens:**

1. **No background layer.** Author on a fully transparent canvas. Do not
   flatten onto a dark layer before exporting. If you must matte, matte
   onto **white**, not black — white halos compress into invisibility
   on our dark canvas.

2. **Bleed RGB outward.** Before export, run an "alpha bleed" or
   "edge padding" pass:
   - Aseprite: `Edit → Tile / Edge Bleed` (1–2 px ring)
   - Photoshop: `Filter → Other → Maximum (Radius 1, Alpha = Preserve)`
     then `Defringe (1 px)` from `Layer → Matting → Defringe`
   - Krita: select transparent area → `Filter → Map → Bleed` (1 px)
   - GIMP: `Layer → Transparency → Threshold Alpha` then `Filter → Map
     → Bleed`
   - Command-line: `magick convert in.png -channel A -threshold 50% +channel
     -alpha set out.png` (ImageMagick — flattens semi-transparent to
     fully opaque or fully transparent, which kills the dark fringe).

The runtime now applies a defensive **runtime alpha-fringe cleanup**
in `assets.js` (the `cleanAlphaFringe` pass copies RGB from the nearest
opaque pixel into semi-transparent neighbours), so even un-bled exports
should render clean on the dashboard. But authoring it correctly at
source is faster, cleaner, and bullet-proof.

**Verification before shipping:**
- Open the PNG over a `#ff00ff` (bright magenta) layer in any image
  editor. If you see **any** dark ring around the silhouette, the
  export still has the fringe — re-export.
- Or load the PNG in a browser with the dev-console snippet at the
  bottom of this doc (drops it onto a magenta canvas).

---

## 1. Battlefield art (already shipped, procedurally drawn)

These are **drawn procedurally** at runtime; **do not re-deliver them as
PNGs**. They live in `placeholders.js` and `parallax.js` and respond to
the era palette automatically.

- `bg/era<N>/sky.png` — skip (procedural).
- `bg/era<N>/clouds.png` — skip (procedural, drift over time).
- `bg/era<N>/mountains-far.png` — skip (procedural).
- `bg/era<N>/mountains-mid.png` — skip (procedural).
- `bg/era<N>/foreground.png` — skip (procedural).
- `base/era<N>/player.png` and `base/era<N>/enemy.png` — skip (procedural).

If you really want hand-art skies, deliver them as **opaque** PNGs at
`1920 × 720` covering the sky band only (above `groundY`), but keep in
mind they bypass the cool-overlay theme bridge and will need to ship in
the dashboard palette family (deep blue carbon with one era-accent
mote/highlight).

---

## 2. Units — what we actually need from you

15 unit types + 5 generals = **20 unit identities**. Each needs:

- **1 × static pose** (idle, neutral stance)
- **3 × animation strips** (walk, attack, idle) at **6 horizontal
  frames each**, all the same canvas height and per-frame width

So per unit: 1 static + 18 animation frames = **a single sheet of 19
poses** is the easiest delivery format (1 static + 3 strips of 6 frames).

### Sheet layout (recommended single PNG per unit)

```
┌─────────────────────────────────────────────────┐
│ static (idle pose)                              │  row 0
├─────────────────────────────────────────────────┤
│ walk 1 │ walk 2 │ walk 3 │ walk 4 │ walk 5 │ walk 6 │  row 1
├─────────────────────────────────────────────────┤
│ atk 1  │ atk 2  │ atk 3  │ atk 4  │ atk 5  │ atk 6  │  row 2
├─────────────────────────────────────────────────┤
│ idle 1 │ idle 2 │ idle 3 │ idle 4 │ idle 5 │ idle 6 │  row 3
└─────────────────────────────────────────────────┘
```

I will crop the rows into separate PNGs server-side; you only need to
deliver the master sheet. Naming: `master/unit/era<N>/<role>.png`
(eras 1–5, roles `frontline` / `ranged` / `heavy` / `general`).

### Per-unit canvas size

- **Frontline / Ranged**: each cell **160 px wide × 200 px tall** (so
  walk strip is 960 × 200). Static pose is one 160 × 200 cell.
- **Heavy**: cell **200 px × 240 px** (strip 1200 × 240).
- **General**: cell **240 px × 300 px** (strip 1440 × 300, larger so
  the upscale in-game stays crisp — generals render at ≈235 px tall).

These are at **1× target size**. If you author at 2× for retina, that's
fine — deliver at 2× and I'll crop, but make sure the proportions match
the table above when normalised.

### Anchor + framing

- **Foot anchor**: the unit's **feet at the bottom edge of each cell**,
  centred horizontally. The renderer composites at the foot.
- Leave **6–8 px of breathing room** above the head and to either
  side — gives the runtime walk-bob and attack-lean animations room
  to move without clipping.
- **Facing**: deliver units facing **right** (player side). The
  renderer flips for enemy via `ctx.scale(-1, 1)`.

### Animation cadence

- **Walk (6 frames)**: full step cycle — heel-strike, push-off, lift,
  pass, lift, plant. Loops cleanly. Frame 1 should mirror frame 4 so
  the loop reads as alternating legs. Bob amplitude ≈ 2 px for frontline,
  1 px for heavy/general.
- **Attack (6 frames)**: anticipation → windup → strike → contact →
  recover → return. Frame 3 is the strike; frame 4 should be at peak
  reach. Lean forward ~4 px on frames 2–4.
- **Idle (6 frames)**: ambient breath — chest rises 1 px on frames 2–3,
  settles 4–6. No big motion, just life. Loop cadence ≈ 1.5s at 60fps.

### Style guide — what works on the dashboard

- **Silhouette first**: the unit must read as a clean shape at 64 px
  tall. Test by squinting / shrinking the export to 32 px wide.
- **Palette**:
  - Body / armour: cool darks (deep blue, charcoal, slate). Era flavour
    via **one accent colour** per era:
    - Era 1 (Ember Tribe): amber-orange `#ffb84a`
    - Era 2 (Iron Dominion): cyan `#7fd6ff`
    - Era 3 (Sun Foundry): gold `#ffd070`
    - Era 4 (Storm Republic): ice `#a8e1ff`
    - Era 5 (Void Ascendancy): violet `#c79bff`
  - Weapon edge / glow / banner: era accent
  - Skin / face: warm neutral (cream, tan) — small areas only
- **No outlines** thicker than 1 px. Pixel-art chunky black outlines
  fight the cool overlay; thin or no outline reads better.
- **No painted shadows under the foot** — the renderer paints a soft
  drop-shadow ellipse at composite time. If you bake one in, it
  doubles up.
- **No background fill or vignette** — alpha must be 0 outside the
  silhouette pixels.

### Delivery file structure

```
public/games/era-siege/master/unit/
  era1/
    frontline.png    ← master sheet for era 1 frontline
    ranged.png
    heavy.png
    general.png
  era2/
    frontline.png
    ...
  era5/
    frontline.png
    ranged.png
    heavy.png
    general.png      ← era 5 has two: general.png + general-alt.png if you have one
```

I'll run `scripts/era-siege-crop-sheets.mjs` to slice into:
```
public/games/era-siege/unit/era<N>/<role>.png            ← static pose
public/games/era-siege/sprites/unit/era<N>/<role>/walk.png    ← 6-frame strip
public/games/era-siege/sprites/unit/era<N>/<role>/attack.png  ← 6-frame strip
public/games/era-siege/sprites/unit/era<N>/<role>/idle.png    ← 6-frame strip
```

These keys are what `assets.js` registers. Don't rename.

---

## 3. Turrets

Same structure but **simpler** — turrets don't walk. Per turret:
- **1 × idle frame** (the default render)
- **1 × fire frame** (muzzle flash / arm extended)
- **1 × recoil frame** (recoiled body, settle pose)

15 turrets × 3 frames = **45 PNGs**. Deliver as **3 strips per turret**
(idle, fire, recoil) in one sheet of 3 cells if you prefer, or as
individual files.

### Per-turret canvas size

- All tiers (light / medium / heavy) at the **same cell size: 96 × 64 px**
  (or 192 × 128 at 2×).
- Foot-anchored to bottom centre. Barrel pointing **right** (player faces
  east; enemy renders flipped).

### Tier discrimination

- Light: thin barrel, single accent stripe.
- Medium (era pick): the "main" silhouette.
- Heavy: chunkier base, double accent stripe or extra prong.

Renderer falls back to medium if light/heavy don't ship — so prioritise
the **5 medium turrets** first; light + heavy are batch 2.

### Delivery file structure

```
public/games/era-siege/master/turret/
  era1.png        ← 3-cell sheet (idle / fire / recoil) for medium tier
  era1-light.png  ← optional, batch 2
  era1-heavy.png  ← optional, batch 2
  …
  era5.png
```

I'll slice into:
```
public/games/era-siege/turret/era<N>.png
public/games/era-siege/turret/era<N>-fire.png
public/games/era-siege/turret/era<N>-recoil.png
```

---

## 4. Projectiles

6 projectiles total, each a small (16–24 px) PNG. **No animation** —
the renderer rotates them to velocity vector and adds a trail.

- File: `public/games/era-siege/projectile/<id>.png`
- IDs: `bone-shard`, `crossbow-bolt`, `steam-bolt`, `arc-bolt`,
  `mortar-shell`, `void-orb`
- Canvas: **32 × 16 px** for bolts (horizontal), **24 × 24 px** for orbs
- Anchor: centre
- Style: bright core + soft glow, era-themed colours (already specified
  in `content/projectiles.js`)

---

## 5. VFX (impact rings / muzzle flash / explosions)

These are **already shipped** as sprite strips. If you want to replace
them, the existing strip structure is:

- `vfx/hit-spark.png` — **9 frames horizontal**, each 32 × 32 (total
  288 × 32). Bright cyan or amber radial.
- `vfx/muzzle-flash.png` — **4 frames horizontal**, each 128 × 128
  (total 512 × 128).
- `vfx/explosion-12.png` — **12 frames horizontal**, each 96 × 96
  (total 1152 × 96).

Authoring strips at 2× target is fine — renderer downscales.

---

## 6. Special / power-up icons

Per era, two specials (Q and W). Two icon PNGs per era × 5 eras = 10:

- File: `public/games/era-siege/special-era<N>.png` (primary, Q)
- File: `public/games/era-siege/special-era<N>-2.png` (secondary, W)
- Canvas: **64 × 64 px**, square, foot-anchored.
- Style: silhouette of the effect (fire arrow, lightning bolt, void
  rift, etc.) on transparent background, era-accent colour.

Already shipped placeholders — only re-deliver if you have a stronger
direction.

---

## 7. Power-up tree icons (in the drawer)

7 trees × 1 icon each:
- `economy`, `base`, `special`, `turret`, `troopDmg`, `troopHp`, `troopRng`
- Canvas: **48 × 48 px**, single PNG, transparent background
- Style: monochrome glyph in `var(--es-cyan-1)` (`#5dd6ff`)
- File: `public/games/era-siege/powerup/<treeId>.png`

Currently rendered as CSS-only chips — these would be a nice
upgrade, batch 3.

---

## 8. What I do NOT need

- Backgrounds (procedural — see § 1)
- Bases (procedural — see § 1)
- HUD chrome (CSS / canvas-drawn — TopBar plates, action bar pills,
  modals, banners, kill feed, achievement toast, all built from CSS
  glass-blur + cyan tokens)
- Cursor / pointer assets
- Title-screen art (handled by the parent lobby)

---

## 9. Verification snippet (drop in browser dev tools)

After delivering a PNG, run this in any browser tab pointed at
`http://localhost:5180/` to visualise the alpha fringe:

```js
(async () => {
  const url = 'games/era-siege/unit/era1/frontline.png';
  const img = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = url; });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth * 4 + 32;
  c.height = img.naturalHeight * 2 + 32;
  const ctx = c.getContext('2d');
  // Magenta backdrop — any dark fringe will show as a black ring
  ctx.fillStyle = '#ff00ff';
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 4; i++) ctx.drawImage(img, i * img.naturalWidth + 8, 8);
  Object.assign(c.style, { position: 'fixed', top: '20px', left: '20px', zIndex: 9999, border: '4px solid #fff' });
  document.body.appendChild(c);
})();
```

If the silhouettes show clean magenta around them with no dark halo,
the export is good. If you see a dark ring (even subtle), re-bleed.

---

## 10. Priority order

If you can only deliver in batches:

1. **Batch 1 (critical)** — 5 frontline + 5 ranged static poses. Get
   the dock + lane reading clean.
2. **Batch 2 (important)** — walk + attack strips for those 10 units.
3. **Batch 3 (important)** — 5 heavy static + strips, 5 general static
   + strips.
4. **Batch 4 (polish)** — turret sheets, projectile sprites.
5. **Batch 5 (optional)** — VFX, special icons, powerup glyphs.

---

## 11. Ping me when

- You're unsure about a frame count or canvas size.
- You hit the dark-fringe issue on export and want me to re-run the
  runtime cleanup against a sample.
- You want the **complete** key list dumped out of `assets.js`
  (every PNG path the manifest will pick up); say the word and I'll
  generate it.
