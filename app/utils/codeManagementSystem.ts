import { Section } from './progressionSystem';
import { CheatCodePower } from './cheatCodePowerSystem';

// Enhanced cheat code data structure
export interface ManagedCheatCode extends CheatCodePower {
  isActive: boolean; // true = Active (counts toward section), false = Archived
  archiveTimestamp?: number; // When it was archived
  reactivateTimestamp?: number; // When it was reactivated
  createdTimestamp: number; // When the code was first created
  duplicateIds?: string[]; // IDs of similar codes that were merged
  botContext?: {
    originalPrompt?: string; // What the user originally asked for
    refinements?: string[]; // Bot suggestions that were applied
    relatedCodes?: string[]; // Similar codes in the same section
  };
}

export interface SectionCodeManagement {
  sectionId: Section;
  activeCodes: ManagedCheatCode[];
  archivedCodes: ManagedCheatCode[];
  totalCodesCreated: number;
  lastCodeCreated: number;
}

export interface CodeManagementState {
  sections: Record<Section, SectionCodeManagement>;
  globalStats: {
    totalCodesCreated: number;
    totalArchivedCodes: number;
    lastActivity: number;
  };
}

// Constants
export const MAX_ACTIVE_CODES_PER_SECTION = 7;
export const FRESH_CODE_BONUS_LOGS = 2; // First 2 logs get bonus
export const FRESH_CODE_BONUS_PERCENT = 10; // 10% extra power gain

// Storage key
const CODE_MANAGEMENT_STATE_KEY = 'codeManagementState';

// Get code management state from localStorage
export function getCodeManagementState(): CodeManagementState {
  if (typeof window === 'undefined') {
    // Return default state during SSR
    const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
    const sectionManagement: Record<Section, SectionCodeManagement> = {} as Record<Section, SectionCodeManagement>;

    sections.forEach((section) => {
  sectionManagement[section] = {
    sectionId: section,
    activeCodes: [],
    archivedCodes: [],
    totalCodesCreated: 0,   // ✅ match interface
    totalActiveCodes: 0     // ✅ also required by the interface
  };
});

    return {
      sections: sectionManagement,
      globalStats: {
        totalCodesCreated: 0,
        totalArchivedCodes: 0,
        totalActiveCodes: 0,   // ✅ add this
        lastActivity: Date.now()
      }
    };
  }

  const stored = localStorage.getItem(CODE_MANAGEMENT_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing code management state:', error);
    }
  }

  // Return default state
  const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
  const sectionManagement: Record<Section, SectionCodeManagement> = {} as Record<Section, SectionCodeManagement>;

  sections.forEach(section => {
    sectionManagement[section] = {
      sectionId: section,
      activeCodes: [],
      archivedCodes: [],
      totalCodesCreated: 0,
      lastCodeCreated: 0
    };
  });

  return {
    sections: sectionManagement,
    globalStats: {
      totalCodesCreated: 0,
      totalArchivedCodes: 0,
      lastActivity: Date.now()
    }
  };
}

// Save code management state to localStorage
export function saveCodeManagementState(state: CodeManagementState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CODE_MANAGEMENT_STATE_KEY, JSON.stringify(state));
  }
}

// Create a new cheat code
export function createNewCheatCode(
  cheatCodeId: string,
  cheatCodeName: string,
  section: Section,
  summary?: string,
  botContext?: ManagedCheatCode['botContext']
): {
  success: boolean;
  code?: ManagedCheatCode;
  needsArchivalDecision?: boolean;
  suggestions?: {
    existingSimilar?: ManagedCheatCode[];
    archiveCandidates?: ManagedCheatCode[];
    mergeCandidate?: ManagedCheatCode;
  };
} {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];

  // Check for similar codes (basic similarity check)
  const existingSimilar = findSimilarCodes(cheatCodeName, section, state);
  const mergeCandidate = existingSimilar.find(code =>
    calculateSimilarity(cheatCodeName, code.cheatCodeName) > 0.7
  );

  // If we found a very similar code, suggest merging
  if (mergeCandidate) {
    return {
      success: false,
      suggestions: {
        mergeCandidate,
        existingSimilar
      }
    };
  }

  // Create the new managed cheat code
  const now = Date.now();
  const newCode: ManagedCheatCode = {
    cheatCodeId,
    cheatCodeName,
    section,
    powerPercentage: 0,
    totalLogs: 0,
    lastUsedTimestamp: now,
    createdTimestamp: now,
    freshCodeBonusUsed: 0,
    honeymoonLogsUsed: 0,
    isActive: true,
    botContext,
    archived: false // Keep compatibility with existing system
  };

  // Check if section has room for more active codes
  if (sectionManagement.activeCodes.length >= MAX_ACTIVE_CODES_PER_SECTION) {
    return {
      success: false,
      code: newCode,
      needsArchivalDecision: true,
      suggestions: {
        existingSimilar,
        archiveCandidates: findArchiveCandidates(section, state)
      }
    };
  }

  // Add to active codes
  sectionManagement.activeCodes.push(newCode);
  sectionManagement.totalCodesCreated++;
  sectionManagement.lastCodeCreated = now;

  // Update global stats
  state.globalStats.totalCodesCreated++;
  state.globalStats.lastActivity = now;

  saveCodeManagementState(state);

  return {
    success: true,
    code: newCode
  };
}

// Archive a cheat code
export function archiveCheatCode(cheatCodeId: string): {
  success: boolean;
  archivedCode?: ManagedCheatCode;
  updatedSection?: Section;
} {
  const state = getCodeManagementState();
  const now = Date.now();

  // Find the code in active lists
  for (const section of Object.keys(state.sections) as Section[]) {
    const sectionManagement = state.sections[section];
    const codeIndex = sectionManagement.activeCodes.findIndex(code =>
      code.cheatCodeId === cheatCodeId
    );

    if (codeIndex !== -1) {
      const code = sectionManagement.activeCodes[codeIndex];

      // Update code status
      code.isActive = false;
      code.archiveTimestamp = now;
      code.archived = true; // Keep compatibility

      // Move from active to archived
      sectionManagement.activeCodes.splice(codeIndex, 1);
      sectionManagement.archivedCodes.push(code);

      // Update global stats
      state.globalStats.totalArchivedCodes++;
      state.globalStats.lastActivity = now;

      saveCodeManagementState(state);

      return {
        success: true,
        archivedCode: code,
        updatedSection: section
      };
    }
  }

  return { success: false };
}

// Reactivate an archived cheat code
export function reactivateCheatCode(cheatCodeId: string): {
  success: boolean;
  reactivatedCode?: ManagedCheatCode;
  updatedSection?: Section;
  needsArchivalDecision?: boolean;
  suggestions?: {
    archiveCandidates?: ManagedCheatCode[];
  };
} {
  const state = getCodeManagementState();
  const now = Date.now();

  // Find the code in archived lists
  for (const section of Object.keys(state.sections) as Section[]) {
    const sectionManagement = state.sections[section];
    const codeIndex = sectionManagement.archivedCodes.findIndex(code =>
      code.cheatCodeId === cheatCodeId
    );

    if (codeIndex !== -1) {
      const code = sectionManagement.archivedCodes[codeIndex];

      // Check if section has room
      if (sectionManagement.activeCodes.length >= MAX_ACTIVE_CODES_PER_SECTION) {
        return {
          success: false,
          reactivatedCode: code,
          updatedSection: section,
          needsArchivalDecision: true,
          suggestions: {
            archiveCandidates: findArchiveCandidates(section, state)
          }
        };
      }

      // Update code status
      code.isActive = true;
      code.reactivateTimestamp = now;
      code.archived = false; // Keep compatibility
      delete code.archiveTimestamp;

      // Move from archived to active
      sectionManagement.archivedCodes.splice(codeIndex, 1);
      sectionManagement.activeCodes.push(code);

      // Update global stats
      state.globalStats.totalArchivedCodes--;
      state.globalStats.lastActivity = now;

      saveCodeManagementState(state);

      return {
        success: true,
        reactivatedCode: code,
        updatedSection: section
      };
    }
  }

  return { success: false };
}

// Get active codes for a section
export function getActiveCodes(section: Section): ManagedCheatCode[] {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];

  // Safety check in case section doesn't exist
  if (!sectionManagement) {
    return [];
  }

  return sectionManagement.activeCodes;
}

// Get archived codes for a section
export function getArchivedCodes(section: Section): ManagedCheatCode[] {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];

  // Safety check in case section doesn't exist
  if (!sectionManagement) {
    return [];
  }

  return sectionManagement.archivedCodes;
}

// Get all codes for a section (active + archived)
export function getAllCodes(section: Section): ManagedCheatCode[] {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];

  // Safety check in case section doesn't exist
  if (!sectionManagement) {
    return [];
  }

  return [...sectionManagement.activeCodes, ...sectionManagement.archivedCodes];
}

// Check if section can accept more active codes
export function canAddActiveCode(section: Section): boolean {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];

  // Safety check in case section doesn't exist
  if (!sectionManagement) {
    return true;
  }

  return sectionManagement.activeCodes.length < MAX_ACTIVE_CODES_PER_SECTION;
}

// Get section statistics
export function getSectionStats(section: Section): {
  activeCount: number;
  archivedCount: number;
  totalCreated: number;
  canAddMore: boolean;
  slotsRemaining: number;
} {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];

  // Safety check in case section doesn't exist
  if (!sectionManagement) {
    return {
      activeCount: 0,
      archivedCount: 0,
      totalCreated: 0,
      canAddMore: true,
      slotsRemaining: MAX_ACTIVE_CODES_PER_SECTION
    };
  }

  return {
    activeCount: sectionManagement.activeCodes.length,
    archivedCount: sectionManagement.archivedCodes.length,
    totalCreated: sectionManagement.totalCodesCreated,
    canAddMore: sectionManagement.activeCodes.length < MAX_ACTIVE_CODES_PER_SECTION,
    slotsRemaining: MAX_ACTIVE_CODES_PER_SECTION - sectionManagement.activeCodes.length
  };
}

// Find similar codes in a section
function findSimilarCodes(
  cheatCodeName: string,
  section: Section,
  state: CodeManagementState
): ManagedCheatCode[] {
  const sectionManagement = state.sections[section];
  const allCodes = [...sectionManagement.activeCodes, ...sectionManagement.archivedCodes];

  return allCodes.filter(code => {
    const similarity = calculateSimilarity(cheatCodeName, code.cheatCodeName);
    return similarity > 0.3; // 30% similarity threshold
  });
}

// Find codes that could be archived (least used, oldest, etc.)
function findArchiveCandidates(section: Section, state: CodeManagementState): ManagedCheatCode[] {
  const sectionManagement = state.sections[section];

  // Sort by least recently used and lowest power
  return [...sectionManagement.activeCodes]
    .sort((a, b) => {
      // Primary: last used timestamp (oldest first)
      const timeDiff = a.lastUsedTimestamp - b.lastUsedTimestamp;
      if (timeDiff !== 0) return timeDiff;

      // Secondary: power percentage (lowest first)
      return a.powerPercentage - b.powerPercentage;
    })
    .slice(0, 3); // Return top 3 candidates
}

// Calculate similarity between two cheat code names (basic implementation)
function calculateSimilarity(name1: string, name2: string): number {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);

  if (n1 === n2) return 1.0;

  // Simple word overlap similarity
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

// Get bot guidance for code creation
export function getBotGuidance(
  cheatCodeName: string,
  section: Section,
  userPrompt?: string
): {
  type: 'allow' | 'suggest_merge' | 'suggest_archive' | 'suggest_refine';
  message: string;
  suggestions?: {
    similarCodes?: ManagedCheatCode[];
    archiveCandidates?: ManagedCheatCode[];
    mergeCandidate?: ManagedCheatCode;
  };
} {
  const state = getCodeManagementState();
  const sectionManagement = state.sections[section];
  const stats = getSectionStats(section);

  // Check if section is full
  if (!stats.canAddMore) {
    const archiveCandidates = findArchiveCandidates(section, state);
    return {
      type: 'suggest_archive',
      message: `You already have 7 Active ${section} codes. Would you like to archive one to make room, or add this new one to your Library?`,
      suggestions: {
        archiveCandidates
      }
    };
  }

  // Check for similar codes
  const similarCodes = findSimilarCodes(cheatCodeName, section, state);
  const mergeCandidate = similarCodes.find(code =>
    calculateSimilarity(cheatCodeName, code.cheatCodeName) > 0.7
  );

  if (mergeCandidate) {
    return {
      type: 'suggest_merge',
      message: `You already have a '${mergeCandidate.cheatCodeName}' code. Do you want to strengthen it instead of creating a new variation?`,
      suggestions: {
        mergeCandidate,
        similarCodes
      }
    };
  }

  if (similarCodes.length > 0) {
    return {
      type: 'suggest_refine',
      message: `I found similar codes in your ${section} section. Would you like to refine one of them or create something more specific?`,
      suggestions: {
        similarCodes
      }
    };
  }

  return {
    type: 'allow',
    message: `Great! I'll create your new ${section} cheat code.`
  };
}

// Merge two cheat codes (strengthen existing one)
export function mergeCheatCodes(
  targetCodeId: string,
  sourceCodeName: string,
  sourceBotContext?: ManagedCheatCode['botContext']
): {
  success: boolean;
  mergedCode?: ManagedCheatCode;
  updatedSection?: Section;
} {
  const state = getCodeManagementState();

  // Find target code
  for (const section of Object.keys(state.sections) as Section[]) {
    const sectionManagement = state.sections[section];
    const allCodes = [...sectionManagement.activeCodes, ...sectionManagement.archivedCodes];
    const targetCode = allCodes.find(code => code.cheatCodeId === targetCodeId);

    if (targetCode) {
      // Add merge information
      if (!targetCode.duplicateIds) {
        targetCode.duplicateIds = [];
      }
      targetCode.duplicateIds.push(`merged_${Date.now()}`);

      // Enhance bot context
      if (sourceBotContext) {
        if (!targetCode.botContext) {
          targetCode.botContext = {};
        }
        if (!targetCode.botContext.refinements) {
          targetCode.botContext.refinements = [];
        }
        targetCode.botContext.refinements.push(`Merged: ${sourceCodeName}`);
      }

      // Give a small power boost for the merge (like fresh code bonus)
      targetCode.powerPercentage = Math.min(100, targetCode.powerPercentage + 5);

      // Reset fresh code bonus to give it another boost
      targetCode.freshCodeBonusUsed = Math.max(0, targetCode.freshCodeBonusUsed - 1);

      saveCodeManagementState(state);

      return {
        success: true,
        mergedCode: targetCode,
        updatedSection: section
      };
    }
  }

  return { success: false };
}

// Get contextual archived code suggestions
export function getContextualArchivedCodes(
  currentSection?: Section,
  userContext?: string
): ManagedCheatCode[] {
  const state = getCodeManagementState();
  const allArchivedCodes: ManagedCheatCode[] = [];

  // Collect all archived codes
  Object.values(state.sections).forEach(sectionManagement => {
    allArchivedCodes.push(...sectionManagement.archivedCodes);
  });

  // Filter and rank by relevance
  let relevantCodes = allArchivedCodes;

  // If we have a current section, prioritize codes from that section
  if (currentSection) {
    relevantCodes.sort((a, b) => {
      if (a.section === currentSection && b.section !== currentSection) return -1;
      if (b.section === currentSection && a.section !== currentSection) return 1;
      return 0;
    });
  }

  // If we have user context, try to match keywords (basic implementation)
  if (userContext) {
    const keywords = userContext.toLowerCase().split(' ');
    relevantCodes = relevantCodes.filter(code => {
      const codeName = code.cheatCodeName.toLowerCase();
      return keywords.some(keyword => codeName.includes(keyword));
    });
  }

  // Return top 3 most relevant
  return relevantCodes.slice(0, 3);
}

// Clean up old archived codes (if needed for performance)
export function cleanupOldArchivedCodes(maxAge: number = 90 * 24 * 60 * 60 * 1000): void {
  const state = getCodeManagementState();
  const now = Date.now();
  let cleaned = false;

  Object.values(state.sections).forEach(sectionManagement => {
    const originalLength = sectionManagement.archivedCodes.length;
    sectionManagement.archivedCodes = sectionManagement.archivedCodes.filter(code => {
      const archiveAge = code.archiveTimestamp ? now - code.archiveTimestamp : 0;
      return archiveAge < maxAge;
    });

    if (sectionManagement.archivedCodes.length < originalLength) {
      cleaned = true;
    }
  });

  if (cleaned) {
    saveCodeManagementState(state);
  }
}