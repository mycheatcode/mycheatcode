import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRandomScenarios, hasGameScenarios } from '@/lib/game';

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

    const { cheat_code_id } = await request.json();

    if (!cheat_code_id) {
      return NextResponse.json(
        { success: false, error: 'Missing cheat_code_id' },
        { status: 400 }
      );
    }

    // Check if scenarios exist
    const { hasScenarios, error: checkError } = await hasGameScenarios(
      user.id,
      cheat_code_id,
      supabase
    );

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError }, { status: 500 });
    }

    if (!hasScenarios) {
      return NextResponse.json({
        success: true,
        has_scenarios: false,
        scenarios: [],
      });
    }

    // Get 3 random scenarios
    const { scenarios, error: fetchError } = await getRandomScenarios(
      user.id,
      cheat_code_id,
      3,
      supabase
    );

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      has_scenarios: true,
      scenarios,
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
