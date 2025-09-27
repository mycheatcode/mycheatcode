'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserSessionManager } from '../utils/userSession';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  type: 'topic' | 'custom';
  topicId?: string;
  messageCount: number;
  lastMessage: string;
  createdAt: Date;
  updatedAt: Date;
  hasCheatCode: boolean;
  category?: string;
  messages: Message[];
  selectedTopic?: any;
  archived?: boolean;
}

export default function ChatHistory() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previousPage, setPreviousPage] = useState('/');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Track the previous page
  useEffect(() => {
    const referrer = document.referrer;
    if (referrer && referrer !== window.location.href) {
      const url = new URL(referrer);
      setPreviousPage(url.pathname);
    }
  }, []);

  const filters = ['All', 'With Cheat Codes', 'Topics', 'Custom', 'Recent', 'Archived'];

  // Initialize chat sessions data
  useEffect(() => {
    // Load real user chat sessions
    const userSessions = UserSessionManager.getUserChatSessions();

    // If no real sessions exist, show sample data for demonstration
    const initialChatSessions: ChatSession[] = userSessions.length > 0 ? userSessions : [
    {
      id: '1',
      title: 'Free throw line nerves',
      type: 'topic',
      topicId: '1',
      messageCount: 12,
      lastMessage: 'Try the 4-4-4 breathing technique before each shot...',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:05:00'),
      hasCheatCode: true,
      category: 'Pre-Game',
      selectedTopic: {
        id: '1',
        title: 'I get nervous at the free throw line when everyone\'s watching',
        description: 'When all eyes are on you and your heart starts racing'
      },
      messages: [
        {
          id: 1,
          text: 'I see you\'re dealing with: "I get nervous at the free throw line when everyone\'s watching". This is really common, and we can definitely work through this together. Let\'s start by understanding what\'s happening in those moments. Can you walk me through what it feels like when this happens?',
          sender: 'coach',
          timestamp: new Date('2024-01-15T10:00:00')
        },
        {
          id: 2,
          text: 'My heart starts racing and my hands get sweaty. I can hear everyone in the stands and I start thinking about missing the shot.',
          sender: 'user',
          timestamp: new Date('2024-01-15T10:02:00')
        },
        {
          id: 3,
          text: 'That makes perfect sense. Your body is responding to the pressure with a fight-or-flight response. Let\'s work on a technique to help you regain control in those moments. Try the 4-4-4 breathing technique before each shot...',
          sender: 'coach',
          timestamp: new Date('2024-01-15T10:05:00')
        }
      ]
    },
    {
      id: '2',
      title: 'Dealing with coach feedback',
      type: 'custom',
      messageCount: 8,
      lastMessage: 'Remember, feedback is just information to help you grow...',
      createdAt: new Date('2024-01-14T14:00:00'),
      updatedAt: new Date('2024-01-14T14:05:00'),
      hasCheatCode: false,
      category: 'Off Court',
      messages: [
        {
          id: 1,
          text: 'Hey! I\'m your personal mental performance coach. I\'m here to help you build a custom cheat code for whatever\'s on your mind. What\'s going on in your game right now?',
          sender: 'coach',
          timestamp: new Date('2024-01-14T14:00:00')
        },
        {
          id: 2,
          text: 'My coach is constantly giving me feedback and corrections, and I\'m starting to feel like I can\'t do anything right.',
          sender: 'user',
          timestamp: new Date('2024-01-14T14:02:00')
        },
        {
          id: 3,
          text: 'I understand how that can feel overwhelming. Remember, feedback is just information to help you grow...',
          sender: 'coach',
          timestamp: new Date('2024-01-14T14:05:00')
        }
      ]
    },
    {
      id: '3',
      title: 'Shot not falling today',
      type: 'topic',
      topicId: '2',
      messageCount: 15,
      lastMessage: 'Focus on your form fundamentals and trust your mechanics...',
      createdAt: new Date('2024-01-13T12:00:00'),
      updatedAt: new Date('2024-01-14T15:30:00'),
      hasCheatCode: true,
      category: 'In-Game',
      selectedTopic: {
        id: '2',
        title: 'My shot isn\'t falling and I\'m completely in my head about it',
        description: 'That shooting slump that just won\'t break'
      },
      messages: [
        {
          id: 1,
          text: 'I see you\'re dealing with: "My shot isn\'t falling and I\'m completely in my head about it". This is really common, and we can definitely work through this together. Let\'s start by understanding what\'s happening in those moments. Can you walk me through what it feels like when this happens?',
          sender: 'coach',
          timestamp: new Date('2024-01-13T12:00:00')
        },
        {
          id: 2,
          text: 'I\'ve missed like 8 shots in a row and now I\'m overthinking everything. My form, my follow through, everything feels off.',
          sender: 'user',
          timestamp: new Date('2024-01-13T12:02:00')
        },
        {
          id: 3,
          text: 'That\'s exactly what happens when we get in our heads. Your body knows how to shoot - you\'ve made thousands of shots before. Focus on your form fundamentals and trust your mechanics...',
          sender: 'coach',
          timestamp: new Date('2024-01-13T12:05:00')
        }
      ]
    },
    {
      id: '4',
      title: 'Building confidence after bad game',
      type: 'custom',
      messageCount: 6,
      lastMessage: 'Every great player has off games. What matters is how you bounce back...',
      createdAt: new Date('2024-01-12T16:00:00'),
      updatedAt: new Date('2024-01-12T16:30:00'),
      hasCheatCode: false,
      category: 'Post-Game',
      messages: [
        {
          id: 1,
          text: 'Hey! I\'m your personal mental performance coach. I\'m here to help you build a custom cheat code for whatever\'s on your mind. What\'s going on in your game right now?',
          sender: 'coach',
          timestamp: new Date('2024-01-12T16:00:00')
        },
        {
          id: 2,
          text: 'I had a really bad game yesterday. Went 2 for 12 from the field and had 5 turnovers. I can\'t stop thinking about it.',
          sender: 'user',
          timestamp: new Date('2024-01-12T16:02:00')
        },
        {
          id: 3,
          text: 'I understand how that feels - those tough games can really stick with us. Every great player has off games. What matters is how you bounce back...',
          sender: 'coach',
          timestamp: new Date('2024-01-12T16:05:00')
        }
      ]
    },
    {
      id: '5',
      title: 'Old practice routine thoughts',
      type: 'custom',
      messageCount: 4,
      lastMessage: 'Maybe I should try a different approach to warm-up...',
      createdAt: new Date('2024-01-01T10:00:00'),
      updatedAt: new Date('2024-01-01T10:15:00'),
      hasCheatCode: false,
      category: 'Off Court',
      archived: true,
      messages: [
        {
          id: 1,
          text: 'Hey! I\'m your personal mental performance coach. I\'m here to help you build a custom cheat code for whatever\'s on your mind. What\'s going on in your game right now?',
          sender: 'coach',
          timestamp: new Date('2024-01-01T10:00:00')
        },
        {
          id: 2,
          text: 'I think my warm-up routine before practice might not be working for me anymore.',
          sender: 'user',
          timestamp: new Date('2024-01-01T10:02:00')
        },
        {
          id: 3,
          text: 'Maybe I should try a different approach to warm-up...',
          sender: 'coach',
          timestamp: new Date('2024-01-01T10:15:00')
        }
      ]
    }
  ];

    setChatSessions(initialChatSessions);
  }, []);

  const getFilteredChats = () => {
    let filtered = chatSessions;

    // Filter by type
    if (activeFilter === 'With Cheat Codes') {
      filtered = filtered.filter(chat => chat.hasCheatCode && !chat.archived);
    } else if (activeFilter === 'Topics') {
      filtered = filtered.filter(chat => chat.type === 'topic' && !chat.archived);
    } else if (activeFilter === 'Custom') {
      filtered = filtered.filter(chat => chat.type === 'custom' && !chat.archived);
    } else if (activeFilter === 'Recent') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter(chat => chat.updatedAt >= threeDaysAgo && !chat.archived);
    } else if (activeFilter === 'Archived') {
      filtered = filtered.filter(chat => chat.archived);
    } else if (activeFilter === 'All') {
      filtered = filtered.filter(chat => !chat.archived);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-zinc-600';
    if (category === 'Pre-Game') return 'bg-red-500';
    if (category === 'Off Court') return 'bg-orange-500';
    if (category === 'Post-Game') return 'bg-yellow-500';
    if (category === 'In-Game') return 'bg-green-500';
    if (category === 'Locker Room') return 'bg-blue-600';
    return 'bg-zinc-600';
  };

  const formatDate = (date: Date) => {
    // Use a consistent date format to avoid hydration errors
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}/${year}`;
  };

  const handleChatClick = (chat: ChatSession) => {
    // Store complete chat context including message history
    if (chat.selectedTopic) {
      localStorage.setItem('selectedTopic', JSON.stringify(chat.selectedTopic));
    } else {
      localStorage.removeItem('selectedTopic');
    }

    // Store the complete chat session for restoration
    localStorage.setItem('chatHistory', JSON.stringify({
      sessionId: chat.id,
      messages: chat.messages,
      isRestoringChat: true
    }));

    localStorage.setItem('chatReferrer', '/chat-history');
    router.push('/chat');
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      // Delete from storage
      UserSessionManager.deleteChatSession(chatToDelete);

      // Update local state
      setChatSessions(prevSessions =>
        prevSessions.filter(chat => chat.id !== chatToDelete)
      );
    }
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const handleStartFreshChat = () => {
    // Clear all chat-related data from localStorage to ensure fresh start
    localStorage.removeItem('selectedTopic');
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatReferrer');

    // Navigate to chat page
    router.push('/chat');
  };

  const handleBackClick = () => {
    // Always navigate to home page from chat history
    router.push('/');
  };

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Mobile Layout */}
      <div className="lg:hidden">
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
          <div className="text-[1.8em] font-bold text-white mb-2">Chat History</div>
          <div className="text-zinc-400 text-sm leading-relaxed">Your conversations and cheat code journey</div>
        </div>

        {/* Search */}
        <div className="p-4 pb-4">
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-4 pt-0 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => {
            const getFilterColors = () => {
              if (filter === 'All') return 'bg-white/5 border border-white/10';
              if (filter === 'With Cheat Codes') return 'bg-red-500/[0.075] border border-white/10';
              if (filter === 'Topics') return 'bg-orange-500/[0.075] border border-white/10';
              if (filter === 'Custom') return 'bg-yellow-500/[0.075] border border-white/10';
              if (filter === 'Recent') return 'bg-green-500/[0.075] border border-white/10';
              if (filter === 'Archived') return 'bg-blue-800/[0.075] border border-white/10';
              return 'bg-white/5 border border-white/10';
            };

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-white text-black'
                    : `${getFilterColors()} text-zinc-300 hover:bg-zinc-700`
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Chat List */}
        <div className="px-4 pb-24 space-y-3">
          {getFilteredChats().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💭</div>
              <div className="text-xl font-semibold text-white mb-2">No conversations yet</div>
              <div className="text-zinc-400 mb-6">Start chatting to build your history</div>
              <button onClick={handleStartFreshChat} className="bg-white text-black px-6 py-3 rounded-xl font-semibold">
                Start New Chat
              </button>
            </div>
          ) : (
            getFilteredChats().map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 transition-all cursor-pointer hover:bg-zinc-800/50 active:scale-98"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm mb-1">{chat.title}</div>
                    <div className="flex items-center gap-2">
                      {chat.category && (
                        <div className="text-zinc-400 text-xs uppercase tracking-wide">
                          {chat.category}
                        </div>
                      )}
                      {chat.hasCheatCode && (
                        <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-medium">
                          ⚡ Cheat Code
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>

                <div className="text-zinc-400 text-sm mb-3 line-clamp-2">
                  {chat.lastMessage}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{chat.messageCount} messages</span>
                  <span>{formatDate(chat.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Footer Navigation */}
        <div className="fixed bottom-20 right-4 lg:hidden">
          <button onClick={handleStartFreshChat} className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center">
                <h3 className="text-white font-semibold text-lg mb-2">Archive Chat?</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Are you sure you want to archive this chat?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-3 px-4 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto p-8">
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

            <div className="text-4xl font-bold text-white mb-4">Chat History</div>
            <div className="text-zinc-400 text-lg leading-relaxed">Your conversations and cheat code journey</div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="21 21l-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex gap-3">
              {filters.map((filter) => {
                const getFilterColors = () => {
                  if (filter === 'All') return 'bg-white/5 border border-white/10 hover:bg-white/10';
                  if (filter === 'With Cheat Codes') return 'bg-red-500/[0.075] border border-white/10 hover:bg-red-500/[0.125]';
                  if (filter === 'Topics') return 'bg-orange-500/[0.075] border border-white/10 hover:bg-orange-500/[0.125]';
                  if (filter === 'Custom') return 'bg-yellow-500/[0.075] border border-white/10 hover:bg-yellow-500/[0.125]';
                  if (filter === 'Recent') return 'bg-green-500/[0.075] border border-white/10 hover:bg-green-500/[0.125]';
                  if (filter === 'Archived') return 'bg-blue-800/[0.075] border border-white/10 hover:bg-blue-800/[0.125]';
                  return 'bg-white/5 border border-white/10 hover:bg-white/10';
                };

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-3 rounded-full font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-white text-black'
                        : `${getFilterColors()} text-zinc-300`
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Grid */}
          <div className="space-y-4 pb-24">
            {getFilteredChats().length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">💭</div>
                <div className="text-2xl font-semibold text-white mb-3">No conversations yet</div>
                <div className="text-zinc-400 mb-8">Start chatting to build your history</div>
                <button onClick={handleStartFreshChat} className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-200 transition-colors">
                  Start New Chat
                </button>
              </div>
            ) : (
              getFilteredChats().map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 transition-all cursor-pointer hover:bg-zinc-800/50 hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">{chat.title}</h3>
                      <div className="flex items-center gap-3">
                        {chat.category && (
                          <div className="text-zinc-400 text-sm uppercase tracking-wide">
                            {chat.category}
                          </div>
                        )}
                        {chat.hasCheatCode && (
                          <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
                            ⚡ Cheat Code Created
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="text-zinc-500 hover:text-red-400 p-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="text-zinc-400 mb-4 line-clamp-2">
                    {chat.lastMessage}
                  </div>

                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>{chat.messageCount} messages</span>
                    <span>{formatDate(chat.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Footer */}
          <div className="fixed bottom-16 right-8 hidden lg:block">
            <button onClick={handleStartFreshChat} className="bg-white text-black w-16 h-16 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-8 z-50">
            <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md">
              <div className="text-center">
                <h3 className="text-white font-semibold text-xl mb-3">Archive Chat?</h3>
                <p className="text-zinc-400 mb-8">
                  Are you sure you want to archive this chat?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-3 px-6 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}