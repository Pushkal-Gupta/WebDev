// Cut the Rope — spike hazard. A bank of triangle teeth pointing
// upward (toward the candy). Lethal on candy contact; the gameplay
// loop polls `contains(x, y)` each frame.

import * as THREE from 'three';

export function makeSpike(def) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x5a6a7a, roughness: 0.4, metalness: 0.5,
  });
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  const N = Math.max(3, Math.round(def.w / 0.28));
  const spikeW = def.w / N;
  const geos = [];
  for (let i = 0; i < N; i++) {
    const pts = [
      new THREE.Vector2(i * spikeW - def.w / 2, def.h / 2),
      new THREE.Vector2((i + 1) * spikeW - def.w / 2, def.h / 2),
      new THREE.Vector2((i + 0.5) * spikeW - def.w / 2, -def.h / 2),
    ];
    const sh = new THREE.Shape(pts);
    const g = new THREE.ShapeGeometry(sh);
    geos.push(g);
    group.add(new THREE.Mesh(g, mat));
  }

  return {
    mesh: group,
    contains(px, py) {
      return px > def.x - def.w / 2 && px < def.x + def.w / 2 &&
             py > def.y - def.h / 2 && py < def.y + def.h / 2;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mat.dispose();
    },
  };
}
