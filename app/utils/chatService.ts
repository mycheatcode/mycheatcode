// Chat Service for Casual Conversation Mode V1

import { CreateChatRequest, CreateChatResponse, SectionType } from '../../lib/types';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  contains_code_offer?: boolean;
  is_valid_offer?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  session_id: string | null;
  section: SectionType;
  is_loading: boolean;
  conversation_state: {
    question_count: number;
    readiness_signals: {
      trigger_identified: boolean;
      goal_clarified: boolean;
      context_scoped: boolean;
      user_buy_in: boolean;
    };
    can_offer_code: boolean;
  } | null;
}

export class ChatService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(section: SectionType, message: string): Promise<CreateChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section,
        message
      } as CreateChatRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP ${response.status}: Failed to send message`);
    }

    return response.json();
  }

  convertToDisplayMessage(message: any, sender: 'user' | 'coach'): ChatMessage {
    return {
      id: message.id,
      text: message.text,
      sender,
      timestamp: new Date(message.created_at),
      contains_code_offer: sender === 'coach' && message.text.toLowerCase().includes('save this as a cheat code?'),
      is_valid_offer: false // Will be set based on conversation state
    };
  }

  async loadConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    // This would be implemented if we need to load existing conversations
    // For now, we start fresh each time
    return [];
  }

  // Check if a message contains readiness signals
  analyzeUserMessage(message: string): {
    signals: {
      trigger_identified?: boolean;
      goal_clarified?: boolean;
      context_scoped?: boolean;
      user_buy_in?: boolean;
    };
  } {
    const lowerMessage = message.toLowerCase();
    const signals: any = {};

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

    return { signals };
  }

  // Format readiness status for debugging/display
  formatReadinessStatus(conversationState: ChatState['conversation_state']): string {
    if (!conversationState) return 'No state';

    const { readiness_signals, question_count, can_offer_code } = conversationState;
    const signals = Object.entries(readiness_signals)
      .filter(([_, value]) => value)
      .map(([key, _]) => key.replace('_', ' '));

    return `Questions: ${question_count}, Signals: [${signals.join(', ')}], Can offer: ${can_offer_code}`;
  }

  // Extract potential cheat code details from a coach response
  extractCodeOffer(message: string): { name?: string; description?: string } | null {
    if (!message.toLowerCase().includes('save this as a cheat code?')) {
      return null;
    }

    // Simple extraction - look for patterns that suggest a code offer
    const lines = message.split('\n');
    let name = '';
    let description = '';

    // Look for name patterns (often capitalized or in quotes)
    const namePatterns = [
      /["']([^"']{2,20})["']/,  // Quoted names
      /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/, // Title Case names
      /\*\*([^*]{2,20})\*\*/  // Bold names
    ];

    for (const line of lines) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && !name) {
          name = match[1];
          break;
        }
      }
    }

    // Look for description (usually the line before the code offer question)
    const offerIndex = lines.findIndex(line =>
      line.toLowerCase().includes('save this as a cheat code?')
    );

    if (offerIndex > 0) {
      description = lines[offerIndex - 1].trim();
    }

    return name || description ? { name, description } : null;
  }
}

// Default instance
export const chatService = new ChatService();