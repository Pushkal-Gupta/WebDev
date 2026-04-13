/**
 * Online multiplayer service — Supabase Realtime Broadcast
 * Uses chess Supabase (yzrhvdyvvplimcwfiorh) for room persistence.
 * Realtime channels handle all move/chat sync — no extra server needed.
 */

import { supabaseChess } from './supabase';

// ─── Room ID generation ───────────────────────────────────────────────────────
function genRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────

export async function createRoom({ hostId, hostName, timeControl }) {
  const id = genRoomId();
  const { error } = await supabaseChess.from('chess_rooms').insert({
    id,
    host_id: hostId,
    host_name: hostName,
    host_color: 'white',
    time_control: timeControl || null,
    status: 'waiting',
    current_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
  });
  if (error) throw new Error(error.message);
  return id;
}

export async function joinRoom({ roomId, guestId, guestName }) {
  const code = roomId.toUpperCase().trim();
  const { data: room, error: fetchErr } = await supabaseChess
    .from('chess_rooms').select('*').eq('id', code).single();

  if (fetchErr || !room) throw new Error('Room not found. Check the code and try again.');
  if (room.status !== 'waiting') throw new Error('This room is already full or finished.');
  if (room.host_id === guestId) throw new Error("You can't join your own room.");

  const { error } = await supabaseChess.from('chess_rooms').update({
    guest_id: guestId,
    guest_name: guestName,
    status: 'playing',
  }).eq('id', code);
  if (error) throw new Error(error.message);

  return { ...room, guest_id: guestId, guest_name: guestName, status: 'playing' };
}

export async function getRoom(roomId) {
  const { data, error } = await supabaseChess
    .from('chess_rooms').select('*').eq('id', roomId.toUpperCase()).single();
  if (error) return null;
  return data;
}

export async function endRoom(roomId) {
  await supabaseChess.from('chess_rooms').update({ status: 'finished' }).eq('id', roomId);
}

// ─── Realtime channel ─────────────────────────────────────────────────────────

export function subscribeToRoom(roomId, handlers = {}) {
  const channel = supabaseChess.channel(`room:${roomId}`, {
    config: { broadcast: { self: false } },
  });

  channel
    .on('broadcast', { event: 'move' },            ({ payload }) => handlers.onMove?.(payload))
    .on('broadcast', { event: 'validated-move' },   ({ payload }) => handlers.onValidatedMove?.(payload))
    .on('broadcast', { event: 'chat' },            ({ payload }) => handlers.onChat?.(payload))
    .on('broadcast', { event: 'resign' },          ({ payload }) => handlers.onResign?.(payload))
    .on('broadcast', { event: 'join' },            ({ payload }) => handlers.onOpponentJoined?.(payload))
    .on('broadcast', { event: 'draw' },            ({ payload }) => handlers.onDrawOffer?.(payload))
    .on('broadcast', { event: 'undo-request' },    ({ payload }) => handlers.onUndoRequest?.(payload))
    .on('broadcast', { event: 'undo-response' },   ({ payload }) => handlers.onUndoResponse?.(payload));

  // Return a promise that resolves to the channel once the subscription is fully
  // established. Without this, broadcasts can be sent/received before the
  // channel is ready, causing the host to never see a friend's join event.
  return new Promise((resolve, reject) => {
    let settled = false;
    channel.subscribe((status) => {
      if (settled) return;
      if (status === 'SUBSCRIBED') {
        settled = true;
        resolve(channel);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        settled = true;
        reject(new Error(`Realtime subscribe failed: ${status}`));
      }
    });
  });
}

export async function broadcastMove(channel, { from, to, promotion, fen }) {
  await channel.send({ type: 'broadcast', event: 'move', payload: { from, to, promotion, fen } });
}

// Update the persisted FEN in chess_rooms (so spectators joining mid-game see current position)
export async function updateRoomFen(roomId, fen) {
  if (!roomId || !fen) return;
  await supabaseChess.from('chess_rooms').update({
    current_fen: fen,
    last_move_at: new Date().toISOString(),
  }).eq('id', roomId);
}

// Fetch all live public games for the spectate list
export async function getPublicGames() {
  const { data } = await supabaseChess
    .from('chess_rooms')
    .select('id, host_name, guest_name, time_control, current_fen, spectator_count, created_at, last_move_at')
    .eq('status', 'playing')
    .eq('is_public', true)
    .order('last_move_at', { ascending: false, nullsFirst: false })
    .limit(50);
  return data || [];
}

// Subscribe as a spectator to a room's broadcast channel (read-only)
export function subscribeAsSpectator(roomId, handlers = {}) {
  const channel = supabaseChess.channel(`room:${roomId}`, {
    config: { broadcast: { self: false } },
  });

  channel
    .on('broadcast', { event: 'move' },           ({ payload }) => handlers.onMove?.(payload))
    .on('broadcast', { event: 'validated-move' },  ({ payload }) => handlers.onMove?.(payload))
    .on('broadcast', { event: 'resign' },         ({ payload }) => handlers.onResign?.(payload))
    .on('broadcast', { event: 'chat' },           ({ payload }) => handlers.onChat?.(payload));

  return new Promise((resolve, reject) => {
    let settled = false;
    channel.subscribe((status) => {
      if (settled) return;
      if (status === 'SUBSCRIBED') {
        settled = true;
        resolve(channel);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        settled = true;
        reject(new Error(`Spectator subscribe failed: ${status}`));
      }
    });
  });
}

export async function broadcastChat(channel, { text, sender }) {
  await channel.send({ type: 'broadcast', event: 'chat', payload: { text, sender, ts: Date.now() } });
}

export async function broadcastResign(channel, userId) {
  await channel.send({ type: 'broadcast', event: 'resign', payload: { userId } });
}

export async function broadcastJoin(channel, { userId, username }) {
  await channel.send({ type: 'broadcast', event: 'join', payload: { userId, username } });
}

export async function broadcastDrawOffer(channel, userId) {
  await channel.send({ type: 'broadcast', event: 'draw', payload: { userId } });
}

export async function broadcastUndoRequest(channel, { userId, playerColor }) {
  await channel.send({ type: 'broadcast', event: 'undo-request', payload: { userId, playerColor } });
}

export async function broadcastUndoResponse(channel, { accepted, userId }) {
  await channel.send({ type: 'broadcast', event: 'undo-response', payload: { accepted, userId } });
}

export function unsubscribe(channel) {
  if (channel) supabaseChess.removeChannel(channel);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function sqToRowCol(sq) {
  return { col: sq.charCodeAt(0) - 97, row: 8 - parseInt(sq[1]) };
}

export function rowColToSq(r, c) {
  return String.fromCharCode(97 + c) + String(8 - r);
}
