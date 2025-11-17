-- Add streak tracking columns to users table

-- Add current_streak column (number of consecutive days with activity)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0 NOT NULL;

-- Add last_activity_date column (to track when streak should reset)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Add longest_streak column (to track personal best)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0 NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_last_activity_date ON users(last_activity_date);

-- Add comment explaining the streak logic
COMMENT ON COLUMN users.current_streak IS 'Number of consecutive days user has been active (earned momentum)';
COMMENT ON COLUMN users.last_activity_date IS 'Date of last activity (in UTC). Used to calculate if streak should continue or reset.';
COMMENT ON COLUMN users.longest_streak IS 'Longest streak the user has ever achieved';
