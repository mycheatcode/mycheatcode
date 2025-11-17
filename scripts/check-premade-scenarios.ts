import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPremadeScenarios() {
  const cheatCodeId = 'ea72c091-c21e-411c-b7db-1956b757996c';

  console.log('\n🔍 Checking premade scenarios for cheat code:', cheatCodeId);

  // Check if cheat code exists and has scenarios flag
  const { data: cheatCode, error: codeError } = await supabase
    .from('cheat_codes')
    .select('id, title, user_id, has_game_scenarios, game_scenarios_generated_at')
    .eq('id', cheatCodeId)
    .maybeSingle();

  console.log('\n📋 Cheat Code Info:');
  console.log(cheatCode);
  console.log('Error:', codeError);

  // Check if scenarios exist
  const { data: scenarios, error: scenariosError } = await supabase
    .from('game_scenarios')
    .select('id, user_id, cheat_code_id, created_at')
    .eq('cheat_code_id', cheatCodeId);

  console.log('\n🎮 Scenarios:');
  console.log('Count:', scenarios?.length || 0);
  console.log('First 3:', scenarios?.slice(0, 3));
  console.log('Error:', scenariosError);

  // Check with OR filter (how the fix should work)
  const userId = '2b5e4c55-f7d7-4535-8fad-b982edadb543'; // From the logs
  const { data: scenariosWithOr, error: orError } = await supabase
    .from('game_scenarios')
    .select('id, user_id, cheat_code_id')
    .eq('cheat_code_id', cheatCodeId)
    .or(`user_id.eq.${userId},user_id.is.null`);

  console.log('\n🔧 Scenarios with OR filter:');
  console.log('Count:', scenariosWithOr?.length || 0);
  console.log('Error:', orError);
}

checkPremadeScenarios().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
