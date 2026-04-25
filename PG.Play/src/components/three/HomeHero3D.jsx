// HomeHero3D — slow-drifting cluster of glassy capsules behind the lobby hero.
//
// Lazy-loaded so the homepage's first paint doesn't pay for r3f. Sits at
// position:absolute behind the typography, additive blending so the brand
// bloom underneath bleeds through. ~32 instances of a single geometry
// (instanced mesh) → cheap on integrated GPUs.
//
// Mouse parallax is sampled at the canvas level and translated into a
// gentle camera offset; no per-frame DOM reads.

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 32;
const COLOR_A = new THREE.Color('#00fff5');
const COLOR_B = new THREE.Color('#ff5cb6');

function seedRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Capsules({ pointer }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate a stable layout once. Each capsule has a base position,
  // base rotation, drift phase, and a colour tint blended between the
  // two brand colours.
  const items = useMemo(() => {
    const rand = seedRand(7);
    return Array.from({ length: COUNT }, (_, i) => {
      const t = rand();
      return {
        x: (rand() - 0.5) * 14,
        y: (rand() - 0.5) * 8,
        z: -2 - rand() * 9,
        rx: rand() * Math.PI,
        ry: rand() * Math.PI,
        rz: rand() * Math.PI,
        phase: rand() * Math.PI * 2,
        speed: 0.3 + rand() * 0.4,
        scale: 0.6 + rand() * 0.7,
        tint: COLOR_A.clone().lerp(COLOR_B, t),
        rotSpeed: (rand() - 0.5) * 0.15,
      };
    });
  }, []);

  // Apply per-instance colour once.
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((it, i) => m.setColorAt(i, it.tint));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state, dt) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      // Slow vertical drift with phase offset.
      const yOff = Math.sin(t * it.speed + it.phase) * 0.45;
      const xOff = Math.cos(t * it.speed * 0.6 + it.phase) * 0.25;
      dummy.position.set(it.x + xOff, it.y + yOff, it.z);
      dummy.rotation.set(
        it.rx + t * it.rotSpeed,
        it.ry + t * it.rotSpeed * 0.7,
        it.rz,
      );
      const s = it.scale;
      dummy.scale.set(s, s, s * 0.18);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;

    // Camera parallax — clamp pointer to ±1, ease into the offset so it
    // never feels jittery.
    const cam = state.camera;
    const targetX = pointer.current.x * 0.7;
    const targetY = pointer.current.y * 0.4;
    cam.position.x += (targetX - cam.position.x) * Math.min(1, dt * 3);
    cam.position.y += (targetY - cam.position.y) * Math.min(1, dt * 3);
    cam.lookAt(0, 0, -4);
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <boxGeometry args={[1, 1.2, 1, 1, 1, 1]}/>
      <meshBasicMaterial
        transparent
        opacity={0.32}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

export default function HomeHero3D() {
  // Pointer lives in a ref so we don't re-render the Canvas on each move.
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div className="hero3d" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <Capsules pointer={pointer}/>
      </Canvas>
    </div>
  );
}
