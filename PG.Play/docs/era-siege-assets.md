# Era Siege — Animation Sheet Spec

**Read this first.** The cropping pipeline can only be deterministic
if the sheets follow a strict pixel grid. Past sheets had inconsistent
cell sizes / offsets which is why my crop scripts kept guessing. This
spec eliminates the guesswork.

---

## The grid

Every animation is delivered as a **horizontal strip of 6 frames**.
Per-unit, multiple strips are stacked **vertically** in one sheet.
A sheet's filename tells the script how many strips it contains.

```
┌──────┬──────┬──────┬──────┬──────┬──────┐
│  0   │  1   │  2   │  3   │  4   │  5   │   ← walk row
├──────┼──────┼──────┼──────┼──────┼──────┤
│  0   │  1   │  2   │  3   │  4   │  5   │   ← attack row
├──────┼──────┼──────┼──────┼──────┼──────┤
│  0   │  1   │  2   │  3   │  4   │  5   │   ← idle row
└──────┴──────┴──────┴──────┴──────┴──────┘
```

**Hard rules — do not break these:**

1. Every cell in a sheet is **EXACTLY the same width and height**.
   No exceptions. If walk frame 3 is wider than walk frame 0, the
   sheet is broken — re-render with consistent cell size.
2. Cells are **edge-to-edge** with **no gutters**, **no padding** between
   frames, and **no border around the sheet**. The sheet's pixel
   width = `cell_width * 6`. The sheet's pixel height = `cell_height * row_count`.
3. The figure inside each cell is **pose-different but anchor-identical**.
   I.e. across all 6 frames in a row the figure's **foot pixel is at the
   same Y inside the cell**, the figure's **horizontal centre is at the
   same X inside the cell**. Camera doesn't move; only the figure animates.
4. **Transparent background** outside the figure (alpha = 0). No
   checkerboard. No white frame. No drop shadow that bleeds across cells.
5. Figure faces **right** in every frame. The renderer mirror-flips for
   the enemy side automatically.

If you give me a sheet that follows these 5 rules, the crop script is
just `for (i=0; i<6; i++) crop(i*W, row*H, W, H)` — no heuristics, no
saturation analysis, no manual tuning. Past sheets failed rule #2
(uneven gutters) which is why my crops kept slicing wrong.

---

## Standard cell sizes (use these)

| Asset class | Cell W × H |
|---|---|
| Frontline / ranged unit | **256 × 256** |
| Heavy unit              | **320 × 320** |
| General (boss-tier)     | **384 × 384** |
| Turret                  | **256 × 256** |
| Projectile              | **64 × 32** (long axis horizontal) |
| Special-effect VFX      | **128 × 128** |

Match these exact dimensions. The crop script keys off them.

---

## Anchor convention — burn this into your generator

Inside a cell, the figure's anchor is at:

| Asset class | Anchor X (px from cell left) | Anchor Y (px from cell top) |
|---|---|---|
| Unit (frontline/ranged) | 128 (centre of 256) | 240 (16 px from bottom) |
| Heavy unit              | 160 (centre of 320) | 304 (16 px from bottom) |
| General                 | 192 (centre of 384) | 360 (24 px from bottom) |
| Turret                  | 128 (centre of 256) | 248 (8  px from bottom) |
| Projectile              | 32  (centre)        | 16  (centre)            |

**What this means:** for a 256×256 unit cell the figure's foot must be
at pixel y=240 in every single frame, and the figure's centre column
at pixel x=128. The walk-bob in the renderer is added on top — don't
bake walk-bob movement into the sheet.

---

## Required animations per unit

Each unit has **3 strips** stacked vertically in one sheet:

| Row | Animation | What it shows |
|---|---|---|
| 0 | walk   | 6 frames of a forward-walking cycle. Frame 0 = both feet planted, frame 3 = mid-stride opposite leg forward, frame 5 = back to neutral. Smooth loop. |
| 1 | attack | 6 frames of one attack swing/shot. Frame 0 = neutral, frame 1-2 = wind-up (weapon raises), frame 3 = strike / fire, frame 4-5 = follow-through and return. Frame 3 is when the projectile/blow lands. |
| 2 | idle   | 6 frames of subtle breathing / weapon-rest. Loops. Use this when the unit is in lane but not yet in attack range. |

**Filename:** `unit-era<N>-<role>.png` — one sheet per unit.

| File | Cell | Sheet size |
|---|---|---|
| `unit-era1-frontline.png` | 256×256 | **1536 × 768** |
| `unit-era1-ranged.png`    | 256×256 | **1536 × 768** |
| `unit-era1-heavy.png`     | 320×320 | **1920 × 960** |
| `unit-era1-general.png`   | 384×384 | **2304 × 1152** |

(Same shape for era 2 / 3 / 4 / 5 — 20 sheets total.)

---

## Required animations per turret

| Row | Animation | What it shows |
|---|---|---|
| 0 | idle    | 6 frames — turret at rest. Subtle barrel sway only. Loops. |
| 1 | fire    | 6 frames — windup → muzzle flash → barrel kick. Frame 3 = peak flash. |
| 2 | recoil  | 6 frames — barrel returns, smoke clears. After frame 5 → idle. |

**Filename:** `turret-era<N>.png` — one sheet per era.

| File | Cell | Sheet size |
|---|---|---|
| `turret-era1.png` | 256×256 | **1536 × 768** |
| `turret-era2.png` | 256×256 | **1536 × 768** |
| ...               |         |             |

5 sheets total.

---

## Required animations for projectiles

A projectile is **one row of 6 frames** showing the missile in flight,
with subtle in-flight detail (rotating, trailing sparks). Sheet height = 32 px.

**Filename:** `projectile-<id>.png`

| File | Cell | Sheet size |
|---|---|---|
| `projectile-bone-shard.png` | 64×32 | **384 × 32** |
| `projectile-iron-bolt.png`  | 64×32 | **384 × 32** |
| `projectile-brass-shell.png`| 64×32 | **384 × 32** |
| `projectile-volt-bolt.png`  | 64×32 | **384 × 32** |
| `projectile-void-rune.png`  | 64×32 | **384 × 32** |

**Anchor:** centre of each cell (x=32, y=16). The projectile's pointed
tip should be at the right edge of the cell. The renderer rotates the
sprite to match velocity.

---

## Required animations for VFX

| File | Cell | Sheet size | Description |
|---|---|---|---|
| `vfx-explosion-small.png` | 128×128 | **768 × 128** | 6-frame impact flash → smoke. Frame 0 = bright white core, frame 5 = nearly transparent grey. |
| `vfx-explosion-large.png` | 128×128 | **768 × 128** | Same as above but with bigger flame body and longer-lasting smoke. |
| `vfx-muzzle-flash.png`    | 64×64   | **384 × 64**  | Tight flash for ranged-unit fire. White core, era-tinted edge. |
| `vfx-hit-spark.png`       | 64×64   | **384 × 64**  | Generic projectile-impact burst. White star → orange spread → fade. |

All VFX cells anchored at centre.

---

## Required art for bases

Bases are **STATIC** — no animation. One PNG per base.

**Filename:** `base-era<N>-<side>.png` where `<side>` is `player` or `enemy`.

| File | Pixel size |
|---|---|
| `base-era<N>-player.png` | **640 × 768** |
| `base-era<N>-enemy.png`  | **640 × 768** |

10 PNGs total (5 eras × 2 sides). Anchor: bottom-centre = ground line.
The HP bar is drawn by the renderer above the structure.

---

## Required art for backgrounds

Backgrounds are **STATIC** parallax layers. One PNG per layer per era.

**Filename:** `bg-era<N>-<layer>.png` where `<layer>` is `sky`, `clouds`, `mountains-far`, `mountains-mid`, `foreground`.

| File | Pixel size |
|---|---|
| `bg-era<N>-sky.png` | **1920 × 720** |
| `bg-era<N>-clouds.png` | **1920 × 663** |
| `bg-era<N>-mountains-far.png` | **1920 × 360** |
| `bg-era<N>-mountains-mid.png` | **1920 × 358** |
| `bg-era<N>-foreground.png` | **1920 × 358** |

25 PNGs total. **Tile-friendly:** the leftmost column of pixels must
match the rightmost column of pixels so the seam is invisible when
the renderer wraps.

---

## Drop-zone & filename map

Place every sheet here:

```
assets/era-siege/sheets/
   ├─ unit-era1-frontline.png
   ├─ unit-era1-ranged.png
   ├─ unit-era1-heavy.png
   ├─ unit-era1-general.png
   ├─ unit-era2-frontline.png
   ├─ ...
   ├─ turret-era1.png
   ├─ turret-era2.png
   ├─ ...
   ├─ projectile-bone-shard.png
   ├─ projectile-iron-bolt.png
   ├─ ...
   ├─ vfx-explosion-small.png
   ├─ vfx-muzzle-flash.png
   ├─ ...
   ├─ base-era1-player.png
   ├─ base-era1-enemy.png
   ├─ ...
   └─ bg-era1-sky.png
       ...
```

Then run:

```sh
node scripts/era-siege-import-sheets.mjs
```

This script (I'll build it once you confirm the format) will:

1. Read each sheet by filename.
2. Use the **filename to look up the expected cell size** (from a table
   matching the spec above — no heuristics).
3. Slice into per-frame PNGs at `public/games/era-siege/...`:
   - `unit/era1/frontline.png`     ← walk row, frame 0 (idle pose)
   - `unit/era1/frontline-walk.png`   ← full strip (the renderer can animate)
   - `unit/era1/frontline-attack.png` ← full strip
   - `unit/era1/frontline-idle.png`   ← full strip
   - …
4. Skip empty cells (full transparent ones), so a sheet with only
   walk + attack still imports cleanly.

---

## Per-era / per-unit visual brief

### Era 1 — Ember Tribe

Tribal pre-iron. Bone, fire, hide, ember. Warm orange + bone-white palette.

| Unit | Pose / equipment |
|---|---|
| Frontline (Ember Runner) | Slim warrior with bone club + flame torch in off-hand. Tribal face paint (red), leather wraps, bone necklace. Attack: torch swing → fire arc on frame 3. |
| Ranged (Bone Slinger) | Lithe archer with bone-shard bow. No quiver — bone arrows tucked in waist sash. Attack: pull → release on frame 3, projectile spawns at the bow string. |
| Heavy (Pyre Bearer) | Big, slow, hide-clad warrior with a flaming brazier on a pole. Iron-banded heart-armour. Attack: swings the brazier in an overhead chop. |
| General (Pyre Warlord) | Tall chieftain in feathered head-dress, bone-and-fire armour, twin-headed flame staff. Attack: overhead double-handed slam summoning a fire pillar. |

### Era 2 — Iron Dominion

Plate-and-banner medieval. Cool steel + crimson + cream palette.

| Unit | Pose / equipment |
|---|---|
| Frontline (Oath Spear) | Plate-armoured spearman with kite shield. Spear forward, shield raised. Attack: spear thrust on frame 3. |
| Ranged (Crossbow Sworn) | Plated crossbowman, foot in stirrup. Attack: shoulder → trigger pull on frame 3, bolt spawns from the crossbow tip. |
| Heavy (Iron Bastion) | Huge knight in sealed plate, two-handed maul. Heart-armour engraved. Attack: maul windup → ground-slam on frame 3. |
| General (Iron Marshal) | King-figure in gilded plate, banner-cape, longsword. Attack: cleaving overhead swing. |

### Era 3 — Sun Foundry

Steampunk industrial. Brass + bronze + steam-grey + amber-orange palette.

| Unit | Pose / equipment |
|---|---|
| Frontline (Brass Skirmisher) | Goggled rifleman in brass-trimmed leather. Attack: hip-fire → recoil. |
| Ranged (Steam Caster) | Backpack steam-tank with a long brass cannon. Attack: pump-prime → barrel exhale + bullet on frame 3. |
| Heavy (Forge Hauler) | Huge mechanic carrying an over-sized brass cannon. Attack: stabilise, fire shell, recoil. |
| General (Brass Captain) | Fancy steampunk officer in tricorn-and-monocle, brass leg-prosthetic, ornate cannon. Attack: flourish → fire. |

### Era 4 — Storm Republic

Dieselpunk industrial. Navy + cyan + chrome palette, lightning-blue accents.

| Unit | Pose / equipment |
|---|---|
| Frontline (Rail Trooper) | Trench-coated soldier with tesla-rifle, cyan-glowing core. Attack: shoulder-fire bolt → recoil. |
| Ranged (Voltaic Sharpshooter) | Sniper with high-collar coat, voltaic scoped rifle. Attack: scope → fire, projectile glows cyan. |
| Heavy (Howitzer Walker) | Trench-line gunner with a tripod-mounted howitzer (or wears a mech walker rig). Attack: pump → fire shell → recoil. |
| General (Storm Commodore) | Naval-officer-coded commander with epaulettes, voltaic sword + pistol. Attack: pistol shot → sword flourish. |

### Era 5 — Void Ascendancy

Post-physical alien. Magenta + violet + shadow + soft-glow palette.

| Unit | Pose / equipment |
|---|---|
| Frontline (Cinder Wraith) | Robed phantom, glowing magenta eyes, hovering low (feet barely touch). Attack: cleaver of crystal-shadow on frame 3. |
| Ranged (Echo Lance) | Tall figure with a long crystal lance that fires runes. Attack: lance horizontal → rune fires. |
| Heavy (Singular Colossus) | Huge crystalline being, multi-armed, central glowing core. Attack: multi-arm slam. |
| General (Void Sovereign) | Crowned crystalline god-figure, shadow-cape, pulsing magenta core. Attack: outstretched hands cast a rune-explosion. |

---

## Critical reminders (the things that broke past sheets)

1. **Cell size is fixed.** Walk frame 0 and walk frame 5 must be the same width.
2. **No gutters.** Cells touch each other. The crop script does `i * W`.
3. **Anchor is fixed.** Foot of the figure at y=240 in every 256×256 cell.
4. **Background is alpha=0.** Not white, not checker, not solid.
5. **Right-facing.** Always.
6. **No baked shadow / cloud / platform under the feet.** The lane has its own ground.
7. **No watermark.** If your generator adds one, tell me where so the cleaner can wipe it.

If a single one of these fails, the crop script can't slice cleanly
and the in-game sprite breaks. Following all 7 makes the import a
single deterministic command.

---

## Priority order

Do these first if you're producing in batches:

1. **Projectiles** (`projectile-*.png` × 5) — currently the user-visible
   "bullets at wrong level" issue is partly caused by procedural
   placeholders rendering at the wrong position. Real PNGs fix this.
2. **VFX** (`vfx-*.png` × 4) — game-feel multiplier; tiny files, huge
   impact on combat readability.
3. **Era 1 unit sheets** (4 PNGs) — flagship era, what the player
   sees in their first match.
4. **Era 1 turret + base** — completes era 1.
5. **Era 2-5** in order.
