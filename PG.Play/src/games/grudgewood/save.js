// Grudgewood — persistence with schema versioning + corruption fallback.
// localStorage holds the player profile: progress (distance + respawn anchor),
// hats, settings, lifetime stats. Schema bumped to v2 when we moved from
// segment-based progression to a continuous infinite walk.

const KEY = 'grudgewood:save:v3';
const SCHEMA = 3;

const DEFAULT = () => ({
  schema: SCHEMA,
  // progression — Euclidean distance reached, the cell-level checkpoint
  // the player last raised, and which level flags are persistently
  // raised across runs. respawnAnchor stores world coords so the player
  // resumes exactly where the last flag is.
  furthestDistance: 0,
  highestLevel: 0,
  respawnAnchor: { x: 12, z: 12 },
  raisedFlags: [],                 // sorted list of level indices
  // unlocks
  hats: { 'leaf-crown': true },
  equippedHat: 'leaf-crown',
  // stats
  stats: { deaths: 0, retries: 0, runtime: 0, traps: {} },
  // settings
  settings: {
    quality: 'auto',
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.4,
    cameraShake: 1.0,
    reducedMotion: false,
    showFps: false,
    casualMode: false,
    invertY: false,
  },
  lastSeen: Date.now(),
});

function isValid(d) {
  return d
    && typeof d === 'object'
    && d.schema === SCHEMA
    && typeof d.settings === 'object';
}

let cache = null;
const memoryStore = { [KEY]: null };
let storageWorks = true;

function safeGet(k) {
  try { return localStorage.getItem(k); }
  catch { storageWorks = false; return memoryStore[k] ?? null; }
}
function safeSet(k, v) {
  try { localStorage.setItem(k, v); storageWorks = true; }
  catch { storageWorks = false; memoryStore[k] = v; }
}

export function loadSave() {
  if (cache) return cache;
  try {
    const raw = safeGet(KEY);
    if (!raw) { cache = DEFAULT(); return cache; }
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) {
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
    safeSet(KEY, JSON.stringify(cache));
  } catch {}
}

export function isStoragePersistent() { return storageWorks; }
export function getSave() { return loadSave(); }

export function update(mut) {
  const s = loadSave();
  mut(s);
  persist();
  return s;
}

export function unlockHat(id) { return update((s) => { s.hats[id] = true; }); }
export function equipHat(id)  { return update((s) => { if (s.hats[id]) s.equippedHat = id; }); }

export function recordDeath(trapKind) {
  return update((s) => {
    s.stats.deaths++;
    if (trapKind) s.stats.traps[trapKind] = (s.stats.traps[trapKind] || 0) + 1;
  });
}

// Save the furthest reached distance. Only moves forward — a death
// cannot lower it. (respawnAnchor + highestLevel + raisedFlags are
// updated through their own helpers below when the player raises a flag.)
export function recordDistance(furthest) {
  return update((s) => {
    if (furthest > (s.furthestDistance || 0)) s.furthestDistance = furthest;
  });
}

// Persist a flag-raise: bumps highestLevel, latches the flag in the
// raisedFlags list, and stores the new respawn anchor as the flag's
// world coordinates so future deaths return there.
export function recordFlagRaise(level, anchor) {
  return update((s) => {
    if (level > (s.highestLevel || 0)) s.highestLevel = level;
    if (!s.raisedFlags) s.raisedFlags = [];
    if (!s.raisedFlags.includes(level)) s.raisedFlags.push(level);
    s.respawnAnchor = { x: anchor.x, z: anchor.z };
  });
}

export function setSetting(key, value) {
  return update((s) => { s.settings[key] = value; });
}

export function resetProgress() {
  cache = DEFAULT();
  persist();
  return cache;
}
