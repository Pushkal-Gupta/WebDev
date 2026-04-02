/**
 * Matchmaking store — auto-pairs players by rating and time control.
 *
 * Flow:
 *  1. joinQueue()  → inserts a matchmaking_queue row, starts polling + personal channel
 *  2. _pollOnce()  → scans queue for a suitable opponent every 3s (expanding rating window)
 *  3. On match:    → calls claim_matchmaking_pair() RPC (atomic), creates chess_rooms row,
 *                     broadcasts to opponent's personal channel, calls onMatched callback
 *  4. Opponent:    → receives broadcast on their matchmaking:{userId} channel, calls onMatched
 */

import { create } from 'zustand';
import { supabase } from '../utils/supabase';

// Module-level handles (avoid storing functions/timers in Zustand state)
let _onMatchedCallback = null;
let _pollRunning       = false;
let _pollTimeoutId     = null;
let _elapsedIntervalId = null;

function genRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const useMatchmakingStore = create((set, get) => ({
  status: 'idle',        // 'idle' | 'searching' | 'matched' | 'error'
  queueId: null,
  personalChannel: null,
  elapsedSeconds: 0,
  errorMsg: null,

  // ─── Public API ───────────────────────────────────────────
  /**
   * Enter the matchmaking queue.
   * @param {{ userId, username, rating, category, timeControl }} params
   * @param {(match: MatchPayload) => void} onMatched  Called when a game is ready.
   *   MatchPayload: { roomId, opponentName, opponentId, yourColor, timeControl }
   */
  joinQueue: async ({ userId, username, rating, category, timeControl }, onMatched) => {
    if (get().status === 'searching') return;

    _onMatchedCallback = onMatched;
    _pollRunning       = false;
    set({ status: 'searching', elapsedSeconds: 0, errorMsg: null, queueId: null });

    // Normalise category to lowercase
    const cat = (category || 'blitz').toLowerCase();

    // 1. Insert queue row
    const { data: qRow, error } = await supabase
      .from('matchmaking_queue')
      .insert({ user_id: userId, username, rating, category: cat, time_control: timeControl })
      .select()
      .single();

    if (error || !qRow) {
      console.error('Matchmaking queue insert error:', error);
      set({ status: 'error', errorMsg: 'Could not join matchmaking. Try again.' });
      return;
    }
    set({ queueId: qRow.id });

    // 2. Subscribe to personal channel — opponent will broadcast the match here
    const personalChannel = supabase.channel(`matchmaking:${userId}`, {
      config: { broadcast: { self: false } },
    });
    personalChannel
      .on('broadcast', { event: 'matched' }, ({ payload }) => {
        get()._onMatchReceived(payload);
      })
      .subscribe();
    set({ personalChannel });

    // 3. Elapsed counter
    const startMs = Date.now();
    _elapsedIntervalId = setInterval(() => {
      set({ elapsedSeconds: Math.floor((Date.now() - startMs) / 1000) });
    }, 1000);

    // 4. Start polling loop
    const pollParams = { userId, username, rating, category: cat, timeControl };
    get()._schedulePoll(pollParams);
  },

  cancelQueue: async () => {
    const { queueId } = get();
    get()._cleanup();
    if (queueId) {
      await supabase.from('matchmaking_queue').delete().eq('id', queueId).catch(console.error);
    }
    set({ status: 'idle', queueId: null, elapsedSeconds: 0, errorMsg: null });
  },

  reset: () => {
    get()._cleanup();
    set({ status: 'idle', queueId: null, elapsedSeconds: 0, errorMsg: null });
  },

  // ─── Internal ─────────────────────────────────────────────
  _schedulePoll: (params) => {
    _pollTimeoutId = setTimeout(async () => {
      if (get().status !== 'searching') return;
      await get()._pollOnce(params);
      if (get().status === 'searching') get()._schedulePoll(params);
    }, 3000);
  },

  _pollOnce: async ({ userId, username, rating, category, timeControl }) => {
    if (_pollRunning || get().status !== 'searching') return;
    _pollRunning = true;
    try {
      // Expanding rating window: ±200 → ±400 → ±800 → unlimited
      const elapsed = get().elapsedSeconds;
      const rWin = elapsed < 30 ? 200 : elapsed < 60 ? 400 : elapsed < 90 ? 800 : 9999;
      const minR = rWin === 9999 ? 0    : rating - rWin;
      const maxR = rWin === 9999 ? 9999 : rating + rWin;

      const { data: candidates } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('category', category)
        .eq('status', 'searching')
        .neq('user_id', userId)
        .gte('rating', minR)
        .lte('rating', maxR)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(1);

      if (!candidates?.length) return;
      const opponent = candidates[0];

      // Atomically claim the pair
      const roomId = genRoomId();
      const { data: claimed, error: claimErr } = await supabase.rpc('claim_matchmaking_pair', {
        p_claimer_id:  userId,
        p_opponent_id: opponent.user_id,
        p_room_id:     roomId,
      });
      if (claimErr || !claimed) return; // Race lost — wait for next poll

      // Create the chess room (status: 'playing', both players already known)
      const { error: roomErr } = await supabase.from('chess_rooms').insert({
        id:          roomId,
        host_id:     userId,
        host_name:   username,
        host_color:  'white',
        guest_id:    opponent.user_id,
        guest_name:  opponent.username,
        time_control: timeControl,
        status:      'playing',
        current_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn:         '',
      });
      if (roomErr) { console.error('Room creation error:', roomErr); return; }

      // Notify opponent via their personal channel
      await get()._sendMatchBroadcast(opponent.user_id, {
        roomId,
        opponentName: username,
        opponentId:   userId,
        yourColor:    'black',
        timeControl,
      });

      // Handle locally (we are white)
      get()._onMatchReceived({
        roomId,
        opponentName: opponent.username,
        opponentId:   opponent.user_id,
        yourColor:    'white',
        timeControl,
      });
    } catch (e) {
      console.error('Poll error:', e);
    } finally {
      _pollRunning = false;
    }
  },

  _sendMatchBroadcast: async (targetUserId, payload) => {
    const ch = supabase.channel(`matchmaking:${targetUserId}`, {
      config: { broadcast: { self: false } },
    });
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 4000);
      ch.subscribe(status => {
        if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); }
      });
    });
    await ch.send({ type: 'broadcast', event: 'matched', payload });
    supabase.removeChannel(ch);
  },

  _onMatchReceived: (payload) => {
    if (get().status !== 'searching') return; // Already handled (guard against double-fire)
    get()._cleanup();
    set({ status: 'matched' });
    _onMatchedCallback?.(payload);
  },

  _cleanup: () => {
    if (_pollTimeoutId)     { clearTimeout(_pollTimeoutId);       _pollTimeoutId     = null; }
    if (_elapsedIntervalId) { clearInterval(_elapsedIntervalId);  _elapsedIntervalId = null; }
    const { personalChannel } = get();
    if (personalChannel) {
      supabase.removeChannel(personalChannel);
      set({ personalChannel: null });
    }
    _pollRunning = false;
  },
}));

export default useMatchmakingStore;
