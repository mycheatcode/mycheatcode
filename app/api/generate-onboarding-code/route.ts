import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedCodeMessage } from '@/lib/personalize-code';
import { createClient } from '@/lib/supabase/server';
import { parseCheatCode } from '@/lib/parseCheatCode';

const SCENARIO_CATEGORIES: Record<string, string> = {
  'airball_laugh': 'In-Game',
  'coach_yells': 'Off Court',
  'miss_spiral': 'In-Game',
  'pressure_counting': 'In-Game',
  'better_opponent': 'Pre-Game',
  'mistake_replaying': 'Post-Game',
  'overthinking': 'In-Game',
  'faking_confidence': 'Locker Room'
};

export async function POST(request: NextRequest) {
  try {
    const { name, age, level, confidenceLevel, scenario, scenarioLabel, zoneState, zoneStateLabel } = await request.json();

    // Use the new personalization system
    const message = await getPersonalizedCodeMessage({
      name,
      age,
      level,
      confidenceLevel,
      scenario,
      scenarioLabel,
      zoneState,
      zoneStateLabel
    });

    // Add coach introduction for first message
    const greeting = `What's up ${name}!`;
    const coachIntro = `${greeting} I'm hyped to be your 24/7 confidence coach.`;
    const fullMessage = `${coachIntro} ${message}`;

    // SAVE THE CODE TO DATABASE IMMEDIATELY
    console.log('💾 Saving onboarding code to database immediately after generation');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      try {
        const parsedCode = parseCheatCode(message);

        if (parsedCode) {
          const scenarioCategory = SCENARIO_CATEGORIES[scenario] || 'In-Game';

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

          const { data: code, error: insertError } = await supabase
            .from('cheat_codes')
            .insert({
              user_id: user.id,
              title: parsedCode.title,
              category: parsedCode.category,
              content: cardFormatContent.trim(),
              chat_id: null,
              is_active: true
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error saving onboarding code:', insertError);
          } else {
            console.log('✅ Onboarding code saved successfully! ID:', code.id);
          }
        } else {
          console.error('❌ Failed to parse onboarding code');
        }
      } catch (saveError) {
        console.error('❌ Error in code save process:', saveError);
      }
    } else {
      console.error('❌ No authenticated user found when trying to save code');
    }

    return NextResponse.json({ message: fullMessage });

  } catch (error) {
    console.error('Error generating onboarding code:', error);
    return NextResponse.json(
      { error: 'Failed to generate cheat code' },
      { status: 500 }
    );
  }
}
