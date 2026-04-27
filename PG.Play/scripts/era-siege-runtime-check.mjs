// Runtime smoke check — instantiate a match, run sim ticks, exercise
// every render branch (sprite-blit + procedural fallback) against a
// fake canvas. Catches the kind of bug that vitest+jsdom misses
// because the test mount doesn't actually drive the renderer.

import { createMatch, tick, setView, scoreMatch } from '../src/games/era-siege/sim/world.js';
import { makeRenderer } from '../src/games/era-siege/engine/renderer.js';
import { trySpawnUnit } from '../src/games/era-siege/sim/unit.js';
import { tryBuildTurret } from '../src/games/era-siege/sim/turret.js';
import { tryFireSpecial } from '../src/games/era-siege/sim/specials.js';
import { tryEvolve } from '../src/games/era-siege/sim/progression.js';
import { tryBuyPowerup } from '../src/games/era-siege/sim/powerups.js';
import { pushExplosion } from '../src/games/era-siege/sim/effects.js';

// Stub canvas with all the methods the renderer touches.
function makeStubCtx() {
  const noop = () => {};
  return {
    canvas: { width: 1280, height: 720 },
    fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
    globalCompositeOperation: 'source-over', font: '', textAlign: '',
    fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop,
    strokeText: noop, beginPath: noop, closePath: noop, moveTo: noop,
    lineTo: noop, arc: noop, ellipse: noop, fill: noop, stroke: noop,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, drawImage: noop, setLineDash: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 0 }),
  };
}

const errors = [];
function probe(label, fn) {
  try { fn(); console.log(`✓ ${label}`); }
  catch (err) {
    console.error(`✗ ${label}: ${err.message}`);
    errors.push({ label, err });
  }
}

const match = createMatch({ difficulty: 'standard', seed: 1, view: { w: 1280, h: 720 } });
const renderer = makeRenderer();
const ctx = makeStubCtx();

probe('createMatch', () => {});
probe('first render (empty match)', () => renderer.render(ctx, match));

// Spawn one of each role + fire ranged.
match.player.gold = 5000;
probe('spawn frontline',  () => trySpawnUnit(match, match.player, 'ember-runner'));
probe('spawn ranged',     () => trySpawnUnit(match, match.player, 'bone-slinger'));
probe('spawn heavy',      () => trySpawnUnit(match, match.player, 'pyre-bearer'));
probe('build turret',     () => tryBuildTurret(match, match.player, 0));
probe('buy powerup',      () => tryBuyPowerup(match, match.player, 'economy'));

// Drive the sim — exercises projectile + impact + death paths.
probe('tick 1s', () => { for (let i = 0; i < 60; i++) tick(match, 1/60, null); });

// Force an explosion VFX entry.
probe('pushExplosion',  () => pushExplosion(match, 400, 400, { size: 80 }));

// Render after sim activity.
probe('render with units', () => renderer.render(ctx, match));

// Special telegraph + impact.
probe('fire special',  () => tryFireSpecial(match, match.player));
probe('tick to impact',() => { for (let i = 0; i < 120; i++) tick(match, 1/60, null); });
probe('render post-special', () => renderer.render(ctx, match));

// Evolve flow
match.player.xp = 1e6; match.player.gold += 1000;
probe('evolve era 2', () => tryEvolve(match, match.player));
probe('render era 2', () => renderer.render(ctx, match));

// Era 5 sanity (forces every era's draw branch).
match.player.eraIndex = 4;
match.enemy.eraIndex = 4;
probe('render era 5', () => renderer.render(ctx, match));

// View resize mid-flight.
probe('setView 1920×1080', () => setView(match, 1920, 1080));
probe('render at 1920',  () => renderer.render(ctx, match));

// Score formula.
probe('scoreMatch', () => scoreMatch(match));

if (errors.length) {
  console.error(`\n${errors.length} runtime error(s).`);
  for (const e of errors) {
    console.error(`\n— ${e.label}`);
    console.error(e.err.stack);
  }
  process.exit(1);
} else {
  console.log('\nall paths clean.');
}
