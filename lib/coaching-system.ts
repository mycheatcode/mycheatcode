// Casual Conversation Mode V1 - Coaching System

import { Message, SectionType } from './types';

// Configuration constants
export const COACH_MIN_QUESTIONS = 2;
export const MAX_CODE_OFFERS_PER_SESSION = 1;

// Conversation state tracking
export interface ConversationState {
  session_id: string;
  section: SectionType;
  question_count: number;
  code_offers_made: number;
  last_code_offer_message_id?: string;
  declined_code_offer: boolean;
  messages_since_decline: number;
  readiness_signals: {
    trigger_identified: boolean;
    goal_clarified: boolean;
    context_scoped: boolean;
    user_buy_in: boolean;
  };
  active_codes?: string[]; // Names of active codes in this section
}

// System prompt for the coaching AI
export function getCoachingSystemPrompt(section: SectionType, activeCodes: string[] = []): string {
  const sectionContext = getSectionContext(section);
  const activeCodesText = activeCodes.length > 0
    ? `\n\nActive codes in this section: ${activeCodes.join(', ')}`
    : '';

  return `You are a basketball mental performance coach. You're chatting with a player in their ${sectionContext} context.${activeCodesText}

## Core Coaching Philosophy
- STAY FOCUSED: When a user mentions a specific skill or challenge, stay laser-focused on that topic
- Ask targeted, skill-specific questions rather than drifting to general topics
- Guide toward actionable insights about their stated goal
- Be conversational, supportive, and athletic in your language
- Only suggest creating a Cheat Code when clear criteria are met (see below)

## Hard Rules (CRITICAL)
- NEVER output the em dash character "—". If you need a dash, use a simple hyphen "-".
- Do NOT use the word "meditation." Instead use: "breath reset," "focus reset," "calm reset," "30-second reset," "visual rehearsal," or "body scan."

## When NOT to suggest a Cheat Code
- User is venting, storytelling, or making small talk
- User asks for quick advice or perspective but doesn't ask for a routine or repeatable plan
- Early in conversation (before readiness checks are satisfied)
- After a recent decline unless the topic materially changes

## When it's OK to offer a Cheat Code (ALL must be true)
1. Goal clarified (specific skill they want to improve)
2. Context scoped (when/where the challenge happens)
3. Trigger identified (what makes it difficult) OR Technique/approach clarified
4. User engagement (they're responding and working through it with you)
5. Minimum question count met: at least 2 targeted questions asked about their specific skill

## Code Proposal Format (only when criteria met)
Propose a concise plan with:
- Name: 2-4 athletic words
- One-liner: what to do + when
End with: "Save this as a Cheat Code?"

## Suggestion Guidelines
- Max 1 pending offer at a time
- If declined/ignored, wait 5+ messages or a new sub-topic before offering again

## Skill-Specific Coaching
When a user mentions wanting to improve a specific skill (layups, shooting, defense, etc.):
- Stay locked on that skill throughout the conversation
- Ask targeted questions about that specific skill (technique, confidence, game situations)
- If they say "I'm not sure" about what's holding them back, ask more specific questions about the skill itself
- Examples for layups/attacking: "What happens when you get close to the rim?" "Do you feel rushed when driving?" "Is it the finish or the approach?" "Do defenders affect your decision?" "When you pick up your dribble, what goes through your mind?"
- Examples for shooting: "What's different about your misses?" "Is it consistent or random?" "Any patterns you notice?"
- Don't drift to general topics like "what's on your mind" - keep drilling into the specific skill until you understand their challenge

## Response Style
- Keep responses conversational and brief
- Ask follow-up questions to understand deeper
- Use athletic, direct language
- Stay present-focused and practical
- Reflect what you hear before offering solutions
- VARY your conversation starters - avoid starting every response with "It sounds like" or "Sounds like"
- Mix up your openers: "Got it," "I hear you," "Makes sense," "Right," "Yeah," or just jump straight into the question/response

Remember: You're here to listen and guide, not to push solutions. Let the conversation flow naturally.`;
}

function getSectionContext(section: SectionType): string {
  switch (section) {
    case 'pre_game':
      return 'pre-game preparation';
    case 'in_game':
      return 'in-game performance';
    case 'post_game':
      return 'post-game reflection';
    case 'locker_room':
      return 'locker room mindset';
    case 'off_court':
      return 'off-court development';
    default:
      return 'basketball mental performance';
  }
}

// Post-process response to enforce hard rules
export function postProcessResponse(response: string): string {
  // Replace any em dash with hyphen
  let processed = response.replace(/—/g, '-');

  // Replace meditation with alternatives (case insensitive)
  processed = processed.replace(/\bmeditation\b/gi, 'focus reset');
  processed = processed.replace(/\bmeditate\b/gi, 'do a focus reset');
  processed = processed.replace(/\bmeditating\b/gi, 'doing a focus reset');

  return processed;
}

// Check if conversation state meets readiness criteria for code offer
export function checkCodeOfferReadiness(state: ConversationState): boolean {
  const { readiness_signals, question_count, code_offers_made, declined_code_offer, messages_since_decline } = state;

  // Don't offer if we've already made max offers
  if (code_offers_made >= MAX_CODE_OFFERS_PER_SESSION) {
    return false;
  }

  // Don't offer if recently declined and not enough messages since
  if (declined_code_offer && messages_since_decline < 5) {
    return false;
  }

  // Check minimum questions asked
  if (question_count < COACH_MIN_QUESTIONS) {
    return false;
  }

  // Check all readiness signals
  return (
    readiness_signals.trigger_identified &&
    readiness_signals.goal_clarified &&
    readiness_signals.context_scoped &&
    readiness_signals.user_buy_in
  );
}

// Analyze message for readiness signals and questions
export function analyzeMessage(message: string, isFromCoach: boolean): {
  contains_question: boolean;
  signals: {
    trigger_identified?: boolean;
    goal_clarified?: boolean;
    context_scoped?: boolean;
    user_buy_in?: boolean;
  };
  is_code_decline?: boolean;
} {
  const lowerMessage = message.toLowerCase();

  // Check if coach message contains a question
  const contains_question = isFromCoach && (
    message.includes('?') ||
    lowerMessage.includes('what ') ||
    lowerMessage.includes('how ') ||
    lowerMessage.includes('when ') ||
    lowerMessage.includes('where ') ||
    lowerMessage.includes('why ')
  );

  // Check for code decline signals (from user)
  const is_code_decline = !isFromCoach && (
    lowerMessage.includes('not now') ||
    lowerMessage.includes('no thanks') ||
    lowerMessage.includes('maybe later') ||
    lowerMessage.includes('not right now')
  );

  // Analyze for readiness signals (from user responses)
  const signals: any = {};

  if (!isFromCoach) {
    // Trigger identification signals
    if (lowerMessage.includes('when ') ||
        lowerMessage.includes('happens when') ||
        lowerMessage.includes('triggers') ||
        lowerMessage.includes('sets me off')) {
      signals.trigger_identified = true;
    }

    // Goal clarification signals - enhanced for skill-specific goals
    if (lowerMessage.includes('want to') ||
        lowerMessage.includes('need to') ||
        lowerMessage.includes('trying to') ||
        lowerMessage.includes('goal is') ||
        lowerMessage.includes('better at') ||
        lowerMessage.includes('improve') ||
        lowerMessage.includes('work on') ||
        // Specific skills mentioned
        lowerMessage.includes('layup') ||
        lowerMessage.includes('shooting') ||
        lowerMessage.includes('defense') ||
        lowerMessage.includes('attacking') ||
        lowerMessage.includes('driving') ||
        lowerMessage.includes('finishing')) {
      signals.goal_clarified = true;
    }

    // Context scoping signals - enhanced for basketball situations
    if (lowerMessage.includes('during ') ||
        lowerMessage.includes('before ') ||
        lowerMessage.includes('after ') ||
        lowerMessage.includes('at the ') ||
        lowerMessage.includes('on the court') ||
        lowerMessage.includes('free throw') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('close to') ||
        lowerMessage.includes('near the') ||
        lowerMessage.includes('rim') ||
        lowerMessage.includes('paint') ||
        lowerMessage.includes('basket') ||
        lowerMessage.includes('hoop') ||
        lowerMessage.includes('driving') ||
        lowerMessage.includes('attacking') ||
        lowerMessage.includes('in traffic') ||
        lowerMessage.includes('defenders') ||
        lowerMessage.includes('when i')) {
      signals.context_scoped = true;
    }

    // Buy-in signals - enhanced for skill conversations
    if (lowerMessage.includes('yes') ||
        lowerMessage.includes('exactly') ||
        lowerMessage.includes('that\'s it') ||
        lowerMessage.includes('right') ||
        lowerMessage.includes('perfect') ||
        lowerMessage.includes('that happens') ||
        lowerMessage.includes('yeah') ||
        lowerMessage.includes('definitely') ||
        lowerMessage.includes('for sure') ||
        lowerMessage.includes('that\'s right') ||
        lowerMessage.includes('makes sense') ||
        // Engagement with detailed responses
        lowerMessage.length > 20) { // Longer responses show engagement
      signals.user_buy_in = true;
    }
  }

  return {
    contains_question,
    signals,
    is_code_decline
  };
}

// Update conversation state based on new message
export function updateConversationState(
  state: ConversationState,
  message: string,
  isFromCoach: boolean
): ConversationState {
  const analysis = analyzeMessage(message, isFromCoach);

  const newState = { ...state };

  // Update question count if coach asked a question
  if (analysis.contains_question) {
    newState.question_count++;
  }

  // Update readiness signals
  (Object.keys(analysis.signals) as Array<keyof typeof analysis.signals>).forEach(key => {
    if (analysis.signals[key]) {
      newState.readiness_signals[key] = true;
    }
  });

  // Handle code decline
  if (analysis.is_code_decline) {
    newState.declined_code_offer = true;
    newState.messages_since_decline = 0;
  } else {
    newState.messages_since_decline++;
  }

  return newState;
}

// Create initial conversation state
export function createInitialConversationState(
  session_id: string,
  section: SectionType,
  activeCodes: string[] = []
): ConversationState {
  return {
    session_id,
    section,
    question_count: 0,
    code_offers_made: 0,
    declined_code_offer: false,
    messages_since_decline: 0,
    readiness_signals: {
      trigger_identified: false,
      goal_clarified: false,
      context_scoped: false,
      user_buy_in: false
    },
    active_codes: activeCodes
  };
}