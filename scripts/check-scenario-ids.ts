import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkScenarioIds() {
  // Get most recent user
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  const userId = users?.[0]?.id;

  // Get Filter System code
  const { data: code } = await supabase
    .from('cheat_codes')
    .select('id, title, user_id')
    .eq('title', 'Filter System')
    .eq('user_id', userId!)
    .single();

  if (!code) {
    console.log('No Filter System code found');
    return;
  }

  console.log(`\nChecking scenario IDs for "${code.title}" (${code.id})\n`);

  // Get scenarios
  const { data: scenarios } = await supabase
    .from('game_scenarios')
    .select('id, situation')
    .eq('cheat_code_id', code.id)
    .order('created_at', { ascending: true });

  console.log(`Found ${scenarios?.length || 0} scenarios:\n`);
  scenarios?.forEach((s, i) => {
    console.log(`${i + 1}. ID: ${s.id}`);
    console.log(`   Situation: ${s.situation.substring(0, 50)}...`);
  });
}

checkScenarioIds().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
