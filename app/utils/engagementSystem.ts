import { Section } from './progressionSystem';

// Engagement Event Types
export type EngagementEvent =
  | 'code_used'
  | 'section_upgraded'
  | 'section_demoted'
  | 'green_hold_started'
  | 'green_hold_milestone'
  | 'green_hold_ended'
  | 'full_radar_achieved'
  | 'badge_earned'
  | 'grace_warning'
  | 'daily_cap_reached';

// Badge System
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconType: 'geometric' | 'line-art' | 'metallic';
  accentColor: 'silver' | 'gold' | 'green' | 'neutral';
  unlockedTimestamp?: number;
  isUnlocked: boolean;
}

export interface BadgeState {
  unlockedBadges: Record<string, Badge>;
  lastUpdated: number;
}

// Share Card Data
export interface ShareCardData {
  type: 'green_hold' | 'full_radar' | 'milestone' | 'radar_snapshot';
  title: string;
  subtitle: string;
  visualData: {
    greenHoldDays?: number;
    radarCompletion?: number;
    sectionColor?: 'red' | 'orange' | 'yellow' | 'green';
    greenHoldData?: Record<string, number>;
    radarData?: {
      preGame: number;
      preGameColor: 'red' | 'orange' | 'yellow' | 'green';
      inGame: number;
      inGameColor: 'red' | 'orange' | 'yellow' | 'green';
      postGame: number;
      postGameColor: 'red' | 'orange' | 'yellow' | 'green';
      offCourt: number;
      offCourtColor: 'red' | 'orange' | 'yellow' | 'green';
      lockerRoom: number;
      lockerRoomColor: 'red' | 'orange' | 'yellow' | 'green';
    };
  };
  timestamp: number;
}

// In-App Prompt Types
export type PromptType =
  | 'refine_code'
  | 'archive_suggestion'
  | 'reactivate_code'
  | 'daily_cap_warning'
  | 'consistency_reminder';

export interface InAppPrompt {
  id: string;
  type: PromptType;
  title: string;
  message: string;
  actionLabel?: string;
  dismissible: boolean;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  expiresAt?: number;
}

// Engagement State
export interface EngagementState {
  badges: BadgeState;
  recentPrompts: InAppPrompt[];
  shareHistory: ShareCardData[];
  animationQueue: EngagementEvent[];
  lastEngagementCheck: number;
}

// Storage key
const ENGAGEMENT_STATE_KEY = 'engagementState';

// Get engagement state from localStorage
export function getEngagementState(): EngagementState {
  if (typeof window === 'undefined') {
    return {
      badges: { unlockedBadges: {}, lastUpdated: Date.now() },
      recentPrompts: [],
      shareHistory: [],
      animationQueue: [],
      lastEngagementCheck: Date.now()
    };
  }

  const stored = localStorage.getItem(ENGAGEMENT_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing engagement state:', error);
    }
  }

  return {
    badges: { unlockedBadges: {}, lastUpdated: Date.now() },
    recentPrompts: [],
    shareHistory: [],
    animationQueue: [],
    lastEngagementCheck: Date.now()
  };
}

// Save engagement state to localStorage
export function saveEngagementState(state: EngagementState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ENGAGEMENT_STATE_KEY, JSON.stringify(state));
  }
}

// Badge Definitions
export const AVAILABLE_BADGES: Record<string, Omit<Badge, 'isUnlocked' | 'unlockedTimestamp'>> = {
  first_green: {
    id: 'first_green',
    name: 'First Green',
    description: 'Elevated your first section to Green',
    iconType: 'geometric',
    accentColor: 'green'
  },
  locked_in_7: {
    id: 'locked_in_7',
    name: 'Locked In',
    description: 'Maintained Green Hold for 7 consecutive days',
    iconType: 'line-art',
    accentColor: 'silver'
  },
  unbreakable_30: {
    id: 'unbreakable_30',
    name: 'Unbreakable',
    description: 'Maintained Green Hold for 30 consecutive days',
    iconType: 'metallic',
    accentColor: 'gold'
  },
  full_radar_green: {
    id: 'full_radar_green',
    name: 'Full Radar Green',
    description: 'All sections elevated to Green simultaneously',
    iconType: 'geometric',
    accentColor: 'green'
  },
  consistency_master: {
    id: 'consistency_master',
    name: 'Consistency Master',
    description: 'Maintained 4+ logs per week for 4 consecutive weeks',
    iconType: 'line-art',
    accentColor: 'gold'
  }
};

// Check and award badges
export function checkBadgeEligibility(
  event: EngagementEvent,
  eventData: any
): Badge[] {
  const state = getEngagementState();
  const newBadges: Badge[] = [];

  // First Green badge
  if (event === 'section_upgraded' && eventData.newColor === 'green') {
    const badgeId = 'first_green';
    if (!state.badges.unlockedBadges[badgeId]) {
      newBadges.push({
        ...AVAILABLE_BADGES[badgeId],
        isUnlocked: true,
        unlockedTimestamp: Date.now()
      });
    }
  }

  // Green Hold milestones
  if (event === 'green_hold_milestone') {
    const days = eventData.days;
    if (days >= 7 && !state.badges.unlockedBadges.locked_in_7) {
      newBadges.push({
        ...AVAILABLE_BADGES.locked_in_7,
        isUnlocked: true,
        unlockedTimestamp: Date.now()
      });
    }
    if (days >= 30 && !state.badges.unlockedBadges.unbreakable_30) {
      newBadges.push({
        ...AVAILABLE_BADGES.unbreakable_30,
        isUnlocked: true,
        unlockedTimestamp: Date.now()
      });
    }
  }

  // Full Radar Green
  if (event === 'full_radar_achieved') {
    const badgeId = 'full_radar_green';
    if (!state.badges.unlockedBadges[badgeId]) {
      newBadges.push({
        ...AVAILABLE_BADGES[badgeId],
        isUnlocked: true,
        unlockedTimestamp: Date.now()
      });
    }
  }

  return newBadges;
}

// Generate share card data
export function generateShareCard(
  type: ShareCardData['type'],
  data: any
): ShareCardData {
  switch (type) {
    case 'green_hold':
      return {
        type,
        title: `${data.days} Days Green`,
        subtitle: data.section,
        visualData: {
          greenHoldDays: data.days,
          radarData: data.radarData
        },
        timestamp: Date.now()
      };

    case 'full_radar':
      return {
        type,
        title: 'Full Radar Unlocked',
        subtitle: 'All Sections Green',
        visualData: {
          radarCompletion: 100,
          radarData: data.radarData || {
            preGame: 100, preGameColor: 'green',
            inGame: 100, inGameColor: 'green',
            postGame: 100, postGameColor: 'green',
            offCourt: 100, offCourtColor: 'green',
            lockerRoom: 100, lockerRoomColor: 'green'
          }
        },
        timestamp: Date.now()
      };

    case 'milestone':
      return {
        type,
        title: data.title,
        subtitle: data.subtitle,
        visualData: {
          ...data.visualData,
          radarData: data.radarData
        },
        timestamp: Date.now()
      };

    case 'radar_snapshot':
      return {
        type,
        title: data.title || 'My Mental Performance',
        subtitle: data.subtitle || 'Locked in.',
        visualData: {
          radarData: data.radarData,
          greenHoldData: data.greenHoldData
        },
        timestamp: Date.now()
      };

    default:
      throw new Error(`Unknown share card type: ${type}`);
  }
}

// Create in-app prompt
export function createInAppPrompt(
  type: PromptType,
  data: any,
  priority: InAppPrompt['priority'] = 'medium'
): InAppPrompt {
  const basePrompt = {
    id: `${type}_${Date.now()}`,
    type,
    priority,
    timestamp: Date.now(),
    dismissible: true
  };

  switch (type) {
    case 'refine_code':
      return {
        ...basePrompt,
        title: 'Refine Your Code',
        message: 'Want to refine this code or keep building it?',
        actionLabel: 'Refine'
      };

    case 'archive_suggestion':
      return {
        ...basePrompt,
        title: 'Section Full',
        message: 'Archive one to add another.',
        actionLabel: 'Manage Codes'
      };

    case 'reactivate_code':
      return {
        ...basePrompt,
        title: 'Bounce-Back Reset',
        message: 'Bounce-Back Reset might help. Reactivate it?',
        actionLabel: 'Reactivate'
      };

    default:
      return {
        ...basePrompt,
        title: 'Update',
        message: 'Something happened.'
      };
  }
}

// Process engagement event
export function processEngagementEvent(
  event: EngagementEvent,
  eventData: any
): {
  badges: Badge[];
  prompts: InAppPrompt[];
  shareCards: ShareCardData[];
  animations: EngagementEvent[];
} {
  const badges = checkBadgeEligibility(event, eventData);
  const prompts: InAppPrompt[] = [];
  const shareCards: ShareCardData[] = [];
  const animations: EngagementEvent[] = [event];

  // Generate share cards for significant achievements
  if (event === 'green_hold_milestone' && eventData.days >= 7) {
    shareCards.push(generateShareCard('green_hold', eventData));
  }

  if (event === 'full_radar_achieved') {
    shareCards.push(generateShareCard('full_radar', eventData));
  }

  // Generate prompts based on context
  if (event === 'code_used' && eventData.shouldPromptRefinement) {
    prompts.push(createInAppPrompt('refine_code', eventData));
  }

  // Save updated state
  const state = getEngagementState();
  badges.forEach(badge => {
    state.badges.unlockedBadges[badge.id] = badge;
  });
  state.recentPrompts.push(...prompts);
  state.shareHistory.push(...shareCards);
  state.animationQueue.push(...animations);
  state.lastEngagementCheck = Date.now();

  saveEngagementState(state);

  return { badges, prompts, shareCards, animations };
}