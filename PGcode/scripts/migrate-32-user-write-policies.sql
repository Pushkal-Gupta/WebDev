-- 32: user-owned tables need INSERT/UPDATE/DELETE policies for authenticated
-- users. Symptom: /lists Create button errors with "new row violates row-level
-- security policy for table PGcode_user_lists" because the table has RLS on
-- but no owner-write policies.
--
-- For each user-scoped table, allow the authenticated user to manage rows
-- where user_id = auth.uid().

DO $$
DECLARE
  t text;
  uid_col text;
BEGIN
  FOR t, uid_col IN
    SELECT * FROM (VALUES
      ('PGcode_user_lists',            'user_id'),
      ('PGcode_user_progress',         'user_id'),
      ('PGcode_user_submissions',      'user_id'),
      ('PGcode_user_achievements',     'user_id'),
      ('PGcode_user_concept_progress', 'user_id'),
      ('PGcode_friends',               'user_id'),
      ('PGcode_playground_snippets',   'user_id')
    ) AS x(t, uid_col)
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t) THEN
      -- Drop any existing owner-write policies so this migration is idempotent.
      EXECUTE format('DROP POLICY IF EXISTS "%s owner select" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s owner insert" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s owner update" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s owner delete" ON %I', t, t);

      EXECUTE format(
        'CREATE POLICY "%s owner select" ON %I FOR SELECT TO authenticated USING (%I = auth.uid())',
        t, t, uid_col
      );
      EXECUTE format(
        'CREATE POLICY "%s owner insert" ON %I FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())',
        t, t, uid_col
      );
      EXECUTE format(
        'CREATE POLICY "%s owner update" ON %I FOR UPDATE TO authenticated USING (%I = auth.uid()) WITH CHECK (%I = auth.uid())',
        t, t, uid_col, uid_col
      );
      EXECUTE format(
        'CREATE POLICY "%s owner delete" ON %I FOR DELETE TO authenticated USING (%I = auth.uid())',
        t, t, uid_col
      );
    END IF;
  END LOOP;
END $$;
