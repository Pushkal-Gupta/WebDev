// Cut the Rope — star collectible. A flat 5-point star with a gentle
// rotation + scale wobble. Hidden when collected; the FX layer plays
// the sparkle burst (driven by the gameplay loop).

import * as THREE from 'three';

export function makeStar(def) {
  const shape = new THREE.Shape();
  const r = 0.26, ri = r * 0.45;
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 - 90) * Math.PI / 180;
    const rr = i % 2 === 0 ? r : ri;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd24a, roughness: 0.4, metalness: 0.1,
    emissive: 0xffae33, emissiveIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(def.x, def.y, 0);

  const state = { x: def.x, y: def.y, taken: false, t: Math.random() * Math.PI };

  return {
    state,
    mesh,
    update(dt) {
      state.t += dt;
      mesh.rotation.z = Math.sin(state.t * 1.6) * 0.15;
      mesh.scale.setScalar(1.0 + Math.sin(state.t * 2.2) * 0.04);
    },
    take() {
      state.taken = true;
      mesh.visible = false;
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}
