'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { chatService, ChatMessage, ChatState } from '../utils/chatService';
import { SectionType } from '../../lib/types';
import TypingAnimation from '../../components/TypingAnimation';
import CodeCardViewer, { parseCheatCode, ParsedCheatCode } from '../../components/CodeCardViewer';

interface ChatInterfaceProps {
  section: SectionType;
  onBack: () => void;
}

// Helper function to detect if message contains a cheat code
function detectCheatCode(text: string): { hasCode: boolean; codeBlock?: string; textBeforeCode?: string; textAfterCode?: string } {
  const codeBlockRegex = /```cheatcode\n([\s\S]*?)\n```/;
  const match = text.match(codeBlockRegex);

  if (match) {
    const fullMatch = match[0];
    const codeBlock = match[1];
    const beforeIndex = text.indexOf(fullMatch);
    const afterIndex = beforeIndex + fullMatch.length;

    return {
      hasCode: true,
      codeBlock,
      textBeforeCode: text.substring(0, beforeIndex).trim(),
      textAfterCode: text.substring(afterIndex).trim()
    };
  }

  return { hasCode: false };
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
  const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());
  const [viewingCode, setViewingCode] = useState<ParsedCheatCode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, isTyping]);

  const [hasShownInitialMessage, setHasShownInitialMessage] = useState(false);

  useEffect(() => {
    // Start conversation with coach message if no messages exist and we haven't shown it yet
    if (chatState.messages.length === 0 && !hasShownInitialMessage) {
      // First show typing indicator for a brief moment
      setIsTyping(true);
      setHasShownInitialMessage(true);

      // After 1 second, show the actual message with typing animation
      setTimeout(() => {
        const initialCoachMessage: ChatMessage = {
          id: `coach-initial-${Date.now()}`,
          text: "What's up! I'm your mental performance coach. What do you want to talk about?",
          sender: 'coach',
          timestamp: new Date()
        };


        setChatState(prev => ({
          ...prev,
          messages: [initialCoachMessage]
        }));

        setIsTyping(false);
      }, 1000);
    }
  }, [chatState.messages.length, hasShownInitialMessage]);

  const getInitialCoachMessage = (section: SectionType): string => {
    return "What's up! I'm your mental performance coach. What do you want to talk about?";
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

        {chatState.messages.map((message, index) => {
          // Check if message contains a cheat code
          const codeDetection = detectCheatCode(message.text);
          const parsedCode = codeDetection.hasCode && codeDetection.codeBlock
            ? parseCheatCode(codeDetection.codeBlock)
            : null;

          // For messages with codes, show only the text before the code + a button
          const displayText = parsedCode
            ? (codeDetection.textBeforeCode || 'I made you a cheat code.')
            : message.text;

          return (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* User message - standard bubble */}
              {message.sender === 'user' && (
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-blue-600 text-white">
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              )}

              {/* Coach message */}
              {message.sender === 'coach' && (
                <div className="max-w-md">
                  <div className="px-4 py-2 rounded-2xl bg-zinc-800 text-white">
                    <TypingAnimation
                      key={message.id}
                      text={displayText}
                      speed={80}
                      className="text-sm whitespace-pre-wrap"
                      onComplete={() => {
                        setCompletedAnimations(prev => new Set(prev).add(message.id));
                      }}
                    />

                    {/* Code offer buttons - only show after typing animation completes */}
                    {message.contains_code_offer && message.is_valid_offer && completedAnimations.has(message.id) && (
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

                  {/* View Cheat Code button - show if message contains a parsed code */}
                  {parsedCode && completedAnimations.has(message.id) && (
                    <button
                      onClick={() => setViewingCode(parsedCode)}
                      className="w-full mt-3 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm transition-all hover:bg-gray-100 active:scale-[0.98]"
                    >
                      View Cheat Code
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

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

      {/* Fullscreen Code Viewer Modal */}
      {viewingCode && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => setViewingCode(null)}
            className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 lg:p-3 transition-colors z-[120] rounded-full border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Code Card Viewer */}
          <CodeCardViewer
            parsedCode={viewingCode}
            onSave={() => {
              handleCodeResponse(true);
              setViewingCode(null);
            }}
            showSaveButton={true}
          />
        </div>
      )}
    </div>
  );
}