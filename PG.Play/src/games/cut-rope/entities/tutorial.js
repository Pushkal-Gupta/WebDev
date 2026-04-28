// Cut the Rope — tutorial pulse. A faint ring with a pulsing animation,
// shown over a chosen world coordinate to teach the cut gesture. Fades
// out after the first successful cut.

import * as THREE from 'three';

export function makeTutorialPulse(x, y) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfff7e1, transparent: true, opacity: 0.7,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const geo = new THREE.RingGeometry(0.22, 0.30, 28);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, 0.04);

  let elapsed = 0;
  let fadeT = 0;            // > 0 once fading; counts up to FADE_DUR

  const FADE_DUR = 0.45;

  return {
    mesh,
    update(dt) {
      elapsed += dt;
      const wobble = 0.3 + Math.sin(elapsed * 4) * 0.18;
      mesh.scale.setScalar(1 + wobble * 0.5);
      if (fadeT > 0) {
        fadeT += dt;
        const k = Math.min(1, fadeT / FADE_DUR);
        mat.opacity = 0.7 * (1 - k);
        if (k >= 1) mesh.visible = false;
      } else {
        mat.opacity = 0.45 + Math.sin(elapsed * 4) * 0.25;
      }
    },
    fade() { if (fadeT === 0) fadeT = 0.0001; },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}
