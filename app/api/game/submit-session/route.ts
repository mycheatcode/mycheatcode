import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateScore,
  canEarnMomentum,
  saveGameSession,
} from '@/lib/game';
import { awardGameCompletionMomentum, getUserProgress } from '@/lib/progress';
import type { SubmitGameSessionRequest, GameSessionResult, GameScenario } from '@/lib/types/game';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubmitGameSessionRequest = await request.json();
    const { cheat_code_id, scenario_ids, user_answers, is_first_play } = body;

    if (!cheat_code_id || !scenario_ids || !user_answers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (scenario_ids.length !== 3 || user_answers.length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Must have exactly 3 scenarios and answers' },
        { status: 400 }
      );
    }

    // Fetch the scenarios to calculate score
    const { data: scenarios, error: scenariosError } = await supabase
      .from('game_scenarios')
      .select('*')
      .in('id', scenario_ids)
      .eq('user_id', user.id);

    if (scenariosError || !scenarios || scenarios.length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid scenarios' },
        { status: 400 }
      );
    }

    // Calculate score
    const score = calculateScore(scenarios as GameScenario[], user_answers);

    // Check if user can earn momentum
    const { canEarn, playsWithMomentum } = await canEarnMomentum(
      user.id,
      cheat_code_id,
      supabase
    );

    // Get previous momentum for display
    const previousProgress = await getUserProgress(user.id);
    const previousMomentum = previousProgress.progressRaw;

    let momentumAwarded = 0;

    // Check if user has completed onboarding
    const { data: userData } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const hasCompletedOnboarding = userData?.onboarding_completed || false;

    // Award momentum only if:
    // 1. User is eligible (first 2 plays)
    // 2. User has completed onboarding (practice game during onboarding doesn't count)
    if (canEarn && hasCompletedOnboarding) {
      momentumAwarded = await awardGameCompletionMomentum(
        user.id,
        cheat_code_id,
        score,
        is_first_play
      );
    }

    // Save session
    const { sessionId, error: saveError } = await saveGameSession(
      user.id,
      cheat_code_id,
      scenario_ids,
      user_answers,
      score,
      momentumAwarded,
      is_first_play,
      supabase
    );

    if (saveError || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Failed to save session' },
        { status: 500 }
      );
    }

    // Get new momentum
    const newProgress = await getUserProgress(user.id);
    const newMomentum = newProgress.progressRaw;

    const result: GameSessionResult = {
      session_id: sessionId,
      score,
      total_questions: 3,
      momentum_awarded: momentumAwarded,
      is_first_play: is_first_play || false,
      previous_momentum: previousMomentum,
      new_momentum: newMomentum,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error submitting game session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
