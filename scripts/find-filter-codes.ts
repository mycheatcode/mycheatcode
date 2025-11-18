import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findFilterCodes() {
  const { data: codes } = await supabase
    .from('cheat_codes')
    .select('id, title, user_id, onboarding_scenario_id, has_game_scenarios')
    .eq('title', 'Filter System');

  console.log('All Filter System codes:');
  codes?.forEach(c => {
    console.log(`  ID: ${c.id}`);
    console.log(`  User ID: ${c.user_id}`);
    console.log(`  Onboarding Scenario: ${c.onboarding_scenario_id || 'none'}`);
    console.log(`  Has scenarios: ${c.has_game_scenarios}`);
    console.log('');
  });
}

findFilterCodes().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
