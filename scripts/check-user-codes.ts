import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUserCodes() {
  // Get the most recent user
  const { data: users } = await supabase
    .from('users')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n📋 Recent users:');
  users?.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} (${u.id}) - ${new Date(u.created_at).toLocaleString()}`);
  });

  if (!users || users.length === 0) return;

  const userId = users[0].id;
  console.log(`\n🔍 Checking codes for newest user: ${users[0].email}`);

  // Get their codes
  const { data: codes } = await supabase
    .from('cheat_codes')
    .select('id, title, has_game_scenarios, onboarding_scenario_id')
    .eq('user_id', userId);

  console.log(`\n📦 Found ${codes?.length || 0} codes:`);
  codes?.forEach((code, i) => {
    console.log(`\n${i + 1}. "${code.title}"`);
    console.log(`   - ID: ${code.id}`);
    console.log(`   - Has scenarios: ${code.has_game_scenarios}`);
    console.log(`   - Onboarding scenario ID: ${code.onboarding_scenario_id || 'none'}`);
  });

  // Check scenarios for each code
  for (const code of codes || []) {
    const { data: scenarios } = await supabase
      .from('game_scenarios')
      .select('id, user_id')
      .eq('cheat_code_id', code.id);

    console.log(`\n   🎮 Scenarios for "${code.title}": ${scenarios?.length || 0}`);
    if (scenarios && scenarios.length > 0) {
      console.log(`      Sample: user_id=${scenarios[0].user_id}`);
    }
  }
}

checkUserCodes().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
