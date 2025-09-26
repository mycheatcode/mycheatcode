export interface CheatCodePower {
  cheatCodeId: string;
  cheatCodeName: string;
  section: string;
  powerPercentage: number; // 0-100
  totalLogs: number;
  lastUsedTimestamp: number;
  createdTimestamp: number;
  usageLogs: PowerLog[];
  honeymoonBoostActive: boolean;
  freshCodeBonusUsed: number; // 0, 1, or 2 (tracks fresh code bonus usage)
}

export interface PowerLog {
  timestamp: number;
  powerGained: number;
  logType: 'normal' | 'honeymoon' | 'fresh_bonus';
}

export interface UserPowerProfile {
  cheatCodes: Record<string, CheatCodePower>;
  accountCreatedTimestamp: number;
  totalLogsAcrossAllSections: number;
  honeymoonPhaseEnded: boolean;
  honeymoonEndTimestamp?: number;
  lastUpdated: number;
}

// Initialize new user power profile
export function initializePowerProfile(): UserPowerProfile {
  return {
    cheatCodes: {},
    accountCreatedTimestamp: Date.now(),
    totalLogsAcrossAllSections: 0,
    honeymoonPhaseEnded: false,
    lastUpdated: Date.now()
  };
}

// Create new cheat code power entry
export function createCheatCodePower(
  cheatCodeId: string,
  cheatCodeName: string,
  section: string
): CheatCodePower {
  return {
    cheatCodeId,
    cheatCodeName,
    section,
    powerPercentage: 0,
    totalLogs: 0,
    lastUsedTimestamp: Date.now(),
    createdTimestamp: Date.now(),
    usageLogs: [],
    honeymoonBoostActive: true,
    freshCodeBonusUsed: 0
  };
}

// Calculate base power gain based on growth curve
export function calculateBasePowerGain(currentLogs: number): number {
  const logNumber = currentLogs + 1; // Next log number

  if (logNumber <= 3) {
    return 20; // Logs 1-3: +20% each
  } else if (logNumber <= 6) {
    return 10; // Logs 4-6: +10% each
  } else if (logNumber <= 10) {
    return 5;  // Logs 7-10: +5% each
  } else {
    return Math.random() > 0.5 ? 3 : 2; // Logs 11+: +2-3% each
  }
}

// Check if user is in honeymoon phase
export function isInHoneymoonPhase(profile: UserPowerProfile, section: string): boolean {
  if (profile.honeymoonPhaseEnded) return false;

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const accountAge = now - profile.accountCreatedTimestamp;

  // Check 7-day limit
  if (accountAge >= sevenDaysMs) {
    return false;
  }

  // Check 10 logs per section limit
  const sectionLogs = Object.values(profile.cheatCodes)
    .filter(code => code.section === section)
    .reduce((sum, code) => sum + code.totalLogs, 0);

  return sectionLogs < 10;
}

// Calculate total power gain for a log
export function calculatePowerGain(
  cheatCodePower: CheatCodePower,
  profile: UserPowerProfile
): { gain: number, logType: 'normal' | 'honeymoon' | 'fresh_bonus' } {
  let basePower = calculateBasePowerGain(cheatCodePower.totalLogs);
  let logType: 'normal' | 'honeymoon' | 'fresh_bonus' = 'normal';

  // Apply fresh code bonus (first 1-2 logs)
  if (cheatCodePower.freshCodeBonusUsed < 2) {
    const freshBonus = cheatCodePower.freshCodeBonusUsed === 0 ? 10 : 5; // 10% first log, 5% second log
    basePower += freshBonus;
    logType = 'fresh_bonus';
  }
  // Apply honeymoon boost if active
  else if (isInHoneymoonPhase(profile, cheatCodePower.section)) {
    basePower = Math.round(basePower * 1.25); // +25% boost
    logType = 'honeymoon';
  }

  return { gain: basePower, logType };
}

// Add a usage log to a cheat code
export function addUsageLog(
  profile: UserPowerProfile,
  cheatCodeId: string,
  cheatCodeName: string,
  section: string
): UserPowerProfile {
  const updatedProfile = { ...profile };

  // Create cheat code if it doesn't exist
  if (!updatedProfile.cheatCodes[cheatCodeId]) {
    updatedProfile.cheatCodes[cheatCodeId] = createCheatCodePower(cheatCodeId, cheatCodeName, section);
  }

  const cheatCode = { ...updatedProfile.cheatCodes[cheatCodeId] };
  const { gain, logType } = calculatePowerGain(cheatCode, profile);

  // Update power (cap at 100%)
  const newPower = Math.min(100, cheatCode.powerPercentage + gain);

  // Update cheat code
  cheatCode.powerPercentage = newPower;
  cheatCode.totalLogs += 1;
  cheatCode.lastUsedTimestamp = Date.now();

  // Track fresh code bonus usage
  if (logType === 'fresh_bonus') {
    cheatCode.freshCodeBonusUsed += 1;
  }

  // Add to usage logs
  cheatCode.usageLogs.push({
    timestamp: Date.now(),
    powerGained: gain,
    logType
  });

  // Update profile
  updatedProfile.cheatCodes[cheatCodeId] = cheatCode;
  updatedProfile.totalLogsAcrossAllSections += 1;
  updatedProfile.lastUpdated = Date.now();

  // Check if honeymoon phase should end
  if (!updatedProfile.honeymoonPhaseEnded) {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const accountAge = now - updatedProfile.accountCreatedTimestamp;

    if (accountAge >= sevenDaysMs) {
      updatedProfile.honeymoonPhaseEnded = true;
      updatedProfile.honeymoonEndTimestamp = now;
    }
  }

  return updatedProfile;
}

// Apply decay to unused cheat codes
export function applyDecay(profile: UserPowerProfile, sectionColorFloors: Record<string, number>): UserPowerProfile {
  const now = Date.now();
  const twoDaysMs = 48 * 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const decayRate = 2; // -2% per day

  const updatedProfile = { ...profile };

  Object.entries(profile.cheatCodes).forEach(([id, cheatCode]) => {
    if (now - cheatCode.lastUsedTimestamp >= twoDaysMs) {
      const daysSinceLastUse = Math.floor((now - cheatCode.lastUsedTimestamp - twoDaysMs) / oneDayMs);
      const totalDecay = daysSinceLastUse * decayRate;

      // Get section color floor (default to 0% if no floor set)
      const sectionFloor = sectionColorFloors[cheatCode.section] || 0;

      // Apply decay but don't go below section floor
      const newPower = Math.max(sectionFloor, cheatCode.powerPercentage - totalDecay);

      updatedProfile.cheatCodes[id] = {
        ...cheatCode,
        powerPercentage: newPower
      };
    }
  });

  return updatedProfile;
}

// Get cheat codes for a specific section
export function getCheatCodesForSection(profile: UserPowerProfile, section: string): CheatCodePower[] {
  return Object.values(profile.cheatCodes)
    .filter(code => code.section === section)
    .sort((a, b) => b.powerPercentage - a.powerPercentage); // Sort by power descending
}

// Calculate section average power
export function calculateSectionAveragePower(profile: UserPowerProfile, section: string): number {
  const sectionCodes = getCheatCodesForSection(profile, section);

  if (sectionCodes.length === 0) return 0;

  const totalPower = sectionCodes.reduce((sum, code) => sum + code.powerPercentage, 0);
  return Math.round(totalPower / sectionCodes.length);
}

// Get power color based on percentage
export function getPowerColor(powerPercentage: number): string {
  if (powerPercentage >= 75) return '#00FF00'; // Green
  if (powerPercentage >= 50) return '#FFFF00'; // Yellow
  if (powerPercentage >= 25) return '#FFA500'; // Orange
  return '#FF0000'; // Red
}

// Get next power milestone
export function getNextPowerMilestone(currentPower: number): { target: number, color: string, name: string } | null {
  if (currentPower >= 100) return null;

  if (currentPower < 25) return { target: 25, color: '#FFA500', name: 'Orange' };
  if (currentPower < 50) return { target: 50, color: '#FFFF00', name: 'Yellow' };
  if (currentPower < 75) return { target: 75, color: '#00FF00', name: 'Green' };
  return { target: 100, color: '#00FF00', name: 'Mastery' };
}