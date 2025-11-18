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
        console.log('🎮 No scenarios found, attempting to generate for cheat_code_id:', cheat_code_id);

        // Fetch cheat code data needed for generation (user-specific OR premade)
        const { data: cheatCodeData, error: fetchError } = await supabase
          .from('cheat_codes')
          .select('*')
          .eq('id', cheat_code_id)
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching cheat code data:', fetchError);
          return NextResponse.json({
            success: false,
            error: `Failed to fetch cheat code: ${fetchError.message}`,
          }, { status: 500 });
        }

        if (!cheatCodeData) {
          console.error('❌ No cheat code found with id:', cheat_code_id);
          return NextResponse.json({
            success: false,
            error: 'Cheat code not found',
          }, { status: 404 });
        }

        console.log('✅ Found cheat code:', cheatCodeData.title);

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

        // Generate scenarios and WAIT for completion (first request only)
        try {
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

          const prompt = `Create 10 basketball mental game scenarios for "${codeData.title}" (${codeData.category}).

Context: ${codeData.what || codeData.when || codeData.phrase || 'Mental reframing'}

Each scenario must include 4 response options with ACTUAL text responses (not placeholder text like "Option 1").

Return JSON format:
{
  "situation": "Brief basketball scenario description",
  "current_thought": "The negative thought the player is experiencing",
  "scenario_type": "internal" or "external",
  "options": [
    {"text": "First actual response option text here", "type": "negative", "feedback": "Why this response is unhelpful"},
    {"text": "Second actual response option text here", "type": "negative", "feedback": "Why this response is unhelpful"},
    {"text": "Third actual response option text here", "type": "helpful", "feedback": "Why this response is somewhat helpful"},
    {"text": "Fourth actual response option text here (best response)", "type": "optimal", "feedback": "Why this response is most effective"}
  ]
}

IMPORTANT: The "text" field must contain the actual words the player would think or say, NOT placeholder text.

Return: {"scenarios": [...]}`;

          console.log('🤖 Calling OpenAI to generate scenarios...');
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

          console.log('✅ OpenAI response received');
          const responseText = completion.choices[0].message.content || '';
          const parsed = JSON.parse(responseText);
          const scenarios = parsed.scenarios || parsed;

          console.log('📊 Generated scenarios count:', scenarios.length);

          if (Array.isArray(scenarios) && scenarios.length >= 8 && scenarios.length <= 12) {
            console.log('💾 Saving scenarios to database...');
            // For premade cheat codes (user_id IS NULL), save scenarios with NULL user_id
            // so they're shared across all users. Otherwise save with specific user_id.
            const scenarioUserId = cheatCodeData.user_id || null;
            const saveResult = await saveGameScenarios(scenarioUserId, cheat_code_id, scenarios, supabase);

            if (saveResult.error) {
              console.error('❌ Error saving scenarios:', saveResult.error);
              return NextResponse.json({
                success: false,
                error: `Failed to save scenarios: ${saveResult.error}`,
              }, { status: 500 });
            }

            console.log('✅ Scenarios saved successfully');

            // Return 3 random scenarios immediately after successful generation
            const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
            return NextResponse.json({
              success: true,
              has_scenarios: true,
              scenarios: shuffled.slice(0, 3),
            });
          }
        } catch (err) {
          console.error('❌ Error generating scenarios:', err);
          return NextResponse.json({
            success: false,
            error: `Scenario generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          has_scenarios: false,
          generating: false,
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
    console.error('❌ Unhandled error in get-scenarios API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
