-- Fix RLS policies for game_scenarios table to allow reading user's own scenarios OR premade scenarios

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view their own scenarios" ON game_scenarios;
DROP POLICY IF EXISTS "enable_select_for_authenticated_users" ON game_scenarios;

-- Create new SELECT policy that allows users to read their own scenarios OR premade scenarios (user_id IS NULL)
CREATE POLICY "enable_select_for_own_or_premade"
ON public.game_scenarios
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON game_scenarios;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON game_scenarios;

-- Create new INSERT policy that allows users to insert scenarios with their user_id
-- (Service role can still insert with NULL user_id for premade scenarios)
CREATE POLICY "enable_insert_for_authenticated_users"
ON public.game_scenarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
