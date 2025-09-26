import { UserProgression, SectionProgress, CheatCodeLog, initializeProgression } from './progressionSystem';
import { addUsageLogAndSave } from './cheatCodePowerStorage';

const PROGRESSION_STORAGE_KEY = 'userProgression';

// Save progression to localStorage
export function saveProgression(progression: UserProgression): void {
  try {
    // Convert Sets to Arrays for JSON serialization
    const serializable = {
      ...progression,
      sections: Object.entries(progression.sections).reduce((acc, [key, section]) => {
        acc[key as keyof typeof progression.sections] = {
          ...section,
          uniqueCheatCodes: Array.from(section.uniqueCheatCodes)
        };
        return acc;
      }, {} as any)
    };

    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save progression:', error);
  }
}

// Load progression from localStorage
export function loadProgression(): UserProgression {
  try {
    const stored = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (!stored) {
      return initializeProgression();
    }

    const parsed = JSON.parse(stored);

    // Convert Arrays back to Sets
    const sections = Object.entries(parsed.sections).reduce((acc, [key, section]: [string, any]) => {
      acc[key as keyof typeof parsed.sections] = {
        ...section,
        uniqueCheatCodes: new Set(section.uniqueCheatCodes || [])
      };
      return acc;
    }, {} as any);

    return {
      ...parsed,
      sections
    };
  } catch (error) {
    console.error('Failed to load progression:', error);
    return initializeProgression();
  }
}

// Add a log and persist to storage (also updates power system)
export function addAndSaveLog(log: CheatCodeLog): UserProgression {
  const currentProgression = loadProgression();
  const { addLogToProgression } = require('./progressionSystem');
  const updatedProgression = addLogToProgression(currentProgression, log);
  saveProgression(updatedProgression);

  // Also update the power system
  if (log.isValid) {
    addUsageLogAndSave(log.cheatCodeId, log.cheatCodeName, log.section);
  }

  return updatedProgression;
}

// Get current progression
export function getCurrentProgression(): UserProgression {
  return loadProgression();
}

// Reset progression (useful for testing)
export function resetProgression(): UserProgression {
  const fresh = initializeProgression();
  saveProgression(fresh);
  return fresh;
}

// Create a sample log for testing
export function createSampleLog(
  cheatCodeId: string,
  cheatCodeName: string,
  section: keyof UserProgression['sections'],
  timestamp?: number
): CheatCodeLog {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    cheatCodeId,
    cheatCodeName,
    section,
    timestamp: timestamp || Date.now(),
    isValid: true
  };
}