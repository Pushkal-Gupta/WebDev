/**
 * Server-side move validation client.
 * Sends moves to the validate-move Edge Function instead of broadcasting directly.
 * The Edge Function validates with chess.js, updates authoritative state, and broadcasts.
 */

import { supabase } from './supabase';

const FUNCTION_URL = `https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/validate-move`;

/**
 * Submit a move to the server for validation.
 * @param {object} params
 * @param {string} params.roomId - The room ID
 * @param {string} params.from - Source square (e.g. "e2")
 * @param {string} params.to - Destination square (e.g. "e4")
 * @param {string} [params.promotion] - Promotion piece ("q", "r", "b", "n")
 * @returns {Promise<object>} Server response with validated move data
 */
export async function submitMove({ roomId, from, to, promotion }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const body = { room_id: roomId, from, to };
  if (promotion) body.promotion = promotion;

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Move validation failed');
  }

  return data;
}
