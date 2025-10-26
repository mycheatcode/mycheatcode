import { CheatCodePower, UserPowerProfile } from './cheatCodePowerSystem';
import { UserProgression, SectionProgress, Section } from './progressionSystem';
import { applyDecayToCheatCode } from './decaySystem';
import {
  startGreenHoldTimer,
  stopGreenHoldTimer,
  updateSectionActivity,
  checkGreenConsistency,
  hasActiveGreenHold,
  getCurrentHoldDuration
} from './greenHoldSystem';
import { resetDecayTracking } from './decaySystem';
import { getCodeManagementState } from './codeManagementSystem';

export interface SectionScore {
  section: Section;
  score: number; // 0-100, average of all active cheat codes in this section
  color: 'red' | 'orange' | 'yellow' | 'green';
  activeCodesCount: number;
  totalValidLogs: number;
  uniqueCodesUsed: number;
  isFullyQualified: boolean; // True if both score threshold AND guardrails are met
}

export interface RadarState {
  radarScore: number; // 0-100, average of all 5 section scores
  isFullRadarGreen: boolean; // True only if all 5 sections are Green
  sectionScores: Record<Section, SectionScore>;
  lastUpdated: number;
}

// Daily cap tracking
export interface DailyCapTracker {
  date: string; // YYYY-MM-DD format
  sectionCounts: Record<Section, number>; // Logs counted today per section
}

const DAILY_CAP_PER_SECTION = 3;

// Calculate Section Score (average of active cheat codes' power)
export function calculateSectionScore(
  section: Section,
  powerProfile: UserPowerProfile,
  progressionProfile: UserProgression
): SectionScore {
  // Get all active (non-archived) cheat codes for this section
  const activeCodes = Object.values(powerProfile.cheatCodes).filter(
    code => code.section === section && !isCodeArchived(code.cheatCodeId, progressionProfile)
  );

  const activeCodesCount = activeCodes.length;

  // Calculate score (simple average of power percentages)
  const score = activeCodesCount > 0
    ? Math.round(activeCodes.reduce((sum, code) => sum + code.powerPercentage, 0) / activeCodesCount)
    : 0;

  // Get progression data for guardrails
  const sectionProgress = progressionProfile.sections[section];
  const totalValidLogs = sectionProgress?.totalLogs || 0;
  const uniqueCodesUsed = sectionProgress?.uniqueCheatCodes.size || 0;

  // Determine color based on score thresholds
  let potentialColor: 'red' | 'orange' | 'yellow' | 'green' = 'red';
  if (score >= 75) potentialColor = 'green';
  else if (score >= 50) potentialColor = 'yellow';
  else if (score >= 25) potentialColor = 'orange';

  // Check guardrails for the potential color
  const isFullyQualified = checkGuardrails(potentialColor, totalValidLogs, uniqueCodesUsed);

  // Final color is the highest eligible color (considering guardrails)
  const finalColor = getFinalEligibleColor(score, totalValidLogs, uniqueCodesUsed);

  return {
    section,
    score,
    color: finalColor,
    activeCodesCount,
    totalValidLogs,
    uniqueCodesUsed,
    isFullyQualified
  };
}

// Check if guardrails are satisfied for a given color
function checkGuardrails(color: string, totalLogs: number, uniqueCodes: number): boolean {
  switch (color) {
    case 'red':
      return true; // No guardrails for red
    case 'orange':
      return totalLogs >= 2 && uniqueCodes >= 1;
    case 'yellow':
      return totalLogs >= 6 && uniqueCodes >= 2;
    case 'green':
      return totalLogs >= 12 && uniqueCodes >= 3;
    default:
      return false;
  }
}

// Get the highest eligible color considering both score and guardrails
function getFinalEligibleColor(
  score: number,
  totalLogs: number,
  uniqueCodes: number
): 'red' | 'orange' | 'yellow' | 'green' {
  // Check from highest to lowest
  if (score >= 75 && checkGuardrails('green', totalLogs, uniqueCodes)) {
    return 'green';
  }
  if (score >= 50 && checkGuardrails('yellow', totalLogs, uniqueCodes)) {
    return 'yellow';
  }
  if (score >= 25 && checkGuardrails('orange', totalLogs, uniqueCodes)) {
    return 'orange';
  }
  return 'red';
}

// Check if a cheat code is archived (helper function)
function isCodeArchived(cheatCodeId: string, progressionProfile: UserProgression): boolean {
  try {
    const managementState = getCodeManagementState();

    // Search all sections for this code
    for (const sectionManagement of Object.values(managementState.sections)) {
      // Check if it's in archived codes
      const archivedCode = sectionManagement.archivedCodes.find(
        code => code.cheatCodeId === cheatCodeId
      );
      if (archivedCode) return true;

      // If found in active codes, it's not archived
      const activeCode = sectionManagement.activeCodes.find(
        code => code.cheatCodeId === cheatCodeId
      );
      if (activeCode) return false;
    }

    // If not found in management system, check the old archived property for compatibility
    return false;
  } catch (error) {
    console.error('Error checking archive status:', error);
    return false;
  }
}

// Calculate complete radar state with decay applied
export function calculateRadarState(
  powerProfile: UserPowerProfile,
  progressionProfile: UserProgression,
  applyDecay: boolean = true
): RadarState {
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];

  let workingPowerProfile = powerProfile;

  // Apply decay if requested
  if (applyDecay) {
    const getSectionColorForDecay = (sectionId: Section): 'red' | 'orange' | 'yellow' | 'green' => {
      // Calculate section score with current power profile to determine decay floor
      const tempSectionScore = calculateSectionScore(sectionId, powerProfile, progressionProfile);
      return tempSectionScore.color;
    };

    const decayedCheatCodes: Record<string, CheatCodePower> = {};

    Object.values(powerProfile.cheatCodes).forEach(code => {
      const sectionColor = getSectionColorForDecay(code.section as Section);
      const decayedCode = applyDecayToCheatCode(code, sectionColor);
      decayedCheatCodes[code.cheatCodeId] = decayedCode;
    });

    workingPowerProfile = {
      ...powerProfile,
      cheatCodes: decayedCheatCodes
    };
  }

  const sectionScores: Record<Section, SectionScore> = {} as Record<Section, SectionScore>;
  let totalScore = 0;
  let greenSections = 0;

  // Calculate each section score
  sections.forEach(section => {
    const sectionScore = calculateSectionScore(section, workingPowerProfile, progressionProfile);
    sectionScores[section] = sectionScore;
    totalScore += sectionScore.score;

    if (sectionScore.color === 'green') {
      greenSections++;
    }
  });

  // Calculate radar score (average of all sections)
  const radarScore = Math.round(totalScore / sections.length);

  // Full Radar Green only if ALL sections are green
  const isFullRadarGreen = greenSections === sections.length;

  return {
    radarScore,
    isFullRadarGreen,
    sectionScores,
    lastUpdated: Date.now()
  };
}

// Daily cap management
export function getDailyCapTracker(): DailyCapTracker {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (typeof window === 'undefined') {
    // Return default state during SSR
    const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
    const sectionCounts: Record<Section, number> = {} as Record<Section, number>;
    sections.forEach(section => {
      sectionCounts[section] = 0;
    });
    return {
      date: today,
      sectionCounts
    };
  }

  const stored = localStorage.getItem('dailyCapTracker');

  if (stored) {
    const tracker = JSON.parse(stored);
    if (tracker.date === today) {
      return tracker;
    }
  }

  // Create new tracker for today
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
  const sectionCounts: Record<Section, number> = {} as Record<Section, number>;
  sections.forEach(section => {
    sectionCounts[section] = 0;
  });

  return {
    date: today,
    sectionCounts
  };
}

export function saveDailyCapTracker(tracker: DailyCapTracker): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dailyCapTracker', JSON.stringify(tracker));
  }
}

// Check if a section has reached its daily cap
export function isSectionAtDailyCap(section: Section): boolean {
  const tracker = getDailyCapTracker();
  return tracker.sectionCounts[section] >= DAILY_CAP_PER_SECTION;
}

// Increment daily cap counter (returns true if log should be counted)
export function incrementDailyCapCounter(section: Section): boolean {
  const tracker = getDailyCapTracker();

  if (tracker.sectionCounts[section] >= DAILY_CAP_PER_SECTION) {
    // Cap reached, don't count this log
    return false;
  }

  // Increment counter and save
  tracker.sectionCounts[section]++;
  saveDailyCapTracker(tracker);
  return true; // Log should be counted
}

// Get remaining logs for today in a section
export function getRemainingDailyLogs(section: Section): number {
  const tracker = getDailyCapTracker();
  return Math.max(0, DAILY_CAP_PER_SECTION - tracker.sectionCounts[section]);
}

// Complete update flow with Green Hold and Decay: code → section → radar
export function executeCompleteUpdate(
  cheatCodeId: string,
  cheatCodeName: string,
  section: Section,
  powerProfile: UserPowerProfile,
  progressionProfile: UserProgression
): {
  shouldCount: boolean;
  updatedRadarState: RadarState;
  sectionChanged: boolean;
  radarChanged: boolean;
  remainingDailyLogs: number;
  greenHoldEvents: {
    started?: boolean;
    stopped?: { duration: number; wasRecord: boolean; };
    continued?: boolean;
  };
} {
  // Step 1: Check daily cap
  const shouldCount = incrementDailyCapCounter(section);
  const remainingDailyLogs = getRemainingDailyLogs(section);

  // Step 2: Reset decay tracking for the used cheat code
  if (shouldCount) {
    resetDecayTracking(cheatCodeId);
    // Update section activity for Green Hold consistency
    updateSectionActivity(section);
  }

  // Step 3: Use the current power profile for radar calculations (no decay during usage)
  const updatedPowerProfile = powerProfile;

  // Step 4: Calculate radar state (before and after for comparison)
  const beforeRadar = calculateRadarState(powerProfile, progressionProfile);
  const afterRadar = calculateRadarState(updatedPowerProfile, progressionProfile);

  // Step 5: Handle Green Hold Timer events
  const greenHoldEvents: {
    started?: boolean;
    stopped?: { duration: number; wasRecord: boolean; };
    continued?: boolean;
  } = {};

  const beforeSectionColor = beforeRadar.sectionScores[section]?.color;
  const afterSectionColor = afterRadar.sectionScores[section]?.color;
  const hadActiveHold = hasActiveGreenHold(section);

  // Section became Green
  if (beforeSectionColor !== 'green' && afterSectionColor === 'green') {
    startGreenHoldTimer(section);
    greenHoldEvents.started = true;
  }
  // Section dropped from Green
  else if (beforeSectionColor === 'green' && afterSectionColor !== 'green' && hadActiveHold) {
    const record = stopGreenHoldTimer(section);
    if (record) {
      greenHoldEvents.stopped = {
        duration: record.holdDuration,
        wasRecord: true // Could implement record checking logic here
      };
    }
  }
  // Section stayed Green
  else if (afterSectionColor === 'green' && hadActiveHold && shouldCount) {
    greenHoldEvents.continued = true;
  }

  // Step 6: Check Green maintenance requirements
  if (afterSectionColor === 'green') {
    const consistency = checkGreenConsistency(section);
    if (!consistency.meetsRequirements) {
    }
  }

  // Step 7: Detect changes for animations
  const beforeSection = beforeRadar.sectionScores[section];
  const afterSection = afterRadar.sectionScores[section];

  const sectionChanged = beforeSection?.color !== afterSection?.color ||
                        beforeSection?.score !== afterSection?.score;

  const radarChanged = beforeRadar.radarScore !== afterRadar.radarScore ||
                      beforeRadar.isFullRadarGreen !== afterRadar.isFullRadarGreen;

  return {
    shouldCount,
    updatedRadarState: afterRadar,
    sectionChanged,
    radarChanged,
    remainingDailyLogs,
    greenHoldEvents
  };
}

// Get section color as hex for UI
export function getSectionColorHex(color: 'red' | 'orange' | 'yellow' | 'green'): string {
  const colorMap = {
    red: '#FF0000',
    orange: '#FFA500',
    yellow: '#FFFF00',
    green: '#00FF00'
  };
  return colorMap[color];
}

// Get progress toward next section color
export function getNextSectionTarget(sectionScore: SectionScore): {
  nextColor: 'orange' | 'yellow' | 'green' | null;
  scoreNeeded: number;
  logsNeeded: number;
  codesNeeded: number;
} | null {
  const { score, totalValidLogs, uniqueCodesUsed } = sectionScore;

  if (sectionScore.color === 'green') {
    return null; // Already at max
  }

  // Determine next target
  let nextColor: 'orange' | 'yellow' | 'green';
  let scoreNeeded = 0;
  let logsNeeded = 0;
  let codesNeeded = 0;

  if (score < 25) {
    nextColor = 'orange';
    scoreNeeded = Math.max(0, 25 - score);
    logsNeeded = Math.max(0, 2 - totalValidLogs);
    codesNeeded = Math.max(0, 1 - uniqueCodesUsed);
  } else if (score < 50) {
    nextColor = 'yellow';
    scoreNeeded = Math.max(0, 50 - score);
    logsNeeded = Math.max(0, 6 - totalValidLogs);
    codesNeeded = Math.max(0, 2 - uniqueCodesUsed);
  } else {
    nextColor = 'green';
    scoreNeeded = Math.max(0, 75 - score);
    logsNeeded = Math.max(0, 12 - totalValidLogs);
    codesNeeded = Math.max(0, 3 - uniqueCodesUsed);
  }

  return {
    nextColor,
    scoreNeeded,
    logsNeeded,
    codesNeeded
  };
}

// Run maintenance check for all Green sections
export function runGreenMaintenanceCheck(): {
  sectionsToWarn: Section[];
  sectionsToDemote: Section[];
  sectionStates: Record<Section, {
    color: 'red' | 'orange' | 'yellow' | 'green';
    consistency: ReturnType<typeof checkGreenConsistency>;
    holdDuration: number;
  }>;
} {
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
  const sectionsToWarn: Section[] = [];
  const sectionsToDemote: Section[] = [];
  const sectionStates: Record<Section, any> = {} as Record<Section, any>;

  sections.forEach(section => {
    const consistency = checkGreenConsistency(section);
    const holdDuration = getCurrentHoldDuration(section);

    sectionStates[section] = {
      color: 'red', // Will be filled by the hook with actual data
      consistency,
      holdDuration
    };

    // Check for warnings and demotions based on consistency
    if (consistency.consecutiveInactiveDays === 2 && !consistency.graceDeadline) {
      sectionsToWarn.push(section);
    }

    if (consistency.graceDeadline && Date.now() >= consistency.graceDeadline) {
      sectionsToDemote.push(section);
    }
  });

  return {
    sectionsToWarn,
    sectionsToDemote,
    sectionStates
  };
}

// Get Green Hold status for a section
export function getGreenHoldStatus(section: Section): {
  hasActiveHold: boolean;
  currentDuration: number;
  formattedDuration: string;
  nextMilestone: {
    name: string;
    timeRemaining: number;
  } | null;
} {
  const hasActive = hasActiveGreenHold(section);
  const duration = getCurrentHoldDuration(section);

  let nextMilestone = null;
  if (hasActive) {
    const milestones = [
      { name: '3-Day Hold', duration: 3 * 24 * 60 * 60 * 1000 },
      { name: 'Week Strong', duration: 7 * 24 * 60 * 60 * 1000 },
      { name: '2-Week Streak', duration: 14 * 24 * 60 * 60 * 1000 },
      { name: 'Monthly Master', duration: 30 * 24 * 60 * 60 * 1000 },
      { name: '60-Day Elite', duration: 60 * 24 * 60 * 60 * 1000 },
      { name: '90-Day Legend', duration: 90 * 24 * 60 * 60 * 1000 }
    ];

    const next = milestones.find(m => duration < m.duration);
    if (next) {
      nextMilestone = {
        name: next.name,
        timeRemaining: next.duration - duration
      };
    }
  }

  const formatDuration = (ms: number): string => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  return {
    hasActiveHold: hasActive,
    currentDuration: duration,
    formattedDuration: formatDuration(duration),
    nextMilestone
  };
}

// Force demotion of a section from Green (for maintenance failures)
export function forceSectionDemotion(
  section: Section,
  powerProfile: UserPowerProfile,
  progressionProfile: UserProgression
): {
  updatedRadarState: RadarState;
  holdRecord: ReturnType<typeof stopGreenHoldTimer>;
} {
  const holdRecord = stopGreenHoldTimer(section);
  const updatedRadarState = calculateRadarState(powerProfile, progressionProfile);


  return {
    updatedRadarState,
    holdRecord
  };
}