-- Add server-side timing columns to chess_rooms
-- These enable server-authoritative time tracking

ALTER TABLE chess_rooms
  ADD COLUMN IF NOT EXISTS white_time_ms integer,
  ADD COLUMN IF NOT EXISTS black_time_ms integer,
  ADD COLUMN IF NOT EXISTS last_move_at timestamptz,
  ADD COLUMN IF NOT EXISTS result jsonb;

-- Initialize time from time_control for existing rooms
-- (new rooms will set these on creation)
COMMENT ON COLUMN chess_rooms.white_time_ms IS 'White remaining time in milliseconds (server-authoritative)';
COMMENT ON COLUMN chess_rooms.black_time_ms IS 'Black remaining time in milliseconds (server-authoritative)';
COMMENT ON COLUMN chess_rooms.last_move_at IS 'Server timestamp of the last validated move';
COMMENT ON COLUMN chess_rooms.result IS 'Game result: {winner, reason} set by server on game end';
