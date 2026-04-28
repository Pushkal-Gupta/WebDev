// Grudgewood — biome schedule along the infinite walk.
//
// Every BIOME_LENGTH meters of forward travel the world shifts to the next
// biome. After we cycle through all six, we keep cycling — the forest is
// endless, but its mood still changes every few minutes of running. A
// short crossfade window lets the engine blend sky/fog colors so transitions
// feel breath-y instead of jarring.

import { biomeFor } from './biomes.js';

export const BIOME_ORDER = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];
export const BIOME_LENGTH = 280; // meters per biome (long enough to settle into a vibe)
const FADE_WINDOW = 36;          // last N meters of a biome blend into the next

// Returns { biome, next, blend } where blend in [0,1] is how far we are
// into the crossfade *into* `next`. blend=0 means fully in `biome`, 1 fully
// in `next`. Outside the fade window blend stays at 0.
export function biomeAt(z) {
  const phase = Math.max(0, z) / BIOME_LENGTH;
  const idx = Math.floor(phase);
  const local = (phase - idx) * BIOME_LENGTH; // 0..BIOME_LENGTH
  const biome = biomeFor(BIOME_ORDER[idx % BIOME_ORDER.length]);
  const next = biomeFor(BIOME_ORDER[(idx + 1) % BIOME_ORDER.length]);
  const inFade = local > BIOME_LENGTH - FADE_WINDOW;
  const blend = inFade ? (local - (BIOME_LENGTH - FADE_WINDOW)) / FADE_WINDOW : 0;
  return { biome, next, blend, idx };
}

// Same as biomeAt but for the chunk-grain queries the renderer makes —
// returns just the biome whose color/foliage rules dominate this chunk.
// We pick by the chunk's center Z so a chunk's identity is stable.
export function biomeForChunk(chunkIndex, chunkLength) {
  return biomeAt(chunkIndex * chunkLength + chunkLength / 2).biome;
}
