// Grudgewood — persistence with schema versioning + corruption fallback.
// localStorage key holds the player profile: progress, hats, settings, stats.

const KEY = 'grudgewood:save:v1';
const SCHEMA = 1;

const DEFAULT = () => ({
  schema: SCHEMA,
  // progression
  furthestBiome: 'mosswake',
  furthestSegment: 0,
  checkpoint: { biome: 'mosswake', segment: 0, anchor: 0 },
  // unlocks
  hats: { 'leaf-crown': true },
  equippedHat: 'leaf-crown',
  axeUnlocked: false,
  secretsFound: [],
  challengeMedals: {}, // challengeId -> 'bronze'|'silver'|'gold'
  // stats
  stats: { deaths: 0, retries: 0, runtime: 0, traps: {} },
  // settings
  settings: {
    quality: 'auto',          // 'low' | 'medium' | 'high' | 'auto'
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.4,
    cameraShake: 1.0,
    reducedMotion: false,
    showFps: false,
    casualMode: false,        // softer punishment, retains comedy
    invertY: false,
  },
  // session
  lastSeen: Date.now(),
});

function isValid(d) {
  return d
    && typeof d === 'object'
    && d.schema === SCHEMA
    && typeof d.furthestBiome === 'string'
    && typeof d.checkpoint === 'object'
    && typeof d.settings === 'object';
}

let cache = null;

export function loadSave() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { cache = DEFAULT(); return cache; }
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) {
      // Corruption fallback — keep what we can salvage.
      const def = DEFAULT();
      cache = { ...def, ...(typeof parsed === 'object' ? parsed : {}), schema: SCHEMA };
      return cache;
    }
    cache = parsed;
    return cache;
  } catch {
    cache = DEFAULT();
    return cache;
  }
}

export function persist() {
  if (!cache) return;
  try {
    cache.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
}

export function getSave() {
  return loadSave();
}

export function update(mut) {
  const s = loadSave();
  mut(s);
  persist();
  return s;
}

export function unlockHat(id) {
  return update((s) => { s.hats[id] = true; });
}

export function equipHat(id) {
  return update((s) => { if (s.hats[id]) s.equippedHat = id; });
}

export function recordDeath(trapKind) {
  return update((s) => {
    s.stats.deaths++;
    if (trapKind) s.stats.traps[trapKind] = (s.stats.traps[trapKind] || 0) + 1;
  });
}

export function recordCheckpoint(biome, segment, anchor) {
  return update((s) => {
    s.checkpoint = { biome, segment, anchor };
    // Track furthest progress monotonically.
    const order = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];
    const cur = order.indexOf(biome);
    const fur = order.indexOf(s.furthestBiome);
    if (cur > fur || (cur === fur && segment > s.furthestSegment)) {
      s.furthestBiome = biome;
      s.furthestSegment = segment;
    }
  });
}

export function setMedal(challengeId, medal) {
  return update((s) => {
    const order = { bronze: 1, silver: 2, gold: 3 };
    const cur = order[s.challengeMedals[challengeId]] || 0;
    if ((order[medal] || 0) > cur) s.challengeMedals[challengeId] = medal;
  });
}

export function unlockAxe() {
  return update((s) => { s.axeUnlocked = true; });
}

export function setSetting(key, value) {
  return update((s) => { s.settings[key] = value; });
}

export function resetProgress() {
  cache = DEFAULT();
  persist();
  return cache;
}
