import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserExists } from '../../../lib/memory-layer';
import { parseCheatCode } from '../../../lib/parseCheatCode';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { codeMessage, scenarioCategory, scenarioId } = await request.json();

    if (!codeMessage) {
      return NextResponse.json({ error: 'Code message is required' }, { status: 400 });
    }

    console.log('📦 Request data:', { scenarioCategory, scenarioId });

    // Parse the code to get structured data
    const parsedCode = parseCheatCode(codeMessage);

    console.log('📝 Parsed code result:', parsedCode);

    if (!parsedCode) {
      console.error('❌ Failed to parse code');
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

    // Reconstruct the CARD format from parsed code to save in database
    let cardFormatContent = `TITLE: ${parsedCode.title}\n`;
    cardFormatContent += `CATEGORY: ${parsedCode.category}\n`;
    if (parsedCode.description) {
      cardFormatContent += `DESCRIPTION: ${parsedCode.description}\n`;
    }
    cardFormatContent += '\n';

    // Add all cards
    parsedCode.cards.forEach(card => {
      if (card.type === 'what') {
        cardFormatContent += `CARD: What\n${card.content}\n\n`;
      } else if (card.type === 'when') {
        cardFormatContent += `CARD: When\n${card.content}\n\n`;
      } else if (card.type === 'how') {
        cardFormatContent += `CARD: How - Step ${card.stepNumber}\n${card.content}\n\n`;
      } else if (card.type === 'why') {
        cardFormatContent += `CARD: Why\n${card.content}\n\n`;
      } else if (card.type === 'remember') {
        cardFormatContent += `CARD: Remember\n${card.content}\n\n`;
      } else if (card.type === 'phrase') {
        cardFormatContent += `CARD: Cheat Code Phrase\n${card.content}\n\n`;
      }
    });

    console.log('💾 Attempting to save code with data:', {
      user_id: user.id,
      title: parsedCode.title,
      category: parsedCode.category,
      content: cardFormatContent.trim(),
      chat_id: null
    });

    // Insert the code into the database (matching the schema used by saveCheatCode)
    const insertData: any = {
      user_id: user.id,
      title: parsedCode.title,
      category: parsedCode.category,
      content: cardFormatContent.trim(),
      is_active: true  // Ensure the code is active and not archived
    };

    // Add onboarding_scenario_id if provided (don't include chat_id for onboarding codes)
    if (scenarioId) {
      insertData.onboarding_scenario_id = scenarioId;
      insertData.has_game_scenarios = true; // Mark that it has scenarios
    }

    console.log('💾 Insert data:', insertData);

    const { data: code, error: insertError } = await supabase
      .from('cheat_codes')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting code:', insertError);
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
      console.error('❌ Error code:', insertError.code);
      console.error('❌ Error hint:', insertError.hint);
      return NextResponse.json({
        error: 'Failed to save code',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 });
    }

    console.log('✅ Code saved successfully to database!');
    console.log('✅ Code ID:', code.id);
    console.log('✅ Code title:', code.title);
    console.log('✅ User ID:', user.id);

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
