-- PG.Play v3: add a flexible prefs blob to player profiles.
--
-- Used by per-game cosmetic preferences (e.g. Coil's skin) so a player's
-- visual customisation follows them across devices. JSONB so any future
-- game can stash its own keys without a schema migration.

alter table public.pgplay_profiles
  add column if not exists prefs jsonb not null default '{}'::jsonb;

-- The existing self-update RLS policy already lets the user write their
-- own row, which now covers prefs. Nothing else needs adjustment.
