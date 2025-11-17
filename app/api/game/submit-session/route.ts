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

    console.log('📥 Received game session submission:', {
      cheat_code_id,
      scenario_ids,
      user_answers,
      is_first_play,
      scenario_ids_length: scenario_ids?.length,
      user_answers_length: user_answers?.length,
    });

    if (!cheat_code_id || !scenario_ids || !user_answers) {
      console.error('❌ Missing required fields:', { cheat_code_id, has_scenario_ids: !!scenario_ids, has_user_answers: !!user_answers });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (scenario_ids.length !== 3 || user_answers.length !== 3) {
      console.error('❌ Invalid array lengths:', {
        scenario_ids_length: scenario_ids.length,
        user_answers_length: user_answers.length,
        expected: 3,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Must have exactly 3 scenarios and answers',
          details: {
            scenario_ids_length: scenario_ids.length,
            user_answers_length: user_answers.length,
          }
        },
        { status: 400 }
      );
    }

    // Fetch the scenarios to calculate score
    // NOTE: Scenarios can be either user-specific OR premade (user_id IS NULL)
    console.log('🎮 Fetching scenarios:', { scenario_ids, user_id: user.id });
    const { data: scenarios, error: scenariosError } = await supabase
      .from('game_scenarios')
      .select('*')
      .in('id', scenario_ids);
      // Removed .eq('user_id', user.id) to allow premade scenarios with NULL user_id

    console.log('🎮 Scenarios query result:', {
      found: scenarios?.length,
      error: scenariosError?.message,
      scenariosError
    });

    if (scenariosError || !scenarios || scenarios.length !== 3) {
      console.error('❌ Invalid scenarios:', {
        scenariosError,
        foundCount: scenarios?.length,
        expectedCount: 3,
        scenario_ids,
        user_id: user.id
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid scenarios',
          details: {
            found: scenarios?.length || 0,
            expected: 3,
            dbError: scenariosError?.message
          }
        },
        { status: 400 }
      );
    }

    // Security check: Verify scenarios belong to user OR are premade (NULL user_id)
    const invalidScenarios = scenarios.filter(s => s.user_id !== null && s.user_id !== user.id);
    if (invalidScenarios.length > 0) {
      console.error('❌ Scenarios belong to different user:', { invalidScenarios });
      return NextResponse.json(
        { success: false, error: 'Unauthorized scenarios' },
        { status: 403 }
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
    const previousProgress = await getUserProgress(supabase, user.id);
    const previousMomentum = previousProgress.progressRaw;

    let momentumAwarded = 0;
    let noMomentumReason: 'daily_cap' | 'daily_code_limit' | null = null;

    // Check if user has completed onboarding
    const { data: userData } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const hasCompletedOnboarding = userData?.onboarding_completed || false;

    // Award momentum only if:
    // 1. User is eligible (first 3 plays per day per code)
    // 2. User has completed onboarding (practice game during onboarding doesn't count)
    if (canEarn && hasCompletedOnboarding) {
      momentumAwarded = await awardGameCompletionMomentum(
        supabase,
        user.id,
        cheat_code_id,
        score,
        is_first_play
      );

      // Check if no momentum was awarded due to daily cap
      if (momentumAwarded === 0 && previousProgress.dailyCapReached) {
        noMomentumReason = 'daily_cap';
      }
    } else if (!canEarn && hasCompletedOnboarding) {
      // Hit the per-code daily limit (3 plays per day)
      noMomentumReason = 'daily_code_limit';
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
    const newProgress = await getUserProgress(supabase, user.id);
    const newMomentum = newProgress.progressRaw;

    const result: GameSessionResult = {
      session_id: sessionId,
      score,
      total_questions: 3,
      momentum_awarded: momentumAwarded,
      is_first_play: is_first_play || false,
      previous_momentum: previousMomentum,
      new_momentum: newMomentum,
      no_momentum_reason: noMomentumReason,
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
