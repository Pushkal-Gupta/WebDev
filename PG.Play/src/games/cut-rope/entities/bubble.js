// Cut the Rope — bubble device. Encloses a candy point, flips its
// effective gravity for a gentle lift; pop on tap reverts the candy
// to normal physics.

import * as THREE from 'three';

export function makeBubble(def) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xcfeaff, roughness: 0.05, metalness: 0.0,
    transparent: true, opacity: 0.45,
  });
  const geo = new THREE.SphereGeometry(def.radius, 24, 18);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(def.x, def.y, 0);

  const state = { x: def.x, y: def.y, r: def.radius, alive: true, attached: null };

  return {
    state,
    mesh,
    update() {
      const t = performance.now() / 800;
      mesh.scale.setScalar(1 + Math.sin(t) * 0.04);
    },
    pop() {
      if (!state.alive) return;
      state.alive = false;
      mesh.visible = false;
      if (state.attached) {
        state.attached.bubbled = false;
        state.attached = null;
      }
    },
    attach(point) {
      if (!state.alive) return;
      state.attached = point;
      point.bubbled = true;
    },
    follow(point) {
      mesh.position.set(point.x, point.y, 0);
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}
