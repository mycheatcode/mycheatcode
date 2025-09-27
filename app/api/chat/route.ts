import OpenAI from "openai";
import { getCoachingSystemPrompt, analyzeMessage, updateConversationState, createInitialConversationState } from '../../../lib/coaching-system';
import { CreateChatRequest, CreateChatResponse, SectionType } from '../../../lib/types';

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Valid sections - the source of truth
const VALID_SECTIONS = ['pre_game', 'in_game', 'post_game', 'locker_room', 'off_court'] as const;

function normalizeSection(section: string): SectionType | null {
  if (!section || typeof section !== 'string') {
    return null;
  }

  // Normalize: lowercase, convert dashes/spaces to underscores
  const normalized = section.toLowerCase()
    .replace(/[-\s]+/g, '_')
    .trim();

  console.log(`[/api/chat] Normalized section: "${section}" -> "${normalized}"`);

  // Check if it's a valid section
  if (VALID_SECTIONS.includes(normalized as SectionType)) {
    return normalized as SectionType;
  }

  return null;
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    if (!client.apiKey) {
      console.error("[/api/chat] Missing OPENAI_API_KEY");
      return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // Parse and log the raw body for debugging
    const body = await req.json().catch(() => null);
    console.log('[/api/chat] Raw request body:', JSON.stringify(body, null, 2));

    if (!body) {
      console.error("[/api/chat] Failed to parse JSON body");
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Extract and validate section
    const rawSection = body.section;
    const normalizedSection = normalizeSection(rawSection);

    if (!normalizedSection) {
      console.warn(`[/api/chat] Invalid section: "${rawSection}". Valid sections: ${VALID_SECTIONS.join(', ')}`);
      return Response.json({
        error: `Missing or invalid section. Valid sections: ${VALID_SECTIONS.join(', ')}`,
        received: rawSection
      }, { status: 400 });
    }

    // Extract message
    const message = body.message;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.warn(`[/api/chat] Invalid message: "${message}"`);
      return Response.json({
        error: "Missing or invalid message. Must be a non-empty string.",
        received: message
      }, { status: 400 });
    }

    console.log(`[/api/chat] Processing: section="${normalizedSection}", message="${message.substring(0, 50)}..."`);

    // Initialize or get conversation state
    // For now, we'll create a new session each time - you can enhance this later
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let conversationState = createInitialConversationState(sessionId, normalizedSection);

    // Update conversation state based on user message
    conversationState = updateConversationState(conversationState, message, false);

    // Get active codes for this section (mock for now - you can implement actual lookup)
    const activeCodes: string[] = []; // TODO: Fetch from database

    // Generate system prompt
    const systemPrompt = getCoachingSystemPrompt(normalizedSection, activeCodes);

    // Prepare the conversation for OpenAI
    const openAIMessages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: message }
    ];

    console.log(`[/api/chat] Calling OpenAI with ${openAIMessages.length} messages`);

    const model = process.env.OPENAI_MODEL || "gpt-4o";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      messages: openAIMessages,
    });

    const coachReply = completion.choices?.[0]?.message?.content?.trim() ||
      "I'm here to help. Tell me more about what's on your mind.";

    // Update conversation state based on coach response
    conversationState = updateConversationState(conversationState, coachReply, true);

    // Check if the response contains a code offer
    const containsCodeOffer = coachReply.toLowerCase().includes('save this as a cheat code?');
    const isValidOffer = containsCodeOffer && conversationState.question_count >= 3; // Simplified check

    // Create messages for response (you can enhance this with real database storage)
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      session_id: sessionId,
      role: 'user' as const,
      text: message,
      created_at: new Date().toISOString()
    };

    const coachMessage = {
      id: `msg_${Date.now()}_coach`,
      session_id: sessionId,
      role: 'assistant' as const,
      text: coachReply,
      created_at: new Date().toISOString()
    };

    const response: CreateChatResponse = {
      session_id: sessionId,
      message: userMessage,
      coach_response: coachMessage,
      conversation_state: {
        question_count: conversationState.question_count,
        readiness_signals: conversationState.readiness_signals,
        can_offer_code: conversationState.question_count >= 3 &&
          Object.values(conversationState.readiness_signals).filter(Boolean).length >= 4,
        contains_code_offer: containsCodeOffer,
        is_valid_offer: isValidOffer
      }
    };

    const tookMs = Date.now() - startedAt;
    console.log(`[/api/chat] Success: model=${model}, section=${normalizedSection}, took=${tookMs}ms`);

    return Response.json(response, { status: 200 });

  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[/api/chat] ERROR:", msg, err);
    return Response.json({
      error: "Internal server error. Please try again.",
      details: process.env.NODE_ENV === 'development' ? msg : undefined
    }, { status: 500 });
  }
}