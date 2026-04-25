// GoalboundAmbient — bespoke 3D backdrop for the Goalbound soccer intro.
//
// A pitch under stadium lights, abstracted: 7 horizontal pitch-lane
// stripes faintly across the bottom third, 5 ball-orbs drifting above,
// 4 cone fixtures rising from the bottom corners as stadium-light
// silhouettes, and 4 vertical light beams.
//
// Performance: 4 instancedMesh (stripes, orbs, fixtures, beams). All
// meshBasicMaterial, additive blend (except backdrop), depthWrite off.
// Total instances: 7 + 5 + 4 + 4 = 20.

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STRIPE_COUNT  = 7;
const ORB_COUNT     = 5;
const FIXTURE_COUNT = 4;
const BEAM_COUNT    = 4;

const AMBER   = new THREE.Color('#ffd24a');
const WARM    = new THREE.Color('#ffe9b3');
const NAVY    = new THREE.Color('#0c1a3a');

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function Stripes() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(53);
    return Array.from({ length: STRIPE_COUNT }, (_, i) => {
      const u = i / (STRIPE_COUNT - 1);
      return {
        y: -2.6 + u * 1.8,            // bottom third of view
        z: -2 - u * 1.5,
        thickness: 0.04 + (1 - u) * 0.05,
        opacity: 0.10 + u * 0.10,
        phase: rand() * Math.PI * 2,
      };
    });
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((_, i) => m.setColorAt(i, WARM));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const sway = Math.sin(t * 0.2 + it.phase) * 0.02;
      dummy.position.set(0, it.y + sway, it.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(14, it.thickness, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, STRIPE_COUNT]} renderOrder={0}>
      <planeGeometry args={[1, 1]}/>
      <meshBasicMaterial
        color={WARM}
        transparent
        opacity={0.18}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function BallOrbs() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(199);
    return Array.from({ length: ORB_COUNT }, () => {
      const t = rand();
      return {
        x: (rand() - 0.5) * 7,
        yBase: -0.4 + rand() * 1.6,
        z: -1.5 - rand() * 4,
        phase: rand() * Math.PI * 2,
        bobFreq: 0.25 + rand() * 0.25,
        bobAmp:  0.45 + rand() * 0.35,
        scale: 0.13 + rand() * 0.12,
        tint: AMBER.clone().lerp(WARM, t),
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
      // Up-and-back-down sin pattern for ball-orb arc.
      const y = it.yBase + Math.sin(t * it.bobFreq + it.phase) * it.bobAmp;
      const x = it.x + Math.cos(t * it.bobFreq * 0.5 + it.phase) * 0.25;
      dummy.position.set(x, y, it.z);
      dummy.rotation.set(0, 0, 0);
      const s = it.scale;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, ORB_COUNT]} renderOrder={2}>
      <sphereGeometry args={[1, 14, 14]}/>
      <meshBasicMaterial
        transparent
        opacity={0.62}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function Fixtures() {
  const fixtureRef = useRef(null);
  const beamRef    = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    // 4 fixtures: outer-left, mid-left, mid-right, outer-right; rising from bottom edge.
    const positions = [-5.2, -2.4, 2.4, 5.2];
    return positions.map((x, i) => ({
      x,
      y: -2.4,
      z: -2.5 - (i % 2) * 0.6,
      height: 0.9 + (i % 2) * 0.2,
      phase: i * 1.3,
    }));
  }, []);

  useEffect(() => {
    const f = fixtureRef.current;
    if (f) {
      items.forEach((_, i) => f.setColorAt(i, WARM));
      if (f.instanceColor) f.instanceColor.needsUpdate = true;
    }
    const b = beamRef.current;
    if (b) {
      items.forEach((_, i) => b.setColorAt(i, AMBER));
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
  }, [items]);

  useFrame((state) => {
    const f = fixtureRef.current;
    const b = beamRef.current;
    if (!f || !b) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      // Fixture: a small cone silhouette, dim warm-white.
      dummy.position.set(it.x, it.y + it.height * 0.5, it.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.32, it.height, 0.32);
      dummy.updateMatrix();
      f.setMatrixAt(i, dummy.matrix);

      // Beam: a tall thin cone above the fixture, additive amber, gently
      // breathing in width on a slow phase.
      const breathe = 0.85 + Math.sin(t * 0.4 + it.phase) * 0.12;
      dummy.position.set(it.x, it.y + it.height + 1.6, it.z + 0.1);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.95 * breathe, 3.2, 0.95);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);
    }
    f.instanceMatrix.needsUpdate = true;
    b.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Beams first, so fixtures sit on top visually. */}
      <instancedMesh ref={beamRef} args={[null, null, FIXTURE_COUNT]} renderOrder={1}>
        <coneGeometry args={[1, 1, 12, 1, true]}/>
        <meshBasicMaterial
          color={AMBER}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}/>
      </instancedMesh>

      <instancedMesh ref={fixtureRef} args={[null, null, FIXTURE_COUNT]} renderOrder={2}>
        <coneGeometry args={[1, 2, 6, 1]}/>
        <meshBasicMaterial
          color={WARM}
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}/>
      </instancedMesh>
    </group>
  );
}

function Backdrop() {
  // A single faint navy quad behind everything else, deep z. Not additive
  // so it darkens the canvas slightly; uses normal blending at low alpha.
  return (
    <mesh position={[0, 0, -7]} renderOrder={-1}>
      <planeGeometry args={[18, 12]}/>
      <meshBasicMaterial
        color={NAVY}
        transparent
        opacity={0.22}
        depthWrite={false}
        toneMapped={false}/>
    </mesh>
  );
}

export default function GoalboundAmbient() {
  return (
    <div className="ambient3d" aria-hidden="true" data-genre="goalbound">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <Backdrop/>
        <Stripes/>
        <Fixtures/>
        <BallOrbs/>
      </Canvas>
    </div>
  );
}
