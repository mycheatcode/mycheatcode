'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCheatCodePower } from '../utils/useCheatCodePower';
import { useSectionRadar } from '../utils/useSectionRadar';
import { Section } from '../utils/progressionSystem';
import CheatCodePowerBar from '../../components/CheatCodePowerBar';
import EngagementFeedback, { useEngagementFeedback } from '../../components/EngagementFeedback';
import { processEngagementEvent, EngagementEvent } from '../utils/engagementSystem';
import { triggerSuccessFeedback, triggerLevelUpFeedback, triggerAchievementFeedback } from '../utils/hapticFeedback';
import {
  archiveCheatCode,
  reactivateCheatCode,
  getSectionStats,
  getActiveCodes,
  getArchivedCodes,
  MAX_ACTIVE_CODES_PER_SECTION
} from '../utils/codeManagementSystem';

interface CheatCode {
  id: number;
  title: string;
  category: string;
  power: number;
  streak: number;
  streakType: 'fire' | 'calendar' | 'sleep' | 'new';
  lastSession: string;
  sessionsCompleted: number;
  summary: string;
  topicId?: number;
  archived?: boolean;
}

export default function MyCodesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCode, setSelectedCode] = useState<CheatCode | null>(null);
  const [animatingCode, setAnimatingCode] = useState<number | null>(null);
  const [animationType, setAnimationType] = useState<'archive' | 'reactivate' | null>(null);
  const [cheatCodes, setCheatCodes] = useState<CheatCode[]>([
    {
      id: 1,
      title: "Free Throw Lockdown",
      category: "In-Game",
      power: 95,
      streak: 8,
      streakType: 'fire',
      lastSession: "1 hour ago",
      sessionsCompleted: 18,
      summary: "Master the 3-step mental reset: controlled breath (2-count inhale, 3-count exhale), say 'My line, my time' while visualizing success. Perfect for clutch moments.",
      topicId: 1
    },
    {
      id: 2,
      title: "Team Chemistry Builder",
      category: "Locker Room",
      power: 62,
      streak: 3,
      streakType: 'fire',
      lastSession: "Yesterday",
      sessionsCompleted: 9,
      summary: "Be the first to celebrate teammates' success and first to encourage after mistakes. Ask about their lives outside basketball. Lead by example in effort and attitude.",
      topicId: 2
    },
    {
      id: 3,
      title: "Pre-Game Confidence Boost",
      category: "Pre-Game",
      power: 28,
      streak: 1,
      streakType: 'calendar',
      lastSession: "3 days ago",
      sessionsCompleted: 4,
      summary: "Visualization routine 30 minutes before game: see yourself making key plays, feeling confident, and leading your team. End with three power phrases about your strengths.",
      topicId: 3
    },
    {
      id: 4,
      title: "Clutch Time Mentality",
      category: "In-Game",
      power: 83,
      streak: 6,
      streakType: 'fire',
      lastSession: "Yesterday",
      sessionsCompleted: 11,
      summary: "In pressure moments, slow down your breathing and think 'This is why I practice.' Trust your instincts, play aggressive, and remember that great players want the ball in these moments.",
      topicId: 4
    },
    {
      id: 5,
      title: "Post-Game Mental Reset",
      category: "Post-Game",
      power: 42,
      streak: 2,
      streakType: 'calendar',
      lastSession: "2 days ago",
      sessionsCompleted: 6,
      summary: "After each game, spend 10 minutes processing: write down 3 things you did well, 1 thing to improve, and set your mindset for the next game. This prevents negative spirals and builds confidence.",
      topicId: 5
    }
  ]);
  const router = useRouter();
  const { addUsageLog, getCheatCodePower, getSectionCheatCodes } = useCheatCodePower();
  const { executeUpdate, getSectionDecayStatus } = useSectionRadar();

  // Engagement system hooks
  const { activeEvent, showFeedback, dismissFeedback } = useEngagementFeedback();

  // Check for decay on page load
  useEffect(() => {
    // TODO: Add periodic decay check here if needed
    // This would call checkAndApplyDecayIfNeeded() to update power levels
  }, []);


  // Seed some test data on mount for demo purposes
  useEffect(() => {
    // Add the first few cheat codes to the power system if they don't exist
    const testCodes = [
      { id: '1', name: 'Free Throw Confidence', section: 'Pre-Game' },
      { id: '2', name: 'Handling Shooting Slumps', section: 'In-Game' },
      { id: '3', name: 'Coach Communication', section: 'Off Court' },
      { id: '4', name: 'Pre-Game Sleep Routine', section: 'Pre-Game' }
    ];

    testCodes.forEach(code => {
      const existing = getCheatCodePower(code.id);
      if (!existing) {
        // Get the expected power from mock data to match the display
        const mockCode = cheatCodes.find(c => c.id.toString() === code.id);
        const targetPower = mockCode ? mockCode.power : 50;

        // Calculate approximate number of logs needed to reach target power
        const logsNeeded = Math.max(1, Math.floor(targetPower / 8)); // Rough estimate

        try {
          // Add multiple logs to reach target power
          for (let i = 0; i < logsNeeded; i++) {
            addUsageLog(code.id, code.name, code.section);
          }

          // Set the exact power and timestamp for realistic display
          const powerData = getCheatCodePower(code.id);
          if (powerData) {
            powerData.powerPercentage = targetPower;
            const daysAgo = code.id === '4' ? 3 : 1; // Code #4 will be decaying
            powerData.lastUsedTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
          }
        } catch (error) {
          console.log('Could not seed test data:', error);
        }
      }
    });
  }, [addUsageLog, getCheatCodePower]);

  // Function to add a log to a cheat code (updates both power system and section radar)
  const handleUseCheatCode = async (cheatCode: CheatCode) => {
    try {
      console.log(`=== Using cheat code: ${cheatCode.title} (ID: ${cheatCode.id}) ===`);

      // Check power BEFORE using
      const powerBefore = getCheatCodePower(cheatCode.id.toString());
      console.log('Power before use:', powerBefore?.powerPercentage || 'Not found');
      console.log('Mock data power:', cheatCode.power);

      // Add to power system first
      const updatedProfile = addUsageLog(
        cheatCode.id.toString(),
        cheatCode.title,
        cheatCode.category
      );

      // Check power AFTER using
      const powerAfter = getCheatCodePower(cheatCode.id.toString());
      console.log('Power after addUsageLog:', powerAfter?.powerPercentage);

      // Execute complete update flow: code → section → radar
      const result = await executeUpdate(
        cheatCode.id.toString(),
        cheatCode.title,
        cheatCode.category as Section
      );

      // Check power AFTER executeUpdate
      const powerAfterUpdate = getCheatCodePower(cheatCode.id.toString());
      console.log('Power after executeUpdate:', powerAfterUpdate?.powerPercentage);
      console.log('Real power returned by getRealPower:', getRealPower(cheatCode));

      // Check for achievement feedback
      if (result.sectionUpgrade?.newColor === 'green') {
        triggerAchievementFeedback(); // Heavy haptic for achievements
      }

      // Show section upgrade feedback
      if (result.sectionUpgrade) {
        if (result.sectionUpgrade.newColor === 'green') {
          showFeedback('section_upgraded', {
            section: result.sectionUpgrade.section,
            newColor: result.sectionUpgrade.newColor,
            oldColor: result.sectionUpgrade.oldColor
          });
          triggerLevelUpFeedback(); // Medium haptic for level ups
        }
      }

      // Regular usage feedback
      if (!result.sectionUpgrade) {
        triggerSuccessFeedback(); // Light haptic for regular usage
      }

      // Update local state (simulate using the code)
      setCheatCodes(prev => prev.map(code =>
        code.id === cheatCode.id
          ? { ...code, sessionsCompleted: code.sessionsCompleted + 1, lastSession: 'Just now' }
          : code
      ));

      console.log('Cheat code usage result:', result);
    } catch (error) {
      console.error('Error using cheat code:', error);
    }
  };

  // Get real power from power system
  const getRealPower = (cheatCode: CheatCode) => {
    // For demo purposes, just return the basic power value
    return cheatCode.power;
  };

  // Get decay status for a cheat code
  const getDecayStatus = (cheatCode: CheatCode) => {
    const powerData = getCheatCodePower(cheatCode.id.toString());
    if (!powerData) {
      console.log('No power data found for:', cheatCode.title, cheatCode.id);
      return null;
    }

    const now = Date.now();
    const timeSinceLastUse = now - powerData.lastUsedTimestamp;
    const hoursInactive = Math.floor(timeSinceLastUse / (60 * 60 * 1000));
    const threshold48h = 48 * 60 * 60 * 1000;

    console.log(`Decay check for ${cheatCode.title}:`, {
      timeSinceLastUse: Math.floor(timeSinceLastUse / (60 * 60 * 1000)) + 'h',
      threshold48h: 48 + 'h',
      isDecaying: timeSinceLastUse > threshold48h,
      isWarning: timeSinceLastUse > threshold48h * 0.75
    });

    if (timeSinceLastUse > threshold48h) {
      return { status: 'decaying', hoursInactive, icon: '🔋', color: 'text-red-400' };
    } else if (timeSinceLastUse > threshold48h * 0.75) { // 36+ hours
      const hoursUntilDecay = Math.ceil((threshold48h - timeSinceLastUse) / (60 * 60 * 1000));
      return { status: 'warning', hoursUntilDecay, icon: '⚠️', color: 'text-orange-400' };
    }

    // For demo purposes, let's show decay warnings on some codes
    // This will work once the power system has data
    if (cheatCode.id === 1) {
      return { status: 'warning', hoursUntilDecay: 8, icon: '⚠️', color: 'text-orange-400' };
    }
    if (cheatCode.id === 4) {
      return { status: 'decaying', hoursInactive: 72, icon: '🔋', color: 'text-red-400' };
    }

    return null;
  };

  // Check for selected category from radar navigation
  useEffect(() => {
    const selectedCategory = localStorage.getItem('selectedCategory');
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
      // Clear the stored category after setting it
      localStorage.removeItem('selectedCategory');
    }
  }, []);

  const categories = ['All', 'Active', 'Pre-Game', 'Off Court', 'Post-Game', 'In-Game', 'Locker Room', 'Archived'];

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'calendar': return '📅';
      case 'sleep': return '💤';
      case 'new': return '✨';
      default: return '🔥';
    }
  };

  const getStreakText = (streak: number, type: string) => {
    if (type === 'new') return 'New';
    return `${streak} day${streak !== 1 ? 's' : ''}`;
  };


  const getPowerBarGradient = (power: number) => {
    if (power <= 25) {
      // Only red until 25%
      return 'linear-gradient(90deg, #FF0000 0%, #FF0000 100%)';
    } else if (power <= 50) {
      // Red to orange: smooth transition from 20-25%
      const redEnd = (20 / power) * 100;
      const orangeStart = (25 / power) * 100;
      return `linear-gradient(90deg, #FF0000 0%, #FF0000 ${redEnd}%, #FFA500 ${orangeStart}%, #FFA500 100%)`;
    } else if (power <= 75) {
      // Red to orange to yellow: transitions at 20-25% and 45-50%
      const redEnd = (20 / power) * 100;
      const orangeStart = (25 / power) * 100;
      const orangeEnd = (45 / power) * 100;
      const yellowStart = (50 / power) * 100;
      return `linear-gradient(90deg, #FF0000 0%, #FF0000 ${redEnd}%, #FFA500 ${orangeStart}%, #FFA500 ${orangeEnd}%, #FFFF00 ${yellowStart}%, #FFFF00 100%)`;
    } else {
      // All colors: transitions at 20-25%, 45-50%, 70-75%
      const redEnd = (20 / power) * 100;
      const orangeStart = (25 / power) * 100;
      const orangeEnd = (45 / power) * 100;
      const yellowStart = (50 / power) * 100;
      const yellowEnd = (70 / power) * 100;
      const greenStart = (75 / power) * 100;
      return `linear-gradient(90deg, #FF0000 0%, #FF0000 ${redEnd}%, #FFA500 ${orangeStart}%, #FFA500 ${orangeEnd}%, #FFFF00 ${yellowStart}%, #FFFF00 ${yellowEnd}%, #00FF00 ${greenStart}%, #00FF00 100%)`;
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return cheatCodes.length;
    if (category === 'Active') return cheatCodes.filter(code => !code.archived).length;
    if (category === 'Archived') return cheatCodes.filter(code => code.archived).length;
    return cheatCodes.filter(code => code.category === category && !code.archived).length;
  };

  // Get section management stats
  const getSectionManagementInfo = (category: string) => {
    if (category === 'Active' || category === 'Archived') return null;
    const stats = getSectionStats(category as Section);
    return stats;
  };

  const toggleArchiveStatus = (codeId: number) => {
    const code = cheatCodes.find(c => c.id === codeId);
    if (!code) return;

    // Start animation
    setAnimatingCode(codeId);
    setAnimationType(code.archived ? 'reactivate' : 'archive');

    // Delay the actual status change to allow animation
    setTimeout(() => {
      if (code.archived) {
        // Reactivate
        const result = reactivateCheatCode(codeId.toString());
        if (result.success) {
          setCheatCodes(codes => codes.map(c =>
            c.id === codeId ? { ...c, archived: false } : c
          ));
          console.log('Reactivated code:', result.reactivatedCode?.cheatCodeName);
        } else if (result.needsArchivalDecision) {
          // Handle the case where section is full
          alert(`Your ${code.category} section is full (${MAX_ACTIVE_CODES_PER_SECTION} active codes). Archive another code first.`);
        }
      } else {
        // Archive
        const result = archiveCheatCode(codeId.toString());
        if (result.success) {
          setCheatCodes(codes => codes.map(c =>
            c.id === codeId ? { ...c, archived: true } : c
          ));
          console.log('Archived code:', result.archivedCode?.cheatCodeName);
        }
      }

      // Clear animation state
      setTimeout(() => {
        setAnimatingCode(null);
        setAnimationType(null);
      }, 300);
    }, 150);

    setSelectedCode(null);
  };

  const getFilteredCodes = () => {
    if (activeCategory === 'All') {
      return cheatCodes;
    } else if (activeCategory === 'Active') {
      return cheatCodes.filter(code => !code.archived);
    } else if (activeCategory === 'Archived') {
      return cheatCodes.filter(code => code.archived);
    } else {
      return cheatCodes.filter(code => code.category === activeCategory && !code.archived);
    }
  };

  const handleOpenChat = (code: CheatCode) => {
    if (code.topicId) {
      // Store comprehensive conversation data to continue exactly where left off
      localStorage.setItem('selectedTopic', JSON.stringify({
        id: code.topicId,
        title: code.title,
        description: code.summary,
        isReturningToExistingChat: true,
        cheatCodeId: code.id,
        conversationContext: {
          category: code.category,
          sessionsCompleted: code.sessionsCompleted,
          currentPower: code.power,
          currentStreak: code.streak,
          lastSession: code.lastSession,
          developedStrategy: code.summary
        }
      }));
    }
    router.push('/chat');
  };

  const handleStartFreshChat = () => {
    // Clear all chat-related data from localStorage to ensure fresh start
    localStorage.removeItem('selectedTopic');
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatReferrer');

    // Navigate to chat page
    router.push('/chat');
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Mobile Design */}
      <div className="lg:hidden bg-black min-h-screen relative flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black border-b border-zinc-800">
          {/* App Title */}
          <div className="flex items-center justify-center relative mb-4">
            <div className="text-lg font-semibold text-white">mycheatcode.ai</div>
            <div className="absolute right-0 w-6 h-6 flex items-center justify-center text-zinc-500 cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="w-8 h-8 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </Link>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
              </svg>
              <span className="text-xs text-white font-semibold">14 DAY STREAK</span>
            </div>
          </div>

          {/* Page Title */}
          <div className="text-[1.8em] font-bold text-white mb-2">My Cheat Codes</div>
          <div className="text-zinc-400 text-sm leading-relaxed">Your vault of mental performance cheat codes</div>

        </div>

        {/* Stats Summary */}
        <div className="flex justify-around py-5 border-b border-zinc-800">
          <div className="text-center">
            <div className="text-white text-2xl font-bold">5</div>
            <div className="text-zinc-500 text-xs uppercase tracking-wide">Active Codes</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">62%</div>
            <div className="text-zinc-500 text-xs uppercase tracking-wide">Avg Power</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">14</div>
            <div className="text-zinc-500 text-xs uppercase tracking-wide">Day Streak</div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 p-4 pb-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const getCategoryColors = () => {
              if (category === 'All') return 'bg-white/5 border border-white/10 active:scale-95';
              if (category === 'Active') return 'bg-white/5 border border-white/10 active:scale-95';
              if (category === 'Pre-Game') return 'bg-red-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'Off Court') return 'bg-orange-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'Post-Game') return 'bg-yellow-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'In-Game') return 'bg-green-500/[0.075] border border-white/10 active:scale-95';
              if (category === 'Locker Room') return 'bg-blue-800/[0.075] border border-white/10 active:scale-95';
              if (category === 'Archived') return 'bg-zinc-600/[0.075] border border-white/10 active:scale-95';
              return 'bg-white/5 border border-white/10 active:scale-95';
            };

            const sectionInfo = getSectionManagementInfo(category);

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category
                    ? 'bg-white text-black'
                    : `${getCategoryColors()} text-zinc-300`
                }`}
              >
                <span>{category}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${
                    activeCategory === category
                      ? 'text-black/70'
                      : 'text-zinc-500'
                  }`}>
                    {getCategoryCount(category)}
                  </span>
                  {sectionInfo && sectionInfo.slotsRemaining === 0 && (
                    <span className="text-xs text-red-400 ml-1">FULL</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Consistency Message */}
        <div className="px-4 py-3 bg-white/[0.02] border-y border-white/5">
          <div className="flex items-center gap-2 text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-xs">Codes lose power through inconsistency. Stay consistent to reach full power and be limitless.</span>
          </div>
        </div>

        {/* Cheat Codes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {getFilteredCodes().map((code) => (
            <div
              key={code.id}
              onClick={() => setSelectedCode(code)}
              className={`bg-white/[0.03] border border-white/10 rounded-2xl p-4 transition-all duration-500 cursor-pointer active:scale-98 ${
                animatingCode === code.id
                  ? animationType === 'archive'
                    ? 'opacity-50 scale-95 blur-sm'
                    : 'opacity-80 scale-105 shadow-lg border-green-500/30'
                  : ''
              } ${
                code.archived
                  ? 'opacity-60 border-zinc-700/50 bg-zinc-800/20'
                  : ''
              }`}
            >
              {/* Archive Status Badge */}
              {code.archived && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="bg-zinc-600/20 border border-zinc-600/30 text-zinc-300 text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide">
                    Archived
                  </div>
                </div>
              )}
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-white text-base font-semibold mb-1 leading-tight pr-4">
                    {code.title}
                  </div>
                  <div className="text-zinc-400 text-xs uppercase tracking-wide">
                    {code.category}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-xl">
                  <span className="text-xs">{getStreakIcon(code.streakType)}</span>
                  <span className="text-zinc-400 text-xs font-medium">
                    {getStreakText(code.streak, code.streakType)}
                  </span>
                </div>
              </div>

              {/* Power Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400 text-xs uppercase tracking-wide">Cheat Code Power</span>
                  <span className="text-white text-xs font-semibold">{getRealPower(code)}%</span>
                </div>
                <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      background: getPowerBarGradient(getRealPower(code)),
                      width: `${getRealPower(code)}%`
                    }}
                  ></div>
                  {/* Subtle highlight overlay for premium feel */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full opacity-20 transition-all duration-300 ease-out"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      width: `${getRealPower(code)}%`
                    }}
                  ></div>
                </div>
              </div>


              {/* Last Session */}
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-zinc-500 text-xs">Last session: {code.lastSession}</span>
                <span className="text-zinc-400 text-xs font-medium">{code.sessionsCompleted} sessions</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer */}
        <div className="fixed bottom-20 right-4 lg:hidden">
          <button onClick={handleStartFreshChat} className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

      </div>

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header with Menu Button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 z-20 bg-black">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-white text-xl font-bold">mycheatcode.ai</div>
        </div>

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div className={`absolute top-0 left-0 h-full w-64 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="pt-20"></div>

          <nav className="flex-1">
            <div>
              <Link href="/" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <div className="flex items-center gap-3 p-4 text-white font-medium relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </div>
              <Link href="/waitlist" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Early Access</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/chat-history" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Chat History</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/profile" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Profile</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Overlay when menu is open */}
        {menuOpen && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-5"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/" className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </Link>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                </svg>
                <span className="text-sm text-white font-semibold">14 DAY STREAK</span>
              </div>
            </div>

            <div className="text-4xl font-bold text-white mb-4">My Cheat Codes</div>
            <div className="text-zinc-400 text-lg leading-relaxed">Your vault of mental performance cheat codes</div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white text-3xl font-bold mb-2">5</div>
              <div className="text-zinc-400 text-sm uppercase tracking-wide">Active Codes</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white text-3xl font-bold mb-2">62%</div>
              <div className="text-zinc-400 text-sm uppercase tracking-wide">Avg Power</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white text-3xl font-bold mb-2">14</div>
              <div className="text-zinc-400 text-sm uppercase tracking-wide">Day Streak</div>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
            {categories.map((category, index) => {
              const getCategoryColors = () => {
                if (category === 'All') return 'bg-white/5 border border-white/10 hover:bg-white/10';
                if (category === 'Pre-Game') return 'bg-red-500/[0.075] border border-white/10 hover:bg-red-500/[0.125]';
                if (category === 'Off Court') return 'bg-orange-500/[0.075] border border-white/10 hover:bg-orange-500/[0.125]';
                if (category === 'Post-Game') return 'bg-yellow-500/[0.075] border border-white/10 hover:bg-yellow-500/[0.125]';
                if (category === 'In-Game') return 'bg-green-500/[0.075] border border-white/10 hover:bg-green-500/[0.125]';
                if (category === 'Locker Room') return 'bg-blue-800/[0.075] border border-white/10 hover:bg-blue-800/[0.125]';
                if (category === 'Archived') return 'bg-zinc-600/[0.075] border border-white/10 hover:bg-zinc-600/[0.125]';
                return 'bg-white/5 border border-white/10 hover:bg-white/10';
              };

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-3 ${
                    activeCategory === category
                      ? 'bg-white text-black'
                      : `${getCategoryColors()} text-zinc-300`
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-xs ${
                    activeCategory === category
                      ? 'text-black/70'
                      : 'text-zinc-500'
                  }`}>
                    {getCategoryCount(category)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Consistency Message */}
          <div className="px-6 py-4 bg-white/[0.02] border border-white/5 rounded-xl mb-8">
            <div className="flex items-center gap-3 text-zinc-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span className="text-sm">Codes lose power through inconsistency. Stay consistent to reach full power and be limitless.</span>
            </div>
          </div>

          {/* Cheat Codes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredCodes().map((code) => (
              <div
                key={code.id}
                onClick={() => setSelectedCode(code)}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-all cursor-pointer hover:scale-[1.02]"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="text-white text-lg font-semibold mb-2 leading-tight pr-4">
                      {code.title}
                    </div>
                    <div className="text-zinc-400 text-sm uppercase tracking-wide">
                      {code.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
                    <span className="text-sm">{getStreakIcon(code.streakType)}</span>
                    <span className="text-zinc-300 text-sm font-medium">
                      {getStreakText(code.streak, code.streakType)}
                    </span>
                  </div>
                </div>

                {/* Power Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-zinc-400 text-sm uppercase tracking-wide">Cheat Code Power</span>
                    <span className="text-white text-sm font-semibold">{getRealPower(code)}%</span>
                  </div>
                  <div className="w-full h-6 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        background: getPowerBarGradient(getRealPower(code)),
                        width: `${getRealPower(code)}%`
                      }}
                    ></div>
                    {/* Subtle highlight overlay for premium feel */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-full opacity-20 transition-all duration-300 ease-out"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        width: `${getRealPower(code)}%`
                      }}
                    ></div>
                  </div>
                </div>


                {/* Last Session */}
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-zinc-400 text-sm">Last session: {code.lastSession}</span>
                  <span className="text-zinc-300 text-sm font-medium">{code.sessionsCompleted} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="fixed bottom-16 right-8 hidden lg:block">
          <button onClick={handleStartFreshChat} className="bg-white text-black w-16 h-16 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Cheat Code Summary Modal */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-1">{selectedCode.title}</h2>
                <div className="text-zinc-400 text-sm uppercase tracking-wide">{selectedCode.category}</div>
              </div>
              <button
                onClick={() => setSelectedCode(null)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Power and Streak Info */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">Power:</span>
                  <span className="text-white font-semibold">{selectedCode.power}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">Streak:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{getStreakIcon(selectedCode.streakType)}</span>
                    <span className="text-white text-sm font-medium">
                      {getStreakText(selectedCode.streak, selectedCode.streakType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Your Cheat Code Strategy</h3>
                <div className="bg-zinc-800/50 border border-white/10 rounded-xl p-4">
                  <p className="text-zinc-300 leading-relaxed">{selectedCode.summary}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleUseCheatCode(selectedCode);
                    setSelectedCode(null); // Close modal after use
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Use Cheat Code
                </button>
                <button
                  onClick={() => handleOpenChat(selectedCode)}
                  className="w-full bg-white text-black py-2.5 rounded-full text-sm font-medium hover:bg-zinc-100 transition-colors"
                >
                  Open Chat
                </button>
              </div>

              <div className="flex items-center justify-center py-3">
                <button
                  onClick={() => toggleArchiveStatus(selectedCode.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCode.archived
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                      : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-600/30'
                  }`}
                >
                  {selectedCode.archived ? 'Reactivate' : 'Archive'}
                </button>
              </div>

              {/* Archive Status Indicator */}
              {selectedCode.archived && (
                <div className="mb-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                    <span>This code is archived and doesn't count toward your section progress</span>
                  </div>
                </div>
              )}

              {!selectedCode.archived && (
                <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span>This code is active and contributing to your section progress</span>
                  </div>
                </div>
              )}

              {/* Session Info */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Last session: {selectedCode.lastSession}</span>
                  <span>{selectedCode.sessionsCompleted} sessions completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Feedback */}
      {activeEvent && (
        <EngagementFeedback
          event={activeEvent.event}
          eventData={activeEvent.eventData}
          onDismiss={dismissFeedback}
        />
      )}

    </div>
  );
}