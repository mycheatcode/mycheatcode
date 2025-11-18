-- Check RLS policies on game_scenarios table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'game_scenarios'
ORDER BY cmd, policyname;
