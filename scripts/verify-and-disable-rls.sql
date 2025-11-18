-- First, verify current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'momentum_gains';

-- Show all existing policies
SELECT * FROM pg_policies WHERE tablename = 'momentum_gains';

-- Drop ALL RLS policies (even if they don't exist, no error will be thrown)
DROP POLICY IF EXISTS "Users can view their own momentum gains" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "Users can insert their own momentum gains" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "enable_select_for_authenticated_users" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "enable_select_for_own_momentum_gains" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "enable_insert_for_own_momentum_gains" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON momentum_gains CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON momentum_gains CASCADE;

-- DISABLE RLS
ALTER TABLE momentum_gains DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'momentum_gains';
