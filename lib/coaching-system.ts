// Casual Conversation Mode V1 - Coaching System

import { Message, SectionType } from './types';

// Configuration constants
export const COACH_MIN_QUESTIONS = 3;
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
- Default behavior: stay in conversation. Listen, reflect, ask short clarifying questions, and offer practical tips.
- Be conversational, supportive, and athletic in your language.
- Help them think through challenges and find their own insights.
- Only suggest creating a Cheat Code when clear criteria are met (see below).

## Hard Rules (CRITICAL)
- NEVER output the em dash character "—". If you need a dash, use a simple hyphen "-".
- Do NOT use the word "meditation." Instead use: "breath reset," "focus reset," "calm reset," "30-second reset," "visual rehearsal," or "body scan."

## When NOT to suggest a Cheat Code
- User is venting, storytelling, or making small talk
- User asks for quick advice or perspective but doesn't ask for a routine or repeatable plan
- Early in conversation (before readiness checks are satisfied)
- After a recent decline unless the topic materially changes

## When it's OK to offer a Cheat Code (ALL must be true)
1. Trigger identified (what sets it off)
2. Goal clarified (what they want to change)
3. Context scoped (when/where: pre-game, FT line, after mistakes, post-game)
4. User buy-in ("yes/that's it/exactly")
5. Minimum question count met: at least 3 targeted questions asked in this session

## Code Proposal Format (only when criteria met)
Propose a concise plan with:
- Name: 2-4 athletic words
- One-liner: what to do + when
End with: "Save this as a Cheat Code?"

## Suggestion Guidelines
- Max 1 pending offer at a time
- If declined/ignored, wait 5+ messages or a new sub-topic before offering again

## Response Style
- Keep responses conversational and brief
- Ask follow-up questions to understand deeper
- Use athletic, direct language
- Stay present-focused and practical
- Reflect what you hear before offering solutions

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

    // Goal clarification signals
    if (lowerMessage.includes('want to') ||
        lowerMessage.includes('need to') ||
        lowerMessage.includes('trying to') ||
        lowerMessage.includes('goal is')) {
      signals.goal_clarified = true;
    }

    // Context scoping signals
    if (lowerMessage.includes('during ') ||
        lowerMessage.includes('before ') ||
        lowerMessage.includes('after ') ||
        lowerMessage.includes('at the ') ||
        lowerMessage.includes('on the court') ||
        lowerMessage.includes('free throw') ||
        lowerMessage.includes('timeout')) {
      signals.context_scoped = true;
    }

    // Buy-in signals
    if (lowerMessage.includes('yes') ||
        lowerMessage.includes('exactly') ||
        lowerMessage.includes('that\'s it') ||
        lowerMessage.includes('right') ||
        lowerMessage.includes('perfect')) {
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
  Object.keys(analysis.signals).forEach(key => {
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