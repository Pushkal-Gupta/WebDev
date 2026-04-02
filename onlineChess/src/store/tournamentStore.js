import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { computeSwissPairings, applyRoundResults } from '../utils/swissPairing';

const useTournamentStore = create((set, get) => ({
  tournaments:    [],   // list view (upcoming + active)
  activeTournament: null, // full detail { ...tournament, players, pairings }
  loading:        false,
  detailLoading:  false,
  error:          null,

  // ── Load list of upcoming/active tournaments ──────────────────────────────
  async loadTournaments() {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['upcoming', 'registration', 'active'])
      .order('starts_at', { ascending: true })
      .limit(20);
    if (error) { set({ loading: false, error: error.message }); return; }
    set({ tournaments: data || [], loading: false });
  },

  // ── Load full tournament detail ───────────────────────────────────────────
  async loadTournament(tournamentId) {
    set({ detailLoading: true, error: null });
    const [
      { data: t },
      { data: players },
      { data: pairings },
    ] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('tournament_players').select('*').eq('tournament_id', tournamentId),
      supabase.from('tournament_pairings').select('*').eq('tournament_id', tournamentId).order('round').order('created_at'),
    ]);

    if (!t) { set({ detailLoading: false, error: 'Tournament not found' }); return; }

    set({
      activeTournament: { ...t, players: players || [], pairings: pairings || [] },
      detailLoading: false,
    });
  },

  // ── Register for a tournament ─────────────────────────────────────────────
  async register(tournamentId, userId, username, seedRating) {
    const { error } = await supabase.from('tournament_players').insert({
      tournament_id: tournamentId,
      user_id:       userId,
      username,
      seed_rating:   seedRating || 1500,
    });
    if (error) throw new Error(error.message);
    await get().loadTournament(tournamentId);
  },

  // ── Withdraw from a tournament ────────────────────────────────────────────
  async withdraw(tournamentId, userId) {
    const { error } = await supabase
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    await get().loadTournament(tournamentId);
  },

  // ── Create a tournament (creator only) ───────────────────────────────────
  async createTournament({ name, format, category, timeControl, numRounds, maxPlayers, startsAt }) {
    const { data, error } = await supabase.from('tournaments').insert({
      name,
      format:       format || 'swiss',
      category:     (category || 'blitz').toLowerCase(),
      time_control: timeControl,
      num_rounds:   numRounds || 5,
      max_players:  maxPlayers || 32,
      starts_at:    startsAt,
      status:       'registration',
    }).select().single();
    if (error) throw new Error(error.message);
    await get().loadTournaments();
    return data;
  },

  // ── Generate next round pairings (creator / admin) ────────────────────────
  async generateNextRound(tournamentId) {
    const t = get().activeTournament;
    if (!t || t.id !== tournamentId) await get().loadTournament(tournamentId);
    const { activeTournament: tour } = get();

    const nextRound = (tour.current_round || 0) + 1;
    const history   = tour.pairings || [];
    const players   = (tour.players || []).filter(p => !p.withdrawn);

    const pairs = computeSwissPairings(players, history);
    if (!pairs.length) throw new Error('Could not compute pairings — not enough players.');

    // Insert pairing rows
    const rows = pairs.map(p => ({
      tournament_id: tournamentId,
      round:         nextRound,
      white_user_id: p.white_user_id,
      black_user_id: p.black_user_id || null,
      result:        p.black_user_id ? null : 'bye',
    }));

    const { error: pErr } = await supabase.from('tournament_pairings').insert(rows);
    if (pErr) throw new Error(pErr.message);

    // Update tournament round counter and status
    const { error: tErr } = await supabase
      .from('tournaments')
      .update({ current_round: nextRound, status: 'active' })
      .eq('id', tournamentId);
    if (tErr) throw new Error(tErr.message);

    // Auto-assign byes
    for (const p of rows.filter(r => r.result === 'bye')) {
      await supabase
        .from('tournament_players')
        .update({ has_bye: true, score: supabase.rpc ? undefined : 0 }) // update handled below
        .eq('tournament_id', tournamentId)
        .eq('user_id', p.white_user_id);
    }

    await get().loadTournament(tournamentId);
  },

  // ── Record a game result ──────────────────────────────────────────────────
  async recordResult(pairingId, result) {
    const { error } = await supabase
      .from('tournament_pairings')
      .update({ result })
      .eq('id', pairingId);
    if (error) throw new Error(error.message);

    // If all pairings in the round have results → update standings
    const { activeTournament: tour } = get();
    if (!tour) return;

    const pairingRow = tour.pairings.find(p => p.id === pairingId);
    if (!pairingRow) return;
    const round = pairingRow.round;

    // Reload to get fresh data before computing standings
    await get().loadTournament(tour.id);
    const fresh = get().activeTournament;
    const roundPairings = fresh.pairings.filter(p => p.round === round);
    const allDone = roundPairings.every(p => p.result !== null);

    if (allDone) {
      // Compute updated player standings
      const updated = applyRoundResults(fresh.players, roundPairings);
      // Upsert updated rows
      await Promise.all(updated.map(p =>
        supabase.from('tournament_players').upsert({
          tournament_id: tour.id,
          user_id:       p.user_id,
          username:      p.username,
          seed_rating:   p.seed_rating,
          score:         p.score,
          buchholz:      p.buchholz,
          wins:          p.wins,
          losses:        p.losses,
          draws:         p.draws,
          has_bye:       p.has_bye,
        }, { onConflict: 'tournament_id,user_id' })
      ));

      // Check if tournament is over (all rounds played)
      if (round >= fresh.num_rounds) {
        await supabase.from('tournaments').update({ status: 'finished' }).eq('id', tour.id);
      }
    }

    await get().loadTournament(tour.id);
  },

  // ── Subscribe to live updates for the active tournament ──────────────────
  subscribeToTournament(tournamentId) {
    return supabase
      .channel(`tournament:${tournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tournament_pairings',
        filter: `tournament_id=eq.${tournamentId}`,
      }, () => get().loadTournament(tournamentId))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tournament_players',
        filter: `tournament_id=eq.${tournamentId}`,
      }, () => get().loadTournament(tournamentId))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tournaments',
        filter: `id=eq.${tournamentId}`,
      }, () => get().loadTournament(tournamentId))
      .subscribe();
  },
}));

export default useTournamentStore;
