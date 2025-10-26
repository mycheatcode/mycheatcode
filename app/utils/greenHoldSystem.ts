import { Section } from './progressionSystem';

// Green Hold Timer interfaces
export interface GreenHoldTimer {
  sectionId: Section;
  startTime: number; // timestamp when section turned green
  isActive: boolean;
  currentHoldDuration?: number; // calculated dynamically
}

export interface GreenHoldRecord {
  sectionId: Section;
  holdDuration: number; // in milliseconds
  startTime: number;
  endTime: number;
  achievedMilestones: GreenHoldMilestone[];
}

export interface GreenHoldMilestone {
  id: string;
  name: string;
  durationMs: number;
  badgeIcon?: string;
}

export interface GreenHoldState {
  activeTimers: Record<Section, GreenHoldTimer>;
  longestHolds: Record<Section, GreenHoldRecord>;
  allTimeRecords: GreenHoldRecord[];
}

// Consistency tracking for Green sections
export interface SectionConsistency {
  sectionId: Section;
  lastActivityTimestamp: number;
  consecutiveInactiveDays: number;
  graceDeadline?: number; // timestamp of Day 3 at noon
  sevenDayStreak: boolean;
  activeDaysInWeek: number; // out of 7
  weeklyActivityLog: number[]; // timestamps of activity in last 7 days
}

export interface ConsistencyState {
  sectionConsistency: Record<Section, SectionConsistency>;
  lastMaintenanceCheck: number;
}

// Predefined milestones
export const GREEN_HOLD_MILESTONES: GreenHoldMilestone[] = [
  { id: 'first_green', name: 'First Green', durationMs: 0, badgeIcon: '🟢' },
  { id: 'three_days', name: '3-Day Hold', durationMs: 3 * 24 * 60 * 60 * 1000, badgeIcon: '🔥' },
  { id: 'seven_days', name: 'Week Strong', durationMs: 7 * 24 * 60 * 60 * 1000, badgeIcon: '💪' },
  { id: 'fourteen_days', name: '2-Week Streak', durationMs: 14 * 24 * 60 * 60 * 1000, badgeIcon: '⭐' },
  { id: 'thirty_days', name: 'Monthly Master', durationMs: 30 * 24 * 60 * 60 * 1000, badgeIcon: '👑' },
  { id: 'sixty_days', name: '60-Day Elite', durationMs: 60 * 24 * 60 * 60 * 1000, badgeIcon: '🏆' },
  { id: 'ninety_days', name: '90-Day Legend', durationMs: 90 * 24 * 60 * 60 * 1000, badgeIcon: '💎' }
];

// Storage keys
const GREEN_HOLD_STATE_KEY = 'greenHoldState';
const CONSISTENCY_STATE_KEY = 'consistencyState';

// Get green hold state from localStorage
export function getGreenHoldState(): GreenHoldState {
  if (typeof window === 'undefined') {
    // Return default state during SSR
    const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
    const activeTimers: Record<Section, GreenHoldTimer> = {} as Record<Section, GreenHoldTimer>;
    const longestHolds: Record<Section, GreenHoldRecord> = {} as Record<Section, GreenHoldRecord>;

    sections.forEach(section => {
      activeTimers[section] = {
        sectionId: section,
        startTime: 0,
        isActive: false
      };
      longestHolds[section] = {
        sectionId: section,
        holdDuration: 0,
        startTime: 0,
        endTime: 0,
        achievedMilestones: []
      };
    });

    return {
      activeTimers,
      longestHolds,
      allTimeRecords: []
    };
  }

  const stored = localStorage.getItem(GREEN_HOLD_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing green hold state:', error);
    }
  }

  // Return default state
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
  const activeTimers: Record<Section, GreenHoldTimer> = {} as Record<Section, GreenHoldTimer>;
  const longestHolds: Record<Section, GreenHoldRecord> = {} as Record<Section, GreenHoldRecord>;

  sections.forEach(section => {
    activeTimers[section] = {
      sectionId: section,
      startTime: 0,
      isActive: false
    };
  });

  return {
    activeTimers,
    longestHolds,
    allTimeRecords: []
  };
}

// Save green hold state to localStorage
export function saveGreenHoldState(state: GreenHoldState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GREEN_HOLD_STATE_KEY, JSON.stringify(state));
  }
}

// Get consistency state from localStorage
export function getConsistencyState(): ConsistencyState {
  if (typeof window === 'undefined') {
    // Return default state during SSR
    const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
    const sectionConsistency: Record<Section, SectionConsistency> = {} as Record<Section, SectionConsistency>;

    sections.forEach(section => {
      sectionConsistency[section] = {
        sectionId: section,
        lastActivityTimestamp: 0,
        consecutiveInactiveDays: 0,
        sevenDayStreak: false,
        activeDaysInWeek: 0,
        weeklyActivityLog: []
      };
    });

    return {
      sectionConsistency,
      lastMaintenanceCheck: Date.now()
    };
  }

  const stored = localStorage.getItem(CONSISTENCY_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing consistency state:', error);
    }
  }

  // Return default state
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
  const sectionConsistency: Record<Section, SectionConsistency> = {} as Record<Section, SectionConsistency>;

  sections.forEach(section => {
    sectionConsistency[section] = {
      sectionId: section,
      lastActivityTimestamp: 0,
      consecutiveInactiveDays: 0,
      sevenDayStreak: false,
      activeDaysInWeek: 0,
      weeklyActivityLog: []
    };
  });

  return {
    sectionConsistency,
    lastMaintenanceCheck: Date.now()
  };
}

// Save consistency state to localStorage
export function saveConsistencyState(state: ConsistencyState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONSISTENCY_STATE_KEY, JSON.stringify(state));
  }
}

// Start green hold timer for a section
export function startGreenHoldTimer(section: Section): void {
  const state = getGreenHoldState();

  state.activeTimers[section] = {
    sectionId: section,
    startTime: Date.now(),
    isActive: true
  };

  saveGreenHoldState(state);
}

// Stop and record green hold timer
export function stopGreenHoldTimer(section: Section): GreenHoldRecord | null {
  const state = getGreenHoldState();
  const timer = state.activeTimers[section];

  if (!timer.isActive || timer.startTime === 0) {
    return null;
  }

  const endTime = Date.now();
  const holdDuration = endTime - timer.startTime;

  // Calculate achieved milestones
  const achievedMilestones = GREEN_HOLD_MILESTONES.filter(
    milestone => holdDuration >= milestone.durationMs
  );

  const record: GreenHoldRecord = {
    sectionId: section,
    holdDuration,
    startTime: timer.startTime,
    endTime,
    achievedMilestones
  };

  // Update longest hold for this section if this is a new record
  const currentLongest = state.longestHolds[section];
  if (!currentLongest || holdDuration > currentLongest.holdDuration) {
    state.longestHolds[section] = record;
  }

  // Add to all-time records
  state.allTimeRecords.push(record);
  state.allTimeRecords.sort((a, b) => b.holdDuration - a.holdDuration);

  // Reset timer
  state.activeTimers[section] = {
    sectionId: section,
    startTime: 0,
    isActive: false
  };

  saveGreenHoldState(state);

  return record;
}

// Get current hold duration for active timer
export function getCurrentHoldDuration(section: Section): number {
  const state = getGreenHoldState();
  const timer = state.activeTimers[section];

  if (!timer.isActive || timer.startTime === 0) {
    return 0;
  }

  return Date.now() - timer.startTime;
}

// Check if section has active green hold timer
export function hasActiveGreenHold(section: Section): boolean {
  const state = getGreenHoldState();
  const timer = state.activeTimers[section];
  return timer.isActive && timer.startTime > 0;
}

// Format duration for display
export function formatDuration(durationMs: number): string {
  const days = Math.floor(durationMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((durationMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    if (hours > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours}h`;
    }
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

// Format duration for hold display
export function formatHoldDuration(durationMs: number): string {
  const days = Math.floor(durationMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((durationMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ${hours}h`;
  }

  return `${hours}h`;
}

// Get achieved milestones for current hold
export function getCurrentMilestones(section: Section): GreenHoldMilestone[] {
  const duration = getCurrentHoldDuration(section);
  return GREEN_HOLD_MILESTONES.filter(milestone => duration >= milestone.durationMs);
}

// Get next milestone for current hold
export function getNextMilestone(section: Section): GreenHoldMilestone | null {
  const duration = getCurrentHoldDuration(section);
  return GREEN_HOLD_MILESTONES.find(milestone => duration < milestone.durationMs) || null;
}

// Update consistency tracking when section has activity
export function updateSectionActivity(section: Section): void {
  const consistencyState = getConsistencyState();
  const now = Date.now();

  const sectionConsistency = consistencyState.sectionConsistency[section];
  sectionConsistency.lastActivityTimestamp = now;
  sectionConsistency.consecutiveInactiveDays = 0;
  sectionConsistency.graceDeadline = undefined; // Cancel any grace period

  // Update weekly activity log
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - (7 * oneDayMs);

  // Remove activities older than 7 days
  sectionConsistency.weeklyActivityLog = sectionConsistency.weeklyActivityLog.filter(
    timestamp => timestamp > sevenDaysAgo
  );

  // Add today's activity if not already present
  const today = Math.floor(now / oneDayMs) * oneDayMs;
  if (!sectionConsistency.weeklyActivityLog.some(timestamp =>
    Math.floor(timestamp / oneDayMs) === Math.floor(today / oneDayMs)
  )) {
    sectionConsistency.weeklyActivityLog.push(now);
  }

  // Update counts
  sectionConsistency.activeDaysInWeek = sectionConsistency.weeklyActivityLog.length;
  sectionConsistency.sevenDayStreak = checkSevenDayStreak(sectionConsistency.weeklyActivityLog);

  saveConsistencyState(consistencyState);
}

// Check if section has 7-day rolling streak
function checkSevenDayStreak(activityLog: number[]): boolean {
  if (activityLog.length < 7) return false;

  const oneDayMs = 24 * 60 * 60 * 1000;
  const sortedLog = activityLog.sort((a, b) => b - a); // Most recent first

  // Check if we have activity in each of the last 7 days
  for (let i = 0; i < 7; i++) {
    const targetDay = Math.floor((Date.now() - (i * oneDayMs)) / oneDayMs) * oneDayMs;
    const hasActivityThisDay = sortedLog.some(timestamp =>
      Math.floor(timestamp / oneDayMs) === Math.floor(targetDay / oneDayMs)
    );

    if (!hasActivityThisDay) {
      return false;
    }
  }

  return true;
}

// Check consistency requirements for green sections
export function checkGreenConsistency(section: Section): {
  meetsRequirements: boolean;
  activeDaysInWeek: number;
  hasSevenDayStreak: boolean;
  consecutiveInactiveDays: number;
  graceDeadline?: number;
} {
  const consistencyState = getConsistencyState();
  const sectionConsistency = consistencyState.sectionConsistency[section];

  const meetsRequirements = sectionConsistency.activeDaysInWeek >= 4 &&
                           sectionConsistency.sevenDayStreak &&
                           sectionConsistency.consecutiveInactiveDays < 3;

  return {
    meetsRequirements,
    activeDaysInWeek: sectionConsistency.activeDaysInWeek,
    hasSevenDayStreak: sectionConsistency.sevenDayStreak,
    consecutiveInactiveDays: sectionConsistency.consecutiveInactiveDays,
    graceDeadline: sectionConsistency.graceDeadline
  };
}

// Run daily maintenance check (should be called once per day)
export function runMaintenanceCheck(): {
  sectionsToWarn: Section[];
  sectionsToDemote: Section[];
} {
  const consistencyState = getConsistencyState();
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const sectionsToWarn: Section[] = [];
  const sectionsToDemote: Section[] = [];

  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];

  sections.forEach(section => {
    const sectionConsistency = consistencyState.sectionConsistency[section];
    const daysSinceActivity = Math.floor((now - sectionConsistency.lastActivityTimestamp) / oneDayMs);

    // Update consecutive inactive days
    sectionConsistency.consecutiveInactiveDays = daysSinceActivity;

    // Set grace deadline if we hit 2 inactive days
    if (daysSinceActivity === 2 && !sectionConsistency.graceDeadline) {
      // Day 3 at noon local time
      const tomorrow = new Date(now + oneDayMs);
      tomorrow.setHours(12, 0, 0, 0);
      sectionConsistency.graceDeadline = tomorrow.getTime();
      sectionsToWarn.push(section);
    }

    // Check if grace deadline has passed
    if (sectionConsistency.graceDeadline && now >= sectionConsistency.graceDeadline) {
      sectionsToDemote.push(section);
      sectionConsistency.graceDeadline = undefined;
    }
  });

  consistencyState.lastMaintenanceCheck = now;
  saveConsistencyState(consistencyState);

  return { sectionsToWarn, sectionsToDemote };
}