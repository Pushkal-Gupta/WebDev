import { useEffect } from 'react';
import { supabase } from '../supabase.js';

// Pick a friendly display_name from whatever the OAuth provider / signup
// flow gave us, falling back to the local-part of the email. We never
// invent a name — if all of these are missing, the leaderboard view's
// own fallback (a 6-char user_id slice) still applies.
function deriveName(user) {
  const meta = user?.user_metadata || {};
  const candidates = [
    meta.display_name,
    meta.full_name,
    meta.name,
    meta.user_name,
    meta.preferred_username,
    user?.email ? user.email.split('@')[0] : null,
  ];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (trimmed) return trimmed.slice(0, 40);
    }
  }
  return null;
}

/**
 * On sign-in, make sure pgplay_profiles has a row for this user with a
 * friendly display_name. If a row already exists with a name set, leave it
 * alone. If display_name is null (or the row is missing), seed it from auth
 * metadata. Without this, the public leaderboard view falls back to a
 * 6-character user_id hash for everyone who never opened the profile drawer.
 *
 * Idempotent — safe to run on every session restore.
 */
export function useProfileSync(user) {
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const desired = deriveName(user);
      if (!desired) return;

      const { data: existing, error: readErr } = await supabase
        .from('pgplay_profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled || readErr) return;

      if (!existing) {
        await supabase.from('pgplay_profiles').insert({
          user_id: user.id,
          display_name: desired,
        });
        return;
      }
      if (!existing.display_name || !existing.display_name.trim()) {
        await supabase.from('pgplay_profiles')
          .update({ display_name: desired })
          .eq('user_id', user.id);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);  // eslint-disable-line react-hooks/exhaustive-deps
}
