'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserPowerProfile,
  CheatCodePower,
  getCheatCodesForSection,
  calculateSectionAveragePower,
  getPowerColor,
  getNextPowerMilestone
} from './cheatCodePowerSystem';
import {
  loadPowerProfile,
  savePowerProfile,
  addUsageLogAndSave,
  applyDecayAndSave,
  debugPowerProfile
} from './cheatCodePowerStorage';

export function useCheatCodePower() {
  const [powerProfile, setPowerProfile] = useState<UserPowerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load power profile on mount
  useEffect(() => {
    try {
      const loaded = loadPowerProfile();
      setPowerProfile(loaded);
    } catch (error) {
      console.error('Failed to load power profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a usage log to a cheat code
  const addUsageLog = useCallback((cheatCodeId: string, cheatCodeName: string, section: string) => {
    try {
      const updated = addUsageLogAndSave(cheatCodeId, cheatCodeName, section);
      setPowerProfile(updated);
      return updated;
    } catch (error) {
      console.error('Failed to add usage log:', error);
      throw error;
    }
  }, []);

  // Get cheat codes for a specific section
  const getSectionCheatCodes = useCallback((section: string) => {
    if (!powerProfile) return [];
    return getCheatCodesForSection(powerProfile, section);
  }, [powerProfile]);

  // Get section average power
  const getSectionAveragePower = useCallback((section: string) => {
    if (!powerProfile) return 0;
    return calculateSectionAveragePower(powerProfile, section);
  }, [powerProfile]);

  // Get specific cheat code power
  const getCheatCodePower = useCallback((cheatCodeId: string) => {
    if (!powerProfile) return null;
    return powerProfile.cheatCodes[cheatCodeId] || null;
  }, [powerProfile]);

  // Check if user is in honeymoon phase
  const isInHoneymoonPhase = useCallback((section?: string) => {
    if (!powerProfile) return false;
    if (powerProfile.honeymoonPhaseEnded) return false;

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const accountAge = now - powerProfile.accountCreatedTimestamp;

    // Check 7-day limit
    if (accountAge >= sevenDaysMs) return false;

    // If section specified, check 10 logs per section limit
    if (section) {
      const sectionLogs = Object.values(powerProfile.cheatCodes)
        .filter(code => code.section === section)
        .reduce((sum, code) => sum + code.totalLogs, 0);
      return sectionLogs < 10;
    }

    return true;
  }, [powerProfile]);

  // Apply decay to all cheat codes
  const applyDecay = useCallback((sectionColorFloors: Record<string, number> = {}) => {
    try {
      const updated = applyDecayAndSave(sectionColorFloors);
      setPowerProfile(updated);
      return updated;
    } catch (error) {
      console.error('Failed to apply decay:', error);
      throw error;
    }
  }, []);

  // Force refresh from storage
  const refreshPowerProfile = useCallback(() => {
    try {
      const loaded = loadPowerProfile();
      setPowerProfile(loaded);
    } catch (error) {
      console.error('Failed to refresh power profile:', error);
    }
  }, []);

  // Update power profile manually
  const updatePowerProfile = useCallback((newProfile: UserPowerProfile) => {
    try {
      savePowerProfile(newProfile);
      setPowerProfile(newProfile);
    } catch (error) {
      console.error('Failed to update power profile:', error);
      throw error;
    }
  }, []);

  // Get power statistics
  const getPowerStats = useCallback(() => {
    if (!powerProfile) {
      return {
        totalCheatCodes: 0,
        averagePower: 0,
        highestPower: 0,
        totalLogs: 0,
        honeymoonActive: false,
        accountAgeHours: 0
      };
    }

    const codes = Object.values(powerProfile.cheatCodes);
    const totalPower = codes.reduce((sum, code) => sum + code.powerPercentage, 0);
    const averagePower = codes.length > 0 ? Math.round(totalPower / codes.length) : 0;
    const highestPower = codes.length > 0 ? Math.max(...codes.map(code => code.powerPercentage)) : 0;
    const accountAgeHours = Math.round((Date.now() - powerProfile.accountCreatedTimestamp) / (60 * 60 * 1000));

    return {
      totalCheatCodes: codes.length,
      averagePower,
      highestPower,
      totalLogs: powerProfile.totalLogsAcrossAllSections,
      honeymoonActive: isInHoneymoonPhase(),
      accountAgeHours
    };
  }, [powerProfile, isInHoneymoonPhase]);

  // Debug function
  const debugPower = useCallback(() => {
    debugPowerProfile();
  }, []);

  return {
    powerProfile,
    isLoading,
    addUsageLog,
    getSectionCheatCodes,
    getSectionAveragePower,
    getCheatCodePower,
    isInHoneymoonPhase,
    applyDecay,
    refreshPowerProfile,
    updatePowerProfile,
    getPowerStats,
    debugPower,
    // Utility functions
    getPowerColor,
    getNextPowerMilestone
  };
}