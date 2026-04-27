# Era Siege — Image / Sprite Asset Wishlist

Every entry maps to an asset key in
`src/games/era-siege/engine/assets.js`. Drop a PNG (or sprite-sheet PNG)
at the listed `File name` path under `public/games/era-siege/`, and the
asset manifest will use it instead of the procedural placeholder.
Filenames are stable contracts — keep them exact.

All sprites should be authored at **2× target dimensions** so HiDPI
(`devicePixelRatio = 2`) screens stay crisp; the manifest downscales by
the canvas DPR.

Style anchor for everything: **dark, painterly silhouette-first, low to
moderate saturation, single accent per era**. No gradients on
gameplay-critical art (units / projectiles / impacts) — the renderer
adds atmosphere, the art carries the silhouette.

Priorities:
- **critical** — game looks placeholder-y without it; ship first
- **important** — meaningful upgrade; ship in batch 2
- **optional** — polish; ship when content allows

---

## 1. Battlefield backgrounds (sky / cloud band)

### Ember Tribe — sky band
- File name: `era-siege/bg/era1/sky.png`
- Type: PNG (single image)
- Transparent: no
- Recommended dimensions: 1920×600 (intrinsic; renderer stretches horizontally)
- Purpose: top sky layer, painted dusk gradient + atmospheric haze
- Where used: `engine/parallax.js#drawSky('ember-tribe')`
- Visual style: painterly sunset, faint dust haze, warm
- Color palette: `#ff8a3a → #7d2a10` with bone-white sun disc top-left
- Animation frames: 1
- Notes for generation: low contrast, no shapes, no birds. The renderer adds clouds on a separate layer.
- Priority: important

### Ember Tribe — cloud strip
- File name: `era-siege/bg/era1/clouds.png`
- Type: PNG sprite-sheet (1×3 frames, horizontally tiling)
- Transparent: yes
- Recommended dimensions: 1920×220 per frame (3 frames stacked = 1920×660 total)
- Purpose: drifting cloud band, era-tinted
- Where used: `engine/parallax.js#drawClouds`
- Visual style: 3 silhouette clouds per frame, soft edges, ember-tinted from below
- Color palette: `#ffb070`, `#d36a3a`, `#7d2a10` accents
- Animation frames: 3 (0/1/2 — drift offsets, used as parallax tiles)
- Notes for generation: tile-able horizontally; the right edge must align with the left edge of the next frame
- Priority: important

### Iron Dominion — sky band
- File name: `era-siege/bg/era2/sky.png`
- Type: PNG
- Transparent: no
- Recommended dimensions: 1920×600
- Purpose: overcast steel sky
- Where used: `engine/parallax.js#drawSky('iron-dominion')`
- Visual style: muted, cold, flat-ish
- Color palette: `#7d8794 → #262e38`
- Animation frames: 1
- Notes: a faint banner pole silhouette at top-left adds period flavour
- Priority: important

### Iron Dominion — cloud strip
- File name: `era-siege/bg/era2/clouds.png`
- Type: PNG sprite-sheet (1×3)
- Transparent: yes
- Recommended dimensions: 1920×220 per frame
- Purpose: heavy slow stratus
- Where used: `engine/parallax.js#drawClouds`
- Visual style: long flat clouds, low contrast
- Color palette: `#a09080`, `#d8d4cc`
- Animation frames: 3
- Priority: important

### Sun Foundry — sky band
- File name: `era-siege/bg/era3/sky.png`
- Type: PNG
- Transparent: no
- Recommended dimensions: 1920×600
- Purpose: heat-haze brass sky
- Where used: era 3 sky
- Visual style: warm haze, sun glow upper-right
- Color palette: `#dba85a → #62311a`
- Animation frames: 1
- Priority: important

### Sun Foundry — smokestack cloud strip
- File name: `era-siege/bg/era3/clouds.png`
- Type: PNG sprite-sheet (1×3)
- Transparent: yes
- Recommended dimensions: 1920×220 per frame
- Purpose: industrial smoke columns visible in the cloud band
- Where used: era 3 cloud layer
- Visual style: vertical plumes blending into haze
- Color palette: `#ffcb6b`, `#a26830`
- Animation frames: 3
- Priority: important

### Storm Republic — sky band
- File name: `era-siege/bg/era4/sky.png`
- Type: PNG
- Transparent: no
- Recommended dimensions: 1920×600
- Purpose: stormy night sky
- Where used: era 4 sky
- Visual style: deep teal-blue, occasional soft arc flicker baked in
- Color palette: `#3c5777 → #0e1622` with `#7be3ff` highlight
- Animation frames: 1
- Notes: keep flicker subtle — renderer adds extra arcs
- Priority: important

### Storm Republic — clouds
- File name: `era-siege/bg/era4/clouds.png`
- Type: PNG sprite-sheet (1×3)
- Transparent: yes
- Recommended dimensions: 1920×220 per frame
- Purpose: thunderhead silhouettes
- Visual style: dark, undertone of teal
- Color palette: `#0c121b`, `#3c5777`, `#7be3ff` highlight
- Animation frames: 3
- Priority: important

### Void Ascendancy — sky band
- File name: `era-siege/bg/era5/sky.png`
- Type: PNG
- Transparent: no
- Recommended dimensions: 1920×600
- Purpose: void cosmos sky
- Where used: era 5 sky
- Visual style: deep purple, sparse stars (10–20 small specks)
- Color palette: `#1a0a3a → #080014`
- Animation frames: 1
- Priority: important

### Void Ascendancy — void rifts
- File name: `era-siege/bg/era5/clouds.png`
- Type: PNG sprite-sheet (1×3)
- Transparent: yes
- Recommended dimensions: 1920×220 per frame
- Purpose: drifting void rift silhouettes (replaces clouds for era 5)
- Color palette: `#c89bff`, `#1a0a3a`
- Animation frames: 3
- Priority: important

---

## 2. Midground silhouettes (far mountains, mid hills)

For each era ship two layers — far (alpha 0.6) and mid (alpha 0.85). The renderer stacks them.

### Ember Tribe — far mountains
- File name: `era-siege/bg/era1/mountains-far.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×280
- Purpose: jagged distant peaks
- Color palette: `#2c150a`
- Animation frames: 1
- Notes: silhouette-only, 5–7 peaks, varied heights
- Priority: critical

### Ember Tribe — mid hills
- File name: `era-siege/bg/era1/mountains-mid.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×220
- Purpose: closer hills with crude bone/wood motifs along the ridge
- Color palette: `#3a2a10`
- Animation frames: 1
- Notes: 3–4 hills + 4–6 tiny silhouette elements (bones, wooden poles)
- Priority: critical

### Iron Dominion — far mountains
- File name: `era-siege/bg/era2/mountains-far.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×280
- Color palette: `#1c2128`
- Notes: blocky escarpments, watchtower silhouettes on 1–2 peaks
- Priority: critical

### Iron Dominion — mid hills
- File name: `era-siege/bg/era2/mountains-mid.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×220
- Color palette: `#2c2a26`
- Notes: rolling hills + a fortified structure silhouette
- Priority: critical

### Sun Foundry — far / mid
- File name: `era-siege/bg/era3/mountains-far.png` / `…mid.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×280 / 1920×220
- Color palette: `#3a1f12` / `#3a261a`
- Notes: smokestack chimneys + brass-domed industrial silhouettes
- Priority: critical

### Storm Republic — far / mid
- File name: `era-siege/bg/era4/mountains-far.png` / `…mid.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×280 / 1920×220
- Color palette: `#0c121b` / `#1a2030`
- Notes: lightning rods on cliffs (far), telephone-pole-like fixtures (mid)
- Priority: critical

### Void Ascendancy — far / mid
- File name: `era-siege/bg/era5/mountains-far.png` / `…mid.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×280 / 1920×220
- Color palette: `#0a0418` / `#100828`
- Notes: floating monolith silhouettes, faint glyph runes
- Priority: critical

---

## 3. Foreground terrain overlays (per era)

Single PNG per era covering the bottom 10% of stage with rocks/grass/debris.

### Era 1–5 — foreground
- File name: `era-siege/bg/era<N>/foreground.png` for N=1..5
- Type: PNG
- Transparent: yes
- Recommended dimensions: 1920×120
- Purpose: nearest visual layer, sits in front of units' feet shadow
- Visual style: silhouette, era-tinted darkest tone
- Color palette: per-era ground-detail (`#1e1608`, `#1a1714`, `#1f140c`, `#0a0e15`, `#04001a`)
- Animation frames: 1
- Notes: scatter rocks (3–5), grass tufts (8–12), era-specific debris (bones, banners, scrap, rods, crystal shards)
- Priority: important

---

## 4. Player base art (per era)

### Era 1–5 — player base
- File name: `era-siege/base/era<N>/player.png` for N=1..5
- Type: PNG
- Transparent: yes
- Recommended dimensions: 240×280
- Purpose: replaces the procedural box with detailed structure
- Where used: `assets.draw('base/era<N>/player', x, groundY, { facing: 1 })`
- Visual style: silhouette-readable from 100 px wide; era-specific archway, banner, doorway
- Color palette: era-tinted dark + banner accent
- Animation frames: 1 (base) + optional 2-frame banner flutter
- Notes: face right (toward enemy). Banner clearly identifies "your" side. Door visible. HP-bar will be drawn over by code, leave the top 24 px clear.
- Priority: critical

### Era 1–5 — enemy base
- File name: `era-siege/base/era<N>/enemy.png` for N=1..5
- Type: PNG
- Transparent: yes
- Recommended dimensions: 240×280
- Notes: mirror of player base, faces left, **bannerEnemy** color (red-tinted) instead of player banner
- Priority: critical

---

## 5. Turret sprites (5 era variants)

### Bone Crossbow / Iron Ballista / Brass Mortar / Volt Cannon / Void Lance
- File name: `era-siege/turret/era<N>.png` for N=1..5
- Type: PNG sprite-sheet (1×3 frames: idle / fire / recoil)
- Transparent: yes
- Recommended dimensions: 84×84 per frame (sheet 252×84)
- Purpose: turret rendered atop player base slots (3 slots) and enemy base slots
- Where used: `assets.draw('turret/era<N>', x, y, { frame, team })`
- Visual style: fortified weapon emplacement, era-specific silhouette (crossbow / ballista / mortar / tesla / lance)
- Color palette: from `content/turrets.js` (`baseColor` / `barrelColor`); designer can pull from there
- Animation frames: 3
- Notes:
  - Frame 0 idle (long resting)
  - Frame 1 fire (barrel forward, glow)
  - Frame 2 recoil (barrel back, smoke)
  - Anchor point: bottom-center (the renderer places the foot of the sprite on the base's turret-row line)
  - For tesla turrets: faint arc sprite baked into idle frame is OK
- Priority: critical

---

## 6. Unit sprite sheets (15 units)

Each unit sheet has **8 frames horizontal × 4 rows vertical** = 32 cells:
- Row 0: walk (4 frames) + idle (2) + null (2)
- Row 1: attack (4 frames) — windup, strike, hit, recover
- Row 2: hit-react (2 frames) + null (6)
- Row 3: death (4 frames) + null (4)

### Era 1
- `era-siege/unit/era1/frontline.png` — Ember Runner — 256×256 (32×32 per cell, 8×4 grid stretched to 64×64 if needed for clarity); priority **critical**
- `era-siege/unit/era1/ranged.png` — Bone Slinger — 256×256; priority **critical**
- `era-siege/unit/era1/heavy.png` — Pyre Bearer — 256×256; priority **critical**

### Era 2
- `era-siege/unit/era2/frontline.png` — Oath Spear — 256×256; priority **critical**
- `era-siege/unit/era2/ranged.png` — Crossbow Sworn — 256×256; priority **critical**
- `era-siege/unit/era2/heavy.png` — Iron Bastion — 320×256 (heavies are wider); priority **critical**

### Era 3
- `era-siege/unit/era3/frontline.png` — Brass Skirmisher — 256×256; priority **critical**
- `era-siege/unit/era3/ranged.png` — Steam Caster — 256×256; priority **critical**
- `era-siege/unit/era3/heavy.png` — Forge Hauler — 384×320 (mech-class); priority **critical**

### Era 4
- `era-siege/unit/era4/frontline.png` — Rail Trooper — 256×256; priority **critical**
- `era-siege/unit/era4/ranged.png` — Voltaic Sharpshooter — 256×256; priority **critical**
- `era-siege/unit/era4/heavy.png` — Howitzer Walker — 384×320; priority **critical**

### Era 5
- `era-siege/unit/era5/frontline.png` — Cinder Wraith — 256×256; priority **critical**
- `era-siege/unit/era5/ranged.png` — Echo Lance — 256×256; priority **critical**
- `era-siege/unit/era5/heavy.png` — Singular Colossus — 448×384 (titan-class); priority **critical**

For all unit sheets:
- Type: PNG sprite-sheet (rows × cols listed above)
- Transparent: yes
- Visual style: silhouette-readable side-view, facing right by default. Renderer mirrors for the enemy team.
- Color palette: content/units.js `colorBody` / `colorTrim`
- Notes:
  - Side-view (no isometric). Anchor: foot-center on bottom of each cell.
  - Walk cycle: 4 frames at 8 fps target.
  - Attack cycle: windup is the longest — match `attackWindupMs` shape (frame 1 = windup hold).
  - Death: 4 frames including final ragdoll lying. Renderer crossfades.
- Priority: critical

---

## 7. Projectile sprites

### bone-shard / crossbow-bolt / steam-bolt / arc-bolt / mortar-shell / void-orb
- File name: `era-siege/projectile/<id>.png` per id in `content/projectiles.js`
- Type: PNG sprite-sheet (1×4 — trail frames for orb / void; single-frame for bolts)
- Transparent: yes
- Recommended dimensions: 24×8 (bolts) / 32×32 per frame (orb sheet)
- Purpose: replaces the procedural line/orb in `renderer.js#drawProjectile`
- Visual style: glowing edge, era-tinted core
- Color palette: from `content/projectiles.js` (`colorPrimary`, `colorTrail`)
- Animation frames: 1 / 4
- Notes: bolt orientation = horizontal, point right; renderer rotates to velocity direction
- Priority: important

---

## 8. Hit / spark / explosion / dust VFX sheets

### hit-spark
- File name: `era-siege/vfx/hit-spark.png`
- Type: PNG sprite-sheet (1×6)
- Transparent: yes
- Recommended dimensions: 64×64 per frame
- Purpose: replaces the procedural particle puff on melee hits
- Visual style: white-hot core, dust ring, fades to embers
- Color palette: white core, era-flexible outer (renderer tints)
- Animation frames: 6
- Priority: important

### explosion-small
- File name: `era-siege/vfx/explosion-small.png`
- Type: PNG sprite-sheet (1×8)
- Transparent: yes
- Recommended dimensions: 96×96 per frame
- Purpose: heavy unit death + special impact (point mode)
- Visual style: orange-amber bloom, smoke fade
- Animation frames: 8
- Priority: important

### explosion-large
- File name: `era-siege/vfx/explosion-large.png`
- Type: PNG sprite-sheet (1×10)
- Transparent: yes
- Recommended dimensions: 192×192 per frame
- Purpose: era-up flash centerpiece, late-era specials
- Animation frames: 10
- Priority: optional

### muzzle-flash
- File name: `era-siege/vfx/muzzle-flash.png`
- Type: PNG sprite-sheet (1×4)
- Transparent: yes
- Recommended dimensions: 48×48 per frame
- Purpose: ranged unit fire — replaces the inline flash circle
- Animation frames: 4
- Priority: important

### dust-puff
- File name: `era-siege/vfx/dust-puff.png`
- Type: PNG sprite-sheet (1×6)
- Transparent: yes
- Recommended dimensions: 64×64 per frame
- Purpose: heavy unit footstep + foreground ambient drift
- Animation frames: 6
- Priority: optional

---

## 9. Evolution / age-up effects

### era-up-burst
- File name: `era-siege/vfx/era-up-burst.png`
- Type: PNG sprite-sheet (1×12)
- Transparent: yes
- Recommended dimensions: 256×256 per frame
- Purpose: full-screen-ish flash centered on player base when evolving
- Visual style: white-hot core → era-tinted ring → fade
- Animation frames: 12
- Priority: important

### era-up-ribbon
- File name: `era-siege/ui/era-up-ribbon.png`
- Type: PNG (single frame)
- Transparent: yes
- Recommended dimensions: 720×80
- Purpose: banner background for the era-name overlay (text drawn on top)
- Visual style: era-tinted bar with chevron edges; left-right gradient
- Color palette: era-tinted; can ship per-era variants if rich enough
- Animation frames: 1
- Priority: important

---

## 10. UI frame elements

### top-bar-frame (optional)
- File name: `era-siege/ui/top-bar-frame.png`
- Type: PNG, 9-slice
- Transparent: yes
- Recommended dimensions: 1920×64 (3 9-slice slices: 32px corners, stretchable middle)
- Purpose: background for the top HUD if a painted feel is desired
- Visual style: dark slate with thin accent edge
- Animation frames: 1
- Priority: optional

### bottom-bar-frame (optional)
- File name: `era-siege/ui/bottom-bar-frame.png`
- Type: PNG, 9-slice
- Recommended dimensions: 1920×120
- Priority: optional

### card-bg
- File name: `era-siege/ui/card-bg.png`
- Type: PNG, 9-slice
- Transparent: yes
- Recommended dimensions: 256×128 (4-corner 9-slice)
- Purpose: unit-card background; replaces the flat panel
- Visual style: dark slate gradient with subtle inner stroke
- Priority: optional

---

## 11. Buttons and button states

### button-primary / button-ghost
- File name: `era-siege/ui/button-primary.png` / `…/button-ghost.png`
- Type: PNG, 9-slice
- Transparent: yes
- Recommended dimensions: 320×72 (corners: 16px)
- Purpose: HUD action buttons (Evolve, Build, etc.)
- States: idle / hover / active / disabled (1×4 sheet)
- Animation frames: 4 in a sprite sheet
- Priority: optional

---

## 12. Resource icons (16×16 / 24×24)

### gold-icon
- File name: `era-siege/ui/icon-gold.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 48×48 (master, downscaled at use)
- Visual style: stylised coin
- Priority: important

### xp-icon
- File name: `era-siege/ui/icon-xp.png`
- Recommended dimensions: 48×48
- Visual style: laurel / crystal — small, neutral
- Priority: important

### hp-heart-icon
- File name: `era-siege/ui/icon-hp.png`
- Recommended dimensions: 48×48
- Priority: optional

### time-icon
- File name: `era-siege/ui/icon-time.png`
- Recommended dimensions: 48×48
- Visual style: clock
- Priority: optional

---

## 13. Special ability icons

### special-icon-era<N> for N=1..5
- File name: `era-siege/ui/special-era<N>.png`
- Type: PNG
- Transparent: yes
- Recommended dimensions: 96×96
- Purpose: lobby / HUD icon for the era's special
- Visual style: silhouette-on-dark-disc, single-color era accent
- Priority: important

| N | Subject | Notes |
|---|---|---|
| 1 | Ember Volley   | falling shafts |
| 2 | Iron Rain      | rain of bolts |
| 3 | Sun Forge      | radiant disc |
| 4 | Storm Fork     | forked lightning |
| 5 | Void Collapse  | concentric singularity |

---

## 14. Upgrade icons (power-up tree)

### power-up-economy
- File name: `era-siege/ui/upgrade-economy.png`
- Type: PNG, 64×64
- Transparent: yes
- Visual style: stack of coins / scales
- Priority: important

### power-up-base
- File name: `era-siege/ui/upgrade-base.png`
- Visual style: castle wall section
- Priority: important

### power-up-special
- File name: `era-siege/ui/upgrade-special.png`
- Visual style: spark / sigil
- Priority: important

### power-up-turret
- File name: `era-siege/ui/upgrade-turret.png`
- Visual style: turret silhouette
- Priority: important

---

## 15. Unit role icons

### role-frontline / role-ranged / role-heavy
- File name: `era-siege/ui/role-<role>.png`
- Type: PNG, 32×32
- Transparent: yes
- Visual style: 1-color glyph: sword (frontline), bow (ranged), hammer (heavy)
- Priority: critical (placeholders for these are inline SVG; PNG version is optional but improves authenticity)

---

## 16. Notification / badge / toast assets

### badge-pb
- File name: `era-siege/ui/badge-pb.png`
- Type: PNG, 64×24
- Visual style: wax seal / stamp shape with "PB" text masked
- Priority: optional (current inline span works)

### toast-frame
- File name: `era-siege/ui/toast-frame.png`
- Type: PNG, 9-slice
- Recommended dimensions: 360×64
- Purpose: achievement toast background
- Priority: optional (current uses platform AchievementToast)

---

## 17. Menu background panels

### menu-panel
- File name: `era-siege/ui/menu-panel.png`
- Type: PNG, 9-slice
- Recommended dimensions: 480×320
- Purpose: pause / settings / power-up drawer backdrop
- Visual style: dark slate gradient + thin accent inner border
- Priority: optional

---

## 18. Tooltip backgrounds

### tooltip-bg
- File name: `era-siege/ui/tooltip-bg.png`
- Type: PNG, 9-slice
- Recommended dimensions: 240×120
- Visual style: matte dark, soft drop-shadow built into PNG
- Priority: optional

---

## 19. Cover (already shipped, regenerate optional)

### lobby-cover
- File name: `era-siege/ui/cover.png`
- Type: PNG
- Transparent: no
- Recommended dimensions: 1024×1280 (vertical cover)
- Purpose: replaces the SVG cover in `src/covers.jsx#Cover_AoW`
- Priority: optional — current SVG cover is acceptable

---

## 20. Audio appendix → see `docs/audio.md`

All audio asset specs live in their own document so the image and audio
asset boards stay independent.

---

## Generation notes for whoever produces these

- Hand-paint or render with a 2D paint pipeline; avoid over-baked gradients.
- Test sprites on the actual canvas at the target dpr first; some look great in isolation but read mushy at game scale.
- Keep silhouettes legible at 40 px tall for units, 80 px tall for turrets.
- Crisp 1-px outlines preferred over feathered edges for game-critical art.
- For per-era sets, sketch the silhouette first across all 5 eras before committing to color — silhouette differentiation matters more than palette.
- Save every layered file alongside the PNG (PSD / Procreate / Krita), even if only the PNG is committed.
- Run a ~25% blur sanity check: if the silhouette is unreadable at 25% blur, redesign it.

## Bucket priorities for shipping

**Batch 1 (critical, ship together)**: bases (5 player + 5 enemy), unit sprite sheets (15), turret sheets (5), midground silhouettes (10 = 2 layers × 5 eras). 35 files.

**Batch 2 (important)**: foreground overlays (5), sky bands (5), cloud strips (5), VFX sheets (5: hit-spark, muzzle-flash, explosion-small, dust-puff, era-up-burst), special icons (5), role icons (3), upgrade icons (4), gold + xp icons (2). 34 files.

**Batch 3 (optional polish)**: 9-slice frames, tooltip bg, menu panels, lobby cover, large explosion, era-up ribbon. ~10 files.

Total request: ~80 files. Each batch can ship independently; placeholders fill the gap until each lands.
