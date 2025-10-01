'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CommunityTopics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayCount, setDisplayCount] = useState(10);
  const router = useRouter();

  const categories = ['All', 'Pre-Game', 'Off Court', 'Post-Game', 'In-Game', 'Locker Room'];

  const topics = [
    {
      id: 1,
      quote: "I get nervous at the free throw line when everyone's watching",
      context: "When all eyes are on you and your heart starts racing",
      stats: "247 players worked through this",
      trending: "HOT",
      category: "Pre-Game"
    },
    {
      id: 2,
      quote: "I want to lock in and stay in attack mode all game",
      context: "Maintaining that killer instinct for 4 quarters straight",
      stats: "198 players stayed aggressive",
      trending: null,
      category: "In-Game"
    },
    {
      id: 3,
      quote: "I lose confidence after I miss my first few shots",
      context: "When early misses spiral into a rough shooting night",
      stats: "156 players found their rhythm",
      trending: null,
      category: "In-Game",
      customStarter: "What's up? So you feel like you loose confidence after you miss your first few shots? How many misses does it take you to start feeling that way and what goes through your head?"
    },
    {
      id: 4,
      quote: "I want to play with confidence no matter who we're up against",
      context: "Bringing the same energy whether it's scrimmage or state finals",
      stats: "203 players found their swagger",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 5,
      quote: "I replay every mistake I made after games",
      context: "When your mind won't stop showing you the lowlights",
      stats: "134 players moved forward",
      trending: "NEW",
      category: "Post-Game"
    },
    {
      id: 6,
      quote: "I feel like my teammates don't really respect me",
      context: "Earning your place in the locker room hierarchy",
      stats: "108 players earned respect",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 7,
      quote: "My shot isn't falling and I'm completely in my head about it",
      context: "That shooting slump that just won't break",
      stats: "189 players found their stroke",
      trending: null,
      category: "In-Game"
    },
    {
      id: 8,
      quote: "Coach won't play me even though I'm grinding in practice",
      context: "Putting in work but still riding the bench",
      stats: "145 players changed the game",
      trending: null,
      category: "Off Court"
    },
    {
      id: 9,
      quote: "I want to become the loudest leader on the court",
      context: "Finding your voice and commanding respect",
      stats: "67 players stepped up",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 10,
      quote: "My parents are putting way too much pressure on me",
      context: "When the sideline stress hits harder than the defense",
      stats: "178 players found balance",
      trending: null,
      category: "Off Court"
    },
    // Additional Pre-Game topics
    {
      id: 11,
      quote: "I can't sleep the night before big games",
      context: "When your mind won't stop running plays at 2am",
      stats: "134 players got better rest",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 12,
      quote: "I overthink my pre-game routine and psych myself out",
      context: "When preparation becomes procrastination",
      stats: "89 players simplified their approach",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 13,
      quote: "I get intimidated by the other team's size and athleticism",
      context: "Walking into the gym and feeling outmatched",
      stats: "167 players found their edge",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 14,
      quote: "I put too much pressure on myself to have perfect games",
      context: "Setting impossible standards before tip-off",
      stats: "212 players embraced imperfection",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 15,
      quote: "I worry about disappointing my teammates before games",
      context: "Carrying the weight of others' expectations",
      stats: "145 players played freely",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 16,
      quote: "I get stuck in my head during warm-ups",
      context: "When shots aren't falling in practice and doubt creeps in",
      stats: "78 players stayed confident",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 17,
      quote: "I feel like I need to prove myself every single game",
      context: "The pressure to validate your spot on the team",
      stats: "156 players played with freedom",
      trending: null,
      category: "Pre-Game"
    },
    {
      id: 18,
      quote: "I compare myself to other players before games start",
      context: "Measuring yourself against the competition",
      stats: "123 players focused inward",
      trending: null,
      category: "Pre-Game"
    },
    // Additional In-Game topics
    {
      id: 19,
      quote: "I make one mistake and it ruins my whole game",
      context: "When a single error snowballs into disaster",
      stats: "234 players bounced back",
      trending: null,
      category: "In-Game"
    },
    {
      id: 20,
      quote: "I get frustrated when my teammates make bad plays",
      context: "Staying composed when others struggle",
      stats: "167 players stayed locked in",
      trending: null,
      category: "In-Game"
    },
    {
      id: 21,
      quote: "The crowd noise throws off my concentration",
      context: "When the environment becomes overwhelming",
      stats: "89 players tuned out distractions",
      trending: null,
      category: "In-Game"
    },
    {
      id: 22,
      quote: "I play scared when we have a big lead",
      context: "Protecting instead of attacking",
      stats: "145 players stayed aggressive",
      trending: null,
      category: "In-Game"
    },
    {
      id: 23,
      quote: "I can't handle when refs make bad calls against me",
      context: "When officiating affects your mental game",
      stats: "198 players stayed focused",
      trending: null,
      category: "In-Game"
    },
    {
      id: 24,
      quote: "I get tired and my decision-making falls apart",
      context: "Mental fatigue in crucial moments",
      stats: "112 players stayed sharp",
      trending: null,
      category: "In-Game"
    },
    {
      id: 25,
      quote: "I freeze up when coach calls a play for me",
      context: "The pressure of being the go-to option",
      stats: "87 players stepped up",
      trending: null,
      category: "In-Game"
    },
    {
      id: 26,
      quote: "I play differently when scouts are watching",
      context: "Performing under recruiting pressure",
      stats: "134 players stayed natural",
      trending: null,
      category: "In-Game"
    },
    // Additional Post-Game topics
    {
      id: 27,
      quote: "I beat myself up for days after bad performances",
      context: "When losses follow you home",
      stats: "156 players learned to reset",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 28,
      quote: "I can't enjoy wins because I only see what went wrong",
      context: "Perfectionism stealing your joy",
      stats: "89 players celebrated progress",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 29,
      quote: "I avoid watching film because it's too painful",
      context: "When self-analysis becomes self-torture",
      stats: "123 players embraced growth",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 30,
      quote: "I get angry and take it out on my family after losses",
      context: "Bringing the frustration home",
      stats: "78 players found healthy outlets",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 31,
      quote: "I compare my stats to everyone else's after games",
      context: "When numbers become your worth",
      stats: "167 players focused on impact",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 32,
      quote: "I lie awake replaying every possession",
      context: "When your mind won't let the game end",
      stats: "145 players found peace",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 33,
      quote: "I feel guilty when we lose and I played well",
      context: "Individual success in team failure",
      stats: "112 players balanced perspective",
      trending: null,
      category: "Post-Game"
    },
    {
      id: 34,
      quote: "I make excuses instead of owning my mistakes",
      context: "Protecting your ego instead of growing",
      stats: "134 players took ownership",
      trending: null,
      category: "Post-Game"
    },
    // Additional Locker Room topics
    {
      id: 35,
      quote: "I don't know how to handle conflict with teammates",
      context: "When team chemistry gets rocky",
      stats: "89 players improved relationships",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 36,
      quote: "I feel left out of the team's inner circle",
      context: "Being on the outside looking in",
      stats: "123 players found their place",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 37,
      quote: "I struggle to give constructive feedback to teammates",
      context: "Leading without creating enemies",
      stats: "67 players became better leaders",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 38,
      quote: "I take team criticism too personally",
      context: "When feedback feels like attacks",
      stats: "156 players grew thicker skin",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 39,
      quote: "I don't know how to motivate teammates who've given up",
      context: "Lifting others when they're down",
      stats: "78 players inspired change",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 40,
      quote: "I feel like I have to choose sides in team drama",
      context: "Navigating locker room politics",
      stats: "145 players stayed neutral",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 41,
      quote: "I'm intimidated by the veteran players",
      context: "Earning respect from the established guys",
      stats: "134 players found their voice",
      trending: null,
      category: "Locker Room"
    },
    {
      id: 42,
      quote: "I don't know how to celebrate without being cocky",
      context: "Balancing confidence with humility",
      stats: "89 players found the balance",
      trending: null,
      category: "Locker Room"
    },
    // Additional Off Court topics
    {
      id: 43,
      quote: "I'm worried about my basketball future after high school",
      context: "Uncertainty about the next level",
      stats: "167 players found clarity",
      trending: null,
      category: "Off Court"
    },
    {
      id: 44,
      quote: "I struggle to balance basketball with school and social life",
      context: "When the game takes over everything",
      stats: "123 players found balance",
      trending: null,
      category: "Off Court"
    },
    {
      id: 45,
      quote: "I feel like I'm not improving fast enough",
      context: "Impatience with your development",
      stats: "198 players trusted the process",
      trending: null,
      category: "Off Court"
    },
    {
      id: 46,
      quote: "I compare my recruiting situation to my teammates",
      context: "When others get the offers you want",
      stats: "112 players focused on their journey",
      trending: null,
      category: "Off Court"
    }
  ];


  const handleTopicSelect = (topic: any) => {
    // Store in localStorage and navigate immediately
    localStorage.setItem('selectedTopic', JSON.stringify({
      id: topic.id,
      title: topic.quote,
      description: topic.context,
      customStarter: topic.customStarter || null
    }));

    // Store where the user came from for proper back navigation
    localStorage.setItem('chatReferrer', '/community-topics');

    // Navigate to chat immediately
    router.push('/chat');
  };


  const getTopicCardClasses = (topic: any) => {
    return 'relative p-5 rounded-2xl border transition-all cursor-pointer bg-white/[0.03] border-white/15 hover:bg-white/8 active:scale-98 hover:scale-[1.02]';
  };

  const getDesktopTopicCardClasses = (topic: any) => {
    return 'relative p-6 rounded-2xl border transition-all cursor-pointer bg-white/[0.03] border-white/15 hover:bg-white/8 hover:scale-[1.02]';
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return topics.length;
    return topics.filter(topic => topic.category === category).length;
  };

  const getFilteredTopics = () => {
    let filteredTopics = activeCategory === 'All'
      ? topics
      : topics.filter(topic => topic.category === activeCategory);

    // For "All" category, only show the specified display count
    if (activeCategory === 'All') {
      return filteredTopics.slice(0, displayCount);
    }

    return filteredTopics;
  };

  const hasMoreTopics = () => {
    return activeCategory === 'All' && displayCount < topics.length;
  };

  const loadMoreTopics = () => {
    setDisplayCount(prev => Math.min(prev + 10, topics.length));
  };

  // Reset display count when category changes
  useEffect(() => {
    setDisplayCount(10);
  }, [activeCategory]);

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
          {getFilteredTopics().map((topic) => (
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

          {/* Load More Link - Only show for "All" category when there are more topics */}
          {hasMoreTopics() && (
            <div className="text-center py-4">
              <button
                onClick={loadMoreTopics}
                className="px-4 py-2 border border-zinc-600 text-white text-sm rounded-lg cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-all"
              >
                Load more
              </button>
            </div>
          )}

          {/* Custom Topic Card */}
          <div
            onClick={handleStartBlankChat}
            className="bg-white/5 border-2 border-dashed border-white/30 rounded-2xl p-6 flex flex-col items-center text-center transition-all cursor-pointer active:scale-98 hover:bg-white/8"
          >
            <div className="text-3xl mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div className={`absolute top-0 left-0 h-full w-64 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="pt-20"></div>

          <nav className="flex-1">
            <div>
              <Link href="/" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/my-codes" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/waitlist" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Early Access</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/chat-history" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Chat History</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/profile" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
            {getFilteredTopics().map((topic) => (
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

            {/* Load More Link - Only show for "All" category when there are more topics */}
            {hasMoreTopics() && (
              <div className="text-center py-6">
                <button
                  onClick={loadMoreTopics}
                  className="px-6 py-3 border border-zinc-600 text-white text-sm rounded-lg cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-all"
                >
                  Load more
                </button>
              </div>
            )}

            {/* Custom Topic Card */}
            <div
              onClick={handleStartBlankChat}
              className="bg-white/5 border-2 border-dashed border-white/30 rounded-2xl p-8 flex flex-col items-center text-center transition-all cursor-pointer hover:scale-[1.02] hover:bg-white/8"
            >
              <div className="text-4xl mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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