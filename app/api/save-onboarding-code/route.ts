import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ensureUserExists } from '../../../lib/memory-layer';
import { parseCheatCode } from '../../../components/CodeCardViewer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { codeMessage, scenarioCategory } = await request.json();

    if (!codeMessage) {
      return NextResponse.json({ error: 'Code message is required' }, { status: 400 });
    }

    // Parse the code to get structured data
    const parsedCode = parseCheatCode(codeMessage);

    if (!parsedCode) {
      return NextResponse.json({ error: 'Failed to parse code' }, { status: 400 });
    }

    // Extract the phrase from the cards array
    const phraseCard = parsedCode.cards.find(card => card.type === 'phrase');
    const phrase = phraseCard?.content || parsedCode.category; // Fallback to category if no phrase found

    // Ensure user exists in our database
    await ensureUserExists(user.id, user.user_metadata?.handle || user.email || 'anonymous');

    // Map scenario category to section (default to in_game for onboarding codes)
    const sectionMap: Record<string, string> = {
      'In-Game': 'in_game',
      'Pre-Game': 'pre_game',
      'Post-Game': 'post_game',
      'Off Court': 'off_court',
      'Locker Room': 'locker_room'
    };
    const section = sectionMap[scenarioCategory] || 'in_game';

    // Insert the code into the database with full structure
    const { data: code, error: insertError} = await supabase
      .from('cheat_codes')
      .insert({
        user_id: user.id,
        title: parsedCode.title,
        category: parsedCode.category,
        content: parsedCode.description || '',
        is_active: true,
        times_used: 0,
        is_favorite: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting code:', insertError);
      return NextResponse.json({ error: 'Failed to save code' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code_id: code.id,
      code_title: code.title
    });

  } catch (error) {
    console.error('Error saving onboarding code:', error);
    return NextResponse.json(
      { error: 'Failed to save code' },
      { status: 500 }
    );
  }
}
