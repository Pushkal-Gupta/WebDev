import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { computeNewRating } from '../utils/glicko2';

const DEFAULT_RATING = {
  rating: 1500,
  rd: 350,
  volatility: 0.06,
  games_played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  peak_rating: 1500,
};

const useRatingStore = create((set, get) => ({
  myRatings: {}, // { bullet: {...}, blitz: {...}, rapid: {...}, classical: {...} }

  _loadingRatings: false,
  loadRatings: async (userId) => {
    if (!userId || get()._loadingRatings) return;
    set({ _loadingRatings: true });
    try {
      const { data } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', userId);
      if (data) {
        const ratings = {};
        data.forEach(r => { ratings[r.category] = r; });
        set({ myRatings: ratings });
      }
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      set({ _loadingRatings: false });
    }
  },

  /**
   * Fetch a single category rating for any user.
   * Returns the rating object or null if not found (use DEFAULT_RATING).
   */
  fetchRating: async (userId, category) => {
    const { data } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .maybeSingle();
    return data;
  },

  /**
   * Compute and persist a Glicko-2 rating update after an online rated game.
   *
   * @param {object} p
   * @param {string} p.userId        Current user's ID
   * @param {string} p.username      Current user's display name
   * @param {string|null} p.opponentId  Opponent's user ID (null = unranked)
   * @param {number} p.score         1=win, 0.5=draw, 0=loss
   * @param {string} p.category      'bullet'|'blitz'|'rapid'|'classical'
   *
   * @returns {{ oldRating, newRating, ratingChange, opponentOldRating } | null}
   */
  updateOnlineGameRating: async ({ userId, username, opponentId, score, category }) => {
    if (!userId || !category) return null;
    const cat = category.toLowerCase();

    // Fetch my current rating
    const myData = await get().fetchRating(userId, cat);
    const my = myData
      ? { ...DEFAULT_RATING, ...myData }
      : { ...DEFAULT_RATING, user_id: userId, username, category: cat };

    // Fetch opponent's current rating (default if first game)
    let opp = { ...DEFAULT_RATING };
    if (opponentId) {
      const oppData = await get().fetchRating(opponentId, cat);
      if (oppData) opp = { ...DEFAULT_RATING, ...oppData };
    }

    // Compute new rating via Glicko-2
    const result = computeNewRating({
      rating: my.rating,
      rd: my.rd,
      volatility: my.volatility,
      opponentRating: opp.rating,
      opponentRd: opp.rd,
      score,
    });

    const newRow = {
      user_id: userId,
      username,
      category: cat,
      rating: result.rating,
      rd: result.rd,
      volatility: result.volatility,
      games_played: my.games_played + 1,
      wins: my.wins + (score === 1 ? 1 : 0),
      losses: my.losses + (score === 0 ? 1 : 0),
      draws: my.draws + (score === 0.5 ? 1 : 0),
      peak_rating: Math.max(my.peak_rating, result.rating),
      last_game_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_ratings')
      .upsert(newRow, { onConflict: 'user_id,category' });

    if (error) {
      console.error('Rating upsert error:', error);
      return null;
    }

    // Update local cache
    set(state => ({
      myRatings: { ...state.myRatings, [cat]: newRow },
    }));

    return {
      oldRating: my.rating,
      newRating: result.rating,
      ratingChange: result.ratingChange,
      opponentOldRating: opp.rating,
    };
  },
}));

export default useRatingStore;
