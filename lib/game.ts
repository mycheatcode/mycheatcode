import { createClient } from './supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameScenario, GameSession, GameOption } from './types/game';

/**
 * Save generated scenarios to database
 * For premade cheat codes, pass NULL as userId to save scenarios shared across all users
 */
export async function saveGameScenarios(
  userId: string | null,
  cheatCodeId: string,
  scenarios: Array<{
    situation: string;
    current_thought: string;
    options: GameOption[];
    scenario_type: 'internal' | 'external';
  }>,
  supabaseClient?: SupabaseClient
): Promise<{ error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    // Insert all scenarios
    const { error: insertError } = await supabase
      .from('game_scenarios')
      .insert(
        scenarios.map(scenario => ({
          user_id: userId,
          cheat_code_id: cheatCodeId,
          situation: scenario.situation,
          current_thought: scenario.current_thought,
          options: scenario.options,
          scenario_type: scenario.scenario_type,
        }))
      );

    if (insertError) {
      console.error('Error saving game scenarios:', insertError);
      return { error: insertError.message };
    }

    // Update cheat code to mark scenarios as generated
    // Use OR filter to update both user-specific and premade cheat codes
    const query = supabase
      .from('cheat_codes')
      .update({
        has_game_scenarios: true,
        game_scenarios_generated_at: new Date().toISOString(),
      })
      .eq('id', cheatCodeId);

    // Only filter by user_id if it's not null
    const { error: updateError } = userId
      ? await query.eq('user_id', userId)
      : await query.is('user_id', null);

    if (updateError) {
      console.error('Error updating cheat code:', updateError);
      return { error: updateError.message };
    }

    return {};
  } catch (err) {
    console.error('Unexpected error saving game scenarios:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Get all scenarios for a cheat code
 * Fetches scenarios that belong to the user OR are premade (user_id IS NULL)
 */
export async function getGameScenarios(
  userId: string,
  cheatCodeId: string,
  supabaseClient?: SupabaseClient
): Promise<{ scenarios?: GameScenario[]; error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    const { data, error } = await supabase
      .from('game_scenarios')
      .select('*')
      .eq('cheat_code_id', cheatCodeId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching game scenarios:', error);
      return { error: error.message };
    }

    return { scenarios: data as GameScenario[] };
  } catch (err) {
    console.error('Unexpected error fetching game scenarios:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Get random subset of scenarios for a game session
 */
export async function getRandomScenarios(
  userId: string,
  cheatCodeId: string,
  count: number = 3,
  supabaseClient?: SupabaseClient
): Promise<{ scenarios?: GameScenario[]; error?: string }> {
  const { scenarios, error } = await getGameScenarios(userId, cheatCodeId, supabaseClient);

  if (error || !scenarios) {
    return { error };
  }

  if (scenarios.length < count) {
    return { error: 'Not enough scenarios available' };
  }

  // Shuffle and take first N
  const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
  return { scenarios: shuffled.slice(0, count) };
}

/**
 * Check if scenarios exist for a cheat code
 * Checks for cheat codes that belong to the user OR are premade (user_id IS NULL)
 */
export async function hasGameScenarios(
  userId: string,
  cheatCodeId: string,
  supabaseClient?: SupabaseClient
): Promise<{ hasScenarios: boolean; error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    const { data, error } = await supabase
      .from('cheat_codes')
      .select('has_game_scenarios')
      .eq('id', cheatCodeId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .maybeSingle();

    if (error) {
      console.error('Error checking game scenarios:', error);
      return { hasScenarios: false, error: error.message };
    }

    if (!data) {
      return { hasScenarios: false };
    }

    return { hasScenarios: data.has_game_scenarios || false };
  } catch (err) {
    console.error('Unexpected error checking game scenarios:', err);
    return { hasScenarios: false, error: 'Unexpected error' };
  }
}

/**
 * Calculate score from user answers
 */
export function calculateScore(
  scenarios: GameScenario[],
  userAnswers: number[]
): number {
  let score = 0;

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const answerIndex = userAnswers[i];

    if (answerIndex >= 0 && answerIndex < scenario.options.length) {
      const selectedOption = scenario.options[answerIndex];
      if (selectedOption.type === 'optimal') {
        score++;
      }
    }
  }

  return score;
}

/**
 * Save a completed game session
 */
export async function saveGameSession(
  userId: string,
  cheatCodeId: string,
  scenarioIds: string[],
  userAnswers: number[],
  score: number,
  momentumAwarded: number,
  isFirstPlay: boolean,
  supabaseClient?: SupabaseClient
): Promise<{ sessionId?: string; error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        cheat_code_id: cheatCodeId,
        scenario_ids: scenarioIds,
        user_answers: userAnswers,
        score,
        total_questions: scenarioIds.length,
        momentum_awarded: momentumAwarded,
        is_first_play: isFirstPlay,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving game session:', error);
      return { error: error.message };
    }

    // Update the cheat code's times_used counter
    const { error: updateError } = await supabase.rpc('increment_code_usage', {
      code_id: cheatCodeId
    });

    if (updateError) {
      console.error('Error incrementing times_used:', updateError);
      // Don't fail the whole operation if this update fails
    }

    return { sessionId: data.id };
  } catch (err) {
    console.error('Unexpected error saving game session:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Get count of game sessions for a cheat code
 */
export async function getGameSessionCount(
  userId: string,
  cheatCodeId: string,
  supabaseClient?: SupabaseClient
): Promise<{ count: number; error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    const { count, error } = await supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cheat_code_id', cheatCodeId);

    if (error) {
      console.error('Error counting game sessions:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (err) {
    console.error('Unexpected error counting game sessions:', err);
    return { count: 0, error: 'Unexpected error' };
  }
}

/**
 * Check if user has already earned momentum from this game today (max 3 times per day)
 * Resets daily to encourage consistent practice
 */
export async function canEarnMomentum(
  userId: string,
  cheatCodeId: string,
  supabaseClient?: SupabaseClient
): Promise<{ canEarn: boolean; playsWithMomentum: number; error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    // Get start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    // Check plays with momentum awarded TODAY only
    const { data, error } = await supabase
      .from('game_sessions')
      .select('momentum_awarded')
      .eq('user_id', userId)
      .eq('cheat_code_id', cheatCodeId)
      .gt('momentum_awarded', 0)
      .gte('completed_at', todayStart); // Only count plays from today

    if (error) {
      console.error('Error checking momentum eligibility:', error);
      return { canEarn: false, playsWithMomentum: 0, error: error.message };
    }

    const playsWithMomentum = data?.length || 0;
    const canEarn = playsWithMomentum < 3; // Can earn momentum for first 3 plays PER DAY

    return { canEarn, playsWithMomentum };
  } catch (err) {
    console.error('Unexpected error checking momentum eligibility:', err);
    return { canEarn: false, playsWithMomentum: 0, error: 'Unexpected error' };
  }
}

/**
 * Get all game sessions for a user (for stats/history)
 */
export async function getUserGameSessions(
  userId: string,
  limit: number = 10,
  supabaseClient?: SupabaseClient
): Promise<{ sessions?: GameSession[]; error?: string }> {
  const supabase = supabaseClient || createClient();

  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching game sessions:', error);
      return { error: error.message };
    }

    return { sessions: data as GameSession[] };
  } catch (err) {
    console.error('Unexpected error fetching game sessions:', err);
    return { error: 'Unexpected error' };
  }
}
