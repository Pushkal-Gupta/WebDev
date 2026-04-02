-- ============================================================
-- Migration v5: Spectating — Run in the AUTH Supabase project
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- Add spectating columns to chess_rooms
ALTER TABLE chess_rooms
  ADD COLUMN IF NOT EXISTS is_public      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS spectator_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_move_at   timestamptz;

-- Public live games view (used by SpectateList)
CREATE OR REPLACE VIEW public_games AS
  SELECT
    id,
    host_id,   host_name,
    guest_id,  guest_name,
    status,
    time_control,
    current_fen,
    is_public,
    spectator_count,
    created_at,
    last_move_at
  FROM chess_rooms
  WHERE status = 'playing' AND is_public = true;

-- Allow the room UPDATE policy to cover last_move_at and current_fen updates
-- (existing policy already allows host/guest to UPDATE — no change needed)
