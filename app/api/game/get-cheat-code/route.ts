import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Server-safe content parser
function parseCheatCodeContent(content: string): { phrase: string; what: string } {
  let phrase = '';
  let what = '';

  // Split by lines
  const lines = content.split('\n');
  let currentCard = '';
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed.startsWith('CARD:')) {
      // Save previous card
      if (currentCard === 'What' && currentContent.length > 0) {
        what = currentContent.join(' ').trim();
      } else if (currentCard.toLowerCase().includes('phrase') && currentContent.length > 0) {
        phrase = currentContent.join(' ').trim();
      }

      // Start new card
      currentCard = trimmed.substring(5).trim();
      currentContent = [];
    } else if (currentCard && trimmed &&
               !trimmed.startsWith('TITLE:') &&
               !trimmed.startsWith('CATEGORY:') &&
               !trimmed.startsWith('DESCRIPTION:')) {
      // Add to current card content
      currentContent.push(trimmed);
    }
  }

  // Save last card
  if (currentCard === 'What' && currentContent.length > 0) {
    what = currentContent.join(' ').trim();
  } else if (currentCard.toLowerCase().includes('phrase') && currentContent.length > 0) {
    phrase = currentContent.join(' ').trim();
  }

  console.log('🔍 Parser debug - currentCard:', currentCard, 'phrase:', phrase, 'what:', what);

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
    console.log('📄 Content length:', content.length);
    console.log('📄 First 500 chars:', content.substring(0, 500));
    console.log('📄 Contains CARD:', content.includes('CARD:'));
    console.log('📄 Full content:', content); // Debug: log full content

    const { phrase, what } = parseCheatCodeContent(content);

    console.log('✅ Final extracted - phrase:', phrase, 'what:', what);

    // TEMPORARY DEBUG: Return raw content for inspection
    if (!phrase && !what) {
      return NextResponse.json({
        success: true,
        debug: true,
        rawContent: content,
        cheatCode: {
          phrase,
          what,
        },
      });
    }

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
