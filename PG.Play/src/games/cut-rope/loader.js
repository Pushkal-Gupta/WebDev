// Cut the Rope — level loader. Materializes a level definition into
// (1) physics world points/constraints (2) Three.js entity meshes,
// indexed for the gameplay loop.

import {
  makeAnchor, makeCandy, makeRope, makeStar, makeTarget,
  makeBubble, makeBlower, makeSpike,
} from './entities.js';
import { makeWorld, makeConstraint, makePoint } from './physics.js';
import { PALETTE } from './levels.js';

export function loadLevel(scene, sceneRoot, level) {
  const palette = PALETTE[level.theme];
  const world = makeWorld();

  // Anchors first — both for the visual and as endpoints for ropes.
  const anchorById = {};
  const anchors = [];
  for (const def of level.anchors) {
    const a = makeAnchor(palette, def);
    anchorById[def.id] = a;
    anchors.push(a);
    world.points.push(a.point);
    sceneRoot.add(a.mesh);
  }

  // Candy.
  const candy = makeCandy(palette, level.candy);
  world.points.push(candy.point);
  sceneRoot.add(candy.mesh);
  sceneRoot.add(candy.aoMesh);

  // Ropes — each may optionally route via an intermediate pin (`viaAnchor`).
  const ropes = [];
  for (const def of level.ropes) {
    const fromA = anchorById[def.from];
    if (!fromA) continue;
    if (def.viaAnchor) {
      const viaA = anchorById[def.viaAnchor];
      if (viaA) {
        // Two rope segments: from → via, via → candy. Length split equally.
        const half = def.length / 2;
        const r1 = makeRope(palette, { ...def, length: half, segments: Math.max(6, (def.segments || 12) >> 1) }, fromA.point, viaA.point, world);
        const r2 = makeRope(palette, { ...def, length: half, segments: Math.max(6, (def.segments || 12) >> 1) }, viaA.point, candy.point, world);
        ropes.push(r1, r2);
        continue;
      }
    }
    const r = makeRope(palette, def, fromA.point, candy.point, world);
    ropes.push(r);
  }

  // Stars.
  const stars = (level.stars || []).map((def) => {
    const s = makeStar(def);
    sceneRoot.add(s.mesh);
    return s;
  });

  // Target.
  const target = makeTarget(palette, level.target);
  sceneRoot.add(target.mesh);

  // Devices.
  const bubbles = [], blowers = [];
  for (const d of (level.devices || [])) {
    if (d.kind === 'bubble') {
      const b = makeBubble(d);
      bubbles.push(b);
      sceneRoot.add(b.mesh);
    } else if (d.kind === 'blower') {
      const b = makeBlower(d);
      blowers.push(b);
      sceneRoot.add(b.mesh);
    }
  }

  // Hazards.
  const spikes = (level.hazards || [])
    .filter((h) => h.kind === 'spike')
    .map((h) => {
      const s = makeSpike(h);
      sceneRoot.add(s.mesh);
      return s;
    });

  return { world, anchors, candy, ropes, stars, target, bubbles, blowers, spikes, palette };
}

export function disposeLevel(sceneRoot, lev) {
  if (!lev) return;
  const drop = (e) => {
    if (e.mesh) sceneRoot.remove(e.mesh);
    if (e.aoMesh) sceneRoot.remove(e.aoMesh);
    e.dispose?.();
  };
  lev.anchors.forEach(drop);
  drop(lev.candy);
  lev.ropes.forEach((r) => {
    if (r.mesh) sceneRoot.remove(r.mesh);
    r.dispose?.();
  });
  lev.stars.forEach(drop);
  drop(lev.target);
  lev.bubbles.forEach(drop);
  lev.blowers.forEach(drop);
  lev.spikes.forEach(drop);
}
