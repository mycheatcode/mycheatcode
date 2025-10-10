'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCheatCodePower } from '../utils/useCheatCodePower';
import { useSectionRadar } from '../utils/useSectionRadar';
import { Section } from '../utils/progressionSystem';
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
import ActiveCodesDisplay from '../../components/ActiveCodesDisplay';
import OverallProgressCircle from '../../components/OverallProgressCircle';
import StreakDisplay from '../../components/StreakDisplay';

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
  const [currentCard, setCurrentCard] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
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
      summary: "**What**: A 3-step mental reset routine for free throws\n\n**When**: Standing at the free throw line during pressure moments\n\n**How**: Take a controlled breath (2-count inhale, 3-count exhale), say 'My line, my time' while visualizing the ball going in\n\n**Why**: Creates consistency and focus under pressure by combining breathing, positive self-talk, and visualization\n\n**Cheat Code Phrase**: \"My line, my time\"",
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
      summary: "**What**: Active leadership through genuine teammate support and connection\n\n**When**: In the locker room before/after games and during team interactions\n\n**How**: Be first to celebrate successes, first to encourage after mistakes, ask about teammates' lives outside basketball, lead by example in effort and attitude\n\n**Why**: Strong team chemistry elevates everyone's performance and creates a supportive environment where players thrive\n\n**Cheat Code Phrase**: \"Team first, always\"",
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
      summary: "**What**: Mental preparation through visualization and positive affirmations\n\n**When**: 30 minutes before game time in a quiet space\n\n**How**: Visualize yourself making key plays, feeling confident, and leading your team. End with three power phrases about your specific strengths\n\n**Why**: Mental rehearsal primes your brain for success and builds unshakeable confidence before competition\n\n**Cheat Code Phrase**: \"I belong here\"",
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
      summary: "**What**: Mental approach for handling high-pressure game situations\n\n**When**: During clutch moments, close games, or when the pressure is highest\n\n**How**: Slow down your breathing, think 'This is why I practice,' trust your instincts, play aggressive, and embrace the moment\n\n**Why**: Great players are made in pressure moments - this mindset separates champions from everyone else\n\n**Cheat Code Phrase**: \"This is why I practice\"",
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
      summary: "**What**: Structured post-game mental processing routine\n\n**When**: Within 30 minutes after every game ends\n\n**How**: Spend 10 minutes writing down 3 things you did well, 1 thing to improve, and set your mindset for the next game\n\n**Why**: Prevents negative mental spirals, builds confidence through recognizing progress, and maintains forward momentum\n\n**Cheat Code Phrase**: \"Learn, grow, next\"",
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

  // Parse summary into card data
  const parseCheatCodeSummary = (summary: string) => {
    const sections = summary.split('\n\n');
    let what = '', when = '', how = '', why = '', phrase = '';

    sections.forEach(section => {
      if (section.startsWith('**What**:')) {
        what = section.replace('**What**: ', '').trim();
      } else if (section.startsWith('**When**:')) {
        when = section.replace('**When**: ', '').trim();
      } else if (section.startsWith('**How**:')) {
        how = section.replace('**How**: ', '').trim();
      } else if (section.startsWith('**Why**:')) {
        why = section.replace('**Why**: ', '').trim();
      } else if (section.startsWith('**Cheat Code Phrase**:')) {
        phrase = section.replace('**Cheat Code Phrase**: ', '').replace(/"/g, '').trim();
      }
    });

    // Split "How" into steps (assuming comma-separated or sentence-based)
    const howSteps = how.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).slice(0, 3);

    return { what, when, howSteps, why, phrase };
  };

  // Build cards array for swipeable interface
  const buildCards = (code: CheatCode) => {
    const { what, when, howSteps, why, phrase } = parseCheatCodeSummary(code.summary);

    return [
      { type: 'title', title: code.title, category: code.category },
      { type: 'section', heading: 'What', content: what },
      { type: 'section', heading: 'When', content: when },
      ...howSteps.map((step, index) => ({
        type: 'step',
        heading: 'How',
        stepNumber: index + 1,
        totalSteps: howSteps.length,
        content: step
      })),
      { type: 'section', heading: 'Why', content: why },
      { type: 'phrase', heading: 'Your Cheat Code Phrase', content: phrase }
    ];
  };

  // Card navigation
  const nextCard = () => {
    if (!selectedCode) return;
    const cards = buildCards(selectedCode);
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const resetCards = () => {
    setCurrentCard(0);
    setShowSuccess(false);
    setHasAdded(false);
  };

  const handleAddToMyCodes = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setHasAdded(true);
    }, 2000);
  };

  // Reset states when closing modal
  const handleCloseModal = () => {
    setSelectedCode(null);
    resetCards();
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans starfield-background">
      {/* Starfield Background */}
      <div className="starfield-container">
        <div className="stars stars-small"></div>
        <div className="stars stars-medium"></div>
        <div className="stars stars-large"></div>
        <div className="stars stars-twinkle"></div>
      </div>
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
            <span className="text-xs">Grow your streak by using codes regularly. Consistency keeps your mental game sharp.</span>
          </div>
        </div>

        {/* Cheat Codes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {getFilteredCodes().map((code) => (
            <div
              key={code.id}
              className={`bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-[2rem] p-5 min-h-[160px] flex flex-col justify-between relative shadow-xl border border-zinc-800/50 transition-all duration-500 ${
                animatingCode === code.id
                  ? animationType === 'archive'
                    ? 'opacity-50 scale-95 blur-sm'
                    : 'opacity-80 scale-105 shadow-lg border-green-500/30'
                  : ''
              } ${
                code.archived
                  ? 'opacity-60 border-zinc-700/50 bg-gradient-to-br from-zinc-800 via-zinc-800 to-zinc-700'
                  : ''
              }`}
            >
              {/* Archive Badge */}
              {code.archived && (
                <div className="absolute top-2.5 right-2.5">
                  <div className="inline-block px-2 py-0.5 bg-zinc-800/50 rounded-full border border-zinc-700/50">
                    <span className="text-zinc-400 text-[9px] uppercase font-semibold tracking-wider">Archived</span>
                  </div>
                </div>
              )}

              {/* Card Content - Matching Title Card Style */}
              <div className="space-y-3 flex-1 flex flex-col justify-center text-center">
                <div className="inline-block mx-auto px-2.5 py-0.5 bg-zinc-800/50 rounded-full border border-zinc-700/50">
                  <span className="text-zinc-400 text-[9px] uppercase font-semibold tracking-wider">
                    Cheat Code
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white leading-tight tracking-tight px-2">
                  {code.title}
                </h1>
                <div className="text-zinc-400 text-[10px] font-medium uppercase tracking-wide">
                  {code.category}
                </div>
              </div>

              {/* View Code Button */}
              <button
                onClick={() => setSelectedCode(code)}
                className="w-full bg-white text-black py-2.5 rounded-xl font-semibold text-xs hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-lg mt-3"
              >
                View Code
              </button>
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
          <div className="text-white text-xl app-label">MYCHEATCODE.AI</div>
        </div>

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div className={`absolute top-0 left-0 h-full w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

              <Link href="/my-codes" className="flex items-center gap-3 p-4 text-white bg-zinc-900/50 font-medium cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>

              <Link href="/community-topics" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>Community Topics</span>
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
              <span className="text-sm">Grow your streak by using codes regularly. Consistency keeps your mental game sharp.</span>
            </div>
          </div>

          {/* Cheat Codes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredCodes().map((code) => (
              <div
                key={code.id}
                onClick={() => setSelectedCode(code)}
                className={`bg-zinc-950 rounded-[2rem] p-8 min-h-[280px] flex flex-col justify-between relative shadow-xl border-2 border-zinc-800 transition-all cursor-pointer group ${
                  code.archived
                    ? 'opacity-60'
                    : 'hover:scale-[1.02] hover:border-zinc-700'
                }`}
              >
                {/* Archive Badge */}
                {code.archived && (
                  <div className="absolute top-5 right-5">
                    <div className="inline-block px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">Archived</span>
                    </div>
                  </div>
                )}

                {/* Card Content - Matching Title Card Style */}
                <div className="space-y-6 flex-1 flex flex-col justify-center text-center">
                  <h1 className="text-3xl font-bold text-white leading-[1.1] tracking-tight px-4">
                    {code.title}
                  </h1>
                  <div className="h-px w-16 bg-zinc-700 mx-auto"></div>
                  <div className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">
                    {code.category}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-6 text-zinc-500 text-sm pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">💪</span>
                    <span className="font-medium">{code.power}% Power</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{getStreakIcon(code.streakType)}</span>
                    <span className="font-medium">{getStreakText(code.streak, code.streakType)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">📊</span>
                    <span className="font-medium">{code.sessionsCompleted} sessions</span>
                  </div>
                </div>

                {/* Hover Overlay with View Button */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white text-black px-8 py-3 rounded-xl font-semibold text-lg">
                    View Code
                  </div>
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

      {/* Cheat Code Cue Cards Modal */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-6 right-6 p-3 text-zinc-400 hover:text-white transition-colors z-[120] bg-zinc-900/50 rounded-full border border-zinc-800/50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Card Container */}
          <div className="w-full max-w-lg">
            {/* Card with Navigation Inside */}
            <div className="bg-zinc-950 rounded-[2rem] p-12 min-h-[600px] flex relative shadow-2xl border-2 border-zinc-800">
              {/* Left Arrow - Centered */}
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className={`absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                  currentCard === 0
                    ? 'text-zinc-700 cursor-not-allowed opacity-30'
                    : 'text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* Right Arrow - Centered */}
              <button
                onClick={nextCard}
                disabled={currentCard === buildCards(selectedCode).length - 1}
                className={`absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                  currentCard === buildCards(selectedCode).length - 1
                    ? 'text-zinc-700 cursor-not-allowed opacity-30'
                    : 'text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Card Content */}
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                {(() => {
                  const cards = buildCards(selectedCode);
                  const card = cards[currentCard];

                  return (
                    <>
                      {/* Title Card */}
                      {card.type === 'title' && (
                        <div className="space-y-10 mt-12">
                          <h1 className="text-6xl font-bold text-white leading-[1.1] tracking-tight px-4">
                            {(card as any).title}
                          </h1>
                          <div className="h-px w-24 bg-zinc-700 mx-auto"></div>
                          <div className="text-zinc-400 text-base font-semibold uppercase tracking-widest">
                            {(card as any).category}
                          </div>
                        </div>
                      )}

                      {/* Section Cards (What, When) */}
                      {card.type === 'section' && (card as any).heading !== 'Why' && (
                        <div className="space-y-12 max-w-md mt-12">
                          <div className="text-zinc-500 text-xs uppercase font-bold tracking-[0.2em]">
                            {(card as any).heading}
                          </div>
                          <p className="text-white text-3xl font-medium leading-[1.4]">
                            {(card as any).content}
                          </p>
                        </div>
                      )}

                      {/* Why Card */}
                      {card.type === 'section' && (card as any).heading === 'Why' && (
                        <div className="space-y-12 max-w-lg mt-12">
                          <div className="text-zinc-500 text-xs uppercase font-bold tracking-[0.2em]">
                            {(card as any).heading}
                          </div>
                          <div className="space-y-8">
                            {(card as any).content.split('\n\n').map((paragraph: string, i: number) => (
                              <p key={i} className="text-white text-xl font-medium leading-[1.6]">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step Cards */}
                      {card.type === 'step' && 'stepNumber' in card && (
                        <div className="space-y-12 max-w-lg mt-12">
                          <div className="space-y-4">
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-[0.2em]">
                              {(card as any).heading}
                            </div>
                            <div className="text-zinc-600 text-sm font-semibold">
                              Step {(card as any).stepNumber} of {(card as any).totalSteps}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                              <span className="text-white font-bold text-xl">{(card as any).stepNumber}</span>
                            </div>
                            <p className="text-white text-2xl font-medium leading-[1.5] text-left flex-1">
                              {(card as any).content}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Phrase Card (Final) */}
                      {card.type === 'phrase' && (
                        <div className="space-y-12 w-full max-w-md mt-12">
                          <div className="text-zinc-500 text-xs uppercase font-bold tracking-[0.2em]">
                            Your Cheat Code Phrase
                          </div>
                          <div className="space-y-10">
                            <p className="text-white text-5xl font-bold leading-[1.2]">
                              "{(card as any).content}"
                            </p>
                            <div className="space-y-4 relative">
                              <button
                                onClick={() => {
                                  handleUseCheatCode(selectedCode);
                                }}
                                className="w-full bg-green-600 text-white py-5 rounded-2xl font-semibold text-lg hover:bg-green-500 transition-all active:scale-95 shadow-lg"
                              >
                                Use Cheat Code
                              </button>

                              <button
                                onClick={() => handleOpenChat(selectedCode)}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white py-4 rounded-2xl font-medium text-base hover:bg-zinc-700 transition-colors"
                              >
                                Open Chat
                              </button>

                              <button
                                onClick={resetCards}
                                className="w-full text-zinc-400 hover:text-white py-4 rounded-2xl font-medium text-base transition-colors"
                              >
                                Back to Start
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Success Animation Overlay */}
            {showSuccess && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                style={{ animation: 'fade-out 0.4s ease-out 1.6s forwards' }}
              >
                <div className="flex flex-col items-center gap-4" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                    <polyline points="20 6 9 17 4 12" strokeDasharray="100" strokeDashoffset="0"
                      style={{ animation: 'checkmark-draw 0.6s ease-out 0.1s backwards' }} />
                  </svg>
                  <div className="text-center" style={{ animation: 'fade-in-scale 0.4s ease-out 0.2s backwards' }}>
                    <h3 className="text-white text-3xl font-bold mb-1">Added to My Codes!</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {buildCards(selectedCode).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentCard
                      ? 'w-8 bg-white'
                      : 'w-1.5 bg-zinc-700'
                  }`}
                />
              ))}
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

      {/* Starfield CSS Styles */}
      <style jsx global>{`
        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-out {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes checkmark-draw {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .starfield-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .stars {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .stars-small {
          background:
            radial-gradient(circle at 25% 75%, #ffffff 0.8px, transparent 0.8px),
            radial-gradient(circle at 75% 25%, #87ceeb 0.8px, transparent 0.8px),
            radial-gradient(circle at 15% 45%, #ffffff 0.8px, transparent 0.8px);
          background-size: 350px 350px, 400px 400px, 320px 320px;
          animation: gentle-twinkle 20s ease-in-out infinite alternate;
          opacity: 0.35;
        }

        .stars-medium {
          background:
            radial-gradient(circle at 40% 60%, #ffffff 1.2px, transparent 1.2px),
            radial-gradient(circle at 80% 30%, #ffd700 1.2px, transparent 1.2px);
          background-size: 500px 500px, 450px 450px;
          animation: gentle-twinkle 28s ease-in-out infinite alternate-reverse;
          opacity: 0.25;
        }

        .stars-large {
          background:
            radial-gradient(circle at 60% 20%, #ffffff 2px, transparent 2px),
            radial-gradient(circle at 20% 80%, #87ceeb 2px, transparent 2px),
            radial-gradient(circle at 85% 70%, #ffd700 2px, transparent 2px);
          background-size: 800px 800px, 750px 750px, 900px 900px;
          animation: bright-twinkle 35s ease-in-out infinite;
          opacity: 0.2;
        }

        .stars-twinkle {
          background-image:
            radial-gradient(circle at 30% 40%, rgba(255,255,255,0.6) 3px, transparent 3px),
            radial-gradient(circle at 70% 70%, rgba(135,206,235,0.6) 3px, transparent 3px),
            radial-gradient(circle at 15% 20%, rgba(255,215,0,0.7) 2.5px, transparent 2.5px);
          background-size: 800px 800px, 700px 700px, 900px 900px;
          animation: star-sparkle 25s ease-in-out infinite alternate;
          opacity: 0.35;
        }

        @keyframes gentle-twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 0.45; }
          100% { opacity: 0.35; }
        }

        @keyframes bright-twinkle {
          0% { opacity: 0.15; }
          25% { opacity: 0.25; }
          50% { opacity: 0.3; }
          75% { opacity: 0.2; }
          100% { opacity: 0.15; }
        }

        @keyframes star-sparkle {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
          100% {
            opacity: 0.35;
            transform: scale(1);
          }
        }

        .starfield-background {
          position: relative;
          overflow: hidden;
        }
      `}</style>

    </div>
  );
}