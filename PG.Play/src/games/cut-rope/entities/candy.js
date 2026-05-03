// Snip — candy entity. The hero piece. A flat layered illustration
// rather than a 3D mesh: round centre with painted face + spiral
// wrapper twists at each end + a small gleam. Squashes briefly when
// pulsed (cut response). Subtle ground shadow follows along the floor.

import * as THREE from 'three';
import { makePoint } from '../physics.js';
import { paperDisk, paperEllipse, paperPill, paperShadow, disposePaperGroup } from './_paper.js';

export function makeCandy(palette, def) {
  const group = new THREE.Group();

  // ── Layers (back-to-front) ──────────────────────────────────────────
  // Wrapper twists — small triangles fanned at each end. Approximate via
  // small pills rotated, behind the body.
  const wrapL = paperPill(0.18, 0.10, palette.wrapper);
  wrapL.position.set(-0.36, 0, -0.02);
  wrapL.rotation.z = 0.4;
  const wrapL2 = paperPill(0.18, 0.10, palette.wrapper);
  wrapL2.position.set(-0.36, 0.02, -0.03);
  wrapL2.rotation.z = -0.4;
  group.add(wrapL); group.add(wrapL2);

  const wrapR = paperPill(0.18, 0.10, palette.wrapper);
  wrapR.position.set(0.36, 0, -0.02);
  wrapR.rotation.z = -0.4;
  const wrapR2 = paperPill(0.18, 0.10, palette.wrapper);
  wrapR2.position.set(0.36, 0.02, -0.03);
  wrapR2.rotation.z = 0.4;
  group.add(wrapR); group.add(wrapR2);

  // Body silhouette outline (slightly larger).
  const outline = paperDisk(0.32, palette.candyRim || '#3a0e18', { highlight: 0, shade: 0 });
  outline.scale.set(0.32 * 1.06, 0.28 * 1.06, 1);
  group.add(outline);

  // Body fill.
  const body = paperDisk(0.32, palette.candy, { highlight: 0.16, shade: 0.20 });
  body.scale.set(0.32, 0.28, 1);
  group.add(body);

  // Tiny face — two dot eyes, smile. Reads as "alive" without overdoing.
  const eyeL = paperDisk(0.024, '#26171f', { highlight: 0, shade: 0 });
  eyeL.position.set(-0.07, -0.02, 0.05);
  const eyeR = paperDisk(0.024, '#26171f', { highlight: 0, shade: 0 });
  eyeR.position.set( 0.07, -0.02, 0.05);
  group.add(eyeL); group.add(eyeR);

  const smile = paperPill(0.10, 0.025, '#26171f');
  smile.position.set(0, 0.06, 0.05);
  group.add(smile);

  // Gleam — small white-yellow speck top-left.
  const gleam = paperDisk(0.04, '#fff5d6', { highlight: 0, shade: 0 });
  gleam.position.set(-0.10, -0.10, 0.06);
  group.add(gleam);

  // Ground shadow that lives on the floor plane — separate so it can
  // ride independently while the candy swings.
  const shadow = paperShadow(0.40, 0.10, 0.22);
  shadow.position.set(def.x, 5.4, -0.15);

  const point = makePoint(def.x, def.y);
  let squashT = 0;

  return {
    point,
    mesh: group,
    aoMesh: shadow,
    sync(dt) {
      group.position.set(point.x, point.y, 0);
      // Slight tilt aligned with travel direction.
      const vx = point.x - point.prevX;
      const vy = point.y - point.prevY;
      group.rotation.z = Math.atan2(vx, -vy) * 0.45;

      // Squash on pulse.
      let sx = 1, sy = 1;
      if (squashT > 0) {
        squashT = Math.max(0, squashT - (dt || 0.016));
        const k = squashT / 0.18;
        const w = Math.sin(k * Math.PI);
        sx = 1 + w * 0.16;
        sy = 1 - w * 0.20;
      }
      group.scale.set(sx, sy, 1);

      // Track shadow under candy along the floor; fade as candy lifts off.
      shadow.position.set(point.x, 5.4, -0.15);
      const liftAmount = Math.max(0, 5.4 - point.y);
      shadow.scale.x = 0.40 * (1 - Math.min(0.5, liftAmount * 0.06));
      shadow.material.uniforms.uOp.value = Math.max(0.05, 0.22 - liftAmount * 0.02);
    },
    pulse() { squashT = 0.18; },
    dispose() {
      disposePaperGroup(group);
      shadow.material?.dispose?.();
    },
  };
}
