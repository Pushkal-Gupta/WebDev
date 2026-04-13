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
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q',
    },
    body: JSON.stringify({ room_id: roomId, winner, reason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Rating update failed');
  }
  return data;
}
