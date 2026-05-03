// Snip — spike hazard. A bank of flat triangle teeth pointing upward
// toward the candy. Drawn as ShapeGeometry with a flat unlit material
// so it reads as a paper-cut illustration. Lethal on candy contact;
// the gameplay loop polls `contains(x, y)` each frame.

import * as THREE from 'three';

export function makeSpike(def) {
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x46535e, side: THREE.DoubleSide, transparent: true, opacity: 1,
  });
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0x2a3138, side: THREE.DoubleSide, transparent: true, opacity: 1,
  });
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  const N = Math.max(3, Math.round(def.w / 0.28));
  const spikeW = def.w / N;
  const geos = [];
  // Backplate strip — a darker thin band at the base.
  const baseGeo = new THREE.PlaneGeometry(def.w, def.h * 0.18);
  const base = new THREE.Mesh(baseGeo, rimMat);
  base.position.set(0, def.h / 2 - def.h * 0.09, -0.01);
  group.add(base);
  geos.push(baseGeo);

  for (let i = 0; i < N; i++) {
    const pts = [
      new THREE.Vector2(i * spikeW - def.w / 2, def.h / 2),
      new THREE.Vector2((i + 1) * spikeW - def.w / 2, def.h / 2),
      new THREE.Vector2((i + 0.5) * spikeW - def.w / 2, -def.h / 2),
    ];
    const sh = new THREE.Shape(pts);
    const g = new THREE.ShapeGeometry(sh);
    geos.push(g);
    group.add(new THREE.Mesh(g, fillMat));
    // Rim outline: redraw a slightly larger triangle behind in rim color.
    const ptsRim = [
      new THREE.Vector2(i * spikeW - def.w / 2 - 0.014, def.h / 2 + 0.02),
      new THREE.Vector2((i + 1) * spikeW - def.w / 2 + 0.014, def.h / 2 + 0.02),
      new THREE.Vector2((i + 0.5) * spikeW - def.w / 2, -def.h / 2 - 0.02),
    ];
    const shRim = new THREE.Shape(ptsRim);
    const gRim = new THREE.ShapeGeometry(shRim);
    geos.push(gRim);
    const rimMesh = new THREE.Mesh(gRim, rimMat);
    rimMesh.position.z = -0.005;
    group.add(rimMesh);
  }

  return {
    mesh: group,
    contains(px, py) {
      return px > def.x - def.w / 2 && px < def.x + def.w / 2 &&
             py > def.y - def.h / 2 && py < def.y + def.h / 2;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      fillMat.dispose();
      rimMat.dispose();
    },
  };
}
