-- Add onboarding_scenario_id column to cheat_codes table
-- This allows us to link saved onboarding codes to their premade game scenarios

ALTER TABLE cheat_codes
ADD COLUMN IF NOT EXISTS onboarding_scenario_id text;

-- Add comment to explain the column
COMMENT ON COLUMN cheat_codes.onboarding_scenario_id IS 'Links to premade game scenarios for onboarding codes (e.g. airball_laugh, coach_yells)';
