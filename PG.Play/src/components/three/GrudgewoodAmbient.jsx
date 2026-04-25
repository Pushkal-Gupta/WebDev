// GrudgewoodAmbient — bespoke 3D backdrop for the Grudgewood intro.
//
// A treeline at dusk: 7 conical trees stand along a horizon, each ringed
// by a faint emerald aura. They sway a few degrees on Z with a sin offset
// (slow seconds-scale wind). Above them, 18 amber leaf shards fall and
// drift; below, a single low-opacity fog plane bleeds up off the ground.
//
// Performance: two instancedMesh (trees + leaves), one mesh for auras
// (also instanced), one quad for fog. All meshBasicMaterial, additive
// blend, depthWrite off. Total instance count = 7 + 7 + 18 + 1 = 33,
// inside the 35-instance ceiling. No lights, no shadow maps.

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TREE_COUNT  = 7;
const LEAF_COUNT  = 18;

const TRUNK_COLOR_A = new THREE.Color('#1e4d3a');
const TRUNK_COLOR_B = new THREE.Color('#2a6b54');
const AURA_COLOR    = new THREE.Color('#3da37a');
const LEAF_COLOR    = new THREE.Color('#ff9a3c');
const FOG_COLOR     = new THREE.Color('#1e4d3a');

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function Trees() {
  const trunkRef = useRef(null);
  const auraRef  = useRef(null);
  const dummy    = useMemo(() => new THREE.Object3D(), []);

  // Stable per-tree layout. Trees are spread along x with varying depth
  // and height. Phases are seeded so wind sway differs per tree.
  const items = useMemo(() => {
    const rand = seedRand(101);
    return Array.from({ length: TREE_COUNT }, (_, i) => {
      const t = rand();
      // Distribute roughly evenly across the horizon, with a small jitter.
      const baseX = ((i / (TREE_COUNT - 1)) - 0.5) * 9.5;
      const jitterX = (rand() - 0.5) * 0.9;
      return {
        x: baseX + jitterX,
        y: -1.6,                                // base sits near the ground line
        z: -3 - rand() * 4.5,                   // depth 3..7.5
        height: 2.4 + rand() * 1.8,             // 2.4..4.2
        radius: 0.32 + rand() * 0.18,           // 0.32..0.50
        phase: rand() * Math.PI * 2,
        swaySpeed: 0.35 + rand() * 0.25,        // slow, seconds-scale
        swayAmp: 0.04 + rand() * 0.05,          // a few degrees, in radians
        tint: TRUNK_COLOR_A.clone().lerp(TRUNK_COLOR_B, t),
      };
    });
  }, []);

  // Apply per-instance colours once.
  useEffect(() => {
    const m = trunkRef.current;
    if (m) {
      items.forEach((it, i) => m.setColorAt(i, it.tint));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    const a = auraRef.current;
    if (a) {
      items.forEach((_, i) => a.setColorAt(i, AURA_COLOR));
      if (a.instanceColor) a.instanceColor.needsUpdate = true;
    }
  }, [items]);

  useFrame((state) => {
    const m = trunkRef.current;
    const a = auraRef.current;
    if (!m || !a) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      // Sway is a small Z-axis rotation; pivot is the base, so we offset
      // the cone up by half its height before rotation.
      const sway = Math.sin(t * it.swaySpeed + it.phase) * it.swayAmp;
      const cy = it.y + it.height * 0.5;

      dummy.position.set(it.x, cy, it.z);
      dummy.rotation.set(0, 0, sway);
      dummy.scale.set(it.radius, it.height * 0.5, it.radius);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);

      // Aura is a wider, taller, faint copy of the same silhouette.
      const auraR = it.radius * 2.6;
      const auraH = it.height * 0.55;
      dummy.scale.set(auraR, auraH, auraR);
      dummy.updateMatrix();
      a.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    a.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Faint emerald aura around each tree. Drawn first so trunks sit on top. */}
      <instancedMesh ref={auraRef} args={[null, null, TREE_COUNT]} renderOrder={0}>
        <coneGeometry args={[1, 2, 10, 1]}/>
        <meshBasicMaterial
          color={AURA_COLOR}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}/>
      </instancedMesh>

      {/* Solid-ish tree silhouettes. Still additive + low alpha for the
          brooding bleed; trees sit closer to camera than the aura. */}
      <instancedMesh ref={trunkRef} args={[null, null, TREE_COUNT]} renderOrder={1}>
        <coneGeometry args={[1, 2, 8, 1]}/>
        <meshBasicMaterial
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}/>
      </instancedMesh>
    </group>
  );
}

function Leaves() {
  const meshRef = useRef(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  // Each leaf has a starting position, fall speed, drift amplitude, and
  // an independent phase. A modulo on (t * speed - phase) gives a cyclic
  // fall without ever calling Math.random in useFrame.
  const items = useMemo(() => {
    const rand = seedRand(307);
    return Array.from({ length: LEAF_COUNT }, () => ({
      x:        (rand() - 0.5) * 10,
      yTop:     2.4 + rand() * 1.4,
      yBottom: -1.8,
      z:       -1 - rand() * 6,
      fallSpeed: 0.18 + rand() * 0.18,            // 0.18..0.36 units/sec, slow
      driftAmp:  0.35 + rand() * 0.45,
      driftFreq: 0.4 + rand() * 0.5,
      phase:     rand() * 100,
      spin:      (rand() - 0.5) * 0.6,
      scale:     0.07 + rand() * 0.07,
    }));
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((_, i) => m.setColorAt(i, LEAF_COLOR));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const span = it.yTop - it.yBottom;
      // Cyclic fall — mod into [0, span], subtract from yTop.
      const travelled = ((t + it.phase) * it.fallSpeed) % span;
      const y = it.yTop - travelled;
      const x = it.x + Math.sin(t * it.driftFreq + it.phase) * it.driftAmp;
      dummy.position.set(x, y, it.z);
      dummy.rotation.set(0, 0, t * it.spin + it.phase);
      dummy.scale.set(it.scale, it.scale, it.scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, LEAF_COUNT]} renderOrder={2}>
      {/* Triangle = a flat tetrahedron face. tetra(0) is cheapest 3-vert geom. */}
      <tetrahedronGeometry args={[1, 0]}/>
      <meshBasicMaterial
        color={LEAF_COLOR}
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function GroundFog() {
  // A single low horizontal-ish quad at the bottom, additive emerald.
  // Tilted slightly so it reads as ground haze, not a wall.
  return (
    <mesh position={[0, -2.2, -2]} rotation={[-Math.PI / 2.4, 0, 0]} renderOrder={0}>
      <planeGeometry args={[14, 3.2]}/>
      <meshBasicMaterial
        color={FOG_COLOR}
        transparent
        opacity={0.32}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </mesh>
  );
}

export default function GrudgewoodAmbient() {
  return (
    <div className="ambient3d" aria-hidden="true" data-genre="grudgewood">
      <Canvas
        camera={{ position: [0, 0.2, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <GroundFog/>
        <Trees/>
        <Leaves/>
      </Canvas>
    </div>
  );
}
