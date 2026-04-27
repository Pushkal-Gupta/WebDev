# Era Siege — Content Schema

The single source of truth for every gameplay-tunable value lives under
`src/games/era-siege/content/`. The sim reads from these modules; nothing
is hard-coded inside engine or sim files.

This document describes the **shape**, not the values. Values are in
`ERA_SIEGE_BALANCE_FRAMEWORK.md`.

## Era

```js
/**
 * @typedef {Object} Era
 * @property {string}  id            Unique slug, e.g. 'ember-tribe'
 * @property {number}  index         0..4
 * @property {string}  name          Display label
 * @property {string}  blurb         One-liner shown in the era-up banner
 * @property {number}  xpToEvolve    XP needed to unlock evolve into this era
 * @property {number}  evolveCost    Gold spent at the moment of evolving
 * @property {number}  goldPerSec    Passive gold trickle while in this era
 * @property {string[]} unitIds      Three unit ids, in dock order
 * @property {string}  turretId      Era's turret class id (resolved per slot)
 * @property {string}  specialId     Era's special id
 * @property {EraPalette} palette    Renderer + HUD swatches
 * @property {EraAudio}  audio       Sound stinger ids per cue
 * @property {string}  background   Background atlas key (or generative seed id)
 */
```

```js
/**
 * @typedef {Object} EraPalette
 * @property {[string, string]} sky       Top + bottom gradient stops
 * @property {string}  mountain
 * @property {string}  ground
 * @property {string}  groundDetail
 * @property {string}  banner            Player banner stripe
 * @property {string}  bannerEnemy       Enemy banner stripe
 * @property {string}  flash             Era-up overlay color
 * @property {string}  hudAccent         CSS color the HUD accent variable maps to
 */
```

```js
/**
 * @typedef {Object} EraAudio
 * @property {string} evolveStinger   sfx key from src/sound.js
 * @property {string} ambientHint     'low' | 'mid' | 'high' (used for synth pitch shift)
 */
```

## Unit

```js
/**
 * @typedef {Object} UnitDef
 * @property {string} id              Unique slug, e.g. 'ember-runner'
 * @property {string} eraId
 * @property {string} name            Display label
 * @property {'frontline'|'ranged'|'heavy'} role
 * @property {number} cost            Gold spent on spawn
 * @property {number} spawnCooldownMs Per-unit-id cooldown after spawn
 * @property {number} hp
 * @property {number} damage
 * @property {number} range           Pixels at sim resolution
 * @property {number} moveSpeed       Pixels per second
 * @property {number} attackWindupMs  Time before damage applies
 * @property {number} attackRecoverMs Time after damage before next attack starts
 * @property {string} projectileId    Optional — empty string means melee
 * @property {'nearest'|'lowestHp'|'highestThreat'} targetPolicy
 * @property {number} bountyGold
 * @property {number} bountyXp
 * @property {UnitVisual} visual
 * @property {UnitAudio}  audio
 */
```

```js
/**
 * @typedef {Object} UnitVisual
 * @property {number} silhouetteW   Body width in px
 * @property {number} silhouetteH   Body height in px
 * @property {string} colorBody     Per-unit body color
 * @property {string} colorTrim     Trim/banner accent
 * @property {string} weaponShape   'spear'|'sword'|'bow'|'cannon'|'rifle'|'beam'|'orb'
 * @property {number} headRadius
 */
```

```js
/**
 * @typedef {Object} UnitAudio
 * @property {string} spawnCue      sfx key
 * @property {string} attackCue
 * @property {string} deathCue
 */
```

Each era ships exactly three units with `role` covering
`frontline | ranged | heavy` to keep the dock layout stable.

## Turret

```js
/**
 * @typedef {Object} TurretDef
 * @property {string} id
 * @property {string} eraId
 * @property {string} name
 * @property {number} buildCost
 * @property {number} sellRefund      Always 0.5 × the most recent buildCost
 * @property {number} damage
 * @property {number} range
 * @property {number} cooldownMs
 * @property {string} projectileId
 * @property {'nearest'|'lowestHp'|'highestThreat'} targetPolicy
 * @property {TurretVisual} visual
 */
```

```js
/**
 * @typedef {Object} TurretVisual
 * @property {string} baseColor
 * @property {string} barrelColor
 * @property {'crossbow'|'bell'|'cannon'|'tesla'|'lance'} kind
 */
```

There are 3 turret slots per side. Each slot owns one turret at a time.
Building in a slot during a later era replaces the previous turret with
the current era's variant. The slot itself is permanent for the match.

## Special

```js
/**
 * @typedef {Object} SpecialDef
 * @property {string} id
 * @property {string} eraId
 * @property {string} name
 * @property {string} description     One sentence shown on hover/hold
 * @property {number} cooldownMs      Time before next cast (per-side)
 * @property {number} telegraphMs     Time between cast and impact
 * @property {'lane'|'point'|'aura'} mode
 * @property {number} damage          Per-target damage at impact
 * @property {number} radius          Px — for 'point' and 'aura'
 * @property {SpecialVisual} visual
 * @property {SpecialAudio}  audio
 */
```

```js
/**
 * @typedef {Object} SpecialVisual
 * @property {string} primary
 * @property {string} secondary
 * @property {'meteor'|'volley'|'cannon'|'storm'|'singularity'} kind
 */
```

```js
/**
 * @typedef {Object} SpecialAudio
 * @property {string} chargeCue
 * @property {string} impactCue
 */
```

## Difficulty

```js
/**
 * @typedef {Object} DifficultyDef
 * @property {'skirmish'|'standard'|'conquest'} id
 * @property {string} label
 * @property {string} blurb
 * @property {number} aiSpawnRateMul       Multiplies enemy spawn frequency
 * @property {number} aiTechRateMul        Multiplies enemy XP gain
 * @property {number} aiTurretChance       0..1 chance per "decision tick" to build/upgrade
 * @property {number} aiSpecialAggression  0..1 — how aggressively AI uses specials
 * @property {number} enemyDamageMul       Global enemy unit damage multiplier
 * @property {number} startingGold         Player starting gold
 */
```

## Balance globals

```js
/**
 * @typedef {Object} BalanceConstants
 * @property {number} BASE_HP                Both bases start with this HP
 * @property {number} BASE_HIT_GOLD          Gold awarded for a base hit
 * @property {number} XP_KILL_RATIO          Multiplier of unit cost into XP
 * @property {number} GOLD_TRICKLE_BASE      Era 1 baseline (matches Era 1.goldPerSec)
 * @property {number} EVOLVE_HEAL_PCT        % HP refill on every owned unit at evolve
 * @property {number} TURRET_SLOT_COUNT
 * @property {number} MAX_UNITS_PER_SIDE     Population cap to keep frame budget sane
 * @property {number} LANE_LEFT_OFFSET
 * @property {number} LANE_RIGHT_OFFSET
 * @property {number} GROUND_BOTTOM_PAD
 * @property {number} UNIT_REPULSE_PX
 * @property {number} SCORE_MAX              Score cap (100, matches supabase rule)
 */
```

## Validation
A small content validator runs at boot in dev (`import.meta.env.DEV`) and
asserts:
- Every era has exactly 3 unit ids and they all resolve.
- Every era has a turretId that resolves.
- Every era has a specialId that resolves.
- All bounty values are non-negative.
- Damage and HP are positive.
- `xpToEvolve` is monotonically non-decreasing across eras.

If a check fails, the boot logs to console and falls back to era-1-only
content. Production builds skip the assertions but keep the fallback.
