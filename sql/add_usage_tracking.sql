-- Add usage tracking to cheat codes
-- This enables tracking of how many times a code has been used and when

-- Add columns to cheat_codes table
ALTER TABLE public.cheat_codes
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Create usage log table for detailed tracking
CREATE TABLE IF NOT EXISTS public.cheat_code_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cheat_code_id UUID NOT NULL REFERENCES public.cheat_codes(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on usage log
ALTER TABLE public.cheat_code_usage_log ENABLE ROW LEVEL SECURITY;

-- Policies for usage log
DROP POLICY IF EXISTS "Users can view own usage log" ON public.cheat_code_usage_log;
CREATE POLICY "Users can view own usage log"
  ON public.cheat_code_usage_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage log" ON public.cheat_code_usage_log;
CREATE POLICY "Users can insert own usage log"
  ON public.cheat_code_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON public.cheat_code_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_cheat_code_id ON public.cheat_code_usage_log(cheat_code_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_used_at ON public.cheat_code_usage_log(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_log_user_code ON public.cheat_code_usage_log(user_id, cheat_code_id, used_at DESC);
