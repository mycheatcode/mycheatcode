import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ONBOARDING_GAME_SCENARIOS } from '../lib/onboarding-game-scenarios';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedPremadeScenarios() {
  console.log('\n🌱 Seeding premade game scenarios to database...\n');

  // Get all premade cheat codes (where user_id IS NULL)
  const { data: premadeCodes, error: codesError } = await supabase
    .from('cheat_codes')
    .select('id, title, onboarding_scenario_id')
    .is('user_id', null);

  if (codesError || !premadeCodes) {
    console.error('❌ Error fetching premade codes:', codesError);
    return;
  }

  console.log(`📦 Found ${premadeCodes.length} premade codes\n`);

  for (const code of premadeCodes) {
    const { id, title, onboarding_scenario_id } = code;

    if (!onboarding_scenario_id) {
      console.log(`⏭️  Skipping "${title}" - no onboarding_scenario_id`);
      continue;
    }

    // Check if scenarios already exist
    const { data: existingScenarios } = await supabase
      .from('game_scenarios')
      .select('id')
      .eq('cheat_code_id', id)
      .is('user_id', null);

    if (existingScenarios && existingScenarios.length > 0) {
      console.log(`✅ "${title}" - scenarios already exist (${existingScenarios.length} scenarios)`);
      continue;
    }

    // Get scenarios from onboarding game scenarios
    const scenariosData = ONBOARDING_GAME_SCENARIOS[onboarding_scenario_id];

    if (!scenariosData || scenariosData.length === 0) {
      console.log(`⚠️  "${title}" - no scenarios found for onboarding_scenario_id: ${onboarding_scenario_id}`);
      continue;
    }

    // Insert scenarios into database with user_id = NULL (shared across all users)
    const scenariosToInsert = scenariosData.map(scenario => ({
      user_id: null, // NULL means shared across all users
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

seedPremadeScenarios().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
