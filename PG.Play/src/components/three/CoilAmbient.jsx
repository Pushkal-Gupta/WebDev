// CoilAmbient — bespoke 3D backdrop for the Coil snake intro.
//
// An abstract neon ribbon dimension. One large slow-curling ribbon path
// expressed as a stripe of small instanced planes following a parametric
// 3D Lissajous-ish curve, plus two fainter background ribbons parallaxed
// deeper, plus 14 floating glow orbs drifting in 3D.
//
// Performance: three instancedMesh for ribbons (segments) + one instancedMesh
// for orbs. All meshBasicMaterial, additive, depthWrite off.
// Total instances = 14 (orbs) + 14 (main ribbon) + 7 + 7 (back) = 42 segments
// total but main scene visible body = orbs(14) + main ribbon(14) = 28; both
// background ribbons are deep + faint. Frame cost ~ Grudgewood.

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ORB_COUNT       = 14;
const RIBBON_MAIN     = 14;
const RIBBON_BACK_A   = 7;
const RIBBON_BACK_B   = 7;

const CYAN     = new THREE.Color('#00fff5');
const BLUE     = new THREE.Color('#3a8dff');
const MAGENTA  = new THREE.Color('#ff5cb6');

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// A parametric ribbon path. u in [0,1]; returns a 3D position. Animation
// is achieved by adding `t * speed` to u when computing.
function ribbonPoint(u, scaleX, scaleY, scaleZ, twist) {
  const a = u * Math.PI * 2;
  return [
    Math.sin(a * 1.0 + twist) * scaleX,
    Math.cos(a * 0.6 + twist * 0.7) * scaleY,
    Math.sin(a * 1.3 + twist * 0.4) * scaleZ,
  ];
}

function Ribbon({ segCount, scaleX, scaleY, scaleZ, depth, opacity, speed, color, accent, seed }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(seed);
    return Array.from({ length: segCount }, (_, i) => {
      const u = i / segCount;
      const edge = (i === 0 || i === segCount - 1) ? 1 : 0;
      return {
        u,
        edge,
        wobble: rand() * Math.PI * 2,
        size: 0.22 + rand() * 0.10,
        tint: edge ? accent : color.clone().lerp(accent, rand() * 0.25),
      };
    });
  }, [segCount, color, accent, seed]);

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
    const twist = t * speed;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const [x, y, z] = ribbonPoint(it.u + t * speed * 0.05, scaleX, scaleY, scaleZ, twist);
      const w = Math.sin(t * 0.6 + it.wobble) * 0.08;
      dummy.position.set(x, y + w, z + depth);
      dummy.rotation.set(t * 0.05 + it.wobble, t * 0.07, t * 0.03 + it.wobble * 0.5);
      const s = it.size;
      dummy.scale.set(s, s * 0.45, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, segCount]}>
      <planeGeometry args={[1, 1]}/>
      <meshBasicMaterial
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}/>
    </instancedMesh>
  );
}

function Orbs() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(617);
    return Array.from({ length: ORB_COUNT }, () => {
      const t = rand();
      const isAccent = rand() < 0.18;
      return {
        x: (rand() - 0.5) * 8,
        y: (rand() - 0.5) * 5,
        z: -1 - rand() * 5,
        phase: rand() * Math.PI * 2,
        driftFreq: 0.18 + rand() * 0.22,
        driftAmp:  0.25 + rand() * 0.4,
        scale: 0.10 + rand() * 0.18,
        tint: isAccent ? MAGENTA : CYAN.clone().lerp(BLUE, t),
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
      const yOff = Math.sin(t * it.driftFreq + it.phase) * it.driftAmp;
      const xOff = Math.cos(t * it.driftFreq * 0.7 + it.phase) * it.driftAmp * 0.6;
      dummy.position.set(it.x + xOff, it.y + yOff, it.z);
      dummy.rotation.set(0, 0, 0);
      const s = it.scale;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, ORB_COUNT]}>
      <sphereGeometry args={[1, 12, 12]}/>
      <meshBasicMaterial
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

export default function CoilAmbient() {
  return (
    <div className="ambient3d" aria-hidden="true" data-genre="coil">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        {/* Two fainter background ribbons parallaxed deeper */}
        <Ribbon
          segCount={RIBBON_BACK_A} scaleX={3.4} scaleY={2.0} scaleZ={1.4}
          depth={-5.5} opacity={0.18} speed={0.05}
          color={BLUE} accent={CYAN} seed={211}/>
        <Ribbon
          segCount={RIBBON_BACK_B} scaleX={2.8} scaleY={1.6} scaleZ={1.2}
          depth={-4.2} opacity={0.18} speed={0.08}
          color={CYAN} accent={BLUE} seed={433}/>
        <Orbs/>
        {/* Foreground main ribbon: cyan body, magenta accents at edges */}
        <Ribbon
          segCount={RIBBON_MAIN} scaleX={2.6} scaleY={1.4} scaleZ={1.0}
          depth={-2.0} opacity={0.55} speed={0.12}
          color={CYAN} accent={MAGENTA} seed={97}/>
      </Canvas>
    </div>
  );
}
