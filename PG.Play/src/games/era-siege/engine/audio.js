// Cue routing: subscribe to sim events, throttle high-frequency cues,
// fire the matching procedural sfx from src/sound.js.

import { sfx, isMuted } from '../../../sound.js';

const THROTTLE_MS = 160;   // per-cue minimum interval

export function attachAudio(bus) {
  const lastFireMs = new Map();

  function fire(name) {
    if (isMuted()) return;
    const now = performance.now();
    const last = lastFireMs.get(name) || 0;
    if (now - last < THROTTLE_MS) return;
    lastFireMs.set(name, now);
    const fn = sfx[name];
    if (fn) fn();
  }

  const offs = [];
  offs.push(bus.on('unit_spawned', (e) => fire(e.team === 'player' ? 'confirm' : 'click')));
  offs.push(bus.on('kill', () => fire('coin')));
  offs.push(bus.on('era_reached', (e) => { if (e.team === 'player') fire('achievement'); else fire('open'); }));
  offs.push(bus.on('turret_built', () => fire('confirm')));
  offs.push(bus.on('special_charged', (e) => { if (e.team === 'player') fire('whistle'); }));
  offs.push(bus.on('special_used', () => fire('cheer')));
  offs.push(bus.on('low_gold_error', () => fire('error')));
  offs.push(bus.on('match_end', (e) => fire(e.won ? 'win' : 'lose')));

  return () => { for (const off of offs) off?.(); };
}
