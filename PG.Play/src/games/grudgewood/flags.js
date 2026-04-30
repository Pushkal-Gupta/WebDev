// Grudgewood — red-flag checkpoint props.
//
// A flag is a tall wooden pole with a red cloth tied to it. When the
// player approaches within the proximity radius the cloth raises up the
// pole over ~0.6s, the flag latches as the new respawn anchor, and the
// level counter ticks. Flags are placed at deterministic spine positions
// (every FLAG_INTERVAL_CELLS cells along Z), so the route from spawn
// onward is dotted with clear "next goal" markers.
//
// State persistence: which flag indices are raised lives in
// gameState.raisedFlags (a Set). Cell-level flag meshes consult the Set
// at build time so a chunk that re-streams in shows the correct state.

import * as THREE from 'three';
import { CELL_SIZE, SPINE_X } from './mazeGrid.js';

export const FLAG_INTERVAL_CELLS = 6;        // every 6 cells on the spine = ~144m
export const FLAG_TOUCH_RADIUS = 2.4;
const POLE_HEIGHT = 4.0;

// World-space anchor for the flag at level index N (0 = spawn flag, 1 =
// first goal flag, etc.). Always sits in the centre of the spine cell at
// (SPINE_X, N * FLAG_INTERVAL_CELLS).
export function flagAnchorFor(level) {
  return {
    cx: SPINE_X,
    cz: level * FLAG_INTERVAL_CELLS,
    x: SPINE_X * CELL_SIZE + CELL_SIZE / 2,
    z: level * FLAG_INTERVAL_CELLS * CELL_SIZE + CELL_SIZE / 2,
  };
}

// If this cell is a flag cell, return its level index. Otherwise null.
export function flagLevelInCell(cx, cz) {
  if (cx !== SPINE_X) return null;
  if (cz < 0) return null;
  if (cz % FLAG_INTERVAL_CELLS !== 0) return null;
  return cz / FLAG_INTERVAL_CELLS;
}

// Build a flag mesh. `raised` controls the initial cloth position; the
// trap-tick on the chunk drives the raise animation when the player
// approaches a not-yet-raised flag.
export function makeFlag({ level, raised = false }) {
  const g = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.10, POLE_HEIGHT, 8),
    new THREE.MeshStandardMaterial({ color: '#8a6a3a', roughness: 0.9, flatShading: true }),
  );
  pole.position.y = POLE_HEIGHT / 2;
  pole.castShadow = true;
  g.add(pole);

  // Stone base — a small cairn so the flag reads as "an objective" rather
  // than a stick someone forgot in the woods.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.4, 10),
    new THREE.MeshStandardMaterial({ color: '#6a6058', roughness: 1.0, flatShading: true }),
  );
  base.position.y = 0.2;
  base.castShadow = true;
  g.add(base);

  // Cloth — a triangular pennant the size of a small towel. Starts at the
  // bottom of the pole when not raised and animates up when raised.
  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.6, 0.05),
    new THREE.MeshBasicMaterial({ color: '#d61a1a', side: THREE.DoubleSide }),
  );
  cloth.position.set(0.5, raised ? POLE_HEIGHT - 0.5 : 0.6, 0);
  g.add(cloth);

  // Number marker etched on the base — uses canvas texture so we don't
  // need a font loader. Tiny but present so the player can confirm "I'm
  // at flag 3".
  const numTex = makeNumberTexture(level);
  const num = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ map: numTex, transparent: true }),
  );
  num.position.set(0, 0.2, 0.71);
  g.add(num);

  g.userData.kind = 'flag';
  g.userData.level = level;
  g.userData.cloth = cloth;
  g.userData.raised = raised;
  g.userData.raiseT = raised ? 1 : 0;       // animation progress 0..1
  return g;
}

function makeNumberTexture(level) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 36px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(level), 32, 34);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// Per-frame: drive the raise animation on a flag mesh. Returns true if
// the cloth crossed into the fully-raised state during this tick — the
// caller (chunkManager) uses that signal to fire raise SFX exactly once.
export function tickFlag(mesh, dt, wantRaised) {
  const before = mesh.userData.raiseT;
  let t = before;
  if (wantRaised) t = Math.min(1, t + dt * 1.6);   // ~0.6s rise
  else            t = Math.max(0, t - dt * 0.8);
  mesh.userData.raiseT = t;
  mesh.userData.raised = wantRaised;
  const cloth = mesh.userData.cloth;
  cloth.position.y = 0.6 + (POLE_HEIGHT - 1.1) * t;
  // Light flutter once raised.
  if (t >= 0.99) {
    const sway = Math.sin(performance.now() * 0.005) * 0.06;
    cloth.rotation.z = sway;
  } else {
    cloth.rotation.z = 0;
  }
  return before < 1 && t >= 1;
}
