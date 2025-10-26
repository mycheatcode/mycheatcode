import { CheatCodePower } from './cheatCodePowerSystem';
import { ManagedCheatCode } from './codeManagementSystem';
import { Section } from './progressionSystem';

// Decay configuration
export const DECAY_CONFIG = {
  inactivityThreshold: 72 * 60 * 60 * 1000, // 72 hours in milliseconds
  decayRatePerDay: 0.05, // 5% per day
  checkInterval: 24 * 60 * 60 * 1000 // 24 hours between decay checks
};

// Helper function to get next midnight in local time
export function getNextMidnight(fromTime: number = Date.now()): number {
  const date = new Date(fromTime);
  const nextMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  return nextMidnight.getTime();
}

// Helper function to get previous midnight in local time
export function getPreviousMidnight(fromTime: number = Date.now()): number {
  const date = new Date(fromTime);
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  return midnight.getTime();
}

// Check if decay should run (at midnight local time)
export function shouldRunDecayCheck(lastDecayCheck: number, currentTime: number = Date.now()): boolean {
  const lastMidnight = getPreviousMidnight(currentTime);
  const lastDecayMidnight = getPreviousMidnight(lastDecayCheck);

  // Run decay if we've crossed a midnight boundary since the last check
  return lastMidnight > lastDecayMidnight;
}

export interface DecayState {
  lastDecayCheck: number;
  codeLastDecayCheck: Record<string, number>; // cheatCodeId -> timestamp
}

// Storage key
const DECAY_STATE_KEY = 'decayState';

// Get decay state from localStorage
export function getDecayState(): DecayState {
  const stored = localStorage.getItem(DECAY_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing decay state:', error);
    }
  }

  return {
    lastDecayCheck: Date.now(),
    codeLastDecayCheck: {}
  };
}

// Save decay state to localStorage
export function saveDecayState(state: DecayState): void {
  localStorage.setItem(DECAY_STATE_KEY, JSON.stringify(state));
}


// Check if a cheat code should decay
export function shouldApplyDecay(
  cheatCode: CheatCodePower,
  currentTime: number = Date.now()
): boolean {
  const timeSinceLastUse = currentTime - cheatCode.lastUsedTimestamp;
  return timeSinceLastUse > DECAY_CONFIG.inactivityThreshold;
}

// Calculate decay amount for a cheat code
export function calculateDecayAmount(
  cheatCode: CheatCodePower,
  sectionColor: 'red' | 'orange' | 'yellow' | 'green',
  currentTime: number = Date.now()
): number {
  if (!shouldApplyDecay(cheatCode, currentTime)) {
    return 0;
  }

  const decayState = getDecayState();
  const lastDecayCheck = decayState.codeLastDecayCheck[cheatCode.cheatCodeId] || cheatCode.lastUsedTimestamp;

  // Calculate time since last decay check (not last use)
  const timeSinceLastDecay = Math.max(0, currentTime - lastDecayCheck);

  // Only start decay after 72 hours of inactivity
  const inactivityTime = currentTime - cheatCode.lastUsedTimestamp;
  if (inactivityTime <= DECAY_CONFIG.inactivityThreshold) {
    return 0;
  }

  // Calculate number of midnight boundaries crossed since decay should start (after 72h)
  const decayStartTime = cheatCode.lastUsedTimestamp + DECAY_CONFIG.inactivityThreshold;
  const effectiveStartTime = Math.max(decayStartTime, lastDecayCheck);

  // Count midnight boundaries between effective start time and current time
  let midnightCount = 0;
  let checkDate = new Date(effectiveStartTime);
  const currentDate = new Date(currentTime);

  while (checkDate < currentDate) {
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate <= currentDate) {
      midnightCount++;
    }
  }

  // Calculate base decay amount (5% per midnight boundary crossed)
  const baseDecayAmount = midnightCount * DECAY_CONFIG.decayRatePerDay * 100;

  // No floors - allow decay to 0%
  const maxDecay = Math.max(0, cheatCode.powerPercentage);
  const actualDecay = Math.min(baseDecayAmount, maxDecay);

  return actualDecay;
}

// Apply decay to a cheat code
export function applyDecayToCheatCode(
  cheatCode: CheatCodePower,
  sectionColor: 'red' | 'orange' | 'yellow' | 'green',
  currentTime: number = Date.now()
): CheatCodePower {
  const decayAmount = calculateDecayAmount(cheatCode, sectionColor, currentTime);

  if (decayAmount === 0) {
    return cheatCode;
  }

  const newPowerPercentage = Math.max(
    0,
    cheatCode.powerPercentage - decayAmount
  );

  const decayedCode = {
    ...cheatCode,
    powerPercentage: newPowerPercentage
  };

  // Update decay tracking
  const decayState = getDecayState();
  decayState.codeLastDecayCheck[cheatCode.cheatCodeId] = currentTime;
  saveDecayState(decayState);


  return decayedCode;
}

// Check and apply decay if enough time has passed (for periodic background checks)
export function checkAndApplyDecayIfNeeded(
  cheatCodes: ManagedCheatCode[],
  getSectionColor: (section: Section) => 'red' | 'orange' | 'yellow' | 'green',
  currentTime: number = Date.now()
): { decayApplied: boolean; updatedCodes: ManagedCheatCode[] } {
  const decayState = getDecayState();

  // Only run decay if enough time has passed since last check (24 hours)
  if (currentTime - decayState.lastDecayCheck < DECAY_CONFIG.checkInterval) {
    return { decayApplied: false, updatedCodes: cheatCodes };
  }

  const decayedCodes = cheatCodes.map(code => {
    if (code.archived) {
      return code;
    }
    const sectionColor = getSectionColor(code.section as Section);
    return applyDecayToCheatCode(code, sectionColor, currentTime) as ManagedCheatCode;
  });

  // Update last decay check
  decayState.lastDecayCheck = currentTime;
  saveDecayState(decayState);

  return { decayApplied: true, updatedCodes: decayedCodes };
}

// Apply decay to multiple cheat codes with their section colors (legacy function - kept for compatibility)
export function applyDecayToCheatCodes(
  cheatCodes: ManagedCheatCode[],
  getSectionColor: (section: Section) => 'red' | 'orange' | 'yellow' | 'green',
  currentTime: number = Date.now(),
  excludeCheatCodeId?: string
): ManagedCheatCode[] {
  const decayState = getDecayState();

  // Only run decay if we've crossed a midnight boundary since last check
  if (!shouldRunDecayCheck(decayState.lastDecayCheck, currentTime)) {
    return cheatCodes;
  }

  const decayedCodes = cheatCodes.map(code => {
    // Skip archived codes
    if (code.archived) {
      return code;
    }

    // Skip the excluded cheat code (the one just used)
    if (excludeCheatCodeId && code.cheatCodeId === excludeCheatCodeId) {
      return code;
    }

    const sectionColor = getSectionColor(code.section as Section);
    return applyDecayToCheatCode(code, sectionColor, currentTime) as ManagedCheatCode;
  });

  // Update last decay check
  decayState.lastDecayCheck = currentTime;
  saveDecayState(decayState);

  return decayedCodes;
}

// Get time until next decay for a cheat code
export function getTimeUntilNextDecay(cheatCode: CheatCodePower): number {
  const timeSinceLastUse = Date.now() - cheatCode.lastUsedTimestamp;

  if (timeSinceLastUse < DECAY_CONFIG.inactivityThreshold) {
    return DECAY_CONFIG.inactivityThreshold - timeSinceLastUse;
  }

  // Already in decay phase
  return 0;
}

// Get decay warning status for a cheat code
export function getDecayWarningStatus(cheatCode: CheatCodePower): {
  isInDanger: boolean;
  isDecaying: boolean;
  timeUntilDecay: number;
  hoursInactive: number;
} {
  const timeSinceLastUse = Date.now() - cheatCode.lastUsedTimestamp;
  const hoursInactive = Math.floor(timeSinceLastUse / (60 * 60 * 1000));
  const isDecaying = timeSinceLastUse > DECAY_CONFIG.inactivityThreshold;
  const timeUntilDecay = Math.max(0, DECAY_CONFIG.inactivityThreshold - timeSinceLastUse);

  // Consider "in danger" if within 12 hours of decay threshold
  const isInDanger = timeUntilDecay <= (12 * 60 * 60 * 1000) && timeUntilDecay > 0;

  return {
    isInDanger,
    isDecaying,
    timeUntilDecay,
    hoursInactive
  };
}

// Format time for decay warnings
export function formatDecayTime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}


// Reset decay tracking for a cheat code (when it's used)
export function resetDecayTracking(cheatCodeId: string): void {
  const decayState = getDecayState();
  const currentTime = Date.now();

  // Reset decay tracking for this code
  decayState.codeLastDecayCheck[cheatCodeId] = currentTime;

  saveDecayState(decayState);
}