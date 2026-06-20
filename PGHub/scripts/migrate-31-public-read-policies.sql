-- 31: anon clients couldn't see Learn modules, concepts, companies, or contests
-- because those tables have RLS enabled with no public-read policy. (Only
-- PGcode_topics and PGcode_problems had one.) Symptom: /learn, /company,
-- /contests all returned [] and rendered "Couldn't load …" empty states.
--
-- Adds an "Allow public read access to <table>" SELECT policy for every
-- read-only catalog table. User-scoped tables (PGcode_user_progress,
-- PGcode_user_submissions, PGcode_user_achievements, PGcode_friends,
-- PGcode_user_lists, PGcode_user_concept_progress, PGcode_profiles) keep
-- their existing per-user policies.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'PGcode_modules',
      'PGcode_concepts',
      'PGcode_concept_problems',
      'PGcode_concept_prereqs',
      'PGcode_companies',
      'PGcode_company_problems',
      'PGcode_contests',
      'PGcode_contest_problems',
      'PGcode_lists',
      'PGcode_list_problems',
      'PGcode_roadmaps',
      'PGcode_roadmap_nodes',
      'PGcode_roadmap_edges',
      'PGcode_problem_templates',
      'PGcode_interactive_dry_runs',
      'PGcode_interactive_questions',
      'PGcode_playground_snippets'
    ])
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS "Allow public read access to %s" ON %I',
        t, t
      );
      EXECUTE format(
        'CREATE POLICY "Allow public read access to %s" ON %I FOR SELECT TO public USING (true)',
        t, t
      );
    END IF;
  END LOOP;
END $$;
