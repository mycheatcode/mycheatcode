-- Fix RLS policy for momentum_gains table
-- This fixes the issue where game sessions fail to save because momentum gains can't be inserted

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own momentum gains" ON momentum_gains;
DROP POLICY IF EXISTS "Users can view their own momentum gains" ON momentum_gains;

-- Enable RLS
ALTER TABLE momentum_gains ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations
CREATE POLICY "Users can insert their own momentum gains"
ON momentum_gains FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own momentum gains"
ON momentum_gains FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
