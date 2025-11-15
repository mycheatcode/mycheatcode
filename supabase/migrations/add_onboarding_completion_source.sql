-- Add 'onboarding_completion' to the momentum_gains source check constraint

-- First, drop the existing constraint
ALTER TABLE momentum_gains DROP CONSTRAINT IF EXISTS momentum_gains_source_check;

-- Then, recreate it with the new value included
ALTER TABLE momentum_gains ADD CONSTRAINT momentum_gains_source_check
  CHECK (source IN (
    'first_chat',
    'first_code',
    'first_completion',
    'code_creation',
    'chat',
    'completion',
    'game',
    'first_game',
    'onboarding_completion'
  ));
