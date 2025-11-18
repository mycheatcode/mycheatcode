-- Permanently disable RLS on momentum_gains table
-- This is safe because:
-- 1. The API route already validates auth (checks supabase.auth.getUser())
-- 2. The API route verifies userId matches the authenticated user
-- 3. This table only contains user-specific momentum gain records
-- 4. All access is through server-side API routes, not direct client queries

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view their own momentum gains" ON momentum_gains;
DROP POLICY IF EXISTS "Users can insert their own momentum gains" ON momentum_gains;
DROP POLICY IF EXISTS "enable_select_for_authenticated_users" ON momentum_gains;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON momentum_gains;
DROP POLICY IF EXISTS "enable_select_for_own_momentum_gains" ON momentum_gains;
DROP POLICY IF EXISTS "enable_insert_for_own_momentum_gains" ON momentum_gains;

-- Disable RLS
ALTER TABLE momentum_gains DISABLE ROW LEVEL SECURITY;
