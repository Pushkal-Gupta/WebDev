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
  // small pills rotated, behind the body. Sized to match the original
  // candy footprint so play-tested timings still feel right.
  const wrapL = paperPill(0.24, 0.13, palette.wrapper);
  wrapL.position.set(-0.46, 0, -0.06);
  wrapL.rotation.z = 0.4;
  const wrapL2 = paperPill(0.24, 0.13, palette.wrapper);
  wrapL2.position.set(-0.46, 0.02, -0.07);
  wrapL2.rotation.z = -0.4;
  group.add(wrapL); group.add(wrapL2);

  const wrapR = paperPill(0.24, 0.13, palette.wrapper);
  wrapR.position.set(0.46, 0, -0.06);
  wrapR.rotation.z = -0.4;
  const wrapR2 = paperPill(0.24, 0.13, palette.wrapper);
  wrapR2.position.set(0.46, 0.02, -0.07);
  wrapR2.rotation.z = 0.4;
  group.add(wrapR); group.add(wrapR2);

  // Body silhouette outline (slightly larger, behind body).
  const outline = paperDisk(1, palette.candyRim || '#3a0e18', { highlight: 0, shade: 0 });
  outline.scale.set(0.42 * 1.08, 0.36 * 1.08, 1);
  outline.position.z = -0.02;
  group.add(outline);

  // Body fill.
  const body = paperDisk(1, palette.candy, { highlight: 0.20, shade: 0.24 });
  body.scale.set(0.42, 0.36, 1);
  group.add(body);

  // Tiny face — two dot eyes + a small smile. Bigger so they read at
  // typical play distance rather than disappearing into the body fill.
  const eyeL = paperDisk(1, '#26171f', { highlight: 0, shade: 0 });
  eyeL.scale.set(0.038, 0.038, 1);
  eyeL.position.set(-0.10, -0.04, 0.05);
  const eyeR = paperDisk(1, '#26171f', { highlight: 0, shade: 0 });
  eyeR.scale.set(0.038, 0.038, 1);
  eyeR.position.set( 0.10, -0.04, 0.05);
  group.add(eyeL); group.add(eyeR);

  const smile = paperPill(0.16, 0.04, '#26171f');
  smile.position.set(0, 0.10, 0.05);
  group.add(smile);

  // Gleam — small white-yellow speck top-left of the body.
  const gleam = paperDisk(1, '#fff5d6', { highlight: 0, shade: 0 });
  gleam.scale.set(0.07, 0.05, 1);
  gleam.position.set(-0.14, -0.14, 0.06);
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
