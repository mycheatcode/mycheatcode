'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '../chat/ChatInterface';

interface OnboardingChatWrapperProps {
  name: string;
  initialMessage: string;
  onComplete: () => void;
}

export default function OnboardingChatWrapper({
  name,
  initialMessage,
  onComplete
}: OnboardingChatWrapperProps) {
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // Show "Complete Onboarding" button after 10 seconds or after user interacts
    const timer = setTimeout(() => setShowCompleteButton(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Show complete button sooner if user is actively chatting
  useEffect(() => {
    if (messageCount >= 2) {
      setShowCompleteButton(true);
    }
  }, [messageCount]);

  return (
    <div className="relative h-full">
      {/* Custom Header with Complete Button */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-semibold">Your Coach</h1>
            <p className="text-sm text-zinc-400">Practice chatting and get your first code</p>
          </div>

          {showCompleteButton && (
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#00ff41', color: '#000' }}
            >
              Complete
            </button>
          )}
        </div>
      </div>

      {/* ChatInterface with padding for custom header */}
      <div className="pt-20 h-full">
        <ChatInterface
          section="in_game"
          onBack={() => {}}
          initialMessage={initialMessage}
          hideHeader={true}
          onMessageSent={() => setMessageCount(prev => prev + 1)}
        />
      </div>
    </div>
  );
}
