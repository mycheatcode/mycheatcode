'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserCheatCodes, toggleFavoriteCheatCode, checkTodayUsage, archiveCheatCodeDb, reactivateCheatCodeDb } from '@/lib/cheatcodes';
import { getUserProgress } from '@/lib/progress';
import FeedbackButton from '@/components/FeedbackButton';
import FeedbackModal from '@/components/FeedbackModal';
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
}

export default function ViewAllCodesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [cheatCodes, setCheatCodes] = useState<CheatCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Categories with counts
  const categories = ['All', 'New', 'Favorites', 'Most Used', 'Archived'];

  const getCategoryCount = (category: string) => {
    const activeCodes = cheatCodes.filter(c => !c.archived);
    const archivedCodes = cheatCodes.filter(c => c.archived);
    switch (category) {
      case 'All':
        return activeCodes.length;
      case 'New':
        return activeCodes.filter(c => (c.timesUsed || 0) === 0).length;
      case 'Favorites':
        return activeCodes.filter(c => c.isFavorite).length;
      case 'Most Used':
        return activeCodes.filter(c => (c.timesUsed || 0) >= 3).length;
      case 'Archived':
        return archivedCodes.length;
      default:
        return 0;
    }
  };

  // Load cheat codes
  useEffect(() => {
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
            topicId: code.chat_id || undefined
          };
        });
        setCheatCodes(transformedCodes);
      }
    };

    loadData();
  }, [supabase]);

  // Handle URL query parameters (?code= and ?practice=)
  useEffect(() => {
    const codeId = searchParams.get('code');
    const practiceId = searchParams.get('practice');

    if (codeId && cheatCodes.length > 0) {
      const code = cheatCodes.find(c => c.id === codeId);
      if (code) {
        setSelectedCode(code);
        // Clear the URL parameter
        router.replace('/my-codes/view-all', { scroll: false });
      }
    } else if (practiceId && cheatCodes.length > 0) {
      const code = cheatCodes.find(c => c.id === practiceId);
      if (code) {
        setGameCheatCodeId(code.id);
        setGameCheatCodeTitle(code.title);
        setShowGameModal(true);
        // Clear the URL parameter
        router.replace('/my-codes/view-all', { scroll: false });
      }
    }
  }, [searchParams, cheatCodes, router]);

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
  };

  // Handle game completion
  const handleGameComplete = (result: GameSessionResult) => {
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
            topicId: code.chat_id || undefined
          };
        });
        setCheatCodes(transformedCodes);
      }
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

  // Get filtered codes based on category and search
  const getFilteredCodes = () => {
    let codes = activeCategory === 'Archived'
      ? cheatCodes.filter(c => c.archived)
      : cheatCodes.filter(c => !c.archived);

    // Filter by category
    switch (activeCategory) {
      case 'New':
        codes = codes.filter(c => (c.timesUsed || 0) === 0);
        break;
      case 'Favorites':
        codes = codes.filter(c => c.isFavorite);
        break;
      case 'Most Used':
        codes = codes.filter(c => (c.timesUsed || 0) >= 3);
        break;
      // 'All' shows all active codes, 'Archived' shows archived codes
    }

    // Filter by search query
    if (searchQuery) {
      codes = codes.filter(code =>
        code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by most recently created
    return codes.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  };

  // Organize codes into smart sections (not used when category filter is active)
  const getCodeSections = () => {
    let codes = cheatCodes;

    // Filter by search query first
    if (searchQuery) {
      codes = codes.filter(code =>
        code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sections = [];

    // Section 1: Needs Practice (3+ days old, not archived)
    const needsPractice = codes.filter(c => !c.archived && (c.lastUsedDaysAgo ?? 0) > 2);
    if (needsPractice.length > 0) {
      sections.push({
        title: 'Needs Practice',
        subtitle: 'Keep your skills sharp',
        codes: needsPractice.sort((a, b) => (b.lastUsedDaysAgo ?? 0) - (a.lastUsedDaysAgo ?? 0))
      });
    }

    // Section 2: Favorites (not archived)
    const favorites = codes.filter(c => c.isFavorite && !c.archived);
    if (favorites.length > 0) {
      sections.push({
        title: 'Favorites',
        subtitle: 'Your go-to codes',
        codes: favorites.sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0))
      });
    }

    // Section 3: Recently Active (used in last 3 days, not archived, not in needs practice)
    const recentlyActive = codes.filter(c =>
      !c.archived &&
      (c.lastUsedDaysAgo ?? 999) <= 2 &&
      (c.timesUsed || 0) > 0
    );
    if (recentlyActive.length > 0) {
      sections.push({
        title: 'Recently Active',
        subtitle: 'Codes you\'ve been using',
        codes: recentlyActive.sort((a, b) => (a.lastUsedDaysAgo ?? 999) - (b.lastUsedDaysAgo ?? 999))
      });
    }

    // Section 4: All Active Codes (not archived, not in other sections)
    const activeCodeIds = new Set([
      ...needsPractice.map(c => c.id),
      ...favorites.map(c => c.id),
      ...recentlyActive.map(c => c.id)
    ]);
    const otherActive = codes.filter(c => !c.archived && !activeCodeIds.has(c.id));
    if (otherActive.length > 0) {
      sections.push({
        title: 'All Active Codes',
        subtitle: 'Your complete collection',
        codes: otherActive.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        })
      });
    }

    // Section 5: Archived
    const archived = codes.filter(c => c.archived);
    if (archived.length > 0) {
      sections.push({
        title: 'Archived',
        subtitle: 'Codes you\'ve set aside',
        codes: archived
      });
    }

    return sections;
  };

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

  return (
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Desktop Header with Back Button */}
      <div className="hidden lg:block absolute top-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/my-codes')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div className="text-xl" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
        </div>
      </div>

      {/* Mobile Header with Back Button */}
      <div className="lg:hidden absolute top-0 left-0 right-0 px-4 py-4 flex items-center gap-4 z-20">
        <button
          onClick={() => router.push('/my-codes')}
          className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          style={{ color: 'var(--accent-color)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
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
            <button onClick={() => setFeedbackModalOpen(true)} className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5 w-full text-left" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
              </svg>
              <span>Got Feedback?</span>
            </button>
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

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative flex flex-col pt-16">
        {/* Search */}
        <div className="p-4 pb-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#808080' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cheat codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
              style={
                activeCategory === category
                  ? { backgroundColor: 'var(--accent-color)', color: '#000000' }
                  : { backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }
              }
            >
              <span>{category}</span>
              <span className="text-xs" style={{ opacity: 0.7 }}>
                {getCategoryCount(category)}
              </span>
            </button>
          ))}
        </div>

        {/* Consistency Message */}
        <div className="mx-4 mb-4 px-4 py-3 border rounded-xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: 0.6 }}>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-xs">Practice your codes frequently. Consistency is the key to unlocking your confidence.</span>
          </div>
        </div>

        {/* Cheat Codes List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {getFilteredCodes().map((code) => (
            <div
              key={code.id}
              onClick={() => setSelectedCode(code)}
              className="rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative border transition-all active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: code.archived ? 0.6 : 1 }}
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

              {/* Archive Badge */}
              {code.archived && (
                <div className="absolute top-3 left-3">
                  <div className="inline-block px-2 py-0.5 border rounded-md text-[10px] uppercase font-semibold tracking-wider" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                    Archived
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
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Main Content */}
        <div className={`flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto transition-all duration-300 ${menuOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#808080' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search cheat codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none transition-all"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-3"
                style={
                  activeCategory === category
                    ? { backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }
                }
              >
                <span>{category}</span>
                <span className="text-xs" style={{ opacity: 0.7 }}>
                  {getCategoryCount(category)}
                </span>
              </button>
            ))}
          </div>

          {/* Consistency Message */}
          <div className="px-6 py-4 border rounded-xl mb-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: 0.6 }}>
            <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span className="text-sm">Practice your codes frequently. Consistency is the key to unlocking your confidence.</span>
            </div>
          </div>

          {/* Cheat Codes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredCodes().map((code) => (
                  <div
                    key={code.id}
                    onClick={() => setSelectedCode(code)}
                    className="rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative border transition-all cursor-pointer hover:scale-[1.02]"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: code.archived ? 0.6 : 1 }}
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

                    {/* Archive Badge */}
                    {code.archived && (
                      <div className="absolute top-3 left-3">
                        <div className="inline-block px-2 py-0.5 border rounded-md text-[10px] uppercase font-semibold tracking-wider" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                          Archived
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

                    {/* Hover Overlay with View Button */}
                    <div className="absolute inset-0 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                      <div className="px-8 py-3 rounded-xl font-semibold text-lg" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
                        View Code
                      </div>
                    </div>
                  </div>
            ))}
          </div>
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
          onComplete={handleGameComplete}
          onClose={handleCloseGameModal}
        />
      )}

      {/* Floating Feedback Button */}
      <FeedbackButton />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}
