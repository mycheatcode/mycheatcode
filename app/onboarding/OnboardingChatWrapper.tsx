'use client';

import { useState, useEffect, useRef } from 'react';
import TypingAnimation from '../../components/TypingAnimation';
import CodeCardViewer, { parseCheatCode, ParsedCheatCode } from '../../components/CodeCardViewer';
import CheatCodeGame from '../../components/CheatCodeGame';

interface OnboardingChatWrapperProps {
  name: string;
  initialMessage: string;
  userAnswer: string; // The answer they gave in step 6 (zone state)
  scenarioCategory: string; // The category of the scenario (In-Game, Pre-Game, etc)
  scenarioId: string; // The ID of the scenario (e.g., 'airball_laugh', 'coach_yells')
  onComplete: () => void;
  onBack?: () => void; // Function to go back to previous step
}

export default function OnboardingChatWrapper({
  name,
  initialMessage,
  userAnswer,
  scenarioCategory,
  scenarioId,
  onComplete,
  onBack
}: OnboardingChatWrapperProps) {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'coach'; timestamp: Date }>>([]);
  const [viewingCode, setViewingCode] = useState<ParsedCheatCode | null>(null);
  const [hasViewedCode, setHasViewedCode] = useState(false);
  const [hasShownFollowUp, setHasShownFollowUp] = useState(false); // Track if follow-up message was sent
  const [showTutorial1, setShowTutorial1] = useState(false); // "Tap to view your code"
  const [showTutorial2, setShowTutorial2] = useState(false); // "Flip through cards"
  const [showTutorial3, setShowTutorial3] = useState(false); // "Get reps button"
  const [showGetRepsButton, setShowGetRepsButton] = useState(false);
  const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());
  const [showGameModal, setShowGameModal] = useState(false);
  const [tutorial1Position, setTutorial1Position] = useState<number | null>(null);
  const [tutorial3Position, setTutorial3Position] = useState<number | null>(null);
  const [savedCodeId, setSavedCodeId] = useState<string | null>(null);
  const viewCodeButtonRef = useRef<HTMLButtonElement>(null);
  const getRepsButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse the cheat code from initialMessage
  const parsedCode = parseCheatCode(initialMessage);

  // Extract text before the code starts (intro text)
  const basketballEmojiIndex = initialMessage.indexOf('**🏀');
  const introText = basketballEmojiIndex !== -1
    ? initialMessage.substring(0, basketballEmojiIndex).trim()
    : initialMessage;

  // Load messages immediately when component mounts
  useEffect(() => {
    // Only add coach message - no preloaded user message
    const coachMsg = {
      id: 'coach-code',
      text: introText,
      sender: 'coach' as const,
      timestamp: new Date()
    };

    setMessages([coachMsg]);
    // Mark coach message animation as complete immediately so View Code button shows
    setCompletedAnimations(new Set(['coach-code']));

    // Show tutorial 1 after a brief delay (after coach message starts typing)
    setTimeout(() => {
      setShowTutorial1(true);
    }, 1500);

    // Note: Code will be saved when user clicks "Get Reps In" button
    // This ensures the save happens at the right time in the flow
  }, [userAnswer, introText, initialMessage, scenarioCategory]); // Include dependencies

  // Calculate tutorial 1 position when it shows
  useEffect(() => {
    if (showTutorial1 && viewCodeButtonRef.current) {
      const rect = viewCodeButtonRef.current.getBoundingClientRect();
      // Position tutorial below the button with different spacing for desktop vs mobile
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      const spacing = isMobile ? 80 : 100; // More spacing to position below button
      setTutorial1Position(rect.bottom + spacing);
    }
  }, [showTutorial1, messages, completedAnimations]);

  // Calculate tutorial 3 position when it shows
  useEffect(() => {
    if (showTutorial3 && getRepsButtonRef.current) {
      const rect = getRepsButtonRef.current.getBoundingClientRect();
      // Position tutorial below the button with different spacing for desktop vs mobile
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      const spacing = isMobile ? 120 : 100; // More spacing on mobile for better positioning
      setTutorial3Position(rect.bottom + spacing);
    }
  }, [showTutorial3, messages, showGetRepsButton]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleViewCode = () => {
    if (parsedCode) {
      setViewingCode(parsedCode);
      setShowTutorial1(false); // Hide first tutorial when viewing code

      // Show tutorial 2 after a brief delay
      setTimeout(() => {
        setShowTutorial2(true);
      }, 800);
    }
  };

  const handleCodeClose = async () => {
    setViewingCode(null);
    setHasViewedCode(true);
    setShowTutorial2(false);

    // Note: Code is already saved on component mount, no need to save again here

    // Only add follow-up message if it hasn't been shown yet
    if (!hasShownFollowUp) {
      setHasShownFollowUp(true);

      // Add follow-up message after brief delay
      setTimeout(() => {
        const followUpMsg = {
          id: 'coach-followup',
          text: "Awesome! I saved that code for you. Now let's practice using it—I'm going to give you a quick scenario, and you can test it out. Ready?",
          sender: 'coach' as const,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, followUpMsg]);

        // Show "Get reps" button after follow-up message finishes typing
        setTimeout(() => {
          setShowGetRepsButton(true);
          // Show tutorial 3 pointing to the button
          setTimeout(() => {
            setShowTutorial3(true);
          }, 500);
        }, 3000);
      }, 500);
    }
  };

  const handleSaveCode = () => {
    // Just close the viewer - code is automatically "saved" during onboarding
    handleCodeClose();
  };

  // Helper function to format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#000000', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="px-6 lg:px-8 py-5 flex-shrink-0" style={{ backgroundColor: '#000000' }}>
        <div className="flex items-center justify-center relative">
          <button
            onClick={onBack}
            className="absolute left-0 p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)' }}
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Live Chat</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 py-6 pb-8">
          <div className="space-y-6 lg:space-y-8">
            {messages.map((message) => (
              <div key={message.id} className="group">
                {/* User message */}
                {message.sender === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] lg:max-w-[70%]">
                      <div className="px-4 lg:px-5 py-2.5 lg:py-3 rounded-2xl rounded-br-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>
                        <div className="text-[15px] leading-[1.5]">{message.text}</div>
                      </div>
                      <div className="text-[11px] mt-1.5 px-1 text-right" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Coach message */}
                {message.sender === 'coach' && (
                  <div className="w-full">
                    <div className="flex justify-start">
                      <div className="max-w-[85%] lg:max-w-[80%]">
                        {message.id === 'coach-code' ? (
                          <div className="text-[15px] leading-[1.6]" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {message.text}
                          </div>
                        ) : (
                          <TypingAnimation
                            key={message.id}
                            text={message.text}
                            speed={40}
                            className="text-[15px] leading-[1.6]"
                            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                            onComplete={() => {
                              setCompletedAnimations(prev => new Set(prev).add(message.id));
                            }}
                          />
                        )}
                        <div className="text-[11px] mt-1.5 px-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* View Cheat Code button */}
                    {message.id === 'coach-code' && parsedCode && (
                      <div className="w-full mt-4">
                        <div className="max-w-4xl mx-auto px-4 lg:px-8">
                          <button
                            ref={viewCodeButtonRef}
                            onClick={handleViewCode}
                            className="w-full rounded-xl px-6 py-2.5 transition-all active:scale-[0.98] font-semibold text-sm"
                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
                            id="view-code-button"
                          >
                            View Cheat Code
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Get Reps button */}
                    {message.id === 'coach-followup' && showGetRepsButton && (
                      <div className="w-full mt-4">
                        <div className="max-w-4xl mx-auto px-4 lg:px-8">
                          <button
                            ref={getRepsButtonRef}
                            onClick={async () => {
                              console.log('🎮 Get Reps button clicked! Saving code now...');

                              // Save the code NOW before opening the game
                              try {
                                console.log('💾 Saving onboarding code before practice game...');
                                const response = await fetch('/api/save-onboarding-code', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    codeMessage: initialMessage,
                                    scenarioCategory
                                  })
                                });

                                console.log('📡 Save response:', response.status);

                                if (response.ok) {
                                  const data = await response.json();
                                  setSavedCodeId(data.code_id);
                                  console.log('✅ Code saved successfully! ID:', data.code_id);
                                } else {
                                  const errorText = await response.text();
                                  console.error('❌ Failed to save code:', response.status, errorText);
                                }
                              } catch (error) {
                                console.error('❌ Error saving code:', error);
                              }

                              if (parsedCode) {
                                setShowGameModal(true);
                                setShowTutorial3(false);
                              }
                            }}
                            className="w-full rounded-xl px-6 py-2.5 transition-all active:scale-[0.98] font-semibold text-sm"
                            style={{
                              backgroundColor: '#00FF41',
                              color: '#000000',
                              boxShadow: '0 0 15px rgba(0, 255, 65, 0.3)'
                            }}
                            id="get-reps-button"
                          >
                            Get Reps In
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 lg:p-8 border-t flex-shrink-0" style={{ borderColor: 'var(--card-border)', backgroundColor: '#000000' }}>
        <div className="max-w-4xl mx-auto relative">
          <textarea
            placeholder="Share what's on your mind..."
            disabled={true}
            className="w-full border rounded-xl p-4 pr-12 resize-none focus:outline-none transition-all duration-200"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)', minHeight: '52px', maxHeight: '120px' }}
            rows={1}
          />
          <button
            disabled={true}
            className="absolute right-3 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
            style={{ borderWidth: '2px', borderColor: '#ffffff', color: '#ffffff', backgroundColor: 'transparent' }}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5,12 12,5 19,12"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Tutorial 1: Contextual pointer to "View Code" button */}
      {showTutorial1 && !viewingCode && tutorial1Position !== null && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowTutorial1(false)} />
          <div
            className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-fadeIn"
            style={{ top: `${tutorial1Position}px` }}
          >
            {/* Arrow pointing up */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div
                className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"
                style={{ borderBottom: '10px solid #00ff41' }}
              />
            </div>
            <div
              className="bg-zinc-900 rounded-2xl p-5 shadow-2xl border-2"
              style={{
                borderColor: '#00ff41',
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
              }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Your first code is ready!</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Tap the button above to view your personalized cheat code.
                </p>
              </div>
              <button
                onClick={() => setShowTutorial1(false)}
                className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: '#00ff41',
                  color: '#000000',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tutorial 2: Contextual pointer in card viewer */}
      {showTutorial2 && viewingCode && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[140] pointer-events-none" />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-sm">
            <div
              className="bg-zinc-900 rounded-2xl p-5 shadow-2xl border-2 animate-fadeIn"
              style={{
                borderColor: '#00ff41',
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
              }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Flip through the cards</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Tap the arrows to see all parts of your code, then tap "Close" when done.
                </p>
              </div>
              <button
                onClick={() => setShowTutorial2(false)}
                className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: '#00ff41',
                  color: '#000000',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tutorial 3: Contextual pointer to "Get reps" button */}
      {showTutorial3 && showGetRepsButton && !viewingCode && tutorial3Position !== null && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowTutorial3(false)} />
          <div
            className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-fadeIn"
            style={{ top: `${tutorial3Position}px` }}
          >
            {/* Arrow pointing up */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div
                className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"
                style={{ borderBottom: '10px solid #00ff41' }}
              />
            </div>
            <div
              className="bg-zinc-900 rounded-2xl p-5 shadow-2xl border-2"
              style={{
                borderColor: '#00ff41',
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
              }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Practice makes permanent!</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Tap "Get reps in" to practice this code in a quick scenario, then you'll finish onboarding.
                </p>
              </div>
              <button
                onClick={() => setShowTutorial3(false)}
                className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: '#00ff41',
                  color: '#000000',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fullscreen Code Viewer Modal */}
      {viewingCode && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4">
          {/* Code Card Viewer - No X button during onboarding, users must click through cards and use Close button */}
          <CodeCardViewer
            parsedCode={viewingCode}
            onSave={handleSaveCode}
            showSaveButton={true}
            saveButtonText="Close"
          />
        </div>
      )}

      {/* Game Modal */}
      {showGameModal && parsedCode && (
        <CheatCodeGame
          cheatCodeId={savedCodeId || 'temp-onboarding-code'}
          cheatCodeTitle={parsedCode.title}
          isFirstPlay={true}
          onboardingScenarioId={scenarioId}
          onClose={() => {
            // Don't close the modal or show chat - go directly to completion
            // This prevents the flash of chat between game and home page
            onComplete();
          }}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
