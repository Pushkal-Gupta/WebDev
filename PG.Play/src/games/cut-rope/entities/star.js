// Snip — star collectible. Vector star with inner glow and a soft halo
// that pulses gently while idle. The shape is rendered by an SDF in
// `_paper.js::paperStar`, so it stays crisp at any zoom and never
// shows polygon facets.

import * as THREE from 'three';
import { paperDisk, paperStar } from './_paper.js';

export function makeStar(def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  // Outer halo — soft transparent disc that pulses with star.t.
  const halo = paperDisk(0.5, '#ffe98f', { highlight: 0, shade: 0, softness: 0.5 });
  halo.material.transparent = true;
  halo.material.uniforms.uColor.value.setRGB(1.0, 0.92, 0.56);
  halo.position.z = -0.02;
  group.add(halo);

  // The star shape itself.
  const star = paperStar(0.32, '#ffd24a', '#fff3a8');
  group.add(star);

  const state = { x: def.x, y: def.y, taken: false, t: Math.random() * Math.PI };

  return {
    state,
    mesh: group,
    update(dt) {
      state.t += dt;
      // Gentle rocking + scale wobble on the star itself.
      star.rotation.z = Math.sin(state.t * 1.6) * 0.18;
      const s = 1.0 + Math.sin(state.t * 2.2) * 0.06;
      star.scale.set(s, s, 1);
      // Halo pulses on a slower beat.
      const halo_s = 1.0 + Math.sin(state.t * 1.1) * 0.10;
      halo.scale.setScalar(halo_s);
      halo.material.opacity = 0.35 + Math.sin(state.t * 1.1) * 0.08;
    },
    take() {
      state.taken = true;
      group.visible = false;
    },
    dispose() {
      star.material?.dispose?.();
      halo.material?.dispose?.();
    },
  };
}
