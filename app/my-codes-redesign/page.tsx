'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserCheatCodes } from '@/lib/cheatcodes';
import { getUserProgress } from '@/lib/progress';
import ProgressCircles from '@/components/ProgressCircles';
import FeedbackButton from '@/components/FeedbackButton';
import FeedbackModal from '@/components/FeedbackModal';
import { DbCheatCode } from '@/lib/types';

interface CheatCode {
  id: string;
  title: string;
  category: string;
  timesUsed?: number;
  lastUsedDaysAgo?: number | null;
  isFavorite?: boolean;
  archived?: boolean;
  created_at?: string;
}

interface UserProgress {
  progress: number;
  chatCount: number;
}

export default function MyCodesRedesignPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [cheatCodes, setCheatCodes] = useState<CheatCode[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [todaysFocus, setTodaysFocus] = useState<CheatCode | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

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
        const transformedCodes: CheatCode[] = dbCodes.map((code: DbCheatCode) => {
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
            created_at: code.created_at
          };
        });
        setCheatCodes(transformedCodes);
      }

      // Load user progress
      const progress = await getUserProgress(supabase, user.id);
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

  // Calculate insights
  const activeCodes = cheatCodes.filter(c => !c.archived);
  const recentlyCreated = [...activeCodes].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  }).slice(0, 5);

  return (
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Sidebar Navigation */}
      <div
        className={`fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#000000' }}
      >
        {/* Header inside sidebar */}
        <div className="p-4 flex items-center gap-4">
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
          <div className="text-lg lg:text-xl font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE</div>
        </div>
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
              <span>My Codes (Redesign)</span>
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

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header - Always visible */}
          <div className="p-4 flex items-center gap-4 flex-shrink-0">
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
            <div className="text-xl" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE</div>
          </div>

          <div className="flex-1 px-8 pb-8 max-w-4xl mx-auto w-full">
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
                    onClick={() => router.push('/chat')}
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
                <Link href="/my-codes" className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {recentlyCreated.map((code) => (
                  <div
                    key={code.id}
                    onClick={() => router.push(`/my-codes?code=${code.id}`)}
                    className="rounded-2xl p-5 min-h-[140px] flex flex-col justify-between relative border transition-all cursor-pointer hover:scale-[1.02]"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      borderLeftWidth: (code.lastUsedDaysAgo ?? 0) > 2 ? '3px' : '1px',
                      borderLeftColor: (code.lastUsedDaysAgo ?? 0) > 2 ? '#fb923c' : 'var(--card-border)'
                    }}
                  >
                    {/* Badge indicators */}
                    {(code.lastUsedDaysAgo ?? 0) > 2 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(251, 146, 60, 0.25)', border: '1.5px solid #fb923c', color: '#fb923c' }}>
                        Practice
                      </div>
                    )}
                    {(code.timesUsed || 0) === 0 && (code.lastUsedDaysAgo ?? 0) <= 2 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(96, 165, 250, 0.25)', border: '1.5px solid #60a5fa', color: '#60a5fa' }}>
                        New
                      </div>
                    )}
                    {code.isFavorite && (
                      <div className="absolute top-3 right-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-color)">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </div>
                    )}

                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                      <h3 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {code.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--card-border)' }}>
                      <span className="font-medium">Completed {code.timesUsed || 0}x</span>
                    </div>
                  </div>
                ))}
              </div>
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
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative flex flex-col">
        {/* Header - Always visible */}
        <div className="p-4 flex items-center gap-4 flex-shrink-0">
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
          <div className="text-lg font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE</div>
        </div>

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
                onClick={() => router.push('/chat')}
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
              <Link href="/my-codes" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentlyCreated.map((code) => (
                <div
                  key={code.id}
                  onClick={() => router.push(`/my-codes?code=${code.id}`)}
                  className="rounded-2xl p-5 min-h-[140px] flex flex-col justify-between relative border transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    borderLeftWidth: (code.lastUsedDaysAgo ?? 0) > 2 ? '3px' : '1px',
                    borderLeftColor: (code.lastUsedDaysAgo ?? 0) > 2 ? '#fb923c' : 'var(--card-border)'
                  }}
                >
                  {/* Badge indicators */}
                  {(code.lastUsedDaysAgo ?? 0) > 2 && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(251, 146, 60, 0.25)', border: '1.5px solid #fb923c', color: '#fb923c' }}>
                      Practice
                    </div>
                  )}
                  {(code.timesUsed || 0) === 0 && (code.lastUsedDaysAgo ?? 0) <= 2 && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(96, 165, 250, 0.25)', border: '1.5px solid #60a5fa', color: '#60a5fa' }}>
                      New
                    </div>
                  )}
                  {code.isFavorite && (
                    <div className="absolute top-3 right-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-color)">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                  )}

                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    <h3 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {code.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--card-border)' }}>
                    <span className="font-medium">Completed {code.timesUsed || 0}x</span>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Floating Feedback Button */}
      <FeedbackButton />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}
