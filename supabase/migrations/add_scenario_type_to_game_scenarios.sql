-- Add scenario_type column to game_scenarios table
-- This tracks whether a scenario tests internal reframes or external beliefs

ALTER TABLE game_scenarios
ADD COLUMN IF NOT EXISTS scenario_type TEXT NOT NULL DEFAULT 'internal'
CHECK (scenario_type IN ('internal', 'external'));

-- Add index for faster filtering by scenario type
CREATE INDEX IF NOT EXISTS idx_game_scenarios_scenario_type ON game_scenarios(scenario_type);

-- Update existing scenarios to be 'internal' type (default behavior before this change)
UPDATE game_scenarios
SET scenario_type = 'internal'
WHERE scenario_type IS NULL OR scenario_type = '';
