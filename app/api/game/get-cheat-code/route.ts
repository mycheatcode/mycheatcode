import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Parse the content to extract phrase and what
    const content = cheatCode.content || '';
    console.log('📝 Raw content:', content.substring(0, 500)); // Log first 500 chars
    let phrase = '';
    let what = '';

    // Extract phrase (CARD: Phrase or CARD: Cheat Code Phrase)
    const phraseMatch = content.match(/CARD:\s*(?:Cheat Code )?Phrase\s*\n([^\n]+(?:\n(?!CARD:)[^\n]+)*)/i);
    console.log('🔍 Phrase match:', phraseMatch);
    if (phraseMatch) {
      phrase = phraseMatch[1].trim();
    }

    // Extract what (CARD: What)
    const whatMatch = content.match(/CARD:\s*What\s*\n([^\n]+(?:\n(?!CARD:)[^\n]+)*)/i);
    console.log('🔍 What match:', whatMatch);
    if (whatMatch) {
      what = whatMatch[1].trim();
    }

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
