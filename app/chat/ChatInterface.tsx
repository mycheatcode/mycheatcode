'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { chatService, ChatMessage, ChatState } from '../utils/chatService';
import { SectionType } from '../../lib/types';

interface ChatInterfaceProps {
  section: SectionType;
  onBack: () => void;
}

export default function ChatInterface({ section, onBack }: ChatInterfaceProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    session_id: null,
    section,
    is_loading: false,
    conversation_state: null
  });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, isTyping]);

  useEffect(() => {
    // Start conversation with coach message if no messages exist
    if (chatState.messages.length === 0) {
      const initialCoachMessage: ChatMessage = {
        id: `coach-initial-${Date.now()}`,
        text: getInitialCoachMessage(section),
        sender: 'coach',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [initialCoachMessage]
      }));
    }
  }, [section, chatState.messages.length]);

  const getInitialCoachMessage = (section: SectionType): string => {
    switch (section) {
      case 'pre_game':
        return "Hey! Pre-game time - one of my favorite moments. How are you feeling heading into this? What's on your mind?";
      case 'in_game':
        return "What's happening out there? Whether it's going great or you're facing some challenges, I'm here to help you stay focused.";
      case 'post_game':
        return "How did that go? Whether you're riding high or need to work through something, let's talk about it.";
      case 'locker_room':
        return "Team energy can be everything. What's the vibe like? How are you feeling about your role and the group dynamic?";
      case 'off_court':
        return "Life beyond the court - just as important as anything that happens on it. What's been on your mind lately?";
      default:
        return "Hey there! What's on your mind today? I'm here to listen and help however I can.";
    }
  };

  const getSectionDisplayName = (section: SectionType): string => {
    switch (section) {
      case 'pre_game': return 'Pre-Game';
      case 'in_game': return 'In-Game';
      case 'post_game': return 'Post-Game';
      case 'locker_room': return 'Locker Room';
      case 'off_court': return 'Off Court';
      default: return 'Chat';
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || chatState.is_loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message immediately
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      is_loading: true
    }));

    setInputText('');
    setIsTyping(true);

    try {
      // Send to API
      const response = await chatService.sendMessage(section, userMessage.text);

      // Convert API response to display messages
      const coachMessage: ChatMessage = {
        id: response.coach_response.id,
        text: response.coach_response.text,
        sender: 'coach',
        timestamp: new Date(response.coach_response.created_at),
        contains_code_offer: response.conversation_state.contains_code_offer,
        is_valid_offer: response.conversation_state.is_valid_offer
      };

      // Update state with coach response and conversation state
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, coachMessage],
        session_id: response.session_id,
        is_loading: false,
        conversation_state: response.conversation_state
      }));

    } catch (error) {
      console.error('Failed to send message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I had trouble processing that. Can you try again?',
        sender: 'coach',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        is_loading: false
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCodeResponse = async (accepted: boolean) => {
    if (!accepted) {
      const declineMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        text: 'Not right now',
        sender: 'user',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, declineMessage]
      }));

      // Send decline message to maintain conversation state
      try {
        await chatService.sendMessage(section, declineMessage.text);
      } catch (error) {
        console.error('Failed to send decline:', error);
      }
    } else {
      // Extract code details from the last coach message and navigate to creation
      const lastCoachMessage = chatState.messages
        .filter(msg => msg.sender === 'coach')
        .slice(-1)[0];

      if (lastCoachMessage) {
        const codeOffer = chatService.extractCodeOffer(lastCoachMessage.text);

        // Store the code offer for the creation flow
        if (codeOffer) {
          localStorage.setItem('pendingCodeOffer', JSON.stringify({
            section,
            name: codeOffer.name || 'New Code',
            description: codeOffer.description || lastCoachMessage.text,
            session_id: chatState.session_id
          }));
        }

        // Navigate to code creation
        router.push('/my-codes?create=true');
      }
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold">Coach</h1>
            <p className="text-sm text-zinc-400">{getSectionDisplayName(section)}</p>
          </div>
        </div>

        {/* Debug info (can be removed in production) */}
        {chatState.conversation_state && (
          <div className="text-xs text-zinc-500">
            Q: {chatState.conversation_state.question_count} |
            {chatState.conversation_state.can_offer_code ? ' Ready' : ' Building'}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {chatState.messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>

              {/* Code offer buttons */}
              {message.contains_code_offer && message.is_valid_offer && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCodeResponse(true)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Save Code
                  </button>
                  <button
                    onClick={() => handleCodeResponse(false)}
                    className="px-3 py-1 bg-zinc-600 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Not Now
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={chatState.is_loading}
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || chatState.is_loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}