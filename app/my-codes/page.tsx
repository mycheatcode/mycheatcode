'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserCheatCodes, toggleFavoriteCheatCode } from '@/lib/cheatcodes';
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
}

interface UserProgress {
  progress: number;
  chatCount: number;
}

export default function MyCodesRedesignPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cheatCodes, setCheatCodes] = useState<CheatCode[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [todaysFocus, setTodaysFocus] = useState<CheatCode | null>(null);
  const [selectedCode, setSelectedCode] = useState<CheatCode | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameCheatCodeId, setGameCheatCodeId] = useState<string | null>(null);
  const [gameCheatCodeTitle, setGameCheatCodeTitle] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load cheat codes
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

      // Load user progress
      const progress = await getUserProgress(user.id);
      setUserProgress(progress);

      setLoading(false);
    };

    loadData();
  }, [supabase]);

  // Set today's focus (smart selection based on user's codes)
  useEffect(() => {
    if (cheatCodes.length === 0) return;

    const activeCodes = cheatCodes.filter(c => !c.archived);

    // Priority 1: Codes that need practice (3+ days old)
    const needsPractice = activeCodes.filter(c => (c.lastUsedDaysAgo ?? 999) > 2);
    if (needsPractice.length > 0) {
      const sorted = [...needsPractice].sort((a, b) => (b.lastUsedDaysAgo ?? 0) - (a.lastUsedDaysAgo ?? 0));
      setTodaysFocus(sorted[0]);
      return;
    }

    // Priority 2: New codes that haven't been tried
    const newCodes = activeCodes.filter(c => (c.timesUsed || 0) === 0);
    if (newCodes.length > 0) {
      setTodaysFocus(newCodes[0]);
      return;
    }

    // Priority 3: Least used code
    const sorted = [...activeCodes].sort((a, b) => (a.timesUsed || 0) - (b.timesUsed || 0));
    if (sorted.length > 0) {
      setTodaysFocus(sorted[0]);
    }
  }, [cheatCodes]);

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
        setShowGameModal(true);
        // Clear the URL parameter
        router.replace('/my-codes', { scroll: false });
      }
    }
  }, [searchParams, cheatCodes, router]);

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

      // Also reload user progress
      const progress = await getUserProgress(user.id);
      setUserProgress(progress);
    };

    loadData();
  };

  // Format last session helper
  const formatLastSession = (daysAgo: number | null | undefined) => {
    if (daysAgo === null || daysAgo === undefined) return 'Never';
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
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
            <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
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
        <div className="flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>My Cheat Codes</div>
                  <div className="text-base mt-1" style={{ color: 'var(--text-tertiary)' }}>Your vault of confidence boosting cheat codes</div>
                  {userProgress && userProgress.chatCount > 0 && (
                    <div className="text-sm mt-3 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 65, 0.15)', color: 'var(--accent-color)' }}>
                      {userProgress.chatCount} {userProgress.chatCount === 1 ? 'game' : 'games'} completed
                    </div>
                  )}
                </div>
                {userProgress && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[120px] aspect-square overflow-visible">
                      <ProgressCircles
                        theme="dark"
                        progress={userProgress.progress}
                        onProgressUpdate={() => {}}
                      />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {userProgress.progress}%
                    </div>
                    <div className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      MOMENTUM
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Two-column layout for Today's Focus & Quick Actions */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Today's Focus Section */}
              {todaysFocus && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>Today's Focus</span>
                  </div>
                  <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'rgba(0, 255, 65, 0.05)', borderColor: 'rgba(0, 255, 65, 0.2)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Your coach recommends practicing:</p>
                    <h3 className="text-xl font-bold mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>{todaysFocus.title}</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/my-codes?practice=${todaysFocus.id}`)}
                        className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#00ff41', color: '#000000' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Start Practice
                      </button>
                      <button
                        onClick={() => router.push(`/my-codes?code=${todaysFocus.id}`)}
                        className="flex-1 border py-3 rounded-xl font-medium text-sm transition-all hover:bg-white/5"
                        style={{ backgroundColor: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                      >
                        View Code
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (activeCodes.length > 0) {
                        const randomCode = activeCodes[Math.floor(Math.random() * activeCodes.length)];
                        router.push(`/my-codes?practice=${randomCode.id}`);
                      }
                    }}
                    disabled={activeCodes.length === 0}
                    className="rounded-xl p-4 border text-left transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    style={{
                      backgroundColor: 'rgba(0, 255, 65, 0.15)',
                      borderColor: 'rgba(0, 255, 65, 0.3)',
                      color: 'var(--accent-color)'
                    }}
                  >
                    <div className="text-sm font-bold mb-1">Quick Game</div>
                    <div className="text-xs opacity-80">Random code practice</div>
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
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative flex flex-col pt-16">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)', overflow: 'visible' }}>
            <div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Cheat Codes</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Your vault of confidence boosting cheat codes</div>
              {userProgress && userProgress.chatCount > 0 && (
                <div className="text-xs mt-3 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 65, 0.15)', color: 'var(--accent-color)' }}>
                  {userProgress.chatCount} {userProgress.chatCount === 1 ? 'game' : 'games'} completed
                </div>
              )}
            </div>
            {userProgress && (
              <div className="flex flex-col items-center gap-1" style={{ overflow: 'visible' }}>
                <div className="w-[100px] aspect-square overflow-visible">
                  <ProgressCircles
                    theme="dark"
                    progress={userProgress.progress}
                    onProgressUpdate={() => {}}
                  />
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {userProgress.progress}%
                </div>
                <div className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  MOMENTUM
                </div>
              </div>
            )}
          </div>

          {/* Today's Focus Section */}
          {todaysFocus && (
            <div className="p-4 pb-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>Today's Focus</span>
              </div>
              <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'rgba(0, 255, 65, 0.05)', borderColor: 'rgba(0, 255, 65, 0.2)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Your coach recommends practicing:</p>
                <h3 className="text-xl font-bold mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>{todaysFocus.title}</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/my-codes?practice=${todaysFocus.id}`)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#00ff41', color: '#000000' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Start Practice
                  </button>
                  <button
                    onClick={() => router.push(`/my-codes?code=${todaysFocus.id}`)}
                    className="flex-1 border py-3 rounded-xl font-medium text-sm transition-all hover:bg-white/5"
                    style={{ backgroundColor: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                  >
                    View Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (activeCodes.length > 0) {
                    const randomCode = activeCodes[Math.floor(Math.random() * activeCodes.length)];
                    router.push(`/my-codes?practice=${randomCode.id}`);
                  }
                }}
                disabled={activeCodes.length === 0}
                className="rounded-xl p-4 border text-left transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                style={{
                  backgroundColor: 'rgba(0, 255, 65, 0.15)',
                  borderColor: 'rgba(0, 255, 65, 0.3)',
                  color: 'var(--accent-color)'
                }}
              >
                <div className="text-sm font-bold mb-1">Quick Game</div>
                <div className="text-xs opacity-80">Random code practice</div>
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

      {/* Code Detail Modal */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedCode(null)}>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{selectedCode.title}</h2>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{selectedCode.category}</div>
              </div>
              <button
                onClick={() => setSelectedCode(null)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Times Practiced</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCode.timesUsed || 0}</div>
              </div>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Last Practice</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatLastSession(selectedCode.lastUsedDaysAgo)}</div>
              </div>
            </div>

            {/* Content Preview */}
            {selectedCode.summary && (
              <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {selectedCode.summary.substring(0, 200)}{selectedCode.summary.length > 200 ? '...' : ''}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleStartGame(selectedCode.id, selectedCode.title);
                  setSelectedCode(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95"
                style={{ backgroundColor: '#00ff41', color: '#000000' }}
              >
                Start Practice
              </button>
              <button
                onClick={() => setSelectedCode(null)}
                className="px-6 py-3 rounded-xl font-medium border transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
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
    </div>
  );
}
