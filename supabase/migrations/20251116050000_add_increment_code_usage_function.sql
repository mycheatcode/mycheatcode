-- Add function to increment cheat code times_used counter
-- This is called when a practice game is completed

CREATE OR REPLACE FUNCTION increment_code_usage(code_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE cheat_codes
  SET times_used = COALESCE(times_used, 0) + 1
  WHERE id = code_id;
END;
$$;
