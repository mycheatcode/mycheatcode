import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ONBOARDING_GAME_SCENARIOS } from '../lib/onboarding-game-scenarios';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedUserOnboardingScenarios() {
  console.log('\n🌱 Seeding onboarding scenarios for user codes...\n');

  // Get all user codes with onboarding_scenario_id that don't have scenarios
  const { data: codes, error: codesError } = await supabase
    .from('cheat_codes')
    .select('id, title, user_id, onboarding_scenario_id, has_game_scenarios')
    .not('onboarding_scenario_id', 'is', null)
    .not('user_id', 'is', null);

  if (codesError || !codes) {
    console.error('❌ Error fetching user codes:', codesError);
    return;
  }

  console.log(`📦 Found ${codes.length} user codes with onboarding scenarios\n`);

  for (const code of codes) {
    const { id, title, user_id, onboarding_scenario_id, has_game_scenarios } = code;

    // Check if scenarios already exist
    const { data: existingScenarios } = await supabase
      .from('game_scenarios')
      .select('id')
      .eq('cheat_code_id', id)
      .eq('user_id', user_id);

    if (existingScenarios && existingScenarios.length > 0) {
      console.log(`✅ "${title}" - scenarios already exist (${existingScenarios.length} scenarios)`);
      continue;
    }

    // Get scenarios from onboarding game scenarios
    const scenariosData = ONBOARDING_GAME_SCENARIOS[onboarding_scenario_id!];

    if (!scenariosData || scenariosData.length === 0) {
      console.log(`⚠️  "${title}" - no scenarios found for: ${onboarding_scenario_id}`);
      continue;
    }

    console.log(`🎮 Seeding "${title}" (${onboarding_scenario_id})...`);

    // Insert scenarios into database with the user's ID
    const scenariosToInsert = scenariosData.map(scenario => ({
      user_id: user_id,
      cheat_code_id: id,
      situation: scenario.situation,
      current_thought: scenario.current_thought,
      options: scenario.options,
      scenario_type: scenario.scenario_type,
    }));

    const { error: insertError } = await supabase
      .from('game_scenarios')
      .insert(scenariosToInsert);

    if (insertError) {
      console.error(`❌ "${title}" - error inserting scenarios:`, insertError);
      continue;
    }

    // Update cheat code to mark scenarios as generated
    const { error: updateError } = await supabase
      .from('cheat_codes')
      .update({
        has_game_scenarios: true,
        game_scenarios_generated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error(`❌ "${title}" - error updating cheat code:`, updateError);
      continue;
    }

    console.log(`✨ "${title}" - successfully seeded ${scenariosData.length} scenarios`);
  }

  console.log('\n✅ Seeding complete!\n');
}

seedUserOnboardingScenarios().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
