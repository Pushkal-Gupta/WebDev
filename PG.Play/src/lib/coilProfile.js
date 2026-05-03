// Coil profile prefs (skin + display name).
//
// Pattern: localStorage is the synchronous source of truth so reads are
// instant and the UI never blocks on the network — important for users on
// slow connections. When the player is signed in we shadow-write to
// `pgplay_profiles` so prefs roam across devices:
//   - skin   → pgplay_profiles.prefs.coilSkin   (jsonb)
//   - name   → pgplay_profiles.display_name     (the same column the global
//                                                 leaderboard joins against)
//
// On mount we fire a single background fetch. If the server has different
// values we override localStorage and notify subscribers so the live game
// can swap. Skin writes are read-modify-write on the prefs blob so other
// per-key updates don't clobber each other.

import { supabase } from '../supabase.js';

const KEY_SKIN = 'pgplay-coil-skin';
const KEY_NAME = 'pgplay-coil-name';
const DEFAULT_SKIN = 'cyan';
const DEFAULT_NAME = 'You';

let userId = null;
let cachedPrefs = {};
let initPromise = null;

const skinListeners = new Set();
const nameListeners = new Set();

// ---------- Skin ----------
export function getSkin() {
  try { return localStorage.getItem(KEY_SKIN) || DEFAULT_SKIN; }
  catch { return DEFAULT_SKIN; }
}

export function setSkin(skinId) {
  if (!skinId) return;
  try { localStorage.setItem(KEY_SKIN, skinId); } catch {}
  cachedPrefs = { ...cachedPrefs, coilSkin: skinId };
  if (userId) flushSkin(skinId);
}

export function subscribeSkinChange(cb) {
  skinListeners.add(cb);
  return () => skinListeners.delete(cb);
}

// ---------- Name ----------
// Coil's snake name. For signed-in users we mirror to the global
// `display_name` so the leaderboard view sees the same value. For guests
// it's a localStorage-only nickname.
export function getName() {
  try {
    const v = localStorage.getItem(KEY_NAME);
    if (v && v.trim()) return v.trim();
  } catch {}
  return DEFAULT_NAME;
}

export function setName(name) {
  const cleaned = sanitizeName(name);
  if (!cleaned) return;
  try { localStorage.setItem(KEY_NAME, cleaned); } catch {}
  if (userId) flushName(cleaned);
}

export function subscribeNameChange(cb) {
  nameListeners.add(cb);
  return () => nameListeners.delete(cb);
}

function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/\s+/g, ' ').trim().slice(0, 16);
}

// ---------- Server sync ----------
async function flushSkin(skinId) {
  if (!userId) return;
  try {
    if (initPromise) await initPromise;
    const next = { ...cachedPrefs, coilSkin: skinId };
    cachedPrefs = next;
    const { error } = await supabase
      .from('pgplay_profiles')
      .upsert(
        { user_id: userId, prefs: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (error) console.warn('coil prefs sync failed', error);
  } catch (e) {
    console.warn('coil prefs sync failed', e);
  }
}

async function flushName(name) {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from('pgplay_profiles')
      .upsert(
        { user_id: userId, display_name: name, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (error) console.warn('coil name sync failed', error);
  } catch (e) {
    console.warn('coil name sync failed', e);
  }
}

async function initialize() {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    userId = data.user.id;
    const { data: profile } = await supabase
      .from('pgplay_profiles')
      .select('prefs, display_name')
      .eq('user_id', userId)
      .maybeSingle();
    cachedPrefs = profile?.prefs || {};

    const remoteSkin = profile?.prefs?.coilSkin;
    if (remoteSkin && remoteSkin !== getSkin()) {
      try { localStorage.setItem(KEY_SKIN, remoteSkin); } catch {}
      skinListeners.forEach((cb) => { try { cb(remoteSkin); } catch {} });
    }

    const remoteName = sanitizeName(profile?.display_name || '');
    if (remoteName && remoteName !== getName()) {
      try { localStorage.setItem(KEY_NAME, remoteName); } catch {}
      nameListeners.forEach((cb) => { try { cb(remoteName); } catch {} });
    }
  } catch {
    // Auth/network failures degrade gracefully — local prefs still work.
  }
}

initPromise = initialize();

supabase.auth.onAuthStateChange((_evt, session) => {
  userId = session?.user?.id || null;
  if (userId) initPromise = initialize();
  else cachedPrefs = {};
});
