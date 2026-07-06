/**
 * Server-side rating update client.
 * Calls the update-rating Edge Function instead of computing ratings client-side.
 */

import { supabase } from './supabase';

const FUNCTION_URL = `https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/update-rating`;

/**
 * Request server-side rating update after a game ends.
 * @param {object} params
 * @param {string} params.roomId - The room ID
 * @param {string} params.winner - "white" | "black" | "draw"
 * @param {string} params.reason - "checkmate" | "timeout" | "resign" | "stalemate" | "draw"
 * @returns {Promise<object>} Server response with old/new ratings for both players
 */
export async function requestRatingUpdate({ roomId, winner, reason }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH',
    },
    body: JSON.stringify({ room_id: roomId, winner, reason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Rating update failed');
  }
  return data;
}
