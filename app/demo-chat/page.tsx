'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Sender = 'user' | 'coach';

interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
}

interface CheatCodeData {
  title: string;
  category: string;
  what: string;
  when: string;
  how: string;
  why: string;
  phrase: string;
}

// Swipeable Cheat Code Cards Component - Modal Version
function CheatCodeCards({ cheatCode, onClose }: { cheatCode: CheatCodeData; onClose: () => void }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);

  // Parse the how steps (they're in bullet format)
  const howSteps = cheatCode.how.split('\n').filter(step => step.trim()).map(step => step.replace('• ', ''));

  const cards = [
    {
      type: 'title',
      label: 'CHEAT CODE',
      title: cheatCode.title,
      subtitle: cheatCode.category
    },
    {
      type: 'content',
      heading: 'What',
      content: cheatCode.what
    },
    {
      type: 'content',
      heading: 'When',
      content: cheatCode.when
    },
    // Individual cards for each "How" step
    ...howSteps.map((step, index) => ({
      type: 'step',
      heading: 'How',
      stepNumber: index + 1,
      totalSteps: howSteps.length,
      content: step
    })),
    {
      type: 'why',
      heading: 'Why',
      content: cheatCode.why
    },
    {
      type: 'phrase',
      heading: 'Your Cheat Code Phrase',
      phrase: `"${cheatCode.phrase}"`
    }
  ];

  const nextCard = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const resetCards = () => {
    setCurrentCard(0);
  };

  const handleAddToMyCodes = () => {
    setShowSuccess(true);
    setHasAdded(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const card = cards[currentCard];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
      <style jsx>{`
        @keyframes checkmark-draw {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fade-in-scale {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-out {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>

      {/* Success Message Overlay */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', animation: 'fade-out 0.4s ease-out 1.6s forwards' }}
        >
          <div className="flex flex-col items-center gap-4" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            {/* Large Green Checkmark */}
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
              <polyline
                points="20 6 9 17 4 12"
                strokeDasharray="100"
                strokeDashoffset="0"
                style={{ animation: 'checkmark-draw 0.6s ease-out 0.1s backwards' }}
              />
            </svg>

            {/* Success Text */}
            <div className="text-center" style={{ animation: 'fade-in-scale 0.4s ease-out 0.2s backwards' }}>
              <h3 className="text-white text-3xl font-bold mb-1">Added to My Codes!</h3>
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-colors z-10"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="w-full max-w-lg">
        {/* Card Container */}
        <div className="rounded-3xl p-8 min-h-[600px] flex relative shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000', border: '1px solid var(--card-border)' }}>
          {/* Top Branding Bar */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
            <div className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              MYCHEATCODE.AI
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--card-hover-bg)', border: '1px solid var(--card-border)' }}>
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }}></div>
              <span className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--accent-color)' }}>CHEAT CODE</span>
            </div>
          </div>

          {/* Bottom Watermark */}
          <div className="absolute bottom-6 left-0 right-0 text-center z-10">
            <div className="text-[9px] font-medium tracking-wider opacity-40" style={{ color: 'var(--text-secondary)' }}>
              MYCHEATCODE.AI
            </div>
          </div>

          {/* Left Arrow - Centered */}
          <button
            onClick={prevCard}
            disabled={currentCard === 0}
            className={`absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-20 ${
              currentCard === 0
                ? 'cursor-not-allowed opacity-30'
                : 'active:scale-95'
            }`}
            style={{
              color: currentCard === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* Right Arrow - Centered */}
          <button
            onClick={nextCard}
            disabled={currentCard === cards.length - 1}
            className={`absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-20 ${
              currentCard === cards.length - 1
                ? 'cursor-not-allowed opacity-30'
                : 'active:scale-95'
            }`}
            style={{
              color: currentCard === cards.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          {/* Card Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 relative z-10">
            {card.type === 'title' && 'label' in card && (
              <div className="space-y-8 mt-16">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {(card as any).title}
                </h1>
                <div className="h-[2px] w-16 mx-auto" style={{ backgroundColor: 'var(--card-border)' }}></div>
                <div className="text-sm font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  {(card as any).subtitle}
                </div>
              </div>
            )}

            {card.type === 'content' && 'content' in card && (
              <div className="space-y-10 max-w-md mt-12">
                <div className="text-xs uppercase font-bold tracking-[0.25em]" style={{ color: 'var(--accent-color)' }}>
                  {(card as any).heading}
                </div>
                <p className="text-2xl md:text-3xl font-normal leading-[1.5]" style={{ color: 'var(--text-primary)' }}>
                  {(card as any).content}
                </p>
              </div>
            )}

            {card.type === 'step' && 'stepNumber' in card && (
              <div className="space-y-10 max-w-lg mt-12">
                <div className="space-y-3">
                  <div className="text-xs uppercase font-bold tracking-[0.25em]" style={{ color: 'var(--accent-color)' }}>
                    {(card as any).heading}
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Step {(card as any).stepNumber} of {(card as any).totalSteps}
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{(card as any).stepNumber}</span>
                  </div>
                  <p className="text-xl font-normal leading-[1.6] text-left flex-1 pt-1" style={{ color: 'var(--text-primary)' }}>
                    {(card as any).content}
                  </p>
                </div>
              </div>
            )}

            {card.type === 'why' && 'content' in card && !('stepNumber' in card) && (
              <div className="space-y-10 max-w-lg mt-12">
                <div className="text-xs uppercase font-bold tracking-[0.25em]" style={{ color: 'var(--accent-color)' }}>
                  {(card as any).heading}
                </div>
                <div className="space-y-6">
                  {(card as any).content.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="text-lg font-normal leading-[1.7]" style={{ color: 'var(--text-primary)' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {card.type === 'phrase' && 'phrase' in card && (
              <div className="space-y-10 w-full max-w-md mt-12">
                <div className="text-xs uppercase font-bold tracking-[0.25em]" style={{ color: 'var(--accent-color)' }}>
                  Your Cheat Code Phrase
                </div>
                <div className="space-y-8">
                  <p className="text-4xl md:text-5xl font-bold leading-[1.2]" style={{ color: 'var(--text-primary)' }}>
                    {(card as any).phrase}
                  </p>
                  <div className="space-y-3 relative pt-4">
                    <button
                      onClick={handleAddToMyCodes}
                      disabled={showSuccess || hasAdded}
                      className="w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: 'var(--button-bg)',
                        color: 'var(--button-text)'
                      }}
                    >
                      {hasAdded ? "Added!" : "Add to \"My Codes\""}
                    </button>
                    {hasAdded && (
                      <a
                        href="/my-codes"
                        className="w-full block text-center py-4 rounded-xl font-semibold text-base active:scale-[0.98] transition-all border"
                        style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
                      >
                        View All Codes
                      </a>
                    )}
                    <button
                      onClick={resetCards}
                      className="w-full py-3 rounded-xl font-medium text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Back to Start
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2.5 pt-8">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCard(index)}
              className="h-2 rounded-full transition-all"
              style={{
                width: index === currentCard ? '40px' : '8px',
                backgroundColor: index === currentCard ? 'var(--accent-color)' : 'var(--card-border)'
              }}
            />
          ))}
        </div>

        {/* Card Counter */}
        <div className="text-center text-sm font-medium mt-6" style={{ color: 'var(--text-secondary)' }}>
          {currentCard + 1} of {cards.length}
        </div>
      </div>
    </div>
  );
}

// Pre-populated demo conversation
const demoMessages: Message[] = [
  {
    id: '1',
    text: "Yo! Let's talk about your game. What's been challenging you or what do you want to work on?",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:29:00')
  },
  {
    id: '2',
    text: "My free throws. I get nervous late in games and miss easy ones",
    sender: 'user',
    timestamp: new Date('2024-01-01T17:30:00')
  },
  {
    id: '3',
    text: "Got it. When do you notice the nerves most? Before the shot, while you are stepping to the line, or right as you release?",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:31:00')
  },
  {
    id: '4',
    text: "Mostly while I am stepping to the line and everyone's watching me. I feel rushed and want to get it over with",
    sender: 'user',
    timestamp: new Date('2024-01-01T17:32:00')
  },
  {
    id: '5',
    text: "Do you have any specific thoughts when you're there at the line? What do you say to yourself before you shoot?",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:33:00')
  },
  {
    id: '6',
    text: 'I just think "don\'t miss" and then I rush it',
    sender: 'user',
    timestamp: new Date('2024-01-01T17:34:00')
  },
  {
    id: '7',
    text: "So the thought of missing speeds you up. Do you notice it in your body too?",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:35:00')
  },
  {
    id: '8',
    text: "Yeah, a bit, I feel tense and my hands get kind of jumpy",
    sender: 'user',
    timestamp: new Date('2024-01-01T17:36:00')
  },
  {
    id: '9',
    text: "That's pressure talking. Let's flip it. What if every free throw had the exact same short routine? One that slowed you down and locked you in and blocked out all of those thoughts and feelings that don't help. Want me to give you a cheat code for that?",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:36:00')
  },
  {
    id: '10',
    text: "Yeah, please",
    sender: 'user',
    timestamp: new Date('2024-01-01T17:37:00')
  },
  {
    id: '11',
    text: "Perfect. Here's your free throw lockdown routine:\n\nTitle: Free Throw Lockdown Trigger: Every free throw, especially in pressure moments Cue phrase: \"My line, my time\" First action: Take a deep breath and visualize your shot going in If/Then: If you feel rushed, pause and reset your breathing for a moment Reps: Practice this during warm-ups and at the line in scrimmages",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:37:00')
  },
  {
    id: '12',
    text: "Here's the key: that 3-count exhale is scientifically proven to calm your nervous system in under 5 seconds - perfect for the 10-second rule. The phrase isn't just motivation - it's claiming mental territory. Most players rush to the line feeling like the crowd owns that moment. When you say 'My line, my time,' you're literally taking control back.\n\nTry it right now - do that breath pattern and say the phrase. Feel different? That's your body switching from fight-or-flight to focused confidence.",
    sender: 'coach',
    timestamp: new Date('2024-01-01T17:37:00')
  }
];

export default function DemoChatPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Helper to detect if a message contains a cheat code
  const isCheatCode = (text: string): boolean => {
    // Check for standard format
    const hasStandardFormat = text.includes('**What:**') && text.includes('**When:**') && text.includes('**How:**') && text.includes('**Why:**');

    // Check for alternative format with Title/Trigger/Cue phrase/First action/If/Then/Reps
    const hasAlternativeFormat = (
      (text.includes('Title:') || text.includes('title:')) &&
      (text.includes('Trigger:') || text.includes('trigger:')) &&
      (text.includes('Cue phrase:') || text.includes('cue phrase:'))
    );

    return hasStandardFormat || hasAlternativeFormat;
  };

  // Helper to split message into intro text and cheat code
  const splitCheatCodeMessage = (text: string) => {
    // Check if the cheat code info is inline (all on one or few lines)
    const inlineMatch = text.match(/(.*?)(Title:[\s\S]*)/i);

    if (inlineMatch) {
      const intro = inlineMatch[1].trim();
      const cheatCodeText = inlineMatch[2].trim();
      return { intro, cheatCodeText };
    }

    // Otherwise use line-by-line detection
    const lines = text.split('\n');
    let cheatCodeStartIndex = -1;

    // Find where the cheat code structure starts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for standard format markers
      if (line.includes('🏀') || line.startsWith('**What:**')) {
        cheatCodeStartIndex = i;
        break;
      }
      // Look for alternative format markers
      if (line.match(/^Title:/i) || line.match(/^Trigger:/i) || line.includes('Title:')) {
        cheatCodeStartIndex = i;
        break;
      }
    }

    if (cheatCodeStartIndex === -1) {
      return { intro: text, cheatCodeText: '' };
    }

    const intro = lines.slice(0, cheatCodeStartIndex).join('\n').trim();
    const cheatCodeText = lines.slice(cheatCodeStartIndex).join('\n').trim();

    return { intro, cheatCodeText };
  };

  // State for cheat code modal
  const [showCheatCode, setShowCheatCode] = useState(false);
  const [currentCheatCode, setCurrentCheatCode] = useState<CheatCodeData | null>(null);

  // Helper to parse cheat code from text
  const parseCheatCode = (text: string): CheatCodeData => {
    // Check if it's the alternative format first
    const isAlternativeFormat = text.includes('Title:') && text.includes('Trigger:');

    if (isAlternativeFormat) {
      // Parse alternative format (Title/Trigger/Cue phrase/etc.)
      const titleMatch = text.match(/Title:\s*([^T\n]+?)(?=Trigger:|$)/i);
      const triggerMatch = text.match(/Trigger:\s*([^C\n]+?)(?=Cue phrase:|$)/i);
      const cueMatch = text.match(/Cue phrase:\s*"?([^"F\n]+?)"?\s*(?=First action:|$)/i);

      const title = titleMatch ? titleMatch[1].trim() : 'Free Throw Lockdown';
      const when = triggerMatch ? triggerMatch[1].trim() : 'Every free throw, especially in pressure moments';
      const phrase = cueMatch ? cueMatch[1].trim() : 'My line, my time';

      return {
        title,
        category: 'In-Game',
        what: 'A 3-step mental reset routine that calms your nerves and locks in your focus at the free throw line',
        when,
        how: '• Step to the line and take your position calmly\n• Take one controlled breath: 2-count inhale through your nose, 3-count exhale through your mouth\n• Say "My line, my time" in your head while visualizing the ball going perfectly through the net',
        why: 'The 3-count exhale activates your parasympathetic nervous system, which scientifically reduces stress in under 5 seconds.\n\nThe phrase creates psychological ownership - you\'re claiming the moment instead of letting pressure and the crowd own it.',
        phrase
      };
    }

    // Default fallback
    return {
      title: 'Free Throw Lockdown',
      category: 'In-Game',
      what: 'A 3-step mental reset routine that calms your nerves and locks in your focus at the free throw line',
      when: 'Every free throw, especially in pressure moments',
      how: '• Step to the line and take your position calmly\n• Take one controlled breath: 2-count inhale through your nose, 3-count exhale through your mouth\n• Say "My line, my time" in your head while visualizing the ball going perfectly through the net',
      why: 'The 3-count exhale activates your parasympathetic nervous system, which scientifically reduces stress in under 5 seconds.\n\nThe phrase creates psychological ownership - you\'re claiming the moment instead of letting pressure and the crowd own it.',
      phrase: 'My line, my time'
    };
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 px-4 py-4 flex items-center justify-center z-50 relative" style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--card-border)' }}>
        <Link href="/" className="absolute left-4 p-2 rounded-lg transition-colors" style={{ color: 'var(--accent-color)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <div className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Live Chat</div>
      </div>


      {/* Main Chat */}
      <div className="flex-1 flex flex-col pt-20">
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="space-y-6">
            {demoMessages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'user' ? (
                  <div className="max-w-[65%] p-5 rounded-3xl border rounded-br-lg" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}>
                    <div className="text-base leading-relaxed">{message.text}</div>
                    <div className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-5">
                    {isCheatCode(message.text) ? (
                      // Special formatting for cheat codes with button to view
                      <div>
                        {(() => {
                          const { intro, cheatCodeText } = splitCheatCodeMessage(message.text);
                          const cheatCode = parseCheatCode(cheatCodeText);
                          return (
                            <div className="space-y-4">
                              {/* Coach introduction text */}
                              {intro && (
                                <div className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                                  {intro}
                                </div>
                              )}

                              {/* View Cheat Code Button */}
                              <button
                                onClick={() => {
                                  setCurrentCheatCode(cheatCode);
                                  setShowCheatCode(true);
                                }}
                                className="w-full px-6 py-4 rounded-xl font-semibold active:scale-[0.98] transition-all"
                                style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                              >
                                View Cheat Code
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                        {message.text}
                      </div>
                    )}
                    <div className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area (disabled for demo) */}
        <div className="p-6" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Share what's on your mind..."
                disabled
                className="w-full rounded-2xl px-6 py-4 focus:outline-none transition-colors cursor-not-allowed"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cheat Code Modal */}
      {showCheatCode && currentCheatCode && (
        <CheatCodeCards
          cheatCode={currentCheatCode}
          onClose={() => setShowCheatCode(false)}
        />
      )}
    </div>
  );
}
