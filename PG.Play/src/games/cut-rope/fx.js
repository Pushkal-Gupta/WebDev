// Snip — particle FX layer. Tiny stand-alone module: the gameplay loop
// spawns bursts at events and ticks the system each frame. Particles
// are SDF round dots rendered through a shared shader so they always
// look antialiased and crisp — never as a square plane with rotation.
// Confetti uses the same dot shape but in a wider color palette and
// with longer lifetime + gravity.

import * as THREE from 'three';

const particles = [];

const _unitGeo = new THREE.PlaneGeometry(2, 2);
const _vertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const _fragmentDot = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSoft;
  varying vec2 vUv;
  void main() {
    float r = length(vUv);
    float a = smoothstep(1.0, 1.0 - uSoft, r) * uOpacity;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

function makeDotMesh(color, scale, additive = false, soft = 0.18) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uSoft: { value: soft },
    },
    vertexShader: _vertex,
    fragmentShader: _fragmentDot,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(_unitGeo, mat);
  mesh.scale.set(scale, scale, 1);
  return { mesh, mat };
}

export function spawnStarBurst(scene, x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 1.6 + Math.random() * 1.4;
    const { mesh, mat } = makeDotMesh(0xfff0a8, 0.10 + Math.random() * 0.06, true, 0.5);
    mesh.position.set(x, y, 0.05);
    scene.add(mesh);
    particles.push({
      mesh, mat,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gy: 3.2,
      drag: 0.96,
      life: 0,
      ttl: 0.5 + Math.random() * 0.2,
      shrink: 1.6,
    });
  }
}

// Tiny puff at the cut location — bright, brief, no rotation.
export function spawnCutPuff(scene, x, y) {
  for (let i = 0; i < 7; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.9 + Math.random() * 1.4;
    const size = 0.06 + Math.random() * 0.05;
    const { mesh, mat } = makeDotMesh(0xfff5d0, size, true, 0.5);
    mesh.position.set(x, y, 0.04);
    scene.add(mesh);
    particles.push({
      mesh, mat,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gy: 4.0,
      drag: 0.94,
      life: 0,
      ttl: 0.30 + Math.random() * 0.10,
      shrink: 2.0,
    });
  }
}

const CONFETTI_COLORS = [0xff6e84, 0xffd24a, 0x7fb88a, 0x9bd6ff, 0xffae33, 0xc7a6e2];

export function spawnConfetti(scene, x, y) {
  for (let i = 0; i < 30; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
    const speed = 2.6 + Math.random() * 2.2;
    const c = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const { mesh, mat } = makeDotMesh(c, 0.08 + Math.random() * 0.06, false, 0.18);
    mesh.position.set(x + (Math.random() - 0.5) * 0.4, y, 0.05);
    scene.add(mesh);
    particles.push({
      mesh, mat,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      gy: 9,
      drag: 0.985,
      life: 0,
      ttl: 1.2 + Math.random() * 0.6,
      shrink: 0.0,
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
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gy * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    const k = 1 - p.life / p.ttl;
    p.mat.uniforms.uOpacity.value = k;
    if (p.shrink > 0) {
      const s = Math.max(0.001, k);
      p.mesh.scale.x *= 1 - p.shrink * dt * 0.3;
      p.mesh.scale.y *= 1 - p.shrink * dt * 0.3;
    }
  }
}

export function disposeAllFx(scene) {
  for (const p of particles) {
    scene.remove(p.mesh);
    p.mat.dispose();
  }
  particles.length = 0;
}
