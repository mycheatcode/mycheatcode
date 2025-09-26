'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProgression, CheatCodeLog, Section, getNextProgressionTarget } from './progressionSystem';
import { loadProgression, saveProgression, addAndSaveLog } from './progressionStorage';

export function useProgression() {
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load progression on mount
  useEffect(() => {
    try {
      const loaded = loadProgression();
      setProgression(loaded);
    } catch (error) {
      console.error('Failed to load progression:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a log to progression
  const addLog = useCallback((log: CheatCodeLog) => {
    try {
      const updated = addAndSaveLog(log);
      setProgression(updated);
      return updated;
    } catch (error) {
      console.error('Failed to add log:', error);
      throw error;
    }
  }, []);

  // Get progression for a specific section
  const getSectionProgression = useCallback((section: Section) => {
    if (!progression) return null;
    return progression.sections[section];
  }, [progression]);

  // Get next target for a section
  const getNextTarget = useCallback((section: Section) => {
    const sectionProgress = getSectionProgression(section);
    if (!sectionProgress) return null;
    return getNextProgressionTarget(sectionProgress);
  }, [getSectionProgression]);

  // Check if user can progress in a section
  const canProgress = useCallback((section: Section) => {
    const target = getNextTarget(section);
    return target !== null;
  }, [getNextTarget]);

  // Get progress percentage for a section
  const getProgressPercentage = useCallback((section: Section) => {
    const sectionProgress = getSectionProgression(section);
    if (!sectionProgress) return 0;

    const { totalLogs, uniqueCheatCodes, color } = sectionProgress;
    const uniqueCount = uniqueCheatCodes.size;

    switch (color) {
      case 'green':
        return 100;
      case 'yellow':
        // Progress towards green: 12 logs, 3 cheat codes
        const logsProgress = Math.min(totalLogs / 12, 1);
        const codesProgress = Math.min(uniqueCount / 3, 1);
        return 75 + (Math.min(logsProgress, codesProgress) * 25);
      case 'orange':
        // Progress towards yellow: 6 logs, 2 cheat codes
        const yellowLogsProgress = Math.min(totalLogs / 6, 1);
        const yellowCodesProgress = Math.min(uniqueCount / 2, 1);
        return 25 + (Math.min(yellowLogsProgress, yellowCodesProgress) * 50);
      case 'red':
        // Progress towards orange: 2 logs, 1 cheat code
        const orangeLogsProgress = Math.min(totalLogs / 2, 1);
        const orangeCodesProgress = Math.min(uniqueCount / 1, 1);
        return Math.min(orangeLogsProgress, orangeCodesProgress) * 25;
      default:
        return 0;
    }
  }, [getSectionProgression]);

  // Force refresh progression from storage
  const refreshProgression = useCallback(() => {
    try {
      const loaded = loadProgression();
      setProgression(loaded);
    } catch (error) {
      console.error('Failed to refresh progression:', error);
    }
  }, []);

  // Update progression manually (useful for bulk updates)
  const updateProgression = useCallback((newProgression: UserProgression) => {
    try {
      saveProgression(newProgression);
      setProgression(newProgression);
    } catch (error) {
      console.error('Failed to update progression:', error);
      throw error;
    }
  }, []);

  return {
    progression,
    isLoading,
    addLog,
    getSectionProgression,
    getNextTarget,
    canProgress,
    getProgressPercentage,
    refreshProgression,
    updateProgression
  };
}