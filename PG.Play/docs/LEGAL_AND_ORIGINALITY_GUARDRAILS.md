# Legal & Originality Guardrails — Era Siege

The brief explicitly forbids cloning copyrighted assets, code, names,
balance values, or proprietary content from any existing game in the
genre. This document is the contract Era Siege ships under.

## What we may borrow (genre-level only)
- A side-view, single-lane base-defense loop.
- A two-base layout (player vs. enemy).
- Spawnable units, defensive turrets, gold-and-XP economy.
- Era/age-gated unit unlocks.
- Cooldown-based special abilities.
- Win-by-base-destruction / lose-by-base-destruction conditions.

## What we explicitly do not borrow
- Sprites, textures, audio, music, sound effects, fonts.
- Code (no copy-paste; no decompiled bundles; no mirrored projects).
- Names: not "Age of War," not "Stone Age," not "Modern Era," not
  "Future Age," not any unit name from any existing game in the genre.
- Trademarked brand naming. Era Siege is the originally-coined working
  title.
- Specific balance numbers (HP, damage, costs) from any existing game.
  Our values are tuned in `ERA_SIEGE_BALANCE_FRAMEWORK.md` and validated
  by our own simulator.
- UI layouts that recreate any existing HUD shape.
- Iconography that reproduces any existing icon set without license.

## Original world-building
Era Siege ships five originally-named eras:
1. **Ember Tribe** — pre-iron, fire and bone.
2. **Iron Dominion** — plate, oath, banner.
3. **Sun Foundry** — steam, brass, alchemical heat.
4. **Storm Republic** — dieselpunk, rail, voltage.
5. **Void Ascendancy** — post-physical, soft horror.

Each era ships originally-named units, an originally-named turret
class, and an originally-named special. Names were chosen to evoke a
period flavour without referencing any existing in-genre product.

## Asset sourcing rule
- v1: zero third-party assets. All visuals are generated from
  primitives in `era-siege/engine/renderer.js`. All audio comes from
  PG.Play's existing procedural mixer (`src/sound.js`).
- v2 (future): a third-party swap is gated on:
  1. CC0 or commercial license confirmed.
  2. License file committed at `licenses/<asset-id>.md`.
  3. Attribution shown in the credits screen if the license requires it.
  4. License manifest reviewed before the next deploy.

The candidate sourcing list is in `docs/THIRD_PARTY_ASSETS.md`. Inclusion
in that list is **not** licensing approval — every entry must be
verified at the moment of import.

## Code origin rule
- Era Siege is written in this repo, by this team. No code is copied
  from any other game project, decompiled bundle, or proprietary source.
- Engine techniques (fixed-step accumulator, object pooling, AABB
  collisions, parallax) are universally-known patterns; the **source
  code** for those patterns is original to this repo. The same is true
  of the seedable RNG (Mulberry32, public domain), pooled particle
  buffers, and event bus.
- Library dependencies follow the existing PG.Play package set.
  No new top-level dependency is added for Era Siege.

## Player-facing claims
The README is updated to describe Era Siege as a *clone-in-spirit-not-
in-code* original — the same phrasing PG.Play already uses for
Grudgewood, Goalbound, Coil and SLIPSHOT.

## Trademark hygiene
- The product is called **Era Siege** in lobby, intro, and HUD.
- The slug remains `aow` only because the existing PG.Play registry,
  supabase score rule, and leaderboard already key on it. The slug is
  a backend identifier, not a player-facing string. Renaming the slug
  would force a leaderboard reset; the user-visible name change is
  enough to cover the originality requirement.
- All strings the player sees ("Era Siege", "Ember Tribe", "Iron
  Dominion", "Oath Spear", etc.) are originally coined.

## Audit trail
Any future asset/code import must record the following at the time of
import:
- Source URL.
- License type & link to the license text.
- Author / copyright holder.
- Date verified.
- Person who verified.
- Path the asset was placed at in the repo.

A `licenses/MANIFEST.md` will be added the moment any first asset is
imported. v1 ships without it because no third-party content is
included.

## Removal policy
If a third-party claim is ever made against any asset:
1. The asset is removed from the next deploy.
2. Its replacement (in-house or differently licensed) is sourced to the
   same spec.
3. The licenses manifest is updated.
4. A short note is added to the README "References" section.

## Compliance with PG.Play's existing posture
PG.Play's README states: "Bricklands has zero Nintendo art" and "The
site does not iframe-embed any external games." Era Siege ships under
the same posture: zero copyrighted art, zero embedded external games,
zero copied code.
