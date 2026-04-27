# Era Siege — Phase 7 Implementation Plan

Goal: lift the existing playable game from "functional prototype" into
"premium polished strategy product" without touching the simulation
foundations. The sim/content/utils layers under `src/games/era-siege/`
stay; the render and React layers get a structural rebuild.

## 7.0 Docs (this commit)
- `docs/aow-ux-audit.md` — what's wrong, where, why.
- `docs/aow-implementation-plan.md` — this file.
- `docs/aow-visual-direction.md` — palette, composition, art direction.
- `docs/images.md` — every PNG needed, by spec.
- `docs/audio.md` — every clip needed, by spec.

## 7.1 Asset manifest + placeholder pipeline
- New `src/games/era-siege/engine/assets.js`: a single named registry of asset keys (`'unit/era1/frontline'`, `'turret/era3'`, `'bg/era2/clouds'`, etc.).
- Each entry has a *placeholder draw function* that uses primitives (current behaviour) and a *swap-in image path* that takes precedence when the file exists in `public/games/era-siege/...`. This lets every PNG the user generates land into a known slot without a code change.
- The manifest is the single source of truth for what art is needed; `docs/images.md` mirrors it 1:1.
- Renderer reads keys via `assets.draw(ctx, 'key', x, y, opts)`. Today every key resolves to its placeholder; tomorrow some resolve to images.

## 7.2 Renderer overhaul (no sim changes)
- Extract per-layer drawing into `engine/parallax.js`:
  - `drawSky(ctx, view, era, t)` — gradient + soft noise band
  - `drawClouds(ctx, view, era, t)` — era-tinted cloud silhouettes drifting at parallax speed
  - `drawFarMountains(ctx, view, era)` — silhouette
  - `drawMidHills(ctx, view, era)` — silhouette, era-specific shape
  - `drawForeground(ctx, view, era)` — rocks/grass/debris silhouettes
- Bring ground line up to 60% of stage height. Increase unit silhouette scale by 18% (visual only, sim ranges unchanged).
- Bases gain a +25% height bump and an era-specific archway.
- Add a 600 ms era-up banner overlay above the era flash (text "ERA N — NAME").

## 7.3 HUD restructure
- Drop existing `.es-topbar` grid. New `TopBar.jsx` with 3 zones:
  - **PlayerZone**: portrait swatch + "YOU" tag + gold (large) + HP bar.
  - **CenterZone**: era chip + XP arc + Evolve CTA. Difficulty chip nests in.
  - **EnemyZone**: enemy HP bar + "ENEMY" tag + their era pill.
- A second tier underneath holds: time, speed (1×/2×), pause, power-ups, settings, sound — small, monochrome icons.
- The "low HP" pulse animates the Player zone background red when HP < 25%.

## 7.4 Turret build modal + manage popover
- Click an empty slot → `TurretBuildModal.jsx` opens, anchored to slot.
  - Shows era turret silhouette (placeholder), name, build cost, dmg, range, cooldown, what it counters in one line.
  - Build / Cancel.
- Click an occupied slot → `TurretManagePopover.jsx`.
  - Name, era of build, dps, sell refund.
  - Upgrade-now button when slot's era < player's era.
- The right rail collapses to a thin strip showing slot status icons; the actual flow is modals.

## 7.5 Power-ups drawer + `sim/powerups.js`
- 4 trees, 3 levels each:
  - **Economy**: gold rate +10/+20/+30%
  - **Base**: max HP +10/+20/+30% (existing damage proportional)
  - **Special**: cooldown -10/-20/-30%
  - **Turret**: damage +10/+20/+30%
- Costs: 80g / 200g / 400g per level (independent across trees).
- Stored on `state.player.powerups = { economy:0..3, base:0..3, special:0..3, turret:0..3 }` with no cross-match persistence (resets each match).
- Multipliers applied at sim read sites:
  - `tickEconomy`: gold rate × `(1 + 0.1 * economy)`
  - `tryEvolve` and base init: maxHp × `(1 + 0.1 * base)` (one-time on apply, plus a heal pulse to keep ratio sane)
  - `tryFireSpecial`: cooldown × `(1 - 0.1 * special)`
  - turret hit damage × `(1 + 0.1 * turret)` in `projectile.js` impact path (turret-team only)
- Drawer key: `U`. Settings drawer + power-up drawer pause the sim while open (already does for settings).

## 7.6 Evolution panel
- Hover/long-press on Evolve → preview panel: 3 next-era unit silhouettes (placeholder), new turret silhouette, new special.
- Click confirms.
- "Era reached" banner overlay on success.

## 7.7 UnitDock card overhaul
- Card grows from 56→96 px. Inside:
  - Top: silhouette art (placeholder, will swap to PNG via assets.js)
  - Middle: name + role icon
  - Bottom: cost + cooldown bar
- Role icons (frontline/ranged/heavy) — three small SVG glyphs (sword / bow / hammer).
- Hover lifts the card; long-press opens the existing tooltip.

## 7.8 Audio buses
- Add `master` / `music` / `sfx` volumes (0.0–1.0) to `utils/settings.js`.
- Settings drawer gets three sliders.
- `engine/audio.js` reads `sett.volumes.{master,sfx}` and gates each cue's gain via a Web Audio gain node — implemented via a small wrapper around `src/sound.js`'s `sfx[name]()` (we apply a multiplier through a shared output stage).
- Music: only emits if `music > 0`; v1 has no music files (per Audio Plan), so the slider exists but does nothing until a clip ships. Documented.

## 7.9 Verify
- `npm test` (existing 79 + new powerup tests)
- `npm run validate:catalog`
- `npm run build`
- `npm run sim:era-siege` to confirm balance hasn't regressed (powerups not applied in mirror — both sides have powerups=0)

## Files added in phase 7
```
src/games/era-siege/engine/assets.js
src/games/era-siege/engine/parallax.js
src/games/era-siege/sim/powerups.js
src/games/era-siege/ui/TopBar.jsx
src/games/era-siege/ui/PlayerZone.jsx
src/games/era-siege/ui/EnemyZone.jsx
src/games/era-siege/ui/CenterZone.jsx
src/games/era-siege/ui/TurretBuildModal.jsx
src/games/era-siege/ui/TurretManagePopover.jsx
src/games/era-siege/ui/PowerUpsDrawer.jsx
src/games/era-siege/ui/EvolutionPanel.jsx
src/games/era-siege/ui/EraBanner.jsx
src/games/era-siege/ui/RoleIcon.jsx
docs/aow-ux-audit.md
docs/aow-implementation-plan.md
docs/aow-visual-direction.md
docs/images.md
docs/audio.md
test/era-siege.powerups.test.js
```

## Files materially changed in phase 7
```
src/games/era-siege/index.jsx              (uses TopBar, mounts new modals/drawers/banners, wires powerups)
src/games/era-siege/engine/renderer.js     (uses parallax, scaled units, taller bases)
src/games/era-siege/engine/audio.js        (master/sfx gain wrapper)
src/games/era-siege/engine/input.js        (U key for power-ups)
src/games/era-siege/sim/world.js           (powerups state field, applied at read sites)
src/games/era-siege/sim/economy.js         (gold rate × economy mult)
src/games/era-siege/sim/specials.js        (cooldown × special mult)
src/games/era-siege/sim/projectile.js      (turret damage × turret mult)
src/games/era-siege/utils/settings.js      (master/music/sfx volumes)
src/games/era-siege/ui/UnitDock.jsx        (card layout, silhouette, role icon)
src/games/era-siege/ui/HUD.jsx             (replaced by TopBar; HUD becomes a thin compatibility shim)
src/games/era-siege/ui/TurretRack.jsx      (slim slot-status strip; build/manage flow moves to modals)
src/games/era-siege/ui/SettingsDrawer.jsx  (3 volume sliders, music note)
src/games/era-siege/styles.css             (substantial additions for new components)
```

## Out of phase 7 scope
- Real PNG art generation (the user supplies these later; manifest + slots are ready).
- Music tracks (sliders shipped, content shipped per `docs/audio.md` later).
- Achievements panel (already covered by `useAchievements`).
- Multiplayer / leaderboards-by-difficulty (Supabase artifacts shipped phase 3, deploy is user-driven).
