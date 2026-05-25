# Era Siege — Asset & Decision Needs

Single source of truth. Where older docs (`era-siege-crop-spec.md`,
`era-siege-image-spec.md`) differ, this one wins.

---

## TL;DR — what's pending right now

**Art (you):** 28 PNGs for the Painted II theme + 30 OLD-batch annotations.
**Code (me):** Already shipped this session — display-name overlay (Option B),
theme allowlist extension, XP-rate per difficulty, polish bugs.

After the 28 PNGs land, I run `npm run import:era-siege-biome && npm run process:era-siege-v2`, and Painted II is fully live with cyan/red/cool labels swapping to "Volcanic Basalt", "Magma Burst" etc. for every era.

---

## 1. The model (locked, confirmed by Image 138 headers)

- **Code: 5 mechanical eras.** No new mechanical eras planned. The
  Ember Tribe / Iron Dominion / Sun Foundry / Storm Republic / Void
  Ascendancy IDs are the save-format keys and stay forever.
- **Art: theme packs.** Each pack repaints those 5 eras with a new
  visual identity. Painted II = Volcanic Basalt / Biolume Reef / Sun
  Foundry / Storm Republic / Void Crystal.
- **Display names overlay** (Option B) **is now wired.** When the player
  picks `Painted II` in Settings, the HUD swaps:
  | Code era id      | Default label   | Painted II label   | Code special id  | Default special  | Painted II special |
  |------------------|-----------------|--------------------|------------------|------------------|--------------------|
  | ember-tribe      | Ember Tribe     | **Volcanic Basalt**| ember-volley     | Ember Volley     | **Magma Burst**    |
  | iron-dominion    | Iron Dominion   | **Biolume Reef**   | iron-rain        | Iron Rain        | **Bio-Acid Bubble**|
  | sun-foundry      | Sun Foundry     | Sun Foundry        | sun-forge        | Sun Forge        | **Foundry Strike** |
  | storm-republic   | Storm Republic  | Storm Republic     | storm-fork       | Storm Fork       | **Lightning Chain**|
  | void-ascendancy  | Void Ascendancy | **Void Crystal**   | void-collapse    | Void Collapse    | **Void Rift**      |

  Save files, telemetry, balance numbers — all unchanged. Selecting
  Classic / Painted I keeps the original labels.

If you want extra theme packs (Tier 2/3/4 from the earlier images) we
add `themeLabels.v3` / `themeLabels.v4` / `themeLabels.v5` to each era
+ special. The allowlist already accepts those pack ids — drop a folder
at `public/games/era-siege/v3/` and ship art and it just works.

---

## 2. AUDIT — what's already on disk

### 2.1 Painted II theme (`public/games/era-siege/v2/`)

| Slot                                   | E1 | E2 | E3 | E4 | E5 |
|----------------------------------------|:--:|:--:|:--:|:--:|:--:|
| `unit/era<N>/{front,ranged,heavy,general}.png` + sprite strips | ✅ | ✅ | ✅ | ✅ | ✅ |
| `turret/era<N>/{idle,fire,recoil}.png` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `base/era<N>/player.png`               | ❌ | ❌ | ❌ | ❌ | ❌ |
| `bg/era<N>/foreground.png`             | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ui/hp-bar-era<N>.png`                 | ❌ | ❌ | ❌ | ❌ | ❌ |
| `vfx/hazard-era<N>.png`                | ❌ | ❌ | ❌ | ❌ | ❌ |
| `special-era<N>.png`                   | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.2 Incoming-art staging

```
assets/era-seige-2/biome/era1..5/   EMPTY  (target for Painted II biome drops)
assets/era-seige-2/turret/          EMPTY  (target for raw-3/4/5)
assets/era-seige-2/OLD/             30 files unrouted (need annotation)
assets/era-seige-2/NEW/             drained — units already processed
```

---

## 3. UNIVERSAL AUTHORING RULES (apply to every PNG)

1. **PNG only.** Transparent background unless it's a unit sheet (those
   keep magenta `#ff00ff` cell-backdrop; processor strips it).
2. **2× HiDPI source** — importer downsamples to render size.
3. **No baked drop-shadow, no outer glow, no internal text.** HUD owns those.
4. **No dark-edge fringe.** Test against a bright white background — silhouette edges must read as the silhouette's own colour. Dark halo = premultiplied-alpha export bug.
5. **Filename rules:** lowercase, hyphens not underscores. `Base-Player.PNG` fails on Linux CI.
6. **Lighting direction:** above-left. Renderer paints ground shadow at the foot.
7. **Player-side art only.** Importer auto-mirrors via `flop()` for enemy side. Don't deliver pre-mirrored variants.
8. **`floor.png` tileable** — left edge column = right edge column pixel-for-pixel.

---

## 4. PHASE 1 — Painted II (28 PNGs, art-blocked)

### 4.1 Per-file specs (apply across all 5 eras)

#### A. `base-player.png` — gate art
- **Canvas:** ~700 W × 880 H px (2× HiDPI). Renders at ~440 px tall in-game.
- **Bottom 12 px opaque ground-contact** (foot must "plant").
- **Door anchor:** dark portal centre at **(W/2, H − 90 px)** — units spawn from this point on screen.
- **Flip-safety:** silhouette must mirror cleanly. No readable text, no strong asymmetric details (enemy side is auto-flipped).
- **Transparent background.**

#### B. `floor.png` — biome ground tile
- **Size:** **1920 × 400 px exactly.**
- **Top 80 px alpha 0** (sky shows through procedural layers above).
- **Tileable horizontally:** left edge = right edge pixel-for-pixel.

#### C. `hp-bar.png` — decorative HP frame
- **Size:** **720 × 110 px.** Composites BEHIND the live segmented bar.
- **Middle 76 % (~547 px wide):** dark neutral track. The live cyan / amber / red segments paint over it.
- **Outer 12 % each side (~86 px wide):** decorative caps in the era hue.
- **Transparent background.** No baked fill, no segments.

#### D. `hazard.png` — 5-frame animation strip
- **Size:** **1600 × 64 px** (5 cells × 320 W × 64 H). Source @ 2x HiDPI: 3200 × 128.
- **Cycle:** frame 4 → frame 0 must loop without a visible jump.
- **Bottom-centre of each cell = floor contact point.**
- **Transparent background.**

#### E. `special-primary.png` — Q-key ability icon
- **Size:** **512 × 512 px** (2× HiDPI). Renders at 256 × 256.
- **Centred composition,** ~15 % margin all sides for the renderer's glow halo.
- **Transparent background, no internal text.**

### 4.2 Per-era checklist (drop into `assets/era-seige-2/biome/era<N>/`)

```
Era 1 — Volcanic Basalt / Obsidian Gate / Magma Burst   (red / charcoal)
  [ ] base-player.png      black basalt gate, vertical glowing magma cracks
  [ ] floor.png            cracked basalt tile, dim-red ember veins
  [ ] hp-bar.png           ember-red frame, basalt caps with magma rivets
  [ ] hazard.png           Plasma Conduit — orange-yellow plasma loops
  [ ] special-primary.png  Magma Burst — upward magma plume in circular badge

Era 2 — Biolume Reef / Bio-Lume Gate / Bio-Acid Bubble  (teal / cyan)
  [ ] base-player.png      organic teal-cyan coral arch, bioluminescent glow
  [ ] floor.png            wet reef stones, glowing teal moss, coral scatter
  [ ] hp-bar.png           teal/cyan frame, coral-shape caps
  [ ] hazard.png           Bio-Acid Pool — green-teal frothing loop
  [ ] special-primary.png  Bio-Acid Bubble — teal-green skull-fizz bubble

Era 3 — Sun Foundry / Sun Foundry Gate / Foundry Strike (amber / brass)
  [ ] base-player.png      brass-amber smelter, flanking pipes/chimneys, furnace glow
  [ ] floor.png            foundry plate, brass rivets, slag puddles
  [ ] hp-bar.png           amber/brass frame, gear-rivet caps
  [ ] hazard.png           Molten Pool — amber-red ripple loop
  [ ] special-primary.png  Foundry Strike — descending forge hammer with sparks

Era 4 — Storm Republic / Storm Republic Gate / Lightning Chain (pewter / ice-blue)
  [ ] base-player.png      steel-pewter gate, ice-cyan lightning conduits
  [ ] floor.png            corroded steel grating, electric-blue pools, embedded cables
  [ ] hp-bar.png           pewter/ice-blue frame, lightning-prong caps
  [ ] hazard.png           Electrical Field — blue-white arc loop
  [ ] special-primary.png  Lightning Chain — branching bolt in circular badge

Era 5 — Void Crystal / Void Crystal Gate / Void Rift    (violet / magenta)
  [ ] base-player.png      violet crystal shard cluster, central void hole
  [ ] floor.png            shattered crystal shards, void-glow fissures
  [ ] hp-bar.png           violet/magenta frame, crystal-shard caps
  [ ] hazard.png           Void Rift — violet gravitational ripple loop
  [ ] special-primary.png  Void Rift — black spiral inside violet ring
```

**25 biome files total** for Phase 1. After delivery, run:

```bash
npm run import:era-siege-biome
```

…which routes them into `public/games/era-siege/v2/{base,bg,ui,vfx}/`.

### 4.3 Turret strips (3 missing — eras 3, 4, 5)

Era 1 + Era 2 strips already shipped (visible in `v2/turret/era1/` and `v2/turret/era2/`). The remaining three:

```
[ ] assets/era-seige-2/turret/raw-3.png   Foundry brass cannon       (~960 × 320)
[ ] assets/era-seige-2/turret/raw-4.png   Storm rail-gun             (~960 × 320)
[ ] assets/era-seige-2/turret/raw-5.png   Void shard launcher        (~960 × 320)
```

Per-strip:
- **Size:** 960 × 320 px (3 cells × 320 W × 320 H).
- **Background:** transparent (NOT magenta).
- **Cell 0:** Idle (weapon at rest, no muzzle effect).
- **Cell 1:** Fire (muzzle flash + projectile-leaving frame, VFX baked in).
- **Cell 2:** Recoil (barrel pushed back, mount disk stays at bottom-centre — don't slide the whole turret).
- **Mount disk:** anchored to bottom-centre of every cell.
- **Recoil offset:** moving parts ≤ 16 px so the turret doesn't visually unbolt.

After delivery:

```bash
npm run process:era-siege-v2
```

…slices each strip into `v2/turret/era<N>/{idle,fire,recoil}.png`.

> One open question from your earlier callout: Image 137 mentioned a "5-cell strip" for one of the turrets. If you want 5 frames per strip (idle / wind-up / fire / recoil / cooldown), say so and I extend the processor in ~15 min. Default = 3-cell as specified above.

---

## 5. OLD batch — annotate 30 files

`assets/era-seige-2/OLD/1.png … OLD/30.png` are sitting unrouted because their content is unknown. Paste this back filled in:

```
1.png  =
2.png  =
3.png  =
4.png  =
5.png  =
6.png  =
7.png  =
8.png  =
9.png  =
10.png =
11.png =
12.png =
13.png =
14.png =
15.png =
16.png =
17.png =
18.png =
19.png =
20.png =
21.png =
22.png =
23.png =
24.png =
25.png =
26.png =
27.png =
28.png =
29.png =
30.png =
```

Vocab (one per file):
- `base art (era N)` · `floor (era N)` · `hp-bar (era N)` · `hazard (era N)` · `special (era N)`
- `turret (era N)` · `unit-sheet (era N, role)`
- `concept / scrap` (I skip these)

Once annotated I route them into either `v1/` (alternate theme) or `v2/` (Painted II fallbacks), depending on what they are.

---

## 6. Optional add-ons (skip unless you want them)

These are nice-to-haves; the game ships without them.

### 6.1 Per-era W-hotkey special icons
```
assets/era-seige-2/biome/era<N>/special-secondary.png  (512 × 512, same spec as 4.1.E)
```
If skipped: Procedural draws the secondary special.

### 6.2 Per-era painted backgrounds (skip → procedural sky/mountains)
```
assets/era-seige-2/biome/era<N>/sky.png            1920 × 720
assets/era-seige-2/biome/era<N>/mountains-far.png  1920 × 400, alpha 0 above horizon
assets/era-seige-2/biome/era<N>/mountains-mid.png  1920 × 400, alpha 0 above horizon
assets/era-seige-2/biome/era<N>/clouds.png         1920 × 240, 3-row strip
```

### 6.3 Additional theme tiers (Painted III / IV / V)
If you want to ship the Mystic Grove / Cybernetic Hive / Aetherium Spires variants from the earlier reference images, the code is already wired:
- Add `themeLabels.v3 = { name, gateName }` per era + `themeLabels.v3 = { name }` per special.
- Drop art into `public/games/era-siege/v3/` (same subdir layout as `v2/`).
- Settings drawer needs three more tiles wired (5-line change — I'll do it when the first v3 file lands).

---

## 7. LEVELS — done, no art needed

5-tier difficulty wired (`src/games/era-siege/content/difficulties.js`):

| Level   | AI spawn | AI tech | Turret push | Special agg | Enemy dmg | Player start gold | Player gold rate | Player XP rate |
|---------|----------|---------|-------------|-------------|-----------|--------------------|------------------|----------------|
| Easy    | 0.65×    | 0.70×   | 15%         | 0.30        | 0.85×     | 150g               | 1.20×            | 1.20×          |
| Normal  | 1.00×    | 1.00×   | 35%         | 0.60        | 1.00×     | 110g               | 1.00×            | 1.00×          |
| Medium  | 1.15×    | 1.15×   | 45%         | 0.75        | 1.05×     | 95g                | 0.92×            | 0.92×          |
| Hard    | 1.30×    | 1.30×   | 60%         | 0.90        | 1.15×     | 85g                | 0.82×            | 0.80×          |
| Insane  | 1.55×    | 1.45×   | 75%         | 1.00        | 1.30×     | 70g                | 0.70×            | 0.65×          |

Want to retune any cell? One line is enough.

---

## 8. Out of scope right now

| Item | Why parked |
|------|-----------|
| **20 mechanical eras** (new units, new generals, new specials per era) | Image 138 confirms the model is "5 mech eras × theme packs" — eras 6–20 in earlier images are theme reskins, not new mechanics. |
| **RTS camera, mini-map, multi-resource** (Image 130) | Multi-month engine refactor; current game = single-lane tug-of-war. |
| **Boss-battle HUD / mission-select lobby** (Images 128–129) | Stretch UX, not blocked by anything. Ask if you want it scheduled. |
| **Multiplayer chat, party heroes** (Image 131) | Single-player only today; no netcode. |
| **Animated gate-evolve cinematic** | Cool, not flagged today. Say the word. |

---

## 9. Delivery checklist (one place)

```
ART
  [ ] assets/era-seige-2/biome/era1/   × 5 files   (Volcanic Basalt)
  [ ] assets/era-seige-2/biome/era2/   × 5 files   (Biolume Reef)
  [ ] assets/era-seige-2/biome/era3/   × 5 files   (Sun Foundry)
  [ ] assets/era-seige-2/biome/era4/   × 5 files   (Storm Republic)
  [ ] assets/era-seige-2/biome/era5/   × 5 files   (Void Crystal)
  [ ] assets/era-seige-2/turret/raw-3.png            (Foundry cannon)
  [ ] assets/era-seige-2/turret/raw-4.png            (Storm rail-gun)
  [ ] assets/era-seige-2/turret/raw-5.png            (Void shard launcher)

ANNOTATION
  [ ] OLD/1.png .. OLD/30.png — one line per file (§5)

OPTIONAL
  [ ] special-secondary.png × 5 (W-key abilities)
  [ ] Background layers (sky / mountains / clouds) per era
  [ ] Difficulty retunes (§7)
  [ ] Confirm turret strips are 3-cell (default) or extend to 5-cell

DECISIONS
  [ ] Painted II label overrides as listed in §1 — good to ship? (default: yes, already in code)
```

After delivery I run:

```bash
npm run import:era-siege-biome     # 25 biome files → v2/{base,bg,ui,vfx}/
npm run process:era-siege-v2       # turret raws → v2/turret/era<N>/{idle,fire,recoil}.png
npm test && npm run build          # 106/106 must pass
```

…then screenshot the result at era 1 → era 5 transitions, ping back for sign-off.

---

## 10. What I shipped this session (so the diff is clear)

- **Display-name overlay (Option B)** — `utils/themeDisplay.js`, `content/eras.js` themeLabels, `content/specials.js` themeLabels. HUD, EraBadge, EraBanner, EraPreviewCards, ResultPanel, SpecialButton, TopBar all switched to the helpers.
- **Theme allowlist extended** — `assets.setArtPack()` now accepts `v1` / `v2` / `v3` / `v4` / `v5` plus the URL-rewrite rule (`engine/assets.js`).
- **Difficulty XP scaling** — `playerXpRateMul` added to all 5 difficulty tiers; `awardKill()` multiplies bountyXp by it for the player side (`sim/economy.js`).
- **Polish bugs** — `cheapDiffers` now picks up troopDmg / troopHp / troopRng; General card gains `aria-disabled`; HP-bar PNG underlay slot wired in `drawBaseHpAndLabel`.
- **Tests:** 106/106 passing. **Build:** clean (EraLane chunk 51.68 KB gzipped).
