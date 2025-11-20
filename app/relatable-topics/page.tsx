'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FeedbackButton from '@/components/FeedbackButton';
import FeedbackModal from '@/components/FeedbackModal';
import { DbChat } from '@/lib/types';

export default function RelatableTopics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayCount, setDisplayCount] = useState(10);
  const [usedTopicIds, setUsedTopicIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Load user's chat history to track which topics have been used
  useEffect(() => {
    const loadUsedTopics = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all chats for this user
      const { data: chats } = await supabase
        .from('chats')
        .select('id, user_id, messages, created_at, updated_at, selected_topic')
        .eq('user_id', user.id);

      if (chats) {
        // Extract topic IDs from chats
        const topicIds = new Set<number>();
        chats.forEach((chat: DbChat) => {
          if (chat.selected_topic && 'id' in chat.selected_topic && typeof chat.selected_topic.id === 'number') {
            topicIds.add(chat.selected_topic.id);
          }
        });
        setUsedTopicIds(topicIds);
      }
    };

    loadUsedTopics();
  }, [supabase]);

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
      customStarter: "Ahh, this is something a lot of players deal with. Don't worry, we'll create a cheat code so misses don't get in your head. Tell me, how many misses does it take before you feel that way, and what's going through your mind?"
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
      category: "Post-Game",
      customStarter: "Great topic choice, you're not alone!  What kind of mistakes do you replay in your mind? I'll help you grow from them instead of letting them keep you down."
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


  const handleTopicSelect = (topic: { id: number; quote: string; context: string; customStarter?: string }) => {
    // Clear any existing chat history to prevent loading old messages
    localStorage.removeItem('chatHistory');

    // Store in localStorage and navigate immediately
    localStorage.setItem('selectedTopic', JSON.stringify({
      id: topic.id,
      title: topic.quote,
      description: topic.context,
      customStarter: topic.customStarter || null
    }));

    // Store where the user came from for proper back navigation
    localStorage.setItem('chatReferrer', '/relatable-topics');

    // Navigate to chat immediately
    router.push('/chat');
  };



  const getCategoryCount = (category: string) => {
    if (category === 'All') return topics.length;
    return topics.filter(topic => topic.category === category).length;
  };

  const getFilteredTopics = () => {
    let filteredTopics = activeCategory === 'All'
      ? topics
      : topics.filter(topic => topic.category === activeCategory);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTopics = filteredTopics.filter(topic =>
        topic.quote.toLowerCase().includes(query) ||
        topic.context.toLowerCase().includes(query) ||
        topic.category.toLowerCase().includes(query)
      );
    }

    // For "All" category, only show the specified display count (unless searching)
    if (activeCategory === 'All' && !searchQuery.trim()) {
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
    localStorage.setItem('chatReferrer', '/relatable-topics');
    // Navigate to blank chat
    router.push('/chat');
  };

  return (
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Mobile & Desktop Header with Menu */}
      <div className="absolute top-0 left-0 right-0 px-4 lg:px-6 py-4 lg:py-5 flex items-center gap-4 z-20">
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
        <div className="text-lg lg:text-xl font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
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
            <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
            </Link>
            <Link href="/relatable-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
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

      {/* Mobile Footer - Floating Chat Button */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        <button onClick={handleStartBlankChat} className="w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {/* Desktop Footer - Floating Chat Button */}
      <div className="fixed bottom-16 right-8 z-50 hidden lg:block">
        <button onClick={handleStartBlankChat} className="w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-h-screen px-4 pt-20 pb-8 max-w-4xl mx-auto lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Relatable Topics</div>
          <div className="text-base lg:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Real thoughts from real players. Pick what hits home, and create a cheat code.</div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#808080' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics..."
              className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none transition-all"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: '#808080' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 lg:gap-3 mb-8 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="px-4 lg:px-6 py-2 lg:py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 lg:gap-3"
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

        {/* Topics List */}
        <div className="space-y-4 lg:space-y-6">
          {getFilteredTopics().length === 0 ? (
            <div className="text-center py-16 lg:py-20">
              <div className="text-5xl lg:text-6xl mb-4">🔍</div>
              <div className="text-xl lg:text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No topics found
              </div>
              <div className="text-sm lg:text-base" style={{ color: 'var(--text-secondary)' }}>
                {searchQuery ? 'Try adjusting your search or select a different category' : 'Try selecting a different category'}
              </div>
            </div>
          ) : (
            <>
              {getFilteredTopics().map((topic) => (
            <div key={topic.id} className="relative">
              <div
                onClick={() => handleTopicSelect(topic)}
                className="relative rounded-2xl p-6 lg:p-8 transition-all cursor-pointer hover:scale-[1.01] active:scale-98 border-2"
                style={{
                  backgroundColor: usedTopicIds.has(topic.id) ? 'rgba(0, 255, 65, 0.08)' : 'var(--card-bg)',
                  borderColor: usedTopicIds.has(topic.id) ? 'rgba(0, 255, 65, 0.3)' : 'var(--card-border)'
                }}
              >
                {/* Trending Badge (top-right) - only show if no completed badge */}
                {topic.trending && !usedTopicIds.has(topic.id) && (
                  <div className="absolute top-3 lg:top-4 right-3 lg:right-4 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
                    {topic.trending}
                  </div>
                )}

                {/* Completed Badge (top-right) */}
                {usedTopicIds.has(topic.id) && (
                  <div className="absolute top-4 lg:top-5 right-4 lg:right-5 w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 65, 0.3)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                )}

                <div className="text-lg lg:text-xl font-semibold mb-2 leading-tight pr-16 lg:pr-20" style={{ color: 'var(--text-primary)', opacity: usedTopicIds.has(topic.id) ? 0.5 : 1 }}>
                  "{topic.quote}"
                </div>
                <div className="text-xs uppercase tracking-wide mb-3 lg:mb-4" style={{ color: 'var(--text-secondary)', opacity: usedTopicIds.has(topic.id) ? 0.5 : 1 }}>
                  {topic.category}
                </div>
                {/* Description with inline green dot - social proof text hidden until we have real users */}
                <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)', opacity: usedTopicIds.has(topic.id) ? 0.5 : 1 }}>
                  <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--accent-color)' }}></div>
                  <div className="leading-relaxed">
                    {topic.context}
                    {/* <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>{topic.stats}</span> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
            </>
          )}

          {/* Load More Button */}
          {hasMoreTopics() && (
            <div className="text-center py-4 lg:py-6">
              <button
                onClick={loadMoreTopics}
                className="px-6 py-3 border text-sm rounded-lg cursor-pointer transition-all"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)', backgroundColor: 'var(--card-bg)' }}
              >
                Load more
              </button>
            </div>
          )}

          {/* Custom Topic Card */}
          <div
            onClick={handleStartBlankChat}
            className="border-2 border-dashed rounded-2xl p-6 lg:p-8 flex flex-col items-center text-center transition-all cursor-pointer hover:scale-[1.01] active:scale-98"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: 0.8 }}
          >
            <div className="mb-3 lg:mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="lg:w-10 lg:h-10" style={{ color: 'var(--accent-color)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3" style={{ color: 'var(--text-primary)' }}>Something else on your mind?</div>
            <div className="text-sm lg:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Start a custom chat about whatever's real for you right now</div>
          </div>
        </div>
      </div>

      {/* Floating Feedback Button */}
      <FeedbackButton />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}
