import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { name, age, level, confidenceLevel, scenario, scenarioCategory, zoneState } = await request.json();

    // Create a personalized prompt based on onboarding data
    const prompt = `You are a basketball confidence coach creating a personalized mental performance "cheat code" for a player.

Player profile:
- Name: ${name}
- Age: ${age}
- Level: ${level}
- Current confidence: ${confidenceLevel}/5
- Specific struggle: "${scenario}"
- When they're in the zone: "${zoneState}"

This player struggles most with: ${scenario}

Your job: Create ONE powerful, actionable cheat code that helps them handle this specific situation.

The cheat code should:
1. Address their specific struggle directly
2. Help them return to their zone state (${zoneState})
3. Be simple enough to recall in the moment
4. Feel empowering and personal

Requirements:
- TITLE: 3-7 words, memorable, in quotes (like "Next shot mentality" or "Reset to automatic")
- DESCRIPTION: 1-2 sentences explaining WHEN and HOW to use it
- Make it specific to their scenario: ${scenario}
- Reference their zone state if relevant: ${zoneState}

Return ONLY valid JSON in this exact format:
{
  "title": "The cheat code title in quotes",
  "description": "When and how to use this cheat code."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a basketball confidence coach who creates personalized mental performance tools. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    const responseText = completion.choices[0].message.content?.trim() || '';

    // Parse the JSON response
    let codeData;
    try {
      codeData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Validate response structure
    if (!codeData.title || !codeData.description) {
      throw new Error('Missing required fields in AI response');
    }

    return NextResponse.json({
      title: codeData.title,
      description: codeData.description
    });

  } catch (error) {
    console.error('Error generating onboarding code:', error);
    return NextResponse.json(
      { error: 'Failed to generate cheat code' },
      { status: 500 }
    );
  }
}
