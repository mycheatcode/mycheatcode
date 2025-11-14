/**
 * Final Selected Onboarding Cheat Codes
 * These are the 8 pre-built codes mapped to onboarding scenarios
 * Each will be personalized based on user's age, level, confidence, and zone state
 */

export interface OnboardingCode {
  id: string;
  title: string;
  phrase: string;
  category: string;
  what: string;
  when: string;
  how: string[];
  why: string;
  // Personalization will be added via template variables
}

export const ONBOARDING_CODES: Record<string, OnboardingCode> = {
  // 1. Airball in front of everyone / Someone laughs
  airball_laugh: {
    id: 'airball_laugh',
    title: 'Bounce Back Protocol',
    phrase: 'Next play mentality',
    category: 'Next play, keep it moving',
    what: 'This helps you recover instantly from embarrassing mistakes and get your head back in the game without dwelling on what just happened.',
    when: 'Use this the moment after any mistake that makes you feel exposed or embarrassed - whether it\'s an airball, turnover, or any play that makes you want to hide.',
    how: [
      'Take one deep breath and physically shake out your shoulders',
      'Say "next play" in your head',
      'Immediately look for your next defensive assignment or offensive opportunity'
    ],
    why: 'Dwelling on mistakes makes you play worse. This breaks the mental loop and lets you move forward.'
  },

  // 2. Coach yells at you / Can't shake it off
  coach_yells: {
    id: 'coach_yells',
    title: 'Filter System',
    phrase: 'Take what helps, leave the rest',
    category: 'Take what helps, leave the rest',
    what: 'This is a mental filtering technique to extract useful coaching from harsh delivery, so you get better without getting beaten down emotionally.',
    when: 'Use this when coach\'s words are mixing valid points with emotional intensity, and you need to sort through what\'s actually helpful.',
    how: [
      'Ask yourself "What\'s the actual instruction here?" (ignore the tone)',
      'Say "Take what helps, leave the rest" in your head',
      'Apply the useful feedback, forget the emotional charge'
    ],
    why: 'Not all coaches communicate perfectly. This teaches you to be a smart filter - take the gold, leave the garbage.'
  },

  // 3. Playing great, miss one shot and spiral
  miss_spiral: {
    id: 'miss_spiral',
    title: 'Keep Shooting',
    phrase: 'Shooters shoot',
    category: 'Shooters shoot',
    what: 'This reinforces your identity as a scorer and keeps you aggressive after a miss, preventing the tentative mindset that ruins hot streaks.',
    when: 'Use this when you miss and feel the urge to pass up your next shot because you\'re worried about going cold.',
    how: [
      'Acknowledge the miss but don\'t analyze it',
      'Say "Shooters shoot" in your head with conviction',
      'Be ready for your next shooting opportunity and stay aggressive'
    ],
    why: 'Great scorers have short memories. This keeps your identity as a shooter intact so you stay aggressive.'
  },

  // 4. Teammates counting on you / Feel the pressure
  pressure_counting: {
    id: 'pressure_counting',
    title: 'Pressure Privilege',
    phrase: 'This is what I\'ve trained for',
    category: 'This is what I\'ve trained for',
    what: 'This helps you reframe high-pressure moments as opportunities instead of threats, so you perform better when it matters most.',
    when: 'Use this when stakes are high - late in a close game, teammates looking to you, everyone watching - and you feel that weight on your shoulders.',
    how: [
      'Notice the pressure but don\'t fight it',
      'Say "This is what I\'ve trained for" in your head',
      'Remember a time in a previous practice or game when you executed this same play'
    ],
    why: 'Pressure is just your body getting ready to perform. When you view it as a privilege and reminder of your prep, your nervous system works for you.'
  },

  // 5. Matched up against someone way better
  better_opponent: {
    id: 'better_opponent',
    title: 'Nothing to Lose',
    phrase: 'Play free, play fearless',
    category: 'Play free, play fearless',
    what: 'This removes outcome pressure by accepting you\'re the underdog, which paradoxically frees you to play your best and sometimes shock people.',
    when: 'Use this when you\'re matched up against someone everyone expects to dominate you, and you feel the pressure to not look bad.',
    how: [
      'Accept that expectations are low (nobody expects you to win)',
      'Say "Play free, play fearless" in your head',
      'Attack without hesitation - you have nothing to lose'
    ],
    why: 'Underdog status is freedom. Nobody expects anything, so you can play with zero fear - and that\'s when upsets happen.'
  },

  // 6. Made a mistake / Can't stop replaying it
  mistake_replaying: {
    id: 'mistake_replaying',
    title: 'Learn & Release',
    phrase: 'Noted, next',
    category: 'Noted, next',
    what: 'This helps you extract the lesson from a mistake without dwelling on it, so you actually get better while also protecting your confidence.',
    when: 'Use this when you made a mistake that has something to teach you, but you don\'t want to get stuck in your head analyzing it forever.',
    how: [
      'Identify ONE thing you learned from the mistake',
      'Say "Noted, next" in your head',
      'Apply that one thing on your next opportunity'
    ],
    why: 'Learning is quick extraction. Dwelling is endless replay. This gets the lesson while releasing the shame.'
  },

  // 7. In your head overthinking / Not just playing
  overthinking: {
    id: 'overthinking',
    title: 'Just Hoop Mode',
    phrase: 'Stop thinking, start playing',
    category: 'Stop thinking, start playing',
    what: 'This helps you shut off the analytical part of your brain and return to instinctive play when you\'re stuck overthinking.',
    when: 'Use this when you\'re analyzing every move before you make it, second-guessing decisions, or feeling slow because your brain is working too hard.',
    how: [
      'Notice you\'re thinking too much',
      'Say "Stop thinking, start playing" in your head',
      'Make your next move on pure instinct - no analysis'
    ],
    why: 'Your conscious brain is too slow. Your skills are stored in muscle memory - they don\'t need supervision. Trust your training.'
  },

  // 8. Everyone seems confident / You're faking it
  faking_confidence: {
    id: 'faking_confidence',
    title: 'Fake It Till You Make It',
    phrase: 'Act confident, play confident',
    category: 'Act confident, play confident',
    what: 'This uses confident behavior to create confident feelings, helping you break the cycle of waiting to feel confident before acting confident.',
    when: 'Use this when you don\'t feel confident but know you need to show up confidently, and you\'re worried you\'re just faking it.',
    how: [
      'Stand tall, make eye contact, move with purpose',
      'Say "Act confident, play confident" in your head',
      'Keep acting confident even when you don\'t feel it yet'
    ],
    why: 'Confidence is a behavior you practice, not a feeling you wait for. Your brain takes cues from your body - act confident and you\'ll feel it.'
  }
};

// Mapping from scenario values to code IDs
export const SCENARIO_TO_CODE_MAP: Record<string, string> = {
  'airball_laugh': 'airball_laugh',
  'coach_yells': 'coach_yells',
  'miss_spiral': 'miss_spiral',
  'pressure_counting': 'pressure_counting',
  'better_opponent': 'better_opponent',
  'mistake_replaying': 'mistake_replaying',
  'overthinking': 'overthinking',
  'faking_confidence': 'faking_confidence'
};
