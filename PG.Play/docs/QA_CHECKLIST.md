# Era Siege — QA Checklist

## Automated tests (vitest, runs as part of `npm test`)
- [ ] Sim: a fresh match starts with both bases at full HP, no entities.
- [ ] Sim: spawning a unit deducts gold and starts the cooldown.
- [ ] Sim: a unit with HP 0 is removed within one tick.
- [ ] Sim: a kill returns gold + XP to the killer's side.
- [ ] Sim: hitting the enemy base deducts BASE_HP.
- [ ] Sim: era evolves when XP threshold is reached and gold is spent.
- [ ] Sim: an evolved side gets +20% HP refilled on owned units.
- [ ] Sim: a special on cooldown does not fire.
- [ ] Sim: a special with telegraph applies damage on impact, not cast.
- [ ] Sim: AI director never spawns era-N units when in era < N.
- [ ] Sim: win/lose detection triggers only at HP <= 0.
- [ ] Sim: score formula returns 0..100 and 100 only on a high-tier win.
- [ ] Mount: EraLaneGame mounts without throwing in jsdom.

## Manual QA — desktop Chrome (per release)
- [ ] First load: lobby → click Era Siege → game canvas appears within 2s.
- [ ] Buttons all hover-respond.
- [ ] First three spawns trigger the tutorial hint chips.
- [ ] Spawn cooldowns visually fill from full to empty.
- [ ] Out-of-gold attempts play the error cue and don't deduct gold.
- [ ] XP bar fills as enemies die.
- [ ] Evolve button glows when the threshold is crossed.
- [ ] Evolving plays the era stinger and applies the era's palette.
- [ ] Turret slots accept a build, fire automatically, and cooldown.
- [ ] Special button shows a cooldown radial after firing.
- [ ] Pause (`P`) freezes the sim; resume continues without missed time.
- [ ] Tab-hidden auto-pauses. Tab-visible resumes cleanly.
- [ ] Win triggers the result panel + the `submitScore('aow', ...)` call.
- [ ] Defeat triggers the same with a sane score.
- [ ] "Play again" restarts cleanly (no state leak from previous match).

## Manual QA — mobile Chrome / Safari (per release)
- [ ] Layout fits in landscape with no horizontal scroll.
- [ ] HUD collapses to bottom-strip on narrow widths.
- [ ] Tap targets feel right (no accidental misfires).
- [ ] No hover-only behaviour: every tooltip also opens on long-press.
- [ ] Auto-low-effects kicks in on a low-end device after ~5s without
      visible glitches.
- [ ] Touch scroll on the page does not interfere with the canvas while
      the game is mounted.
- [ ] Backgrounding the tab pauses; foregrounding resumes.

## Manual QA — narrow widths
- [ ] @ 720 px width: HUD stacks but stays usable.
- [ ] @ 480 px width: unit dock is a 3-column horizontal strip.
- [ ] @ 375 px width: turret rack collapses to a single row above dock.

## Audio QA
- [ ] Mute toggle (existing PG.Play sound mute) silences all Era Siege
      cues.
- [ ] Era-up stinger plays once per evolve (no double-fire).
- [ ] Spawn / hit cues throttle when many units fire on the same tick.
- [ ] Win and defeat each play their own sting (no overlap).

## Accessibility QA
- [ ] Reduced motion: era flash and screen shake are skipped.
- [ ] Keyboard navigation: Tab + Enter operates every HUD button.
- [ ] Color contrast: HP bars are readable in greyscale.
- [ ] Tap targets ≥ 44×44 CSS px.

## Regression suite (when other PG.Play games change)
- [ ] Era Siege mount test (in `test/games.smoke.test.js`) still passes.
- [ ] Catalog validator still passes (cover + lazy import + entry).
- [ ] Build still under PG.Play chunk size limits.
- [ ] No new console errors during a clean match playthrough.

## Smoke command
```sh
npm test
npm run validate:catalog
npm run build
npm run preview
# open http://localhost:4173/#/game/aow
```
