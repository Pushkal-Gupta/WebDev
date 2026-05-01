-- PG.Play — backfill display_name on pgplay_profiles for existing users.
--
-- Up to v3.1 the pgplay_leaderboard view fell back to the first 6 hex
-- characters of the user_id whenever pgplay_profiles.display_name was null.
-- New sign-ins now seed display_name client-side (useProfileSync), but
-- accounts that joined before that hook landed still show as random hashes.
-- This migration backfills display_name from the user's auth metadata —
-- preferring an explicit display_name they set, then full_name / name from
-- OAuth, finally the local-part of their email.
--
-- We also insert a profile row for any auth user that never had one. Both
-- statements are idempotent, so the migration is safe to re-run.

-- 1. Fill in missing display_name on existing profile rows.
update public.pgplay_profiles p
set    display_name = derived.name
from (
  select au.id as user_id,
         coalesce(
           nullif(trim(au.raw_user_meta_data->>'display_name'), ''),
           nullif(trim(au.raw_user_meta_data->>'full_name'),    ''),
           nullif(trim(au.raw_user_meta_data->>'name'),         ''),
           nullif(trim(au.raw_user_meta_data->>'user_name'),    ''),
           nullif(trim(au.raw_user_meta_data->>'preferred_username'), ''),
           nullif(split_part(au.email, '@', 1), '')
         ) as name
  from auth.users au
) as derived
where p.user_id = derived.user_id
  and (p.display_name is null or btrim(p.display_name) = '')
  and derived.name is not null;

-- 2. Insert profiles for users who never had a row at all.
insert into public.pgplay_profiles (user_id, display_name)
select au.id,
       coalesce(
         nullif(trim(au.raw_user_meta_data->>'display_name'), ''),
         nullif(trim(au.raw_user_meta_data->>'full_name'),    ''),
         nullif(trim(au.raw_user_meta_data->>'name'),         ''),
         nullif(trim(au.raw_user_meta_data->>'user_name'),    ''),
         nullif(trim(au.raw_user_meta_data->>'preferred_username'), ''),
         nullif(split_part(au.email, '@', 1), '')
       )
from auth.users au
left join public.pgplay_profiles p on p.user_id = au.id
where p.user_id is null;
