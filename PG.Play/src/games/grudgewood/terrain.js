// Grudgewood — procedural terrain with vertex colors and a sample function.
// We author segments as long forest paths (~80m corridors) with side cliffs,
// a serpentine spline for the walk-line, and noise-bumped flanks. The center
// strip is walkable; gameplay is contained inside a soft canyon.

import * as THREE from 'three';

// Lightweight 2D value noise — deterministic from segment seed.
function makeNoise(seed) {
  const rand = (x, y) => {
    const s = Math.sin((x * 12.9898 + y * 78.233 + seed * 37.71)) * 43758.5453;
    return s - Math.floor(s);
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const a = rand(x0, y0), b = rand(x0 + 1, y0);
    const c = rand(x0, y0 + 1), d = rand(x0 + 1, y0 + 1);
    const u = smooth(fx), v = smooth(fy);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(a, b, u),
      THREE.MathUtils.lerp(c, d, u),
      v
    );
  };
}

const SEG_LEN = 80;        // length of a level segment along Z
const SEG_W = 30;           // half-width of segment
const TERRAIN_RES_X = 36;
const TERRAIN_RES_Z = 96;

export function buildTerrain(biome, segmentIndex) {
  const noise = makeNoise(segmentIndex * 7 + (biome.id.charCodeAt(0) || 0));

  const geo = new THREE.PlaneGeometry(SEG_W * 2, SEG_LEN, TERRAIN_RES_X, TERRAIN_RES_Z);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, SEG_LEN / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cGround = biome.ground.color;
  const cDark = biome.ground.darken;
  const cGrass = biome.grass.color;
  const cGrassLt = biome.grass.light;

  // Path spline as a simple sin/cos along Z so the walk-line snakes a bit.
  const pathOffset = (z) =>
    Math.sin((z / SEG_LEN) * Math.PI * 1.4 + segmentIndex * 0.7) * 4 +
    Math.sin((z / SEG_LEN) * Math.PI * 3.1 + segmentIndex) * 1.2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const px = pathOffset(z);
    const distFromPath = Math.abs(x - px);

    // Walkable center strip — flat-ish; sides rise into low cliffs.
    const flank = Math.max(0, distFromPath - 5);
    const cliff = Math.min(8, flank * 0.7);
    const wobble = (noise(x * 0.18, z * 0.18) - 0.5) * 1.6;
    const microGrain = (noise(x * 0.5, z * 0.5) - 0.5) * 0.3;
    let y = cliff + wobble + microGrain;

    // Carve a soft trench along the path so it reads as a corridor.
    if (distFromPath < 4) y = -0.08 + microGrain * 0.4;

    pos.setY(i, y);

    // Color: mostly ground; grass tinted near path, darken on cliff caps.
    const t = THREE.MathUtils.clamp(1 - distFromPath / 6, 0, 1);
    const g = THREE.MathUtils.clamp((noise(x * 0.4, z * 0.4) - 0.4) * 1.6, 0, 1);
    const r = new THREE.Color();
    r.copy(cGround).lerp(cGrass, t * 0.55).lerp(cGrassLt, t * g * 0.5);
    if (cliff > 1.5) r.lerp(cDark, Math.min(1, (cliff - 1.5) / 4));

    colors[i * 3] = r.r; colors[i * 3 + 1] = r.g; colors[i * 3 + 2] = r.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.userData.isTerrain = true;
  mesh.userData.segmentIndex = segmentIndex;
  mesh.userData.pathOffset = pathOffset;

  // Sample function: returns ground height at a given (x, z) inside the segment.
  // We replicate the same math used for vertices, including trench logic.
  const sampleHeight = (x, z) => {
    const px = pathOffset(z);
    const distFromPath = Math.abs(x - px);
    const flank = Math.max(0, distFromPath - 5);
    const cliff = Math.min(8, flank * 0.7);
    const wobble = (noise(x * 0.18, z * 0.18) - 0.5) * 1.6;
    const microGrain = (noise(x * 0.5, z * 0.5) - 0.5) * 0.3;
    if (distFromPath < 4) return -0.08 + microGrain * 0.4;
    return cliff + wobble + microGrain;
  };
  mesh.userData.sampleHeight = sampleHeight;

  return { mesh, sampleHeight, pathOffset, length: SEG_LEN, halfWidth: SEG_W };
}

export const TERRAIN_SEG_LEN = SEG_LEN;
export const TERRAIN_HALF_W = SEG_W;
