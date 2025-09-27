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

/** Map a topic title/description to a server section slug the API expects */
function inferSectionFromTopic(topic?: { title?: string; description?: string } | null): string {
  const t = `${topic?.title ?? ''} ${topic?.description ?? ''}`.toLowerCase();

  // tune these heuristics to your taxonomy on the server
  if (/\b(pre[-\s]?game|warm[-\s]?up|before game)\b/.test(t)) return 'pre_game';
  if (/\b(in[-\s]?game|during game|on court|in match|live)\b/.test(t)) return 'in_game';
  if (/\b(post[-\s]?game|after game|review|debrief)\b/.test(t)) return 'post_game';
  if (/\b(locker|locker room)\b/.test(t)) return 'locker_room';
  if (/\b(off[-\s]?court|life|school|work|home)\b/.test(t)) return 'off_court';

  // default to in_game if unsure
  return 'in_game';
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

  /** ---- duplication guards ---- */
  const pendingCoachReply = useRef<boolean>(false);       // ensures only 1 coach reply per send
  const pendingWelcome = useRef<boolean>(false);          // ensures welcome is scheduled only once
  const messageIds = useRef<Set<string>>(new Set());      // dedupe by id
  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const appendMessage = (msg: Message) => {
    if (messageIds.current.has(msg.id)) return; // dedupe
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

  // Initialize everything once on mount
  useEffect(() => {
    if (initialized) return;

    // Load stored topic
    const storedTopic = typeof window !== 'undefined' ? localStorage.getItem('selectedTopic') : null;
    if (storedTopic) {
      try {
        const topic = JSON.parse(storedTopic);
        setSelectedTopic(topic);
      } catch {
        // ignore corrupt topic
      }
    }

    // Check if we're restoring a previous chat
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

    // Start new chat (coach opens)
    setHasStarted(true);
    setIsTyping(true);
    setInitialized(true);

    if (!pendingWelcome.current) {
      pendingWelcome.current = true;
      welcomeTimeout.current = setTimeout(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedTopic') : null;
        let welcomeText =
          "Hey! I'm your personal mental performance coach. I'm here to help you build a custom cheat code for whatever's on your mind. What's going on in your game right now?";

        if (stored) {
          try {
            const topic = JSON.parse(stored);
            welcomeText = `I see you're dealing with: "${topic.title}". This is really common, and we can definitely work through this together. Let's start by understanding what's happening in those moments. Can you walk me through what it feels like when this happens?`;
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
        setIsTyping(false);
      }, 900);
    }

    return () => {
      if (replyTimeout.current) clearTimeout(replyTimeout.current);
      if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current);
    };
  }, [initialized]);

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    if (pendingCoachReply.current) return; // prevent double-send while a reply is pending

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

    // Focus textarea after send (nice UX)
    if (inputRef.current) inputRef.current.focus();

    try {
      // IMPORTANT: your server route currently expects { section, message }
      const section = inferSectionFromTopic(selectedTopic);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, message: trimmed }),
      });

      if (!res.ok) {
        // surface 401/400 clearly in the UI
        const errText = res.status === 401
          ? 'You need to sign in before chatting.'
          : res.status === 400
          ? 'Missing or invalid chat data. Please try again.'
          : `Coach error (${res.status}).`;
        throw new Error(errText);
      }

      const data = await res.json();

      appendMessage({
        id: uid(),
        text: data.reply || "Hmm, I couldn’t generate a reply. Try again?",
        sender: 'coach',
        timestamp: new Date(),
      });
    } catch (err: any) {
      appendMessage({
        id: uid(),
        text: `⚠️ ${err?.message ?? 'Oops, something went wrong reaching the coach. Please try again.'}`,
        sender: 'coach',
        timestamp: new Date(),
      });
    } finally {
      setIsTyping(false);
      pendingCoachReply.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Mobile Design */}
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

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'user' ? (
                <div className="max-w-[75%] p-3 rounded-3xl border bg-zinc-800 text-white rounded-br-lg border-zinc-700">
                  <div className="text-[15px] leading-relaxed">{message.text}</div>
                  <div className="text-xs mt-2 text-zinc-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="w-full p-3">
                  <div className="text-[15px] leading-relaxed text-white">{message.text}</div>
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

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800 bg-black flex-shrink-0">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 pr-12 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500 transition-colors"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || pendingCoachReply.current}
              className={`absolute right-3 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                inputText.trim() && !pendingCoachReply.current
                  ? 'bg-zinc-800 text-white'
                  : 'bg-white text-black'
              }`}
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

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header with Menu Button */}
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

        {/* Sidebar Navigation */}
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

        {/* Overlay when menu is open */}
        {menuOpen && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-5"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col" style={{ paddingTop: selectedTopic ? '200px' : '80px' }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'user' ? (
                    <div className="max-w-[65%] p-5 rounded-3xl border bg-zinc-800 text-white rounded-br-lg border-zinc-700">
                      <div className="text-base leading-relaxed">{message.text}</div>
                      <div className="text-sm mt-3 text-zinc-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full p-5">
                      <div className="text-base leading-relaxed text-white">{message.text}</div>
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

          {/* Input Area */}
          <div className="p-8 border-t border-zinc-800 bg-black">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 pr-14 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500 transition-colors text-base"
                rows={2}
                style={{ minHeight: '60px', maxHeight: '150px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || pendingCoachReply.current}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  inputText.trim() && !pendingCoachReply.current
                    ? 'bg-zinc-800 text-white'
                    : 'bg-white text-black'
                }`}
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