-- Remove youth-specific language from game scenarios for adult players
-- This replaces phrases like "I'm learning" from scenarios belonging to adult players (18+)

-- Update individual option texts within the JSONB options array
-- We'll use a simpler approach: fetch, update in app, or use simpler SQL

-- For adult/recreational players, replace youth-specific language
-- This uses PostgreSQL's jsonb_set to update nested values

-- Note: This is a simplified version that targets specific common phrases
-- More complex nested JSONB updates may require application-level processing

DO $$
DECLARE
  scenario_record RECORD;
  updated_options JSONB;
  option_record JSONB;
  option_text TEXT;
  updated_text TEXT;
BEGIN
  -- Loop through all scenarios for adult users
  FOR scenario_record IN
    SELECT gs.id, gs.options, gs.user_id
    FROM game_scenarios gs
    INNER JOIN users u ON gs.user_id = u.id
    WHERE u.age_bracket != 'youth' OR u.age_bracket IS NULL
  LOOP
    updated_options := '[]'::jsonb;

    -- Loop through each option in the options array
    FOR option_record IN
      SELECT * FROM jsonb_array_elements(scenario_record.options)
    LOOP
      option_text := option_record->>'text';
      updated_text := option_text;

      -- Replace youth-specific phrases
      updated_text := REPLACE(updated_text, 'I''m learning', 'Focus on execution');
      updated_text := REPLACE(updated_text, 'I''m still learning', 'Trust my training');
      updated_text := REPLACE(updated_text, 'I''m still developing', 'Trust my training');
      updated_text := REPLACE(updated_text, 'I''m trying my best', 'Attack the opportunity');
      updated_text := REPLACE(updated_text, 'I''ll get better', 'Next play');
      updated_text := REPLACE(updated_text, 'still learning', 'developing my game');

      -- If text changed, update the option, otherwise keep original
      IF updated_text != option_text THEN
        option_record := jsonb_set(option_record, '{text}', to_jsonb(updated_text));
      END IF;

      -- Add to updated options array
      updated_options := updated_options || jsonb_build_array(option_record);
    END LOOP;

    -- Update the scenario with new options
    UPDATE game_scenarios
    SET options = updated_options
    WHERE id = scenario_record.id;
  END LOOP;
END $$;
