-- MyCheatCode MVP Database Schema - FIXED VERSION
-- This version drops existing constraints if they exist

-- ============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Onboarding data
  age_bracket TEXT,
  skill_level TEXT,
  main_goal TEXT,
  biggest_challenge TEXT,
  preferred_position TEXT,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. CHATS TABLE
-- ============================================
-- Drop the table completely and recreate it
DROP TABLE IF EXISTS public.chats CASCADE;

CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  topic_id TEXT,
  started_from_topic BOOLEAN DEFAULT FALSE,
  messages JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_created_at ON public.chats(created_at DESC);
CREATE INDEX idx_chats_is_active ON public.chats(user_id, is_active);

-- ============================================
-- 3. CHEAT_CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.cheat_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  times_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ
);

ALTER TABLE public.cheat_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own codes" ON public.cheat_codes;
CREATE POLICY "Users can view own codes"
  ON public.cheat_codes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own codes" ON public.cheat_codes;
CREATE POLICY "Users can insert own codes"
  ON public.cheat_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own codes" ON public.cheat_codes;
CREATE POLICY "Users can update own codes"
  ON public.cheat_codes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own codes" ON public.cheat_codes;
CREATE POLICY "Users can delete own codes"
  ON public.cheat_codes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cheat_codes_user_id ON public.cheat_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_cheat_codes_category ON public.cheat_codes(category);
CREATE INDEX IF NOT EXISTS idx_cheat_codes_created_at ON public.cheat_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cheat_codes_is_favorite ON public.cheat_codes(user_id, is_favorite);

-- ============================================
-- 4. PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  current_percentage INTEGER DEFAULT 0 CHECK (current_percentage >= 0 AND current_percentage <= 100),
  total_chats_completed INTEGER DEFAULT 0,
  total_codes_saved INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_decay_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  milestones_reached JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.progress;
CREATE POLICY "Users can view own progress"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress;
CREATE POLICY "Users can insert own progress"
  ON public.progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;
CREATE POLICY "Users can update own progress"
  ON public.progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);

-- ============================================
-- 5. TOPICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon_emoji TEXT,
  initial_prompt TEXT NOT NULL,
  system_context TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active topics" ON public.topics;
CREATE POLICY "Anyone can view active topics"
  ON public.topics FOR SELECT
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_topics_order ON public.topics(order_index);

-- ============================================
-- 6. ACTIVITY_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;
CREATE POLICY "Users can insert own activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.activity_log(activity_type);

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_updated_at ON public.progress;
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.progress (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. SEED DATA
-- ============================================

INSERT INTO public.topics (id, title, description, category, icon_emoji, initial_prompt, system_context, order_index) VALUES
  ('pre_game_nerves', 'Pre-Game Nerves', 'Feeling anxious before a game', 'confidence', '😰',
   'I see you''re dealing with pre-game nerves. That''s totally normal - even pros feel it. Want to talk through what specifically makes you nervous before games?',
   'Focus on helping the user identify specific triggers and develop personalized pre-game routines. Keep it practical and actionable.', 1),
  ('missed_shots', 'Bouncing Back from Missed Shots', 'Getting in your head after missing', 'resilience', '🏀',
   'Missed shots can mess with your head - I get it. Let''s figure out how to reset your mindset when things aren''t falling. What usually happens in your mind after you miss a few?',
   'Help user develop a quick mental reset routine. Focus on short-term memory and moving forward, not dwelling on misses.', 2),
  ('pressure_moments', 'Performing Under Pressure', 'Handling clutch moments', 'pressure', '⏱️',
   'Pressure moments can make or break games. What situations make you feel the most pressure on the court?',
   'Guide user to identify pressure patterns and develop a go-to mindset for clutch situations. Emphasize breathing and focus.', 3),
  ('consistency', 'Building Consistency', 'Showing up the same way every game', 'mindset', '📊',
   'Consistency is what separates good players from great ones. What do you think holds you back from playing at your best level every game?',
   'Help identify factors affecting consistency (sleep, prep, mindset). Create sustainable pre-game rituals.', 4),
  ('confidence_building', 'Building Confidence', 'Developing unshakeable self-belief', 'confidence', '💪',
   'Confidence isn''t just about thinking positive - it''s built through preparation and mindset. Where do you feel your confidence is strongest and weakest on the court?',
   'Help user identify confidence sources and rebuild areas where they doubt themselves. Keep it grounded in reality, not just affirmations.', 5),
  ('focus_distractions', 'Dealing with Distractions', 'Staying locked in during games', 'focus', '🎯',
   'Distractions are everywhere - crowd noise, trash talk, bad calls. What tends to pull your focus away during games?',
   'Teach user to recognize distraction patterns and develop refocus techniques. Keep methods simple and quick to use mid-game.', 6),
  ('bad_game_recovery', 'Recovering from a Bad Game', 'Moving on after a tough performance', 'resilience', '🔄',
   'Bad games happen to everyone. The key is how you bounce back. What''s been eating at you from your last rough game?',
   'Help user process the game objectively, extract lessons, and mentally move forward. Avoid dwelling, focus on next-game preparation.', 7),
  ('team_dynamics', 'Team Chemistry & Communication', 'Being a better teammate', 'leadership', '🤝',
   'Basketball is a team game. How do you feel about your role and communication with your teammates right now?',
   'Explore leadership style, communication patterns, and how to elevate teammates while staying confident in own game.', 8)
ON CONFLICT (id) DO NOTHING;
