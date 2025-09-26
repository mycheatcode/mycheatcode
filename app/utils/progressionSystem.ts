export type ProgressionColor = 'red' | 'orange' | 'yellow' | 'green';
export type Section = 'Pre-Game' | 'In-Game' | 'Post-Game' | 'Off Court' | 'Locker Room';

export interface CheatCodeLog {
  id: string;
  cheatCodeId: string;
  cheatCodeName: string;
  section: Section;
  timestamp: number;
  isValid: boolean;
}

export interface SectionProgress {
  section: Section;
  color: ProgressionColor;
  totalLogs: number;
  uniqueCheatCodes: Set<string>;
  logs: CheatCodeLog[];
  lastLogDate: number | null;
  greenUnlockedAt: number | null; // When Green was first achieved
  streakDays: number; // Current streak of consecutive days with logs
  lastStreakDate: number | null; // Last date that contributed to streak
}

export interface UserProgression {
  sections: Record<Section, SectionProgress>;
  overallColor: ProgressionColor;
  lastUpdated: number;
}

// Initialize empty progression state
export function initializeProgression(): UserProgression {
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];

  const sectionProgress: Record<Section, SectionProgress> = {} as Record<Section, SectionProgress>;

  sections.forEach(section => {
    sectionProgress[section] = {
      section,
      color: 'red',
      totalLogs: 0,
      uniqueCheatCodes: new Set(),
      logs: [],
      lastLogDate: null,
      greenUnlockedAt: null,
      streakDays: 0,
      lastStreakDate: null
    };
  });

  return {
    sections: sectionProgress,
    overallColor: 'red',
    lastUpdated: Date.now()
  };
}

// Calculate color based on progression rules
export function calculateSectionColor(progress: SectionProgress): ProgressionColor {
  const { totalLogs, uniqueCheatCodes, greenUnlockedAt } = progress;
  const uniqueCount = uniqueCheatCodes.size;

  // If Green was achieved, check maintenance rules
  if (greenUnlockedAt) {
    if (isGreenMaintained(progress)) {
      return 'green';
    } else {
      // Dropped from Green due to inactivity
      return 'yellow';
    }
  }

  // Standard progression rules (climbing up)
  if (totalLogs >= 12 && uniqueCount >= 3) {
    return 'green';
  }
  if (totalLogs >= 6 && uniqueCount >= 2) {
    return 'yellow';
  }
  if (totalLogs >= 2 && uniqueCount >= 1) {
    return 'orange';
  }

  return 'red';
}

// Check if Green maintenance rules are satisfied
export function isGreenMaintained(progress: SectionProgress): boolean {
  if (!progress.greenUnlockedAt) return false;

  const now = Date.now();
  const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);

  // 2-day grace period: only check on Day 3
  if (!progress.lastLogDate || progress.lastLogDate < threeDaysAgo) {
    return false;
  }

  // Check 7-day rolling streak (≥1 valid log/day)
  if (progress.streakDays < 7) {
    return false;
  }

  // Check 4 days per week requirement (≈16 logs per 28 days)
  const fourWeeksAgo = now - (28 * 24 * 60 * 60 * 1000);
  const recentLogs = progress.logs.filter(log =>
    log.isValid && log.timestamp >= fourWeeksAgo
  ).length;

  return recentLogs >= 16;
}

// Add a new log and update progression
export function addLogToProgression(
  progression: UserProgression,
  log: CheatCodeLog
): UserProgression {
  const section = log.section;
  const sectionProgress = { ...progression.sections[section] };

  // Add the log
  sectionProgress.logs = [...sectionProgress.logs, log];

  if (log.isValid) {
    sectionProgress.totalLogs++;
    sectionProgress.uniqueCheatCodes.add(log.cheatCodeId);
    sectionProgress.lastLogDate = log.timestamp;

    // Update streak
    updateStreak(sectionProgress, log.timestamp);
  }

  // Recalculate color
  const newColor = calculateSectionColor(sectionProgress);
  const wasGreen = sectionProgress.color === 'green';

  // If just reached Green for the first time, mark when it was unlocked
  if (newColor === 'green' && !wasGreen && !sectionProgress.greenUnlockedAt) {
    sectionProgress.greenUnlockedAt = log.timestamp;
  }

  sectionProgress.color = newColor;

  // Update overall progression
  const updatedSections = {
    ...progression.sections,
    [section]: sectionProgress
  };

  const overallColor = calculateOverallColor(updatedSections);

  return {
    sections: updatedSections,
    overallColor,
    lastUpdated: Date.now()
  };
}

// Update streak counter based on new log
function updateStreak(progress: SectionProgress, logTimestamp: number) {
  const logDate = new Date(logTimestamp);
  const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();

  if (!progress.lastStreakDate) {
    // First log ever
    progress.streakDays = 1;
    progress.lastStreakDate = logDay;
    return;
  }

  const lastStreakDay = progress.lastStreakDate;
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (logDay === lastStreakDay) {
    // Same day, no change to streak
    return;
  } else if (logDay === lastStreakDay + oneDayMs) {
    // Consecutive day, extend streak
    progress.streakDays++;
    progress.lastStreakDate = logDay;
  } else if (logDay > lastStreakDay + oneDayMs) {
    // Gap in days, reset streak
    progress.streakDays = 1;
    progress.lastStreakDate = logDay;
  }
  // If logDay < lastStreakDate, it's a backfilled log, don't affect current streak
}

// Calculate overall progression color (average of all sections)
function calculateOverallColor(sections: Record<Section, SectionProgress>): ProgressionColor {
  const sectionList = Object.values(sections);
  const colorValues = { red: 0, orange: 1, yellow: 2, green: 3 };
  const totalValue = sectionList.reduce((sum, section) => sum + colorValues[section.color], 0);
  const averageValue = totalValue / sectionList.length;

  // Only 100% Green if all sections are Green
  if (sectionList.every(section => section.color === 'green')) {
    return 'green';
  }

  // Otherwise use weighted average
  if (averageValue >= 2.5) return 'yellow';
  if (averageValue >= 1.5) return 'orange';
  if (averageValue >= 0.5) return 'orange';
  return 'red';
}

// Get color as hex value for UI
export function getColorHex(color: ProgressionColor): string {
  const colorMap = {
    red: '#FF0000',
    orange: '#FFA500',
    yellow: '#FFFF00',
    green: '#00FF00'
  };
  return colorMap[color];
}

// Check if user can progress to next level
export function getNextProgressionTarget(progress: SectionProgress): {
  nextColor: ProgressionColor;
  logsNeeded: number;
  cheatCodesNeeded: number;
} | null {
  const { totalLogs, uniqueCheatCodes, color } = progress;
  const uniqueCount = uniqueCheatCodes.size;

  if (color === 'green') {
    return null; // Already at max
  }

  if (color === 'yellow') {
    return {
      nextColor: 'green',
      logsNeeded: Math.max(0, 12 - totalLogs),
      cheatCodesNeeded: Math.max(0, 3 - uniqueCount)
    };
  }

  if (color === 'orange') {
    return {
      nextColor: 'yellow',
      logsNeeded: Math.max(0, 6 - totalLogs),
      cheatCodesNeeded: Math.max(0, 2 - uniqueCount)
    };
  }

  // Red
  return {
    nextColor: 'orange',
    logsNeeded: Math.max(0, 2 - totalLogs),
    cheatCodesNeeded: Math.max(0, 1 - uniqueCount)
  };
}