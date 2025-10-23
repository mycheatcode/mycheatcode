-- Add is_active column to cheat_codes table
-- This allows users to archive/hide cheat codes without deleting them

ALTER TABLE cheat_codes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create an index for better query performance when filtering by is_active
CREATE INDEX IF NOT EXISTS idx_cheat_codes_is_active
ON cheat_codes(user_id, is_active);

-- Add a comment to document the column
COMMENT ON COLUMN cheat_codes.is_active IS 'Whether the cheat code is active (true) or archived (false)';
