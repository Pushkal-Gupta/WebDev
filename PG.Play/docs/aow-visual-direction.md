# Era Siege — Visual Direction

## Mood
Premium, restrained, tactical. Reads at a glance. The HUD is a frame
around the battle, not a dashboard the battle happens inside. The
battlefield owns the viewport and feels like a place: layered sky,
defined horizon, ground texture you can almost feel.

## Hierarchy of attention
1. **HP bars** (player + enemy bases) — biggest, top corners.
2. **XP arc + Evolve CTA** — top-center; glowing when ready.
3. **Active special** — right rail; pulses when ready.
4. **Unit cards** — bottom dock; silhouette + cost + cooldown.
5. **Turret slots** — anchored to the bases on the battlefield, with thin status icons in the right rail.
6. **Time / speed / pause / settings / sound** — small icons, second tier.

## Composition
- Stage height target: ground at **~60% of stage height** (was ~85%).
- Unit silhouette scale: **+18%** (visual only — sim ranges unchanged).
- Bases: **+25% height**, era-specific archway and banner.
- Foreground band: **last 10% of stage height** has rocks, grass, debris.
- Sky: **top 60%** carries cloud layer, far-mountain ridge, mid-hills ridge.

## Layered draw order
1. Sky gradient (era-tinted, vertical).
2. Cloud band (drift speed: 6 px/s; era-tinted; alpha 30–45%).
3. Far mountains (jagged silhouette, alpha 60–80%).
4. Mid hills (silhouette, era-specific shape — see below).
5. Ground band (gradient).
6. Foreground rocks / grass / debris.
7. Bases (left + right).
8. Turrets (3 per side, mounted on bases).
9. Special telegraphs.
10. Units (sorted by foot-y).
11. Projectiles.
12. Particles (additive).
13. Special-impact rings.
14. Damage numbers.
15. Era ribbon (top center).
16. Era flash overlay (post-shake).
17. Era-up banner overlay (text, era number + name).

## Era-specific silhouette language

| Era | Mountain / hills shape | Mid motif | Foreground motif |
|---|---|---|---|
| Ember Tribe   | jagged peaks, low ridges | floating embers   | scattered bones, charred logs |
| Iron Dominion | blocky escarpments, watchtowers | lantern dots | banners on poles, scattered stones |
| Sun Foundry   | smokestack chimneys, brass domes | smoke plumes | barrels, brass coils |
| Storm Republic| lightning rods on far cliffs | arc flickers | telephone poles, cables, scrap |
| Void Ascendancy | floating monoliths | void rifts (dim ellipses) | crystalline shards, glow runes |

## Color philosophy
Dark slate base, single accent per era, never two competing colors in the same panel.

| Era | Sky top | Sky bottom | Mountain | Ground | Banner | Accent (HUD) |
|---|---|---|---|---|---|---|
| Ember Tribe   | #ff8a3a | #7d2a10 | #2c150a | #3a2a10 | #ffd05a | #ffb070 |
| Iron Dominion | #7d8794 | #262e38 | #1c2128 | #2c2a26 | #d8d4cc | #d8d4cc |
| Sun Foundry   | #dba85a | #62311a | #3a1f12 | #3a261a | #ffcb6b | #ffcb6b |
| Storm Republic| #3c5777 | #0e1622 | #0c121b | #1a2030 | #7be3ff | #7be3ff |
| Void Ascendancy | #1a0a3a | #080014 | #0a0418 | #100828 | #e9c8ff | #c89bff |

## Typography
- Display (era ribbon, panel titles): **Bricolage Grotesque** (already loaded by PG.Play `index.html`).
- Body (descriptions): **Inter** (loaded).
- Numerics (gold, HP, time, costs, cooldowns): **JetBrains Mono** with `font-variant-numeric: tabular-nums`.

## Interaction language
- **Affordable**: full opacity, accent border on hover.
- **Unaffordable**: reduced opacity 0.55, grey border, cost in red.
- **On cooldown**: cooldown sweep across the card (already shipped).
- **Locked**: greyscale + lock glyph (locked era cards never appear today; reserved for phase 8 expansion).
- **Active / pressed**: 1 px shift down + accent flash 100 ms.
- **Ready (special, evolve)**: 1.6 s ease-in-out box-shadow pulse; respects `prefers-reduced-motion`.

## What we deliberately don't do
- No purple/pink gacha gradients.
- No glassmorphism stacked beyond two surfaces.
- No bloom/glow on every interactive — only on "ready" CTAs.
- No emoji anywhere — Lucide icons + custom SVG only.
- No rainbow rarity pips (no rarity in this game).
- No animated UI on every mount — entrance animations only on overlays/modals.

## Motion
- Panel mount: 140 ms ease-out, 4 px slide-up + opacity 0 → 1.
- Banner: 600 ms (in + hold + out).
- Era flash: 600 ms ease-out (already shipped).
- Reduced-motion: skip flash, skip shake, skip ready-pulse.

## Examples in language
- ❌ "+25% damage to your warriors for 4 seconds!" (numbers on every word)
- ✅ "Sun Forge — your line burns hotter for 4s." (one number, mood phrase)
- ❌ "Cooldown: 28000ms"
- ✅ "Cooldown 28s"
- ❌ "Insufficient gold to construct turret of type bone-crossbow"
- ✅ "Need 90g."
