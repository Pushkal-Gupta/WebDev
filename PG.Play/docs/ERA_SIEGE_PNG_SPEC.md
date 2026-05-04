# Era Siege — PNG asset spec for hand-generation

This is the complete drop-in spec for replacing the procedural placeholders with hand-generated artwork. Hand each PNG (or batch of PNGs) to whatever pipeline is generating them (Gemini, DALL·E, Midjourney, hand-drawn, etc.) and drop the output into the matching path under `public/games/era-siege/`. Then run `npx vite build` and hard-refresh — the asset manifest already maps every path here, no code changes needed.

If a PNG is missing, the engine renders a procedural placeholder of the same silhouette in its place (so partial drops are fine; you can deliver in batches).

## Format requirements (apply to every PNG)

- **PNG with full alpha channel.** No transparency-checker baked in. No solid white/coloured background.
- **Tight bounding box.** The silhouette fills the canvas — no transparent padding around it. The runtime scales the whole PNG to a target height; padding scales with it and shrinks the visible silhouette.
- **Right-facing orientation** for units, bases, and turrets. The engine flips horizontally for the enemy side; only generate one direction.
- **Foot / base anchor at bottom-centre** for units, bases, and turrets. The renderer positions the bottom-centre of the PNG at the unit's foot point.
- **Sharp edges, no JPEG-style compression artefacts.** PNG-24 with alpha is the right format.

## Era visual identities

Use these as the high-level prompt for each era's set.

| Era | Folder name | Vibe |
|-----|-------------|------|
| 1 | `era1` (`ember-tribe`) | Primal, tribal, fire & bone. Warm orange/red palette, dawn lighting, leather + furs |
| 2 | `era2` (`iron-dominion`) | Medieval. Plate armour, banners, cold grey/red palette, overcast skies |
| 3 | `era3` (`sun-foundry`) | Steam-punk. Brass + leather, alchemical heat, golden-brown palette, smokestacks |
| 4 | `era4` (`storm-republic`) | Diesel-punk. Rail/voltage, gas masks, dark blue + cyan accents, stormy skies |
| 5 | `era5` (`void-ascendancy`) | Post-physical horror. Glowing crystals, deep purple + violet glow, nebula skies |

Era-specific head accents (apply across all 4 unit roles in that era):
- Ember: tribal face-paint stripe across eyes, rough hair
- Iron: helmet with horizontal visor slit
- Foundry: brass goggles (two glowing yellow lenses)
- Storm: gas mask with cyan filter glow
- Void: glowing magenta / violet eye-points (no visible face)

## 1. Backgrounds — 20 PNGs

Path pattern: `public/games/era-siege/bg/era<N>/<file>.png`

| File | Pixel size | Notes |
|------|------------|-------|
| `sky.png` | 1920 × 720 | Full opaque scene. Sky gradient + sun/moon disc + atmospheric haze near the horizon. **No silhouettes** — those go in the mountain layers above this. |
| `mountains-far.png` | 1920 × 360 | Distant ridge silhouette. Transparent above. Bottom edge at canvas bottom. Low-alpha tint, blends into sky haze. |
| `mountains-mid.png` | 1920 × 360 | Closer ridge silhouette with **era motifs sitting ON the ridge**: castles (Iron), brass workshops with smokestacks (Foundry), factory blocks + antennae (Storm), floating obelisks with glow rim (Void), monoliths + conifers (Ember). Plus a tree-line silhouette right above the bottom edge. |
| `foreground.png` | 1920 × 200 | Dirt-band detail BELOW ground line. Grass tufts + era-specific debris: bones (Ember), pikes + tattered banners (Iron), brass barrels (Foundry), concrete blocks + cabling (Storm), void shards (Void). Transparent above. **No trees here** — trees go in `mountains-mid`. |

Note: `clouds.png` is intentionally NOT in this list — clouds are rendered procedurally because they drift over time.

## 2. Bases — 10 PNGs

Path pattern: `public/games/era-siege/base/era<N>/<file>.png`

| File | Suggested size | Notes |
|------|----------------|-------|
| `player.png` | ~200 × 300 | Era-themed wall / keep / spire. Right-facing entrance. Pennant on top. Foot at canvas bottom. |
| `enemy.png` | ~200 × 300 | Same era's keep with a **slightly different silhouette** (different banner colour at minimum) so the player can tell the two apart at a glance. |

Era guides for bases:
- **Ember (era1)**: wooden palisade with banner stripe across the top, archway doorway, bonfire dot at the base, single pennant
- **Iron (era2)**: stone keep with crenellated battlements, draped banners, archway door, two pennants on flanking towers
- **Foundry (era3)**: brass-plated workshop with smokestack, vent grille door, brass banding + rivets
- **Storm (era4)**: concrete bunker with rivet rim, horizontal voltage stripe, antenna mast on top, blinking red/cyan light
- **Void (era5)**: floating obelisk with glow rim, narrow door slit, glowing vertical edges

## 3. Units — 20 PNGs

Path pattern: `public/games/era-siege/unit/era<N>/<file>.png`

| File | Suggested size | Role | Per-era unit name |
|------|----------------|------|-------------------|
| `frontline.png` | ~120 × 150 | Fast melee | 1: Ember Runner (club), 2: Oath Spear, 3: Brass Skirmisher (sabre), 4: Rail Trooper (bayonet), 5: Cinder Wraith (edge) |
| `ranged.png` | ~120 × 150 | Ranged attacker | 1: Bone Slinger (sling), 2: Crossbow Sworn, 3: Steam Caster (rifle), 4: Voltaic Sharpshooter (arc-rifle), 5: Echo Lance |
| `heavy.png` | ~150 × 180 | Slow tank, cape + helm crest | 1: Pyre Bearer (brand), 2: Iron Bastion (maul), 3: Forge Hauler (piledriver), 4: Howitzer Walker (howitzer), 5: Singular Colossus (colossus-fist) |
| `general.png` | ~200 × 240 | Era boss. Wears 3-point **crown**, **back-banner pole behind shoulders**, cape, helm crest | 1: Pyre Warlord, 2: Iron Marshal, 3: Brass Captain, 4: Storm Commodore, 5: Void Sovereign |

All four roles in a given era should share the **head accent** (face paint / visor / goggles / gas mask / glowing eyes) and **costume motif** (tribal wrap / plate rivets / brass buttons / voltage stripe / glowing crack) so the era reads as a unit at a glance.

## 4. Turrets — 5 PNGs (optional)

Currently the renderer draws turrets procedurally (so it can swap to fire/recoil frames during the cooldown cycle). If you want to replace the procedural look with hand art, drop here:

Path pattern: `public/games/era-siege/turret/era<N>.png`

Each ~80 × 80, side-view, base-anchored to the bottom-centre. Era kinds:
- `era1.png` — bone crossbow (split-bone pike across a wooden mount)
- `era2.png` — iron ballista (heavy bolt thrower with twisted-cord)
- `era3.png` — brass mortar (steam-fed shells, brass barrel angled up)
- `era4.png` — volt cannon (capacitor arc gun, three rod antennae)
- `era5.png` — void lance (resonance lance, slim glowing tip)

If you want fire / recoil frames per turret:
- `era<N>-fire.png` — barrel forward + muzzle flash
- `era<N>-recoil.png` — barrel pulled back

These are *optional* — without them the renderer keeps animating procedurally on top of the idle PNG.

## 5. VFX — 2 missing files (optional)

The console currently warns about two missing assets. They were 0-byte placeholders and the renderer falls back to procedural particles:

- `public/games/era-siege/vfx/explosion-small.png` — either a single 32 × 32 frame, OR a 12-frame horizontal sheet (1152 × 96). Bright orange / yellow burst with smoke.
- `public/games/era-siege/vfx/explosion-large.png` — either single 64 × 64, OR 12-frame sheet. Bigger, longer-lived.

Already present and working:
- `hit-spark.png` (288 × 32, 9-frame strip)
- `muzzle-flash.png` (512 × 128, 4-frame strip)
- `explosion-12.png` (12-frame painted strip — used by the painted-explosion effect)

## Totals

| Category | Files |
|----------|-------|
| Backgrounds | 20 |
| Bases | 10 |
| Units | 20 |
| **Core total** | **50** |
| Turrets (optional) | 5–15 |
| VFX (optional) | 2 |

## What's already cropped from `assets/age-of-war/*.png`

The reference sheets you dropped into `assets/age-of-war/` (1.png — 9.png) have been
cropped end-to-end via `node scripts/era-siege-crop-sheets.mjs`. That script:

- Slices each 2816×1536 sheet into per-figure regions using auto-detected vertical
  cuts (column scans for local minima in figure-pixel count).
- Runs a two-threshold corner-seeded flood-fill (permissive `spread` to traverse the
  pencil-grey construction lines, strict `clear` to actually wipe the white
  background).
- Soft-feathers the alpha edge so silhouettes don't read as cookie-cutter cut-outs.
- `sharp.trim()` to a tight bounding box.

Re-run any time you replace one of the reference sheets:

```sh
node scripts/era-siege-crop-sheets.mjs
npx vite build
```

## Still needed — UI symbols for power-ups, general mode, difficulty

### Power-up tree icons (7 PNGs, optional)

The PowerUpsDrawer renders 7 trees grouped under sections (Production / Defense /
Offense / Troops). Each row shows a coloured circle as a fallback; if you supply
a PNG it's used in place of the swatch.

Drop into `public/games/era-siege/ui/` (24×24 to 64×64 PNG, alpha):

| File | Tree | Suggested glyph |
|------|------|-----------------|
| `upgrade-economy.png` | Treasury (gold rate) | gold coin / treasury chest |
| `upgrade-base.png` | Bastion (base HP) | shield / fortress wall |
| `upgrade-special.png` | Resonance (special CD) | hourglass / pulse rune |
| `upgrade-turret.png` | Munitions (turret damage) | crossed cannons / shell |
| `upgrade-troopDmg.png` | Drilled Edge (troop damage) | crossed swords / fist |
| `upgrade-troopHp.png` | Conditioning (troop HP) | flexed arm / heart-shield |
| `upgrade-troopRng.png` | Long-Sighted (ranged reach) | arrow / scope crosshair |

### General mode — 10 generals (deferred but spec'd here)

When General Mode is added the player picks 1 general at the start of the run. Plan
for **10 hand-illustrated generals** at `public/games/era-siege/general/<id>.png`,
~200 × 280 each (same conventions as unit PNGs: tight bbox, right-facing, foot
anchor, alpha). Suggested roster (mix of eras, not bound to era progression):

1. `pyre-warlord` — Ember tribal king with brand axe (already exists as era1 general)
2. `iron-marshal` — Iron Dominion field marshal (already exists as era2 general)
3. `brass-captain` — Sun Foundry brass-armored captain (era3)
4. `storm-commodore` — Storm Republic commodore (era4)
5. `void-sovereign` — Void Ascendancy sovereign (era5)
6. `ash-shaman` — fire/death-themed support
7. `oath-paladin` — heavy melee with healing aura
8. `forge-engineer` — deploys mini-turrets on death
9. `voltaic-witch` — chain-lightning AOE
10. `cinder-empress` — corrupts enemy turrets within range

Plus a portrait icon for each at `public/games/era-siege/general/portrait/<id>.png`
(96 × 96, head/shoulders crop) for the picker UI.

### Difficulty pills (optional)

Each of the 5 difficulty tiers (`easy` / `normal` / `medium` / `hard` / `insane`) can
get a small badge for the intro picker. Drop ~40 × 40 PNGs at:

- `public/games/era-siege/ui/difficulty-easy.png` — green leaf / shield
- `public/games/era-siege/ui/difficulty-normal.png` — neutral sword
- `public/games/era-siege/ui/difficulty-medium.png` — flame
- `public/games/era-siege/ui/difficulty-hard.png` — skull
- `public/games/era-siege/ui/difficulty-insane.png` — purple glow / void crown

These are pure decoration; the picker still works without them.

### General-unlock icon

When a general is locked in the unit dock, the lock glyph is currently inline SVG
(no asset needed). If you'd like a custom unlock badge, add
`public/games/era-siege/ui/unlock-general.png` (24 × 24 PNG, alpha) and the dock
will use it in place of the SVG. Optional.

## Drop-in workflow

1. Generate the PNGs against the spec above.
2. Drop them into the matching `public/games/era-siege/...` paths.
3. Run `npx vite build` (the bake of procedural placeholders runs separately via `npm run bake:era-siege`; you don't need to re-bake — your hand-drops override the procedural ones).
4. Hard-refresh (`Cmd+Shift+R`).
5. Optional: load with `?es-debug` appended to the URL to see the bottom-right overlay confirming `assets <ready>/<total>`.

## Sanity check before generation

Open one of the existing baked PNGs as a reference (e.g. `public/games/era-siege/unit/era2/heavy.png`) so the proportions, anchor, and aspect ratio match. The engine assumes:

- foot at bottom-centre
- right-facing
- tight alpha bounding box

If your generated PNGs follow the same conventions they drop in cleanly with zero code changes.
