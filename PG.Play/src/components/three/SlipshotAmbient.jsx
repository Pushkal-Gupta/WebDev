// SlipshotAmbient — bespoke 3D backdrop for the SLIPSHOT FPS intro.
//
// Low-poly arena fragments tumbling in space: 10 angular polyhedra
// (alternating tetra + octa) tinted magenta with rare warm-orange sparks,
// rotating at independent seeded speeds, plus 2 longer rectangular tracer
// beams streaking diagonally that fade in/out on a ~2.5s cadence.
//
// Performance: two instancedMesh for shapes (tetra/octa) + one instancedMesh
// for tracers + one backdrop mesh. All meshBasicMaterial, additive,
// depthWrite off. Total instances: 5 + 5 + 2 = 12.

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TETRA_COUNT  = 5;
const OCTA_COUNT   = 5;
const TRACER_COUNT = 2;
const TRACER_PERIOD = 2.5;        // seconds between streaks per tracer

const MAGENTA = new THREE.Color('#ff5cb6');
const ORANGE  = new THREE.Color('#ff9a3c');
const WHITE   = new THREE.Color('#ffffff');
const DEEP    = new THREE.Color('#1a0420');

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function makeShapeItems(count, seed) {
  const rand = seedRand(seed);
  return Array.from({ length: count }, () => {
    const isAccent = rand() < 0.18;
    return {
      x: (rand() - 0.5) * 7,
      y: (rand() - 0.5) * 5,
      z: -1 - rand() * 5,
      rx: rand() * Math.PI,
      ry: rand() * Math.PI,
      rz: rand() * Math.PI,
      rotSpeedX: (rand() - 0.5) * 0.6,
      rotSpeedY: (rand() - 0.5) * 0.6,
      rotSpeedZ: (rand() - 0.5) * 0.4,
      phase: rand() * Math.PI * 2,
      driftFreq: 0.2 + rand() * 0.25,
      driftAmp:  0.18 + rand() * 0.22,
      scale: 0.35 + rand() * 0.45,
      tint: isAccent ? ORANGE : MAGENTA.clone().lerp(WHITE, rand() * 0.25),
    };
  });
}

function Shapes({ count, seed, kind }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const items = useMemo(() => makeShapeItems(count, seed), [count, seed]);

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
      const yOff = Math.sin(t * it.driftFreq + it.phase) * it.driftAmp;
      const xOff = Math.cos(t * it.driftFreq * 0.6 + it.phase) * it.driftAmp * 0.7;
      dummy.position.set(it.x + xOff, it.y + yOff, it.z);
      dummy.rotation.set(
        it.rx + t * it.rotSpeedX,
        it.ry + t * it.rotSpeedY,
        it.rz + t * it.rotSpeedZ,
      );
      const s = it.scale;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  const geom = kind === 'tetra'
    ? <tetrahedronGeometry args={[1, 0]}/>
    : <octahedronGeometry args={[1, 0]}/>;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      {geom}
      <meshBasicMaterial
        transparent
        opacity={0.42}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function Tracers() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(881);
    return Array.from({ length: TRACER_COUNT }, (_, i) => ({
      // Diagonals across the scene, opposite directions.
      angle: (i === 0 ? 1 : -1) * (Math.PI / 6 + rand() * 0.2),
      yBase: (rand() - 0.5) * 2.5,
      z: -1.8 - rand() * 1.2,
      // Stagger streaks so the two tracers don't fire simultaneously.
      offset: i * (TRACER_PERIOD * 0.55),
      length: 5.5 + rand() * 1.5,
      thickness: 0.04 + rand() * 0.02,
    }));
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    items.forEach((_, i) => m.setColorAt(i, WHITE));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      // Streak phase u in [0,1) within each TRACER_PERIOD.
      const u = (((t + it.offset) % TRACER_PERIOD) / TRACER_PERIOD);
      // Travel from one side to the other, fading at both ends.
      const travel = (u - 0.5) * 12;     // -6..+6 along the angle
      const cx = Math.cos(it.angle) * travel;
      const cy = Math.sin(it.angle) * travel + it.yBase;
      // Triangle-window fade: peak at u=0.5, zero at edges. Squared for
      // a snappier in/out.
      const fade = Math.max(0, 1 - Math.abs(u - 0.5) * 2);
      const alpha = fade * fade;
      // Magenta-to-white tint: shift colour by alpha (more white at peak).
      const col = MAGENTA.clone().lerp(WHITE, 0.4 + alpha * 0.6);
      m.setColorAt(i, col);

      dummy.position.set(cx, cy, it.z);
      dummy.rotation.set(0, 0, it.angle);
      // Squash scale by alpha so the bar disappears entirely between streaks.
      dummy.scale.set(it.length * (0.4 + alpha * 0.6), it.thickness * (0.5 + alpha * 0.5), 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, TRACER_COUNT]} renderOrder={3}>
      <planeGeometry args={[1, 1]}/>
      <meshBasicMaterial
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function Backdrop() {
  // Deep magenta-to-black radial fade approximated as a single quad with
  // additive magenta on top of the page's black; placed deep so shapes
  // sit in front. Not additive — we want it to subtly darken/tint.
  return (
    <mesh position={[0, 0, -7]} renderOrder={-1}>
      <planeGeometry args={[18, 12]}/>
      <meshBasicMaterial
        color={DEEP}
        transparent
        opacity={0.55}
        depthWrite={false}
        toneMapped={false}/>
    </mesh>
  );
}

export default function SlipshotAmbient() {
  return (
    <div className="ambient3d" aria-hidden="true" data-genre="slipshot">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <Backdrop/>
        <Shapes count={TETRA_COUNT} seed={313} kind="tetra"/>
        <Shapes count={OCTA_COUNT}  seed={727} kind="octa"/>
        <Tracers/>
      </Canvas>
    </div>
  );
}
