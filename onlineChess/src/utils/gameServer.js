import { supabase } from './supabase';

/**
 * Save a completed game to chess_games.
 *
 * Supports both legacy (local/computer) and rated online game calls:
 *   postGame({ userId, color, opponent, timerData, pgnStr })         — local/computer
 *   postGame({ userId, color, opponent, timerData, pgnStr,           — rated online
 *              result, resultReason,
 *              whiteUserId, blackUserId, whiteUsername, blackUsername,
 *              whiteRating, blackRating, whiteRatingChange, blackRatingChange,
 *              category, isRated, timeControlDisplay })
 */
export async function postGame({
  userId,
  color,
  opponent,
  timerData,
  pgnStr,
  result,
  resultReason,
  whiteUserId,
  blackUserId,
  whiteUsername,
  blackUsername,
  whiteRating,
  blackRating,
  whiteRatingChange,
  blackRatingChange,
  category,
  isRated = false,
  timeControlDisplay,
}) {
  if (!userId) return null;

  const row = {
    user_id: userId,
    color,
    opponent: opponent || 'Unknown',
    pgn: pgnStr || '',
    timer_data: timerData || [],
    result,
    result_reason: resultReason,
    white_user_id: whiteUserId,
    black_user_id: blackUserId,
    white_username: whiteUsername,
    black_username: blackUsername,
    white_rating: whiteRating,
    black_rating: blackRating,
    white_rating_change: whiteRatingChange,
    black_rating_change: blackRatingChange,
    time_control_display: timeControlDisplay,
    category,
    is_rated: isRated,
  };

  // Remove undefined fields so Supabase doesn't complain
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);

  const { error } = await supabase.from('chess_games').insert(row);
  if (error) console.error('postGame error:', error);
  return !error;
}

/**
 * Retrieve the 50 most recent games for a user.
 * Queries by user_id (legacy) OR white_user_id / black_user_id (rated online).
 */
export async function getGames(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('chess_games')
    .select('*')
    .or(`user_id.eq.${userId},white_user_id.eq.${userId},black_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('getGames error:', error); return []; }
  // Deduplicate: OR query can return the same game twice (user_id + white_user_id match)
  const seen = new Set();
  const unique = (data || []).filter(g => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
  return unique.map(g => ({ ...g, pgnStr: g.pgn }));
}
