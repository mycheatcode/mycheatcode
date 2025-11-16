-- Fix RLS policy for cheat_codes table
-- This fixes the issue where codes are saved but not appearing in My Codes page

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own cheat codes" ON cheat_codes;
DROP POLICY IF EXISTS "Users can view their own cheat codes" ON cheat_codes;
DROP POLICY IF EXISTS "Users can update their own cheat codes" ON cheat_codes;
DROP POLICY IF EXISTS "Users can delete their own cheat codes" ON cheat_codes;

-- Enable RLS
ALTER TABLE cheat_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations
CREATE POLICY "Users can insert their own cheat codes"
ON cheat_codes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cheat codes"
ON cheat_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cheat codes"
ON cheat_codes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cheat codes"
ON cheat_codes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
