// Coil skin persistence helper.
//
// Single source of truth: localStorage (synchronous, fast). When a player
// is signed in, we shadow-write to pgplay_profiles.prefs.coilSkin so the
// preference follows them across devices. On mount we also fire a
// background fetch — if the server has a different remembered skin we
// override localStorage and notify subscribers so the live game can swap.

import { supabase } from '../supabase.js';

const KEY = 'pgplay-coil-skin';
const DEFAULT = 'cyan';

let userId = null;
const listeners = new Set();

export function getSkin() {
  try { return localStorage.getItem(KEY) || DEFAULT; }
  catch { return DEFAULT; }
}

export function setSkin(skinId) {
  if (!skinId) return;
  try { localStorage.setItem(KEY, skinId); } catch {}
  if (userId) {
    // Fire-and-forget. We deliberately don't await — the picker UI must
    // feel instant. The next sign-in on a new device will pick this up
    // via the initialize() fetch below.
    supabase
      .from('pgplay_profiles')
      .upsert(
        { user_id: userId, prefs: { coilSkin: skinId }, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      .then(({ error }) => { if (error) console.warn('coil skin sync failed', error); });
  }
}

export function subscribeSkinChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// One-time hydration on module import. Reads the signed-in user (if any)
// and overrides localStorage with the server-remembered skin.
async function initialize() {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    userId = data.user.id;
    const { data: profile } = await supabase
      .from('pgplay_profiles')
      .select('prefs')
      .eq('user_id', userId)
      .maybeSingle();
    const remote = profile?.prefs?.coilSkin;
    if (remote && remote !== getSkin()) {
      try { localStorage.setItem(KEY, remote); } catch {}
      listeners.forEach((cb) => { try { cb(remote); } catch {} });
    }
  } catch {
    // Auth/network failures degrade gracefully — local skin still works.
  }
}

initialize();

// Refresh on auth state change (sign in / sign out).
supabase.auth.onAuthStateChange((_evt, session) => {
  userId = session?.user?.id || null;
  if (userId) initialize();
});
