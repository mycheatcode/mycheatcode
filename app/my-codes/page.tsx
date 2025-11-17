'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserCheatCodes, toggleFavoriteCheatCode, checkTodayUsage, archiveCheatCodeDb, reactivateCheatCodeDb } from '@/lib/cheatcodes';
import { getUserProgress } from '@/lib/progress';
import ProgressCircles from '@/components/ProgressCircles';
import FeedbackButton from '@/components/FeedbackButton';
import CheatCodeGame from '@/components/CheatCodeGame';
import type { GameSessionResult } from '@/lib/types/game';

// Force dark mode immediately
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}

interface CheatCode {
  id: string;
  title: string;
  category: string;
  timesUsed?: number;
  lastUsedDaysAgo?: number | null;
  isFavorite?: boolean;
  archived?: boolean;
  created_at?: string;
  summary?: string;
  topicId?: string;
  onboardingScenarioId?: string;
}

interface UserProgress {
  progress: number;
  chatCount: number;
  streak?: number;
}

export default function MyCodesRedesignPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cheatCodes, setCheatCodes] = useState<CheatCode[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [todaysFocusCodes, setTodaysFocusCodes] = useState<CheatCode[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedCode, setSelectedCode] = useState<CheatCode | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [animatingCode, setAnimatingCode] = useState<string | null>(null);
  const [animationType, setAnimationType] = useState<'archive' | 'reactivate' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const [usedToday, setUsedToday] = useState(false);
  const [isLoggingUsage, setIsLoggingUsage] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameCheatCodeId, setGameCheatCodeId] = useState<string | null>(null);
  const [gameCheatCodeTitle, setGameCheatCodeTitle] = useState<string>('');
  const [gameOnboardingScenarioId, setGameOnboardingScenarioId] = useState<string | undefined>(undefined);
  const [showMomentumAnimation, setShowMomentumAnimation] = useState(false);
  const [momentumGain, setMomentumGain] = useState(0);
  const [animatedMomentum, setAnimatedMomentum] = useState(0);
  const [pendingGameResult, setPendingGameResult] = useState<GameSessionResult | null>(null);
  const [showCenterAnimation, setShowCenterAnimation] = useState(false);
  const [centerAnimationPhase, setCenterAnimationPhase] = useState<'enter' | 'shrink' | 'move'>('enter');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        setLoading(false);
        return;
      }

      console.log('👤 Loading codes for user:', user.id);
      setUserId(user.id);

      // Load cheat codes
      const { cheatCodes: dbCodes, error: codesError } = await getUserCheatCodes(user.id);
      console.log('📊 getUserCheatCodes response:', { dbCodes, codesError });
      console.log('📊 Raw codes from database:', dbCodes);
      console.log('📊 Number of codes:', dbCodes?.length || 0);

      if (codesError) {
        console.error('❌ Error fetching codes:', codesError);
      }

      if (dbCodes) {
        const transformedCodes: CheatCode[] = dbCodes.map((code: any) => {
          const lastUsed = code.last_used_at ? new Date(code.last_used_at) : new Date(code.created_at);
          const now = new Date();
          const diffMs = now.getTime() - lastUsed.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          return {
            id: code.id,
            title: code.title,
            category: code.category,
            timesUsed: code.times_used || 0,
            lastUsedDaysAgo: code.last_used_at ? diffDays : null,
            isFavorite: code.is_favorite || false,
            archived: code.is_active === false,
            created_at: code.created_at,
            summary: code.content || '',
            topicId: code.chat_id || undefined,
            onboardingScenarioId: code.onboarding_scenario_id || undefined
          };
        });
        console.log('🔄 Transformed codes:', transformedCodes);
        console.log('🔄 Active codes:', transformedCodes.filter(c => !c.archived));
        setCheatCodes(transformedCodes);
      } else {
        console.log('⚠️ No codes returned from getUserCheatCodes');
      }

      // Load user progress
      const progress = await getUserProgress(supabase, user.id);
      setUserProgress(progress);

      setLoading(false);
    };

    loadData();
  }, [supabase]);

  // Load completed today from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;

    const today = new Date().toDateString();
    const storageKey = `todaysFocusCompleted_${userId}`;
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      try {
        const { date, completed } = JSON.parse(storedData);
        if (date === today) {
          setCompletedToday(new Set(completed));
        } else {
          // New day, clear completed
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        // Invalid data, clear it
        localStorage.removeItem(storageKey);
      }
    }
  }, [userId]);

  // Set today's focus (smart selection based on user's codes with daily rotation - now selects 3 codes)
  useEffect(() => {
    if (cheatCodes.length === 0) return;

    const activeCodes = cheatCodes.filter(c => !c.archived);
    if (activeCodes.length === 0) return;

    // Get today's date as a seed for consistent daily selection
    const today = new Date();
    const dailySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Seeded random function for consistent selection within the same day
    const seededRandom = (seed: number, max: number) => {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };

    // Seeded shuffle function for array
    const seededShuffle = (array: CheatCode[], seed: number) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = seededRandom(seed + i, i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const selectedCodes: CheatCode[] = [];

    // Priority 1: Codes that need practice (2+ days old)
    const needsPractice = activeCodes.filter(c => {
      const daysAgo = c.lastUsedDaysAgo ?? 999;
      return daysAgo > 1;
    }).sort((a, b) => (b.lastUsedDaysAgo ?? 0) - (a.lastUsedDaysAgo ?? 0));

    // Priority 2: New codes that haven't been tried yet
    const newCodes = activeCodes.filter(c => (c.timesUsed || 0) === 0).sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    // Priority 3: Least used codes
    const leastUsed = activeCodes.filter(c => (c.lastUsedDaysAgo ?? 999) > 0)
      .sort((a, b) => (a.timesUsed || 0) - (b.timesUsed || 0));

    // Combine all priorities into a pool
    const pool: CheatCode[] = [];
    const addedIds = new Set<string>();

    // Add up to 2 from needsPractice
    for (const code of needsPractice.slice(0, 2)) {
      if (!addedIds.has(code.id)) {
        pool.push(code);
        addedIds.add(code.id);
      }
    }

    // Add up to 1 from newCodes
    for (const code of newCodes.slice(0, 1)) {
      if (!addedIds.has(code.id)) {
        pool.push(code);
        addedIds.add(code.id);
      }
    }

    // Fill remaining slots from leastUsed
    for (const code of leastUsed) {
      if (!addedIds.has(code.id) && pool.length < 6) {
        pool.push(code);
        addedIds.add(code.id);
      }
    }

    // If pool still not big enough, add remaining active codes
    for (const code of activeCodes) {
      if (!addedIds.has(code.id) && pool.length < 6) {
        pool.push(code);
        addedIds.add(code.id);
      }
    }

    // Shuffle the pool and take first 3 (or less if not enough codes)
    const shuffled = seededShuffle(pool, dailySeed);
    const finalSelection = shuffled.slice(0, Math.min(3, shuffled.length));

    setTodaysFocusCodes(finalSelection);
  }, [cheatCodes]);

  // Reorder carousel to put incomplete codes first when completion state changes
  useEffect(() => {
    if (todaysFocusCodes.length === 0) return;

    const reordered = [...todaysFocusCodes].sort((a, b) => {
      const aCompleted = completedToday.has(a.id);
      const bCompleted = completedToday.has(b.id);

      // Incomplete codes come first
      if (!aCompleted && bCompleted) return -1;
      if (aCompleted && !bCompleted) return 1;
      return 0; // Keep original order within completed/incomplete groups
    });

    // Only update if order actually changed
    const orderChanged = reordered.some((code, idx) => code.id !== todaysFocusCodes[idx].id);
    if (orderChanged) {
      setTodaysFocusCodes(reordered);
      // Reset to first card (which will be incomplete if any exist)
      setCurrentFocusIndex(0);
    }
  }, [completedToday]);

  // Handle URL query parameters (?code= and ?practice=)
  useEffect(() => {
    const codeId = searchParams.get('code');
    const practiceId = searchParams.get('practice');

    if (codeId && cheatCodes.length > 0) {
      const code = cheatCodes.find(c => c.id === codeId);
      if (code) {
        setSelectedCode(code);
        // Clear the URL parameter
        router.replace('/my-codes', { scroll: false });
      }
    } else if (practiceId && cheatCodes.length > 0) {
      const code = cheatCodes.find(c => c.id === practiceId);
      if (code) {
        setGameCheatCodeId(code.id);
        setGameCheatCodeTitle(code.title);
        setGameOnboardingScenarioId(code.onboardingScenarioId);
        setShowGameModal(true);
        // Clear the URL parameter
        router.replace('/my-codes', { scroll: false });
      }
    }
  }, [searchParams, cheatCodes, router]);

  // Trigger momentum animation when modal closes with a pending result
  useEffect(() => {
    // Only trigger animation when modal is closed AND we have a pending result with momentum
    if (!showGameModal && pendingGameResult && pendingGameResult.momentum_awarded > 0) {
      // Delay to ensure modal close animation completes and user sees My Codes page
      const timer = setTimeout(() => {
        console.log('✅ Modal closed, starting momentum animation!', {
          gain: pendingGameResult.momentum_awarded,
          from: pendingGameResult.previous_momentum,
          to: pendingGameResult.new_momentum
        });

        setMomentumGain(pendingGameResult.momentum_awarded);
        setAnimatedMomentum(pendingGameResult.previous_momentum);

        // Start with center animation
        setShowCenterAnimation(true);
        setCenterAnimationPhase('enter');

        // Phase 1: Show center animation longer for reading (1.5 seconds)
        setTimeout(() => {
          setCenterAnimationPhase('shrink');
        }, 1500);

        // Phase 2: Shrink and start moving (0.6 seconds)
        setTimeout(() => {
          setCenterAnimationPhase('move');
          setShowMomentumAnimation(true);
        }, 2100);

        // Phase 3: Hide center animation and start counting up
        setTimeout(() => {
          setShowCenterAnimation(false);

          // Animate momentum counting up
          const duration = 1200;
          const steps = 24;
          const increment = pendingGameResult.momentum_awarded / steps;
          let currentStep = 0;

          const interval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
              const newMomentum = pendingGameResult.previous_momentum + (increment * currentStep);
              setAnimatedMomentum(newMomentum);
            } else {
              setAnimatedMomentum(pendingGameResult.new_momentum);
              clearInterval(interval);

              // End animation after showing final value
              setTimeout(() => {
                setShowMomentumAnimation(false);
                setMomentumGain(0);
              }, 1500);
            }
          }, duration / steps);
        }, 1700);

        // Clear pending result
        setPendingGameResult(null);
      }, 500); // Longer delay to ensure modal is fully closed

      return () => clearTimeout(timer);
    }
  }, [showGameModal, pendingGameResult]);

  // Check if selected code was used today
  useEffect(() => {
    const checkUsage = async () => {
      if (!selectedCode) {
        setUsedToday(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { usedToday: wasUsedToday } = await checkTodayUsage(user.id, selectedCode.id);
      setUsedToday(wasUsedToday);
    };

    checkUsage();
  }, [selectedCode, supabase]);

  // Toggle favorite
  const toggleFavorite = async (codeId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = cheatCodes.find(c => c.id === codeId);
    if (!code) return;

    const newFavoriteStatus = !code.isFavorite;
    await toggleFavoriteCheatCode(user.id, codeId, newFavoriteStatus);

    setCheatCodes(codes => codes.map(c =>
      c.id === codeId ? { ...c, isFavorite: newFavoriteStatus } : c
    ));

    // Also update selectedCode if it's the same code
    if (selectedCode && selectedCode.id === codeId) {
      setSelectedCode({ ...selectedCode, isFavorite: newFavoriteStatus });
    }
  };

  // Handle opening practice game
  const handleStartGame = (cheatCodeId: string, title: string) => {
    setGameCheatCodeId(cheatCodeId);
    setGameCheatCodeTitle(title);
    setShowGameModal(true);
  };

  // Handle closing game modal
  const handleCloseGameModal = () => {
    setShowGameModal(false);
    setGameCheatCodeId(null);
    setGameCheatCodeTitle('');
    // Also close the code card modal if it was open
    setSelectedCode(null);
  };

  // Handle game completion
  const handleGameComplete = (result: GameSessionResult) => {
    // Add the completed code to today's completed set
    if (gameCheatCodeId) {
      setCompletedToday(prev => {
        const newSet = new Set([...prev, gameCheatCodeId]);

        // Save to localStorage with user ID
        if (typeof window !== 'undefined' && userId) {
          const today = new Date().toDateString();
          const storageKey = `todaysFocusCompleted_${userId}`;
          localStorage.setItem(storageKey, JSON.stringify({
            date: today,
            completed: Array.from(newSet)
          }));
        }

        return newSet;
      });
    }

    // Save the result to trigger animation after modal closes
    console.log('🎯 handleGameComplete - Saving pending game result:', {
      momentum_awarded: result.momentum_awarded,
      previous_momentum: result.previous_momentum,
      new_momentum: result.new_momentum,
      score: result.score,
      is_first_play: result.is_first_play
    });

    setPendingGameResult(result);

    // Reload cheat codes to get updated stats
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { cheatCodes: dbCodes } = await getUserCheatCodes(user.id);
      if (dbCodes) {
        const transformedCodes: CheatCode[] = dbCodes.map((code: any) => {
          const lastUsed = code.last_used_at ? new Date(code.last_used_at) : new Date(code.created_at);
          const now = new Date();
          const diffMs = now.getTime() - lastUsed.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          return {
            id: code.id,
            title: code.title,
            category: code.category,
            timesUsed: code.times_used || 0,
            lastUsedDaysAgo: code.last_used_at ? diffDays : null,
            isFavorite: code.is_favorite || false,
            archived: code.is_active === false,
            created_at: code.created_at,
            summary: code.content || '',
            topicId: code.chat_id || undefined,
            onboardingScenarioId: code.onboarding_scenario_id || undefined
          };
        });
        setCheatCodes(transformedCodes);
      }

      // Also reload user progress
      const progress = await getUserProgress(supabase, user.id);
      setUserProgress(progress);
    };

    loadData();
  };

  // Handle opening chat
  const handleOpenChat = async (code: CheatCode) => {
    if (code.topicId) {
      // Fetch the actual chat from database and restore it
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/chat');
        return;
      }

      try {
        // Fetch the chat from database using chat_id
        const { data: chatData, error } = await supabase
          .from('chats')
          .select('*')
          .eq('id', code.topicId)
          .eq('user_id', user.id)
          .single();

        if (error || !chatData) {
          console.error('Error fetching chat or chat not found:', error);
          // Fall back to starting a new chat with topic
          localStorage.setItem('selectedTopic', JSON.stringify({
            title: code.title,
            description: code.summary,
          }));
          router.push('/chat');
          return;
        }

        // Store the chat history for restoration
        localStorage.setItem('chatHistory', JSON.stringify({
          isRestoringChat: true,
          messages: chatData.messages || [],
          sessionId: chatData.id
        }));

        // Store the ORIGINAL selected topic from the database
        if (chatData.selected_topic) {
          localStorage.setItem('selectedTopic', JSON.stringify({
            ...chatData.selected_topic,
            isReturningToExistingChat: true,
          }));
        }

        router.push('/chat');
      } catch (err) {
        console.error('Error loading chat:', err);
        // Fall back to starting a new chat with topic
        localStorage.setItem('selectedTopic', JSON.stringify({
          title: code.title,
          description: code.summary,
        }));
        router.push('/chat');
      }
    } else {
      // No chat ID - start fresh chat with topic
      localStorage.setItem('selectedTopic', JSON.stringify({
        title: code.title,
        description: code.summary,
      }));
      router.push('/chat');
    }
  };

  // Toggle archive status
  const toggleArchiveStatus = async (codeId: string) => {
    const code = cheatCodes.find(c => c.id === codeId);
    if (!code) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Start animation
    setAnimatingCode(codeId);
    setAnimationType(code.archived ? 'reactivate' : 'archive');

    // Delay the actual status change to allow animation
    setTimeout(async () => {
      if (code.archived) {
        // Reactivate in database
        const { error: dbError } = await reactivateCheatCodeDb(user.id, codeId);

        if (dbError) {
          console.error('Error reactivating in database:', dbError);
          alert('Failed to reactivate cheat code. Please try again.');
        } else {
          setCheatCodes(codes => codes.map(c =>
            c.id === codeId ? { ...c, archived: false } : c
          ));
        }
      } else {
        // Archive in database
        const { error: dbError } = await archiveCheatCodeDb(user.id, codeId);

        if (dbError) {
          console.error('Error archiving in database:', dbError);
          alert('Failed to archive cheat code. Please try again.');
        } else {
          setCheatCodes(codes => codes.map(c =>
            c.id === codeId ? { ...c, archived: true } : c
          ));
        }
      }

      // Clear animation state
      setTimeout(() => {
        setAnimatingCode(null);
        setAnimationType(null);
      }, 300);
    }, 150);

    setSelectedCode(null);
  };

  // Format last session helper
  const formatLastSession = (daysAgo: number | null | undefined) => {
    if (daysAgo === null || daysAgo === undefined) return 'Never';
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  // Parse summary into card data - handles both CARD format and markdown format
  const parseCheatCodeSummary = (summary: string) => {
    let what = '', when = '', why = '', phrase = '';
    let howSteps: string[] = [];

    // Check if content uses CARD format
    const isCardFormat = summary.includes('CARD:');

    if (isCardFormat) {
      // Parse CARD format
      const lines = summary.split('\n');
      let currentCard = '';
      let currentContent: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        if (trimmed.startsWith('CARD:')) {
          // Save previous card
          if (currentCard === 'What' && currentContent.length > 0) {
            what = currentContent.join(' ').trim();
          } else if (currentCard === 'When' && currentContent.length > 0) {
            when = currentContent.join(' ').trim();
          } else if (currentCard.startsWith('How - Step') && currentContent.length > 0) {
            howSteps.push(currentContent.join(' ').trim());
          } else if (currentCard === 'Why' && currentContent.length > 0) {
            why = currentContent.join(' ').trim();
          } else if (currentCard.toLowerCase().includes('phrase') && currentContent.length > 0) {
            phrase = currentContent.join(' ').trim();
          }

          // Start new card
          currentCard = trimmed.substring(5).trim(); // Remove "CARD: "
          currentContent = [];
        } else if (currentCard && trimmed &&
                   !trimmed.startsWith('TITLE:') &&
                   !trimmed.startsWith('CATEGORY:') &&
                   !trimmed.startsWith('DESCRIPTION:')) {
          // Add to current card content
          currentContent.push(trimmed);
        }
      }

      // Save last card
      if (currentCard === 'What' && currentContent.length > 0) {
        what = currentContent.join(' ').trim();
      } else if (currentCard === 'When' && currentContent.length > 0) {
        when = currentContent.join(' ').trim();
      } else if (currentCard.startsWith('How - Step') && currentContent.length > 0) {
        howSteps.push(currentContent.join(' ').trim());
      } else if (currentCard === 'Why' && currentContent.length > 0) {
        why = currentContent.join(' ').trim();
      } else if (currentCard.toLowerCase().includes('phrase') && currentContent.length > 0) {
        phrase = currentContent.join(' ').trim();
      }
    } else {
      // Parse markdown format (legacy)
      const sections = summary.split('\n\n');
      let how = '';

      sections.forEach(section => {
        if (section.startsWith('**What**:')) {
          what = section.replace('**What**: ', '').trim();
        } else if (section.startsWith('**When**:')) {
          when = section.replace('**When**: ', '').trim();
        } else if (section.startsWith('**How**:')) {
          how = section.replace('**How**: ', '').trim();
        } else if (section.startsWith('**Why**:')) {
          why = section.replace('**Why**: ', '').trim();
        } else if (section.startsWith('**Cheat Code Phrase**:')) {
          phrase = section.replace('**Cheat Code Phrase**: ', '').replace(/"/g, '').trim();
        }
      });

      // Split "How" into steps
      if (how) {
        // Try to split by numbered steps (e.g., "1. ", "2. ", "3. ")
        const numberedSteps = how.split(/(?=\d+\.\s)/).filter(s => s.trim().length > 0);

        if (numberedSteps.length > 1) {
          // We found numbered steps - clean them up
          howSteps = numberedSteps.map(step => {
            // Remove the leading number and any extra whitespace
            return step.replace(/^\d+\.\s*/, '').trim();
          }).filter(s => s.length > 0);
        } else {
          // No numbered steps found, try splitting by newlines
          const lines = how.split('\n').map(l => l.trim()).filter(l => l.length > 0);

          if (lines.length > 1) {
            howSteps = lines;
          } else {
            // Fall back to sentence-based splitting
            howSteps = how.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).slice(0, 3);
          }
        }
      }
    }

    return { what, when, howSteps, why, phrase };
  };

  // Build cards array for swipeable interface
  const buildCards = (code: CheatCode) => {
    const { what, when, howSteps, why, phrase } = parseCheatCodeSummary(code.summary || '');

    return [
      { type: 'title', title: code.title, category: code.category },
      { type: 'section', heading: 'What', content: what },
      { type: 'section', heading: 'When', content: when },
      ...howSteps.map((step, index) => ({
        type: 'step',
        heading: 'How',
        stepNumber: index + 1,
        totalSteps: howSteps.length,
        content: step
      })),
      { type: 'section', heading: 'Why', content: why },
      { type: 'phrase', heading: 'Your Cheat Code Phrase', content: phrase }
    ];
  };

  // Card navigation
  const nextCard = () => {
    if (!selectedCode) return;
    const cards = buildCards(selectedCode);
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

  // Reset states when closing modal
  const handleCloseModal = () => {
    setSelectedCode(null);
    resetCards();
  };

  // Calculate insights
  const activeCodes = cheatCodes.filter(c => !c.archived);
  const recentlyCreated = [...activeCodes].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  }).slice(0, 5);

  return (
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Desktop Header with Menu */}
      <div className="hidden lg:block absolute top-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-xl" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
        </div>
      </div>

      {/* Mobile Header with Menu */}
      <div className="lg:hidden absolute top-0 left-0 right-0 px-4 py-4 flex items-center gap-4 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--accent-color)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="text-lg font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#000000' }}
      >
        <div className="pt-6 px-6">
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

            <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
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

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Main Content with max-w-4xl wrapper */}
        <div className="flex-1 pt-8 px-8 pb-8 max-w-4xl mx-auto">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div className="flex flex-col justify-end" style={{ minHeight: '150px' }}>
                  {userProgress && userProgress.streak !== undefined && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', width: 'fit-content' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-color)">
                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                      </svg>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{userProgress.streak} DAY STREAK</span>
                    </div>
                  )}
                  <div>
                    <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>My Cheat Codes</div>
                    <div className="text-base mt-1" style={{ color: 'var(--text-tertiary)' }}>Create, save and practice your personalized cheat codes</div>
                  </div>
                </div>
                {userProgress && (
                  <div className="flex flex-col items-center gap-1 relative">
                    {/* Animated glow background */}
                    {showMomentumAnimation && (
                      <div
                        className="absolute inset-0 rounded-full animate-pulse"
                        style={{
                          background: 'radial-gradient(circle, rgba(0,255,65,0.2) 0%, transparent 70%)',
                          filter: 'blur(20px)',
                          zIndex: 0
                        }}
                      />
                    )}
                    <div className="w-[120px] aspect-square overflow-visible relative z-10">
                      <ProgressCircles
                        theme="dark"
                        progress={showMomentumAnimation ? animatedMomentum : userProgress.progress}
                        onProgressUpdate={() => {}}
                      />
                    </div>
                    <div
                      className={`text-2xl font-bold transition-all duration-300 relative z-10 ${showMomentumAnimation ? 'number-pulse-green' : ''}`}
                      style={{
                        color: showMomentumAnimation ? '#00ff41' : 'var(--text-primary)',
                        transform: showMomentumAnimation ? 'scale(1.2)' : 'scale(1)',
                        textShadow: showMomentumAnimation ? '0 0 20px rgba(0,255,65,0.8), 0 0 40px rgba(0,255,65,0.4)' : 'none',
                      }}
                      ref={(el) => {
                        if (el && showMomentumAnimation) {
                          console.log('📱 Desktop momentum visual animating:', {
                            animatedMomentum,
                            showMomentumAnimation,
                            momentumGain
                          });
                        }
                      }}
                    >
                      {showMomentumAnimation ? Math.floor(animatedMomentum) : userProgress.progress}%
                    </div>
                    <div className="text-xs font-semibold tracking-wider relative z-10" style={{ color: 'var(--text-tertiary)' }}>
                      MOMENTUM
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Two-column layout for Today's Focus & Quick Actions */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Today's Focus Section */}
              {todaysFocusCodes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {completedToday.size === todaysFocusCodes.length && todaysFocusCodes.length > 0 ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ff41" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>Today's Focus</span>
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: completedToday.size === todaysFocusCodes.length && todaysFocusCodes.length > 0 ? '#00ff41' : 'var(--text-tertiary)' }}
                    >
                      {completedToday.size}/{todaysFocusCodes.length} completed
                    </div>
                  </div>
                  <div className="relative rounded-2xl border" style={{ backgroundColor: 'rgba(0, 255, 65, 0.05)', borderColor: 'rgba(0, 255, 65, 0.2)' }}>
                    {/* Left Arrow */}
                    <button
                      onClick={() => setCurrentFocusIndex(Math.max(0, currentFocusIndex - 1))}
                      disabled={currentFocusIndex === 0}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full z-10 transition-all ${
                        currentFocusIndex === 0
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:bg-white/10 active:scale-95'
                      }`}
                      style={{ color: currentFocusIndex === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>

                    {/* Right Arrow */}
                    <button
                      onClick={() => setCurrentFocusIndex(Math.min(todaysFocusCodes.length - 1, currentFocusIndex + 1))}
                      disabled={currentFocusIndex === todaysFocusCodes.length - 1}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full z-10 transition-all ${
                        currentFocusIndex === todaysFocusCodes.length - 1
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:bg-white/10 active:scale-95'
                      }`}
                      style={{ color: currentFocusIndex === todaysFocusCodes.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>

                    <div
                      className="overflow-hidden rounded-2xl"
                      onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                      onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                      onTouchEnd={() => {
                        if (!touchStart || !touchEnd) return;
                        const distance = touchStart - touchEnd;
                        const isLeftSwipe = distance > 50;
                        const isRightSwipe = distance < -50;

                        if (isLeftSwipe && currentFocusIndex < todaysFocusCodes.length - 1) {
                          setCurrentFocusIndex(currentFocusIndex + 1);
                        }
                        if (isRightSwipe && currentFocusIndex > 0) {
                          setCurrentFocusIndex(currentFocusIndex - 1);
                        }
                        setTouchStart(0);
                        setTouchEnd(0);
                      }}
                    >
                      <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                          transform: `translateX(-${currentFocusIndex * 100}%)`,
                        }}
                      >
                        {todaysFocusCodes.map((code, index) => (
                          <div key={code.id} className="w-full flex-shrink-0 py-5 px-10 relative">
                            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Your coach recommends practicing:</p>
                            <h3 className="text-xl font-bold mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
                              {code.title}
                            </h3>
                            <div className="flex gap-3 mb-4">
                              <button
                                onClick={() => {
                                  setGameCheatCodeId(code.id);
                                  setGameCheatCodeTitle(code.title);
                                  setGameOnboardingScenarioId(undefined); // Don't use onboarding scenarios for regular practice games
                                  setShowGameModal(true);
                                }}
                                className="flex-1 py-3 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                style={{
                                  backgroundColor: completedToday.has(code.id) ? 'rgba(0, 255, 65, 0.15)' : '#00ff41',
                                  color: completedToday.has(code.id) ? '#00ff41' : '#000000'
                                }}
                                disabled={completedToday.has(code.id)}
                              >
                                {completedToday.has(code.id) ? (
                                  <>✓ Completed</>
                                ) : (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    Start Practice
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCode(code);
                                  resetCards();
                                }}
                                className="flex-1 border py-3 px-3 rounded-xl font-medium text-xs transition-all hover:bg-white/5"
                                style={{ backgroundColor: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                              >
                                View Code
                              </button>
                            </div>
                            {/* Dot indicators */}
                            <div className="flex justify-center gap-1.5">
                              {todaysFocusCodes.map((_, dotIndex) => (
                                <button
                                  key={dotIndex}
                                  onClick={() => setCurrentFocusIndex(dotIndex)}
                                  className="transition-all"
                                  style={{
                                    width: dotIndex === currentFocusIndex ? '24px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    backgroundColor: dotIndex === currentFocusIndex ? '#00ff41' : 'rgba(255, 255, 255, 0.2)'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (activeCodes.length > 0) {
                        const randomCode = activeCodes[Math.floor(Math.random() * activeCodes.length)];
                        setGameCheatCodeId(randomCode.id);
                        setGameCheatCodeTitle(randomCode.title);
                        setShowGameModal(true);
                      }
                    }}
                    disabled={activeCodes.length < 2}
                    className="rounded-xl p-4 border text-left transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 relative"
                    style={{
                      backgroundColor: 'rgba(0, 255, 65, 0.15)',
                      borderColor: 'rgba(0, 255, 65, 0.3)',
                      color: 'var(--accent-color)'
                    }}
                  >
                    {activeCodes.length < 2 && (
                      <div className="absolute top-3 right-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                    )}
                    <div className="text-sm font-bold mb-1">Quick Game</div>
                    <div className="text-xs opacity-80">{activeCodes.length < 2 ? 'Need 2+ codes to unlock' : 'Random code practice'}</div>
                  </button>
                  <button
                    onClick={() => {
                      // Clear all chat-related data for fresh start
                      localStorage.removeItem('selectedTopic');
                      localStorage.removeItem('chatHistory');
                      localStorage.removeItem('chatReferrer');
                      router.push('/chat');
                    }}
                    className="rounded-xl p-4 border text-left transition-colors"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                  >
                    <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create New</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Chat now</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Your Codes List */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recent Codes</h2>
                <Link href="/my-codes/view-all" className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {recentlyCreated.map((code, index) => (
                  <div
                    key={code.id}
                    onClick={() => router.push(`/my-codes?code=${code.id}`)}
                    className="rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative transition-all cursor-pointer hover:scale-[1.02]"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  >
                    {/* Favorite Star */}
                    <button
                      onClick={(e) => toggleFavorite(code.id, e)}
                      className="absolute top-3 right-3 p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
                      style={{ backgroundColor: code.isFavorite ? 'rgba(0, 255, 65, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}
                    >
                      {code.isFavorite ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ff41" stroke="#00ff41" strokeWidth="1.5">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                    </button>

                    {/* New Badge - only show on first 2 codes if they're new */}
                    {index < 2 && (code.timesUsed || 0) === 0 && (
                      <div className="absolute top-3 left-3">
                        <div className="inline-block px-2 py-0.5 border rounded-md text-[10px] uppercase font-semibold tracking-wider" style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)', borderColor: '#60a5fa', color: '#60a5fa' }}>
                          New
                        </div>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="space-y-3 flex-1 flex flex-col justify-center text-center">
                      <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {code.title}
                      </h1>
                    </div>

                    {/* Bottom Stats Row */}
                    <div className="flex items-center justify-between text-[10px] pt-3 border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--card-border)' }}>
                      <div>
                        <span className="font-medium">Last: {formatLastSession(code.lastUsedDaysAgo)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Completed {code.timesUsed || 0}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              {activeCodes.length > 5 && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/my-codes/view-all')}
                    className="w-full py-3 rounded-xl font-medium text-sm transition-all hover:bg-white/5"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
                  >
                    View All Codes →
                  </button>
                </div>
              )}
            </div>

            {/* Empty State / Continue Building */}
            {(activeCodes.length === 0 || activeCodes.length === 1) && !loading && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <div className="mb-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" className="mx-auto">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {activeCodes.length === 0 ? 'Ready to Build Confidence?' : 'Continue Building Your Confidence'}
                  </h3>
                  <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {activeCodes.length === 0
                      ? 'Create your first cheat code by chatting with your coach. Each code is a personalized mental tool to help you perform under pressure.'
                      : 'Create your next cheat code by chatting with your coach. Each code is a personalized mental tool to help you perform under pressure.'}
                  </p>
                  <button
                    onClick={() => router.push('/chat')}
                    className="px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95"
                    style={{ backgroundColor: '#00ff41', color: '#000000' }}
                  >
                    {activeCodes.length === 0 ? 'Start Your First Chat' : 'Create Your Next Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative flex flex-col pt-16">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-start justify-between" style={{ overflow: 'visible' }}>
              <div className="flex flex-col justify-end" style={{ minHeight: '135px' }}>
                {userProgress && userProgress.streak !== undefined && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', width: 'fit-content' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-color)">
                      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{userProgress.streak} DAY STREAK</span>
                  </div>
                )}
                <div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Cheat Codes</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Create, save and practice your personalized cheat codes</div>
                </div>
              </div>
              {userProgress && (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[100px] aspect-square overflow-visible">
                    <ProgressCircles
                      theme="dark"
                      progress={showMomentumAnimation ? animatedMomentum : userProgress.progress}
                      onProgressUpdate={() => {}}
                    />
                  </div>
                  <div
                    className={`text-xl font-bold transition-all duration-300 ${showMomentumAnimation ? 'number-pulse-green' : ''}`}
                    style={{
                      color: showMomentumAnimation ? '#00ff41' : 'var(--text-primary)',
                      transform: showMomentumAnimation ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {showMomentumAnimation ? Math.floor(animatedMomentum) : userProgress.progress}%
                  </div>
                  <div className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    MOMENTUM
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Focus Section */}
          {todaysFocusCodes.length > 0 && (
            <div className="p-4 pb-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {completedToday.size === todaysFocusCodes.length && todaysFocusCodes.length > 0 ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ff41" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>Today's Focus</span>
                </div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: completedToday.size === todaysFocusCodes.length && todaysFocusCodes.length > 0 ? '#00ff41' : 'var(--text-tertiary)' }}
                >
                  {completedToday.size}/{todaysFocusCodes.length} completed
                </div>
              </div>
              <div className="relative rounded-2xl border" style={{ backgroundColor: 'rgba(0, 255, 65, 0.05)', borderColor: 'rgba(0, 255, 65, 0.2)' }}>
                {/* Left Arrow */}
                <button
                  onClick={() => setCurrentFocusIndex(Math.max(0, currentFocusIndex - 1))}
                  disabled={currentFocusIndex === 0}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full z-10 transition-all ${
                    currentFocusIndex === 0
                      ? 'cursor-not-allowed opacity-30'
                      : 'active:scale-95'
                  }`}
                  style={{ color: currentFocusIndex === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                {/* Right Arrow */}
                <button
                  onClick={() => setCurrentFocusIndex(Math.min(todaysFocusCodes.length - 1, currentFocusIndex + 1))}
                  disabled={currentFocusIndex === todaysFocusCodes.length - 1}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full z-10 transition-all ${
                    currentFocusIndex === todaysFocusCodes.length - 1
                      ? 'cursor-not-allowed opacity-30'
                      : 'active:scale-95'
                  }`}
                  style={{ color: currentFocusIndex === todaysFocusCodes.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <div
                  className="overflow-hidden rounded-2xl"
                  onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                  onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                  onTouchEnd={() => {
                    if (!touchStart || !touchEnd) return;
                    const distance = touchStart - touchEnd;
                    const isLeftSwipe = distance > 50;
                    const isRightSwipe = distance < -50;

                    if (isLeftSwipe && currentFocusIndex < todaysFocusCodes.length - 1) {
                      setCurrentFocusIndex(currentFocusIndex + 1);
                    }
                    if (isRightSwipe && currentFocusIndex > 0) {
                      setCurrentFocusIndex(currentFocusIndex - 1);
                    }
                    setTouchStart(0);
                    setTouchEnd(0);
                  }}
                >
                  <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{
                      transform: `translateX(-${currentFocusIndex * 100}%)`,
                    }}
                  >
                    {todaysFocusCodes.map((code, index) => (
                      <div key={code.id} className="w-full flex-shrink-0 py-5 px-10 relative">
                        <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Your coach recommends practicing:</p>
                        <h3 className="text-xl font-bold mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {code.title}
                        </h3>
                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={() => {
                              setGameCheatCodeId(code.id);
                              setGameCheatCodeTitle(code.title);
                              setGameOnboardingScenarioId(undefined); // Don't use onboarding scenarios for regular practice games
                              setShowGameModal(true);
                            }}
                            className="flex-1 py-3 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            style={{
                              backgroundColor: completedToday.has(code.id) ? 'rgba(0, 255, 65, 0.15)' : '#00ff41',
                              color: completedToday.has(code.id) ? '#00ff41' : '#000000'
                            }}
                            disabled={completedToday.has(code.id)}
                          >
                            {completedToday.has(code.id) ? (
                              <>✓ Completed</>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                                Start Practice
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCode(code);
                              resetCards();
                            }}
                            className="flex-1 border py-3 px-3 rounded-xl font-medium text-xs transition-all hover:bg-white/5"
                            style={{ backgroundColor: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                          >
                            View Code
                          </button>
                        </div>
                        {/* Dot indicators */}
                        <div className="flex justify-center gap-1.5">
                          {todaysFocusCodes.map((_, dotIndex) => (
                            <button
                              key={dotIndex}
                              onClick={() => setCurrentFocusIndex(dotIndex)}
                              className="transition-all"
                              style={{
                                width: dotIndex === currentFocusIndex ? '24px' : '6px',
                                height: '6px',
                                borderRadius: '3px',
                                backgroundColor: dotIndex === currentFocusIndex ? '#00ff41' : 'rgba(255, 255, 255, 0.2)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (activeCodes.length > 0) {
                    const randomCode = activeCodes[Math.floor(Math.random() * activeCodes.length)];
                    setGameCheatCodeId(randomCode.id);
                    setGameCheatCodeTitle(randomCode.title);
                    setShowGameModal(true);
                  }
                }}
                disabled={activeCodes.length < 2}
                className="rounded-xl p-4 border text-left transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 relative"
                style={{
                  backgroundColor: 'rgba(0, 255, 65, 0.15)',
                  borderColor: 'rgba(0, 255, 65, 0.3)',
                  color: 'var(--accent-color)'
                }}
              >
                {activeCodes.length < 2 && (
                  <div className="absolute top-3 right-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                )}
                <div className="text-sm font-bold mb-1">Quick Game</div>
                <div className="text-xs opacity-80">{activeCodes.length < 2 ? 'Need 2+ codes to unlock' : 'Random code practice'}</div>
              </button>
              <button
                onClick={() => {
                  // Clear all chat-related data for fresh start
                  localStorage.removeItem('selectedTopic');
                  localStorage.removeItem('chatHistory');
                  localStorage.removeItem('chatReferrer');
                  router.push('/chat');
                }}
                className="rounded-xl p-4 border text-left transition-colors"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create New</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Chat now</div>
              </button>
            </div>
          </div>

          {/* Your Codes List */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Recent Codes</h2>
              <Link href="/my-codes/view-all" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentlyCreated.map((code, index) => (
                <div
                  key={code.id}
                  onClick={() => router.push(`/my-codes?code=${code.id}`)}
                  className="rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative transition-all active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                  {/* Favorite Star */}
                  <button
                    onClick={(e) => toggleFavorite(code.id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
                    style={{ backgroundColor: code.isFavorite ? 'rgba(0, 255, 65, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}
                  >
                    {code.isFavorite ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ff41" stroke="#00ff41" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                  </button>

                  {/* New Badge - only show on first 2 codes if they're new */}
                  {index < 2 && (code.timesUsed || 0) === 0 && (
                    <div className="absolute top-3 left-3">
                      <div className="inline-block px-2 py-0.5 border rounded-md text-[10px] uppercase font-semibold tracking-wider" style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)', borderColor: '#60a5fa', color: '#60a5fa' }}>
                        New
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="space-y-3 flex-1 flex flex-col justify-center text-center">
                    <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {code.title}
                    </h1>
                  </div>

                  {/* Bottom Stats Row */}
                  <div className="flex items-center justify-between text-[10px] pt-3 border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--card-border)' }}>
                    <div>
                      <span className="font-medium">Last: {formatLastSession(code.lastUsedDaysAgo)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Completed {code.timesUsed || 0}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {activeCodes.length > 5 && (
              <div className="mt-4">
                <button
                  onClick={() => router.push('/my-codes/view-all')}
                  className="w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
                >
                  View All Codes →
                </button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {activeCodes.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="mb-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" className="mx-auto">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Ready to Build Confidence?</h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Create your first cheat code by chatting with your coach. Each code is a personalized mental tool to help you perform under pressure.
                </p>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95"
                  style={{ backgroundColor: '#00ff41', color: '#000000' }}
                >
                  Start Your First Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cheat Code Cue Cards Modal */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 lg:p-3 transition-colors z-[120] rounded-full border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Card Container */}
          <div className="w-full max-w-lg">
            {/* Card with Navigation Inside */}
            <div className="rounded-2xl p-6 lg:p-10 min-h-[400px] lg:min-h-[500px] flex relative border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              {/* Favorite Star - Top Right (only on final phrase card) */}
              {currentCard === buildCards(selectedCode).length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(selectedCode.id, e);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
                  style={{ backgroundColor: selectedCode.isFavorite ? 'rgba(0, 255, 65, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}
                >
                  {selectedCode.isFavorite ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ff41" stroke="#00ff41" strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                </button>
              )}

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
                disabled={currentCard === buildCards(selectedCode).length - 1}
                className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  currentCard === buildCards(selectedCode).length - 1
                    ? 'cursor-not-allowed opacity-30'
                    : 'active:scale-95'
                }`}
                style={{ color: currentCard === buildCards(selectedCode).length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Card Content */}
              <div className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-4 lg:py-6 pb-3 lg:pb-4">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  {(() => {
                    const cards = buildCards(selectedCode);
                    const card = cards[currentCard];

                    return (
                      <>
                        {/* Title Card */}
                        {card.type === 'title' && (
                          <div className="space-y-6 lg:space-y-8">
                            <h1 className="text-3xl lg:text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                              {(card as any).title}
                            </h1>
                          </div>
                        )}

                      {/* Section Cards (What, When) */}
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

                            <div className="space-y-3 lg:space-y-4 relative">
                              {usedToday ? (
                                <div className="w-full py-4 lg:py-5 rounded-xl font-semibold text-base lg:text-lg flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}>
                                  <span>✓</span>
                                  <span>Logged Today</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleStartGame(selectedCode.id, selectedCode.title);
                                  }}
                                  className="w-full py-4 lg:py-5 rounded-xl font-semibold text-base lg:text-lg transition-all active:scale-95"
                                  style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                                >
                                  Practice
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenChat(selectedCode)}
                                className="w-full border py-3 lg:py-4 rounded-xl font-medium text-sm lg:text-base transition-colors"
                                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                              >
                                Open Chat
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleArchiveStatus(selectedCode.id);
                                }}
                                className="w-full py-2 text-xs transition-opacity hover:opacity-70"
                                style={{
                                  color: 'var(--text-tertiary)',
                                  background: 'none',
                                  border: 'none'
                                }}
                              >
                                {selectedCode.archived ? 'Reactivate Code' : 'Archive Code'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                </div>

                {/* Footer with Branding and Usage Stats */}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center justify-between text-[9px] lg:text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    <span>MYCHEATCODE.AI</span>
                    <span className="flex items-center gap-2">
                      {selectedCode.timesUsed !== undefined && selectedCode.timesUsed > 0 ? (
                        <>
                          <span>Completed {selectedCode.timesUsed}x</span>
                          {selectedCode.lastUsedDaysAgo !== null && (
                            <>
                              <span>•</span>
                              <span>
                                {selectedCode.lastUsedDaysAgo === 0 ? 'Today' : selectedCode.lastUsedDaysAgo === 1 ? 'Yesterday' : `${selectedCode.lastUsedDaysAgo}d ago`}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span>Not completed yet</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Animation Overlay */}
            {showSuccess && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm"
                style={{ animation: 'fade-out 0.4s ease-out 1.6s forwards', backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              >
                <div className="flex flex-col items-center gap-4" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                    <polyline points="20 6 9 17 4 12" strokeDasharray="100" strokeDashoffset="0"
                      style={{ animation: 'checkmark-draw 0.6s ease-out 0.1s backwards' }} />
                  </svg>
                  <div className="text-center" style={{ animation: 'fade-in-scale 0.4s ease-out 0.2s backwards' }}>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>Locked In!</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {buildCards(selectedCode).map((_, index) => (
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
          </div>
        </div>
      )}

      {/* Game Modal */}
      {showGameModal && gameCheatCodeId && (
        <CheatCodeGame
          cheatCodeId={gameCheatCodeId}
          cheatCodeTitle={gameCheatCodeTitle}
          onboardingScenarioId={gameOnboardingScenarioId}
          onComplete={handleGameComplete}
          onClose={handleCloseGameModal}
        />
      )}

      {/* Center-Screen Momentum Animation - Enhanced with messaging */}
      {showCenterAnimation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          style={{
            backgroundColor: centerAnimationPhase === 'enter' ? 'rgba(0, 0, 0, 0.85)' : 'transparent',
            transition: 'background-color 0.5s ease-out'
          }}
        >
          <div
            className="relative flex flex-col items-center justify-center gap-6 px-8"
            style={{
              transform: centerAnimationPhase === 'enter'
                ? 'scale(1)'
                : centerAnimationPhase === 'shrink'
                  ? 'scale(0.5)'
                  : 'scale(0.2) translate(0, -50vh)',
              opacity: centerAnimationPhase === 'move' ? 0 : 1,
              transition: centerAnimationPhase === 'enter'
                ? 'none'
                : centerAnimationPhase === 'shrink'
                  ? 'transform 0.6s ease-out'
                  : 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Background Glow - Subtle */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,255,65,0.12) 0%, rgba(0,255,65,0.06) 40%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scale(1.5)'
              }}
            />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-md">
              {/* "MOMENTUM GAINED" Label */}
              <div
                className="text-sm font-semibold tracking-widest uppercase"
                style={{
                  color: '#00ff41',
                  textShadow: '0 0 8px rgba(0,255,65,0.2)',
                  letterSpacing: '0.2em'
                }}
              >
                Momentum Gained
              </div>

              {/* Momentum Number - Larger */}
              <div
                className="text-7xl font-bold"
                style={{
                  color: '#00ff41',
                  textShadow: '0 0 20px rgba(0,255,65,0.3)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                +{Math.floor(momentumGain)}%
              </div>

              {/* Encouraging Message */}
              <div
                className="text-lg font-medium"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Keep practicing! 🔥
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
