// GameAmbient — slow-drifting genre-themed backdrop behind a game's
// intro cover. Each genre picks a primitive shape + a tint; the scene
// is otherwise identical, so costs stay flat across pages.
//
// Lazy-loaded by GameIntro so 3D is only paid for once a player lands
// on a game route.
//
// Dispatch order: gameId -> bespoke scene (lazy-loaded), else genre fallback.
// Bespoke scenes live next to this file so they share the lazy-load chunk
// boundary; the BESPOKE map declares which gameIds opt out of the generic
// per-genre scene.

import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Per-game bespoke ambient scenes. If a gameId appears here, GameAmbient
// renders this component instead of the genre-derived primitive scene.
// Each entry is its own dynamic import so unused bespoke scenes never ship
// in the GameAmbient chunk.
const BESPOKE = {
  grudgewood: lazy(() => import('./GrudgewoodAmbient.jsx')),
  slither:    lazy(() => import('./CoilAmbient.jsx')),
  goalbound:  lazy(() => import('./GoalboundAmbient.jsx')),
  slipshot:   lazy(() => import('./SlipshotAmbient.jsx')),
};

const GENRE_CONFIG = {
  action: {
    color: '#ff5cb6',
    color2: '#ff9a3c',
    geometry: 'tetra',  // angular
    count: 14,
    speed: 0.55,
  },
  arcade: {
    color: '#00fff5',
    color2: '#3a8dff',
    geometry: 'torus',  // ribbon-like
    count: 12,
    speed: 0.45,
  },
  sports: {
    color: '#ffd24a',
    color2: '#ff9a3c',
    geometry: 'sphere', // ball
    count: 16,
    speed: 0.50,
  },
  puzzle: {
    color: '#a78bfa',
    color2: '#62b8ff',
    geometry: 'cube',
    count: 12,
    speed: 0.35,
  },
};

const CAT_TO_GENRE = {
  Rage: 'action',  FPS: 'action',  Shooter: 'action',  Action: 'action',
  Arcade: 'arcade',
  Sports: 'sports',
  Puzzle: 'puzzle', Classic: 'puzzle',
};

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function Drifters({ config, accentA, accentB }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const rand = seedRand(config.geometry.charCodeAt(0) * 11);
    return Array.from({ length: config.count }, () => {
      const t = rand();
      return {
        x: (rand() - 0.5) * 8,
        y: (rand() - 0.5) * 6,
        z: -1 - rand() * 6,
        rx: rand() * Math.PI,
        ry: rand() * Math.PI,
        phase: rand() * Math.PI * 2,
        scale: 0.4 + rand() * 0.6,
        rotSpeed: (rand() - 0.5) * 0.4,
        tint: accentA.clone().lerp(accentB, t),
      };
    });
  }, [config, accentA, accentB]);

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
      const yOff = Math.sin(t * config.speed + it.phase) * 0.35;
      const xOff = Math.cos(t * config.speed * 0.5 + it.phase) * 0.18;
      dummy.position.set(it.x + xOff, it.y + yOff, it.z);
      dummy.rotation.set(it.rx + t * it.rotSpeed, it.ry + t * it.rotSpeed * 0.6, 0);
      const s = it.scale;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  // Pick the geometry once per config change.
  let geom;
  switch (config.geometry) {
    case 'tetra':  geom = <tetrahedronGeometry args={[1, 0]}/>; break;
    case 'torus':  geom = <torusGeometry args={[0.6, 0.18, 12, 24]}/>; break;
    case 'sphere': geom = <sphereGeometry args={[0.55, 18, 18]}/>; break;
    case 'cube':
    default:       geom = <boxGeometry args={[0.9, 0.9, 0.9]}/>; break;
  }

  return (
    <instancedMesh ref={meshRef} args={[null, null, config.count]}>
      {geom}
      <meshBasicMaterial
        transparent
        opacity={0.28}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}/>
    </instancedMesh>
  );
}

export default function GameAmbient({ gameId, cat }) {
  // All hooks must run unconditionally in the same order every render —
  // so memo the genre config + colours up top, even on the bespoke path
  // where the result is unused.
  const Bespoke = gameId && BESPOKE[gameId];
  const genre = CAT_TO_GENRE[cat] || 'arcade';
  const config = GENRE_CONFIG[genre];
  const accentA = useMemo(() => new THREE.Color(config.color),  [config.color]);
  const accentB = useMemo(() => new THREE.Color(config.color2), [config.color2]);

  if (Bespoke) {
    return (
      <Suspense fallback={null}>
        <Bespoke/>
      </Suspense>
    );
  }

  return (
    <div className="ambient3d" aria-hidden="true" data-genre={genre}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <Drifters config={config} accentA={accentA} accentB={accentB}/>
      </Canvas>
    </div>
  );
}
