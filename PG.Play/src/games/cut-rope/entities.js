// Cut the Rope — entity factories. Each factory builds a Three.js mesh
// hierarchy + a state object, and returns a tiny update() to be called
// each frame. The gameplay code never touches Three.js directly except
// through these.

import * as THREE from 'three';
import { makePoint, makeConstraint, setPinTarget } from './physics.js';

/* ── Anchor pin ────────────────────────────────────────────────────── */
export function makeAnchor(palette, def) {
  const group = new THREE.Group();
  const pinMat = new THREE.MeshStandardMaterial({
    color: palette.pin, roughness: 0.4, metalness: 0.55,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: palette.pinRim, roughness: 0.5, metalness: 0.3,
  });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), pinMat);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.04, 8, 18),
    ringMat,
  );
  ring.position.z = 0.02;
  group.add(ring); group.add(cap);
  group.position.set(def.x, def.y, 0);

  // Verlet point — pinned by default.
  const point = makePoint(def.x, def.y, { pinned: true });

  let track = def.track || null;
  let elapsed = 0;

  return {
    id: def.id,
    point,
    mesh: group,
    materials: [pinMat, ringMat],
    update(dt) {
      if (track) {
        elapsed += dt;
        const t = (Math.sin((elapsed / track.period) * Math.PI * 2) + 1) * 0.5;
        const x = track.ax + (track.bx - track.ax) * t;
        const y = track.ay + (track.by - track.ay) * t;
        setPinTarget(point, x, y);
        group.position.set(x, y, 0);
      }
    },
    dispose() {
      group.traverse((obj) => obj.geometry?.dispose());
      pinMat.dispose(); ringMat.dispose();
    },
  };
}

/* ── Candy ─────────────────────────────────────────────────────────── */
export function makeCandy(palette, def) {
  const group = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({
    color: palette.candy, roughness: 0.35, metalness: 0.05,
    emissive: palette.candy, emissiveIntensity: 0.08,
  });
  const wrapMat = new THREE.MeshStandardMaterial({
    color: palette.wrapper, roughness: 0.4, metalness: 0.0,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), coreMat);
  core.scale.set(1.0, 0.85, 0.6);
  group.add(core);

  // Two wrapper "tails" left and right.
  const tailGeo = new THREE.ConeGeometry(0.16, 0.32, 8);
  const tailL = new THREE.Mesh(tailGeo, wrapMat);
  tailL.rotation.z = Math.PI / 2;
  tailL.position.x = -0.42;
  const tailR = new THREE.Mesh(tailGeo, wrapMat);
  tailR.rotation.z = -Math.PI / 2;
  tailR.position.x = 0.42;
  group.add(tailL); group.add(tailR);

  // Soft fake AO ellipse on the floor (z = -0.5 so it never z-fights the
  // gameplay plane). Follows the candy's X position.
  const aoMat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false,
  });
  const ao = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), aoMat);
  ao.scale.set(1, 0.35, 1);
  ao.position.z = -0.5;

  const point = makePoint(def.x, def.y);

  return {
    point,
    mesh: group,
    aoMesh: ao,
    materials: [coreMat, wrapMat, aoMat],
    sync() {
      group.position.set(point.x, point.y, 0);
      // Velocity-driven rotation for a tactile spin while flying.
      const vx = point.x - point.prevX;
      const vy = point.y - point.prevY;
      group.rotation.z = Math.atan2(vx, -vy) * 0.6;
      ao.position.set(point.x, 5.4, -0.5);
      const vmag = Math.hypot(vx, vy);
      const op = 0.22 - Math.min(0.18, vmag * 0.25);
      aoMat.opacity = Math.max(0.02, op);
    },
    dispose() {
      core.geometry.dispose(); tailGeo.dispose();
      ao.geometry.dispose();
      coreMat.dispose(); wrapMat.dispose(); aoMat.dispose();
    },
  };
}

/* ── Rope ──────────────────────────────────────────────────────────── */
// One rope is a verlet chain from an anchor to the candy. We render it
// as a thin tube via a re-built BufferGeometry every frame (10–14 segs;
// cheap). Cut state is reflected by pruning constraints.
export function makeRope(palette, def, anchorPoint, candyPoint, world) {
  const segs = def.segments || 12;
  const len  = def.length;
  const segLen = len / segs;
  const points = [];
  // Linear interpolation from anchor to candy as the initial rope shape.
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const x = anchorPoint.x + (candyPoint.x - anchorPoint.x) * t;
    const y = anchorPoint.y + (candyPoint.y - anchorPoint.y) * t;
    const p = makePoint(x, y);
    points.push(p);
    world.points.push(p);
  }
  // Constraints: anchor → p[0] → p[1] → ... → p[n-1] → candy.
  const allPts = [anchorPoint, ...points, candyPoint];
  for (let i = 0; i < allPts.length - 1; i++) {
    world.constraints.push(makeConstraint(allPts[i], allPts[i + 1], segLen));
  }
  // Visual: a TubeGeometry refit every frame from current point positions.
  const ropeMat = new THREE.MeshStandardMaterial({
    color: palette.rope, roughness: 0.7, metalness: 0.0,
  });
  let mesh = null;
  let curveTmp = new THREE.CatmullRomCurve3([]);

  function rebuild() {
    if (mesh) {
      mesh.geometry.dispose();
      mesh.parent && mesh.parent.remove(mesh);
    }
    // Detect whether the chain is still attached: walk from anchor along
    // alive constraints; if we don't reach the candy, the rope is "cut"
    // and we render whatever stub remains.
    const alivePts = walkAliveChain(world, anchorPoint, candyPoint);
    if (alivePts.length < 2) { mesh = null; return; }
    const v3s = alivePts.map((p) => new THREE.Vector3(p.x, p.y, 0));
    curveTmp.points = v3s;
    const geo = new THREE.TubeGeometry(curveTmp, Math.max(8, alivePts.length * 2), 0.045, 6, false);
    mesh = new THREE.Mesh(geo, ropeMat);
  }

  return {
    points,
    rebuild,
    get mesh() { return mesh; },
    materials: [ropeMat],
    dispose() {
      if (mesh) mesh.geometry.dispose();
      ropeMat.dispose();
    },
  };
}

function walkAliveChain(world, start, end) {
  // Follow alive constraints from `start` until we hit `end` or a dead
  // edge. Robust enough for our linear chains; not a generic graph walk.
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

/* ── Star ──────────────────────────────────────────────────────────── */
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

  return {
    state: { x: def.x, y: def.y, taken: false, t: Math.random() * Math.PI },
    mesh,
    materials: [mat],
    update(dt) {
      this.state.t += dt;
      mesh.rotation.z = Math.sin(this.state.t * 1.6) * 0.15;
      mesh.scale.setScalar(1.0 + Math.sin(this.state.t * 2.2) * 0.04);
    },
    take() {
      this.state.taken = true;
      mesh.visible = false;
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

/* ── Target (Mochi) ───────────────────────────────────────────────── */
export function makeTarget(palette, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: palette.target, roughness: 0.6, metalness: 0.0,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: palette.targetBelly, roughness: 0.5, metalness: 0.0,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x110d10 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 18), bodyMat);
  body.scale.set(1.05, 0.95, 0.85);
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 16), bellyMat);
  belly.scale.set(0.95, 0.65, 0.5);
  belly.position.set(0, 0.1, 0.32);
  group.add(belly);

  // Two ear-tufts.
  const earGeo = new THREE.SphereGeometry(0.16, 14, 10);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(-0.32, -0.42, 0.05);
  earL.scale.set(0.9, 1.2, 0.9);
  const earR = earL.clone();
  earR.position.x = 0.32;
  group.add(earL); group.add(earR);

  // Eyes.
  const eyeGeo = new THREE.SphereGeometry(0.08, 12, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.18, -0.08, 0.5);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  group.add(eyeL); group.add(eyeR);

  // Mouth — a stretched dark cap that we scale up on chomp.
  const mouthGeo = new THREE.SphereGeometry(0.18, 14, 10);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1c1218 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.scale.set(0.8, 0.35, 0.2);
  mouth.position.set(0, 0.18, 0.55);
  group.add(mouth);

  let elapsed = 0;
  let phase = 'idle';                   // idle | anticipate | chomp | sad
  let phaseT = 0;

  return {
    pos: { x: def.x, y: def.y },
    mesh: group,
    materials: [bodyMat, bellyMat, eyeMat, mouthMat],
    setPhase(next) { if (phase !== next) { phase = next; phaseT = 0; } },
    update(dt, candyPos) {
      elapsed += dt; phaseT += dt;
      // Idle bob.
      const bob = Math.sin(elapsed * 1.7) * 0.05;
      group.position.set(def.x, def.y + bob, 0);

      // Anticipate: mouth-open if candy is within 1.6u and falling.
      if (candyPos) {
        const dx = candyPos.x - def.x;
        const dy = candyPos.y - def.y;
        const d = Math.hypot(dx, dy);
        if (phase === 'idle' && d < 1.6 && dy < -0.05) this.setPhase('anticipate');
        if (phase === 'anticipate' && d > 2.2) this.setPhase('idle');
        // Eye tracking.
        const targetEyeX = Math.max(-0.04, Math.min(0.04, dx * 0.04));
        const targetEyeY = Math.max(-0.03, Math.min(0.03, dy * 0.03));
        eyeL.position.x = -0.18 + targetEyeX;
        eyeR.position.x =  0.18 + targetEyeX;
        eyeL.position.y = -0.08 + targetEyeY;
        eyeR.position.y = -0.08 + targetEyeY;
      }

      // Mouth state.
      let mouthSx = 0.8, mouthSy = 0.35;
      if (phase === 'anticipate') {
        mouthSx = 0.85; mouthSy = 0.55 + Math.min(0.3, phaseT * 0.6);
      } else if (phase === 'chomp') {
        const k = Math.min(1, phaseT / 0.22);
        mouthSy = 0.35 + (1 - k) * 0.7;
      } else if (phase === 'sad') {
        mouthSy = 0.18;
      }
      mouth.scale.set(mouthSx, mouthSy, 0.2);
    },
    dispose() {
      body.geometry.dispose(); belly.geometry.dispose();
      earGeo.dispose(); eyeGeo.dispose(); mouthGeo.dispose();
      bodyMat.dispose(); bellyMat.dispose();
      eyeMat.dispose(); mouthMat.dispose();
    },
  };
}

/* ── Bubble (mechanic) ─────────────────────────────────────────────── */
export function makeBubble(def) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xcfeaff, roughness: 0.05, metalness: 0.0,
    transparent: true, opacity: 0.45,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 24, 18), mat);
  mesh.position.set(def.x, def.y, 0);

  return {
    state: { x: def.x, y: def.y, r: def.radius, alive: true, attached: null },
    mesh,
    materials: [mat],
    update(dt) {
      const t = performance.now() / 800;
      mesh.scale.setScalar(1 + Math.sin(t) * 0.04);
    },
    pop() {
      this.state.alive = false;
      mesh.visible = false;
      if (this.state.attached) {
        this.state.attached.bubbled = false;
        this.state.attached = null;
      }
    },
    attach(point) {
      if (!this.state.alive) return;
      this.state.attached = point;
      point.bubbled = true;
    },
    follow(point) {
      // Bubble visually follows the bubbled candy.
      mesh.position.set(point.x, point.y, 0);
    },
    dispose() { mesh.geometry.dispose(); mat.dispose(); },
  };
}

/* ── Blower (mechanic) ─────────────────────────────────────────────── */
export function makeBlower(def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);
  const angle = Math.atan2(def.dirY, def.dirX);
  group.rotation.z = angle;

  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x9aa7b3, roughness: 0.4, metalness: 0.6,
  });
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 18), nozzleMat);
  nozzle.rotation.z = -Math.PI / 2;
  nozzle.position.x = -0.05;
  group.add(nozzle);

  // Force-cone visual: a faint additive plane stretched in the force dir.
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffe6b3, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const cone = new THREE.Mesh(new THREE.PlaneGeometry(def.length, def.radius * 2), coneMat);
  cone.position.x = def.length / 2;
  group.add(cone);

  return {
    def: { ...def, nx: Math.cos(angle), ny: Math.sin(angle) },
    mesh: group,
    materials: [nozzleMat, coneMat],
    apply(point) {
      // Project (point - def) onto the force direction; ignore if outside
      // the rectangular cone.
      const px = point.x - def.x;
      const py = point.y - def.y;
      const t = px * this.def.nx + py * this.def.ny;
      if (t < 0 || t > def.length) return;
      const perpX = px - t * this.def.nx;
      const perpY = py - t * this.def.ny;
      const perpDist = Math.hypot(perpX, perpY);
      if (perpDist > def.radius) return;
      // Falloff along the cone.
      const fall = (1 - t / def.length) * (1 - perpDist / def.radius);
      point.forceX += this.def.nx * def.force * fall;
      point.forceY += this.def.ny * def.force * fall;
    },
    update() {
      coneMat.opacity = 0.16 + Math.sin(performance.now() / 220) * 0.04;
    },
    dispose() {
      nozzle.geometry.dispose(); cone.geometry.dispose();
      nozzleMat.dispose(); coneMat.dispose();
    },
  };
}

/* ── Spike (hazard) ────────────────────────────────────────────────── */
export function makeSpike(def) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x5a6a7a, roughness: 0.4, metalness: 0.5,
  });
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);
  // Six triangular spikes spanning width w, each pointing -y (toward
  // the candy). Negative-Y is screen-up here.
  const N = Math.max(3, Math.round(def.w / 0.28));
  const spikeW = def.w / N;
  for (let i = 0; i < N; i++) {
    const pts = [
      new THREE.Vector2(i * spikeW - def.w / 2, def.h / 2),
      new THREE.Vector2((i + 1) * spikeW - def.w / 2, def.h / 2),
      new THREE.Vector2((i + 0.5) * spikeW - def.w / 2, -def.h / 2),
    ];
    const sh = new THREE.Shape(pts);
    const g = new THREE.ShapeGeometry(sh);
    const m = new THREE.Mesh(g, mat);
    group.add(m);
  }

  return {
    def,
    mesh: group,
    materials: [mat],
    contains(px, py) {
      return px > def.x - def.w / 2 && px < def.x + def.w / 2 &&
             py > def.y - def.h / 2 && py < def.y + def.h / 2;
    },
    dispose() {
      group.traverse((o) => o.geometry?.dispose());
      mat.dispose();
    },
  };
}
