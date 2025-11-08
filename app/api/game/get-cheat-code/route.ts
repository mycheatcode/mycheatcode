import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCheatCode } from '@/components/CodeCardViewer';

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

    // Fetch cheat code data
    const { data: cheatCode, error: fetchError } = await supabase
      .from('cheat_codes')
      .select('content')
      .eq('id', cheat_code_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching cheat code:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!cheatCode) {
      return NextResponse.json({
        success: false,
        error: 'Cheat code not found',
      }, { status: 404 });
    }

    // Parse the content using the existing parseCheatCode function
    const content = cheatCode.content || '';
    const parsed = parseCheatCode(content);

    if (!parsed) {
      console.error('❌ Failed to parse cheat code content');
      return NextResponse.json({
        success: false,
        error: 'Failed to parse cheat code content',
      }, { status: 500 });
    }

    // Extract phrase and what from parsed cards
    let phrase = '';
    let what = '';

    const phraseCard = parsed.cards.find(card => card.type === 'phrase');
    const whatCard = parsed.cards.find(card => card.type === 'what');

    if (phraseCard) {
      phrase = phraseCard.content;
    }

    if (whatCard) {
      what = whatCard.content;
    }

    console.log('✅ Extracted from parsed cards - phrase:', phrase, 'what:', what);

    return NextResponse.json({
      success: true,
      cheatCode: {
        phrase,
        what,
      },
    });
  } catch (error) {
    console.error('Error fetching cheat code:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
