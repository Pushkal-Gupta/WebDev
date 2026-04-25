-- PG.Play initial schema
-- Run this once in your Supabase project (SQL editor or `supabase db push`).

-- ── profiles ────────────────────────────────────────────────────
create table if not exists public.pgplay_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  color        text default '#00fff5',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pgplay_profiles enable row level security;

drop policy if exists "profiles readable" on public.pgplay_profiles;
create policy "profiles readable"
  on public.pgplay_profiles for select
  using (true);

drop policy if exists "profiles self-write" on public.pgplay_profiles;
create policy "profiles self-write"
  on public.pgplay_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles self-update" on public.pgplay_profiles;
create policy "profiles self-update"
  on public.pgplay_profiles for update
  using (auth.uid() = user_id);

-- ── favorites ──────────────────────────────────────────────────
create table if not exists public.pgplay_favorites (
  user_id    uuid references auth.users(id) on delete cascade,
  game_id    text not null,
  added_at   timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.pgplay_favorites enable row level security;

drop policy if exists "favorites self-read" on public.pgplay_favorites;
create policy "favorites self-read"
  on public.pgplay_favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites self-write" on public.pgplay_favorites;
create policy "favorites self-write"
  on public.pgplay_favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites self-delete" on public.pgplay_favorites;
create policy "favorites self-delete"
  on public.pgplay_favorites for delete
  using (auth.uid() = user_id);

-- ── scores ─────────────────────────────────────────────────────
create table if not exists public.pgplay_scores (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  game_id    text not null,
  score      integer not null,
  meta       jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pgplay_scores_user_game_idx
  on public.pgplay_scores (user_id, game_id, score desc);

create index if not exists pgplay_scores_game_top_idx
  on public.pgplay_scores (game_id, score desc);

alter table public.pgplay_scores enable row level security;

drop policy if exists "scores readable" on public.pgplay_scores;
create policy "scores readable"
  on public.pgplay_scores for select
  using (true);

drop policy if exists "scores self-write" on public.pgplay_scores;
create policy "scores self-write"
  on public.pgplay_scores for insert
  with check (auth.uid() = user_id);

-- ── view: personal best per game ───────────────────────────────
create or replace view public.pgplay_best as
  select user_id, game_id, max(score) as best, count(*) as plays, max(created_at) as last_played
  from public.pgplay_scores
  group by user_id, game_id;

-- ── achievements (stub for future) ─────────────────────────────
create table if not exists public.pgplay_achievements (
  user_id     uuid references auth.users(id) on delete cascade,
  achievement text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement)
);

alter table public.pgplay_achievements enable row level security;

drop policy if exists "ach self-read" on public.pgplay_achievements;
create policy "ach self-read"
  on public.pgplay_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "ach self-write" on public.pgplay_achievements;
create policy "ach self-write"
  on public.pgplay_achievements for insert
  with check (auth.uid() = user_id);
