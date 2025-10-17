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

// Force dark mode immediately
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}

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
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Mobile & Desktop Header with Menu */}
      <div className="lg:hidden absolute top-0 left-0 right-0 px-4 py-4 flex items-center gap-4 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--accent-color)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="text-lg font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#000000' }}
      >
        <div className="pt-24 px-6">
          <div className="text-xs font-bold tracking-widest mb-6" style={{ color: 'var(--accent-color)' }}>NAVIGATION</div>
        </div>
        <nav className="flex-1 px-4">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </Link>
            <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
            </Link>
            <Link href="/community-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Community Topics</span>
            </Link>
            <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Chat History</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
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
          className="lg:hidden fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Design */}
      <div className="lg:hidden min-h-screen relative flex flex-col pt-16">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          {/* Page Title */}
          <div className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>My Cheat Codes</div>
          <div className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Your vault of confidence boosting cheat codes</div>

        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 p-4 pb-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const sectionInfo = getSectionManagementInfo(category);

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
                style={
                  activeCategory === category
                    ? { backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }
                }
              >
                <span>{category}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ opacity: 0.7 }}>
                    {getCategoryCount(category)}
                  </span>
                  {sectionInfo && sectionInfo.slotsRemaining === 0 && (
                    <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>FULL</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Consistency Message */}
        <div className="px-4 py-3 border-y" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: 0.5 }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-xs">Grow your streak by using codes regularly. Consistency keeps your mental game sharp.</span>
          </div>
        </div>

        {/* Cheat Codes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {getFilteredCodes().map((code) => (
            <div
              key={code.id}
              onClick={() => setSelectedCode(code)}
              className={`rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative border transition-all duration-500 active:scale-[0.98] ${
                animatingCode === code.id
                  ? animationType === 'archive'
                    ? 'opacity-50 scale-95 blur-sm'
                    : 'opacity-80 scale-105'
                  : ''
              } ${
                code.archived
                  ? 'opacity-60'
                  : ''
              }`}
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              {/* Archive Badge */}
              {code.archived && (
                <div className="absolute top-3 right-3">
                  <div className="inline-block px-2 py-0.5 border rounded-md text-[10px] uppercase font-semibold tracking-wider" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                    Archived
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="space-y-3 flex-1 flex flex-col justify-center text-center">
                <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {code.title}
                </h1>
                <div className="h-px w-12 mx-auto" style={{ backgroundColor: 'var(--card-border)' }}></div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  {code.category}
                </div>
              </div>

              {/* Bottom Stats Row */}
              <div className="flex items-center justify-between text-[10px] pt-3 border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--card-border)' }}>
                <div>
                  <span className="font-medium">Last: {code.lastSession}</span>
                </div>
                <div>
                  <span className="font-medium">{code.sessionsCompleted} sessions</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer */}
        <div className="fixed bottom-20 right-4 lg:hidden">
          <button onClick={handleStartFreshChat} className="w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

      </div>

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header with Menu Button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 z-20">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-xl app-label" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
        </div>

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div
          className={`absolute top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: '#000000' }}
        >
          <div className="pt-24 px-6">
            <div className="text-xs font-bold tracking-widest mb-6" style={{ color: 'var(--accent-color)' }}>NAVIGATION</div>
          </div>

          <nav className="flex-1 px-4">
            <div className="space-y-1">
              <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>

              <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
              </Link>

              <Link href="/community-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>Community Topics</span>
              </Link>

              <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Chat History</span>
              </Link>

              <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
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
            className="absolute inset-0 z-5"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>My Cheat Codes</div>
            <div className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Your vault of confidence boosting cheat codes</div>
          </div>

          {/* Categories Filter */}
          <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
            {categories.map((category, index) => {
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className="px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-3"
                  style={
                    activeCategory === category
                      ? { backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }
                      : { backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }
                  }
                >
                  <span>{category}</span>
                  <span className="text-xs" style={{ opacity: 0.7 }}>
                    {getCategoryCount(category)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Consistency Message */}
          <div className="px-6 py-4 border rounded-xl mb-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', opacity: 0.6 }}>
            <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
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
                className={`rounded-2xl p-5 min-h-[200px] flex flex-col justify-between relative border transition-all cursor-pointer group ${
                  code.archived
                    ? 'opacity-60'
                    : 'hover:scale-[1.02]'
                }`}
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >

                {/* Archive Badge */}
                {code.archived && (
                  <div className="absolute top-3 right-3">
                    <div className="inline-block px-2 py-0.5 border rounded-md text-[10px] uppercase font-semibold tracking-wider" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                      Archived
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="space-y-3 flex-1 flex flex-col justify-center text-center">
                  <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {code.title}
                  </h1>
                  <div className="h-px w-12 mx-auto" style={{ backgroundColor: 'var(--card-border)' }}></div>
                  <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    {code.category}
                  </div>
                </div>

                {/* Bottom Stats Row */}
                <div className="flex items-center justify-between text-[10px] pt-3 border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--card-border)' }}>
                  <div>
                    <span className="font-medium">Last: {code.lastSession}</span>
                  </div>
                  <div>
                    <span className="font-medium">{code.sessionsCompleted} sessions</span>
                  </div>
                </div>

                {/* Hover Overlay with View Button */}
                <div className="absolute inset-0 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                  <div className="px-8 py-3 rounded-xl font-semibold text-lg" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
                    View Code
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="fixed bottom-16 right-8 hidden lg:block">
          <button onClick={handleStartFreshChat} className="w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
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
            className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 lg:p-3 transition-colors z-[120] rounded-full border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Card Container */}
          <div className="w-full max-w-lg">
            {/* Card with Navigation Inside */}
            <div className="rounded-2xl p-6 lg:p-10 min-h-[400px] lg:min-h-[500px] flex relative border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              {/* Left Arrow - Centered */}
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className={`absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  currentCard === 0
                    ? 'cursor-not-allowed opacity-30'
                    : 'active:scale-95'
                }`}
                style={{ color: currentCard === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* Right Arrow - Centered */}
              <button
                onClick={nextCard}
                disabled={currentCard === buildCards(selectedCode).length - 1}
                className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  currentCard === buildCards(selectedCode).length - 1
                    ? 'cursor-not-allowed opacity-30'
                    : 'active:scale-95'
                }`}
                style={{ color: currentCard === buildCards(selectedCode).length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Card Content */}
              <div className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-4 lg:py-6 pb-3 lg:pb-4">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  {(() => {
                    const cards = buildCards(selectedCode);
                    const card = cards[currentCard];

                    return (
                      <>
                        {/* Title Card */}
                        {card.type === 'title' && (
                          <div className="space-y-6 lg:space-y-8">
                            <h1 className="text-3xl lg:text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                              {(card as any).title}
                            </h1>
                            <div className="h-px w-16 lg:w-20 mx-auto" style={{ backgroundColor: 'var(--card-border)' }}></div>
                            <div className="text-xs lg:text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                              {(card as any).category}
                            </div>
                          </div>
                        )}

                      {/* Section Cards (What, When) */}
                      {card.type === 'section' && (card as any).heading !== 'Why' && (
                        <div className="space-y-6 lg:space-y-8 max-w-md">
                          <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                            {(card as any).heading}
                          </div>
                          <p className="text-xl lg:text-2xl font-medium leading-[1.4]" style={{ color: 'var(--text-primary)' }}>
                            {(card as any).content}
                          </p>
                        </div>
                      )}

                      {/* Why Card */}
                      {card.type === 'section' && (card as any).heading === 'Why' && (
                        <div className="space-y-6 lg:space-y-8 max-w-lg">
                          <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                            {(card as any).heading}
                          </div>
                          <div className="space-y-4 lg:space-y-6">
                            {(card as any).content.split('\n\n').map((paragraph: string, i: number) => (
                              <p key={i} className="text-base lg:text-lg font-medium leading-[1.6]" style={{ color: 'var(--text-primary)' }}>
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step Cards */}
                      {card.type === 'step' && 'stepNumber' in card && (
                        <div className="space-y-6 lg:space-y-8 max-w-lg">
                          <div className="space-y-2 lg:space-y-3">
                            <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                              {(card as any).heading}
                            </div>
                            <div className="text-xs lg:text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                              Step {(card as any).stepNumber} of {(card as any).totalSteps}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 lg:gap-6">
                            <div className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                              <span className="font-bold text-lg lg:text-xl" style={{ color: 'var(--text-primary)' }}>{(card as any).stepNumber}</span>
                            </div>
                            <p className="text-lg lg:text-xl font-medium leading-[1.5] text-left flex-1" style={{ color: 'var(--text-primary)' }}>
                              {(card as any).content}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Phrase Card (Final) */}
                      {card.type === 'phrase' && (
                        <div className="space-y-8 lg:space-y-10 w-full max-w-md">
                          <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                            Your Cheat Code Phrase
                          </div>
                          <div className="space-y-6 lg:space-y-8">
                            <p className="text-2xl lg:text-4xl font-bold leading-[1.2]" style={{ color: 'var(--text-primary)' }}>
                              "{(card as any).content}"
                            </p>
                            <div className="space-y-3 lg:space-y-4 relative">
                              <button
                                onClick={() => {
                                  handleUseCheatCode(selectedCode);
                                }}
                                className="w-full py-4 lg:py-5 rounded-xl font-semibold text-base lg:text-lg transition-all active:scale-95"
                                style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                              >
                                Use Cheat Code
                              </button>

                              <button
                                onClick={() => handleOpenChat(selectedCode)}
                                className="w-full border py-3 lg:py-4 rounded-xl font-medium text-sm lg:text-base transition-colors"
                                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                              >
                                Open Chat
                              </button>

                              <button
                                onClick={resetCards}
                                className="w-full py-3 lg:py-4 rounded-xl font-medium text-sm lg:text-base transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
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

                {/* Footer with Branding */}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="text-[9px] lg:text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    MYCHEATCODE.AI
                  </div>
                </div>
              </div>
            </div>

            {/* Success Animation Overlay */}
            {showSuccess && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm"
                style={{ animation: 'fade-out 0.4s ease-out 1.6s forwards', backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              >
                <div className="flex flex-col items-center gap-4" style={{ animation: 'fade-in-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                    <polyline points="20 6 9 17 4 12" strokeDasharray="100" strokeDashoffset="0"
                      style={{ animation: 'checkmark-draw 0.6s ease-out 0.1s backwards' }} />
                  </svg>
                  <div className="text-center" style={{ animation: 'fade-in-scale 0.4s ease-out 0.2s backwards' }}>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>Added to My Codes!</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {buildCards(selectedCode).map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: index === currentCard ? '2rem' : '0.375rem',
                    backgroundColor: index === currentCard ? '#ffffff' : '#2a2a2a'
                  }}
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
      `}</style>

    </div>
  );
}