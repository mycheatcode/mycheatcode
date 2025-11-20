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
    what: 'This helps you recover instantly from tough moments and get your head back in the game without dwelling on what just happened.',
    when: 'Use this the moment after any mistake that makes you feel exposed - whether it\'s an airball, turnover, or any play that everyone noticed.',
    how: [
      'Take one deep breath and physically shake out your shoulders to reset your body',
      'Reframe the moment: this is one play out of dozens left - everyone else has already moved on to the next possession',
      'Say "next play" in your head, then immediately focus on your defensive assignment or next offensive opportunity'
    ],
    why: 'Dwelling on mistakes keeps you stuck. This breaks the mental loop and lets you move forward.'
  },

  // 2. Coach yells at you / Can't shake it off
  coach_yells: {
    id: 'coach_yells',
    title: 'Filter System',
    phrase: 'Take what helps, leave the rest',
    category: 'Take what helps, leave the rest',
    what: 'This is a mental filtering technique to extract useful coaching from harsh delivery, so you get better while protecting your confidence.',
    when: 'Use this when coach\'s words are mixing valid points with emotional intensity, and you need to sort through what\'s actually helpful.',
    how: [
      'Separate message from delivery: ask yourself "What\'s the actual instruction here?" and recognize that harsh tone often means the coach sees potential in you',
      'Reframe the intensity as investment, not attack - coaches don\'t waste energy on players they\'ve given up on',
      'Take the useful instruction, say "Take what helps, leave the rest" in your head, and apply it on your next rep'
    ],
    why: 'Not all coaches communicate perfectly. This teaches you to be a smart filter - take what helps, leave what doesn\'t.'
  },

  // 3. Playing great, miss one shot and spiral
  miss_spiral: {
    id: 'miss_spiral',
    title: 'Keep Shooting',
    phrase: 'Shooters shoot',
    category: 'Shooters shoot',
    what: 'This reinforces your identity as a scorer and keeps you aggressive after a miss, preventing the tentative mindset that slows you down.',
    when: 'Use this when you miss and feel the urge to pass up your next shot because you\'re worried about going cold.',
    how: [
      'Acknowledge the miss without judging it - treat it as calibration data, not a verdict on your ability',
      'Reframe what defines a shooter: great scorers are defined by their response to misses, not by never missing',
      'Say "Shooters shoot" with conviction, then actively look for your next opportunity to attack'
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
      'Notice the pressure and reframe it: this feeling means you\'re in a moment that matters, not that you\'re in danger',
      'Recognize that teammates looking to you is trust, not a burden - they believe you can deliver',
      'Say "This is what I\'ve trained for" while recalling a specific time you executed this play successfully in practice or a game'
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
    when: 'Use this when you\'re matched up against someone everyone expects to dominate you, and you feel that pressure.',
    how: [
      'Reframe the mismatch: this is where real growth happens - playing up forces you to elevate your game',
      'Recognize that low expectations create freedom - every good play is a win, there\'s no pressure to be perfect',
      'Say "Play free, play fearless" in your head, then attack with zero hesitation knowing upsets happen when underdogs play without fear'
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
      'Ask yourself: "What\'s the one thing this mistake teaches me?" - frame it as information for future you, not judgment on current you',
      'Reframe replaying the mistake: your brain wants to learn from it, but once you extract the lesson, the replay has no more value',
      'Say "Noted, next" to mark that you\'ve captured the insight, then actively shift your focus to applying it'
    ],
    why: 'Learning is quick extraction. Dwelling is endless replay. This gets the lesson while letting go of the moment.'
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
      'Catch yourself overthinking and recognize what\'s happening: your conscious mind is trying to control what your training has already automated',
      'Reframe the situation: your body knows what to do from thousands of reps - conscious control actually slows you down',
      'Say "Stop thinking, start playing" then make your very next move on pure instinct as proof that your training works'
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
      'Reframe "faking it": confidence is created through action, not a feeling you wait for - acting confident literally changes your brain chemistry',
      'Choose confident body language: stand tall, make eye contact, move with purpose - your brain reads these signals and follows',
      'Say "Act confident, play confident" and commit to the behavior fully, knowing the feeling will catch up to the action'
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
