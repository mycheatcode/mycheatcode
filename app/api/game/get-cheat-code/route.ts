import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Server-safe content parser - handles both CARD and markdown formats
function parseCheatCodeContent(content: string): { phrase: string; what: string } {
  let phrase = '';
  let what = '';

  // Check if content uses markdown format (with **Why**: or **whyIs#:) or CARD format
  const isMarkdownFormat = content.includes('**Why**:') || content.includes('**whyIs#:') || content.includes('**Cheat Code Phrase**:');

  if (isMarkdownFormat) {
    // Parse markdown format using simple indexOf and substring
    // Extract why content (the belief/mindset) - try both formats
    let whyStart = content.indexOf('**Why**:');
    if (whyStart === -1) {
      whyStart = content.indexOf('**whyIs#:');
    }

    if (whyStart !== -1) {
      const markerLength = content.substring(whyStart).startsWith('**Why**:') ? '**Why**:'.length : '**whyIs#:'.length;
      const contentAfterWhy = content.substring(whyStart + markerLength);

      // Find the next ** marker
      const nextMarker = contentAfterWhy.indexOf('**');

      if (nextMarker !== -1) {
        const extracted = contentAfterWhy.substring(0, nextMarker);
        what = extracted.replace(/\s+/g, ' ').trim();
      } else {
        // If no next marker, take everything until end
        what = contentAfterWhy.replace(/\s+/g, ' ').trim();
      }
    }

    // Extract phrase from quoted text
    const phraseMatch = content.match(/\*\*Cheat Code Phrase\*\*:\s*"([^"]+)"/);
    if (phraseMatch) {
      phrase = phraseMatch[1].trim();
    }
  } else {
    // Parse CARD format
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

    return NextResponse.json({
      success: true,
      cheatCode: {
        phrase,
        what,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
