# Era Siege — design briefs for the last 6 missing sheets

Everything else is shipped (units × 5 eras × 4 roles, turrets × 5 eras × 3 tiers,
bases, projectiles, VFX). What's left is **just background parallax layers**
for eras 3, 4, and 5. The renderer will fall back to procedural until each
one ships, but hand-painted ones look much better.

Drop new files into `assets/era-siege/advanced/try4/` with the next
sequential number, then run `npm run import:era-siege`.

---

## Universal cropping rules (apply to all 6)

- **Aspect**: roughly 16:6 (e.g. **1024 × 384** or **2048 × 768**) — wide
  panorama. The renderer scales to lane width, so exact px doesn't matter,
  but keep aspect consistent with the era 1/2 sheets you already shipped.
- **No grid / no checker / no panel borders.** Just one full-bleed image.
  Transparent areas (sky cutouts, etc.) should be true alpha — but the
  pipeline auto-keys checker patterns if your generator bakes them in.
- **No watermark in the bottom-right** is preferred, but the pipeline
  erases the bottom-right 13% as a safety net.
- **Seamless horizontal tiling is a plus** — match the left and right edges
  in color/silhouette so the parallax loop doesn't show a seam. Not strictly
  required (the renderer can mirror), but cleaner.
- **Flat lighting** on backgrounds. Save the dramatic light for unit cells.

---

## Era 3 — Sun Foundry (steampunk gold/brass)

### 1. era3-bg-mountains-mid

**Purpose:** middle parallax layer between the distant mesas (already shipped
as `try4/36`) and the industrial dirt road foreground (`try4/37`).

**Theme prompt:** *"Industrial steampunk hills at dusk. A row of brass-piped
factory chimneys, water towers, and rusted gantries silhouetted against a
deep amber sky. Mid-distance — visible structural detail but no fine
machinery. Warm orange ambient light, hint of haze."*

**Color palette:** burnt sienna, brass, deep amber, soot grey.

**Cropping:** 1024 × 384, full-bleed, transparent above the silhouette so
the sky layer behind shows through.

---

## Era 4 — Storm Republic (cyber-blue military)

### 2. era4-bg-mountains-mid

**Theme prompt:** *"Mid-distance war-torn city under stormy night sky.
Concrete bunkers, satellite-dish towers with red beacon lights, severed
power lines, a few crashed dropships in the rubble. Deep navy + cyan
neon edge-light, fog rolling between buildings."*

**Color palette:** navy, gunmetal, electric cyan accents, fog grey.

**Cropping:** 1024 × 384, transparent above silhouette.

### 3. era4-bg-foreground

**Theme prompt:** *"Cracked concrete tarmac with embedded power conduits
glowing cyan. Sandbag walls, scattered ammo crates, a half-buried tank
treads emerging from rubble. Wet reflective patches. Two-thirds of the
image is solid foreground; top third blends into atmospheric fog."*

**Color palette:** wet asphalt black, gunmetal, cyan glow, mud brown.

**Cropping:** 1024 × 256 (shorter — this is the closest layer where troops
walk). Solid bottom, fading top.

---

## Era 5 — Void Ascendancy (cosmic purple void)

### 4. era5-bg-sky

**Theme prompt:** *"Deep cosmic void sky. Swirling purple-magenta nebulae,
distant stars, a fractured planet or shattered moon hanging on the right
horizon. Lightning arcs of void energy crackling between cloud layers.
Star density medium-high. Black at zenith, deep magenta near horizon."*

**Color palette:** void black, deep purple, magenta swirls, white stars,
hot pink lightning highlights.

**Cropping:** 1024 × 384, full-bleed (this is the BACKMOST layer, no
transparency needed).

### 5. era5-bg-mountains-mid

**Theme prompt:** *"Crystalline alien spires and broken void temples at
mid-distance. Floating chunks of stone hover above the ground, tethered
by purple energy strands. Tall cathedral-like crystal pillars catching
magenta backlight. Some spires are corrupted/cracked, leaking purple
energy mist. Silhouette-heavy with bright magenta rim-light."*

**Color palette:** purple, magenta, deep violet, black silhouette,
hot-pink rim glow.

**Cropping:** 1024 × 384, transparent above silhouette.

### 6. era5-bg-foreground

**Theme prompt:** *"Shattered void-stone ground with glowing magenta cracks
running through it. Floating shards of crystal hovering low, anchored by
purple light strands. Pools of liquid void energy reflecting violet from
above. Some bone or ruin debris half-submerged. Two-thirds solid foreground;
top third blurs into purple haze."*

**Color palette:** void-stone charcoal, magenta crack glow, purple liquid,
violet ambient.

**Cropping:** 1024 × 256.

---

## When you ship them

Put each file into `assets/era-siege/advanced/try4/` (next number, e.g. 72-77),
then in `assets/era-siege/advanced/manifest.json` add:

```json
{ "src": "try4/72.png", "kind": "bg", "era": 3, "id": "mountains-mid", "bg": "transparent" },
{ "src": "try4/73.png", "kind": "bg", "era": 4, "id": "mountains-mid", "bg": "transparent" },
{ "src": "try4/74.png", "kind": "bg", "era": 4, "id": "foreground",    "bg": "transparent" },
{ "src": "try4/75.png", "kind": "bg", "era": 5, "id": "sky",           "bg": "transparent" },
{ "src": "try4/76.png", "kind": "bg", "era": 5, "id": "mountains-mid", "bg": "transparent" },
{ "src": "try4/77.png", "kind": "bg", "era": 5, "id": "foreground",    "bg": "transparent" }
```

Then run:

```sh
npm run import:era-siege
npm run verify:era-siege
npm run library:era-siege
```

That's it. After this, the asset pipeline is 100% complete and integration
into the renderer's parallax stack can ship.
