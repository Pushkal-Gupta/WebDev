# Third-Party Assets — search references

**Era Siege ships zero third-party assets in v1.** Every visual is
generated from primitives in code (see `ERA_SIEGE_ASSET_PLAN.md`).
Every audio cue routes through the existing `src/sound.js` procedural
mixer.

This document is the **search reference list** for a future v2 swap to
licensed art/audio. Each entry is a manual sourcing template — license
verification is mandatory before any asset enters the repo.

License rule:
- Default to **CC0** (public domain) where possible.
- Accept **commercial use** licenses only if the license file is also
  committed to the repo at `licenses/<asset-id>.md`.
- Reject any license that requires runtime attribution unless we add a
  visible credits screen first.

---

## Unit sprites

```
Asset Category: Unit sprite sheet
Needed For: Era 1 frontline (Ember Runner)
Search Query: "site:itch.io tribal warrior side-view sprite commercial license"
Search Query: "site:opengameart.org tribal warrior CC0"
Search Query: "site:craftpix.net side scroller tribal sprites"
Must Have: 6-frame walk + 4-frame attack + death, side-view, readable silhouette
License: CC0 or commercial-license
Format: PNG sprite sheet
Path: public/games/era-siege/sprites/units/era1-frontline.png
Notes: Recolour to ember palette. Adapt silhouette to be readable at 40 px.
```

```
Asset Category: Unit sprite sheet
Needed For: Era 1 ranged (Bone Slinger)
Search Query: "site:itch.io tribal archer sprite commercial"
Search Query: "site:opengameart.org bow archer CC0 side-view"
Must Have: idle + draw + release + walk + death frames
License: CC0 or commercial
Format: PNG sprite sheet
Path: public/games/era-siege/sprites/units/era1-ranged.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 1 heavy (Pyre Bearer)
Search Query: "site:itch.io fire warrior heavy sprite commercial"
Search Query: "site:opengameart.org heavy warrior CC0"
Must Have: torch/brand weapon, slow walk
License: CC0 or commercial
Format: PNG sprite sheet
Path: public/games/era-siege/sprites/units/era1-heavy.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 2 frontline (Oath Spear)
Search Query: "site:itch.io medieval spearman sprite commercial"
Search Query: "site:opengameart.org spear soldier CC0"
Must Have: spear thrust attack, plate armour silhouette
License: CC0 or commercial
Format: PNG sprite sheet
Path: public/games/era-siege/sprites/units/era2-frontline.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 2 ranged (Crossbow Sworn)
Search Query: "site:itch.io medieval crossbowman sprite commercial"
Search Query: "site:opengameart.org crossbow soldier CC0"
Must Have: load + aim + fire + reload frames
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era2-ranged.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 2 heavy (Iron Bastion)
Search Query: "site:itch.io medieval knight heavy armor sprite"
Must Have: hammer/maul weapon, slow heavy gait
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era2-heavy.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 3 frontline (Brass Skirmisher)
Search Query: "site:itch.io steampunk soldier sprite commercial"
Search Query: "site:opengameart.org steampunk soldier CC0"
Must Have: brass/copper plating, melee with bayonet or short sword
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era3-frontline.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 3 ranged (Steam Caster)
Search Query: "site:itch.io steampunk gunner sprite"
Must Have: steam-rifle weapon, recoil frames
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era3-ranged.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 3 heavy (Forge Hauler)
Search Query: "site:itch.io steampunk mech walker sprite"
Must Have: heavy mech silhouette, slow walk, large impact
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era3-heavy.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 4 frontline (Rail Trooper)
Search Query: "site:itch.io dieselpunk soldier sprite"
Search Query: "site:opengameart.org dieselpunk soldier CC0"
Must Have: rifle + bayonet melee + run
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era4-frontline.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 4 ranged (Voltaic Sharpshooter)
Search Query: "site:itch.io tesla rifle sprite"
Must Have: arc-rifle weapon with electrical FX
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era4-ranged.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 4 heavy (Howitzer Walker)
Search Query: "site:itch.io diesel mech walker sprite"
Must Have: enormous silhouette, slow walk, cannon mount
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era4-heavy.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 5 frontline (Cinder Wraith)
Search Query: "site:itch.io void mage sprite cosmic"
Search Query: "site:opengameart.org void warrior CC0"
Must Have: ethereal silhouette, partial transparency baked in
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era5-frontline.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 5 ranged (Echo Lance)
Search Query: "site:itch.io void caster sprite"
Must Have: glowing lance, beam-charge frames
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era5-ranged.png
```

```
Asset Category: Unit sprite sheet
Needed For: Era 5 heavy (Singular Colossus)
Search Query: "site:itch.io void colossus sprite"
Must Have: gigantic silhouette, glowing core, slow walk
License: CC0 or commercial
Path: public/games/era-siege/sprites/units/era5-heavy.png
```

---

## Turret sprites

```
Asset Category: Turret sprite (era 1: Bone Crossbow)
Search Query: "site:itch.io primitive ballista sprite"
Search Query: "site:opengameart.org wooden crossbow turret CC0"
Must Have: pivot mast, idle + fire frames
License: CC0 or commercial
Path: public/games/era-siege/sprites/turrets/era1.png
```

```
Asset Category: Turret sprite (era 2: Iron Ballista)
Search Query: "site:itch.io medieval ballista sprite commercial"
Path: public/games/era-siege/sprites/turrets/era2.png
```

```
Asset Category: Turret sprite (era 3: Brass Mortar)
Search Query: "site:itch.io steampunk mortar sprite"
Path: public/games/era-siege/sprites/turrets/era3.png
```

```
Asset Category: Turret sprite (era 4: Volt Cannon)
Search Query: "site:itch.io tesla turret sprite commercial"
Path: public/games/era-siege/sprites/turrets/era4.png
```

```
Asset Category: Turret sprite (era 5: Void Lance)
Search Query: "site:itch.io void cannon sprite cosmic"
Path: public/games/era-siege/sprites/turrets/era5.png
```

---

## Base sprites

```
Asset Category: Base sprite per era (5 total)
Search Query: "site:itch.io medieval keep wall side-view"
Search Query: "site:opengameart.org fortress wall CC0"
Must Have: ~80×96 silhouette, recolourable, no logos
License: CC0 or commercial
Path: public/games/era-siege/sprites/bases/era1.png … era5.png
Notes: One sprite per era to mark progression.
```

---

## Background layers

```
Asset Category: Parallax background (era 1 — ember dusk)
Search Query: "site:itch.io parallax desert dusk commercial"
Search Query: "site:opengameart.org parallax sunset CC0"
Search Query: "site:craftpix.net parallax desert"
Must Have: 3-layer (sky/mountain/midground) PNG layers
License: CC0 or commercial
Format: PNG layers
Path: public/games/era-siege/backgrounds/era1/{sky,mountain,mid}.png
```

```
Asset Category: Parallax background (era 2 — iron grey)
Search Query: "site:itch.io parallax medieval battlefield"
Path: public/games/era-siege/backgrounds/era2/
```

```
Asset Category: Parallax background (era 3 — brass smoke)
Search Query: "site:itch.io parallax steampunk industrial"
Path: public/games/era-siege/backgrounds/era3/
```

```
Asset Category: Parallax background (era 4 — storm)
Search Query: "site:itch.io parallax dieselpunk storm"
Path: public/games/era-siege/backgrounds/era4/
```

```
Asset Category: Parallax background (era 5 — void)
Search Query: "site:itch.io parallax cosmic void"
Path: public/games/era-siege/backgrounds/era5/
```

---

## UI

```
Asset Category: UI pack (HUD frames + buttons + chips)
Search Query: "site:itch.io strategy game ui pack commercial"
Search Query: "site:opengameart.org game ui CC0"
Search Query: "site:kenney.nl ui pack"
Must Have: 9-slice frames, button states, chips, icons
License: CC0 or commercial
Format: SVG preferred / PNG with @2x
Path: public/games/era-siege/ui/
Notes: We use existing PG.Play CSS tokens for v1; this is for v2 only.
```

```
Asset Category: HUD icon set (sword, bow, hammer, gear, bolt, beacon)
Search Query: "site:lucide.dev icons" — already used elsewhere on the site
Search Query: "site:thenounproject.com strategy game icons commercial"
Must Have: minimal line icons, 24px, monochrome
License: ISC (Lucide) / commercial
Format: SVG
Path: public/games/era-siege/ui/icons/
Notes: Lucide is already in use elsewhere — prefer it.
```

---

## Projectile sprites

```
Asset Category: Projectile glyphs (5 — bolt, ballista bolt, mortar shell, arc, void orb)
Search Query: "site:itch.io projectile sprite pack commercial"
Search Query: "site:opengameart.org projectile sprites CC0"
Must Have: 16×16 to 32×32, additive-friendly trails
License: CC0 or commercial
Path: public/games/era-siege/sprites/projectiles/
```

---

## Effects

```
Asset Category: Hit / spark / smoke FX
Search Query: "site:itch.io 2d hit effect sprite commercial"
Search Query: "site:opengameart.org explosion sprite CC0"
Must Have: 6–12-frame additive sheets
License: CC0 or commercial
Path: public/games/era-siege/sprites/effects/
```

---

## Audio — SFX

```
Asset Category: Sword / spear hit
Search Query: "site:freesound.org sword impact CC0"
Search Query: "site:mixkit.co weapon impact"
Must Have: dry transient, 200–400 ms
License: CC0 or commercial
Format: OGG (preferred)
Path: public/games/era-siege/audio/sfx/melee-hit.ogg
```

```
Asset Category: Crossbow/Ballista release
Search Query: "site:freesound.org crossbow release CC0"
Search Query: "site:mixkit.co bow shot"
Must Have: short twang
License: CC0 or commercial
Path: public/games/era-siege/audio/sfx/ranged-fire.ogg
```

```
Asset Category: Mortar / cannon
Search Query: "site:freesound.org cannon shot CC0"
Path: public/games/era-siege/audio/sfx/cannon-fire.ogg
```

```
Asset Category: Tesla / arc
Search Query: "site:freesound.org tesla arc electric CC0"
Search Query: "site:freesound.org electric zap"
Path: public/games/era-siege/audio/sfx/arc.ogg
```

```
Asset Category: Void / impact glassy
Search Query: "site:freesound.org reverse cymbal CC0"
Search Query: "site:freesound.org void impact"
Path: public/games/era-siege/audio/sfx/void-impact.ogg
```

```
Asset Category: Era-up stinger
Search Query: "site:freesound.org orchestra stinger CC0"
Search Query: "site:pixabay.com cinematic stinger free"
Must Have: 600–1200 ms with dramatic decay
License: CC0 or commercial
Path: public/games/era-siege/audio/sfx/era-up.ogg
```

```
Asset Category: Victory / defeat stings
Search Query: "site:freesound.org victory chord CC0"
Search Query: "site:freesound.org defeat sting CC0"
Path: public/games/era-siege/audio/sfx/win.ogg, lose.ogg
```

```
Asset Category: UI click + hover
Search Query: "site:freesound.org ui click CC0"
Search Query: "site:kenney.nl ui audio"
Path: public/games/era-siege/audio/sfx/ui-click.ogg, ui-hover.ogg
```

---

## Audio — Music

```
Asset Category: Background loop (early eras)
Search Query: "site:freesound.org ambient drone CC0"
Search Query: "site:pixabay.com music dark ambient royalty free"
Must Have: seamless 60–90 s loop, low-energy
License: CC0 / royalty-free commercial
Path: public/games/era-siege/audio/music/early-loop.ogg
```

```
Asset Category: Background loop (late eras)
Search Query: "site:pixabay.com music industrial loop"
Search Query: "site:freesound.org tension loop"
Must Have: high-energy, seamless
License: CC0 / royalty-free commercial
Path: public/games/era-siege/audio/music/late-loop.ogg
```

---

## Fonts

```
Asset Category: Display font (HUD numbers + era badges)
Search Query: "site:fonts.google.com display geometric"
Search Query: "site:api.fontshare.com display"
Must Have: heavy display weight, condensed legible at 40px
License: SIL OFL or similar permissive
Format: WOFF2
Path: served via existing Google Fonts <link> in index.html
Notes: PG.Play already loads Bricolage Grotesque + Inter + JetBrains Mono.
       Era Siege uses these — no new font request.
```

---

## Disclaimer
Listing a search query here is **not** an endorsement of any specific
asset or creator. Every candidate must be license-checked, attribution-
checked (where required), and resolution-checked before it is committed
to the repo. Add the license file to `licenses/<asset-id>.md` at the
moment of import.
