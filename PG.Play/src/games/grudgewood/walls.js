// Grudgewood — wall meshes and AABBs for the maze grid.
//
// For each cell we build at most two walls: the cell's NORTH and EAST
// walls. The south and west walls are owned by the neighbouring cells
// (their north and east respectively), which prevents double-rendering
// shared edges. When the player physics queries collisions for the cell
// they're standing in, it must pull walls from the cell to the south and
// west as well as the local cell — see chunkManager.collectWallsAround.

import * as THREE from 'three';
import { CELL_SIZE, cellOrigin, cellWalls } from './mazeGrid.js';

const WALL_HEIGHT = 3.4;
const WALL_THICK = 0.6;
const CAP_HEIGHT = 0.18;          // small lighter band on top — reads as a stone capstone

function wallMaterials(biome) {
  const stone = new THREE.MeshStandardMaterial({
    color: biome.rock, roughness: 0.95, metalness: 0.0, flatShading: true,
  });
  // Slightly lighter cap by lerping toward white.
  const capColor = biome.rock.clone().lerp(new THREE.Color('#ffffff'), 0.18);
  const cap = new THREE.MeshStandardMaterial({
    color: capColor, roughness: 0.9, flatShading: true,
  });
  return { stone, cap };
}

// Build a single wall as a body box + a thin capstone sitting on top.
// AABB is recorded in mesh.userData so the collision pass in player.js
// can iterate them directly without per-frame math.
function makeWall({ x, z, lengthAxis, biome, mats }) {
  const isNS = lengthAxis === 'x';     // wall lies along world X (it's a north/south wall)
  const len = CELL_SIZE;
  const sx = isNS ? len : WALL_THICK;
  const sz = isNS ? WALL_THICK : len;

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(sx, WALL_HEIGHT - CAP_HEIGHT, sz), mats.stone);
  body.position.set(x, (WALL_HEIGHT - CAP_HEIGHT) / 2, z);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Capstone — slightly wider than the body for a subtle lip.
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(sx + 0.08, CAP_HEIGHT, sz + 0.08),
    mats.cap,
  );
  cap.position.set(x, WALL_HEIGHT - CAP_HEIGHT / 2, z);
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  // AABB for collision. Only the body matters for player physics; the
  // capstone is purely visual and slightly wider, so it sits inside the
  // body AABB plus a tiny lip — using the body extents keeps the player
  // from feeling like they're snagging on visual fluff.
  const aabb = {
    minX: x - sx / 2, maxX: x + sx / 2,
    minZ: z - sz / 2, maxZ: z + sz / 2,
  };
  group.userData.wallAABB = aabb;

  return group;
}

// Build the north and east walls of one cell. Returns { meshes, aabbs }.
// `biome` is used for the rock material colour.
export function buildCellWalls(biome, cx, cz) {
  const walls = cellWalls(cx, cz);
  const o = cellOrigin(cx, cz);
  const mats = wallMaterials(biome);

  const meshes = [];
  const aabbs = [];

  // North wall (z = cz+1): runs along world-X.
  if (walls.n) {
    const m = makeWall({
      x: o.x + CELL_SIZE / 2,
      z: o.z + CELL_SIZE,
      lengthAxis: 'x',
      biome, mats,
    });
    meshes.push(m);
    aabbs.push(m.userData.wallAABB);
  }

  // East wall (x = cx+1): runs along world-Z.
  if (walls.e) {
    const m = makeWall({
      x: o.x + CELL_SIZE,
      z: o.z + CELL_SIZE / 2,
      lengthAxis: 'z',
      biome, mats,
    });
    meshes.push(m);
    aabbs.push(m.userData.wallAABB);
  }

  return { meshes, aabbs };
}

export const WALL_HEIGHT_M = WALL_HEIGHT;
