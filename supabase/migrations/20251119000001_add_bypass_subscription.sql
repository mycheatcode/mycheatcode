-- Add bypass_subscription field to allow testing access
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bypass_subscription BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_bypass_subscription ON public.users(bypass_subscription);

-- Comment explaining the field
COMMENT ON COLUMN public.users.bypass_subscription IS 'Allows user to bypass subscription checks for testing purposes';
