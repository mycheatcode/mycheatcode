import {
  UserPowerProfile,
  initializePowerProfile,
  addUsageLog,
  applyDecay
} from './cheatCodePowerSystem';

const POWER_PROFILE_STORAGE_KEY = 'userPowerProfile';

// Save power profile to localStorage
export function savePowerProfile(profile: UserPowerProfile): void {
  try {
    localStorage.setItem(POWER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save power profile:', error);
  }
}

// Load power profile from localStorage
export function loadPowerProfile(): UserPowerProfile {
  try {
    const stored = localStorage.getItem(POWER_PROFILE_STORAGE_KEY);
    if (!stored) {
      return initializePowerProfile();
    }

    const parsed = JSON.parse(stored);

    // Ensure all required properties exist (for backward compatibility)
    return {
      cheatCodes: parsed.cheatCodes || {},
      accountCreatedTimestamp: parsed.accountCreatedTimestamp || Date.now(),
      totalLogsAcrossAllSections: parsed.totalLogsAcrossAllSections || 0,
      honeymoonPhaseEnded: parsed.honeymoonPhaseEnded || false,
      honeymoonEndTimestamp: parsed.honeymoonEndTimestamp,
      lastUpdated: parsed.lastUpdated || Date.now()
    };
  } catch (error) {
    console.error('Failed to load power profile:', error);
    return initializePowerProfile();
  }
}

// Add a usage log and save to storage
export function addUsageLogAndSave(
  cheatCodeId: string,
  cheatCodeName: string,
  section: string
): UserPowerProfile {
  const currentProfile = loadPowerProfile();
  const updatedProfile = addUsageLog(currentProfile, cheatCodeId, cheatCodeName, section);
  savePowerProfile(updatedProfile);
  return updatedProfile;
}

// Apply decay and save to storage
export function applyDecayAndSave(sectionColorFloors: Record<string, number> = {}): UserPowerProfile {
  const currentProfile = loadPowerProfile();
  const updatedProfile = applyDecay(currentProfile, sectionColorFloors);
  savePowerProfile(updatedProfile);
  return updatedProfile;
}

// Get current power profile
export function getCurrentPowerProfile(): UserPowerProfile {
  return loadPowerProfile();
}

// Reset power profile (useful for testing)
export function resetPowerProfile(): UserPowerProfile {
  const fresh = initializePowerProfile();
  savePowerProfile(fresh);
  return fresh;
}

// Debug: Get all cheat codes with their power levels
export function debugPowerProfile(): void {
  const profile = loadPowerProfile();


  if (Object.keys(profile.cheatCodes).length === 0) {
    return;
  }

  Object.values(profile.cheatCodes).forEach(code => {
  });
}