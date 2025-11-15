/**
 * Personalization Engine for Onboarding Codes
 * Takes pre-built codes and personalizes them based on user data
 */

import { ONBOARDING_CODES, SCENARIO_TO_CODE_MAP } from './onboarding-codes-final';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface UserData {
  name: string;
  age: string; // '13-15', '16-18', '19-24', '25+'
  level: string; // 'middle_school', 'high_school', 'college', 'rec', 'solo'
  confidenceLevel: number; // 1-5
  scenario: string; // The scenario key
  scenarioLabel: string; // Human readable scenario
  zoneState: string; // 'automatic', 'fearless', 'locked_in', 'loose', 'next_play'
  zoneStateLabel: string; // Human readable zone state
}

// Zone state connection templates for the Why section
const ZONE_STATE_CONNECTIONS: Record<string, string> = {
  automatic: "This gets you back to that automatic, flowing state where you're not overthinking - just playing naturally.",
  fearless: "This brings you back to that fearless mindset where you're ready for anything that comes your way.",
  locked_in: "This helps you return to that locked-in focus where nothing can break your concentration.",
  loose: "This brings you back to that loose, relaxed state where you're confident and playing free.",
  next_play: "This reinforces that next play mentality where mistakes don't stick and you stay in the moment."
};

/**
 * Personalizes a cheat code based on user data
 */
export function personalizeCode(userData: UserData) {
  // Get the base code
  const codeId = SCENARIO_TO_CODE_MAP[userData.scenario];
  const baseCode = ONBOARDING_CODES[codeId];

  if (!baseCode) {
    throw new Error(`No code found for scenario: ${userData.scenario}`);
  }

  // Add zone state connection to Why section
  const zoneConnection = ZONE_STATE_CONNECTIONS[userData.zoneState] || '';
  const personalizedWhy = `${baseCode.why} ${zoneConnection}`;

  // Return personalized code
  return {
    ...baseCode,
    why: personalizedWhy
  };
}

/**
 * Generates the coach intro message using AI
 * This is the ONLY part that uses AI - just for the warm intro
 */
export async function generateCoachIntro(userData: UserData): Promise<string> {
  // Simple prompt - just generate a warm, personal intro
  const prompt = `You are a basketball confidence coach greeting a new player. Write a warm, authentic 2-3 sentence intro that:

1. Acknowledges their specific struggle: "${userData.scenarioLabel}"
2. Transitions to saying you've created their first personalized cheat code to help with exactly that

Tone guidelines:
- Casual and authentic (like a real coach, not corporate)
- DO NOT use the player's name - this will be added separately
- NO formal greetings like "Hello" or "Hi" - jump right in
- Empathetic but confident - you understand the struggle AND you have the solution
- Age-appropriate for ${userData.age} year olds at ${userData.level} level
- Keep it concise - 2-3 sentences max

Example structure:
"I totally get it—[their struggle] can really mess with your confidence. I've got something that's gonna help you push through those moments and get back to [hint at their zone state]. Check out your first code below."

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

  return completion.choices[0].message.content?.trim() || '';
}

/**
 * Formats the code for the chat interface (markdown format expected by parser)
 */
export function formatCodeForChat(code: ReturnType<typeof personalizeCode>): string {
  return `**🏀 ${code.title}**

*"${code.phrase}"*

**What:** ${code.what}

**When:** ${code.when}

**How:**
${code.how.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Why:** ${code.why}

**Key Phrase:** "${code.phrase}"`;
}

/**
 * Main function: Gets personalized code message for chat
 */
export async function getPersonalizedCodeMessage(userData: UserData): Promise<string> {
  // Get personalized code
  const personalizedCode = personalizeCode(userData);

  // Generate warm intro with AI
  const intro = await generateCoachIntro(userData);

  // Format the code
  const formattedCode = formatCodeForChat(personalizedCode);

  // Combine intro + code
  return `${intro}\n\n${formattedCode}`;
}
