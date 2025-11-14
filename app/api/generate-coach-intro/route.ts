import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { name, age, level, confidenceLevel, scenario, zoneState } = await request.json();

    // Simple prompt - just generate a warm, personal intro
    const prompt = `You are a basketball confidence coach greeting a new player. Write a warm, authentic 2-3 sentence intro that:

1. Addresses them by name: ${name}
2. Acknowledges their specific struggle: "${scenario}"
3. Transitions to saying you've created their first personalized cheat code to help with exactly that

Tone guidelines:
- Casual and authentic (like a real coach, not corporate)
- NO formal greetings like "Hello" or "Hi" - jump right in
- Empathetic but confident - you understand the struggle AND you have the solution
- Age-appropriate for ${age} year olds at ${level} level
- Keep it concise - 2-3 sentences max

Example structure:
"[Name], I totally get it—[their struggle] can really mess with your confidence. I've got something that's gonna help you push through those moments and get back to [hint at their zone state]. Check out your first code below."

Write ONLY the intro text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a basketball confidence coach creating personalized, authentic intro messages. Keep it warm, brief, and real - no corporate speak.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const intro = completion.choices[0].message.content?.trim() || '';

    return NextResponse.json({ intro });

  } catch (error) {
    console.error('Error generating coach intro:', error);
    return NextResponse.json(
      { error: 'Failed to generate intro' },
      { status: 500 }
    );
  }
}
