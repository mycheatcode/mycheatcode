'use client';

import { useState } from 'react';
import Link from 'next/link';

type Sender = 'user' | 'coach';

interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
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

  // Helper to parse cheat code from text
  const parseCheatCode = (text: string) => {
    const cheatCode: any = {};

    // Check if it's the alternative format first
    const isAlternativeFormat = text.includes('Title:') && text.includes('Trigger:');

    if (isAlternativeFormat) {
      // Parse alternative format (Title/Trigger/Cue phrase/etc.)
      // Handle both with and without asterisks, including inline format
      const titleMatch = text.match(/Title:\s*([^T\n]+?)(?=Trigger:|$)/i);
      const triggerMatch = text.match(/Trigger:\s*([^C\n]+?)(?=Cue phrase:|$)/i);
      const cueMatch = text.match(/Cue phrase:\s*"?([^"F\n]+?)"?\s*(?=First action:|$)/i);
      const firstActionMatch = text.match(/First action:\s*([^I\n]+?)(?=If\/Then:|$)/i);
      const ifThenMatch = text.match(/If\/Then:\s*([^R]+?)(?=Reps:|$)/i);
      const repsMatch = text.match(/Reps:\s*([\s\S]+?)(?=Does|$)/i);

      cheatCode.title = titleMatch ? titleMatch[1].trim() : 'Cheat Code';
      cheatCode.category = 'In-Game';

      // Map to standard format
      cheatCode.what = '3-step mental reset for clutch free throws';
      cheatCode.when = triggerMatch ? triggerMatch[1].trim() : '';
      cheatCode.phrase = cueMatch ? cueMatch[1].trim() : '';

      // Build the "How" section from First action and If/Then
      const firstAction = firstActionMatch ? firstActionMatch[1].trim() : '';
      const ifThen = ifThenMatch ? ifThenMatch[1].trim() : '';
      const reps = repsMatch ? repsMatch[1].trim() : '';

      const howParts = [];
      if (firstAction) howParts.push(`• Step to the line and take your position`);
      howParts.push(`• One controlled breath: 2-count inhale, 3-count exhale`);
      howParts.push(`• Say "My line, my time" while visualizing the ball going in`);

      cheatCode.how = howParts.join('\n');
      cheatCode.why = 'The exhale activates your parasympathetic nervous system (reduces stress), while the phrase creates psychological ownership and confidence';
    }

    return cheatCode;
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 px-6 py-5 flex items-center gap-4 z-50 bg-black border-b border-zinc-800">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <Link href="/" className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </Link>
        <div className="text-white text-xl app-label">MYCHEATCODE.AI</div>
        <div className="text-white text-lg font-semibold absolute left-1/2 transform -translate-x-1/2">Live Chat</div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-[60] ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-20"></div>

        <nav className="flex-1">
          <div>
            <Link href="/" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>

            <Link href="/my-codes" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>

            <Link href="/community-topics" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Community Topics</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>

            <Link href="/chat-history" className="flex items-center gap-3 p-4 text-white bg-zinc-900/50 font-medium cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Chat History</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>

            <Link href="/profile" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Profile</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col pt-20">
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="space-y-6">
            {demoMessages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'user' ? (
                  <div className="max-w-[65%] p-5 rounded-3xl border bg-white/5 text-white rounded-br-lg border-white/20">
                    <div className="text-base leading-relaxed">{message.text}</div>
                    <div className="text-sm mt-3 text-zinc-400">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-5">
                    {isCheatCode(message.text) ? (
                      // Special formatting for cheat codes with intro text
                      <div>
                        {(() => {
                          const { intro, cheatCodeText } = splitCheatCodeMessage(message.text);
                          const cheatCode = parseCheatCode(cheatCodeText);
                          return (
                            <div>
                              {/* Coach introduction text */}
                              {intro && (
                                <div className="text-base leading-relaxed text-white whitespace-pre-wrap mb-6">
                                  {intro}
                                </div>
                              )}

                              {/* Cheat code box - Matching My Codes page design */}
                              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <span className="text-zinc-400 text-sm uppercase tracking-wide">Cheat Code</span>
                                </div>
                                <div className="space-y-4">
                                  <div className="text-white font-bold text-xl">{cheatCode.title}</div>
                                  <div className="text-zinc-400 text-sm uppercase tracking-wide">{cheatCode.category}</div>
                                  <div className="space-y-3 text-base">
                                    {cheatCode.what && (
                                      <div className="leading-relaxed">
                                        <div className="text-zinc-400 font-semibold mb-1">What:</div>
                                        <div className="text-white">{cheatCode.what}</div>
                                      </div>
                                    )}
                                    {cheatCode.when && (
                                      <div className="leading-relaxed">
                                        <div className="text-zinc-400 font-semibold mb-1">When:</div>
                                        <div className="text-white">{cheatCode.when}</div>
                                      </div>
                                    )}
                                    {cheatCode.how && (
                                      <div className="leading-relaxed">
                                        <div className="text-zinc-400 font-semibold mb-1">How:</div>
                                        <div className="text-white whitespace-pre-line">{cheatCode.how}</div>
                                      </div>
                                    )}
                                    {cheatCode.why && (
                                      <div className="leading-relaxed">
                                        <div className="text-zinc-400 font-semibold mb-1">Why:</div>
                                        <div className="text-white">{cheatCode.why}</div>
                                      </div>
                                    )}
                                    {cheatCode.phrase && (
                                      <div className="leading-relaxed">
                                        <div className="text-zinc-400 font-semibold mb-1">Cheat Code Phrase:</div>
                                        <div className="text-white">"{cheatCode.phrase}"</div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Add to My Codes Button */}
                                  <div className="mt-6 pt-4 border-t border-zinc-800">
                                    <button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-zinc-700">
                                      Add to "My Codes"
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-base leading-relaxed text-white whitespace-pre-wrap">
                        {message.text}
                      </div>
                    )}
                    <div className="text-sm mt-3 text-zinc-400">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area (disabled for demo) */}
        <div className="p-6 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="This is a demo - input disabled"
                disabled
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
