# Era Siege — UX Audit

Audit pass against the brief's 17 problem areas, keyed to actual files
in `src/games/era-siege/`. Findings are concrete; the remediation column
points at the change that lands in phase 7.

## A. Screen usage problem

| Finding | Evidence | Remediation |
|---|---|---|
| Battlefield action compressed in a thin bottom strip | `engine/renderer.js` uses `BALANCE.GROUND_BOTTOM_PAD = 100` so on an 800-px stage the ground sits at y=700 and units (24–36 px tall) occupy ~5% of the stage | Move ground line to ~60% of stage height. Add foreground. Increase unit visual scale by ~20% via a render-only multiplier. |
| Sky is empty gradient + thin ridge | `drawMountains` is called twice with the same coordinates — the "two passes" is cosmetic only | Build a true 5-layer parallax (sky → clouds → far mountains → mid hills → foreground rocks). Each layer in `engine/parallax.js`. |
| Right rail (turrets+special+era badge) leaves a gap | `.es-special` at top:12 right:12, `.es-rack` at top:92 right:12 — both 158 wide, taking ~170 px of right margin that's mostly empty around them | Tighten right rail and add slot-status surfaces only when a slot is actionable. Move turret slot UI **into** the bases (battlefield-anchored), keeping a slim right-rail summary. |
| HUD top-bar grid wastes mid-region | `HUD.jsx` uses `grid-template-columns: auto 1.4fr 1fr 1.4fr auto` — the `1fr` mid column shows only an era pill | Repurpose mid as Era+XP arc + Evolve CTA. Evolve becomes a primary HUD element, not a left-rail card. |
| Bottom dock cards look like stock buttons | `UnitDock.jsx` cards are `min-height:56px` with name + meta only. No silhouette, no role icon. | Card grows to 96 px, gets a per-unit silhouette mark, role icon, role-tinted edge. |

## B. Visual depth problem

| Finding | Evidence | Remediation |
|---|---|---|
| One-ridge mountains | `drawMountains` is a single `fillStyle = pal.mountain` polyline | Split into 3 separate ridges with progressively higher alpha (far/mid/near) and distinct silhouettes per era (jagged / blocky / smoke / rod / rift). |
| No clouds | nothing in renderer | New `drawClouds` pass between sky and mountains, era-tinted. |
| No foreground | only `drawMidMotif` — sparse particle-style | New `drawForeground` pass with rocks, grass tufts, debris. |
| Bases read as toy walls | 76×90 box with banner | Bases get +30% height, era-specific archways/banners, ambient lights at night-tinted eras. |
| Effects: damage numbers + simple sparks | Already there but small | Bigger damage numbers for crits (>2× unit base damage); explosion shockwave on heavy unit death. |

## C. UI completeness problem

| Finding | Evidence | Remediation |
|---|---|---|
| Turret build is one-click only | `TurretRack.jsx` sends `onBuild(slot)` directly, no menu | New `TurretBuildModal.jsx` shows the era's turret with art, stats, range, dps, comparison vs current, with a Build / Cancel CTA pair. Architected to support multiple choices when content adds them. |
| Occupied turrets have only Sell button | `TurretRack.jsx` shows `sell · Xg` text-only | New `TurretManagePopover.jsx` anchored to the slot — name, era, dps preview, sell-refund, upgrade-now (when era > slot's era), tactical hint. |
| Turret slot expansion not surfaced | Three slots are always available — content fixes them | Phase 7 stays at 3 slots (no content change), but the rail shows them as discrete surfaces with locked/unlocked language so future content can add slot-unlock. |
| Special is fire-button only | `SpecialButton.jsx` triggers cast on click | Click opens a tray that previews the special, telegraphs cast, and (architecturally) supports alt-specials. v1 stays single-special per era. |
| Power-up / passive upgrades — missing entirely | not implemented | New `sim/powerups.js` (multipliers applied at sim read points). New `ui/PowerUpsDrawer.jsx` with 4 categories (Economy, Base, Special, Turret), 3 levels each. Cost ramps; locked rows visible but disabled. |
| Evolution flow lacks a "next era preview" | `EraBadge.jsx` shows only current-era name + cost | New `EvolutionPanel.jsx` triggered on Evolve hover/long-press: silhouettes of the 3 next-era units + new turret + new special with one-line copy each. |
| Tooltips: short title-attr only | All buttons | Long-press popovers (already added in Phase 6 for unit cards) extended to turret slots, special, evolve. |

## D. Game feel problem

| Finding | Evidence | Remediation |
|---|---|---|
| Audio is single procedural mixer with one volume | `src/sound.js` global mute only | Master / Music / SFX volume sliders in settings, persisted, applied at fire time. |
| Spawn sounds are throttle-shared | `engine/audio.js` `THROTTLE_MS = 160` global per cue id | Reduced for unit-spawn confirm to 90ms so a fast spawn triple still reads as three confirms. |
| Insufficient gold has only a chirp | already there | Combine with red-flash on offending card (already shipped phase 5) — keep. |
| Evolve transition: flash + shake + stinger | already there | Add a 600 ms era-name banner overlay ("ERA 3 — SUN FOUNDRY") so the moment is celebrated. |
| Victory / defeat: panel only | `ResultPanel.jsx` | Pre-panel: 1-second slow-mo + flash, then panel mounts. |

## E. Information hierarchy problem

| Finding | Evidence | Remediation |
|---|---|---|
| Top HUD reads as 5 stats in a row | `HUD.jsx` | Restructure into 3 zones: **Player** (gold + your HP + your name) / **Center** (era + XP arc + Evolve) / **Enemy** (their HP + era). Time + speed + pause + settings move to a unified `TopBar`. |
| No "you are losing" cue | base HP color shifts only | Top bar gains a red gradient pulse when player HP < 25%. |
| Difficulty chip is centered top | `DifficultyChip.jsx` at top:12 left:50% | Move chip into the Center zone of the new top bar (next to era pill). |
| Tutorial chip overlaps left rail | `Tutorial.jsx` at top:70 left:50% | Repositioned below era pill, no longer occluding turrets. |
| Daily / Endless pills compete for the same space | both use top:56 left:50% | They never co-exist (different modes), but stacking rules added. |

## F. Misc bugs caught in audit

1. `TurretRack` uses `t.eraIndex < eraIndex` to label slot as "old", but slot-build in old era doesn't replace correctly when era goes backward (impossible, but the check should be `!isCurrentEra`).
2. `walkPhaseMs` is incremented inside `unit.js` `stepSide` only when walking. If the unit kites (added phase 6) the leg phase still advances. ✓ verified — kiting calls `u.walkPhaseMs += dt * 1000`.
3. `effects.rings` array can grow unbounded inside `pushRing` if the cap of 4 isn't enforced *between renders*. Verified — capped via `splice` on push. ✓
4. `lowFx` toggle is set on the match per frame in `onFrame`. If the user opens settings during a match and toggles off Low FX explicitly, the auto-detector might re-enable it within 250ms. **Fix in 7.5**: respect the explicit override fully (already does — `sett.lowFxOverride === false` short-circuits the auto-detect).
5. `EraBadge` evolve glow uses `box-shadow` animation — costly on low-end. **Fix**: gate behind `prefers-reduced-motion`.

## G. Quantified findings

- **Stage usage**: units occupy ~5% of stage area on a 1280×800 viewport. Target: ~25%.
- **Layered backgrounds**: 1.5 → 5.
- **Discrete menus**: 4 → 9 (added build modal, manage popover, power-ups, evolution preview, special tray).
- **Audio buses**: 1 → 3.
- **Test coverage**: 79 tests pass; phase 7 adds tests for the new sim modules (powerups, build flow).
