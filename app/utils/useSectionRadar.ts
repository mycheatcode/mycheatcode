'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RadarState,
  SectionScore,
  calculateRadarState,
  executeCompleteUpdate,
  isSectionAtDailyCap,
  getRemainingDailyLogs,
  getNextSectionTarget,
  getSectionColorHex,
  getGreenHoldStatus,
  runGreenMaintenanceCheck,
  forceSectionDemotion
} from './sectionRadarSystem';
import { useCheatCodePower } from './useCheatCodePower';
import { useProgression } from './useProgression';
import { generateShareCard, ShareCardData } from './engagementSystem';
import { Section } from './progressionSystem';
import { checkGreenConsistency } from './greenHoldSystem';
import { getDecayWarningStatus } from './decaySystem';
import {
  sendMaintenanceNotifications,
  addNotification,
  createNotification,
  sendMilestoneAchieved
} from './notificationSystem';

export function useSectionRadar() {
  const [radarState, setRadarState] = useState<RadarState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMaintenanceCheck, setLastMaintenanceCheck] = useState<number>(0);

  const { powerProfile } = useCheatCodePower();
  const { progression } = useProgression();

  // Calculate and update radar state
  const updateRadarState = useCallback(() => {
    if (powerProfile && progression) {
      const newRadarState = calculateRadarState(powerProfile, progression);
      setRadarState(newRadarState);
      return newRadarState;
    }
    return null;
  }, [powerProfile, progression]);

  // Initial load and updates when dependencies change
  useEffect(() => {
    if (powerProfile && progression) {
      updateRadarState();
      setIsLoading(false);
    }
  }, [powerProfile, progression, updateRadarState]);

  // Get section score for a specific section
  const getSectionScore = useCallback((section: Section): SectionScore | null => {
    return radarState?.sectionScores[section] || null;
  }, [radarState]);

  // Get radar score (0-100)
  const getRadarScore = useCallback((): number => {
    return radarState?.radarScore || 0;
  }, [radarState]);

  // Check if full radar is green
  const isFullRadarGreen = useCallback((): boolean => {
    return radarState?.isFullRadarGreen || false;
  }, [radarState]);

  // Execute complete update flow with Green Hold and Decay (code → section → radar)
  const executeUpdate = useCallback(async (
    cheatCodeId: string,
    cheatCodeName: string,
    section: Section
  ): Promise<{
    shouldCount: boolean;
    sectionChanged: boolean;
    radarChanged: boolean;
    remainingDailyLogs: number;
    newRadarState: RadarState;
    greenHoldEvents: {
      started?: boolean;
      stopped?: { duration: number; wasRecord: boolean; };
      continued?: boolean;
    };
    shareCards: ShareCardData[];
    sectionUpgrade?: {
      section: Section;
      newColor: 'red' | 'orange' | 'yellow' | 'green';
      oldColor: 'red' | 'orange' | 'yellow' | 'green';
    };
  }> => {
    if (!powerProfile || !progression) {
      throw new Error('Power profile or progression not loaded');
    }

    const result = executeCompleteUpdate(
      cheatCodeId,
      cheatCodeName,
      section,
      powerProfile,
      progression
    );

    // Update local state
    setRadarState(result.updatedRadarState);

    // Generate share cards for achievements
    const shareCards: ShareCardData[] = [];
    let sectionUpgrade: any = undefined;

    // Check for section upgrades
    const oldSectionScore = radarState?.sectionScores[section];
    const newSectionScore = result.updatedRadarState.sectionScores[section];

    if (oldSectionScore && newSectionScore && oldSectionScore.color !== newSectionScore.color) {
      sectionUpgrade = {
        section,
        newColor: newSectionScore.color,
        oldColor: oldSectionScore.color
      };

      // Note: Automatic share cards removed - sharing is now user-initiated only
    }

    // Note: Full Radar achievement noted but no automatic share card

    // Note: Green Hold milestones tracked but no automatic share cards

    // Handle Green Hold events and notifications
    if (result.greenHoldEvents.started) {
      const notification = createNotification(
        'milestone_achieved',
        `🟢 ${section} reached Green!`,
        'Green Hold timer started. Keep the consistency to maintain this status.',
        {
          section,
          actionLabel: 'View Progress',
          icon: '🟢',
          priority: 'high'
        }
      );
      addNotification(notification);
    }

    if (result.greenHoldEvents.stopped) {
      const { duration } = result.greenHoldEvents.stopped;
      const days = Math.floor(duration / (24 * 60 * 60 * 1000));

      const notification = createNotification(
        'drop_notice',
        `${section} dropped from Green`,
        `You held Green for ${days} days. Ready to win it back?`,
        {
          section,
          actionLabel: 'Win It Back',
          icon: '🔄',
          priority: 'high'
        }
      );
      addNotification(notification);
    }

    return {
      shouldCount: result.shouldCount,
      sectionChanged: result.sectionChanged,
      radarChanged: result.radarChanged,
      remainingDailyLogs: result.remainingDailyLogs,
      newRadarState: result.updatedRadarState,
      greenHoldEvents: result.greenHoldEvents,
      shareCards,
      sectionUpgrade
    };
  }, [powerProfile, progression]);

  // Check daily cap status
  const checkDailyCap = useCallback((section: Section) => {
    return {
      isAtCap: isSectionAtDailyCap(section),
      remainingLogs: getRemainingDailyLogs(section)
    };
  }, []);

  // Get next target for a section
  const getSectionTarget = useCallback((section: Section) => {
    const sectionScore = getSectionScore(section);
    if (!sectionScore) return null;
    return getNextSectionTarget(sectionScore);
  }, [getSectionScore]);

  // Get all section scores
  const getAllSectionScores = useCallback((): Record<Section, SectionScore> => {
    return radarState?.sectionScores || {} as Record<Section, SectionScore>;
  }, [radarState]);

  // Get section color
  const getSectionColor = useCallback((section: Section): 'red' | 'orange' | 'yellow' | 'green' => {
    const sectionScore = getSectionScore(section);
    return sectionScore?.color || 'red';
  }, [getSectionScore]);

  // Get section color as hex
  const getSectionColorAsHex = useCallback((section: Section): string => {
    const color = getSectionColor(section);
    return getSectionColorHex(color);
  }, [getSectionColor]);

  // Force refresh radar state
  const refreshRadarState = useCallback(() => {
    return updateRadarState();
  }, [updateRadarState]);

  // Get detailed section stats
  const getSectionStats = useCallback((section: Section) => {
    const sectionScore = getSectionScore(section);
    const dailyCap = checkDailyCap(section);
    const target = getSectionTarget(section);

    return {
      score: sectionScore?.score || 0,
      color: sectionScore?.color || 'red',
      activeCodesCount: sectionScore?.activeCodesCount || 0,
      totalValidLogs: sectionScore?.totalValidLogs || 0,
      uniqueCodesUsed: sectionScore?.uniqueCodesUsed || 0,
      isFullyQualified: sectionScore?.isFullyQualified || false,
      isAtDailyCap: dailyCap.isAtCap,
      remainingDailyLogs: dailyCap.remainingLogs,
      nextTarget: target
    };
  }, [getSectionScore, checkDailyCap, getSectionTarget]);

  // Get overall radar stats
  const getRadarStats = useCallback(() => {
    if (!radarState) {
      return {
        radarScore: 0,
        isFullRadarGreen: false,
        greenSections: 0,
        totalSections: 5,
        lastUpdated: 0
      };
    }

    const sections = Object.values(radarState.sectionScores);
    const greenSections = sections.filter(s => s.color === 'green').length;

    return {
      radarScore: radarState.radarScore,
      isFullRadarGreen: radarState.isFullRadarGreen,
      greenSections,
      totalSections: 5,
      lastUpdated: radarState.lastUpdated
    };
  }, [radarState]);

  // Green Hold functions
  const getGreenHold = useCallback((section: Section) => {
    return getGreenHoldStatus(section);
  }, []);

  // Green maintenance check
  const runMaintenanceCheck = useCallback(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Only run maintenance check once per hour
    if (now - lastMaintenanceCheck < oneHour) {
      return null;
    }

    const maintenanceResult = runGreenMaintenanceCheck();

    // Update section states with current radar data
    if (radarState) {
      Object.keys(maintenanceResult.sectionStates).forEach(sectionKey => {
        const section = sectionKey as Section;
        const sectionScore = radarState.sectionScores[section];
        if (sectionScore) {
          maintenanceResult.sectionStates[section].color = sectionScore.color;
        }
      });
    }

    // Send notifications for sections that need them
    if (maintenanceResult.sectionsToWarn.length > 0 || maintenanceResult.sectionsToDemote.length > 0) {
      const holdDurations: Record<Section, number> = {} as Record<Section, number>;

      Object.keys(maintenanceResult.sectionStates).forEach(sectionKey => {
        const section = sectionKey as Section;
        holdDurations[section] = maintenanceResult.sectionStates[section].holdDuration;
      });

      sendMaintenanceNotifications(
        maintenanceResult.sectionsToWarn,
        maintenanceResult.sectionsToDemote,
        holdDurations
      );
    }

    // Force demote sections that failed grace period
    if (maintenanceResult.sectionsToDemote.length > 0 && powerProfile && progression) {
      maintenanceResult.sectionsToDemote.forEach(section => {
        const { updatedRadarState } = forceSectionDemotion(section, powerProfile, progression);
        setRadarState(updatedRadarState);
      });
    }

    setLastMaintenanceCheck(now);
    return maintenanceResult;
  }, [lastMaintenanceCheck, radarState, powerProfile, progression]);

  // Get section consistency status
  const getSectionConsistency = useCallback((section: Section) => {
    return checkGreenConsistency(section);
  }, []);

  // Get decay status for all cheat codes in a section
  const getSectionDecayStatus = useCallback((section: Section) => {
    if (!powerProfile) return [];

    const sectionCodes = Object.values(powerProfile.cheatCodes).filter(
      code => code.section === section && !code.archived
    );

    return sectionCodes.map(code => ({
      cheatCodeId: code.cheatCodeId,
      cheatCodeName: code.cheatCodeName,
      decayStatus: getDecayWarningStatus(code)
    }));
  }, [powerProfile]);

  // Run decay checks and maintenance on mount and periodically
  useEffect(() => {
    if (powerProfile && progression && radarState) {
      // Run maintenance check on mount
      runMaintenanceCheck();

      // Set up periodic maintenance checks (every hour)
      const interval = setInterval(() => {
        runMaintenanceCheck();
      }, 60 * 60 * 1000); // 1 hour

      return () => clearInterval(interval);
    }
  }, [powerProfile, progression, radarState, runMaintenanceCheck]);

  return {
    // State
    radarState,
    isLoading,

    // Core functions
    getSectionScore,
    getRadarScore,
    isFullRadarGreen,
    executeUpdate,
    refreshRadarState,

    // Section utilities
    getSectionColor,
    getSectionColorAsHex,
    getSectionStats,
    getSectionTarget,
    getAllSectionScores,

    // Daily cap utilities
    checkDailyCap,

    // Stats
    getRadarStats,

    // Green Hold functions
    getGreenHold,
    getSectionConsistency,
    runMaintenanceCheck,

    // Decay functions
    getSectionDecayStatus,

    // Utility functions (re-exported)
    getSectionColorHex
  };
}