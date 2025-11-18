import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugPremadeCodes() {
  console.log('\n🔍 Debugging premade codes...\n');

  // Find "Nothing to Lose" code
  const { data: codes, error } = await supabase
    .from('cheat_codes')
    .select('id, title, user_id, onboarding_scenario_id, has_game_scenarios')
    .ilike('title', '%Nothing to Lose%');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📦 "Nothing to Lose" codes found:', codes?.length || 0);
  console.log(JSON.stringify(codes, null, 2));

  // Check scenarios for these codes
  if (codes && codes.length > 0) {
    for (const code of codes) {
      const { data: scenarios } = await supabase
        .from('game_scenarios')
        .select('id, user_id, cheat_code_id')
        .eq('cheat_code_id', code.id);

      console.log(`\n🎮 Scenarios for "${code.title}" (${code.id}):`);
      console.log(`  Count: ${scenarios?.length || 0}`);
      if (scenarios && scenarios.length > 0) {
        console.log(`  Sample:`, scenarios[0]);
      }
    }
  }
}

debugPremadeCodes().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
