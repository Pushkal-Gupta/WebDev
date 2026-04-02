-- ============================================================
-- Migration v2: Auto-Matchmaking — Run in the AUTH Supabase project
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- ─── matchmaking_queue ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  username      text NOT NULL,
  rating        integer NOT NULL DEFAULT 1500,
  category      text NOT NULL,           -- 'bullet'|'blitz'|'rapid'|'classical'
  time_control  jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'searching',  -- 'searching'|'matched'|'cancelled'
  game_room_id  text,
  opponent_id   uuid,
  created_at    timestamptz DEFAULT now(),
  expires_at    timestamptz DEFAULT now() + interval '3 minutes'
);

CREATE INDEX IF NOT EXISTS mmq_search_idx ON matchmaking_queue (category, status, rating);
CREATE INDEX IF NOT EXISTS mmq_user_idx   ON matchmaking_queue (user_id);

ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mmq_select_all"   ON matchmaking_queue FOR SELECT USING (true);
CREATE POLICY "mmq_insert_own"   ON matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mmq_update_own"   ON matchmaking_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mmq_delete_own"   ON matchmaking_queue FOR DELETE USING (auth.uid() = user_id);

-- ─── Atomic claim function ───────────────────────────────────
-- SECURITY DEFINER so it can update both players' rows even
-- though RLS only allows users to update their own row.
CREATE OR REPLACE FUNCTION claim_matchmaking_pair(
  p_claimer_id  uuid,
  p_opponent_id uuid,
  p_room_id     text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  opp_rows integer;
  my_rows  integer;
BEGIN
  -- Step 1: Claim opponent's row (fails if already matched)
  UPDATE matchmaking_queue
  SET    status = 'matched', game_room_id = p_room_id, opponent_id = p_claimer_id
  WHERE  user_id = p_opponent_id AND status = 'searching';
  GET DIAGNOSTICS opp_rows = ROW_COUNT;

  IF opp_rows = 0 THEN
    RETURN false;   -- Opponent was already claimed
  END IF;

  -- Step 2: Claim our own row
  UPDATE matchmaking_queue
  SET    status = 'matched', game_room_id = p_room_id, opponent_id = p_opponent_id
  WHERE  user_id = p_claimer_id AND status = 'searching';
  GET DIAGNOSTICS my_rows = ROW_COUNT;

  IF my_rows = 0 THEN
    -- We were simultaneously claimed by someone else — roll back opponent's row
    UPDATE matchmaking_queue
    SET    status = 'searching', game_room_id = NULL, opponent_id = NULL
    WHERE  user_id = p_opponent_id AND opponent_id = p_claimer_id;
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
