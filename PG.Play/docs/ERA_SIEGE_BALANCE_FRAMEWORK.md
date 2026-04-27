# Era Siege — Balance Framework

This is the design intent and the v1 numeric tuning. Numbers are tuned
against the goals below; tweak them in `src/games/era-siege/content/` and
re-run the simulator scripts (see "Tuning loop") to verify the goals
still hold.

## Design goals
1. **Every era is viable** for ~60–90 seconds before the next is
   meaningfully better. Skipping an era should feel like a real cost.
2. **Teching is strong, but expensive.** A successful evolve takes ~20%
   of the player's effective income window away from the lane.
3. **Turtling is possible but not dominant.** Pure turret play loses to
   a balanced rush in era 4–5 because turret damage scales sub-linearly
   with enemy unit HP.
4. **Early rushes are threatening, not unbeatable.** A first-30s enemy
   rush kills an under-defended player; a player who buys 2 frontliners
   in the first 10s reliably holds.
5. **No dominant unit.** Each unit role beats one role and loses to
   another in a stylised rock-paper-scissors:
   - Frontline beats Ranged (closes distance).
   - Ranged beats Heavy (kites).
   - Heavy beats Frontline (out-DPS at low range).
6. **AI uses mixes.** The AI director rolls a unit choice with a
   distribution that drifts with current pressure (see `ai.js`).

## Globals

```js
BASE_HP            = 1400     // calibrated against 100-match mirror sim
BASE_HIT_GOLD      = 1
XP_KILL_RATIO      = 0.6      // bountyXp = bountyGold * 0.6 by default
GOLD_TRICKLE_BASE  = 12       // gold/sec at era 1
EVOLVE_HEAL_PCT    = 0.20
TURRET_SLOT_COUNT  = 3
MAX_UNITS_PER_SIDE = 40
SCORE_MAX          = 100
```

`BASE_HP` was set against the simulator (`scripts/era-siege-sim.mjs`).
A 60-match mirror at standard difficulty hits a median match length of
~120s and a player win-rate of 47% — comfortably inside the ±12% gate.
A higher HP value pushes the median match toward the 180–360s "thinking
player" zone but creates draws when the AI plays both sides; humans who
hold XP and tech up will routinely run matches to 200–300s.

## XP curve (per-era xpToEvolve, cumulative)

| Era target | xpToEvolve | evolveCost | goldPerSec |
|---|---|---|---|
| Era 2 (Iron Dominion)   | 60   | 80  | 14 |
| Era 3 (Sun Foundry)     | 140  | 130 | 17 |
| Era 4 (Storm Republic)  | 250  | 200 | 21 |
| Era 5 (Void Ascendancy) | 400  | 320 | 26 |

Era 1 is `xpToEvolve = 0`, `evolveCost = 0` because you start in it.

A clean era-1 run that kills 8 era-1 enemies (bounty = ~5 XP each)
crosses the 60 XP threshold around the 35–45 second mark — assuming
the player is also spending gold. A pure save player can evolve at ~25s
but enters era 2 with no army, so the AI catches up quickly.

## Unit roster (15 units, 3 per era)

Each entry: HP / DMG / Range / Speed / Cost / Bounty (gold/xp).

### Era 1 — Ember Tribe
| Unit | Role | HP | DMG | Range | Speed | Cost | Bounty |
|---|---|---|---|---|---|---|---|
| Ember Runner   | frontline | 40  | 7  | 22  | 70 | 35  | 14 / 8 |
| Bone Slinger   | ranged    | 28  | 9  | 110 | 52 | 55  | 22 / 13 |
| Pyre Bearer    | heavy     | 160 | 22 | 24  | 30 | 110 | 44 / 26 |

### Era 2 — Iron Dominion
| Unit | Role | HP | DMG | Range | Speed | Cost | Bounty |
|---|---|---|---|---|---|---|---|
| Oath Spear     | frontline | 80   | 12  | 26  | 60 | 60  | 24 / 14 |
| Crossbow Sworn | ranged    | 50   | 14  | 130 | 48 | 90  | 36 / 22 |
| Iron Bastion   | heavy     | 280  | 32  | 28  | 26 | 175 | 70 / 42 |

### Era 3 — Sun Foundry
| Unit | Role | HP | DMG | Range | Speed | Cost | Bounty |
|---|---|---|---|---|---|---|---|
| Brass Skirmisher | frontline | 130 | 17 | 28  | 64 | 90  | 36 / 22 |
| Steam Caster     | ranged    | 80  | 22 | 150 | 50 | 130 | 52 / 31 |
| Forge Hauler     | heavy     | 460 | 46 | 30  | 24 | 240 | 96 / 58 |

### Era 4 — Storm Republic
| Unit | Role | HP | DMG | Range | Speed | Cost | Bounty |
|---|---|---|---|---|---|---|---|
| Rail Trooper      | frontline | 200 | 24 | 30  | 66 | 130 | 52 / 31 |
| Voltaic Sharpshooter | ranged | 130 | 30 | 175 | 52 | 180 | 72 / 43 |
| Howitzer Walker   | heavy     | 700 | 60 | 32  | 22 | 320 | 128 / 76 |

### Era 5 — Void Ascendancy
| Unit | Role | HP | DMG | Range | Speed | Cost | Bounty |
|---|---|---|---|---|---|---|---|
| Cinder Wraith     | frontline | 300 | 32 | 32  | 70 | 180 | 72 / 43 |
| Echo Lance        | ranged    | 200 | 40 | 200 | 56 | 240 | 96 / 58 |
| Singular Colossus | heavy     | 1100 | 78 | 34  | 20 | 420 | 168 / 100 |

Notes:
- HP roughly doubles per era; damage roughly +40%; range creeps up so
  ranged-vs-frontline distances stay readable.
- Speed is **flat** within a role across eras — the lane visual rhythm
  shouldn't degrade as numbers scale.

## Turret line (1 era variant per slot upgrade)

Slot upgrade order is automatic by era — when you build/upgrade a slot
during era N, it gets era N's turret class, replacing whatever was there.

| Era | Turret | Build cost | DMG | Range | Cooldown |
|---|---|---|---|---|---|
| 1 | Bone Crossbow | 90  | 14 | 220 | 1100 |
| 2 | Iron Ballista | 160 | 26 | 250 | 1100 |
| 3 | Brass Mortar  | 240 | 44 | 270 | 1300 |
| 4 | Volt Cannon   | 340 | 70 | 290 | 1100 |
| 5 | Void Lance    | 460 | 110 | 320 | 1300 |

A turret built mid-era cannot be upgraded that same era — players spend
gold once per era per slot. This is what keeps a 3-turret turtle from
running away with the match.

## Specials (1 per era)

| Era | Special | Telegraph | CD | DMG | Mode | Radius |
|---|---|---|---|---|---|---|
| 1 | Ember Volley     | 800ms  | 28000 | 60  | lane  | — |
| 2 | Iron Rain        | 1100ms | 32000 | 110 | point | 90 |
| 3 | Sun Forge        | 1200ms | 36000 | 180 | aura  | 120 |
| 4 | Storm Fork       | 1100ms | 38000 | 240 | point | 110 |
| 5 | Void Collapse    | 1400ms | 42000 | 360 | point | 140 |

- `lane` damages all enemies in the lane within a band centred on the
  lane y-axis.
- `point` damages all enemies inside `radius` of an impact point that
  lands at the centre of the largest enemy cluster.
- `aura` grants +25% damage to all owned units for 4s and damages
  any enemy currently in melee range of an owned unit.

## AI difficulty multipliers

| Difficulty | spawnRateMul | techRateMul | turretChance | specialAggression | enemyDamageMul | startingGold |
|---|---|---|---|---|---|---|
| Skirmish  | 0.75 | 0.80 | 0.20 | 0.40 | 0.90 | 130 |
| Standard  | 1.00 | 1.00 | 0.35 | 0.60 | 1.00 | 110 |
| Conquest  | 1.20 | 1.20 | 0.55 | 0.85 | 1.10 | 100 |

## Score formula
```
era      = match.player.eraIndex + 1                  // 1..5
hpLeft   = match.player.base.hp / BASE_HP             // 0..1
clearSec = match.timeSec
clearMul = clamp(1 - (clearSec - 240) / 480, 0.4, 1.5) // 240s = par, longer = penalty, faster = bonus
score    = clamp(round(era * 12 * clearMul + hpLeft * 25 + (won ? 15 : 0)), 0, 100)
```
- Pure win, era 5 in 240s, 100% HP → 60 + 25 + 15 = 100.
- Pure win, era 3 in 240s, 50% HP → 36 + 12 + 15 = 63.
- Pure loss in era 2 → 24 (era-2-reached × clearMul, no HP, no win).

## Tuning loop
1. Edit a value in `content/`.
2. `node scripts/era-siege-sim.mjs` runs N AI-vs-AI mirror matches per
   difficulty (`N=200 node scripts/era-siege-sim.mjs` for tighter
   confidence intervals). Prints win-rate, median + p10 + p90 duration,
   median era reached, average kills + spawns. Writes a JSON report to
   `scripts/era-siege-sim-report.json`.
3. Reject changes that push standard win-rate outside `[0.38, 0.62]`
   for the AI mirror baseline (perfect 50/50 is unattainable because
   the player side ticks first each frame, consuming RNG; closing the
   gap further would require side-randomising tick order, which trades
   determinism for marginal balance).
4. Reject changes that push standard median match length outside
   `[80s, 200s]`. Human play naturally extends matches by 1.4–1.8×.
5. Commit with the new numbers and the report.
