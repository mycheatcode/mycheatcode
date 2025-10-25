-- Create momentum_gains table for tracking all momentum changes
CREATE TABLE IF NOT EXISTS public.momentum_gains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gain_amount DECIMAL(5,2) NOT NULL, -- Can be negative for penalties (future use)
  source TEXT NOT NULL CHECK (source IN ('first_chat', 'first_code', 'first_completion', 'code_creation', 'chat', 'completion')),
  metadata JSONB, -- Store additional context like code_id, chat_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS momentum_gains_user_id_idx ON public.momentum_gains(user_id);
CREATE INDEX IF NOT EXISTS momentum_gains_user_id_created_at_idx ON public.momentum_gains(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS momentum_gains_user_id_source_idx ON public.momentum_gains(user_id, source);

-- Enable RLS
ALTER TABLE public.momentum_gains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own momentum gains"
  ON public.momentum_gains
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own momentum gains"
  ON public.momentum_gains
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create code_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.code_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES public.cheat_codes(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code_id, completed_at::date) -- One completion per code per day
);

-- Create indexes for code_completions
CREATE INDEX IF NOT EXISTS code_completions_user_id_idx ON public.code_completions(user_id);
CREATE INDEX IF NOT EXISTS code_completions_code_id_idx ON public.code_completions(code_id);

-- Enable RLS for code_completions
ALTER TABLE public.code_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for code_completions
CREATE POLICY "Users can view own completions"
  ON public.code_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.code_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
