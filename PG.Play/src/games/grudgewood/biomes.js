// Grudgewood biome registry — palette, lighting, atmosphere.
//
// Visibility rule: difficulty does NOT come from visual obscurity. Every
// biome must keep the player's silhouette and trap telegraphs readable.
// Concretely: fog density never exceeds 0.014, sun intensity never drops
// below 1.05, ambient lift sits at 0.62+. Late-game biomes change the
// palette and the rules, not the lights.

import * as THREE from 'three';

const c = (hex) => new THREE.Color(hex);

export const BIOMES = {
  mosswake: {
    id: 'mosswake',
    name: 'Mosswake',
    subtitle: 'Friendly-looking woods. Read the signs. Then ignore them.',
    sky: { top: c('#f5cb86'), mid: c('#e9b078'), bot: c('#a06840') },
    fog: { color: c('#cfa176'), density: 0.011 },
    sun: { color: c('#ffe6c0'), intensity: 1.25, angle: [0.6, -0.7, -0.45] },
    ambient: { color: c('#7a5e3c'), intensity: 0.7 },
    ground: { color: c('#3c4a22'), darken: c('#1e2810') },
    grass: { color: c('#5a7630'), light: c('#9bbe5a') },
    treeBark: c('#604226'),
    treeLeaf: c('#406022'),
    rock: c('#6b5a3e'),
    accent: c('#ffe39c'),
    particle: { color: c('#ffe2a0'), fall: false, count: 130 },
    vignette: 0.18,
  },
  trickster: {
    id: 'trickster',
    name: 'Trickster Grove',
    subtitle: 'Bright. Cheerful. Lying.',
    sky: { top: c('#cdeeff'), mid: c('#9ed1eb'), bot: c('#6fa1c0') },
    fog: { color: c('#bce0f0'), density: 0.010 },
    sun: { color: c('#fff4dc'), intensity: 1.35, angle: [0.5, -0.8, -0.4] },
    ambient: { color: c('#a8c0d0'), intensity: 0.7 },
    ground: { color: c('#4a6a32'), darken: c('#22341a') },
    grass: { color: c('#7ab142'), light: c('#b2db66') },
    treeBark: c('#735036'),
    treeLeaf: c('#4d7e2c'),
    rock: c('#8a8478'),
    accent: c('#ffd966'),
    particle: { color: c('#ffffff'), fall: false, count: 140 },
    vignette: 0.14,
  },
  rotbog: {
    id: 'rotbog',
    name: 'The Rotbog',
    subtitle: 'Sickly green. Patient. The mud is louder than it looks.',
    sky: { top: c('#7ea090'), mid: c('#5a7a6a'), bot: c('#3e564a') },
    fog: { color: c('#86a094'), density: 0.013 },
    sun: { color: c('#c4e0d2'), intensity: 1.05, angle: [0.3, -0.6, -0.55] },
    ambient: { color: c('#557066'), intensity: 0.78 },
    ground: { color: c('#3a4a3e'), darken: c('#1c241e') },
    grass: { color: c('#4f6a58'), light: c('#86a890') },
    treeBark: c('#473c30'),
    treeLeaf: c('#3c624c'),
    rock: c('#506054'),
    accent: c('#a4f2d4'),
    particle: { color: c('#bef0d8'), fall: false, count: 160 },
    vignette: 0.22,
  },
  cliffside: {
    id: 'cliffside',
    name: 'Cliffside Pines',
    subtitle: 'Wind has opinions. So do the branches.',
    sky: { top: c('#7088ac'), mid: c('#94a8c2'), bot: c('#c4cfde') },
    fog: { color: c('#a4b4c8'), density: 0.011 },
    sun: { color: c('#eef2f8'), intensity: 1.2, angle: [0.7, -0.5, -0.35] },
    ambient: { color: c('#6c7e94'), intensity: 0.7 },
    ground: { color: c('#48584a'), darken: c('#22281e') },
    grass: { color: c('#608468'), light: c('#94b48c') },
    treeBark: c('#50402e'),
    treeLeaf: c('#3c6244'),
    rock: c('#9aa0a6'),
    accent: c('#dde9ff'),
    particle: { color: c('#ffffff'), fall: false, count: 130 },
    vignette: 0.20,
  },
  heart: {
    id: 'heart',
    name: 'The Heart',
    subtitle: 'Crimson canopy. Embers fall. The forest is finished pretending.',
    sky: { top: c('#e07a4a'), mid: c('#b25030'), bot: c('#5a1c10') },
    fog: { color: c('#9c4424'), density: 0.013 },
    sun: { color: c('#ffd0a0'), intensity: 1.15, angle: [0.2, -0.5, -0.6] },
    ambient: { color: c('#7a3018'), intensity: 0.8 },
    ground: { color: c('#5a2014'), darken: c('#240808') },
    grass: { color: c('#7a2a1c'), light: c('#b04830') },
    treeBark: c('#451511'),
    treeLeaf: c('#782521'),
    rock: c('#5a221c'),
    accent: c('#ffb070'),
    particle: { color: c('#ff8a40'), fall: true, count: 180 },
    vignette: 0.26,
  },
  sanctum: {
    id: 'sanctum',
    name: 'Axe Sanctum',
    subtitle: 'Quiet. Lit from somewhere. Earned.',
    sky: { top: c('#9a82d4'), mid: c('#6a4ea0'), bot: c('#3a2860') },
    fog: { color: c('#7c64b0'), density: 0.011 },
    sun: { color: c('#f4e0ff'), intensity: 1.18, angle: [0.2, -0.9, -0.3] },
    ambient: { color: c('#62488c'), intensity: 0.8 },
    ground: { color: c('#3a2c5e'), darken: c('#180c30') },
    grass: { color: c('#6650a0'), light: c('#a684ce') },
    treeBark: c('#3c2c5a'),
    treeLeaf: c('#6f5cc0'),
    rock: c('#605478'),
    accent: c('#ffd6f8'),
    particle: { color: c('#e6c8ff'), fall: false, count: 150 },
    vignette: 0.20,
  },
};

export const BIOME_ORDER = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];

export function biomeFor(id) {
  return BIOMES[id] || BIOMES.mosswake;
}
