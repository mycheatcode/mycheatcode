-- Add onboarding fields to users table for Confidence Coach

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
ADD COLUMN IF NOT EXISTS confidence_blockers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS confidence_goal TEXT;

-- Add index for confidence level queries
CREATE INDEX IF NOT EXISTS idx_users_confidence_level ON public.users(confidence_level);
