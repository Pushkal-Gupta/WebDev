// Snip — anchor pin entity. A clean, minimal two-layer disk: outer
// ring in the rim color, inner disk in the body color, plus a tiny
// rivet glint in the centre. No more sphere+torus combo.
//
// Optional `track` definition drives a moving anchor that oscillates
// along a path (sin-wave parametric).

import * as THREE from 'three';
import { makePoint, setPinTarget } from '../physics.js';
import { paperDisk, disposePaperGroup } from './_paper.js';

export function makeAnchor(palette, def) {
  const group = new THREE.Group();

  const outer = paperDisk(0.18, palette.pinRim, { highlight: 0.1, shade: 0.18 });
  group.add(outer);
  const inner = paperDisk(0.13, palette.pin, { highlight: 0.16, shade: 0.18 });
  inner.position.z = 0.02;
  group.add(inner);
  const rivet = paperDisk(0.035, '#fff8e6', { highlight: 0, shade: 0 });
  rivet.position.set(-0.025, -0.025, 0.04);
  group.add(rivet);

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
      disposePaperGroup(group);
    },
  };
}
