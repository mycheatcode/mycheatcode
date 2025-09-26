import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createCode, ensureUserExists } from '../../../lib/memory-layer';
import { CreateCodeRequest, SectionType } from '../../../lib/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateCodeRequest = await request.json();
    const { section, name, one_line } = body;

    // Validate input
    if (!section || !name || !one_line) {
      return NextResponse.json({ error: 'Section, name, and one_line are required' }, { status: 400 });
    }

    const validSections: SectionType[] = ['pre_game', 'in_game', 'post_game', 'locker_room', 'off_court'];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Validate text lengths
    if (name.length > 100) {
      return NextResponse.json({ error: 'Code name too long (max 100 characters)' }, { status: 400 });
    }
    if (one_line.length > 500) {
      return NextResponse.json({ error: 'One-line description too long (max 500 characters)' }, { status: 400 });
    }

    // Ensure user exists in our database
    await ensureUserExists(user.id, user.user_metadata?.handle || user.email || 'anonymous');

    // Create code
    const result = await createCode(user.id, section, name, one_line);

    return NextResponse.json({
      code: result.code,
      active_codes_count: result.active_count
    });

  } catch (error) {
    console.error('Codes API error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Maximum')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}