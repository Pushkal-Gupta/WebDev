// Mulberry32: small, fast, public-domain seedable RNG. Determinism is a
// sim contract — every chance roll in the AI director, every spawn jitter,
// every cluster-pick goes through here so that with the same seed you get
// the same match.

export function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convenience helpers that close over a single rng instance.
export function makeRngHelpers(rng) {
  return {
    next:  rng,
    range: (lo, hi) => lo + (hi - lo) * rng(),
    int:   (lo, hi) => Math.floor(lo + (hi - lo + 1) * rng()),
    pick:  (arr)    => arr[Math.floor(rng() * arr.length)],
    chance:(p)      => rng() < p,
  };
}

// Deterministic seed from the wall clock — used when no seed is provided.
export const newSeed = () => (Math.random() * 0xffffffff) >>> 0;
