// Grudgewood biome registry — palette, lighting, atmosphere, foliage rules.
// Each biome reuses the original Grudgewood palettes (mosswake, rotbog, heart)
// and extends the family with three more so the 3D world has real progression:
// trickster grove, cliffside, axe sanctum.

import * as THREE from 'three';

const c = (hex) => new THREE.Color(hex);

export const BIOMES = {
  mosswake: {
    id: 'mosswake',
    name: 'Mosswake',
    subtitle: 'Friendly-looking woods. Read the signs. Then ignore them.',
    sky: { top: c('#f5cb86'), mid: c('#e99668'), bot: c('#8c4a32') },
    fog: { color: c('#c98e58'), density: 0.018 },
    sun: { color: c('#ffe1b0'), intensity: 1.15, angle: [0.6, -0.7, 0.4] },
    ambient: { color: c('#5b4226'), intensity: 0.55 },
    ground: { color: c('#3c4a22'), darken: c('#1e2810') },
    grass: { color: c('#5a7630'), light: c('#89a74e') },
    treeBark: c('#4a3220'),
    treeLeaf: c('#2c4419'),
    rock: c('#6b5a3e'),
    accent: c('#ffe39c'),
    particle: { color: c('#ffe2a0'), fall: false, count: 220 },
    vignette: 0.32,
  },
  trickster: {
    id: 'trickster',
    name: 'Trickster Grove',
    subtitle: 'Bright. Cheerful. Lying.',
    sky: { top: c('#bce6ff'), mid: c('#8fc6e4'), bot: c('#5d8fb2') },
    fog: { color: c('#a9d4e8'), density: 0.014 },
    sun: { color: c('#fff4dc'), intensity: 1.3, angle: [0.5, -0.8, 0.3] },
    ambient: { color: c('#9bb8c8'), intensity: 0.6 },
    ground: { color: c('#3e5a2a'), darken: c('#1c2c14') },
    grass: { color: c('#6da13a'), light: c('#a6cf5a') },
    treeBark: c('#5b3e2a'),
    treeLeaf: c('#3a6322'),
    rock: c('#8a8478'),
    accent: c('#ffd966'),
    particle: { color: c('#ffffff'), fall: false, count: 260 },
    vignette: 0.22,
  },
  rotbog: {
    id: 'rotbog',
    name: 'The Rotbog',
    subtitle: 'Sickly green. Patient. The mud is louder than it looks.',
    sky: { top: c('#3e5654'), mid: c('#2a3c3a'), bot: c('#141c1a') },
    fog: { color: c('#5a7a70'), density: 0.026 },
    sun: { color: c('#9fc4b4'), intensity: 0.8, angle: [0.3, -0.6, 0.7] },
    ambient: { color: c('#1b2a26'), intensity: 0.65 },
    ground: { color: c('#2b3830'), darken: c('#121a16') },
    grass: { color: c('#3a5046'), light: c('#5a7a68') },
    treeBark: c('#231f1a'),
    treeLeaf: c('#19332a'),
    rock: c('#3a463e'),
    accent: c('#a4f2d4'),
    particle: { color: c('#aef0d2'), fall: false, count: 320 },
    vignette: 0.5,
  },
  cliffside: {
    id: 'cliffside',
    name: 'Cliffside Pines',
    subtitle: 'Wind has opinions. So do the branches.',
    sky: { top: c('#3a4a6a'), mid: c('#5d6e88'), bot: c('#a3b0c2') },
    fog: { color: c('#7a8a9c'), density: 0.02 },
    sun: { color: c('#dde6ee'), intensity: 1.05, angle: [0.7, -0.5, 0.2] },
    ambient: { color: c('#3a4458'), intensity: 0.55 },
    ground: { color: c('#3a4438'), darken: c('#1c221c') },
    grass: { color: c('#506850'), light: c('#7a9678') },
    treeBark: c('#3a2c20'),
    treeLeaf: c('#1d3a26'),
    rock: c('#7e8086'),
    accent: c('#dde9ff'),
    particle: { color: c('#ffffff'), fall: false, count: 200 },
    vignette: 0.34,
  },
  heart: {
    id: 'heart',
    name: 'The Heart',
    subtitle: 'Crimson canopy. Embers fall. The forest is finished pretending.',
    sky: { top: c('#7a1a1a'), mid: c('#3a0606'), bot: c('#150202') },
    fog: { color: c('#5a1414'), density: 0.028 },
    sun: { color: c('#ffb070'), intensity: 0.95, angle: [0.2, -0.5, 0.8] },
    ambient: { color: c('#3a0a08'), intensity: 0.7 },
    ground: { color: c('#2a0a08'), darken: c('#0a0000') },
    grass: { color: c('#4a1616'), light: c('#7a2424') },
    treeBark: c('#1a0606'),
    treeLeaf: c('#3c0e0e'),
    rock: c('#3a1212'),
    accent: c('#ff8a42'),
    particle: { color: c('#ff7a32'), fall: true, count: 380 },
    vignette: 0.55,
  },
  sanctum: {
    id: 'sanctum',
    name: 'Axe Sanctum',
    subtitle: 'Quiet. Lit from somewhere. Earned.',
    sky: { top: c('#1a1230'), mid: c('#2a1f50'), bot: c('#5a3a90') },
    fog: { color: c('#3a2a60'), density: 0.018 },
    sun: { color: c('#e0c8ff'), intensity: 1.0, angle: [0.2, -0.9, 0.0] },
    ambient: { color: c('#22153a'), intensity: 0.7 },
    ground: { color: c('#2a2040'), darken: c('#10081e') },
    grass: { color: c('#3e2e62'), light: c('#6a4ea0') },
    treeBark: c('#1a1228'),
    treeLeaf: c('#3a2862'),
    rock: c('#403458'),
    accent: c('#ffd6f8'),
    particle: { color: c('#e6c8ff'), fall: false, count: 280 },
    vignette: 0.42,
  },
};

export const BIOME_ORDER = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];

export function biomeFor(id) {
  return BIOMES[id] || BIOMES.mosswake;
}
