'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TypingAnimation from '../../components/TypingAnimation';
import { createClient } from '@/lib/supabase/client';
import { saveChat, logActivity, type ChatMessage as DBChatMessage } from '@/lib/chat';
import { saveCheatCode, type CheatCodeData } from '@/lib/cheatcodes';
import MomentumProgressToast, { useMomentumProgressToast } from '@/components/MomentumProgressToast';
import MomentumBanner, { useMomentumBanner } from '@/components/MomentumBanner';
import { getUserProgress, awardCodeCreationMomentum, awardMeaningfulChatMomentum } from '@/lib/progress';

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
  isHistoric?: boolean; // Skip typing animation for restored messages
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
  const [userName, setUserName] = useState<string>('');
  const [isFirstCodeChat, setIsFirstCodeChat] = useState(false);
  const [selectedCheatCode, setSelectedCheatCode] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [momentumGain, setMomentumGain] = useState<number>(0);
  const { toastData, showMomentumProgress, dismissToast } = useMomentumProgressToast();
  const { bannerData, showMomentumBanner, dismissBanner } = useMomentumBanner();
  const router = useRouter();
  const supabase = createClient();

  /** duplication guards */
  const pendingCoachReply = useRef<boolean>(false);
  const pendingWelcome = useRef<boolean>(false);
  const messageIds = useRef<Set<string>>(new Set());
  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isRestoringChatRef = useRef<boolean>(false);

  // Get current user and their name
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch user's name from database
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (userData?.full_name) {
            setUserName(userData.full_name);
          }
        } catch (err) {
          console.error('Error fetching user name:', err);
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    };
    getUser();
  }, [supabase, router]);

  // Load saved cheat codes for this chat to prevent duplicates
  useEffect(() => {
    const loadSavedCheatCodes = async () => {
      if (!userId || !currentChatId) return;

      try {
        // Fetch cheat codes that were saved from this chat
        const { data: savedCodes, error } = await supabase
          .from('cheat_codes')
          .select('id, title')
          .eq('user_id', userId)
          .eq('chat_id', currentChatId);

        if (error) {
          console.error('Error loading saved cheat codes:', error);
          return;
        }

        if (savedCodes && savedCodes.length > 0) {
          // For each saved code, find the corresponding message in the chat
          // and mark it as saved
          const savedTitles = new Set(savedCodes.map(code => code.title));

          messages.forEach((message) => {
            if (isCheatCode(message.text)) {
              const { cheatCodeText } = splitCheatCodeMessage(message.text);
              const cheatCode = parseCheatCode(cheatCodeText);

              // If this cheat code's title matches a saved one, mark it as saved
              if (savedTitles.has(cheatCode.title)) {
                setSavedCheatCodes(prev => new Set(prev).add(message.id));
              }
            }
          });
        }
      } catch (err) {
        console.error('Error loading saved cheat codes:', err);
      }
    };

    loadSavedCheatCodes();
  }, [userId, currentChatId, messages, supabase]);

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Scroll to bottom function that can be called anytime
  const scrollToBottom = () => {
    const isMobile = window.innerWidth < 1024;

    if (isMobile && mobileScrollContainerRef.current) {
      const container = mobileScrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    } else if (!isMobile && desktopScrollContainerRef.current) {
      const container = desktopScrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  // Auto-scroll to bottom when messages change (like ChatGPT/Claude)
  useEffect(() => {
    // Don't auto-scroll if we're currently restoring a chat (using ref to avoid dependency)
    if (!isRestoringChatRef.current) {
      // Use requestAnimationFrame for smoother scrolling after render
      requestAnimationFrame(() => {
        setTimeout(() => {
          const isMobile = window.innerWidth < 1024;

          if (isMobile && mobileScrollContainerRef.current) {
            // For mobile: scroll the container div to its full height
            const container = mobileScrollContainerRef.current;
            container.scrollTop = container.scrollHeight;
          } else if (!isMobile && desktopScrollContainerRef.current) {
            // For desktop: scroll the desktop container to its full height
            const container = desktopScrollContainerRef.current;
            container.scrollTop = container.scrollHeight;
          }
        }, 200);
      });
    }
  }, [messages, isTyping]);

  // Additional scroll on mount when restoring chat
  useEffect(() => {
    if (isRestoringChat && messages.length > 0) {

      // Set the ref to prevent auto-scroll from interfering
      isRestoringChatRef.current = true;

      // Multiple attempts to ensure scroll happens on both mobile and desktop
      const scrollToBottom = () => {
        // Check if we're on mobile (window width < 1024px which is the lg breakpoint)
        const isMobile = window.innerWidth < 1024;

        if (isMobile && mobileScrollContainerRef.current) {
          // For mobile, scroll the container div to its full height
          const scrollHeight = mobileScrollContainerRef.current.scrollHeight;
          mobileScrollContainerRef.current.scrollTop = scrollHeight;
        } else if (!isMobile && desktopScrollContainerRef.current) {
          // For desktop, scroll the desktop container to its full height
          const scrollHeight = desktopScrollContainerRef.current.scrollHeight;
          desktopScrollContainerRef.current.scrollTop = scrollHeight;
        }
      };

      // Try multiple times with increasing delays to ensure it works
      requestAnimationFrame(() => {
        scrollToBottom();

        requestAnimationFrame(() => {
          setTimeout(scrollToBottom, 100);

          setTimeout(scrollToBottom, 300);

          setTimeout(scrollToBottom, 500);

          setTimeout(() => {
            scrollToBottom();
            // After final scroll attempt, reset the restoration flags
            // This allows normal auto-scroll to resume for new messages
            setTimeout(() => {
              setIsRestoringChat(false);
              isRestoringChatRef.current = false;
            }, 100);
          }, 1000);
        });
      });
    }
  }, [isRestoringChat, messages.length]);

  // Helper to detect if a message contains a cheat code
  const isCheatCode = (text: string): boolean => {
    // Safety check: ensure text is a string
    if (!text || typeof text !== 'string') {
      return false;
    }

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

    // Helper function to clean asterisks and extra spaces from text
    const cleanText = (str: string): string => {
      return str.replace(/\*+/g, '').trim();
    };

    // Check if it's the alternative format first
    const isAlternativeFormat = text.includes('Title:') && text.includes('Trigger:');

    if (isAlternativeFormat) {
      // Parse alternative format (Title/What/Trigger/Cue phrase/etc.)
      // Handle both with and without asterisks, including inline format
      const titleMatch = text.match(/Title:\s*([^\n]+?)(?=\s*(?:What:|Trigger:|$))/i);
      const whatMatch = text.match(/What:\s*([^\n]+?)(?=\s*(?:Trigger:|$))/i);
      const triggerMatch = text.match(/Trigger:\s*([^\n]+?)(?=\s*(?:Cue phrase:|$))/i);
      const cueMatch = text.match(/Cue phrase:\s*"?([^"\n]+?)"?\s*(?=\s*(?:First action:|$))/i);
      const firstActionMatch = text.match(/First action:\s*([^\n]+?)(?=\s*(?:If\/Then:|$))/i);
      const ifThenMatch = text.match(/If\/Then:\s*([^\n]+?)(?=\s*(?:Reps:|$))/i);
      const repsMatch = text.match(/Reps:\s*([^\n]+?)(?=\s*$)/i);

      cheatCode.title = titleMatch ? cleanText(titleMatch[1]) : 'Confidence Boost';
      cheatCode.category = 'In-Game';

      // Use the "What" from the coach's response if provided, otherwise create a generic one
      if (whatMatch) {
        cheatCode.what = cleanText(whatMatch[1]);
      } else {
        // Fallback: Create a benefit-focused "what" based on the title
        const title = titleMatch ? cleanText(titleMatch[1]) : '';
        cheatCode.what = `Regain focus and confidence when ${title.toLowerCase().includes('shot') ? 'shooting' : title.toLowerCase().includes('free throw') ? 'taking free throws' : 'you need it most'}`;
      }

      cheatCode.when = triggerMatch ? cleanText(triggerMatch[1]) : '';
      cheatCode.phrase = cueMatch ? cleanText(cueMatch[1]) : '';

      // Build the "How" section from First action and If/Then
      const firstAction = firstActionMatch ? cleanText(firstActionMatch[1]) : '';
      const ifThen = ifThenMatch ? cleanText(ifThenMatch[1]) : '';
      const reps = repsMatch ? cleanText(repsMatch[1]) : '';

      const howParts = [];
      if (firstAction) howParts.push(`${firstAction}`);
      if (ifThen) howParts.push(`${ifThen}`);
      if (reps) howParts.push(`${reps}`);

      cheatCode.how = howParts.join('\n');
      cheatCode.why = 'This technique helps you stay focused and maintain confidence under pressure by giving you a clear, repeatable action when you need it most';
      cheatCode.practice = ''; // Already included in how
    } else {
      // Parse standard format
      // Extract title (look for emoji and title)
      const titleMatch = text.match(/\*\*🏀\s+([^*]+)\*\*/);
      cheatCode.title = titleMatch ? cleanText(titleMatch[1]) : 'Cheat Code';

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

      cheatCode.what = whatMatch ? cleanText(whatMatch[1]) : '';
      cheatCode.when = whenMatch ? cleanText(whenMatch[1]) : '';
      cheatCode.how = howMatch ? cleanText(howMatch[1]) : '';
      cheatCode.why = whyMatch ? cleanText(whyMatch[1]) : '';
      cheatCode.phrase = phraseMatch ? cleanText(phraseMatch[1] || phraseMatch[2]) : '';
      cheatCode.practice = practiceMatch ? cleanText(practiceMatch[1]) : '';
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

    const initializeChat = async () => {
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
                text: data.reply || "Let\\'s keep going. What part of that moment feels hardest?",
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

      // Load stored topic (if any) - ALWAYS check this first
      const storedTopic = typeof window !== 'undefined' ? localStorage.getItem('selectedTopic') : null;
      if (storedTopic) {
        try {
          const topic = JSON.parse(storedTopic);
          setSelectedTopic(topic);
        } catch (error) {
          console.error('Error parsing selectedTopic:', error);
        }
      } else {
      }

      // Try to restore prior chat from localStorage first
      const chatHistory = typeof window !== 'undefined' ? localStorage.getItem('chatHistory') : null;
      if (chatHistory) {
        try {
          const parsed = JSON.parse(chatHistory);
          if (parsed.isRestoringChat && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            const restored: Message[] = parsed.messages.map((m: any) => {
              // Determine sender - support both old format (sender field) and new format (role field)
              let senderValue: Sender = 'coach'; // default to coach

              // Check role field first (new format from database)
              if (m.role === 'user') {
                senderValue = 'user';
              } else if (m.role === 'assistant') {
                senderValue = 'coach';
              }
              // Fall back to sender field (old format or component state)
              else if (m.sender === 'user') {
                senderValue = 'user';
              } else if (m.sender === 'coach') {
                senderValue = 'coach';
              }

              const msg: Message = {
                id: String(m.id ?? uid()),
                text: m.content || m.text || '', // Database uses 'content', fallback to 'text'
                sender: senderValue,
                timestamp: new Date(m.timestamp),
                isHistoric: true, // Mark as historic to skip typing animation
              };
              messageIds.current.add(msg.id);
              return msg;
            });
            setMessages(restored);
            setIsRestoringChat(true);
            setHasStarted(true);
            setInitialized(true);
            pendingWelcome.current = true; // Prevent welcome message from being added

            // Set the chat ID so new messages update the existing chat instead of creating a duplicate
            if (parsed.sessionId) {
              setCurrentChatId(parsed.sessionId);
            }

            // Keep chatHistory in localStorage for page refreshes - DON'T remove it
            // It will be updated whenever new messages are sent
            // Note: Scroll will be handled by the useEffect with isRestoringChat dependency
            return;
          }
        } catch {
          localStorage.removeItem('chatHistory');
        }
      }

      // If no localStorage chat and we have a user, try to load active chat from database
      if (userId) {
        try {
          const { getActiveChat } = await import('@/lib/chat');
          const { chatId, messages: activeMessages, selectedTopic: dbSelectedTopic } = await getActiveChat(userId);

          if (chatId && activeMessages && activeMessages.length > 0) {
            setCurrentChatId(chatId);

            // Restore selected topic if it was saved
            if (dbSelectedTopic) {
              setSelectedTopic(dbSelectedTopic);
            }

            const restored: Message[] = activeMessages.map((m: any) => {
              // Determine sender - check multiple possible fields
              let senderValue: Sender = 'coach'; // default to coach
              if (m.role === 'user' || m.sender === 'user') {
                senderValue = 'user';
              } else if (m.role === 'assistant' || m.sender === 'coach') {
                senderValue = 'coach';
              }

              return {
                id: uid(),
                text: m.content || m.text || '',
                sender: senderValue,
                timestamp: new Date(m.timestamp),
                isHistoric: true,
              };
            });

            restored.forEach(msg => messageIds.current.add(msg.id));
            setMessages(restored);
            setIsRestoringChat(true);
            setHasStarted(true);
            setInitialized(true);
            pendingWelcome.current = true;

            // Note: Scroll will be handled by the useEffect with isRestoringChat dependency
            return;
          }
        } catch (err) {
          console.error('Error loading active chat:', err);
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
        const greeting = userName ? `What's up ${userName}!` : "What's up!";
        let welcomeText = `${greeting} I'm your confidence coach. What do you want to talk about?`;

        if (stored) {
          try {
            const topic = JSON.parse(stored);

            // Check if this is their first code from onboarding
            if (topic.isFirstCode) {
              setIsFirstCodeChat(true);

              // Create indirect topic reference and simple question
              const topicStarters: Record<string, string> = {
                'pre_game_nerves': `${greeting} Let's dive into this and build your first cheat code. Before a big game, what's usually running through your head?`,
                'missed_shots': `${greeting} Let's dive into this and build your first cheat code. When you miss a shot, what happens next? What do you usually do or think?`,
                'pressure_moments': `${greeting} Let's dive into this and build your first cheat code. Think about the last pressure moment you had - what was going through your mind right before it?`,
                'comparing_teammates': `${greeting} Let's dive into this and build your first cheat code. When you're around your teammates, what triggers that comparison feeling?`,
                'coach_criticism': `${greeting} Let's dive into this and build your first cheat code. When your coach gives you feedback, how do you usually react in the moment?`,
                'negative_self_talk': `${greeting} Let's dive into this and build your first cheat code. What's the most common negative thing you say to yourself during a game?`,
                'inconsistent_performance': `${greeting} Let's dive into this and build your first cheat code. On your good days, what feels different compared to your off days?`,
                'playing_up_competition': `${greeting} Let's dive into this and build your first cheat code. When you're facing someone better, what's the first thing you notice about yourself?`
              };

              welcomeText = topicStarters[topic.id as string] || `${greeting} Let's dive into this and build your first cheat code. What's been on your mind about your game lately?`;
            } else if (topic.customStarter) {
              welcomeText = topic.customStarter;
            } else {
              const topicMessages = [
                `I see you're focused on something specific. Walk me through what happened the last time this came up.`,
                `Tell me about a recent time when this was an issue for you.`,
                `What does this usually look like when it happens?`,
                `When did you last deal with this situation?`
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
    };

    initializeChat();

    return () => {
      if (replyTimeout.current) clearTimeout(replyTimeout.current);
      if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current);
    };
  }, [initialized, userId]);

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

    const { chatId, error } = await saveChat(userId, dbMessages, currentChatId || undefined, selectedTopic);

    // Silently handle errors - don't show to user
    if (error) {
      console.error('Error saving chat (non-critical):', error);
      return;
    }

    if (chatId && !currentChatId) {
      setCurrentChatId(chatId);
    }

    // Also update localStorage chatHistory so page refreshes restore the latest messages
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatHistory', JSON.stringify({
        isRestoringChat: true,
        messages: dbMessages,
        sessionId: chatId || currentChatId
      }));
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

      // Double-check if this cheat code already exists for this user
      const { data: existingCodes, error: checkError } = await supabase
        .from('cheat_codes')
        .select('id')
        .eq('user_id', userId)
        .eq('title', cheatCodeData.title)
        .limit(1);

      if (checkError) {
        console.error('Error checking for duplicate cheat codes:', checkError);
      } else if (existingCodes && existingCodes.length > 0) {
        // Cheat code already exists
        setSavedCheatCodes(prev => new Set(prev).add(messageId));
        alert('This cheat code has already been saved to My Codes');
        setSavingCheatCode(null);
        return;
      }

      const { cheatCodeId, error } = await saveCheatCode(userId, cheatCodeData, currentChatId || undefined);

      if (error || !cheatCodeId) {
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

        // Award momentum using new system
        const gainAmount = await awardCodeCreationMomentum(userId, cheatCodeId);

        // Store momentum gain for display in success animation
        setMomentumGain(gainAmount);

        if (gainAmount > 0) {
          // Get updated progress to show
          const updatedProgress = await getUserProgress(userId);
          showMomentumProgress({
            previousMomentum: updatedProgress.progress - gainAmount,
            newMomentum: updatedProgress.progress,
            source: 'cheat_code_received',
            chatCount: updatedProgress.chatCount
          });
        }

        // Show success animation
        setShowSaveSuccess(true);

        // Hide success animation after 2 seconds (no redirect)
        setTimeout(() => {
          setShowSaveSuccess(false);
          setMomentumGain(0); // Reset momentum gain
        }, 2000);
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
        text: data.reply || "Let\\'s keep going. What part of that moment feels hardest?",
        sender: 'coach',
        timestamp: new Date(),
      };
      appendMessage(coachMsg);

      // Check if the coach just gave a cheat code - if so, celebrate!
      if (isCheatCode(coachMsg.text)) {
        // Get current progress to show in celebration
        if (userId) {
          try {
            const currentProgress = await getUserProgress(userId);
            // Show celebration for receiving a cheat code
            setTimeout(() => {
              showMomentumProgress({
                previousMomentum: currentProgress.progress,
                newMomentum: currentProgress.progress, // Same value, just celebrating the cheat code
                source: 'cheat_code_received',
                chatCount: currentProgress.chatCount
              });
            }, 1000); // Small delay so the message appears first
          } catch (err) {
            console.error('Error getting progress for cheat code celebration:', err);
          }
        }
      }

      // Save chat to database after receiving response (non-blocking)
      const updatedMessages = [...messages, userMsg, coachMsg];
      saveChatToDb(updatedMessages).catch(err => {
        console.error('Error saving chat:', err);
      });

      // Log activity for progress tracking (non-blocking)
      if (userId) {
        logActivity(userId, 'chat', {
          message_count: updatedMessages.length,
          chat_id: currentChatId,
        }).catch(err => {
          console.error('Error logging activity:', err);
        });

        // Check if chat qualifies for meaningful chat momentum (non-blocking)
        // Only check if we have a current chat ID
        if (currentChatId) {
          awardMeaningfulChatMomentum(userId, currentChatId)
            .then(async (momentumGained) => {
              if (momentumGained > 0) {
                // Show momentum notification
                const updatedProgress = await getUserProgress(userId);
                showMomentumProgress({
                  previousMomentum: updatedProgress.progress - momentumGained,
                  newMomentum: updatedProgress.progress,
                  source: 'chat',
                  chatCount: updatedProgress.chatCount
                });
              }
            })
            .catch(err => {
              console.error('Error awarding meaningful chat momentum:', err);
            });
        }
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

  // Parse cheat code summary into card data (same as my-codes page)
  const parseCheatCodeForCards = (cheatCode: any) => {
    const { what, when, how, why, phrase, title, category } = cheatCode;

    // Split "How" into steps
    const howSteps = how ? how.split('\n').filter((s: string) => s.trim().length > 0).slice(0, 3) : [];

    return { what, when, howSteps, why, phrase, title, category };
  };

  // Build cards array for swipeable interface
  const buildCheatCodeCards = (cheatCode: any) => {
    const { what, when, howSteps, why, phrase, title, category } = parseCheatCodeForCards(cheatCode);

    return [
      { type: 'title', title, category },
      { type: 'section', heading: 'What', content: what },
      { type: 'section', heading: 'When', content: when },
      ...howSteps.map((step: string, index: number) => ({
        type: 'step',
        heading: 'How',
        stepNumber: index + 1,
        totalSteps: howSteps.length,
        content: step.replace(/^[•\-]\s*/, '') // Remove bullet points
      })),
      { type: 'section', heading: 'Why', content: why },
      { type: 'phrase', heading: 'Your Cheat Code Phrase', content: phrase }
    ];
  };

  // Card navigation
  const nextCard = () => {
    if (!selectedCheatCode) return;
    const cards = buildCheatCodeCards(selectedCheatCode);
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

  const handleCloseCheatCodeModal = () => {
    setSelectedCheatCode(null);
    resetCards();
  };

  return (
    <div className="fixed inset-0 font-sans overflow-hidden" style={{ color: 'var(--text-primary)' }}>
      {/* Mobile */}
      <div className="lg:hidden h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--card-border)', backgroundColor: '#000000' }}>
          <div className="flex items-center justify-between">
            {!isFirstCodeChat ? (
              <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform active:scale-90" style={{ color: 'var(--accent-color)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </button>
            ) : (
              <div className="w-8 h-8"></div>
            )}
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
        <div ref={mobileScrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 pb-8">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  {message.sender === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="px-4 py-2.5 rounded-2xl rounded-br-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>
                          <div className="text-[15px] leading-[1.5]">{message.text}</div>
                        </div>
                        <div className="text-[11px] mt-1.5 px-1 text-right" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isCheatCode(message.text) ? (
                        // Cheat code with View button - full width layout
                        (() => {
                          const { intro, cheatCodeText } = splitCheatCodeMessage(message.text);
                          const cheatCode = parseCheatCode(cheatCodeText);
                          return (
                            <div className="w-full">
                              {/* Coach introduction text */}
                              {intro && (
                                <div className="flex justify-start mb-4">
                                  <div className="max-w-[85%]">
                                    <div className="text-[15px] leading-[1.6] whitespace-pre-wrap" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                      {intro}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* View Cheat Code Button - Full Width */}
                              <div className="flex justify-center w-full px-2">
                                <button
                                  onClick={() => setSelectedCheatCode({ ...cheatCode, messageId: message.id, messageText: cheatCodeText })}
                                  className="w-full max-w-md rounded-xl px-6 py-2.5 transition-all active:scale-[0.98] font-semibold text-sm"
                                  style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                >
                                  View Cheat Code
                                </button>
                              </div>

                              {/* Timestamp */}
                              <div className="text-[11px] mt-1.5 px-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex justify-start">
                          <div className="max-w-[85%]">
                            {message.isHistoric ? (
                              // Historic messages: no typing animation
                              <div className="text-[15px] leading-[1.6] whitespace-pre-wrap" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {message.text}
                              </div>
                            ) : (
                              // New messages: show typing animation
                              <TypingAnimation
                                key={message.id}
                                text={message.text}
                                speed={40}
                                onTextChange={scrollToBottom}
                                className="text-[15px] leading-[1.6] whitespace-pre-wrap"
                                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                              />
                            )}
                            <div className="text-[11px] mt-1.5 px-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', animationDuration: '1s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', animationDelay: '0.15s', animationDuration: '1s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', animationDelay: '0.3s', animationDuration: '1s' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0 lg:hidden" style={{ borderColor: 'var(--card-border)', backgroundColor: '#000000' }}>
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
      <div className="hidden lg:flex lg:flex-col lg:h-screen">
        {/* Header */}
        <div className="px-6 py-5 flex-shrink-0" style={{ backgroundColor: '#000000' }}>
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              {!isFirstCodeChat && (
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
              )}
              {!isFirstCodeChat && (
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
              )}
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

              <Link href="/relatable-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>Relatable Topics</span>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={desktopScrollContainerRef} className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
            <div className="px-8 py-6 pb-8">
              <div className="space-y-8">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    {message.sender === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[70%]">
                          <div className="px-5 py-3 rounded-2xl rounded-br-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>
                            <div className="text-[15px] leading-[1.5]">{message.text}</div>
                          </div>
                          <div className="text-[11px] mt-1.5 px-1 text-right" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {isCheatCode(message.text) ? (
                          // Cheat code with View button - full width layout
                          (() => {
                            const { intro, cheatCodeText} = splitCheatCodeMessage(message.text);
                            const cheatCode = parseCheatCode(cheatCodeText);
                            return (
                              <div className="w-full">
                                {/* Coach introduction text */}
                                {intro && (
                                  <div className="flex justify-start mb-4">
                                    <div className="max-w-[80%]">
                                      <div className="text-[15px] leading-[1.6] whitespace-pre-wrap" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                        {intro}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* View Cheat Code Button - Full Width */}
                                <div className="w-full">
                                  <button
                                    onClick={() => setSelectedCheatCode({ ...cheatCode, messageId: message.id, messageText: cheatCodeText })}
                                    className="w-full rounded-xl px-8 py-2.5 transition-all hover:scale-[1.01] font-semibold text-sm"
                                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                  >
                                    View Cheat Code
                                  </button>
                                </div>

                                {/* Timestamp */}
                                <div className="text-[11px] mt-1.5 px-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex justify-start">
                            <div className="max-w-[80%]">
                              {message.isHistoric ? (
                                // Historic messages: no typing animation
                                <div className="text-[15px] leading-[1.6] whitespace-pre-wrap" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                  {message.text}
                                </div>
                              ) : (
                                // New messages: show typing animation
                                <TypingAnimation
                                  key={message.id}
                                  text={message.text}
                                  speed={40}
                                  onTextChange={scrollToBottom}
                                  className="text-[15px] leading-[1.6] whitespace-pre-wrap"
                                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                />
                              )}
                              <div className="text-[11px] mt-1.5 px-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', animationDuration: '1s' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', animationDelay: '0.15s', animationDuration: '1s' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', animationDelay: '0.3s', animationDuration: '1s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-8 border-t flex-shrink-0 hidden lg:block" style={{ borderColor: 'var(--card-border)', backgroundColor: '#000000' }}>
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

      {/* Cheat Code Modal with Swipeable Cards */}
      {selectedCheatCode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={handleCloseCheatCodeModal}
            className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 lg:p-3 transition-colors z-[120] rounded-full border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Card Container */}
          <div className="w-full max-w-lg">
            {/* Card with Navigation Inside */}
            <div className="rounded-2xl p-6 lg:p-10 min-h-[400px] lg:min-h-[500px] flex relative border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              {/* Left Arrow - Centered */}
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className={`absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  currentCard === 0
                    ? 'cursor-not-allowed opacity-30'
                    : 'active:scale-95'
                }`}
                style={{ color: currentCard === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* Right Arrow - Centered */}
              <button
                onClick={nextCard}
                disabled={currentCard === buildCheatCodeCards(selectedCheatCode).length - 1}
                className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  currentCard === buildCheatCodeCards(selectedCheatCode).length - 1
                    ? 'cursor-not-allowed opacity-30'
                    : 'active:scale-95'
                }`}
                style={{ color: currentCard === buildCheatCodeCards(selectedCheatCode).length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Card Content */}
              <div className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-4 lg:py-6 pb-3 lg:pb-4">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  {(() => {
                    const cards = buildCheatCodeCards(selectedCheatCode);
                    const card = cards[currentCard];

                    return (
                      <>
                        {/* Title Card */}
                        {card.type === 'title' && (
                          <div className="space-y-6 lg:space-y-8">
                            <h1 className="text-3xl lg:text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                              {(card as any).title}
                            </h1>
                            <div className="h-px w-16 lg:w-20 mx-auto" style={{ backgroundColor: 'var(--card-border)' }}></div>
                            <div className="text-xs lg:text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                              {(card as any).category}
                            </div>
                          </div>
                        )}

                        {/* Section Cards (When) */}
                        {card.type === 'section' && (card as any).heading !== 'Why' && (
                          <div className="space-y-6 lg:space-y-8 max-w-md">
                            <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                              {(card as any).heading}
                            </div>
                            <p className="text-xl lg:text-2xl font-medium leading-[1.4]" style={{ color: 'var(--text-primary)' }}>
                              {(card as any).content}
                            </p>
                          </div>
                        )}

                        {/* Why Card */}
                        {card.type === 'section' && (card as any).heading === 'Why' && (
                          <div className="space-y-6 lg:space-y-8 max-w-lg">
                            <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                              {(card as any).heading}
                            </div>
                            <div className="space-y-4 lg:space-y-6">
                              {(card as any).content.split('\n\n').map((paragraph: string, i: number) => (
                                <p key={i} className="text-base lg:text-lg font-medium leading-[1.6]" style={{ color: 'var(--text-primary)' }}>
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step Cards */}
                        {card.type === 'step' && 'stepNumber' in card && (
                          <div className="space-y-6 lg:space-y-8 max-w-lg">
                            <div className="space-y-2 lg:space-y-3">
                              <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                                {(card as any).heading}
                              </div>
                              <div className="text-xs lg:text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                                Step {(card as any).stepNumber} of {(card as any).totalSteps}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 lg:gap-6">
                              <div className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                                <span className="font-bold text-lg lg:text-xl" style={{ color: 'var(--text-primary)' }}>{(card as any).stepNumber}</span>
                              </div>
                              <p className="text-lg lg:text-xl font-medium leading-[1.5] text-left flex-1" style={{ color: 'var(--text-primary)' }}>
                                {(card as any).content}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Phrase Card (Final) */}
                        {card.type === 'phrase' && (
                          <div className="space-y-8 lg:space-y-10 w-full max-w-md">
                            <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                              Your Cheat Code Phrase
                            </div>
                            <div className="space-y-6 lg:space-y-8">
                              <p className="text-2xl lg:text-4xl font-bold leading-[1.2]" style={{ color: 'var(--text-primary)' }}>
                                "{(card as any).content}"
                              </p>
                              <button
                                onClick={async () => {
                                  await handleSaveCheatCode(selectedCheatCode.messageId, selectedCheatCode.messageText);
                                }}
                                disabled={savedCheatCodes.has(selectedCheatCode.messageId) || savingCheatCode === selectedCheatCode.messageId}
                                className="w-full py-4 lg:py-5 rounded-xl font-semibold text-base lg:text-lg transition-all active:scale-95"
                                style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                              >
                                {savedCheatCodes.has(selectedCheatCode.messageId)
                                  ? '✓ Saved to My Codes'
                                  : savingCheatCode === selectedCheatCode.messageId
                                    ? 'Saving...'
                                    : 'Add to My Codes'}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Footer with Branding */}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="text-[9px] lg:text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    MYCHEATCODE.AI
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {buildCheatCodeCards(selectedCheatCode).map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: index === currentCard ? '2rem' : '0.375rem',
                    backgroundColor: index === currentCard ? '#ffffff' : '#2a2a2a'
                  }}
                />
              ))}
            </div>

            {/* Success Animation Overlay */}
            {showSaveSuccess && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center backdrop-blur-sm"
                style={{ animation: 'fade-out 0.4s ease-out 1.6s forwards', backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              >
                <div className="flex flex-col items-center gap-4" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                    <polyline points="20 6 9 17 4 12" strokeDasharray="100" strokeDashoffset="0"
                      style={{ animation: 'checkmark-draw 0.6s ease-out 0.1s backwards' }} />
                  </svg>
                  <div className="text-center" style={{ animation: 'fade-in-scale 0.4s ease-out 0.2s backwards' }}>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>Saved to My Codes!</h3>
                    {momentumGain > 0 && (
                      <p className="text-lg font-semibold mt-2" style={{ color: '#00ff41' }}>
                        +{momentumGain.toFixed(momentumGain >= 10 ? 0 : 1)}% Momentum
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Momentum Progress Toast - For major milestones only */}
      {toastData && (
        <MomentumProgressToast
          data={toastData}
          onDismiss={dismissToast}
        />
      )}

      {/* Momentum Banner - For regular progress */}
      {bannerData && (
        <MomentumBanner
          data={bannerData}
          onDismiss={dismissBanner}
        />
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        /* Prevent overscroll/rubber band effect on mobile */
        html, body {
          overscroll-behavior: none;
        }

        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
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

        @keyframes checkmark-draw {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}