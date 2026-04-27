# Era Siege — Third-Party Asset Credits

Per `LEGAL_AND_ORIGINALITY_GUARDRAILS.md` (phase-7 posture): non-iconic
third-party assets are accepted when their license permits commercial /
static-site use. CC0 sources need no attribution; CC-BY ones get rolled
into this file plus the in-game credits screen when one exists.

## CC0 (no attribution required, included for provenance)

### Pixel Explosion — 12 frames
- Path: `public/games/era-siege/vfx/explosion-12.png`
- Source asset id: `explosion_sheet.png`
- Source URL: https://opengameart.org/content/pixel-explosion-12-frames
- License: CC0 1.0 (Public Domain)
- Used by: heavy unit deaths, point-mode special impacts

### Muzzle Flash particle sheet (4 frames)
- Path: `public/games/era-siege/vfx/muzzle-flash.png`
- Source asset id: `muzzle_flash_oga.png`
- Source URL: https://opengameart.org/content/muzzle-flash-particle-sheet
- License: CC0 1.0 (Public Domain)
- Notes: original sheet was white-on-black with no alpha. Processed in
  `scripts/era-siege-process-vfx.mjs` — black mapped to alpha and the
  remaining luminance tinted to ember-yellow so it reads on the dark
  battlefield without composite tricks at draw time.
- Used by: ranged unit firing animation (sub-80ms recover window)

### Spark sprite strip (9 frames)
- Path: `public/games/era-siege/vfx/hit-spark.png`
- Source asset id: `spark_oga.png`
- Source URL: https://opengameart.org/content/spark-effect
- License: CC0 1.0 (Public Domain)
- Used by: registered for hit-impact use; renderer wiring in a follow-up

## CC-BY (attribution required)

_None yet._ Add an entry here when one lands. Format:

```
### <Asset name>
- Path: public/games/era-siege/...
- Source URL: ...
- License: CC-BY 4.0 — attribution: "by <Author Name>, link"
- Used by: ...
```

## User-generated (Gemini / Nano-Banana, treated as original work)

The user generated these via Google AI Studio's image generation. Per
the AI Studio terms, output is owned by the user and treated as
original art for the purposes of this game.

- 5× sky paintings (`bg/era1..5/sky.png`)
- 5× cloud sheets (`bg/era1..5/clouds.png`) — 3-row vertical sheets, middle frame used
- 4× power-up tree icons (`ui/upgrade-economy.png`, `…-base`, `…-special`, `…-turret`)
- 5× special-ability icons (`ui/special-era1..5.png`) — split from a quincunx sheet
- 1× badge-toast (`ui/badge-toast.png`)
- 15× unit hero poses (`unit/era<N>/{frontline,ranged,heavy}.png`) — split from a 5×3 master grid
- 15× turret pose frames (`turret/era<N>{,.fire,.recoil}.png`) — split from a 3-frame × 5-era sheet
- 6× projectile sprites (`projectile/<id>.png`) — split from `projectile_spirits.png` reference sheet
- 10× base silhouettes (`base/era<N>/{player,enemy}.png`) — split from `player_enemy_base.png` reference sheet
- 10× mountain silhouettes (`bg/era<N>/mountains-{far,mid}.png`) — split from `far-mountains-mid-hills.png`
- 5× foreground bands (`bg/era<N>/foreground.png`) — split from `foreground.png` reference sheet

## Procedural / in-engine

Everything not listed above renders procedurally from primitives in
`engine/renderer.js` and `engine/assets.js` placeholders. No third-party
provenance applies.
