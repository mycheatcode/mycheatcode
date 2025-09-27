// Simple user session management for testing
export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  type: 'topic' | 'custom';
  section: string;
  messageCount: number;
  lastMessage: string;
  createdAt: Date;
  updatedAt: Date;
  hasCheatCode: boolean;
  category?: string;
  messages: any[];
  session_id?: string;
}

const STORAGE_KEYS = {
  USER: 'current_user',
  CHAT_SESSIONS: 'user_chat_sessions'
};

export class UserSessionManager {
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);
      return {
        ...user,
        created_at: new Date(user.created_at)
      };
    } catch {
      return null;
    }
  }

  static createTestUser(username: string = 'TestUser'): User {
    const user: User = {
      id: `user_${Date.now()}`,
      username,
      email: `${username.toLowerCase()}@test.com`,
      created_at: new Date()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    return user;
  }

  static getUserChatSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];

    const sessionsData = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    if (!sessionsData) return [];

    try {
      const sessions = JSON.parse(sessionsData);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static saveChatSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;

    const existingSessions = this.getUserChatSessions();
    const sessionIndex = existingSessions.findIndex(s => s.id === session.id);

    if (sessionIndex >= 0) {
      existingSessions[sessionIndex] = session;
    } else {
      existingSessions.push(session);
    }

    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(existingSessions));
  }

  static deleteChatSession(sessionId: string): void {
    if (typeof window === 'undefined') return;

    const existingSessions = this.getUserChatSessions();
    const updatedSessions = existingSessions.filter(s => s.id !== sessionId);

    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(updatedSessions));
  }

  static getOrCreateUser(): User {
    const existingUser = this.getCurrentUser();
    if (existingUser) return existingUser;

    return this.createTestUser();
  }

  static createChatSessionFromMessages(
    messages: any[],
    section: string,
    sessionId?: string
  ): ChatSession {
    const firstUserMessage = messages.find(m => m.sender === 'user');
    const lastCoachMessage = messages.filter(m => m.sender === 'coach').pop();

    const title = firstUserMessage?.text.substring(0, 50) || 'New Chat';
    const lastMessage = lastCoachMessage?.text.substring(0, 100) || '';

    const hasCheatCode = messages.some(m =>
      m.text?.toLowerCase().includes('save this as a cheat code')
    );

    const getSectionCategory = (section: string): string => {
      switch (section) {
        case 'pre_game': return 'Pre-Game';
        case 'in_game': return 'In-Game';
        case 'post_game': return 'Post-Game';
        case 'locker_room': return 'Locker Room';
        case 'off_court': return 'Off Court';
        default: return 'General';
      }
    };

    return {
      id: sessionId || `chat_${Date.now()}`,
      title,
      type: 'custom',
      section,
      messageCount: messages.length,
      lastMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
      hasCheatCode,
      category: getSectionCategory(section),
      messages,
      session_id: sessionId
    };
  }
}