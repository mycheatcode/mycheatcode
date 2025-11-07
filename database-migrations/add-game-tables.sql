-- Migration: Add Game Tables for Cheat Code Practice Games
-- Description: Stores scenarios and session data for the reframe game feature

-- Table: game_scenarios
-- Stores 9-12 AI-generated scenarios per cheat code
CREATE TABLE IF NOT EXISTS game_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cheat_code_id UUID NOT NULL REFERENCES cheat_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Scenario content
  situation TEXT NOT NULL,
  current_thought TEXT NOT NULL,

  -- 4 answer options (stored as JSONB array)
  -- Format: [{ text: string, type: 'negative' | 'helpful' | 'optimal', feedback: string }, ...]
  options JSONB NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_game_scenarios_cheat_code (cheat_code_id),
  INDEX idx_game_scenarios_user (user_id)
);

-- Table: game_sessions
-- Tracks each time a user plays a cheat code's game
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cheat_code_id UUID NOT NULL REFERENCES cheat_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Performance tracking
  score INT NOT NULL CHECK (score >= 0 AND score <= 3), -- 0-3 correct answers
  total_questions INT NOT NULL DEFAULT 3,

  -- Which scenarios were used (array of scenario IDs)
  scenario_ids UUID[] NOT NULL,

  -- User's answers (array of selected option indices)
  user_answers INT[] NOT NULL,

  -- Momentum awarded
  momentum_awarded DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_first_play BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  INDEX idx_game_sessions_user (user_id),
  INDEX idx_game_sessions_cheat_code (cheat_code_id),
  INDEX idx_game_sessions_created (created_at)
);

-- Add RLS policies for security
ALTER TABLE game_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own scenarios
CREATE POLICY "Users can read own scenarios"
  ON game_scenarios FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own scenarios (via service role typically)
CREATE POLICY "Users can insert own scenarios"
  ON game_scenarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only read their own sessions
CREATE POLICY "Users can read own sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add column to cheat_codes to track if scenarios have been generated
ALTER TABLE cheat_codes
  ADD COLUMN IF NOT EXISTS has_game_scenarios BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS game_scenarios_generated_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying codes with scenarios
CREATE INDEX IF NOT EXISTS idx_cheat_codes_has_scenarios
  ON cheat_codes(has_game_scenarios);

COMMENT ON TABLE game_scenarios IS 'Stores AI-generated practice scenarios for each cheat code (9-12 per code)';
COMMENT ON TABLE game_sessions IS 'Tracks user game sessions and performance for momentum calculation';
COMMENT ON COLUMN game_sessions.is_first_play IS 'True if this was played immediately after code creation (bonus momentum)';
