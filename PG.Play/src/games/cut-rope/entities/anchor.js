// Cut the Rope — anchor pin entity. A pinned verlet point + a small
// metal-pin mesh. Optional `track` definition drives a moving anchor
// that oscillates along a path (sin-wave parametric).

import * as THREE from 'three';
import { makePoint, setPinTarget } from '../physics.js';

export function makeAnchor(palette, def) {
  const group = new THREE.Group();
  const pinMat = new THREE.MeshStandardMaterial({
    color: palette.pin, roughness: 0.4, metalness: 0.55,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: palette.pinRim, roughness: 0.5, metalness: 0.3,
  });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), pinMat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 18), ringMat);
  ring.position.z = 0.02;
  group.add(ring); group.add(cap);
  group.position.set(def.x, def.y, 0);

  const point = makePoint(def.x, def.y, { pinned: true });
  const track = def.track || null;
  let elapsed = 0;

  return {
    id: def.id,
    point,
    mesh: group,
    update(dt) {
      if (!track) return;
      elapsed += dt;
      const t = (Math.sin((elapsed / track.period) * Math.PI * 2) + 1) * 0.5;
      const x = track.ax + (track.bx - track.ax) * t;
      const y = track.ay + (track.by - track.ay) * t;
      setPinTarget(point, x, y);
      group.position.set(x, y, 0);
    },
    dispose() {
      cap.geometry.dispose(); ring.geometry.dispose();
      pinMat.dispose(); ringMat.dispose();
    },
  };
}
