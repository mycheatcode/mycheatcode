import { createClient } from '@/lib/supabase/client';

// Event categories
export const EventCategory = {
  ACTIVATION: 'activation',
  ENGAGEMENT: 'engagement',
  RETENTION: 'retention',
  FEATURE_USAGE: 'feature_usage',
} as const;

// Event names - comprehensive list of trackable events
export const EventName = {
  // Activation events (onboarding)
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',
  FIRST_CHEAT_CODE_CREATED: 'first_cheat_code_created',
  SCENARIO_SELECTED: 'scenario_selected',

  // Engagement events (core usage)
  CHEAT_CODE_CREATED: 'cheat_code_created',
  CHEAT_CODE_REGENERATED: 'cheat_code_regenerated',
  CHEAT_CODE_FAVORITED: 'cheat_code_favorited',
  CHEAT_CODE_UNFAVORITED: 'cheat_code_unfavorited',
  CHEAT_CODE_USED: 'cheat_code_used',
  PRACTICE_GAME_STARTED: 'practice_game_started',
  PRACTICE_GAME_COMPLETED: 'practice_game_completed',
  CHAT_MESSAGE_SENT: 'chat_message_sent',

  // Feature usage
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  PROFILE_UPDATED: 'profile_updated',
  MOMENTUM_MILESTONE: 'momentum_milestone',
  STREAK_MAINTAINED: 'streak_maintained',
  STREAK_BROKEN: 'streak_broken',

  // Retention signals
  DAILY_RETURN: 'daily_return',
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',
} as const;

// Session ID management (stored in sessionStorage)
let sessionId: string | null = null;

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

// Main tracking function
export async function trackEvent(
  eventName: string,
  properties: Record<string, any> = {},
  category?: string
) {
  if (typeof window === 'undefined') return; // Don't track on server

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[Analytics] No user logged in, skipping event:', eventName);
      return;
    }

    // Determine category if not provided
    const eventCategory = category || inferCategory(eventName);

    const event = {
      user_id: user.id,
      event_name: eventName,
      event_category: eventCategory,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
      },
      page_url: window.location.href,
      session_id: getSessionId(),
    };

    const { error } = await supabase
      .from('analytics_events')
      .insert(event);

    if (error) {
      console.error('[Analytics] Failed to track event:', error);
    } else {
      console.log('[Analytics] Tracked:', eventName, properties);
    }
  } catch (err) {
    console.error('[Analytics] Error tracking event:', err);
  }
}

// Helper to infer category from event name
function inferCategory(eventName: string): string {
  if (eventName.includes('onboarding') || eventName.includes('first_')) {
    return EventCategory.ACTIVATION;
  }
  if (eventName.includes('return') || eventName.includes('streak')) {
    return EventCategory.RETENTION;
  }
  if (
    eventName.includes('created') ||
    eventName.includes('completed') ||
    eventName.includes('chat')
  ) {
    return EventCategory.ENGAGEMENT;
  }
  return EventCategory.FEATURE_USAGE;
}

// Convenience functions for common events

export const Analytics = {
  // Activation
  trackOnboardingStarted: () => {
    trackEvent(EventName.ONBOARDING_STARTED, {}, EventCategory.ACTIVATION);
  },

  trackOnboardingCompleted: (selectedScenarios: string[]) => {
    trackEvent(
      EventName.ONBOARDING_COMPLETED,
      { scenarios: selectedScenarios, scenario_count: selectedScenarios.length },
      EventCategory.ACTIVATION
    );
  },

  trackScenarioSelected: (scenario: string, category: string) => {
    trackEvent(
      EventName.SCENARIO_SELECTED,
      { scenario, category },
      EventCategory.ACTIVATION
    );
  },

  // Engagement
  trackCheatCodeCreated: (codeId: string, isFirstCode: boolean = false, topic?: string) => {
    const eventName = isFirstCode
      ? EventName.FIRST_CHEAT_CODE_CREATED
      : EventName.CHEAT_CODE_CREATED;

    trackEvent(
      eventName,
      { cheat_code_id: codeId, topic, is_first: isFirstCode },
      EventCategory.ENGAGEMENT
    );
  },

  trackCheatCodeRegenerated: (codeId: string, reason?: string) => {
    trackEvent(
      EventName.CHEAT_CODE_REGENERATED,
      { cheat_code_id: codeId, reason },
      EventCategory.ENGAGEMENT
    );
  },

  trackCheatCodeFavorited: (codeId: string, isFavorite: boolean) => {
    trackEvent(
      isFavorite ? EventName.CHEAT_CODE_FAVORITED : EventName.CHEAT_CODE_UNFAVORITED,
      { cheat_code_id: codeId },
      EventCategory.ENGAGEMENT
    );
  },

  trackCheatCodeUsed: (codeId: string, timesUsed: number) => {
    trackEvent(
      EventName.CHEAT_CODE_USED,
      { cheat_code_id: codeId, times_used: timesUsed },
      EventCategory.ENGAGEMENT
    );
  },

  trackPracticeGame: (gameId: string, completed: boolean, score?: number) => {
    trackEvent(
      completed ? EventName.PRACTICE_GAME_COMPLETED : EventName.PRACTICE_GAME_STARTED,
      { game_id: gameId, score, completed },
      EventCategory.ENGAGEMENT
    );
  },

  trackChatMessage: (messageLength: number, topic?: string) => {
    trackEvent(
      EventName.CHAT_MESSAGE_SENT,
      { message_length: messageLength, topic },
      EventCategory.ENGAGEMENT
    );
  },

  // Feature usage
  trackFeedbackSubmitted: (feedbackType: string, hasRatings: boolean, hasScreenshot: boolean) => {
    trackEvent(
      EventName.FEEDBACK_SUBMITTED,
      { feedback_type: feedbackType, has_ratings: hasRatings, has_screenshot: hasScreenshot },
      EventCategory.FEATURE_USAGE
    );
  },

  trackMomentumMilestone: (momentumLevel: number) => {
    trackEvent(
      EventName.MOMENTUM_MILESTONE,
      { momentum_level: momentumLevel },
      EventCategory.RETENTION
    );
  },

  trackStreak: (streakDays: number, broken: boolean = false) => {
    trackEvent(
      broken ? EventName.STREAK_BROKEN : EventName.STREAK_MAINTAINED,
      { streak_days: streakDays },
      EventCategory.RETENTION
    );
  },

  // Page tracking
  trackPageView: (pageName: string) => {
    trackEvent(
      EventName.PAGE_VIEW,
      { page_name: pageName, url: window.location.pathname },
      EventCategory.FEATURE_USAGE
    );
  },

  trackSessionStart: () => {
    trackEvent(EventName.SESSION_START, {}, EventCategory.RETENTION);
  },
};
