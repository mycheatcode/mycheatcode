-- Remove harsh language from game scenarios
-- Replace "laugh/laughter" references with softer language

UPDATE game_scenarios
SET situation = REPLACE(situation, 'laughter that followed', 'reactions around you')
WHERE situation LIKE '%laughter that followed%';

UPDATE game_scenarios
SET situation = REPLACE(situation, 'laugh at', 'notice')
WHERE situation LIKE '%laugh at%';

UPDATE game_scenarios
SET situation = REPLACE(situation, 'laughing at', 'reacting to')
WHERE situation LIKE '%laughing at%';

UPDATE game_scenarios
SET situation = REPLACE(situation, ' laughs', ' reacts')
WHERE situation LIKE '% laughs%';

UPDATE game_scenarios
SET situation = REPLACE(situation, 'mock', 'notice')
WHERE situation LIKE '%mock%';

UPDATE game_scenarios
SET situation = REPLACE(situation, 'ridicule', 'react to')
WHERE situation LIKE '%ridicule%';

UPDATE game_scenarios
SET situation = REPLACE(situation, 'smirk', 'react')
WHERE situation LIKE '%smirk%';

-- Update current_thought field
UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, 'laugh at', 'notice')
WHERE current_thought LIKE '%laugh at%';

UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, 'laughing at', 'reacting to')
WHERE current_thought LIKE '%laughing at%';

UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, ' laughs', ' reacts')
WHERE current_thought LIKE '% laughs%';

UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, 'laughter', 'reactions')
WHERE current_thought LIKE '%laughter%';

UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, 'mock', 'notice')
WHERE current_thought LIKE '%mock%';

UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, 'ridicule', 'react to')
WHERE current_thought LIKE '%ridicule%';

UPDATE game_scenarios
SET current_thought = REPLACE(current_thought, 'smirk', 'react')
WHERE current_thought LIKE '%smirk%';
