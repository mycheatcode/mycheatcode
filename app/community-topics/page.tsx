'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CommunityTopics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isPremiumUser, setIsPremiumUser] = useState(false); // Mock premium status
  const router = useRouter();

  const categories = ['All', 'Pre-Game', 'Off Court', 'Post-Game', 'In-Game', 'Locker Room'];

  const topics = [
    {
      id: 1,
      quote: "I get nervous at the free throw line when everyone's watching",
      context: "When all eyes are on you and your heart starts racing",
      stats: "247 players worked through this",
      trending: "HOT",
      premium: false,
      category: "Pre-Game"
    },
    {
      id: 2,
      quote: "My shot isn't falling and I'm completely in my head about it",
      context: "That shooting slump that just won't break",
      stats: "189 players found their rhythm",
      trending: null,
      premium: false,
      category: "In-Game"
    },
    {
      id: 3,
      quote: "Coach won't play me even though I'm grinding in practice",
      context: "Putting in work but still riding the bench",
      stats: "156 players changed the game",
      trending: null,
      premium: false,
      category: "Off Court"
    },
    {
      id: 4,
      quote: "My parents are putting way too much pressure on me",
      context: "When the sideline stress hits harder than the defense",
      stats: "203 players found peace",
      trending: null,
      premium: true,
      category: "Off Court"
    },
    {
      id: 5,
      quote: "I choke in clutch time when the game's on the line",
      context: "Fourth quarter and your mind goes blank",
      stats: "92 players built ice veins",
      trending: "NEW",
      premium: false,
      category: "In-Game"
    },
    {
      id: 6,
      quote: "I can't sleep the night before games",
      context: "When your mind won't stop running plays at 2am",
      stats: "134 players got better rest",
      trending: null,
      premium: false,
      category: "Pre-Game"
    },
    {
      id: 7,
      quote: "My teammates don't pass me the ball",
      context: "Feeling frozen out of the offense",
      stats: "108 players got involved",
      trending: null,
      premium: false,
      category: "Locker Room"
    },
    {
      id: 8,
      quote: "I just became team captain and I'm stressed about leading",
      context: "Leading when you're still figuring it out yourself",
      stats: "67 captains leveled up",
      trending: null,
      premium: true,
      category: "Locker Room"
    },
    {
      id: 9,
      quote: "I lost my starting spot and I don't know how to bounce back",
      context: "From starter to bench - finding your way back",
      stats: "145 players earned it back",
      trending: null,
      premium: false,
      category: "Post-Game"
    },
    {
      id: 10,
      quote: "The refs are terrible and it's getting in my head",
      context: "When bad calls throw off your whole game",
      stats: "178 players stayed locked in",
      trending: null,
      premium: false,
      category: "In-Game"
    }
  ];


  const handleTopicSelect = (topic: any) => {
    if (topic.premium && !isPremiumUser) {
      // Show locked state for premium topics
      return;
    }

    // Store in localStorage and navigate immediately
    localStorage.setItem('selectedTopic', JSON.stringify({
      id: topic.id,
      title: topic.quote,
      description: topic.context
    }));

    // Store where the user came from for proper back navigation
    localStorage.setItem('chatReferrer', '/community-topics');

    // Navigate to chat immediately
    router.push('/chat');
  };


  const getTopicCardClasses = (topic: any) => {
    const isLocked = topic.premium && !isPremiumUser;

    let baseClasses = 'relative p-5 rounded-2xl border transition-all cursor-pointer ';

    if (isLocked) {
      baseClasses += 'opacity-50 ';
    } else if (topic.premium) {
      baseClasses += 'bg-white/5 border-white/25 hover:bg-white/8 active:scale-98 hover:scale-[1.02] ';
    } else {
      baseClasses += 'bg-white/[0.03] border-white/15 hover:bg-white/8 active:scale-98 hover:scale-[1.02] ';
    }

    return baseClasses;
  };

  const getDesktopTopicCardClasses = (topic: any) => {
    const isLocked = topic.premium && !isPremiumUser;

    let baseClasses = 'relative p-6 rounded-2xl border transition-all cursor-pointer ';

    if (isLocked) {
      baseClasses += 'opacity-50 ';
    } else if (topic.premium) {
      baseClasses += 'bg-white/5 border-white/25 hover:bg-white/8 hover:scale-[1.02] ';
    } else {
      baseClasses += 'bg-white/[0.03] border-white/15 hover:bg-white/8 hover:scale-[1.02] ';
    }

    return baseClasses;
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return topics.length;
    return topics.filter(topic => topic.category === category).length;
  };

  const handleStartBlankChat = () => {
    // Clear any stored topic data
    localStorage.removeItem('selectedTopic');
    // Store where the user came from for proper back navigation
    localStorage.setItem('chatReferrer', '/community-topics');
    // Navigate to blank chat
    router.push('/chat');
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Mobile Design */}
      <div className="lg:hidden bg-black min-h-screen relative pb-[68px] overflow-y-auto">
        {/* Header */}
        <div className="p-4 bg-black border-b border-zinc-800">
          {/* App Title */}
          <div className="flex items-center justify-center relative mb-4">
            <div className="text-lg font-semibold text-white">mycheatcode.ai</div>
            <div className="absolute right-0 w-6 h-6 flex items-center justify-center text-zinc-500 cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="w-8 h-8 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </Link>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
              </svg>
              <span className="text-xs text-white font-semibold">5 DAY STREAK</span>
            </div>
          </div>

          {/* Page Title */}
          <div className="text-[1.8em] font-bold text-white mb-2">Relatable Topics</div>
          <div className="text-zinc-400 text-sm leading-relaxed">Real thoughts from real players. Pick what hits home, and create a cheat code.</div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 p-4 pb-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const getCategoryColors = () => {
              if (category === 'All') return 'bg-white/5 border border-white/10 active:scale-95';
              if (category === 'Pre-Game') return 'bg-red-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'Off Court') return 'bg-orange-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'Post-Game') return 'bg-yellow-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'In-Game') return 'bg-green-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'Locker Room') return 'bg-blue-800/[0.075] border border-white/10 active:scale-95';
              return 'bg-white/5 border border-white/10 active:scale-95';
            };

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category
                    ? 'bg-white text-black'
                    : `${getCategoryColors()} text-zinc-300`
                }`}
              >
                <span>{category}</span>
                <span className={`text-xs ${
                  activeCategory === category
                    ? 'text-black/70'
                    : 'text-zinc-500'
                }`}>
                  {getCategoryCount(category)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Topics List */}
        <div className="px-4 pb-4 space-y-3">
          {topics.filter(topic => activeCategory === 'All' || topic.category === activeCategory).map((topic) => (
            <div
              key={topic.id}
              onClick={() => handleTopicSelect(topic)}
              className={getTopicCardClasses(topic)}
            >
              {topic.trending && (
                <div className="absolute top-3 right-3 bg-yellow-300 text-black px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                  {topic.trending}
                </div>
              )}
              {topic.premium && (
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  isPremiumUser
                    ? 'bg-gradient-to-r from-white to-zinc-300 text-black'
                    : 'bg-zinc-700 text-zinc-300 border border-zinc-600'
                }`}>
                  {isPremiumUser ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  )}
                  PRO
                </div>
              )}

              <div className="text-lg font-semibold text-white mb-1 leading-tight pr-16">
                "{topic.quote}"
              </div>
              <div className="text-zinc-400 text-xs uppercase tracking-wide mb-3">
                {topic.category}
              </div>
              <div className="text-zinc-500 text-sm mb-3 leading-relaxed">
                {topic.context}
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <span>{topic.stats}</span>
              </div>
            </div>
          ))}

          {/* Custom Topic Card */}
          <div
            onClick={handleStartBlankChat}
            className="bg-white/5 border-2 border-dashed border-white/30 rounded-2xl p-6 flex flex-col items-center text-center transition-all cursor-pointer active:scale-98 hover:bg-white/8"
          >
            <div className="text-3xl mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 4c1.1 0 2.1.3 3 .8 1.7-.5 3.5.2 4.6 1.9.4-.1.8-.2 1.2-.2 1.7 0 3.2 1.4 3.2 3.2 0 .4-.1.8-.2 1.1.7.8 1.1 1.9 1.1 3.1 0 2.2-1.8 4-4 4H5c-2.2 0-4-1.8-4-4 0-1.5.8-2.8 2-3.5-.1-.3-.1-.6-.1-.9 0-2.2 1.8-4 4-4 .4 0 .8.1 1.2.2C9.2 4.6 10.5 4 12 4z"/>
                <circle cx="8" cy="19" r="1.2"/>
                <circle cx="5" cy="22" r="0.8"/>
              </svg>
            </div>
            <div className="text-xl font-bold text-white mb-2">Something else on your mind?</div>
            <div className="text-zinc-400 text-sm leading-relaxed">Start a custom chat about whatever's real for you right now</div>
          </div>
        </div>


      </div>

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header with Menu Button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 z-20 bg-black">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-white text-xl font-bold">mycheatcode.ai</div>
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
              <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg text-white font-medium">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Topics</span>
              </div>
              <div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg cursor-pointer transition-colors">
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

        {/* Main Content */}
        <div className="flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/" className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </Link>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                </svg>
                <span className="text-sm text-white font-semibold">5 DAY STREAK</span>
              </div>
            </div>

            <div className="text-4xl font-bold text-white mb-4">Relatable Topics</div>
            <div className="text-zinc-400 text-lg leading-relaxed">Real thoughts from real players. Pick what hits home, and create a cheat code.</div>
          </div>

          {/* Categories Filter */}
          <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
            {categories.map((category, index) => {
              const getCategoryColors = () => {
                if (category === 'All') return 'bg-white/5 border border-white/10 hover:bg-white/10';
                if (category === 'Pre-Game') return 'bg-red-500/[0.075] border border-white/10 hover:bg-red-500/[0.125]';
                if (category === 'Off Court') return 'bg-orange-500/[0.075] border border-white/10 hover:bg-orange-500/[0.125]';
                if (category === 'Post-Game') return 'bg-yellow-500/[0.075] border border-white/10 hover:bg-yellow-500/[0.125]';
                if (category === 'In-Game') return 'bg-green-500/[0.075] border border-white/10 hover:bg-green-500/[0.125]';
                if (category === 'Locker Room') return 'bg-blue-800/[0.075] border border-white/10 hover:bg-blue-800/[0.125]';
                return 'bg-white/5 border border-white/10 hover:bg-white/10';
              };

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-3 ${
                    activeCategory === category
                      ? 'bg-white text-black'
                      : `${getCategoryColors()} text-zinc-300`
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-xs ${
                    activeCategory === category
                      ? 'text-black/70'
                      : 'text-zinc-500'
                  }`}>
                    {getCategoryCount(category)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 gap-6">
            {topics.filter(topic => activeCategory === 'All' || topic.category === activeCategory).map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className={getDesktopTopicCardClasses(topic)}
              >
                {topic.trending && (
                  <div className="absolute top-4 right-4 bg-yellow-300 text-black px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide">
                    {topic.trending}
                  </div>
                )}
                {topic.premium && (
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isPremiumUser
                      ? 'bg-gradient-to-r from-white to-zinc-300 text-black'
                      : 'bg-zinc-700 text-zinc-300 border border-zinc-600'
                  }`}>
                    {isPremiumUser ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    )}
                    PRO
                  </div>
                )}

                <div className="text-xl font-semibold text-white mb-2 leading-tight pr-20">
                  "{topic.quote}"
                </div>
                <div className="text-zinc-400 text-xs uppercase tracking-wide mb-4">
                  {topic.category}
                </div>
                <div className="text-zinc-400 text-sm mb-4 leading-relaxed">
                  {topic.context}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <span>{topic.stats}</span>
                </div>
              </div>
            ))}

            {/* Custom Topic Card */}
            <div
              onClick={handleStartBlankChat}
              className="bg-white/5 border-2 border-dashed border-white/30 rounded-2xl p-8 flex flex-col items-center text-center transition-all cursor-pointer hover:scale-[1.02] hover:bg-white/8"
            >
              <div className="text-4xl mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <path d="M12 4c1.1 0 2.1.3 3 .8 1.7-.5 3.5.2 4.6 1.9.4-.1.8-.2 1.2-.2 1.7 0 3.2 1.4 3.2 3.2 0 .4-.1.8-.2 1.1.7.8 1.1 1.9 1.1 3.1 0 2.2-1.8 4-4 4H5c-2.2 0-4-1.8-4-4 0-1.5.8-2.8 2-3.5-.1-.3-.1-.6-.1-.9 0-2.2 1.8-4 4-4 .4 0 .8.1 1.2.2C9.2 4.6 10.5 4 12 4z"/>
                  <circle cx="8" cy="19" r="1.2"/>
                  <circle cx="5" cy="22" r="0.8"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-white mb-3">Something else on your mind?</div>
              <div className="text-zinc-400 leading-relaxed">Start a custom chat about whatever's real for you right now</div>
            </div>
          </div>

        </div>

        {/* Desktop Footer */}
        <div className="fixed bottom-16 right-8 hidden lg:block">
          <button onClick={handleStartBlankChat} className="bg-white text-black w-16 h-16 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Footer Navigation - Same as Chat History */}
      <div className="fixed bottom-20 right-4 lg:hidden">
        <button onClick={handleStartBlankChat} className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}