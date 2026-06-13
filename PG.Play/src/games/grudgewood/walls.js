// Grudgewood — wall meshes and AABBs for the maze grid.
//
// For each cell we build at most two walls: the cell's NORTH and EAST
// walls. The south and west walls are owned by the neighbouring cells
// (their north and east respectively), which prevents double-rendering
// shared edges. When the player physics queries collisions for the cell
// they're standing in, it must pull walls from the cell to the south and
// west as well as the local cell — see chunkManager.collectWallsAround.
//
// Visual design: the walls are overgrown stone ruins, not clean slabs.
// The body is a subdivided box with deterministic vertex jitter (faceted,
// hand-stacked read under flat shading) and per-vertex colour: weathered
// stone with moss creeping up from the ground and pooling along the top.
// A merged clump of low-poly foliage rides the crest so each wall reads
// as a hedge-topped ruin against the sky. All jitter and placement is
// seeded from world position, so a cell that streams out and back in
// rebuilds pixel-identical.
//
// IMPORTANT: collision AABBs are computed from the same nominal extents
// as before the visual rebuild — jitter is visual-only and stays well
// inside the player radius, so physics behaviour is unchanged.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CELL_SIZE, cellOrigin, cellWalls } from './mazeGrid.js';

const WALL_HEIGHT = 3.4;
const WALL_THICK = 0.6;

// Deterministic hash → [0,1) RNG so rebuilt cells look identical.
function hash2(x, z) {
  let h = (Math.imul(Math.round(x * 8) | 0, 374761393) +
           Math.imul(Math.round(z * 8) | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Stable per-position jitter in [-1,1] — same world position always gets
// the same offset, which keeps duplicated (non-indexed) verts watertight.
function posJitter(x, y, z, salt) {
  const h = hash2(x * 31 + salt * 101, z * 17 + y * 57);
  return (h % 10000) / 5000 - 1;
}

const _moss = new THREE.Color();
const _stoneTone = new THREE.Color();

// Generic mossy-stone box — the same jitter + vertex-colour treatment the
// walls get, reusable for platform decks and ramps. `y` is the box centre;
// moss creeps up from the bottom face and crusts the top face.
export function buildMossyBox(biome, { x, y, z, sx, sy, sz, segs = [4, 2, 4], topMoss = true }) {
  const geo = new THREE.BoxGeometry(sx, sy, sz, segs[0], segs[1], segs[2]).toNonIndexed();
  geo.translate(x, y, z);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const stone = _stoneTone.copy(biome.rock).lerp(new THREE.Color('#cfc2a4'), 0.22).clone();
  const mossCol = _moss.copy(biome.treeLeaf).lerp(biome.grass.light, 0.35).clone();
  const yBot = y - sy / 2;

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const hNorm = (vy - yBot) / sy;
    const topV = hNorm > 0.99;
    const botV = hNorm < 0.01;
    if (!botV && !topV) {
      pos.setX(i, vx + posJitter(vx, vy, vz, 11) * 0.05);
      pos.setZ(i, vz + posJitter(vx, vy, vz, 12) * 0.05);
      pos.setY(i, vy + posJitter(vx, vy, vz, 13) * 0.05);
    }
    const tone = 0.9 + posJitter(vx * 0.5, vy * 2, vz * 0.5, 14) * 0.14;
    _stoneTone.copy(stone).multiplyScalar(tone);
    const patch = posJitter(vx * 0.23, 0, vz * 0.23, 15) * 0.5 + 0.5;
    const baseMoss = Math.max(0, 1 - hNorm * 2.2) * (0.3 + patch * 0.6);
    const crest = topMoss ? Math.max(0, hNorm - 0.85) * 3.5 * patch : 0;
    _stoneTone.lerp(mossCol, Math.min(1, baseMoss + crest) * 0.55);
    colors[i * 3] = _stoneTone.r;
    colors[i * 3 + 1] = _stoneTone.g;
    colors[i * 3 + 2] = _stoneTone.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, metalness: 0.0, flatShading: true,
  }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Build the jittered, vertex-coloured wall body. `sx/sz` are the nominal
// box extents; world placement is baked into the geometry so per-position
// jitter is stable across rebuilds.
function buildWallBody(biome, x, z, sx, sz) {
  const isNS = sx > sz;
  const geo = new THREE.BoxGeometry(
    sx, WALL_HEIGHT, sz,
    isNS ? 12 : 2, 4, isNS ? 2 : 12,
  ).toNonIndexed();
  geo.translate(x, WALL_HEIGHT / 2, z);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  // Stone is lifted toward a lighter weathered tone so the shadowed face
  // still reads under the fill light; moss leans on the biome's LIGHT
  // grass so overgrowth never drags the wall toward black.
  const stone = _stoneTone.copy(biome.rock).lerp(new THREE.Color('#cfc2a4'), 0.22).clone();
  const mossCol = _moss.copy(biome.treeLeaf).lerp(biome.grass.light, 0.35).clone();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);

    // Jitter — visual-only and small relative to the player radius.
    // Bottom verts stay put so the base never gaps against the floor;
    // the top edge gets extra vertical raggedness for the silhouette.
    const topV = vy > WALL_HEIGHT - 0.01;
    const botV = vy < 0.01;
    if (!botV) {
      pos.setX(i, vx + posJitter(vx, vy, vz, 1) * 0.07);
      pos.setZ(i, vz + posJitter(vx, vy, vz, 2) * 0.07);
      pos.setY(i, vy + posJitter(vx, vy, vz, 3) * (topV ? 0.22 : 0.10));
    }

    // Colour — weathered stone with band variation, moss at the base
    // (climbing in patches) and a mossy crust along the crest. Bare stone
    // must stay visible mid-face so the wall reads as built, not a hill.
    const tone = 0.9 + posJitter(vx * 0.5, vy * 2, vz * 0.5, 4) * 0.14;
    _stoneTone.copy(stone).multiplyScalar(tone);
    const hNorm = vy / WALL_HEIGHT;
    const patch = posJitter(vx * 0.23, 0, vz * 0.23, 5) * 0.5 + 0.5;
    const baseMoss = Math.max(0, 1 - hNorm * 3.2) * (0.3 + patch * 0.7);
    const topMoss = Math.max(0, hNorm - 0.82) * 4.5 * (0.4 + patch * 0.6);
    const moss = Math.min(1, baseMoss + topMoss);
    _stoneTone.lerp(mossCol, moss * 0.62);

    colors[i * 3] = _stoneTone.r;
    colors[i * 3 + 1] = _stoneTone.g;
    colors[i * 3 + 2] = _stoneTone.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, metalness: 0.0, flatShading: true,
  }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Foliage crest — icosahedron clumps merged into ONE geometry (one draw
// call per wall) with per-clump leaf-tone variation in vertex colours.
function buildWallCrest(biome, x, z, sx, sz) {
  const isNS = sx > sz;
  const len = isNS ? sx : sz;
  const rng = mulberry32(hash2(x, z) ^ 0x9e3779b9);

  const clumps = [];
  const n = 6 + ((rng() * 4) | 0);
  const leafA = biome.treeLeaf;
  const leafB = _moss.copy(biome.treeLeaf).lerp(biome.grass.light, 0.45).clone();

  for (let i = 0; i < n; i++) {
    const r = 0.45 + rng() * 0.55;
    const g = new THREE.IcosahedronGeometry(r, 0).toNonIndexed();
    const along = (i / (n - 1) - 0.5) * (len - 1.2) + (rng() - 0.5) * 0.8;
    const side = (rng() - 0.5) * 0.25;
    const gx = x + (isNS ? along : side);
    const gz = z + (isNS ? side : along);
    const gy = WALL_HEIGHT - 0.15 + (rng() - 0.5) * 0.3;
    const rot = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
    );
    g.applyMatrix4(rot);
    g.translate(gx, gy, gz);

    // Per-clump tone, plus slight per-vertex shade so facets vary.
    const t = rng();
    const base = _stoneTone.copy(leafA).lerp(leafB, t);
    const cols = new Float32Array(g.attributes.position.count * 3);
    for (let v = 0; v < g.attributes.position.count; v++) {
      const shade = 0.9 + rng() * 0.2;
      cols[v * 3] = base.r * shade;
      cols[v * 3 + 1] = base.g * shade;
      cols[v * 3 + 2] = base.b * shade;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    clumps.push(g);
  }

  const merged = mergeGeometries(clumps);
  clumps.forEach((g) => g.dispose());
  merged.computeVertexNormals();

  const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9, flatShading: true,
  }));
  mesh.castShadow = true;
  return mesh;
}

// Build a single wall: jittered stone body + foliage crest.
// AABB is recorded in mesh.userData so the collision pass in player.js
// can iterate them directly without per-frame math. The AABB uses the
// NOMINAL box extents (pre-jitter) — identical to the old slab walls.
function makeWall({ x, z, lengthAxis, biome }) {
  const isNS = lengthAxis === 'x';     // wall lies along world X (it's a north/south wall)
  const len = CELL_SIZE;
  const sx = isNS ? len : WALL_THICK;
  const sz = isNS ? WALL_THICK : len;

  const group = new THREE.Group();
  group.add(buildWallBody(biome, x, z, sx, sz));
  group.add(buildWallCrest(biome, x, z, sx, sz));

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

  const meshes = [];
  const aabbs = [];

  // North wall (z = cz+1): runs along world-X.
  if (walls.n) {
    const m = makeWall({
      x: o.x + CELL_SIZE / 2,
      z: o.z + CELL_SIZE,
      lengthAxis: 'x',
      biome,
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
      biome,
    });
    meshes.push(m);
    aabbs.push(m.userData.wallAABB);
  }

  return { meshes, aabbs };
}

export const WALL_HEIGHT_M = WALL_HEIGHT;
