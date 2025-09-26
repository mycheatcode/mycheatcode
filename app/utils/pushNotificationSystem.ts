import { Section } from './progressionSystem';

// Notification types
export type NotificationType =
  | 'pre_game_reminder'
  | 'green_hold_maintenance'
  | 'section_upgrade_nudge'
  | 'grace_warning'
  | 'win_back_green';

// Notification data structure
export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: number; // timestamp
  section?: Section;
  data?: any;
  sent: boolean;
}

// Notification scheduling rules
export interface NotificationRules {
  maxPerDay: number;
  maxPerWeek: number;
  quietHoursStart: number; // hour (0-23)
  quietHoursEnd: number; // hour (0-23)
  timezone: string;
  evaluationTimes: {
    morning: number; // hour (0-23)
    evening: number; // hour (0-23)
  };
}

// Notification state
export interface NotificationState {
  pendingNotifications: PushNotification[];
  sentNotifications: PushNotification[];
  rules: NotificationRules;
  lastEvaluationCheck: number;
  dailyCount: number;
  weeklyCount: number;
  lastResetDate: string; // YYYY-MM-DD
}

// Storage key
const NOTIFICATION_STATE_KEY = 'pushNotificationState';

// Default rules
const DEFAULT_RULES: NotificationRules = {
  maxPerDay: 2,
  maxPerWeek: 6,
  quietHoursStart: 22, // 10pm
  quietHoursEnd: 8, // 8am
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  evaluationTimes: {
    morning: 9, // 9am
    evening: 18 // 6pm
  }
};

// Get notification state from localStorage
export function getNotificationState(): NotificationState {
  if (typeof window === 'undefined') {
    return {
      pendingNotifications: [],
      sentNotifications: [],
      rules: DEFAULT_RULES,
      lastEvaluationCheck: Date.now(),
      dailyCount: 0,
      weeklyCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0]
    };
  }

  const stored = localStorage.getItem(NOTIFICATION_STATE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        rules: { ...DEFAULT_RULES, ...parsed.rules }
      };
    } catch (error) {
      console.error('Error parsing notification state:', error);
    }
  }

  return {
    pendingNotifications: [],
    sentNotifications: [],
    rules: DEFAULT_RULES,
    lastEvaluationCheck: Date.now(),
    dailyCount: 0,
    weeklyCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  };
}

// Save notification state to localStorage
export function saveNotificationState(state: NotificationState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
  }
}

// Check if within quiet hours
export function isWithinQuietHours(timestamp: number, rules: NotificationRules): boolean {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (rules.quietHoursStart < rules.quietHoursEnd) {
    // Same day quiet hours (e.g., 22-8 next day)
    return hour >= rules.quietHoursStart || hour < rules.quietHoursEnd;
  } else {
    // Cross-day quiet hours (e.g., 10pm-8am)
    return hour >= rules.quietHoursStart && hour < rules.quietHoursEnd;
  }
}

// Check daily/weekly limits
export function canSendNotification(state: NotificationState): boolean {
  const today = new Date().toISOString().split('T')[0];

  // Reset counters if it's a new day
  if (state.lastResetDate !== today) {
    state.dailyCount = 0;
    state.lastResetDate = today;

    // Reset weekly counter on Monday
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1) { // Monday
      state.weeklyCount = 0;
    }

    saveNotificationState(state);
  }

  return state.dailyCount < state.rules.maxPerDay &&
         state.weeklyCount < state.rules.maxPerWeek;
}

// Notification templates with coach-like tone
const NOTIFICATION_TEMPLATES: Record<NotificationType, (data: any) => { title: string; body: string }> = {
  pre_game_reminder: (data) => ({
    title: 'Game Day Ready?',
    body: 'Game today? Try a quick Pre-Game reset.'
  }),

  green_hold_maintenance: (data) => ({
    title: 'Green Hold Active',
    body: `Held Green ${data.days} days. One log keeps it alive.`
  }),

  section_upgrade_nudge: (data) => ({
    title: 'Almost There',
    body: `You're 1 log from ${data.targetColor} in ${data.section}.`
  }),

  grace_warning: (data) => ({
    title: 'Grace Period',
    body: `${data.section} at risk. One quick log before noon keeps it alive.`
  }),

  win_back_green: (data) => ({
    title: 'Win It Back',
    body: `Green dropped after ${data.longestHold} days. Win it back?`
  })
};

// Create a notification
export function createPushNotification(
  type: NotificationType,
  data: any,
  scheduledFor?: number
): PushNotification {
  const template = NOTIFICATION_TEMPLATES[type](data);

  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: template.title,
    body: template.body,
    scheduledFor: scheduledFor || Date.now(),
    section: data.section,
    data,
    sent: false
  };
}

// Schedule a notification
export function scheduleNotification(
  type: NotificationType,
  data: any,
  delay: number = 0
): boolean {
  const state = getNotificationState();
  const scheduledFor = Date.now() + delay;

  // Check if we can send more notifications
  if (!canSendNotification(state)) {
    console.log('Notification limit reached, skipping:', type);
    return false;
  }

  // Check quiet hours
  if (isWithinQuietHours(scheduledFor, state.rules)) {
    // Reschedule for after quiet hours
    const nextMorning = new Date(scheduledFor);
    nextMorning.setHours(state.rules.evaluationTimes.morning, 0, 0, 0);
    if (nextMorning.getTime() <= scheduledFor) {
      nextMorning.setDate(nextMorning.getDate() + 1);
    }

    const rescheduledFor = nextMorning.getTime();
    const notification = createPushNotification(type, data, rescheduledFor);

    state.pendingNotifications.push(notification);
    saveNotificationState(state);

    console.log(`Notification rescheduled for after quiet hours: ${new Date(rescheduledFor)}`);
    return true;
  }

  const notification = createPushNotification(type, data, scheduledFor);
  state.pendingNotifications.push(notification);
  saveNotificationState(state);

  console.log('Notification scheduled:', notification.title, new Date(scheduledFor));
  return true;
}

// Send due notifications (this would integrate with actual push notification service)
export function processPendingNotifications(): PushNotification[] {
  const state = getNotificationState();
  const now = Date.now();
  const dueNotifications: PushNotification[] = [];

  state.pendingNotifications = state.pendingNotifications.filter(notification => {
    if (notification.scheduledFor <= now && !notification.sent) {
      // Check if we can still send
      if (canSendNotification(state)) {
        dueNotifications.push(notification);
        notification.sent = true;
        state.sentNotifications.push(notification);
        state.dailyCount++;
        state.weeklyCount++;

        // In a real app, you would send the actual push notification here
        console.log('Sending push notification:', notification.title, notification.body);

        return false; // Remove from pending
      }
    }
    return true; // Keep in pending
  });

  if (dueNotifications.length > 0) {
    saveNotificationState(state);
  }

  return dueNotifications;
}

// Schedule common notifications
export function scheduleGraceWarning(section: Section, graceEndTime: number) {
  const warningTime = graceEndTime - (2 * 60 * 60 * 1000); // 2 hours before deadline
  const delay = Math.max(0, warningTime - Date.now());

  scheduleNotification('grace_warning', { section }, delay);
}

export function scheduleGreenHoldReminder(section: Section, days: number) {
  // Schedule for next evaluation time (evening)
  const state = getNotificationState();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(state.rules.evaluationTimes.evening, 0, 0, 0);

  const delay = tomorrow.getTime() - Date.now();

  scheduleNotification('green_hold_maintenance', { section, days }, delay);
}

export function scheduleUpgradeNudge(section: Section, targetColor: string) {
  // Schedule for morning evaluation time
  const state = getNotificationState();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(state.rules.evaluationTimes.morning, 0, 0, 0);

  const delay = tomorrow.getTime() - Date.now();

  scheduleNotification('section_upgrade_nudge', { section, targetColor }, delay);
}

export function scheduleWinBackNotification(section: Section, longestHold: number) {
  // Schedule for next evaluation time
  const state = getNotificationState();
  const nextEvaluation = new Date();
  nextEvaluation.setHours(state.rules.evaluationTimes.morning, 0, 0, 0);
  if (nextEvaluation.getTime() <= Date.now()) {
    nextEvaluation.setDate(nextEvaluation.getDate() + 1);
  }

  const delay = nextEvaluation.getTime() - Date.now();

  scheduleNotification('win_back_green', { section, longestHold }, delay);
}

// Request notification permissions (for web)
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Show browser notification (for web)
export function showBrowserNotification(notification: PushNotification) {
  if (Notification.permission === 'granted') {
    const browserNotification = new Notification(notification.title, {
      body: notification.body,
      icon: '/icon.png', // Add your app icon
      badge: '/badge.png', // Add your app badge
      tag: notification.type, // Prevent duplicate notifications of same type
      requireInteraction: false,
      silent: false
    });

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();

      // Navigate to relevant section if applicable
      if (notification.section) {
        // This would integrate with your navigation system
        console.log('Navigate to section:', notification.section);
      }
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }
}

// Initialize notification system
export function initializeNotificationSystem(): Promise<boolean> {
  return requestNotificationPermission();
}

// Clean up old notifications
export function cleanupOldNotifications() {
  const state = getNotificationState();
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  state.sentNotifications = state.sentNotifications.filter(
    notification => notification.scheduledFor > oneWeekAgo
  );

  saveNotificationState(state);
}