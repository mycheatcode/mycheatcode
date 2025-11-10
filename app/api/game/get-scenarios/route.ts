import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRandomScenarios, hasGameScenarios, saveGameScenarios } from '@/lib/game';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const { cheat_code_id, auto_generate } = await request.json();

    if (!cheat_code_id) {
      return NextResponse.json(
        { success: false, error: 'Missing cheat_code_id' },
        { status: 400 }
      );
    }

    // Check if scenarios exist
    const { hasScenarios, error: checkError } = await hasGameScenarios(
      user.id,
      cheat_code_id,
      supabase
    );

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError }, { status: 500 });
    }

    if (!hasScenarios) {
      // If auto_generate is true, trigger scenario generation
      if (auto_generate) {
        console.log('🎮 Auto-generating scenarios for cheat code:', cheat_code_id);

        // Fetch cheat code data needed for generation
        const { data: cheatCodeData, error: fetchError } = await supabase
          .from('cheat_codes')
          .select('*')
          .eq('id', cheat_code_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !cheatCodeData) {
          console.error('❌ Failed to fetch cheat code data:', fetchError);
          return NextResponse.json({
            success: true,
            has_scenarios: false,
            generating: false,
            scenarios: [],
          });
        }

        // Parse the content to get cheat code components
        const content = cheatCodeData.content || '';
        const parseContent = (text: string) => {
          const sections: any = {};
          const lines = text.split('\n');
          let currentSection = '';
          let currentContent: string[] = [];

          for (const line of lines) {
            if (line.startsWith('## ')) {
              if (currentSection && currentContent.length > 0) {
                sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
              }
              currentSection = line.replace('## ', '').trim();
              currentContent = [];
            } else if (line.trim() && currentSection) {
              currentContent.push(line);
            }
          }

          if (currentSection && currentContent.length > 0) {
            sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
          }

          return sections;
        };

        const sections = parseContent(content);

        // Trigger generation asynchronously (don't await - let it run in background)
        (async () => {
          try {
            console.log('🎮 Starting background scenario generation for:', cheat_code_id);

            // Fetch user profile for context
            const { data: userProfile } = await supabase
              .from('users')
              .select('skill_level, age_bracket')
              .eq('id', user.id)
              .maybeSingle();

            const skillLevel = userProfile?.skill_level || 'recreational';
            const ageBracket = userProfile?.age_bracket || 'adult';

            const codeData = {
              title: cheatCodeData.title,
              category: cheatCodeData.category,
              what: sections.what || '',
              when: sections.when || '',
              how: sections.how || '',
              why: sections.why || '',
              phrase: sections['your cheat code phrase'] || '',
            };

            const prompt = `You are a basketball confidence coach creating practice scenarios for a mental reframing game.

**Player Context:**
- Skill Level: ${skillLevel}
- Age Bracket: ${ageBracket}

**Cheat Code Details:**
- Title: ${codeData.title}
- Category: ${codeData.category}
- What: ${codeData.what || 'N/A'}
- When: ${codeData.when || 'N/A'}
- Phrase: ${codeData.phrase || 'N/A'}

Generate exactly 10 practice scenarios that are DIRECTLY RELATED to this specific cheat code.

Each scenario must have:
- "situation": Brief basketball scenario (1-2 sentences)
- "current_thought": The negative thought
- "scenario_type": "internal" or "external"
- "options": Array of 4 options (2 negative, 1 helpful, 1 optimal), each with:
  - "text": Answer option text
  - "type": "negative", "helpful", or "optimal"
  - "feedback": Explanation (2-3 sentences)

Return ONLY valid JSON with a "scenarios" key containing the array.`;

            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              max_tokens: 8000,
              temperature: 0.8,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: 'You are a basketball confidence coach. Respond with valid JSON only.' },
                { role: 'user', content: prompt },
              ],
            });

            const responseText = completion.choices[0].message.content || '';
            const parsed = JSON.parse(responseText);
            const scenarios = parsed.scenarios || parsed;

            if (Array.isArray(scenarios) && scenarios.length >= 8 && scenarios.length <= 12) {
              await saveGameScenarios(user.id, cheat_code_id, scenarios, supabase);
              console.log('✅ Scenarios generated and saved:', scenarios.length);
            } else {
              console.error('❌ Invalid scenario count:', scenarios.length);
            }
          } catch (err) {
            console.error('❌ Background generation failed:', err);
          }
        })();

        return NextResponse.json({
          success: true,
          has_scenarios: false,
          generating: true,
          scenarios: [],
        });
      }

      return NextResponse.json({
        success: true,
        has_scenarios: false,
        generating: false,
        scenarios: [],
      });
    }

    // Get 3 random scenarios
    const { scenarios, error: fetchError } = await getRandomScenarios(
      user.id,
      cheat_code_id,
      3,
      supabase
    );

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      has_scenarios: true,
      scenarios,
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
