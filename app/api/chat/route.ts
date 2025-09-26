import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { upsertActiveSession, saveMessage, ensureUserExists } from '../../../lib/memory-layer';
import { CreateChatRequest, SectionType, Message } from '../../../lib/types';
import {
  getCoachingSystemPrompt,
  postProcessResponse,
  createInitialConversationState,
  updateConversationState,
  checkCodeOfferReadiness
} from '../../../lib/coaching-system';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateChatRequest = await request.json();
    const { section, message } = body;

    // Validate input
    if (!section || !message) {
      return NextResponse.json({ error: 'Section and message are required' }, { status: 400 });
    }

    const validSections: SectionType[] = ['pre_game', 'in_game', 'post_game', 'locker_room', 'off_court'];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Ensure user exists in our database
    await ensureUserExists(user.id, user.user_metadata?.handle || user.email || 'anonymous');

    // Create or get active session
    const session = await upsertActiveSession(user.id, section);

    // Save user message
    const savedMessage = await saveMessage(session.id, 'user', message);

    // Get recent conversation history (last 20 messages)
    const { data: recentMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesError) {
      throw new Error(`Failed to fetch conversation history: ${messagesError.message}`);
    }

    // Reverse to get chronological order
    const conversationHistory = (recentMessages || []).reverse();

    // Get active codes for this section
    const { data: activeCodes, error: codesError } = await supabase
      .from('codes')
      .select('name')
      .eq('user_id', user.id)
      .eq('section', section)
      .eq('status', 'active');

    const activeCodeNames = activeCodes?.map(code => code.name) || [];

    // Initialize or update conversation state
    let conversationState = createInitialConversationState(session.id, section, activeCodeNames);

    // Update state based on conversation history
    conversationHistory.forEach(msg => {
      conversationState = updateConversationState(
        conversationState,
        msg.text,
        msg.role === 'assistant'
      );
    });

    // Call OpenAI API
    const systemPrompt = getCoachingSystemPrompt(section, activeCodeNames);
    const openaiResponse = await callOpenAI(systemPrompt, conversationHistory);

    // Post-process response to enforce hard rules
    const processedResponse = postProcessResponse(openaiResponse);

    // Update conversation state with coach response
    conversationState = updateConversationState(
      conversationState,
      processedResponse,
      true
    );

    // Save coach response
    const coachMessage = await saveMessage(session.id, 'assistant', processedResponse);

    // Check if this response contains a code offer
    const containsCodeOffer = processedResponse.toLowerCase().includes('save this as a cheat code?');
    const isValidOffer = containsCodeOffer && checkCodeOfferReadiness(conversationState);

    return NextResponse.json({
      session_id: session.id,
      message: savedMessage,
      coach_response: coachMessage,
      conversation_state: {
        question_count: conversationState.question_count,
        readiness_signals: conversationState.readiness_signals,
        can_offer_code: checkCodeOfferReadiness(conversationState),
        contains_code_offer: containsCodeOffer,
        is_valid_offer: isValidOffer
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// OpenAI API integration
async function callOpenAI(systemPrompt: string, messages: Message[]): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Convert message history to OpenAI format
  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.text
    }))
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openaiModel,
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`OpenAI API error: ${response.status} ${errorData?.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenAI API');
  }

  return data.choices[0].message.content.trim();
}