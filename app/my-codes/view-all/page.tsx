'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserCheatCodes, toggleFavoriteCheatCode } from '@/lib/cheatcodes';
import FeedbackButton from '@/components/FeedbackButton';

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
}

export default function ViewAllCodesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cheatCodes, setCheatCodes] = useState<CheatCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCode, setSelectedCode] = useState<CheatCode | null>(null);
  const router = useRouter();
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
            created_at: code.created_at
          };
        });
        setCheatCodes(transformedCodes);
      }
    };

    loadData();
  }, [supabase]);

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

  const formatLastSession = (daysAgo: number | null) => {
    if (daysAgo === null) return 'Never';
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
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

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative flex flex-col pt-16">
        {/* Search */}
        <div className="p-4 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
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
              onClick={() => router.push(`/my-codes?code=${code.id}`)}
              className="rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative border transition-all active:scale-[0.98]"
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
        <div className="flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto">
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
                    onClick={() => router.push(`/my-codes?code=${code.id}`)}
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

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
