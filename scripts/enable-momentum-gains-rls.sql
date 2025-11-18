-- Re-enable RLS and create proper policies for momentum_gains table

-- Enable RLS
ALTER TABLE momentum_gains ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own momentum gains" ON momentum_gains;
DROP POLICY IF EXISTS "Users can insert their own momentum gains" ON momentum_gains;
DROP POLICY IF EXISTS "enable_select_for_authenticated_users" ON momentum_gains;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON momentum_gains;
DROP POLICY IF EXISTS "enable_select_for_own_momentum_gains" ON momentum_gains;
DROP POLICY IF EXISTS "enable_insert_for_own_momentum_gains" ON momentum_gains;

-- Create SELECT policy (users can read their own momentum gains)
CREATE POLICY "enable_select_for_own_momentum_gains"
ON public.momentum_gains
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create INSERT policy (users can insert their own momentum gains)
CREATE POLICY "enable_insert_for_own_momentum_gains"
ON public.momentum_gains
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
