import { Section } from './progressionSystem';
import { formatDuration } from './greenHoldSystem';

// Notification types
export type NotificationType =
  | 'miss_a_day_nudge'
  | 'grace_warning'
  | 'drop_notice'
  | 'positive_reinforcement'
  | 'decay_warning'
  | 'milestone_achieved';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  section?: Section;
  timestamp: number;
  isRead: boolean;
  actionLabel?: string;
  actionData?: any;
  icon?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationState {
  notifications: NotificationData[];
  lastNotificationId: number;
}

// Storage key
const NOTIFICATION_STATE_KEY = 'notificationState';

// Get notification state from localStorage
export function getNotificationState(): NotificationState {
  if (typeof window === 'undefined') {
    // Return default state during SSR
    return {
      notifications: [],
      lastNotificationId: 0
    };
  }

  const stored = localStorage.getItem(NOTIFICATION_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing notification state:', error);
    }
  }

  return {
    notifications: [],
    lastNotificationId: 0
  };
}

// Save notification state to localStorage
export function saveNotificationState(state: NotificationState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
  }
}

// Create a new notification
export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  options: {
    section?: Section;
    actionLabel?: string;
    actionData?: any;
    icon?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  } = {}
): NotificationData {
  const state = getNotificationState();
  const id = `notif_${++state.lastNotificationId}_${Date.now()}`;

  return {
    id,
    type,
    title,
    message,
    section: options.section,
    timestamp: Date.now(),
    isRead: false,
    actionLabel: options.actionLabel,
    actionData: options.actionData,
    icon: options.icon,
    priority: options.priority || 'medium'
  };
}

// Add notification to queue
export function addNotification(notification: NotificationData): void {
  const state = getNotificationState();

  // Check for duplicate recent notifications of the same type for the same section
  const recentThreshold = 6 * 60 * 60 * 1000; // 6 hours
  const isDuplicate = state.notifications.some(n =>
    n.type === notification.type &&
    n.section === notification.section &&
    (Date.now() - n.timestamp) < recentThreshold &&
    !n.isRead
  );

  if (!isDuplicate) {
    state.notifications.unshift(notification);

    // Keep only the last 50 notifications
    if (state.notifications.length > 50) {
      state.notifications = state.notifications.slice(0, 50);
    }

    state.lastNotificationId = Math.max(state.lastNotificationId,
      parseInt(notification.id.split('_')[1]) || 0
    );

    saveNotificationState(state);
    console.log(`Added notification: ${notification.title}`);
  }
}

// Miss-a-Day Nudge (section is Green)
export function sendMissADayNudge(section: Section): void {
  const notification = createNotification(
    'miss_a_day_nudge',
    `Keep your ${section} Green alive`,
    '1 tap to log a quick reset and maintain your streak.',
    {
      section,
      actionLabel: 'Log Activity',
      actionData: { section },
      icon: '🟢',
      priority: 'medium'
    }
  );

  addNotification(notification);
}

// Grace Warning (end of Day 2 inactivity)
export function sendGraceWarning(section: Section): void {
  const notification = createNotification(
    'grace_warning',
    `${section} at risk`,
    "You're close to dropping from Green. One quick log before noon keeps it alive.",
    {
      section,
      actionLabel: 'Save Green Status',
      actionData: { section, urgent: true },
      icon: '⚠️',
      priority: 'urgent'
    }
  );

  addNotification(notification);
}

// Drop Notice
export function sendDropNotice(section: Section, holdDuration: number): void {
  const holdTime = formatDuration(holdDuration);

  const notification = createNotification(
    'drop_notice',
    `${section} dropped from Green`,
    `You held Green for ${holdTime} — want to win it back?`,
    {
      section,
      actionLabel: 'Win It Back',
      actionData: { section },
      icon: '📉',
      priority: 'high'
    }
  );

  addNotification(notification);
}

// Positive Reinforcement
export function sendPositiveReinforcement(section: Section, streakDays: number): void {
  const notification = createNotification(
    'positive_reinforcement',
    `${streakDays} days straight in ${section}`,
    'Your Green Hold is climbing! Keep the momentum going.',
    {
      section,
      actionLabel: 'View Progress',
      actionData: { section },
      icon: '🚀',
      priority: 'low'
    }
  );

  addNotification(notification);
}

// Decay Warning
export function sendDecayWarning(cheatCodeName: string, section: Section, hoursUntilDecay: number): void {
  const notification = createNotification(
    'decay_warning',
    `${cheatCodeName} losing power`,
    `${Math.round(hoursUntilDecay)}h until decay starts. Use it to maintain strength.`,
    {
      section,
      actionLabel: 'Use Cheat Code',
      actionData: { cheatCodeName, section },
      icon: '⚡',
      priority: 'medium'
    }
  );

  addNotification(notification);
}

// Milestone Achieved
export function sendMilestoneAchieved(section: Section, milestoneName: string, icon: string): void {
  const notification = createNotification(
    'milestone_achieved',
    `${milestoneName} achieved!`,
    `Your ${section} section reached a new milestone. Share your progress!`,
    {
      section,
      actionLabel: 'Share Achievement',
      actionData: { section, milestone: milestoneName },
      icon,
      priority: 'high'
    }
  );

  addNotification(notification);
}

// Mark notification as read
export function markNotificationAsRead(notificationId: string): void {
  const state = getNotificationState();
  const notification = state.notifications.find(n => n.id === notificationId);

  if (notification) {
    notification.isRead = true;
    saveNotificationState(state);
  }
}

// Mark all notifications as read
export function markAllNotificationsAsRead(): void {
  const state = getNotificationState();
  state.notifications.forEach(n => n.isRead = true);
  saveNotificationState(state);
}

// Get unread notifications
export function getUnreadNotifications(): NotificationData[] {
  const state = getNotificationState();
  return state.notifications.filter(n => !n.isRead);
}

// Get all notifications (sorted by timestamp, newest first)
export function getAllNotifications(): NotificationData[] {
  const state = getNotificationState();
  return state.notifications.sort((a, b) => b.timestamp - a.timestamp);
}

// Get notifications for a specific section
export function getSectionNotifications(section: Section): NotificationData[] {
  const state = getNotificationState();
  return state.notifications
    .filter(n => n.section === section)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Remove old notifications (older than 30 days)
export function cleanupOldNotifications(): void {
  const state = getNotificationState();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  state.notifications = state.notifications.filter(n => n.timestamp > thirtyDaysAgo);
  saveNotificationState(state);
}

// Get notification priority color
export function getNotificationPriorityColor(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
  const colors = {
    low: 'text-zinc-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400'
  };

  return colors[priority];
}

// Format notification time
export function formatNotificationTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}

// Check if notifications should be sent (rate limiting)
export function shouldSendNotifications(): boolean {
  const state = getNotificationState();
  const lastNotification = state.notifications[0];

  // Don't send notifications more than once every 30 minutes
  if (lastNotification) {
    const timeSinceLastNotification = Date.now() - lastNotification.timestamp;
    const cooldownPeriod = 30 * 60 * 1000; // 30 minutes

    if (timeSinceLastNotification < cooldownPeriod) {
      return false;
    }
  }

  return true;
}

// Batch notification sending for maintenance checks
export function sendMaintenanceNotifications(
  sectionsToWarn: Section[],
  sectionsToDemote: Section[],
  holdDurations: Record<Section, number>
): void {
  if (!shouldSendNotifications()) {
    return;
  }

  // Send grace warnings
  sectionsToWarn.forEach(section => {
    sendGraceWarning(section);
  });

  // Send drop notices
  sectionsToDemote.forEach(section => {
    const holdDuration = holdDurations[section] || 0;
    sendDropNotice(section, holdDuration);
  });
}

// Generate contextual notification based on user state
export function generateContextualNotification(
  section: Section,
  sectionState: {
    color: 'red' | 'orange' | 'yellow' | 'green';
    consecutiveInactiveDays: number;
    activeDaysInWeek: number;
    holdDuration?: number;
  }
): NotificationData | null {
  const { color, consecutiveInactiveDays, activeDaysInWeek, holdDuration } = sectionState;

  // Green section maintenance
  if (color === 'green') {
    if (consecutiveInactiveDays === 1) {
      return createNotification(
        'miss_a_day_nudge',
        `Keep your ${section} Green alive`,
        '1 tap to log a quick reset and maintain your streak.',
        {
          section,
          actionLabel: 'Log Activity',
          icon: '🟢',
          priority: 'medium'
        }
      );
    }

    if (consecutiveInactiveDays === 2) {
      return createNotification(
        'grace_warning',
        `${section} at risk`,
        "You're close to dropping from Green. One quick log before noon keeps it alive.",
        {
          section,
          actionLabel: 'Save Green Status',
          icon: '⚠️',
          priority: 'urgent'
        }
      );
    }
  }

  // Positive reinforcement for good streaks
  if (color === 'green' && activeDaysInWeek >= 5 && holdDuration) {
    const days = Math.floor(holdDuration / (24 * 60 * 60 * 1000));
    if (days >= 3 && days % 3 === 0) { // Every 3 days
      return createNotification(
        'positive_reinforcement',
        `${days} days strong in ${section}`,
        'Your Green Hold is climbing! Keep the momentum going.',
        {
          section,
          actionLabel: 'View Progress',
          icon: '🚀',
          priority: 'low'
        }
      );
    }
  }

  return null;
}