'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    return text.includes('Title:') && text.includes('Trigger:') && text.includes('Cue phrase:');
  };

  // Helper to split message into intro text and cheat code
  const splitCheatCodeMessage = (text: string) => {
    const lines = text.split('\n');
    let cheatCodeStartIndex = -1;

    // Find where the cheat code structure starts
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Title:')) {
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
    const lines = text.split('\n');
    const cheatCode: any = {};

    lines.forEach(line => {
      if (line.startsWith('Title:')) cheatCode.title = line.replace('Title:', '').trim();
      if (line.startsWith('Trigger:')) cheatCode.trigger = line.replace('Trigger:', '').trim();
      if (line.startsWith('Cue phrase:')) cheatCode.cuePhrase = line.replace('Cue phrase:', '').trim();
      if (line.startsWith('First action:')) cheatCode.firstAction = line.replace('First action:', '').trim();
      if (line.startsWith('If/Then:')) cheatCode.ifThen = line.replace('If/Then:', '').trim();
      if (line.startsWith('Reps:')) cheatCode.reps = line.replace('Reps:', '').trim();
    });

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

      // Show coach message immediately (no delay)
      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedTopic') : null;

      // Varied welcome messages for fresh feel - all personal and direct, no assumptions
      const welcomeMessages = [
        "What's good! I'm here to help you level up your mental game. What's been on your mind lately with basketball?",
        "Hey there! Ready to work on your mental performance? What's going on with your game?",
        "What's up! I'm your mental performance coach. What do you want to talk about?",
        "Yo! Let's talk about your game. What's been challenging you or what do you want to work on?",
        "Hey! I'm here to help you dial in your mental game. What's on your mind right now?"
      ];

      let welcomeText = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

      if (stored) {
        try {
          const topic = JSON.parse(stored);
          const topicMessages = [
            `I see you're focused on: "${topic.title}". Walk me through what happened the last time this came up.`,
            `Ah, working on "${topic.title}". Tell me about a recent time when this was an issue for you.`,
            `Got it, "${topic.title}" is what we're tackling. What does this usually look like when it happens?`,
            `Cool, so "${topic.title}" is on your mind. When did you last deal with this situation?`
          ];
          welcomeText = topicMessages[Math.floor(Math.random() * topicMessages.length)];
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
            <div className="mt-3 px-4 py-3 bg-gradient-to-r from-zinc-900/80 to-zinc-800/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                <div className="text-xs text-zinc-300 font-medium uppercase tracking-wide">Session Focus</div>
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
                <div className="max-w-[75%] p-3 rounded-3xl border bg-zinc-800 text-white rounded-br-lg border-zinc-700">
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

                            {/* Cheat code box */}
                            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span className="text-blue-300 text-sm font-semibold uppercase tracking-wide">Cheat Code</span>
                              </div>
                              <div className="space-y-2">
                                <div className="text-white font-bold text-lg">{cheatCode.title}</div>
                                <div className="space-y-1.5 text-sm">
                                  <div><span className="text-blue-300 font-medium">Trigger:</span> <span className="text-white">{cheatCode.trigger}</span></div>
                                  <div><span className="text-blue-300 font-medium">Cue phrase:</span> <span className="text-white">"{cheatCode.cuePhrase}"</span></div>
                                  <div><span className="text-blue-300 font-medium">First action:</span> <span className="text-white">{cheatCode.firstAction}</span></div>
                                  {cheatCode.ifThen && <div><span className="text-blue-300 font-medium">If/Then:</span> <span className="text-white">{cheatCode.ifThen}</span></div>}
                                  <div><span className="text-blue-300 font-medium">Reps:</span> <span className="text-white">{cheatCode.reps}</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-[15px] leading-relaxed text-white whitespace-pre-wrap">{message.text}</div>
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
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 pr-12 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500 transition-colors"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || pendingCoachReply.current}
              className={`absolute right-3 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${inputText.trim() && !pendingCoachReply.current ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}
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
        <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-black border-b border-zinc-800">
          <div className="flex items-center justify-between">
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
              <div className="text-white text-xl font-bold">mycheatcode.ai</div>
            </div>
            <div className="text-white text-lg font-semibold">Live Chat</div>
            <div className="w-[180px]"></div>
          </div>

          {/* Topic Indicator */}
          {selectedTopic && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="relative px-6 py-4 bg-gradient-to-br from-zinc-900/90 via-zinc-800/80 to-zinc-900/70 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
                    <div className="text-sm text-zinc-300 font-semibold uppercase tracking-wider">Session Focus</div>
                  </div>
                  <div className="text-lg text-white font-bold leading-tight mb-2">
                    "{selectedTopic.title}"
                  </div>
                  <div className="text-sm text-zinc-400 leading-relaxed">
                    {selectedTopic.description}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={`absolute top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 pt-20 border-b border-zinc-800">
            <div className="text-white text-xl font-bold">Navigation</div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Link href="/" className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>
              <Link href="/community-topics" className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Topics</span>
              </Link>
              <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg text-white font-medium">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Chats</span>
              </div>
              <div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Profile</span>
              </div>
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
                    <div className="max-w-[65%] p-5 rounded-3xl border bg-zinc-800 text-white rounded-br-lg border-zinc-700">
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

                                {/* Cheat code box */}
                                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-blue-300 text-sm font-semibold uppercase tracking-wide">Cheat Code</span>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="text-white font-bold text-xl">{cheatCode.title}</div>
                                    <div className="space-y-2 text-base">
                                      <div><span className="text-blue-300 font-medium">Trigger:</span> <span className="text-white">{cheatCode.trigger}</span></div>
                                      <div><span className="text-blue-300 font-medium">Cue phrase:</span> <span className="text-white">"{cheatCode.cuePhrase}"</span></div>
                                      <div><span className="text-blue-300 font-medium">First action:</span> <span className="text-white">{cheatCode.firstAction}</span></div>
                                      {cheatCode.ifThen && <div><span className="text-blue-300 font-medium">If/Then:</span> <span className="text-white">{cheatCode.ifThen}</span></div>}
                                      <div><span className="text-blue-300 font-medium">Reps:</span> <span className="text-white">{cheatCode.reps}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-base leading-relaxed text-white whitespace-pre-wrap">{message.text}</div>
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
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 pr-14 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500 transition-colors text-base"
                rows={2}
                style={{ minHeight: '60px', maxHeight: '150px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || pendingCoachReply.current}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${inputText.trim() && !pendingCoachReply.current ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5,12 12,5 9,12"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}