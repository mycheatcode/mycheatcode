'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TypingAnimation from '../../components/TypingAnimation';
import { createClient } from '@/lib/supabase/client';
import { saveChat, logActivity, type ChatMessage as DBChatMessage } from '@/lib/chat';
import { saveCheatCode, type CheatCodeData } from '@/lib/cheatcodes';

// Force dark mode immediately
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [savedCheatCodes, setSavedCheatCodes] = useState<Set<string>>(new Set());
  const [savingCheatCode, setSavingCheatCode] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  /** duplication guards */
  const pendingCoachReply = useRef<boolean>(false);
  const pendingWelcome = useRef<boolean>(false);
  const messageIds = useRef<Set<string>>(new Set());
  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    };
    getUser();
  }, [supabase, router]);

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
      cheatCode.what = titleMatch ? titleMatch[1].trim() : '';
      cheatCode.when = triggerMatch ? triggerMatch[1].trim() : '';
      cheatCode.phrase = cueMatch ? cueMatch[1].trim() : '';

      // Build the "How" section from First action and If/Then
      const firstAction = firstActionMatch ? firstActionMatch[1].trim() : '';
      const ifThen = ifThenMatch ? ifThenMatch[1].trim() : '';
      const reps = repsMatch ? repsMatch[1].trim() : '';

      const howParts = [];
      if (firstAction) howParts.push(`• ${firstAction}`);
      if (ifThen) howParts.push(`• ${ifThen}`);
      if (reps) howParts.push(`• ${reps}`);

      cheatCode.how = howParts.join('\n');
      cheatCode.why = 'This technique helps you stay focused and calm under pressure';
      cheatCode.practice = ''; // Already included in how
    } else {
      // Parse standard format
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
    }

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

    // Check for auto-send message from homepage
    const autoSendMessage = typeof window !== 'undefined' ? localStorage.getItem('autoSendMessage') : null;
    if (autoSendMessage) {
      localStorage.removeItem('autoSendMessage');
      setHasStarted(true);
      setInitialized(true);
      setInputText('');

      // Skip the welcome message by setting pendingWelcome
      pendingWelcome.current = true;

      // Add user message first
      const userMsg: Message = {
        id: uid(),
        text: autoSendMessage,
        sender: 'user',
        timestamp: new Date(),
      };
      appendMessage(userMsg);
      setIsTyping(true);
      pendingCoachReply.current = true;

      // Send to API after a brief delay
      setTimeout(() => {
        const payload = buildChatPayload([userMsg]);
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(res => res.json())
          .then(data => {
            appendMessage({
              id: uid(),
              text: data.reply || "Let's keep going. What part of that moment feels hardest?",
              sender: 'coach',
              timestamp: new Date(),
            });
          })
          .catch(() => {
            appendMessage({
              id: uid(),
              text: '⚠️ Could not reach the coach. Try again.',
              sender: 'coach',
              timestamp: new Date(),
            });
          })
          .finally(() => {
            setIsTyping(false);
            pendingCoachReply.current = false;
          });
      }, 100);
      return; // Skip the rest of initialization
    }

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
      let welcomeText = "What's up! I'm your confidence coach. What do you want to talk about?";

      if (stored) {
        try {
          const topic = JSON.parse(stored);

          // Check if this is their first code from onboarding
          if (topic.isFirstCode) {
            welcomeText = `Hey! Let's create your first cheat code together. You picked "${topic.title}" - tell me about a recent time when this came up for you. What happened?`;
          } else if (topic.customStarter) {
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

    // Meta: primary issue + number of turns + first code flag
    const primaryIssue = typeof window !== 'undefined' ? localStorage.getItem('primary_issue') : null;
    const isFirstCode = (selectedTopic as any)?.isFirstCode || false;

    return {
      messages: history,
      meta: {
        primaryIssue: primaryIssue || undefined,
        turns: history.length,
        isFirstCode: isFirstCode,
      },
      userId: userId, // Include user ID for personalization
    };
  };

  /** Save current chat to database */
  const saveChatToDb = async (msgs: Message[]) => {
    if (!userId) return;

    const dbMessages: DBChatMessage[] = msgs.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      timestamp: m.timestamp.toISOString(),
    }));

    const { chatId } = await saveChat(userId, dbMessages, currentChatId || undefined);
    if (chatId && !currentChatId) {
      setCurrentChatId(chatId);
    }
  };

  /** Handle saving a cheat code to My Codes */
  const handleSaveCheatCode = async (messageId: string, cheatCodeText: string) => {
    if (!userId) {
      alert('You must be logged in to save cheat codes');
      return;
    }

    if (savedCheatCodes.has(messageId)) {
      return; // Already saved
    }

    setSavingCheatCode(messageId);

    try {
      const cheatCode = parseCheatCode(cheatCodeText);

      const cheatCodeData: CheatCodeData = {
        title: cheatCode.title || 'Untitled Cheat Code',
        category: cheatCode.category || 'In-Game',
        what: cheatCode.what,
        when: cheatCode.when,
        how: cheatCode.how,
        why: cheatCode.why,
        phrase: cheatCode.phrase,
        practice: cheatCode.practice,
      };

      const { cheatCodeId, error } = await saveCheatCode(userId, cheatCodeData, currentChatId || undefined);

      if (error) {
        alert('Failed to save cheat code. Please try again.');
        console.error('Error saving cheat code:', error);
      } else {
        // Mark as saved
        setSavedCheatCodes(prev => new Set(prev).add(messageId));

        // Log activity
        await logActivity(userId, 'cheat_code_saved', {
          cheat_code_id: cheatCodeId,
          chat_id: currentChatId,
        });
      }
    } catch (err) {
      console.error('Unexpected error saving cheat code:', err);
      alert('An unexpected error occurred');
    } finally {
      setSavingCheatCode(null);
    }
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
      const coachMsg: Message = {
        id: uid(),
        text: data.reply || 'Let's keep going. What part of that moment feels hardest?',
        sender: 'coach',
        timestamp: new Date(),
      };
      appendMessage(coachMsg);

      // Save chat to database after receiving response
      const updatedMessages = [...messages, userMsg, coachMsg];
      await saveChatToDb(updatedMessages);

      // Log activity for progress tracking
      if (userId) {
        await logActivity(userId, 'chat', {
          message_count: updatedMessages.length,
          chat_id: currentChatId,
        });
      }
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
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Mobile */}
      <div className="lg:hidden min-h-screen relative flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform active:scale-90" style={{ color: 'var(--accent-color)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Live Chat</div>
            <div className="w-8 h-8"></div>
          </div>

          {/* Topic Indicator */}
          {selectedTopic && (
            <div className="mt-3 px-4 py-3 border rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff41' }}></div>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Session Focus</div>
              </div>
              <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
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
                <div className="max-w-[75%] p-3 rounded-3xl border rounded-br-lg" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}>
                  <div className="text-[15px] leading-relaxed">{message.text}</div>
                  <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
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
                              <div className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--text-primary)' }}>
                                {intro}
                              </div>
                            )}

                            {/* Cheat code box - Matching My Codes page design */}
                            <div className="border rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Cheat Code</span>
                              </div>
                              <div className="space-y-2">
                                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{cheatCode.title}</div>
                                <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>{cheatCode.category}</div>
                                <div className="space-y-1.5 text-sm">
                                  {cheatCode.what && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>What:</span> <span style={{ color: 'var(--text-primary)' }}>{cheatCode.what}</span></div>}
                                  {cheatCode.when && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>When:</span> <span style={{ color: 'var(--text-primary)' }}>{cheatCode.when}</span></div>}
                                  {cheatCode.how && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>How:</span> <span className="whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>{cheatCode.how}</span></div>}
                                  {cheatCode.why && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Why:</span> <span style={{ color: 'var(--text-primary)' }}>{cheatCode.why}</span></div>}
                                  {cheatCode.phrase && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Cheat Code Phrase:</span> <span style={{ color: 'var(--text-primary)' }}>"{cheatCode.phrase}"</span></div>}
                                  {cheatCode.practice && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Practice:</span> <span style={{ color: 'var(--text-primary)' }}>{cheatCode.practice}</span></div>}
                                </div>

                                {/* Power Bar - Clean monochrome style */}
                                <div className="mt-4 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--text-secondary)' }} className="text-sm uppercase tracking-wide">Cheat Code Power</span>
                                    <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">75%</span>
                                  </div>
                                  <div className="w-full h-5 rounded-full overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)' }}>
                                    <div
                                      className="h-full rounded-full transition-all duration-300 ease-out"
                                      style={{
                                        backgroundColor: '#00ff41',
                                        width: '75%'
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Log a usage to activate this code and build its strength</p>
                                </div>

                                {/* Add to My Codes Button */}
                                <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                                  <button
                                    onClick={() => handleSaveCheatCode(message.id, cheatCodeText)}
                                    disabled={savingCheatCode === message.id || savedCheatCodes.has(message.id)}
                                    className="w-full font-medium py-2.5 px-4 rounded-lg transition-colors border disabled:opacity-50"
                                    style={{
                                      backgroundColor: savedCheatCodes.has(message.id) ? '#00ff41' : 'var(--card-bg)',
                                      borderColor: savedCheatCodes.has(message.id) ? '#00ff41' : 'var(--card-border)',
                                      color: savedCheatCodes.has(message.id) ? '#000' : 'var(--text-primary)'
                                    }}
                                  >
                                    {savingCheatCode === message.id
                                      ? 'Saving...'
                                      : savedCheatCodes.has(message.id)
                                      ? '✓ Saved to My Codes'
                                      : 'Add to "My Codes"'}
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
                      className="text-[15px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  )}
                  <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
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
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--card-border)' }}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="w-full border rounded-xl p-4 pr-12 resize-none focus:outline-none transition-all duration-200"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)', minHeight: '52px', maxHeight: '120px' }}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || pendingCoachReply.current}
              className="absolute right-3 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
              style={
                inputText.trim()
                  ? { backgroundColor: '#00ff41', color: '#000000', boxShadow: '0 4px 12px rgba(0, 255, 65, 0.3)' }
                  : { borderWidth: '2px', borderColor: '#ffffff', color: '#ffffff', backgroundColor: 'transparent' }
              }
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
        <div className="fixed top-0 left-0 right-0 px-6 py-5 z-20">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--accent-color)' }}
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
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--accent-color)' }}
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </button>
              <div className="text-xl app-label" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
            </div>
            <div className="text-lg font-semibold absolute left-1/2 transform -translate-x-1/2" style={{ color: 'var(--text-primary)' }}>Live Chat</div>
            <div className="w-[180px]"></div>
          </div>

          {/* Topic Indicator */}
          {selectedTopic && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="px-6 py-4 border rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff41' }}></div>
                  <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Session Focus</div>
                </div>
                <div className="text-lg font-bold leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                  "{selectedTopic.title}"
                </div>
                {selectedTopic.description && (
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {selectedTopic.description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div
          className={`fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: '#000000' }}
        >
          <div className="pt-24 px-6">
            <div className="text-xs font-bold tracking-widest mb-6" style={{ color: 'var(--accent-color)' }}>NAVIGATION</div>
          </div>

          <nav className="flex-1 px-4">
            <div className="space-y-1">
              <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>

              <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
              </Link>

              <Link href="/community-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>Community Topics</span>
              </Link>

              <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Chat History</span>
              </Link>

              <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Profile</span>
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
                    <div className="max-w-[65%] p-5 rounded-3xl border rounded-br-lg" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}>
                      <div className="text-base leading-relaxed">{message.text}</div>
                      <div className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>
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
                                  <div className="text-base leading-relaxed whitespace-pre-wrap mb-6" style={{ color: 'var(--text-primary)' }}>
                                    {intro}
                                  </div>
                                )}

                                {/* Cheat code box - Matching My Codes page design */}
                                <div className="border rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Cheat Code</span>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{cheatCode.title}</div>
                                    <div className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{cheatCode.category}</div>
                                    <div className="space-y-3 text-base">
                                      {cheatCode.what && (
                                        <div className="leading-relaxed">
                                          <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>What:</div>
                                          <div style={{ color: 'var(--text-primary)' }}>{cheatCode.what}</div>
                                        </div>
                                      )}
                                      {cheatCode.when && (
                                        <div className="leading-relaxed">
                                          <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>When:</div>
                                          <div style={{ color: 'var(--text-primary)' }}>{cheatCode.when}</div>
                                        </div>
                                      )}
                                      {cheatCode.how && (
                                        <div className="leading-relaxed">
                                          <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>How:</div>
                                          <div className="whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>{cheatCode.how}</div>
                                        </div>
                                      )}
                                      {cheatCode.why && (
                                        <div className="leading-relaxed">
                                          <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Why:</div>
                                          <div style={{ color: 'var(--text-primary)' }}>{cheatCode.why}</div>
                                        </div>
                                      )}
                                      {cheatCode.phrase && (
                                        <div className="leading-relaxed">
                                          <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Cheat Code Phrase:</div>
                                          <div style={{ color: 'var(--text-primary)' }}>"{cheatCode.phrase}"</div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Add to My Codes Button */}
                                    <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                                      <button
                                        onClick={() => handleSaveCheatCode(message.id, cheatCodeText)}
                                        disabled={savingCheatCode === message.id || savedCheatCodes.has(message.id)}
                                        className="w-full font-medium py-3 px-4 rounded-xl transition-colors border disabled:opacity-50"
                                        style={{
                                          backgroundColor: savedCheatCodes.has(message.id) ? '#00ff41' : 'var(--card-bg)',
                                          borderColor: savedCheatCodes.has(message.id) ? '#00ff41' : 'var(--card-border)',
                                          color: savedCheatCodes.has(message.id) ? '#000' : 'var(--text-primary)'
                                        }}
                                      >
                                        {savingCheatCode === message.id
                                          ? 'Saving...'
                                          : savedCheatCodes.has(message.id)
                                          ? '✓ Saved to My Codes'
                                          : 'Add to "My Codes"'}
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
                          className="text-base leading-relaxed whitespace-pre-wrap"
                          style={{ color: 'var(--text-primary)' }}
                        />
                      )}
                      <div className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>
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
                      <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)' }}></div>
                      <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <div className="max-w-4xl mx-auto relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="w-full border rounded-xl p-4 pr-14 resize-none focus:outline-none transition-all duration-200 text-base"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)', minHeight: '60px', maxHeight: '150px' }}
                rows={2}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || pendingCoachReply.current}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                style={
                  inputText.trim()
                    ? { backgroundColor: '#00ff41', color: '#000000', boxShadow: '0 4px 12px rgba(0, 255, 65, 0.3)' }
                    : { borderWidth: '2px', borderColor: '#ffffff', color: '#ffffff', backgroundColor: 'transparent' }
                }
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