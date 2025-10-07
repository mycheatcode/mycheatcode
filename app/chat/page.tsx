'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TypingAnimation from '../../components/TypingAnimation';

type Sender = 'user' | 'coach';

interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
}

/** tiny helper for unique ids */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** simple heuristic to capture a primary issue from early user messages */
function extractPrimaryIssue(text: string): string | null {
  const t = text.trim();
  if (t.length < 8) return null;
  // ignore very generic greetings
  if (/^(hi|hey|hello|yo|sup)\b/i.test(t)) return null;
  return t.slice(0, 140); // keep it short for context
}

export default function ChatPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [isRestoringChat, setIsRestoringChat] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  /** duplication guards */
  const pendingCoachReply = useRef<boolean>(false);
  const pendingWelcome = useRef<boolean>(false);
  const messageIds = useRef<Set<string>>(new Set());
  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper to detect if a message contains a cheat code
  const isCheatCode = (text: string): boolean => {
    return text.includes('**What:**') && text.includes('**When:**') && text.includes('**How:**') && text.includes('**Why:**');
  };

  // Helper to split message into intro text and cheat code
  const splitCheatCodeMessage = (text: string) => {
    const lines = text.split('\n');
    let cheatCodeStartIndex = -1;

    // Find where the cheat code structure starts (look for the title with emoji)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('🏀') || lines[i].startsWith('**What:**')) {
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

    // Extract title (look for emoji and title)
    const titleMatch = text.match(/\*\*🏀\s+([^*]+)\*\*/);
    cheatCode.title = titleMatch ? titleMatch[1].trim() : 'Cheat Code';

    // Extract subtitle/phrase (look for italic text with quotes)
    const subtitleMatch = text.match(/\*"([^"]+)"\*/);
    cheatCode.subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

    // Assign a category based on content (you can make this more sophisticated)
    cheatCode.category = 'In-Game'; // Default for free throw situation

    // Extract sections using [\s\S] instead of /s flag for compatibility
    const whatMatch = text.match(/\*\*What:\*\*\s*([\s\S]*?)(?=\*\*When:|$)/);
    const whenMatch = text.match(/\*\*When:\*\*\s*([\s\S]*?)(?=\*\*How:|$)/);
    const howMatch = text.match(/\*\*How:\*\*\s*([\s\S]*?)(?=\*\*Why:|$)/);
    const whyMatch = text.match(/\*\*Why:\*\*\s*([\s\S]*?)(?=\*\*Cheat Code Phrase:|$)/);
    const phraseMatch = text.match(/\*\*Cheat Code Phrase:\*\*\s*"([^"]+)"|\*\*Cheat Code Phrase:\*\*\s*([^\n*]+)/);
    const practiceMatch = text.match(/💡\s*\*\*Practice:\*\*\s*([\s\S]*?)$/m);

    cheatCode.what = whatMatch ? whatMatch[1].trim() : '';
    cheatCode.when = whenMatch ? whenMatch[1].trim() : '';
    cheatCode.how = howMatch ? howMatch[1].trim() : '';
    cheatCode.why = whyMatch ? whyMatch[1].trim() : '';
    cheatCode.phrase = phraseMatch ? (phraseMatch[1] || phraseMatch[2]).trim() : '';
    cheatCode.practice = practiceMatch ? practiceMatch[1].trim() : '';

    return cheatCode;
  };

  const appendMessage = (msg: Message) => {
    if (messageIds.current.has(msg.id)) return;
    messageIds.current.add(msg.id);
    setMessages(prev => [...prev, msg]);
  };

  const handleBack = () => {
    const referrer = typeof window !== 'undefined' ? localStorage.getItem('chatReferrer') : null;
    if (referrer) {
      localStorage.removeItem('chatReferrer');
      router.push(referrer);
    } else {
      router.back();
    }
  };

  // Initialize once
  useEffect(() => {
    if (initialized) return;

    // Check for demo mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('demo') === 'true';

    // Load stored topic (if any)
    const storedTopic = typeof window !== 'undefined' ? localStorage.getItem('selectedTopic') : null;
    if (storedTopic) {
      try {
        const topic = JSON.parse(storedTopic);
        setSelectedTopic(topic);
      } catch {
        // ignore
      }
    }

    // Try to restore prior chat
    const chatHistory = typeof window !== 'undefined' ? localStorage.getItem('chatHistory') : null;
    if (chatHistory) {
      try {
        const parsed = JSON.parse(chatHistory);
        if (parsed.isRestoringChat && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          const restored: Message[] = parsed.messages.map((m: any) => {
            const msg: Message = {
              id: String(m.id ?? uid()),
              text: m.text,
              sender: m.sender as Sender,
              timestamp: new Date(m.timestamp),
            };
            messageIds.current.add(msg.id);
            return msg;
          });
          setMessages(restored);
          setIsRestoringChat(true);
          setHasStarted(true);
          setInitialized(true);
          localStorage.removeItem('chatHistory');
          return;
        }
      } catch {
        localStorage.removeItem('chatHistory');
      }
    }

    // New chat: coach opens
    setHasStarted(true);
    setInitialized(true);

    if (!pendingWelcome.current) {
      pendingWelcome.current = true;

      // Check if we should show the demo conversation
      if (isDemoMode) {
        // Create demo conversation for screenshots
        const demoMessages: Message[] = [
          {
            id: uid(),
            text: "Yo! Let's talk about your game. What's been challenging you or what do you want to work on?",
            sender: 'coach' as Sender,
            timestamp: new Date(Date.now() - 8 * 60000),
          },
          {
            id: uid(),
            text: "My free throws. I get nervous late in games and miss easy ones",
            sender: 'user' as Sender,
            timestamp: new Date(Date.now() - 7 * 60000),
          },
          {
            id: uid(),
            text: "Got it. When do you notice the nerves most? Before the shot, while you are stepping to the line, or right as you release?",
            sender: 'coach' as Sender,
            timestamp: new Date(Date.now() - 6 * 60000),
          },
          {
            id: uid(),
            text: "Mostly while I am stepping to the line and everyone's watching me. I feel rushed and want to get it over with",
            sender: 'user' as Sender,
            timestamp: new Date(Date.now() - 5 * 60000),
          },
          {
            id: uid(),
            text: "Do you have any specific thoughts when you're there at the line? What do you say to yourself before you shoot?",
            sender: 'coach' as Sender,
            timestamp: new Date(Date.now() - 4 * 60000),
          },
          {
            id: uid(),
            text: "I just think \"don't miss\" and then I rush it",
            sender: 'user' as Sender,
            timestamp: new Date(Date.now() - 3 * 60000),
          },
          {
            id: uid(),
            text: "So the thought of missing speeds you up. Do you notice it in your body too?",
            sender: 'coach' as Sender,
            timestamp: new Date(Date.now() - 2 * 60000),
          },
          {
            id: uid(),
            text: "Yeah, a bit, I feel tense and my hands get kind of jumpy",
            sender: 'user' as Sender,
            timestamp: new Date(Date.now() - 90000),
          },
          {
            id: uid(),
            text: "That's pressure talking. Let's flip it. What if every free throw had the exact same short routine? One that slowed you down and locked you in and blocked out all of those thoughts and feelings that don't help. Want me to give you a cheat code for that?",
            sender: 'coach' as Sender,
            timestamp: new Date(Date.now() - 60000),
          },
          {
            id: uid(),
            text: "Yeah, please",
            sender: 'user' as Sender,
            timestamp: new Date(Date.now() - 30000),
          },
          {
            id: uid(),
            text: `Perfect. Here's your free throw lockdown routine:

**🏀 Free Throw Lockdown**

*"My line, my time"*

**What:** 3-step mental reset for clutch free throws

**When:** Every free throw, especially in pressure moments

**How:**
• Step to the line and take your position
• One controlled breath: 2-count inhale, 3-count exhale
• Say "My line, my time" while visualizing the ball going in

**Why:** The exhale activates your parasympathetic nervous system (reduces stress), while the phrase creates psychological ownership and confidence

**Cheat Code Phrase:** "My line, my time"

**Practice:** 20 free throws daily using this exact sequence`,
            sender: 'coach' as Sender,
            timestamp: new Date(),
          },
          {
            id: uid(),
            text: "Here's the key: that 3-count exhale is scientifically proven to calm your nervous system in under 5 seconds - perfect for the 10-second rule. The phrase isn't just motivation - it's claiming mental territory. Most players rush to the line feeling like the crowd owns that moment. When you say 'My line, my time,' you're literally taking control back.\n\nTry it right now - do that breath pattern and say the phrase. Feel different? That's your body switching from fight-or-flight to focused confidence.",
            sender: 'coach' as Sender,
            timestamp: new Date(Date.now() + 5000),
          }
        ];

        demoMessages.forEach(msg => {
          messageIds.current.add(msg.id);
        });
        setMessages(demoMessages);
        return;
      }

      // Show coach message immediately (no delay)
      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedTopic') : null;

      // Static welcome message
      let welcomeText = "What's up! I'm your mental performance coach. What do you want to talk about?";

      if (stored) {
        try {
          const topic = JSON.parse(stored);

          // Use custom starter if available, otherwise use default topic messages
          if (topic.customStarter) {
            welcomeText = topic.customStarter;
          } else {
            const topicMessages = [
              `I see you're focused on: "${topic.title}". Walk me through what happened the last time this came up.`,
              `Ah, working on "${topic.title}". Tell me about a recent time when this was an issue for you.`,
              `Got it, "${topic.title}" is what we're tackling. What does this usually look like when it happens?`,
              `Cool, so "${topic.title}" is on your mind. When did you last deal with this situation?`
            ];
            welcomeText = topicMessages[Math.floor(Math.random() * topicMessages.length)];
          }
        } catch {
          // ignore
        }
      }

      appendMessage({
        id: uid(),
        text: welcomeText,
        sender: 'coach',
        timestamp: new Date(),
      });
    }

    return () => {
      if (replyTimeout.current) clearTimeout(replyTimeout.current);
      if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current);
    };
  }, [initialized]);

  /** Build payload the API expects */
  const buildChatPayload = (msgs: Message[]) => {
    const history = msgs.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    // Put topic context at the front if present
    if (selectedTopic?.title) {
      history.unshift({
        role: 'system',
        content: `User focus/topic: ${selectedTopic.title}${selectedTopic.description ? ` - ${selectedTopic.description}` : ''}`,
      } as any);
    }

    // Meta: primary issue + number of turns
    const primaryIssue = typeof window !== 'undefined' ? localStorage.getItem('primary_issue') : null;

    return {
      messages: history,
      meta: {
        primaryIssue: primaryIssue || undefined,
        turns: history.length,
      },
    };
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    if (pendingCoachReply.current) return;

    // Capture a primary issue early if we do not have one yet
    const existingPI = typeof window !== 'undefined' ? localStorage.getItem('primary_issue') : null;
    if (!existingPI) {
      const guess = extractPrimaryIssue(trimmed);
      if (guess && typeof window !== 'undefined') {
        localStorage.setItem('primary_issue', guess);
      }
    }

    // Add user message locally
    const userMsg: Message = {
      id: uid(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };
    appendMessage(userMsg);
    setInputText('');
    setIsTyping(true);
    pendingCoachReply.current = true;

    // Keep focus on the input for fast back-and-forth
    if (inputRef.current) inputRef.current.focus();

    try {
      const payload = buildChatPayload([...messages, userMsg]);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }

      const data = await res.json();
      appendMessage({
        id: uid(),
        text: data.reply || 'Let’s keep going. What part of that moment feels hardest?',
        sender: 'coach',
        timestamp: new Date(),
      });
    } catch (err) {
      appendMessage({
        id: uid(),
        text: '⚠️ Could not reach the coach. Try again.',
        sender: 'coach',
        timestamp: new Date(),
      });
    } finally {
      setIsTyping(false);
      pendingCoachReply.current = false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Mobile */}
      <div className="lg:hidden bg-black min-h-screen relative flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <div className="text-white text-lg font-semibold">Live Chat</div>
            <div className="w-8 h-8"></div>
          </div>

          {/* Topic Indicator */}
          {selectedTopic && (
            <div className="mt-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Session Focus</div>
              </div>
              <div className="text-sm text-white font-semibold leading-tight">
                "{selectedTopic.title}"
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'user' ? (
                <div className="max-w-[75%] p-3 rounded-3xl border bg-white/5 text-white rounded-br-lg border-white/20">
                  <div className="text-[15px] leading-relaxed">{message.text}</div>
                  <div className="text-xs mt-2 text-zinc-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="w-full p-3">
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
                              <div className="text-[15px] leading-relaxed text-white whitespace-pre-wrap mb-4">
                                {intro}
                              </div>
                            )}

                            {/* Cheat code box - Matching My Codes page design */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-zinc-400 text-sm uppercase tracking-wide">Cheat Code</span>
                              </div>
                              <div className="space-y-2">
                                <div className="text-white font-bold text-lg">{cheatCode.title}</div>
                                <div className="text-zinc-400 text-xs uppercase tracking-wide mb-2">{cheatCode.category}</div>
                                <div className="space-y-1.5 text-sm">
                                  {cheatCode.what && <div><span className="text-zinc-400 font-medium">What:</span> <span className="text-white">{cheatCode.what}</span></div>}
                                  {cheatCode.when && <div><span className="text-zinc-400 font-medium">When:</span> <span className="text-white">{cheatCode.when}</span></div>}
                                  {cheatCode.how && <div><span className="text-zinc-400 font-medium">How:</span> <span className="text-white whitespace-pre-line">{cheatCode.how}</span></div>}
                                  {cheatCode.why && <div><span className="text-zinc-400 font-medium">Why:</span> <span className="text-white">{cheatCode.why}</span></div>}
                                  {cheatCode.phrase && <div><span className="text-zinc-400 font-medium">Cheat Code Phrase:</span> <span className="text-white">"{cheatCode.phrase}"</span></div>}
                                  {cheatCode.practice && <div><span className="text-zinc-400 font-medium">Practice:</span> <span className="text-white">{cheatCode.practice}</span></div>}
                                </div>

                                {/* Power Bar - Matching My Codes page exactly */}
                                <div className="mt-4 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-sm uppercase tracking-wide">Cheat Code Power</span>
                                    <span className="text-white text-sm font-semibold">75%</span>
                                  </div>
                                  <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden relative">
                                    <div
                                      className="h-full rounded-full transition-all duration-300 ease-out"
                                      style={{
                                        background: 'linear-gradient(90deg, #FF0000 0%, #FF0000 26.67%, #FFA500 33.33%, #FFA500 66.67%, #FFFF00 73.33%, #FFFF00 100%)',
                                        width: '75%'
                                      }}
                                    ></div>
                                    {/* Subtle highlight overlay for premium feel */}
                                    <div
                                      className="absolute top-0 left-0 h-full rounded-full opacity-20 transition-all duration-300 ease-out"
                                      style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                        width: '75%'
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-zinc-400">Log a usage to activate this code and build its strength</p>
                                </div>

                                {/* Add to My Codes Button */}
                                <div className="mt-4 pt-3 border-t border-white/5">
                                  <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10">
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
                    <TypingAnimation
                      key={message.id}
                      text={message.text}
                      speed={40}
                      className="text-[15px] leading-relaxed text-white whitespace-pre-wrap"
                    />
                  )}
                  <div className="text-xs mt-2 text-zinc-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-full p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-800 bg-black flex-shrink-0">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="w-full bg-white/5 border border-white/20 rounded-xl p-4 pr-12 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-white/30 transition-all duration-200 backdrop-blur-sm"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || pendingCoachReply.current}
              className="absolute right-3 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500/10 disabled:opacity-50 disabled:border-zinc-700 disabled:text-zinc-700"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5,12 12,5 19,12"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 px-6 py-5 z-20 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <button
                onClick={handleBack}
                className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </button>
              <div className="text-white text-xl app-label">MYCHEATCODE.AI</div>
            </div>
            <div className="text-white text-lg font-semibold absolute left-1/2 transform -translate-x-1/2">Live Chat</div>
            <div className="w-[180px]"></div>
          </div>

          {/* Topic Indicator */}
          {selectedTopic && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Session Focus</div>
                </div>
                <div className="text-lg text-white font-bold leading-tight mb-2">
                  "{selectedTopic.title}"
                </div>
                {selectedTopic.description && (
                  <div className="text-sm text-zinc-400 leading-relaxed">
                    {selectedTopic.description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Sidebar Header */}
          <div className="pt-6 px-6 pb-4 border-b border-zinc-800">
            <div className="text-white text-xl app-label mb-2">MYCHEATCODE.AI</div>
            <div className="text-zinc-500 text-xs">Mental Performance Training</div>
          </div>

          <nav className="flex-1 py-4">
            <div className="space-y-1 px-3">
              <Link href="/" className="flex items-start gap-4 p-3 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-all hover:bg-zinc-900 group">
                <svg className="mt-0.5 group-hover:text-green-500 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-0.5">Home</div>
                  <div className="text-xs text-zinc-400">Progress star + recommendations</div>
                </div>
              </Link>

              <Link href="/my-codes" className="flex items-start gap-4 p-3 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-all hover:bg-zinc-900 group">
                <svg className="mt-0.5 group-hover:text-green-500 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-0.5">My Codes</div>
                  <div className="text-xs text-zinc-400">Active cheat codes/topics</div>
                </div>
              </Link>

              <Link href="/community-topics" className="flex items-start gap-4 p-3 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-all hover:bg-zinc-900 group">
                <svg className="mt-0.5 group-hover:text-green-500 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-0.5">Community Topics</div>
                  <div className="text-xs text-zinc-400">Browse new topics</div>
                </div>
              </Link>

              <Link href="/chat-history" className="flex items-start gap-4 p-3 text-white bg-zinc-900/50 rounded-xl cursor-pointer transition-all hover:bg-zinc-900 group">
                <svg className="mt-0.5 text-green-500" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-0.5">Chat History</div>
                  <div className="text-xs text-zinc-400">Past sessions</div>
                </div>
              </Link>

              <Link href="/profile" className="flex items-start gap-4 p-3 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-all hover:bg-zinc-900 group">
                <svg className="mt-0.5 group-hover:text-green-500 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-0.5">Profile</div>
                  <div className="text-xs text-zinc-400">Settings + basic stats</div>
                </div>
              </Link>
            </div>
          </nav>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col" style={{ paddingTop: selectedTopic ? '200px' : '80px' }}>
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              {messages.map((message) => (
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
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className="text-zinc-400 text-sm uppercase tracking-wide">Cheat Code</span>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="text-white font-bold text-xl">{cheatCode.title}</div>
                                    <div className="text-zinc-400 text-sm uppercase tracking-wide mb-3">{cheatCode.category}</div>
                                    <div className="space-y-2 text-base">
                                      {cheatCode.what && <div><span className="text-zinc-400 font-medium">What:</span> <span className="text-white">{cheatCode.what}</span></div>}
                                      {cheatCode.when && <div><span className="text-zinc-400 font-medium">When:</span> <span className="text-white">{cheatCode.when}</span></div>}
                                      {cheatCode.how && <div><span className="text-zinc-400 font-medium">How:</span> <span className="text-white whitespace-pre-line">{cheatCode.how}</span></div>}
                                      {cheatCode.why && <div><span className="text-zinc-400 font-medium">Why:</span> <span className="text-white">{cheatCode.why}</span></div>}
                                      {cheatCode.phrase && <div><span className="text-zinc-400 font-medium">Cheat Code Phrase:</span> <span className="text-white">"{cheatCode.phrase}"</span></div>}
                                      {cheatCode.practice && <div><span className="text-zinc-400 font-medium">Practice:</span> <span className="text-white">{cheatCode.practice}</span></div>}
                                    </div>

                                    {/* Power Bar - Matching My Codes page exactly */}
                                    <div className="mt-4 space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm uppercase tracking-wide">Cheat Code Power</span>
                                        <span className="text-white text-sm font-semibold">75%</span>
                                      </div>
                                      <div className="w-full h-6 bg-white/5 rounded-full overflow-hidden relative">
                                        <div
                                          className="h-full rounded-full transition-all duration-300 ease-out"
                                          style={{
                                            background: 'linear-gradient(90deg, #FF0000 0%, #FF0000 26.67%, #FFA500 33.33%, #FFA500 66.67%, #FFFF00 73.33%, #FFFF00 100%)',
                                            width: '75%'
                                          }}
                                        ></div>
                                        {/* Subtle highlight overlay for premium feel */}
                                        <div
                                          className="absolute top-0 left-0 h-full rounded-full opacity-20 transition-all duration-300 ease-out"
                                          style={{
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                            width: '75%'
                                          }}
                                        ></div>
                                      </div>
                                      <p className="text-xs text-zinc-400">Log a usage to activate this code and build its strength</p>
                                    </div>

                                    {/* Add to My Codes Button */}
                                    <div className="mt-4 pt-3 border-t border-white/5">
                                      <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10">
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
                        <TypingAnimation
                          key={message.id}
                          text={message.text}
                          speed={40}
                          className="text-base leading-relaxed text-white whitespace-pre-wrap"
                        />
                      )}
                      <div className="text-sm mt-3 text-zinc-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-full p-5">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-zinc-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-8 border-t border-zinc-800 bg-black">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="w-full bg-white/5 border border-white/20 rounded-xl p-4 pr-14 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-white/30 transition-all duration-200 backdrop-blur-sm text-base"
                rows={2}
                style={{ minHeight: '60px', maxHeight: '150px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || pendingCoachReply.current}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500/10 disabled:opacity-50 disabled:border-zinc-700 disabled:text-zinc-700"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5,12 12,5 19,12"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}