import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixOnboardingCodes() {
  // Find all codes with onboarding_scenario_id that have has_game_scenarios=true but no scenarios
  const { data: codes } = await supabase
    .from('cheat_codes')
    .select('id, title, onboarding_scenario_id, has_game_scenarios, user_id')
    .not('onboarding_scenario_id', 'is', null);

  console.log(`Found ${codes?.length || 0} codes with onboarding scenarios`);

  for (const code of codes || []) {
    // Check if there are actual scenarios in the database
    const { data: scenarios } = await supabase
      .from('game_scenarios')
      .select('id')
      .eq('cheat_code_id', code.id);

    console.log(`\n"${code.title}" (${code.onboarding_scenario_id})`);
    console.log(`  has_game_scenarios: ${code.has_game_scenarios}`);
    console.log(`  actual scenarios: ${scenarios?.length || 0}`);

    if (code.has_game_scenarios && scenarios?.length === 0) {
      console.log(`  ⚠️  Fixing: setting has_game_scenarios=false`);
      await supabase
        .from('cheat_codes')
        .update({ has_game_scenarios: false })
        .eq('id', code.id);
    }
  }

  console.log('\n✅ Done!');
}

fixOnboardingCodes().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
