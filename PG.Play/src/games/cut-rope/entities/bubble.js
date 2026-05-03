// Snip — bubble device. Encloses a candy point, propagates buoyancy
// through the alive constraint chain (handled in index.jsx), and pops
// on tap. Rendered as a clean translucent ring with two small glints.

import * as THREE from 'three';
import { paperDisk } from './_paper.js';

export function makeBubble(def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  // Outer rim — translucent ring drawn as a slightly larger blue disk
  // with a transparent inner cutout via the shader.
  const rim = paperDisk(def.radius, '#cfeaff', {
    highlight: 0.12, shade: 0.05, outline: '#9fd3ff', outlineWidth: 0.18,
  });
  rim.material.transparent = true;
  rim.material.uniforms.uOutline.value.setRGB(0.62, 0.83, 1.0);
  rim.position.z = -0.05;
  group.add(rim);

  // Inner translucent fill — keeps it readable as a "soap bubble".
  const fill = paperDisk(def.radius * 0.92, '#dff1ff', { highlight: 0.05, shade: 0.0 });
  fill.material.transparent = true;
  fill.material.opacity = 0.55;
  group.add(fill);

  // Two glints — top-left big, bottom-right small.
  const glintA = paperDisk(0.12, '#ffffff', { highlight: 0, shade: 0 });
  glintA.position.set(-def.radius * 0.42, -def.radius * 0.42, 0.03);
  group.add(glintA);
  const glintB = paperDisk(0.06, '#ffffff', { highlight: 0, shade: 0 });
  glintB.position.set(def.radius * 0.32, def.radius * 0.32, 0.03);
  group.add(glintB);

  const state = {
    x: def.x, y: def.y, r: def.radius,
    alive: true, attached: null,
    dirty: false,
  };

  return {
    state,
    mesh: group,
    update() {
      const t = performance.now() / 800;
      const s = 1 + Math.sin(t) * 0.04;
      group.scale.setScalar(s);
    },
    pop() {
      if (!state.alive) return;
      state.alive = false;
      group.visible = false;
      state.attached = null;
      state.dirty = true;
    },
    attach(point) {
      if (!state.alive) return;
      state.attached = point;
      point.bubbled = true;
      state.dirty = true;
    },
    follow(point) {
      group.position.set(point.x, point.y, 0);
    },
    dispose() {
      group.traverse((obj) => obj.material?.dispose?.());
    },
  };
}
