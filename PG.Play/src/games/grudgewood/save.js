// Grudgewood — persistence with schema versioning + corruption fallback.
// localStorage holds the player profile: progress (distance + respawn anchor),
// hats, settings, lifetime stats. Schema bumped to v2 when we moved from
// segment-based progression to a continuous infinite walk.

const KEY = 'grudgewood:save:v2';
const SCHEMA = 2;

const DEFAULT = () => ({
  schema: SCHEMA,
  // progression — pure distance into the forest. respawnAnchor is the
  // furthest auto-checkpoint the player has reached this profile.
  furthestDistance: 0,
  respawnAnchor: 0,
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

// Save the furthest reached distance and the active respawn anchor. Both
// only ever move forward — a death cannot lower these.
export function recordDistance(furthest, respawnAnchor) {
  return update((s) => {
    if (furthest > (s.furthestDistance || 0)) s.furthestDistance = furthest;
    if (respawnAnchor > (s.respawnAnchor || 0)) s.respawnAnchor = respawnAnchor;
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
