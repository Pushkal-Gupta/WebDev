// Snip — per-world decor. One quiet background motif per world, each
// rendered as flat shapes that read as paper-craft. The previous
// implementation stacked procedural primitives (box shelves, cone
// leaves, cylinder gears) which betrayed the geometry — we keep it
// minimal here.
//
// Decor sits at z = -2.5 (between the backdrop at z = -3.5 and the
// gameplay layer at z ≈ 0). Materials are unlit and lightly tinted so
// the foreground stays the eye target.

import * as THREE from 'three';
import { paperDisk } from './entities/_paper.js';

const Z_DECOR = -2.5;

export function makeDecor(theme, palette) {
  const group = new THREE.Group();
  const owned = [];   // materials we created and need to dispose

  const addCircle = (x, y, r, color, opts = {}) => {
    const m = paperDisk(r, color, { highlight: 0, shade: 0, ...opts });
    m.position.set(x, y, Z_DECOR);
    group.add(m);
    owned.push(m.material);
  };

  if (theme === 'sweet') {
    // Two soft pastel orbs floating top-left + top-right — read as
    // plump candies behind the action.
    addCircle(-4.4, 0.6, 0.62, '#ffd6cc', { softness: 0.35 });
    addCircle( 4.4, 1.2, 0.48, '#ffe9b3', { softness: 0.35 });
    addCircle(-3.6, 5.3, 0.34, '#ffcab0', { softness: 0.4 });
    addCircle( 3.4, 5.4, 0.40, '#ffe0bd', { softness: 0.4 });
  }
  else if (theme === 'green') {
    // Soft leaf silhouettes left + right — rounded ellipses tilted.
    const leafL = paperDisk(1.0, '#7fa86b', { highlight: 0, shade: 0, softness: 0.35 });
    leafL.position.set(-4.6, 1.0, Z_DECOR);
    leafL.scale.set(0.6, 1.1, 1);
    leafL.rotation.z = -0.5;
    group.add(leafL); owned.push(leafL.material);

    const leafR = paperDisk(0.8, '#9ec77b', { highlight: 0, shade: 0, softness: 0.35 });
    leafR.position.set(4.6, 0.6, Z_DECOR);
    leafR.scale.set(0.6, 1.0, 1);
    leafR.rotation.z = 0.5;
    group.add(leafR); owned.push(leafR.material);

    addCircle(4.0, 5.0, 0.3, '#a8c886', { softness: 0.4 });
    addCircle(-3.4, 5.2, 0.28, '#bcd4a0', { softness: 0.4 });
  }
  else if (theme === 'work') {
    // Two warm circular lamps — soft glow halos.
    const haloA = paperDisk(1.2, '#ff7b3a', { highlight: 0, shade: 0, softness: 0.7 });
    haloA.material.transparent = true;
    haloA.material.opacity = 0.45;
    haloA.position.set(-3.6, 1.6, Z_DECOR);
    group.add(haloA); owned.push(haloA.material);

    const haloB = paperDisk(0.9, '#ffae6a', { highlight: 0, shade: 0, softness: 0.7 });
    haloB.material.transparent = true;
    haloB.material.opacity = 0.40;
    haloB.position.set(3.4, 0.6, Z_DECOR);
    group.add(haloB); owned.push(haloB.material);

    // Small specular dots in the lamps' centres.
    addCircle(-3.6, 1.6, 0.10, '#fff3c4', { softness: 0.05 });
    addCircle( 3.4, 0.6, 0.07, '#fff3c4', { softness: 0.05 });
  }

  return {
    mesh: group,
    dispose() {
      for (const m of owned) m.dispose();
    },
  };
}
