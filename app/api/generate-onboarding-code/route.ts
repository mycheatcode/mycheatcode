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

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error generating onboarding code:', error);
    return NextResponse.json(
      { error: 'Failed to generate cheat code' },
      { status: 500 }
    );
  }
}
