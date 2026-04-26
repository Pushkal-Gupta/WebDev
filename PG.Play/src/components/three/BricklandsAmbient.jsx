// BricklandsAmbient — bespoke 3D backdrop for the Bricklands intro page.
//
// Theme: a tasteful platformer "world above the clouds" — a few floating
// geometric blocks (the brick motif), drifting coin orbs, soft cloud
// strips. Bright but tasteful: gold + warm pink + sky blue. Sits behind
// the SVG cover.

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BLOCK_COUNT = 8;
const COIN_COUNT  = 14;
const CLOUD_COUNT = 4;

const COLOR_BLOCK_A = new THREE.Color('#f6c93a');  // gold brick
const COLOR_BLOCK_B = new THREE.Color('#ff5cb6');  // accent pink brick
const COLOR_COIN    = new THREE.Color('#ffe14f');  // bright coin
const COLOR_CLOUD   = new THREE.Color('#ffd6e0');  // pale pink cloud
const COLOR_SKY     = new THREE.Color('#7fd0ff');  // sky strip

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function FloatingBlocks() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(431);
    return Array.from({ length: BLOCK_COUNT }, () => {
      const t = rand();
      return {
        x: (rand() - 0.5) * 9,
        y: (rand() - 0.5) * 5,
        z: -2 - rand() * 5,
        scale: 0.55 + rand() * 0.55,
        phase: rand() * Math.PI * 2,
        speed: 0.25 + rand() * 0.30,
        rotSpeed: (rand() - 0.5) * 0.30,
        tint: COLOR_BLOCK_A.clone().lerp(COLOR_BLOCK_B, t),
      };
    });
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((it, i) => m.setColorAt(i, it.tint));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const yOff = Math.sin(t * it.speed + it.phase) * 0.32;
      dummy.position.set(it.x, it.y + yOff, it.z);
      dummy.rotation.set(0, t * it.rotSpeed, 0);
      const s = it.scale;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, BLOCK_COUNT]}>
      <boxGeometry args={[0.9, 0.9, 0.9]}/>
      <meshBasicMaterial
        transparent
        opacity={0.34}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function FloatingCoins() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(719);
    return Array.from({ length: COIN_COUNT }, () => ({
      x: (rand() - 0.5) * 10,
      y: (rand() - 0.5) * 6,
      z: -1 - rand() * 5,
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 0.5,
      spinSpeed: 1.4 + rand() * 1.0,
      scale: 0.18 + rand() * 0.12,
    }));
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((_, i) => m.setColorAt(i, COLOR_COIN));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const bob = Math.sin(t * it.speed + it.phase) * 0.22;
      dummy.position.set(it.x, it.y + bob, it.z);
      // Coin spin around Y; thin Z scale fakes a coin profile.
      dummy.rotation.set(0, t * it.spinSpeed + it.phase, 0);
      const s = it.scale;
      dummy.scale.set(s, s, s * 0.18);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COIN_COUNT]}>
      <cylinderGeometry args={[1, 1, 1, 12]}/>
      <meshBasicMaterial
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function CloudStrips() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(173);
    return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
      x: (rand() - 0.5) * 8,
      y: -2 + i * 1.1 + (rand() - 0.5) * 0.8,
      z: -7 - rand() * 3,
      scale: 1.6 + rand() * 1.4,
      drift: 0.10 + rand() * 0.10,
      phase: rand() * Math.PI * 2,
      tint: COLOR_CLOUD.clone().lerp(COLOR_SKY, rand() * 0.4),
    }));
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((it, i) => m.setColorAt(i, it.tint));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const xOff = Math.sin(t * it.drift + it.phase) * 1.4;
      dummy.position.set(it.x + xOff, it.y, it.z);
      dummy.rotation.set(0, 0, 0);
      const s = it.scale;
      dummy.scale.set(s * 1.6, s * 0.5, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, CLOUD_COUNT]}>
      <planeGeometry args={[1, 1, 1, 1]}/>
      <meshBasicMaterial
        transparent
        opacity={0.20}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

export default function BricklandsAmbient() {
  return (
    <div className="ambient3d" aria-hidden="true" data-bespoke="bricklands">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <CloudStrips/>
        <FloatingBlocks/>
        <FloatingCoins/>
      </Canvas>
    </div>
  );
}
