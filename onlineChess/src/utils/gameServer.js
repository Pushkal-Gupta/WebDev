import { supabaseChess } from './supabase';

// Game history stored in chess Supabase (yzrhvdyvvplimcwfiorh)
// user_id is the ID from the auth Supabase session — stored as plain uuid, no RLS auth check

export async function postGame(_token, { color, opponent, timerData, pgnStr, userId }) {
  if (!userId) return null;
  const { error } = await supabaseChess.from('chess_games').insert({
    user_id: userId,
    color,
    opponent: opponent || 'Unknown',
    pgn: pgnStr || '',
    timer_data: timerData || [],
  });
  if (error) console.error('postGame error:', error);
  return !error;
}

export async function getGames(userId) {
  if (!userId) return [];
  const { data, error } = await supabaseChess
    .from('chess_games')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('getGames error:', error); return []; }
  return (data || []).map(g => ({ ...g, pgnStr: g.pgn }));
}
