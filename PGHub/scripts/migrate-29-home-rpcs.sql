-- ────────────────────────────────────────────────────────────────────────
-- migrate-29-home-rpcs.sql
--
-- Home-dashboard RPCs:
--   pgcode_user_streak(uid)   → { current, longest, today_solved, total_solved }
--   pgcode_potd(d)            → { problem_id, name, difficulty, topic_id }
--   pgcode_random_unsolved(uid) → { problem_id, name, difficulty, topic_id }
--
-- All SECURITY INVOKER so they respect RLS for the caller.
-- Idempotent: safe to re-run.
-- ────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.pgcode_user_streak(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_today date := current_date;
  v_today_solved boolean := false;
  v_current int := 0;
  v_longest int := 0;
  v_total int := 0;
  v_run int := 0;
  v_prev date := NULL;
  r record;
BEGIN
  -- All distinct solved-dates for this user, descending.
  FOR r IN
    SELECT DISTINCT date_trunc('day', last_solved_at)::date AS d
    FROM "PGcode_user_progress"
    WHERE user_id = uid
      AND last_solved_at IS NOT NULL
      AND status IN ('solved', 'mastered')
    ORDER BY d DESC
  LOOP
    v_total := v_total + 1;
    IF r.d = v_today THEN v_today_solved := true; END IF;

    IF v_prev IS NULL THEN
      v_run := 1;
      v_prev := r.d;
    ELSIF v_prev - r.d = 1 THEN
      v_run := v_run + 1;
      v_prev := r.d;
    ELSE
      IF v_run > v_longest THEN v_longest := v_run; END IF;
      v_run := 1;
      v_prev := r.d;
    END IF;
  END LOOP;
  IF v_run > v_longest THEN v_longest := v_run; END IF;

  -- Current streak: contiguous run that includes today or yesterday.
  v_current := 0;
  v_prev := NULL;
  FOR r IN
    SELECT DISTINCT date_trunc('day', last_solved_at)::date AS d
    FROM "PGcode_user_progress"
    WHERE user_id = uid
      AND last_solved_at IS NOT NULL
      AND status IN ('solved', 'mastered')
    ORDER BY d DESC
  LOOP
    IF v_prev IS NULL THEN
      IF r.d = v_today OR r.d = v_today - 1 THEN
        v_current := 1;
        v_prev := r.d;
      ELSE
        EXIT;
      END IF;
    ELSIF v_prev - r.d = 1 THEN
      v_current := v_current + 1;
      v_prev := r.d;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'current', v_current,
    'longest', v_longest,
    'today_solved', v_today_solved,
    'total_solved', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pgcode_potd(d date DEFAULT current_date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_seed bigint;
  v_count int;
  v_pick int;
  v_row record;
BEGIN
  -- Deterministic-by-date pick over problems that are graded (have method_name + test_cases).
  v_seed := (extract(epoch from d)::bigint) * 2654435761;
  SELECT count(*) INTO v_count
    FROM "PGcode_problems"
    WHERE method_name IS NOT NULL
      AND test_cases IS NOT NULL
      AND jsonb_array_length(test_cases) > 0;
  IF v_count = 0 THEN
    RETURN jsonb_build_object('problem_id', NULL);
  END IF;
  v_pick := abs(v_seed) % v_count;
  SELECT id, name, difficulty, topic_id INTO v_row
    FROM "PGcode_problems"
    WHERE method_name IS NOT NULL
      AND test_cases IS NOT NULL
      AND jsonb_array_length(test_cases) > 0
    ORDER BY id
    OFFSET v_pick
    LIMIT 1;
  RETURN jsonb_build_object(
    'problem_id', v_row.id,
    'name', v_row.name,
    'difficulty', v_row.difficulty,
    'topic_id', v_row.topic_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pgcode_random_unsolved(uid uuid, diff text DEFAULT 'Medium')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT id, name, difficulty, topic_id INTO v_row
    FROM "PGcode_problems" p
    WHERE p.method_name IS NOT NULL
      AND (diff IS NULL OR p.difficulty = diff)
      AND NOT EXISTS (
        SELECT 1 FROM "PGcode_user_progress" up
        WHERE up.user_id = uid
          AND up.problem_id = p.id
          AND up.status IN ('solved', 'mastered')
      )
    ORDER BY random()
    LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('problem_id', NULL);
  END IF;
  RETURN jsonb_build_object(
    'problem_id', v_row.id,
    'name', v_row.name,
    'difficulty', v_row.difficulty,
    'topic_id', v_row.topic_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.pgcode_user_streak(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgcode_potd(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgcode_random_unsolved(uuid, text) TO authenticated;
