import { supabase } from './supabase';

// Universal 1:1 calling — call any friend from anywhere in the app. An invite is an
// ephemeral broadcast on the recipient's personal call channel (no DB row), mirroring
// the proven challenge-notification pattern. The actual WebRTC then rides `comms:{room}`
// (the same channel VideoCall already uses), so the media path is unchanged.

const CALLS_KEY = 'pg_calls_enabled';

// Calls are allowed by default; users can turn them off in settings.
export function callsEnabled() {
  try { return localStorage.getItem(CALLS_KEY) !== '0'; } catch { return true; }
}
export function setCallsEnabled(on) {
  try { localStorage.setItem(CALLS_KEY, on ? '1' : '0'); } catch { /* private mode */ }
}

export function callChannel(userId) {
  return supabase.channel(`call:${userId}`, { config: { broadcast: { self: false } } });
}

export function genRoom() {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 7; i++) s += c[Math.floor(Math.random() * c.length)];
  return `call-${s}`;
}

// Short, human-shareable room code (no ambiguous chars) for ad-hoc calls between anyone —
// friends or not. Two people entering the same code land in the same call.
export function genShortCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

async function fireAndForget(toUserId, event, payload) {
  const ch = callChannel(toUserId);
  await new Promise((resolve) => {
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') ch.send({ type: 'broadcast', event, payload }).then(resolve).catch(resolve);
    });
    setTimeout(resolve, 2500);
  });
  setTimeout(() => supabase.removeChannel(ch), 800);
}

// payload: { room, fromId, fromName, video }
export function sendCallInvite(toUserId, payload) { return fireAndForget(toUserId, 'call-invite', payload); }
// payload: { fromId, fromName, reason?: 'declined'|'cancelled' }
export function sendCallDecline(toUserId, payload) { return fireAndForget(toUserId, 'call-decline', payload); }
