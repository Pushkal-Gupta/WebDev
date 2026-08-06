import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Live online-presence across PGConnect via a single shared Realtime channel.
// Returns a Set of user ids currently online (including you). No DB/migration.
export function usePresence(userId) {
  const [online, setOnline] = useState(() => new Set());
  useEffect(() => {
    if (!userId) return undefined;
    const ch = supabase.channel('pgconnect-presence', { config: { presence: { key: userId } } });
    const sync = () => {
      try { setOnline(new Set(Object.keys(ch.presenceState()))); } catch { /* channel closing */ }
    };
    ch.on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe((status) => { if (status === 'SUBSCRIBED') ch.track({ at: Date.now() }); });
    return () => { supabase.removeChannel(ch); };
  }, [userId]);
  return online;
}
