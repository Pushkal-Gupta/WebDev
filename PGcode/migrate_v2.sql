-- PGcode V2 Migration
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- 1. PROBLEMS: roadmap_set + leetcode_url
-- ============================================
ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS roadmap_set TEXT DEFAULT '200';

ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS leetcode_url TEXT;

-- ============================================
-- 2. USER PROGRESS (per-user, per-problem)
-- ============================================
CREATE TABLE IF NOT EXISTS public."PGcode_user_progress" (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT REFERENCES public."PGcode_problems"(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  solved_on TEXT DEFAULT 'platform',  -- 'platform', 'leetcode', 'both'
  confidence INT DEFAULT 0,           -- 1-5 self-rating
  last_solved_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,         -- spaced repetition
  solve_count INT DEFAULT 0,          -- times solved
  notes TEXT DEFAULT '',              -- personal notes
  last_code JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

-- ============================================
-- 3. TOPIC LEARNING VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS public."PGcode_topic_videos" (
  id SERIAL PRIMARY KEY,
  topic_id TEXT REFERENCES public."PGcode_topics"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  source TEXT DEFAULT 'learnings'
);

-- ============================================
-- 4. USER PROFILES (for social features)
-- ============================================
CREATE TABLE IF NOT EXISTS public."PGcode_profiles" (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_solve_date DATE,
  total_solved INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. FRIENDS
-- ============================================
CREATE TABLE IF NOT EXISTS public."PGcode_friends" (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- User Progress
ALTER TABLE public."PGcode_user_progress" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own progress" ON public."PGcode_user_progress"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public."PGcode_user_progress"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public."PGcode_user_progress"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public."PGcode_user_progress"
  FOR DELETE USING (auth.uid() = user_id);

-- Topic Videos (public read)
ALTER TABLE public."PGcode_topic_videos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read topic videos" ON public."PGcode_topic_videos"
  FOR SELECT USING (true);

-- Profiles
ALTER TABLE public."PGcode_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public readable" ON public."PGcode_profiles"
  FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public."PGcode_profiles"
  FOR ALL USING (auth.uid() = user_id);

-- Friends
ALTER TABLE public."PGcode_friends" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own friend requests" ON public."PGcode_friends"
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users send friend requests" ON public."PGcode_friends"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own friend requests" ON public."PGcode_friends"
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users delete own friend requests" ON public."PGcode_friends"
  FOR DELETE USING (auth.uid() = user_id);
