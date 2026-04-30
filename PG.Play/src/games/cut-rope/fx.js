// Cut the Rope — particle FX layer. Tiny stand-alone module: the
// gameplay loop spawns bursts at events, and ticks the system each
// frame. Particles dispose themselves when their lifetime ends.

import * as THREE from 'three';

const particles = [];

const SPARKLE_GEO = new THREE.PlaneGeometry(0.18, 0.18);
const CONFETTI_GEOS = [
  new THREE.PlaneGeometry(0.18, 0.10),
  new THREE.PlaneGeometry(0.10, 0.18),
];
const CONFETTI_COLORS = [0xff6e84, 0xffd24a, 0x7fb88a, 0x9bd6ff, 0xffae33, 0xc7a6e2];

export function spawnStarBurst(scene, x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 1.4 + Math.random() * 1.6;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe07a, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(SPARKLE_GEO, mat);
    mesh.position.set(x, y, 0.05);
    mesh.rotation.z = Math.random() * Math.PI;
    scene.add(mesh);
    particles.push({
      mesh, mat,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gy: 4,
      spin: (Math.random() - 0.5) * 6,
      life: 0,
      ttl: 0.45 + Math.random() * 0.2,
    });
  }
}

export function spawnConfetti(scene, x, y) {
  for (let i = 0; i < 24; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = 2.6 + Math.random() * 2.2;
    const geo = CONFETTI_GEOS[i & 1];
    const mat = new THREE.MeshBasicMaterial({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      transparent: true, opacity: 1, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + (Math.random() - 0.5) * 0.4, y, 0.05);
    mesh.rotation.z = Math.random() * Math.PI;
    scene.add(mesh);
    particles.push({
      mesh, mat,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      gy: 9,
      spin: (Math.random() - 0.5) * 12,
      life: 0,
      ttl: 1.2 + Math.random() * 0.6,
    });
  }
}

export function tickFx(dt, scene) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.ttl) {
      scene.remove(p.mesh);
      p.mat.dispose();
      particles.splice(i, 1);
      continue;
    }
    // Drag + gravity (positive Y is "down" in our convention).
    p.vx *= 0.98;
    p.vy = p.vy * 0.985 + p.gy * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.rotation.z += p.spin * dt;
    const k = 1 - p.life / p.ttl;
    p.mat.opacity = k;
  }
}

export function disposeAllFx(scene) {
  for (const p of particles) {
    scene.remove(p.mesh);
    p.mat.dispose();
  }
  particles.length = 0;
}
