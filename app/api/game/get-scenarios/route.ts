import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRandomScenarios, hasGameScenarios } from '@/lib/game';

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

        // Trigger generation in the background (non-blocking)
        const generateUrl = new URL('/api/game/generate-scenarios', request.url);
        fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            cheat_code_id,
            cheat_code_data: {
              title: cheatCodeData.title,
              category: cheatCodeData.category,
              what: sections.what || '',
              when: sections.when || '',
              how: sections.how || '',
              why: sections.why || '',
              phrase: sections['your cheat code phrase'] || '',
            },
            count: 10,
          }),
        }).catch(err => console.error('Background generation error:', err));

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
