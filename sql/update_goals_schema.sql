-- Update waitlist_signups table to support multiple goals

-- Add new columns for multi-goal support
ALTER TABLE waitlist_signups
ADD COLUMN IF NOT EXISTS goals TEXT[],
ADD COLUMN IF NOT EXISTS custom_goal TEXT;

-- Migrate existing goal data to goals array
UPDATE waitlist_signups
SET goals = ARRAY[goal]
WHERE goals IS NULL AND goal IS NOT NULL;

-- Drop the old goal column (optional - you can keep it for backup)
-- ALTER TABLE waitlist_signups DROP COLUMN IF EXISTS goal;