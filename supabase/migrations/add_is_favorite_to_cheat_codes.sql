-- Add is_favorite column to cheat_codes table
ALTER TABLE cheat_codes
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Add index for faster favorite queries
CREATE INDEX IF NOT EXISTS idx_cheat_codes_is_favorite
ON cheat_codes(user_id, is_favorite)
WHERE is_favorite = TRUE;

-- Add index for sorting by created_at (for "New" category)
CREATE INDEX IF NOT EXISTS idx_cheat_codes_created_at
ON cheat_codes(user_id, created_at DESC);

-- Add index for sorting by times_used (for "Most Used" category)
CREATE INDEX IF NOT EXISTS idx_cheat_codes_times_used
ON cheat_codes(user_id, times_used DESC);
