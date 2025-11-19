-- Add subscription fields to users table
-- This enables the paywall functionality

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paywall_seen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paywall_seen_at TIMESTAMPTZ;

-- Create index for faster subscription checks
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_is_subscribed ON public.users(is_subscribed);

-- Add comment for clarity
COMMENT ON COLUMN public.users.subscription_status IS 'Subscription status: free, trialing, active, past_due, canceled, or paused';
COMMENT ON COLUMN public.users.paywall_seen IS 'Whether user has seen the paywall modal at least once';
