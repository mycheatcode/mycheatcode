import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createLog, ensureUserExists } from '../../../lib/memory-layer';
import { CreateLogRequest } from '../../../lib/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateLogRequest = await request.json();
    const { code_id } = body;

    // Validate input
    if (!code_id) {
      return NextResponse.json({ error: 'code_id is required' }, { status: 400 });
    }

    // Ensure user exists in our database
    await ensureUserExists(user.id, user.user_metadata?.handle || user.email || 'anonymous');

    // Create log and update all related data
    const result = await createLog(code_id, user.id);

    return NextResponse.json({
      log: result.log,
      code: result.code,
      section_progress: result.section_progress,
      radar_state: result.radar_state,
      should_count: result.should_count
    });

  } catch (error) {
    console.error('Logs API error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json({ error: 'Code not found or access denied' }, { status: 404 });
      }
      if (error.message.includes('daily limit')) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}