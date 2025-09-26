import { Section } from './progressionSystem';
  import { CheatCodePower } from './cheatCodePowerSystem';

  // Define the botContext type
  interface BotContext {
    refinements?: string[];
    [key: string]: any;
  }

  // ----- Data shapes -----
  // ManagedCheatCode extends CheatCodePower but adds management-specific properties
  export interface ManagedCheatCode extends CheatCodePower {
    isActive: boolean;         // true = Active (counts toward section), false = Archived
    archivedAt?: number;       // epoch ms when it was archived
    reactivatedAt?: number;    // epoch ms when it was reactivated
    createdAt?: number;        // epoch ms when created
    mergedInto?: string[];     // IDs of similar codes that were merged
    originalPrompt?: string;   // what the user originally asked for
    refinements?: string[];    // bot suggestions that were applied
    relatedCodes?: string[];   // similar codes in the same section
    archiveTimestamp?: number; // for compatibility
    reactivateTimestamp?: number; // for compatibility
    duplicateIds?: string[];   // for merge functionality
    archived?: boolean;        // compatibility flag
    botContext?: BotContext;   // bot context
  }

  // Per-section snapshot (includes counts)
  export interface SectionCodeManagement {
    sectionId: Section;
    activeCodes: ManagedCheatCode[];
    archivedCodes: ManagedCheatCode[];

    // per-section totals
    totalCodesCreated: number;
    totalArchivedCodes: number;
    totalActiveCodes: number;

    // last activity for this section (epoch ms)
    lastCodeCreated: number;
  }

  // Global totals across all sections
  export interface GlobalStats {
    totalCodesCreated: number;
    totalArchivedCodes: number;
    totalActiveCodes: number;
    lastActivity: Date;   // CHANGED: from number to Date
  }

  // Whole persisted state
  export interface CodeManagementState {
    sections: Record<Section, SectionCodeManagement>;
    globalStats: GlobalStats;
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
          totalCodesCreated: 0,
          totalArchivedCodes: 0,
          totalActiveCodes: 0,
          lastCodeCreated: 0
        };
      });

      return {
        sections: sectionManagement,
        globalStats: {
          totalCodesCreated: 0,
          totalArchivedCodes: 0,
          totalActiveCodes: 0,
          lastActivity: new Date()  // FIXED: Changed from Date.now() to new Date()
        }
      };
    }

    const stored = localStorage.getItem(CODE_MANAGEMENT_STATE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert lastActivity string back to Date object
        if (parsed.globalStats && parsed.globalStats.lastActivity) {
          parsed.globalStats.lastActivity = new Date(parsed.globalStats.lastActivity);
        }
        return parsed;
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
        totalArchivedCodes: 0,
        totalActiveCodes: 0,
        lastCodeCreated: 0
      };
    });

    return {
      sections: sectionManagement,
      globalStats: {
        totalCodesCreated: 0,
        totalArchivedCodes: 0,
        totalActiveCodes: 0,
        lastActivity: new Date()  // FIXED: Changed from Date.now() to new Date()
      }
    };
  }

  // Save code management state to localStorage
  export function saveCodeManagementState(state: CodeManagementState): void {
    if (typeof window !== 'undefined') {
      // Convert Date to string for localStorage
      const stateToSave = {
        ...state,
        globalStats: {
          ...state.globalStats,
          lastActivity: state.globalStats.lastActivity.toISOString()
        }
      };
      localStorage.setItem(CODE_MANAGEMENT_STATE_KEY, JSON.stringify(stateToSave));
    }
  }

  // Create a new cheat code
  export function createNewCheatCode(
    cheatCodeId: string,
    cheatCodeName: string,
    section: Section,
    summary?: string,
    botContext?: BotContext
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
      section: section as string, // Convert Section type to string to match CheatCodePower
      powerPercentage: 0,
      totalLogs: 0,
      lastUsedTimestamp: now,
      createdTimestamp: now,
      freshCodeBonusUsed: 0,
      honeymoonBoostActive: true, // from CheatCodePower interface
      usageLogs: [], // from CheatCodePower interface
      isActive: true,
      botContext,
      archived: false,
      createdAt: now
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
    state.globalStats.totalActiveCodes++;
    state.globalStats.lastActivity = new Date();  // FIXED: Changed from Date.now() to new Date()

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
        code.archivedAt = now;
        code.archived = true; // Keep compatibility

        // Move from active to archived
        sectionManagement.activeCodes.splice(codeIndex, 1);
        sectionManagement.archivedCodes.push(code);

        // Update stats
        sectionManagement.totalArchivedCodes++;
        sectionManagement.totalActiveCodes--;

        // Update global stats
        state.globalStats.totalArchivedCodes++;
        state.globalStats.totalActiveCodes--;
        state.globalStats.lastActivity = new Date();  // FIXED: Changed from Date.now() to new Date()

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
        code.reactivatedAt = now;
        code.archived = false; // Keep compatibility
        delete code.archiveTimestamp;
        delete code.archivedAt;

        // Move from archived to active
        sectionManagement.archivedCodes.splice(codeIndex, 1);
        sectionManagement.activeCodes.push(code);

        // Update stats
        sectionManagement.totalArchivedCodes--;
        sectionManagement.totalActiveCodes++;

        // Update global stats
        state.globalStats.totalArchivedCodes--;
        state.globalStats.totalActiveCodes++;
        state.globalStats.lastActivity = new Date();  // FIXED: Changed from Date.now() to new Date()

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

    if (!sectionManagement) {
      return [];
    }

    return sectionManagement.activeCodes;
  }

  // Get archived codes for a section
  export function getArchivedCodes(section: Section): ManagedCheatCode[] {
    const state = getCodeManagementState();
    const sectionManagement = state.sections[section];

    if (!sectionManagement) {
      return [];
    }

    return sectionManagement.archivedCodes;
  }

  // Get all codes for a section (active + archived)
  export function getAllCodes(section: Section): ManagedCheatCode[] {
    const state = getCodeManagementState();
    const sectionManagement = state.sections[section];

    if (!sectionManagement) {
      return [];
    }

    return [...sectionManagement.activeCodes, ...sectionManagement.archivedCodes];
  }

  // Check if section can accept more active codes
  export function canAddActiveCode(section: Section): boolean {
    const state = getCodeManagementState();
    const sectionManagement = state.sections[section];

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
      return similarity > 0.3;
    });
  }

  // Find codes that could be archived (least used, oldest, etc.)
  function findArchiveCandidates(section: Section, state: CodeManagementState): ManagedCheatCode[] {
    const sectionManagement = state.sections[section];

    return [...sectionManagement.activeCodes]
      .sort((a, b) => {
        const timeDiff = a.lastUsedTimestamp - b.lastUsedTimestamp;
        if (timeDiff !== 0) return timeDiff;
        return a.powerPercentage - b.powerPercentage;
      })
      .slice(0, 3);
  }

  // Calculate similarity between two cheat code names (basic implementation)
  function calculateSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return 1.0;

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
    const stats = getSectionStats(section);

    if (!stats.canAddMore) {
      const archiveCandidates = findArchiveCandidates(section, state);
      return {
        type: 'suggest_archive',
        message: `You already have 7 Active ${section} codes. Would you like to archive one to make room, or add this 
  new one to your Library?`,
        suggestions: {
          archiveCandidates
        }
      };
    }

    const similarCodes = findSimilarCodes(cheatCodeName, section, state);
    const mergeCandidate = similarCodes.find(code =>
      calculateSimilarity(cheatCodeName, code.cheatCodeName) > 0.7
    );

    if (mergeCandidate) {
      return {
        type: 'suggest_merge',
        message: `You already have a '${mergeCandidate.cheatCodeName}' code. Do you want to strengthen it instead of 
  creating a new variation?`,
        suggestions: {
          mergeCandidate,
          similarCodes
        }
      };
    }

    if (similarCodes.length > 0) {
      return {
        type: 'suggest_refine',
        message: `I found similar codes in your ${section} section. Would you like to refine one of them or create 
  something more specific?`,
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
    sourceBotContext?: BotContext
  ): {
    success: boolean;
    mergedCode?: ManagedCheatCode;
    updatedSection?: Section;
  } {
    const state = getCodeManagementState();

    for (const section of Object.keys(state.sections) as Section[]) {
      const sectionManagement = state.sections[section];
      const allCodes = [...sectionManagement.activeCodes, ...sectionManagement.archivedCodes];
      const targetCode = allCodes.find(code => code.cheatCodeId === targetCodeId);

      if (targetCode) {
        if (!targetCode.duplicateIds) {
          targetCode.duplicateIds = [];
        }
        targetCode.duplicateIds.push(`merged_${Date.now()}`);

        if (sourceBotContext) {
          if (!targetCode.botContext) {
            targetCode.botContext = {};
          }
          if (!targetCode.botContext.refinements) {
            targetCode.botContext.refinements = [];
          }
          targetCode.botContext.refinements.push(`Merged: ${sourceCodeName}`);
        }

        targetCode.powerPercentage = Math.min(100, targetCode.powerPercentage + 5);
        targetCode.freshCodeBonusUsed = Math.max(0, targetCode.freshCodeBonusUsed - 1);

        state.globalStats.lastActivity = new Date();  // FIXED: Changed from Date.now() to new Date()
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

    Object.values(state.sections).forEach(sectionManagement => {
      allArchivedCodes.push(...sectionManagement.archivedCodes);
    });

    let relevantCodes = allArchivedCodes;

    if (currentSection) {
      relevantCodes.sort((a, b) => {
        if (a.section === currentSection && b.section !== currentSection) return -1;
        if (b.section === currentSection && a.section !== currentSection) return 1;
        return 0;
      });
    }

    if (userContext) {
      const keywords = userContext.toLowerCase().split(' ');
      relevantCodes = relevantCodes.filter(code => {
        const codeName = code.cheatCodeName.toLowerCase();
        return keywords.some(keyword => codeName.includes(keyword));
      });
    }

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
      state.globalStats.lastActivity = new Date();  // FIXED: Changed from Date.now() to new Date()
      saveCodeManagementState(state);
    }
  }