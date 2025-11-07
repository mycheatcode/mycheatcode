import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { saveGameScenarios } from '@/lib/game';
import type { GenerateScenariosRequest, GameOption } from '@/lib/types/game';

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

    const body: GenerateScenariosRequest = await request.json();
    const { cheat_code_id, cheat_code_data, initial } = body;

    if (!cheat_code_id || !cheat_code_data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch user profile data for contextually appropriate scenarios
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('skill_level, age_bracket')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    const skillLevel = userProfile?.skill_level || 'recreational';
    const ageBracket = userProfile?.age_bracket || 'adult';

    // Generate 3 scenarios initially for fast loading, then 7 more later
    const scenarioCount = initial === true ? 3 : 7;

    const prompt = `You are a basketball confidence coach creating practice scenarios for a mental reframing game.

**Player Context:**
- Skill Level: ${skillLevel}
- Age Bracket: ${ageBracket}

**Cheat Code Details:**
- Title: ${cheat_code_data.title}
- Category: ${cheat_code_data.category}
- What: ${cheat_code_data.what || 'N/A'}
- When: ${cheat_code_data.when || 'N/A'}
- How: ${cheat_code_data.how || 'N/A'}
- Why: ${cheat_code_data.why || 'N/A'}
- Phrase: ${cheat_code_data.phrase || 'N/A'}
- Original Situation: ${cheat_code_data.original_situation || 'N/A'}
- Original Thought: ${cheat_code_data.original_thought || 'N/A'}

Generate exactly ${scenarioCount} practice scenarios that are DIRECTLY RELATED to this specific cheat code and the mental block it addresses.

🚨 CRITICAL - CONTEXTUAL APPROPRIATENESS:
You MUST tailor scenarios to match the player's level and age. Use the player context above to determine appropriate scenarios.

🚨 CRITICAL: Create TWO TYPES of scenarios in a RANDOM MIX:

**TYPE 1: INTERNAL REFRAME (60% of scenarios)**
- Tests what the player should think IN THE MOMENT during performance
- Focuses on mental shifts during play (what to focus on, how to approach the situation)
- Example situations: At free throw line, driving to hoop, open shot opportunity, defensive play
- Optimal answer should align with the cheat code's mental shift phrase

**TYPE 2: EXTERNAL BELIEF (40% of scenarios)**
- Tests the player's understanding of what OTHERS are actually thinking about them
- Challenges false beliefs about judgment, expectations, letting others down
- 🚨 CRITICAL: These MUST be directly related to THIS player's specific situation and cheat code
- If the cheat code addresses fear of missing shots, external scenarios should involve:
  * Missing shots and worrying about teammates' reactions
  * Coach's response to missed shots
  * Playing in clutch moments with fear of judgment
- If the cheat code addresses proving yourself/comparison:
  * Comparing to a better player and assuming they're better liked
  * Not getting the ball and thinking teammates don't trust you
  * Seeing teammates succeed and feeling inadequate
- If the cheat code addresses performance anxiety:
  * Playing in front of scouts/parents and assuming they're judging
  * Mistakes in important moments and fear of letting team down
  * Coach benching them and what that means
- HUGE VARIETY of contexts for external beliefs, but ALL must connect to the SAME core issue this cheat code addresses:
  * Teammate reactions and glances
  * Coach feedback and body language
  * Comparison situations with better players
  * Clutch moments and team expectations
  * Getting benched or reduced playing time
  * Film room and mistake analysis
  * Being excluded from plays or strategy
  * Leadership pressure when not feeling ready

🚨 MATCH SCENARIOS TO PLAYER LEVEL:
- **High school/college/pro players**: Can include scouts, college coaches, recruitment pressure, film room analysis
- **Recreational/adult league players**: Focus on teammates, friends watching, personal expectations, proving yourself in pickup games, league game pressure
- **Youth players (13-17)**: Focus on parents watching, coach expectations, making the team, peer pressure, school team dynamics
- NEVER mention scouts, recruitment, or professional contexts for recreational or youth players
- NEVER use youth-specific scenarios (parents in stands, making the team) for adult recreational players
- Optimal answer should challenge the FALSE belief about what others think IN THIS SPECIFIC CONTEXT
- Should show that external pressure related to THEIR issue is self-created or misunderstood

Each scenario format:
{
  "situation": "Brief basketball scenario (1-2 sentences)",
  "current_thought": "The negative thought",
  "scenario_type": "internal" | "external",
  "options": [
    {
      "text": "Answer option text",
      "type": "negative" | "helpful" | "optimal",
      "feedback": "Explanation of why this answer is negative/helpful/optimal (2-3 sentences)"
    }
  ]
}

🚨 CRITICAL - FEEDBACK REQUIREMENTS:
- **For "negative" answers**: Explain why this thought keeps them stuck or makes performance worse
- **For "helpful" answers**: MUST explain (1) why this is better than negative BUT (2) why it's still not optimal. Be encouraging but clear about what's missing.
  - Example: "This thought is more positive, which helps. But it's still focused on avoiding mistakes rather than attacking the opportunity. The optimal reframe shifts you into action mode."
- **For "optimal" answers**: Explain why this thought creates the best mental state for performance

🚨 REQUIREMENTS:
- Mix internal and external scenarios randomly (don't group them)
- For EXTERNAL scenarios: Use huge variety of contexts but ALL must relate to THIS player's specific issue
  * If they struggle with missing shots → external scenarios about missing shots and others' reactions
  * If they struggle with comparison → external scenarios about comparing to others and false beliefs about worth
  * If they struggle with pressure → external scenarios about judgment in high-pressure moments
- NEVER create generic external scenarios unrelated to their core issue
- Each external scenario should feel like a different angle/context of the SAME underlying fear/belief
- Always provide 4 options: 2 negative, 1 helpful, 1 optimal
- Randomize the order of the 4 options in each scenario
- Optimal answers for internal = mental shift phrase alignment
- Optimal answers for external = challenging false belief about others' perceptions IN THEIR SPECIFIC CONTEXT

🚨 EXAMPLES:

**RECREATIONAL/ADULT PLAYER - "fear of missing clutch free throws and letting team down":**
- INTERNAL scenario: At free throw line in close game → shift to "attack it"
- EXTERNAL scenario 1: Miss a free throw, see teammate's reaction → challenge belief they're judging you
- EXTERNAL scenario 2: Friends watching from sideline in league game → challenge belief they think you're not good
- EXTERNAL scenario 3: Playing pickup and missing shots → challenge belief others won't pass to you anymore

**HIGH SCHOOL PLAYER - "fear of missing clutch free throws and letting team down":**
- INTERNAL scenario: At free throw line in close game → shift to "attack it"
- EXTERNAL scenario 1: Miss free throw with scout watching → challenge belief one miss ruins your chances
- EXTERNAL scenario 2: Coach talks to you after missed free throws → challenge belief coach is giving up on you
- EXTERNAL scenario 3: Parents watching in crucial game → challenge belief they'll be disappointed

ALL scenarios connect to the same core issue but are contextually appropriate to the player's level.

Return ONLY a JSON object with a "scenarios" key containing the array of scenarios. Example format:
{
  "scenarios": [
    {
      "situation": "...",
      "current_thought": "...",
      "scenario_type": "internal",
      "options": [...]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 8000,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a basketball confidence coach creating practice scenarios. You must respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    const responseText = completion.choices[0].message.content || '';

    let scenarios: Array<{
      situation: string;
      current_thought: string;
      options: GameOption[];
    }>;

    try {
      const parsed = JSON.parse(responseText);
      // OpenAI JSON mode returns an object, so extract the scenarios array
      scenarios = parsed.scenarios || parsed;
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to generate scenarios' },
        { status: 500 }
      );
    }

    // Validate scenarios
    const expectedMin = scenarioCount - 2; // Allow 2 fewer
    const expectedMax = scenarioCount + 2; // Allow 2 more
    if (!Array.isArray(scenarios) || scenarios.length < expectedMin || scenarios.length > expectedMax) {
      console.error(`Invalid scenario count: got ${scenarios.length}, expected ${scenarioCount} (±2)`);
      return NextResponse.json(
        { success: false, error: 'Invalid scenarios generated' },
        { status: 500 }
      );
    }

    // Save to database
    const { error: saveError } = await saveGameScenarios(
      user.id,
      cheat_code_id,
      scenarios,
      supabase
    );

    if (saveError) {
      return NextResponse.json(
        { success: false, error: saveError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scenarios_count: scenarios.length,
    });
  } catch (error) {
    console.error('Error generating scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
