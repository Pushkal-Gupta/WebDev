// Cut the Rope — candy entity. A point mass wrapped in a 3D mesh group:
// a flattened sphere "core" plus two cone wrapper-tails. A faint AO
// ellipse follows the candy's X position on the floor plane.

import * as THREE from 'three';
import { makePoint } from '../physics.js';

export function makeCandy(palette, def) {
  const group = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({
    color: palette.candy, roughness: 0.35, metalness: 0.05,
    emissive: palette.candy, emissiveIntensity: 0.08,
  });
  const wrapMat = new THREE.MeshStandardMaterial({
    color: palette.wrapper, roughness: 0.4, metalness: 0.0,
  });
  const coreGeo = new THREE.SphereGeometry(0.34, 22, 16);
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.scale.set(1.0, 0.85, 0.6);
  group.add(core);

  const tailGeo = new THREE.ConeGeometry(0.16, 0.32, 8);
  const tailL = new THREE.Mesh(tailGeo, wrapMat);
  tailL.rotation.z = Math.PI / 2;
  tailL.position.x = -0.42;
  const tailR = new THREE.Mesh(tailGeo, wrapMat);
  tailR.rotation.z = -Math.PI / 2;
  tailR.position.x = 0.42;
  group.add(tailL); group.add(tailR);

  // DoubleSide — flat CircleGeometry under the engine's flipped camera.
  const aoMat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false,
    side: THREE.DoubleSide,
  });
  const aoGeo = new THREE.CircleGeometry(0.32, 16);
  const ao = new THREE.Mesh(aoGeo, aoMat);
  ao.scale.set(1, 0.35, 1);
  ao.position.z = -0.5;

  const point = makePoint(def.x, def.y);
  let squashT = 0;          // squash timeline; >0 means animating

  return {
    point,
    mesh: group,
    aoMesh: ao,
    sync(dt) {
      group.position.set(point.x, point.y, 0);
      const vx = point.x - point.prevX;
      const vy = point.y - point.prevY;
      group.rotation.z = Math.atan2(vx, -vy) * 0.6;
      // Squash animation — vertical stretch then settle, ~180ms.
      let sx = 1, sy = 1;
      if (squashT > 0) {
        squashT = Math.max(0, squashT - (dt || 0.016));
        const k = squashT / 0.18;       // 1 → 0
        const w = Math.sin(k * Math.PI);
        sx = 1 + w * 0.18;
        sy = 1 - w * 0.22;
      }
      group.scale.set(sx, sy, 1);
      // AO sits on the floor (y = 5.4 world).
      ao.position.set(point.x, 5.4, -0.5);
      const vmag = Math.hypot(vx, vy);
      aoMat.opacity = Math.max(0.02, 0.22 - Math.min(0.18, vmag * 0.25));
    },
    pulse() { squashT = 0.18; },
    dispose() {
      coreGeo.dispose(); tailGeo.dispose(); aoGeo.dispose();
      coreMat.dispose(); wrapMat.dispose(); aoMat.dispose();
    },
  };
}
