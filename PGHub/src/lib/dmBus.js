import { supabase } from './supabase';
import { dmChannel } from './friends';

// ONE app-wide DM subscription. Multiple components need incoming DMs (message toast,
// chat dock, the PGConnect hub, the friends panel), but Supabase multiplexes same-topic
// subscriptions from one client into a single join — so if each component opened its own
// `dm:{userId}` channel, whichever unmounts first and calls removeChannel() would tear the
// shared join down and silently break the others. Instead we keep exactly one channel and
// re-emit every incoming DM as a `pg:dm` window event that any number of listeners consume.

let channel = null;
let currentUserId = null;

export function startDmBus(userId) {
  if (!userId || currentUserId === userId) return;
  stopDmBus();
  currentUserId = userId;
  channel = dmChannel(userId);
  channel.on('broadcast', { event: 'dm' }, ({ payload }) => {
    if (payload) window.dispatchEvent(new CustomEvent('pg:dm', { detail: payload }));
  });
  channel.subscribe();
}

export function stopDmBus() {
  if (channel) { try { supabase.removeChannel(channel); } catch { /* noop */ } channel = null; }
  currentUserId = null;
}
