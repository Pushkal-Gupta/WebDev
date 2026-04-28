// Cut the Rope — rope entity. A verlet chain registered into the world
// plus a TubeGeometry that's rebuilt each frame from the alive chain.
// Cut handling is in physics.js; this module just renders the live shape.

import * as THREE from 'three';
import { makePoint, makeConstraint } from '../physics.js';

export function makeRope(palette, def, anchorPoint, candyPoint, world) {
  const segs = def.segments || 12;
  const len = def.length;
  const segLen = len / segs;
  const points = [];
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const x = anchorPoint.x + (candyPoint.x - anchorPoint.x) * t;
    const y = anchorPoint.y + (candyPoint.y - anchorPoint.y) * t;
    const p = makePoint(x, y);
    points.push(p);
    world.points.push(p);
  }
  const allPts = [anchorPoint, ...points, candyPoint];
  for (let i = 0; i < allPts.length - 1; i++) {
    world.constraints.push(makeConstraint(allPts[i], allPts[i + 1], segLen));
  }

  const ropeMat = new THREE.MeshStandardMaterial({
    color: palette.rope, roughness: 0.7, metalness: 0.0,
  });
  let mesh = null;
  const curveTmp = new THREE.CatmullRomCurve3([]);

  function rebuild() {
    if (mesh) {
      mesh.geometry.dispose();
      mesh.parent && mesh.parent.remove(mesh);
    }
    const alivePts = walkAliveChain(world, anchorPoint, candyPoint);
    if (alivePts.length < 2) { mesh = null; return; }
    const v3s = alivePts.map((p) => new THREE.Vector3(p.x, p.y, 0));
    curveTmp.points = v3s;
    const geo = new THREE.TubeGeometry(curveTmp, alivePts.length, 0.05, 5, false);
    mesh = new THREE.Mesh(geo, ropeMat);
  }

  return {
    points,
    rebuild,
    get mesh() { return mesh; },
    dispose() {
      if (mesh) mesh.geometry.dispose();
      ropeMat.dispose();
    },
  };
}

// Walk alive constraints from `start` toward `end`. Robust enough for
// our linear chains; not a generic graph walker.
function walkAliveChain(world, start, end) {
  const out = [start];
  let cur = start;
  const visited = new Set([cur]);
  let safety = world.constraints.length + 4;
  while (safety-- > 0) {
    const next = world.constraints.find(
      (c) => c.alive && (c.a === cur || c.b === cur) &&
             !visited.has(c.a === cur ? c.b : c.a),
    );
    if (!next) break;
    cur = next.a === cur ? next.b : next.a;
    visited.add(cur);
    out.push(cur);
    if (cur === end) break;
  }
  return out;
}
