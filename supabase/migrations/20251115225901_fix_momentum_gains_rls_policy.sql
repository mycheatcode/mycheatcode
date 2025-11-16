-- Fix RLS policy for momentum_gains table to allow authenticated users to insert their own records
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own momentum gains" ON momentum_gains;
DROP POLICY IF EXISTS "Users can view their own momentum gains" ON momentum_gains;

-- Enable RLS on momentum_gains table (if not already enabled)
ALTER TABLE momentum_gains ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own momentum gain records
CREATE POLICY "Users can insert their own momentum gains"
ON momentum_gains FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own momentum gain records
CREATE POLICY "Users can view their own momentum gains"
ON momentum_gains FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
