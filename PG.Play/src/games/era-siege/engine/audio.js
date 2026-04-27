// Cue routing: subscribe to sim events, throttle high-frequency cues,
// fire the matching procedural sfx from src/sound.js.
//
// Uses the per-unit and per-special audio metadata from content/ so
// each unit and special has its own sonic signature instead of a
// generic "shot" / "click" everywhere. Era index is used to pick a
// "weight" cue for late-game ranged/heavy fire so era 4 / 5 reads
// audibly heavier than era 1.

import { sfx, isMuted } from '../../../sound.js';
import { getUnit } from '../content/units.js';
import { getSpecial } from '../content/specials.js';

const THROTTLE_MS = 160;

// Era-flavoured fallbacks for cues that don't have per-unit metadata.
// Index 0..4 corresponds to era 1..5.
const ERA_RANGED_FIRE  = ['shot',     'shot',  'shot',  'shot',     'axeReveal'];
const ERA_RANGED_HIT   = ['stomp',    'stomp', 'stomp', 'kick',     'lose'];
const ERA_TURRET_FIRE  = ['shot',     'shot',  'kick',  'kick',     'axeReveal'];
const ERA_BASE_HIT     = ['axeReveal','axeReveal','kick','axeReveal','lose'];

export function attachAudio(bus) {
  const lastFireMs = new Map();

  function fire(name) {
    if (!name) return;
    if (isMuted()) return;
    const now = performance.now();
    const last = lastFireMs.get(name) || 0;
    if (now - last < THROTTLE_MS) return;
    lastFireMs.set(name, now);
    const fn = sfx[name];
    if (fn) fn();
  }

  function eraPick(arr, eraIdx) {
    return arr[Math.max(0, Math.min(arr.length - 1, eraIdx | 0))];
  }

  const offs = [];

  // Spawn — read the per-unit cue from content. Player and enemy share
  // the same spawn cue per unit but at slightly different pitches via
  // the cue choice itself: heavies map to 'open', light units to 'confirm'.
  offs.push(bus.on('unit_spawned', (e) => {
    const def = getUnit(e.unitId);
    fire(def?.audio?.spawnCue || (e.team === 'player' ? 'confirm' : 'click'));
  }));

  // Kill — coin pickup for player kills, error for self-kills (defensive).
  offs.push(bus.on('kill', (e) => {
    fire(e.team === 'player' ? 'coin' : 'stomp');
  }));

  // Era reached — heavy stinger for the player, opening cue for enemy.
  offs.push(bus.on('era_reached', (e) => {
    fire(e.team === 'player' ? 'achievement' : 'open');
  }));

  // Turret build — confirm cue.
  offs.push(bus.on('turret_built', () => fire('confirm')));

  // Turret sold — bounce (lighter than confirm so it doesn't read as a build).
  offs.push(bus.on('turret_sold', () => fire('bounce')));

  // Special telegraph + impact — read the special def's audio cues.
  offs.push(bus.on('special_charged', (e) => {
    const def = getSpecial(e.specialId);
    if (e.team === 'player') fire(def?.audio?.chargeCue || 'whistle');
  }));
  offs.push(bus.on('special_used', (e) => {
    const def = getSpecial(e.specialId);
    fire(def?.audio?.impactCue || eraPick(ERA_BASE_HIT, e.era || 0));
  }));

  // Insufficient gold / cooldown / locked — error chirp.
  offs.push(bus.on('low_gold_error', () => fire('error')));

  // Match end — long stinger.
  offs.push(bus.on('match_end', (e) => fire(e.won ? 'win' : 'lose')));

  return () => { for (const off of offs) off?.(); };
}

// Re-export so tests can poke at it.
export { ERA_RANGED_FIRE, ERA_RANGED_HIT, ERA_TURRET_FIRE, ERA_BASE_HIT };
