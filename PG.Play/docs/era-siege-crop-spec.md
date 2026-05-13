# Era Siege — Crop Spec (every PNG the manifest is waiting for)

Drop crops into `assets/era-seige-2/...` at the names below; the build
scripts pick them up and route to `public/games/era-siege/v2/...`.
After dropping, run **`npm run process:era-siege-v2`** (unit + turret
sheets) and **`npm run import:era-siege-biome`** (biome props).

Every PNG must have:
- **Transparent background.** No magenta backdrop, no white matte. If
  the source has a magenta cell-backdrop the unit-processor strips it,
  but biome crops you make manually need to be exported with proper
  alpha already.
- **No baked drop-shadow / foot ellipse.** The renderer paints those.
- **No "edge fringe" of dark RGB.** If exported correctly with alpha,
  semi-transparent edge pixels will carry the silhouette's own colour,
  not the bake background's. Quick test in § 9 below.

---

## 1. Unit sheets (sprite grid)

Source: full master sheet exported from Gemini at 2400×1300+ px with
the 4-row × 7-col magenta-cell layout.

Drop into `assets/era-seige-2/<N>.png` where `<N>` is the slot number
below. The slot-to-(era, role) mapping lives in
`scripts/era-siege-v2-mapping.json`.

| Slot | Era · Role | Cell size hint | Status |
|---|---|---|---|
| 12 | era 4 heavy (Storm Heavy cyan chaingun) | 200×240 | ✓ shipped |
| 13 | era 5 heavy (Void Heavy purple plasma) | 200×240 | ✓ shipped |
| 14 | era 1 ranged (Kindle-Shot / Modern Ranged) | 160×200 | ✓ shipped |
| 15 | era 1 heavy (Magma-Breaker / Bully) | 200×240 | ✓ shipped |
| 16 | era 1 general | 240×300 | ✓ shipped |
| 17 | era 3 frontline (Brass-Guard) | 160×200 | ✓ shipped |
| 18 | era 3 ranged (Gear-Lock Marksman) | 160×200 | ✓ shipped |
| 19 | era 5 general (Void Ascendancy) | 240×300 | ✓ shipped |
| 20 | era 5 general-alt (orange) | 240×300 | ✓ shipped |
| **21** | era 2 frontline | 160×200 | **MISSING** |
| **22** | era 2 ranged | 160×200 | **MISSING** |
| **23** | era 2 heavy | 200×240 | **MISSING** |
| **24** | era 2 general | 240×300 | **MISSING** |
| **25** | era 3 heavy | 200×240 | **MISSING** |
| **26** | era 3 general | 240×300 | **MISSING** |
| **27** | era 5 frontline | 160×200 | **MISSING** |
| **28** | era 5 ranged | 160×200 | **MISSING** |

Master sheet layout (rendered automatically by Gemini per your prompt):

```
Row 0:   [static] (one cell, top-left — the idle pose)
Row 1:   [walk 1][walk 2][walk 3][walk 3'][walk 4][walk 5][walk 6]   (7 cells; processor drops the duplicate at index 3)
Row 2:   [atk 1][atk 2][atk 3][atk 3'][atk 4][atk 5][atk 6][atk 6']  (7-8 cells; processor drops dupes)
Row 3:   [idle 1][idle 2][idle 3][idle 4][idle 5][idle 6][idle 6']   (6-7 cells; processor takes first 6)
```

Output paths (auto-written by `process:era-siege-v2`):
- `public/games/era-siege/v2/unit/era<N>/<role>.png` ← static
- `public/games/era-siege/v2/sprites/unit/era<N>/<role>/walk.png` ← 6-frame strip
- `public/games/era-siege/v2/sprites/unit/era<N>/<role>/attack.png` ← 6-frame strip
- `public/games/era-siege/v2/sprites/unit/era<N>/<role>/idle.png` ← 6-frame strip

---

## 2. Turret strips (3-frame horizontal)

Source: a single horizontal strip with three magenta cells labeled
**Idle / Fire / Recoil** (cells appear top-right of each biome sheet
for the relevant era). Cell size hint: 96×64 px each at 1× (so 384×192
at 2×).

Drop the **whole strip** as `assets/era-seige-2/turret/raw-<N>.png`.
Map `raw-<N>` → game era via `scripts/era-siege-v2-turret-mapping.json`
(currently `{1: 1, 2: 2}`).

| File | Maps to game era | Status | Source |
|---|---|---|---|
| `turret/raw-1.png` | era 1 | ✓ shipped | era 1 biome sheet — top right |
| `turret/raw-2.png` | era 2 | ✓ shipped | era 2 biome sheet — top right |
| **`turret/raw-3.png`** | era 3 | **MISSING** | era 3 biome sheet — top right (brass cannon) |
| **`turret/raw-4.png`** | era 4 | **MISSING** | era 4 biome sheet — top right (sleek silver/teal cannon) |
| **`turret/raw-5.png`** | era 5 | **MISSING** | era 5 biome sheet — top right (void crystal cannon) |

Output paths (auto-written):
- `public/games/era-siege/v2/turret/era<N>.png` ← idle
- `public/games/era-siege/v2/turret/era<N>-fire.png` ← fire
- `public/games/era-siege/v2/turret/era<N>-recoil.png` ← recoil

If your strip has the three frames in any other order, edit
`scripts/era-siege-v2-turret-mapping.json` to add `{ "<N>": { eraN: N, order: ['fire', 'idle', 'recoil'] } }` — but the script default
assumes left-to-right idle/fire/recoil.

---

## 3. Biome props (per-era, hand-cropped)

Source: each era's BIOME ENVIRDATID sheet (already on disk as
`assets/era-seige-2/spec-era<N>-biome.png`). For each era, crop the
five assets below from that sheet **with transparent background** and
drop into `assets/era-seige-2/biome/era<N>/`.

| File name | Source on biome sheet | Output | Sim wired? |
|---|---|---|---|
| `base-player.png` | Major hub Gate (largest central building) | `v2/base/era<N>/player.png` | ✓ — replaces procedural base |
| `base-enemy.png` (optional) | flipped Major hub Gate, OR auto-flips from `base-player.png` if missing | `v2/base/era<N>/enemy.png` | ✓ |
| `special-primary.png` | Primary special coin (Solar Barrage / Magma Strike / Biolume Surge / Arc Blast / Void Bolt) | `v2/special-era<N>.png` | ✓ — replaces SpecialButton icon |
| `special-secondary.png` (optional) | If a secondary special icon exists | `v2/special-era<N>-2.png` | ✓ |
| `floor.png` | The "<name> Floor" tile (Bronze Clockwork / Charcoal Stone / Bio-Lume Sea / Composite Decking / Obsidian) | `v2/bg/era<N>/foreground.png` | ⏳ slot exists; renderer still uses procedural ground for now |
| `sky.png` (optional) | If you want a hand-painted sky backdrop | `v2/bg/era<N>/sky.png` | ⏳ slot exists; needs explicit v2-pack rendering pass |
| `mountains-far.png` (optional) | Distant ridge silhouette | `v2/bg/era<N>/mountains-far.png` | ⏳ same |
| `mountains-mid.png` (optional) | Middle ridge with motifs (towers, smokestacks, etc.) | `v2/bg/era<N>/mountains-mid.png` | ⏳ same |
| `hp-bar.png` (optional) | The bronze/teal/void HP bar strip | `v2/ui/hp-bar-era<N>.png` | ⏳ slot reserved; UI swap not wired yet |
| `hazard.png` (optional) | 5-frame Plasma Conduit / Void Rift / Molten Pool / Electrical Field / Bio-acidic Pool strip | `v2/vfx/hazard-era<N>.png` | ⏳ slot reserved; no in-game hazard mechanic |

### Per-asset dimension guidance

These are TARGET sizes (the renderer downscales bigger inputs cleanly,
but smaller inputs upscale fuzzy — go large):

- **Base art** (`base-player.png`): foot-anchored bottom-centre. The
  renderer composites at `targetH = 220 px` and matches source aspect
  ratio. So author at 440×580 px (2× HiDPI) with the foot of the
  building at the bottom edge of the canvas. Keep ~6-8 px of margin on
  each side.
- **Special coin** (`special-primary.png`): renderer draws at 36×36 in
  the action bar. Author at 72×72 (2×) or 96×96 — perfect square,
  centred subject.
- **Floor tile** (`floor.png`): renderer composites at 1920×200 max
  (foreground band below the lane). Author at 1920×400 (2×) if you want
  it dense, or 1920×200 if a thin strip. Tileable horizontally is a
  plus.
- **HP-bar strip** (`hp-bar.png`): the bar fills `~360×24 px` in the
  TopBar. Author at 720×48 px (2×). It will sit as a backdrop; the
  cyan-glass segment overlay paints on top so the bar art mostly
  contributes a frame + endcap detail.
- **Hazard strip** (`hazard.png`): 5 frames horizontally, each cell
  64×64 px → strip 320×64 (1×) or 640×128 (2×). Anchored at centre.

### Per-era crop checklist (printable)

For each era, click through this 5-item list:

- [ ] Era 1 (`spec-era1-biome.png`) — drop into `biome/era1/`
  - [ ] base-player.png (Major hub Gate — black/orange obsidian)
  - [ ] special-primary.png (Magma Strike coin)
  - [ ] floor.png (Charcoal Stone Floor)
  - [ ] hp-bar.png (top strip — bronze with red gem)
  - [ ] hazard.png (Plasma Conduit Interactive 5-frame strip)
- [ ] Era 2 (`spec-era2-biome.png`) — drop into `biome/era2/`
  - [ ] base-player.png (Major hub Gate — teal Bio-Lume)
  - [ ] special-primary.png (Biolume Surge coin)
  - [ ] floor.png (Bio-Lume Sea Floor)
  - [ ] hp-bar.png (teal bar)
  - [ ] hazard.png (Bio-acidic pool 4-stage strip)
- [ ] Era 3 (`spec-era3-biome.png`) — drop into `biome/era3/`
  - [ ] base-player.png (Major hub Gate — bronze Sun Foundry)
  - [ ] special-primary.png (Solar Barrage coin)
  - [ ] floor.png (Bronze Clockwork Floor)
  - [ ] hp-bar.png (bronze bar)
  - [ ] hazard.png (Plasma Conduit / Molten Bronze Pool)
- [ ] Era 4 (`spec-era4-biome.png`) — drop into `biome/era4/`
  - [ ] base-player.png (Hub Gate — sleek silver/teal Storm Republic)
  - [ ] special-primary.png (Arc Blast coin)
  - [ ] floor.png (Composite Decking or Conduit Accent)
  - [ ] hp-bar.png (silver/teal bar)
  - [ ] hazard.png (Electrical Field / Coolant Leak Pool)
  - [ ] Also: turret 3-frame strip → save as `turret/raw-4.png` (NOT in biome/)
- [ ] Era 5 (`spec-era5-biome.png`) — drop into `biome/era5/`
  - [ ] base-player.png (Major hub Gate — black Void crystal)
  - [ ] special-primary.png (Void Bolt coin)
  - [ ] floor.png (Obsidian Floor)
  - [ ] hp-bar.png (purple/black bar)
  - [ ] hazard.png (Void Rift Interactive)

**Total crops if you ship every slot: 25 biome + up to 8 unit sheets + 3 turret strips = 36 PNGs.**

---

## 4. Authoring rules (read once, save yourself rework)

### Alpha + colour

- Export **straight alpha** PNG. If your tool offers "premultiplied" vs
  "straight", pick **straight** — that's what `<canvas>` expects.
- Edge pixels (1-2 px around the silhouette) should carry the
  silhouette's own colour, not the bake background. Most tools have a
  "matte" or "defringe" option — pick the silhouette's edge colour.
- No drop shadow under the foot. No glow halo baked in (those are
  shipped via the renderer).

### Sizing

- Author at **2× target** for HiDPI. The renderer downscales for
  non-retina displays.
- Keep **6-8 px of breathing room** on every side of the silhouette —
  the walk/attack animations move the sprite around and we don't want
  to clip arms or weapons at the edge.

### Facing direction

- Units face **right**. Renderer mirrors via `ctx.scale(-1, 1)` for the
  enemy side.
- Bases face the lane (player base on the left faces right; enemy base
  on the right faces left — but you only author the right-facing one,
  the renderer flips).

### File names

Names listed in the tables above are EXACT. The build scripts match by
filename. Any other name is skipped (with a console warning).

---

## 5. Quick-test snippet (paste in dev tools)

Open `http://localhost:5180/#/game/aow` in your browser, switch
Settings → Art pack → Premium, then paste this in the dev-tools
console to overlay your PNG on a magenta backdrop — any dark fringe
around the silhouette tells you the export still has the halo:

```js
(async () => {
  const url = 'games/era-siege/v2/base/era1/player.png';   // tweak path
  const img = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = url; });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth + 32; c.height = img.naturalHeight + 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff00ff';   // bright magenta — dark fringe shows as a ring
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 16, 16);
  Object.assign(c.style, { position: 'fixed', top: '20px', left: '20px', zIndex: 9999, border: '4px solid #fff' });
  document.body.appendChild(c);
})();
```

---

## 6. Run order after dropping files

```sh
# 1. Unit sheets (numbered + turret strips)
npm run process:era-siege-v2

# 2. Biome props (per-era cropped)
npm run import:era-siege-biome

# 3. Rebuild for production / preview
npm run build
```

Both scripts are idempotent — running them on partial drops always
writes the assets that ARE present and silently skips missing ones.
The Premium art pack toggle falls back to the procedural draw or
the classic pack PNG for any slot that doesn't have v2 art yet.

---

## 7. What's wired to render new art today

| Asset type | Renderer reads it? |
|---|---|
| Unit static + walk/attack/idle strips | ✓ yes, `drawStripFrame` blits |
| Turret idle/fire/recoil | ✓ yes, swap based on cooldown phase |
| Base art (`base/era<N>/player.png`) | ✓ when art pack = v2 (otherwise procedural) |
| Special icon (`special-era<N>.png`) | ✓ `SpecialButton.jsx` already loads it |
| Foreground floor (`bg/era<N>/foreground.png`) | ⏳ slot loads, but the renderer still composites the procedural ground band on top. To make the painted floor primary, I'll need to invert that — small change once you ship the art |
| Sky / mountains | ⏳ same as floor |
| HP bar art (`ui/hp-bar-era<N>.png`) | ⏳ slot reserved, HUD still uses CSS bar; needs a new HP-bar component when art arrives |
| Hazard strip (`vfx/hazard-era<N>.png`) | ⏳ slot reserved, no in-game hazard mechanic |

I'll wire the ⏳ slots into the renderer when the first crop of each
type lands — easier to size the integration to the actual art than
build it speculatively.

---

## 8. Files NOT to bother shipping

These are procedural-only forever (already look good):

- Clouds (drift over time — can't be a static PNG)
- Projectile trails (per-frame motion)
- Particle effects (additive blending varies per particle)
- Damage numbers
- Era banner / kill feed / achievement toast (CSS / DOM, no art)

---

## 9. Last thing — naming gotchas

- Numbered unit sheets: `12.png`, `13.png`, …. Not `12-storm-heavy.png`
  unless you also add a matching entry to `era-siege-v2-mapping.json`.
- Biome files: EXACT filenames in the tables above. Typos = silently
  skipped.
- Era folders: `era1` through `era5` only. `era01` or `Era 1` won't
  match.
