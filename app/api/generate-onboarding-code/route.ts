import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedCodeMessage } from '@/lib/personalize-code';

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

    return NextResponse.json({ message: fullMessage });

  } catch (error) {
    console.error('Error generating onboarding code:', error);
    return NextResponse.json(
      { error: 'Failed to generate cheat code' },
      { status: 500 }
    );
  }
}
