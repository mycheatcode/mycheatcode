import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Server-safe content parser
function parseCheatCodeContent(content: string): { phrase: string; what: string } {
  let phrase = '';
  let what = '';

  // Split by lines
  const lines = content.split('\n');
  let currentCard = '';
  let currentContent = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('CARD:')) {
      // Save previous card
      if (currentCard === 'What' && currentContent) {
        what = currentContent.trim();
      } else if (currentCard.includes('Phrase') && currentContent) {
        phrase = currentContent.trim();
      }

      // Start new card
      currentCard = trimmed.substring(5).trim();
      currentContent = '';
    } else if (currentCard && trimmed && !trimmed.startsWith('TITLE:') && !trimmed.startsWith('CATEGORY:') && !trimmed.startsWith('DESCRIPTION:')) {
      // Add to current card content
      if (currentContent) {
        currentContent += ' ' + trimmed;
      } else {
        currentContent = trimmed;
      }
    }
  }

  // Save last card
  if (currentCard === 'What' && currentContent) {
    what = currentContent.trim();
  } else if (currentCard.includes('Phrase') && currentContent) {
    phrase = currentContent.trim();
  }

  return { phrase, what };
}

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

    // Parse the content
    const content = cheatCode.content || '';
    const { phrase, what } = parseCheatCodeContent(content);

    console.log('✅ Extracted - phrase:', phrase, 'what:', what);

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
