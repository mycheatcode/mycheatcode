'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserSessionManager } from '../utils/userSession';
import { createClient } from '@/lib/supabase/client';
import { unarchiveChat } from '@/lib/chat';
import FeedbackButton from '@/components/FeedbackButton';
import FeedbackModal from '@/components/FeedbackModal';
import { DbChat, DbMessage } from '@/lib/types';

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
  selectedTopic?: {
    id?: number;
    title?: string;
    quote: string;
    context: string;
    category: string;
  };
  archived?: boolean;
}

export default function ChatHistory() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previousPage, setPreviousPage] = useState('/');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Track the previous page
  useEffect(() => {
    const referrer = document.referrer;
    if (referrer && referrer !== window.location.href) {
      const url = new URL(referrer);
      setPreviousPage(url.pathname);
    }
  }, []);

  const filters = ['All', 'With Cheat Codes', 'Topics', 'Custom', 'Recent', 'Archived'];

  // Initialize chat sessions data from database
  useEffect(() => {
    const loadChatHistory = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        return;
      }

      if (!user) {
        return;
      }

      setUserId(user.id);

      // Fetch real chats from database (including selected_topic)
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false});

      if (error) {
        return;
      }


      // Transform database chats to ChatSession format
      const transformedChats: ChatSession[] = (chats || []).map((chat: DbChat) => {
        const messages = Array.isArray(chat.messages) ? chat.messages : [];
        const lastMessage = messages.length > 0
          ? messages[messages.length - 1].content
          : 'No messages yet';

        // Determine title: use topic title if available, otherwise first user message
        let title = 'Chat Session';
        if (chat.selected_topic && 'title' in chat.selected_topic && chat.selected_topic.title) {
          // Use topic title with quotations if available
          title = `"${chat.selected_topic.title}"`;
        } else if (chat.selected_topic && 'quote' in chat.selected_topic) {
          // Fallback to quote if title is not available
          title = `"${chat.selected_topic.quote}"`;
        } else {
          // Fall back to first user message
          const firstUserMessage = messages.find((m: DbMessage) => m.role === 'user');
          if (firstUserMessage && firstUserMessage.content) {
            title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
          }
        }

        // Check if any assistant message contains a cheat code
        const hasCheatCode = messages.some((m: DbMessage) => {
          if (m.role === 'assistant') {
            const content = m.content || '';
            // Check for standard cheat code format
            const hasStandardFormat = content.includes('**What:**') && content.includes('**When:**') && content.includes('**How:**') && content.includes('**Why:**');
            // Check for alternative format
            const hasAlternativeFormat = (
              (content.includes('Title:') || content.includes('title:')) &&
              (content.includes('Trigger:') || content.includes('trigger:')) &&
              (content.includes('Cue phrase:') || content.includes('cue phrase:'))
            );
            return hasStandardFormat || hasAlternativeFormat;
          }
          return false;
        });

        return {
          id: chat.id,
          title,
          type: chat.selected_topic ? 'topic' as const : 'custom' as const,
          messageCount: messages.length,
          lastMessage,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.created_at), // Use created_at as updated_at since there's no updated_at column
          hasCheatCode,
          archived: chat.is_archived || false,
          selectedTopic: chat.selected_topic, // Include selected topic from database
          messages: messages.map((m: DbMessage, idx: number) => ({
            id: idx + 1,
            text: m.content,
            sender: m.role === 'user' ? 'user' as const : 'coach' as const,
            timestamp: new Date(m.timestamp || chat.created_at)
          }))
        };
      });

      setChatSessions(transformedChats);
    };

    loadChatHistory();
  }, [supabase]);

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

  const confirmDelete = async () => {
    if (chatToDelete && userId) {
      // Archive in database by setting is_active to false
      const { error } = await supabase
        .from('chats')
        .update({ is_active: false })
        .eq('id', chatToDelete)
        .eq('user_id', userId);

      if (!error) {
        // Update local state to mark as archived
        setChatSessions(prevSessions =>
          prevSessions.map(chat =>
            chat.id === chatToDelete ? { ...chat, archived: true } : chat
          )
        );
      }
    }
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const handleUnarchiveChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) return;

    const { error } = await unarchiveChat(userId, chatId);

    if (!error) {
      // Update local state to mark as unarchived
      setChatSessions(prevSessions =>
        prevSessions.map(chat =>
          chat.id === chatId ? { ...chat, archived: false } : chat
        )
      );

      // Navigate to the chat
      const chat = chatSessions.find(c => c.id === chatId);
      if (chat) {
        handleChatClick(chat);
      }
    }
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
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      {/* Sidebar Navigation */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#000000' }}
      >
        <div className="pt-6 px-6 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="pt-2 px-6">
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
            <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
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
          className="lg:hidden fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative pb-[68px] overflow-y-auto flex flex-col">
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
        </div>

        <div className="flex-1">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          {/* Page Title */}
          <div className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Chat History</div>
          <div className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Your conversations and cheat code journey</div>
        </div>

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
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-4 pt-0 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
              style={
                activeFilter === filter
                  ? { backgroundColor: 'var(--button-bg)', color: 'var(--button-text)', borderColor: 'var(--button-bg)' }
                  : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }
              }
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Chat List */}
        <div className="px-4 pb-4 space-y-3">
          {getFilteredChats().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💭</div>
              <div className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>No conversations yet</div>
              <div className="mb-6" style={{ color: '#808080' }}>Start chatting to build your history</div>
              <button onClick={handleStartFreshChat} className="px-6 py-3 rounded-xl font-semibold" style={{ backgroundColor: '#00ff41', color: '#000000' }}>
                Start New Chat
              </button>
            </div>
          ) : (
            getFilteredChats().map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="border rounded-xl p-4 transition-all cursor-pointer active:scale-98"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1" style={{ color: '#ffffff' }}>{chat.title}</div>
                    <div className="flex items-center gap-2">
                      {chat.category && (
                        <div className="text-xs uppercase tracking-wide" style={{ color: '#808080' }}>
                          {chat.category}
                        </div>
                      )}
                      {chat.hasCheatCode && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#0d4d1f', color: '#00ff41' }}>
                          ⚡ Cheat Code
                        </span>
                      )}
                    </div>
                  </div>
                  {!chat.archived && (
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1"
                      style={{ color: '#808080' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="text-sm mb-3 line-clamp-2" style={{ color: '#808080' }}>
                  {chat.lastMessage}
                </div>

                <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#666666' }}>
                  <span>{chat.messageCount} messages</span>
                  <span>{formatDate(chat.updatedAt)}</span>
                </div>

                {chat.archived && (
                  <button
                    onClick={(e) => handleUnarchiveChat(chat.id, e)}
                    className="w-full py-2 rounded-lg text-xs font-medium transition-colors border"
                    style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
                  >
                    Unarchive
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Mobile Footer Navigation */}
        <div className="fixed bottom-20 right-4 lg:hidden">
          <button onClick={handleStartFreshChat} className="w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: '#00ff41', color: '#000000' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#ffffff' }}>Archive Chat?</h3>
                <p className="text-sm mb-6" style={{ color: '#808080' }}>
                  Are you sure you want to archive this chat?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-3 px-4 rounded-xl border font-medium transition-colors"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                    style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
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

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Sidebar Navigation */}
        <div className={`absolute top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#000000' }}>
          {/* Header inside sidebar */}
          <div className="p-4 flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#00ff41' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="text-xl app-label" style={{ color: '#00ff41' }}>MYCHEATCODE</div>
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

              <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
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
            className="absolute inset-0 z-20"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header - Always visible */}
          <div className="p-4 flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#00ff41' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="text-xl app-label" style={{ color: '#00ff41' }}>MYCHEATCODE</div>
          </div>

          <div className="flex-1 px-8 pb-8 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <div className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Chat History</div>
            <div className="text-base lg:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Your conversations and cheat code journey</div>
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
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Filters */}
          <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className="px-6 py-3 rounded-full font-medium transition-all border"
                  style={
                    activeFilter === filter
                      ? { backgroundColor: 'var(--button-bg)', color: 'var(--button-text)', borderColor: 'var(--button-bg)' }
                      : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }
                  }
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Grid */}
          <div className="space-y-6">
            {getFilteredChats().length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">💭</div>
                <div className="text-2xl font-semibold mb-3" style={{ color: '#ffffff' }}>No conversations yet</div>
                <div className="mb-8" style={{ color: '#808080' }}>Start chatting to build your history</div>
                <button onClick={handleStartFreshChat} className="px-8 py-4 rounded-xl font-semibold text-lg transition-colors" style={{ backgroundColor: '#00ff41', color: '#000000' }}>
                  Start New Chat
                </button>
              </div>
            ) : (
              getFilteredChats().map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="border rounded-xl p-6 transition-all cursor-pointer hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2" style={{ color: '#ffffff' }}>{chat.title}</h3>
                      <div className="flex items-center gap-3">
                        {chat.category && (
                          <div className="text-sm uppercase tracking-wide" style={{ color: '#808080' }}>
                            {chat.category}
                          </div>
                        )}
                        {chat.hasCheatCode && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#0d4d1f', color: '#00ff41' }}>
                            ⚡ Cheat Code Created
                          </span>
                        )}
                      </div>
                    </div>
                    {!chat.archived && (
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="p-2"
                        style={{ color: '#808080' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="mb-4 line-clamp-2" style={{ color: '#808080' }}>
                    {chat.lastMessage}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4" style={{ color: '#666666' }}>
                    <span>{chat.messageCount} messages</span>
                    <span>{formatDate(chat.updatedAt)}</span>
                  </div>

                  {chat.archived && (
                    <button
                      onClick={(e) => handleUnarchiveChat(chat.id, e)}
                      className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors border"
                      style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="fixed bottom-16 right-8 hidden lg:block">
          <button onClick={handleStartFreshChat} className="w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: '#00ff41', color: '#000000' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center p-8 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="rounded-2xl p-8 w-full max-w-md" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="text-center">
                <h3 className="font-semibold text-xl mb-3" style={{ color: '#ffffff' }}>Archive Chat?</h3>
                <p className="mb-8" style={{ color: '#808080' }}>
                  Are you sure you want to archive this chat?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-3 px-6 rounded-xl border font-medium transition-colors"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-6 rounded-xl font-medium transition-colors"
                    style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Feedback Button */}
      <FeedbackButton />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}