# Era Siege — Game Spec

A premium, single-lane base-defense evolution game for PG.Play. Replaces the
existing `aow` ("Era Lane") MVP with a five-era progression, three units per
era, era-specific turrets, era-specific specials, an AI director, and a
modern HUD.

## Pitch (one sentence)
Defend your base across five eras of escalating warfare, evolving your roster
and turret line each time the gold runs ahead of the bloodshed.

## Fantasy
You are the steward of a single banner across the long arc of history. The
front line is the same patch of ground in every age. Only the weapons change.

## Session length
- Target: **6–10 minutes** for a full clean run.
- A defeat in era 1–2 wraps in **60–90 seconds** so a loss never feels
  expensive.
- Tutorial first-run adds ~30s of optional pacing.

## Target devices
- Desktop Chrome / Safari / Firefox.
- Mobile Chrome / Safari (touch-native, landscape preferred).
- Tablet (works in either orientation; landscape recommended).

## Control model
- **Mouse / Touch:** tap a unit card to spawn, tap a turret slot to build,
  tap the special button to fire. Hold (touch) or hover (desktop) for
  tooltips.
- **Keyboard (desktop):** `1 2 3` spawn the current-era unit slots, `Q W E`
  build/upgrade the three turret slots, `Space` triggers the special, `R`
  triggers the era-up evolve, `P` toggles pause.
- All actions are also reachable via on-screen buttons — keyboard is a
  power-user accelerator, never a requirement.

## Loop (one cycle, ~10s)
1. Gold ticks in passively.
2. Player spawns a unit — costs gold + per-unit cooldown.
3. Units march, engage enemies in lane.
4. Kills return gold and XP.
5. XP threshold unlocks the **Evolve** button.
6. Player chooses: spend gold now (more units, build a turret, fire special)
   or save and evolve into the next era's roster.
7. Each era's enemies hit harder; turrets and specials hit harder back.

## Combat model
- **Single-lane**, side-view, ground-only.
- Units have HP, damage, range, attack windup, attack recover, move speed,
  bounty (gold + XP), targeting policy.
- All combat is **deterministic given the seed** — no RNG-driven crits;
  variance lives in spawn timings and AI rolls only.
- Friendly stacking is resolved by a soft repulsion field along the lane so
  silhouettes stay readable.

## Economy
- Two currencies: **Gold** (spend on units, turrets, specials) and **XP**
  (spend on era evolution).
- Gold sources: passive trickle (rate scales per era), enemy kill bounty,
  base-damage bonus.
- Gold sinks: unit spawn, turret build/upgrade, special cast.
- XP sources: enemy kills only. Base-hit XP is intentionally absent so
  rushing the enemy base does not also fast-forward your tech.
- XP sink: era evolution (XP threshold + flat gold cost).

## XP & era progression
- XP thresholds per era are calibrated so a player who kills evenly through
  era 1 can evolve at the **70% mark** of era 1's intended duration if they
  refrain from spending XP-irrelevant gold elsewhere.
- Evolving applies an **immediate buff aura** to all owned units (small HP
  refill + new-era trim) so the moment feels rewarding.

## Five original eras
| # | Era | Identity | Palette |
|---|---|---|---|
| 1 | **Ember Tribe** | Pre-iron, fire and bone | warm dusk, ember orange, bone white |
| 2 | **Iron Dominion** | Plate, oath, banner | steel grey, blood crimson, lantern gold |
| 3 | **Sun Foundry** | Steam, brass, alchemical heat | brass, copper, sky-blue smoke |
| 4 | **Storm Republic** | Dieselpunk, rail, voltage | gunmetal, electric teal, white arc |
| 5 | **Void Ascendancy** | Post-physical, soft horror | void purple, bone-white plasma, black star |

Each era ships:
- 3 units (frontline / ranged / heavy)
- 1 era-specific turret class (built into one of three slots; the slot
  itself persists across eras and can be upgraded each era)
- 1 era-specific special (cooldown-gated active ability)

See `ERA_SIEGE_CONTENT_SCHEMA.md` and `ERA_SIEGE_BALANCE_FRAMEWORK.md` for
the full content matrix and balance values.

## Win / lose
- **Win:** Reduce enemy base HP to 0.
- **Lose:** Player base HP reaches 0.
- **Score:** A 0–100 PG.Play-friendly score derived from final era × clear
  speed × HP retained. Submitted to the existing `aow` leaderboard rule.

## Difficulty modes
- **Skirmish (easy):** AI evolves slower, smaller pressure waves.
- **Standard:** default tuning.
- **Conquest (hard):** AI evolves faster, hits earlier, has +10% turret
  damage. Locked behind one Standard win.

Difficulty is selected on the lobby intro screen via the `mode` prop, the
same surface other PG.Play games use.

## Onboarding
- First-run **soft tutorial:** the first three unit spawns trigger inline
  hint chips ("Spawn → march → engage" / "Gold ticks every second" /
  "Watch your XP — Evolve at era 2").
- All hints can be dismissed with one tap and never re-appear.
- The HUD's evolve button glows the moment the threshold is crossed —
  there is no popup.

## Accessibility
- Reduced-motion mode disables the era-up flash and screen shake.
- Full keyboard navigation for the HUD.
- Color-blind-safe HP-bar tone progression (green → amber → red is
  augmented with a thickness change at low HP).
- Tap targets ≥ 44×44 CSS px.
- Screen-reader-friendly labels on every actionable HUD element.
- Optional **low-effects mode** halves particle counts for low-power
  devices (auto-detected from initial FPS, also user-toggleable).

## Replayability
- Difficulty modes (3).
- Era reached + clear time both contribute to leaderboard score, so pushing
  for a faster era-3 clear is a meaningful goal even after the first win.
- Different valid strategies: turret-turtle, era-rush, unit-flood, or a
  balanced approach.

## Anti-frustration design
- **No instant losses:** the enemy AI never fields era N+1 content before
  the player has had a chance to react in era N–1.
- **Predictable specials:** every special telegraphs ~1.2s before impact.
- **Refunds:** selling a turret returns 50% of the most recent build cost.
- **Auto-pause** on tab hidden, so a misclick away never costs a run.
- **Defeat respect:** the result screen shows era reached + a single
  human-language sentence on what to try next.

## Modern improvements over the inspiration
- Era-tied turret upgrades (not throwaway buildings).
- XP earned only from kills (preventing the "rush base = free tech" loop).
- Telegraphed specials (counterplay-friendly).
- Built-in mobile parity.
- Hot-reloadable balance JSON for live-tuning without rebuilds.
- A score model that recognises **clean clears**, not just survival.

## Out of scope (v1)
- Multiplayer.
- Account-level persistence beyond the existing PG.Play best score.
- Cosmetics / unlocks.
- Daily-challenge seeds (designed for, not shipped).
