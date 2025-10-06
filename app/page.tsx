'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Section } from './utils/progressionSystem';
import { useSectionRadar } from './utils/useSectionRadar';
import SectionProgressModal from '../components/SectionProgressModal';
import { generateShareCard } from './utils/engagementSystem';
import ShareCard, { useShareCard } from '../components/ShareCard';
import StarProgressVisual from '../components/StarProgressVisual';
import ProgressLegend from '../components/ProgressLegend';
import OverallProgressCircle from '../components/OverallProgressCircle';
import StreakDisplay from '../components/StreakDisplay';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [clickedSection, setClickedSection] = useState<string | null>(null);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<{x: number, y: number} | null>(null);
  const [showProgressModal, setShowProgressModal] = useState<Section | null>(null);
  const router = useRouter();

  const { radarState, isLoading, getSectionScore, getRadarScore, getSectionColor, getSectionColorAsHex, getRadarStats, getGreenHold } = useSectionRadar();
  const { activeCard, showShareCard, dismissShareCard } = useShareCard();// Safely read any saved progression snapshot from localStorage
const rawUserProg =
  typeof window !== 'undefined' ? localStorage.getItem('userProgression') : null;
const userProgression = rawUserProg ? JSON.parse(rawUserProg) : null;

  // Get section progression info for radar visualization (now based on section radar system)
  const getSectionProgressInfo = (sectionName: string) => {
    const sectionScore = getSectionScore(sectionName as Section);

    if (!sectionScore) {
      return { color: 'red', totalLogs: 0, uniqueCount: 0, powerPercentage: 0 };
    }

    return {
      color: sectionScore.color,
      totalLogs: sectionScore.totalValidLogs,
      uniqueCount: sectionScore.uniqueCodesUsed,
      powerPercentage: sectionScore.score
    };
  };

  // Render progression rings for a section (now based on cheat code power)
  // Radar chart mathematical constants
  const CATEGORIES = ["Pre-Game", "In-Game", "Post-Game", "Off Court", "Locker Room"];
  const N = CATEGORIES.length; // 5
  const ANGLE_STEP = (2 * Math.PI) / N; // 72° in radians
  const START_ANGLE = -Math.PI / 2; // 12 o'clock (top)


  // Calculate angle for category index
  const getAngle = (i: number) => START_ANGLE + i * ANGLE_STEP;

  // Calculate coordinates for given angle and radius
  const getCoordinates = (centerX: number, centerY: number, angle: number, radius: number) => ({
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  });

  // Generate SVG path for equal wedge sectors
  const createWedgePath = (centerX: number, centerY: number, maxRadius: number, startAngle: number, endAngle: number) => {
    const start = getCoordinates(centerX, centerY, startAngle, maxRadius);
    const end = getCoordinates(centerX, centerY, endAngle, maxRadius);
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

    return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${maxRadius} ${maxRadius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };


  const renderWifiSignals = (centerX: number, centerY: number, isDesktop: boolean) => {
    const sections = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
    const gradientSuffix = isDesktop ? 'Desktop' : '';

    return sections.map((sectionName, sectionIndex) => {
      const progress = getSectionProgressInfo(sectionName);
      const { powerPercentage } = progress;

      // Calculate the angle for this section
      const sectionAngle = getAngle(sectionIndex) + ANGLE_STEP / 2; // Center of section
      const arcSpan = Math.PI / 3; // 60 degrees span for wider wifi signal

      // Classic wifi signal arcs - original traffic light colors
      const signals = [
        { radius: 38, level: 25, color: '#ff0000', strokeWidth: 14, name: 'red' },
        { radius: 58, level: 50, color: '#ff8c00', strokeWidth: 14, name: 'orange' },
        { radius: 78, level: 75, color: '#ffd700', strokeWidth: 14, name: 'yellow' },
        { radius: 98, level: 100, color: '#00ff00', strokeWidth: 14, name: 'green' }
      ];

      return (
        <g key={`wifi-${sectionIndex}`} className={isDesktop ? `animate-group-desktop-${sectionIndex + 1}` : `animate-group-${sectionIndex + 1}`}>
          {/* Transparent underlying layer showing full potential */}
          {signals.map((signal, signalIndex) => {
            const startAngle = sectionAngle - arcSpan / 2;
            const endAngle = sectionAngle + arcSpan / 2;

            const x1 = centerX + Math.cos(startAngle) * signal.radius;
            const y1 = centerY + Math.sin(startAngle) * signal.radius;
            const x2 = centerX + Math.cos(endAngle) * signal.radius;
            const y2 = centerY + Math.sin(endAngle) * signal.radius;

            const arcPath = `M ${x1} ${y1} A ${signal.radius} ${signal.radius} 0 0 1 ${x2} ${y2}`;

            return (
              <path
                key={`potential-${signalIndex}`}
                d={arcPath}
                fill="none"
                stroke={signal.color}
                strokeWidth={signal.strokeWidth}
strokeLinecap="round"
                style={{
                  opacity: 0.08
                }}
              />
            );
          })}

          {/* Center dot for wifi source */}
          <circle
            cx={centerX + Math.cos(sectionAngle) * 15}
            cy={centerY + Math.sin(sectionAngle) * 15}
            r="3"
            fill={powerPercentage > 0 ? (() => {
              // Original traffic light color progression
              if (powerPercentage >= 100) return '#00ff00';
              if (powerPercentage >= 75) return '#ffd700';
              if (powerPercentage >= 50) return '#ff8c00';
              if (powerPercentage >= 25) return '#ff0000';
              return '#ff0000'; // Default red for any progress
            })() : "rgba(255,255,255,0.2)"}
          />

          {signals.map((signal, signalIndex) => {
            const isActive = powerPercentage >= signal.level;
            const isNextBar = !isActive && (signalIndex === 0 || powerPercentage >= signals[signalIndex - 1].level);
            const startAngle = sectionAngle - arcSpan / 2;
            const endAngle = sectionAngle + arcSpan / 2;

            // Calculate arc path for solid wifi arc
            const x1 = centerX + Math.cos(startAngle) * signal.radius;
            const y1 = centerY + Math.sin(startAngle) * signal.radius;
            const x2 = centerX + Math.cos(endAngle) * signal.radius;
            const y2 = centerY + Math.sin(endAngle) * signal.radius;

            const arcPath = `M ${x1} ${y1} A ${signal.radius} ${signal.radius} 0 0 1 ${x2} ${y2}`;

            return (
              <g key={`signal-${signalIndex}`}>
                {/* Active signal arc - premium gradients */}
                {isActive && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={signal.color}
                    strokeWidth={signal.strokeWidth}
                    strokeLinecap="round"
                    style={{
                      opacity: 1
                    }}
                  />
                )}

                {/* Next bar blinking effect */}
                {isNextBar && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={signal.color}
                    strokeWidth={signal.strokeWidth}
    strokeLinecap="round"
                    className="next-bar-blink"
                    style={{
                    }}
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    });
  };

  const renderProgressionRings = (sectionName: string, centerX: number, centerY: number, sectionIndex: number, animateClass: string, isDesktop: boolean) => {
    // This function is now deprecated in favor of renderGoalRings
    return null;
  };

  // Generate equally spaced divider lines (spokes)
  const renderSpokes = (centerX: number, centerY: number, maxRadius: number) => {
    return CATEGORIES.map((_, i) => {
      const angle = getAngle(i);
      const end = getCoordinates(centerX, centerY, angle, maxRadius);

      return (
        <line
          key={i}
          x1={centerX}
          y1={centerY}
          x2={end.x}
          y2={end.y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      );
    });
  };

  // Generate clickable wedge sections
  const renderClickableWedges = (centerX: number, centerY: number, maxRadius: number) => {
    return CATEGORIES.map((category, i) => {
      const startAngle = getAngle(i);
      const endAngle = startAngle + ANGLE_STEP;
      const wedgePath = createWedgePath(centerX, centerY, maxRadius, startAngle, endAngle);

      return (
        <g key={i}>
          <path
            d={wedgePath}
            fill="transparent"
            className="radar-section"
            onClick={(e) => handleSectionClick(category, e)}
          />
        </g>
      );
    });
  };

  // Add incremental logs for testing progression
  const [testStep, setTestStep] = useState(0);

  // Reset progression to clean state
  const resetProgression = () => {
    // Clear all localStorage keys that might contain progression data
    localStorage.removeItem('userProgression');
    localStorage.removeItem('selectedCategory');
    localStorage.removeItem('chatReferrer');

    // Reset test step
    setTestStep(0);

    // Force a hard reload to ensure clean state
    window.location.reload();
  };

  // Debug function to check current state (safe)
const debugProgression = () => {
  console.log('Current progression:', userProgression);
  console.log('Overall percentage:', calculateOverallPercentage?.());
  console.log('LocalStorage userProgression:', localStorage.getItem('userProgression'));

  if (userProgression?.sections) {
    Object.entries(userProgression.sections).forEach(([section, data]: any) => {
      console.log(`${section}:`, {
        color: data.color,
        totalLogs: data.totalLogs,
        uniqueCodes: data?.uniqueCheatCodes?.size ?? '(n/a)',
      });
    });
  }
};

  // Calculate overall percentage based on section radar system
  const calculateOverallPercentage = () => {
    // For demo purposes, always show 81% when star progress is at 100%
    const starData = getStarProgressData();
    const average = (starData.preGame + starData.inGame + starData.postGame + starData.offCourt + starData.lockerRoom) / 5;
    if (average === 100) {
      return 81;
    }

    const radarScore = getRadarScore();
    if (radarScore > 0) {
      return radarScore;
    }

    return Math.round(average);
  };

  // Get level based on percentage
  const getProgressLevel = (percentage: number) => {
    if (percentage >= 75) return 'HALL OF FAME';
    if (percentage >= 50) return 'ALL-STAR';
    if (percentage >= 25) return 'ROOKIE';
    return 'BEGINNER';
  };

  const handleCreateCheatCode = () => {
    // Clear any stored topic data to start a blank chat
    localStorage.removeItem('selectedTopic');
    // Store where the user came from for proper back navigation
    localStorage.setItem('chatReferrer', '/');
    // Navigate to blank chat
    router.push('/chat');
  };

  const handleShare = () => {
  if (!radarState) return;

  // Collect Green Hold durations for display
  const greenHoldData: Record<string, number> = {};

  Object.keys(radarState.sectionScores).forEach((section) => {
    const sectionScore = radarState.sectionScores[section as Section];
    if (sectionScore?.color === 'green') {
      const gh = getGreenHold(section as Section);
      if (gh?.hasActiveHold) {
        greenHoldData[section] = gh.currentDuration; // minutes or days depending on your hook
      }
    }
  });

  const shareCard = generateShareCard('radar_snapshot', {
    title: `${Math.round(radarState.radarScore)}% Mental Performance`,
    subtitle: 'Locked in.',
    radarData: {
      preGame: radarState.sectionScores['Pre-Game']?.score || 0,
      preGameColor: radarState.sectionScores['Pre-Game']?.color || 'red',
      inGame: radarState.sectionScores['In-Game']?.score || 0,
      inGameColor: radarState.sectionScores['In-Game']?.color || 'red',
      postGame: radarState.sectionScores['Post-Game']?.score || 0,
      postGameColor: radarState.sectionScores['Post-Game']?.color || 'red',
      offCourt: radarState.sectionScores['Off Court']?.score || 0,
      offCourtColor: radarState.sectionScores['Off Court']?.color || 'red',
      lockerRoom: radarState.sectionScores['Locker Room']?.score || 0,
      lockerRoomColor: radarState.sectionScores['Locker Room']?.color || 'red',
    },
    greenHoldData,
  });

    showShareCard(shareCard);
  };

  const getSectionCenter = (category: string) => {
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      // Mobile radar center is at 180px, 160px in SVG coordinates
      const radarSvg = document.querySelector('.radar-svg-mobile');
      if (!radarSvg) return { x: 0, y: 0 };

      const svgRect = radarSvg.getBoundingClientRect();
      const radarCenterX = svgRect.left + (180 / 360) * svgRect.width;
      const radarCenterY = svgRect.top + (160 / 320) * svgRect.height;

      // Both Pre-Game and In-Game need to zoom higher - make angles more negative
      const sectionAngles = {
        'Pre-Game': -54,       // Move higher up (more negative)
        'In-Game': 18,         // Move higher up (less positive, closer to 0°)
        'Post-Game': 90,       // Working - don't change
        'Off Court': 180,      // Working - don't change
        'Locker Room': -126    // Working - don't change
      };

      const angle = (sectionAngles[category as keyof typeof sectionAngles] * Math.PI) / 180;
      const radius = 50; // Distance from center for section centers

      return {
        x: radarCenterX + Math.cos(angle) * radius,
        y: radarCenterY + Math.sin(angle) * radius
      };
    } else {
      // Desktop radar center is at 240px, 220px in SVG coordinates
      const radarSvg = document.querySelector('.radar-svg-desktop');
      if (!radarSvg) return { x: 0, y: 0 };

      const svgRect = radarSvg.getBoundingClientRect();
      const radarCenterX = svgRect.left + (240 / 480) * svgRect.width;
      const radarCenterY = svgRect.top + (220 / 440) * svgRect.height;

      const sectionAngles = {
        'Pre-Game': -54,       // Move higher up (more negative)
        'In-Game': 18,         // Move higher up (less positive, closer to 0°)
        'Post-Game': 90,       // Working - don't change
        'Off Court': 180,      // Working - don't change
        'Locker Room': -126    // Working - don't change
      };

      const angle = (sectionAngles[category as keyof typeof sectionAngles] * Math.PI) / 180;
      const radius = 70; // Distance from center for section centers

      return {
        x: radarCenterX + Math.cos(angle) * radius,
        y: radarCenterY + Math.sin(angle) * radius
      };
    }
  };

  const handleSectionClick = (category: string, event: React.MouseEvent) => {
    // Show progress modal instead of navigating immediately
    setShowProgressModal(category as Section);
  };

  const getStarProgressData = () => {
    if (!radarState) {
      return {
        preGame: 100,
        inGame: 100,
        postGame: 100,
        offCourt: 100,
        lockerRoom: 100
      };
    }

    const sectionScores = radarState.sectionScores;
    return {
      preGame: sectionScores['Pre-Game']?.score || 100,
      inGame: sectionScores['In-Game']?.score || 100,
      postGame: sectionScores['Post-Game']?.score || 100,
      offCourt: sectionScores['Off Court']?.score || 100,
      lockerRoom: sectionScores['Locker Room']?.score || 100
    };
  };

  const handleStarSectionClick = (sectionIndex: number) => {
    const sections: Section[] = ['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'];
    const section = sections[sectionIndex];
    if (section) {
      setShowProgressModal(section);
    }
  };

  return (
    <div
      className={`bg-black min-h-screen text-white font-sans page-zoom-container starfield-background ${isZooming ? 'page-zoom-active' : ''}`}
      style={zoomOrigin ? {
        '--zoom-origin-x': `${zoomOrigin.x}px`,
        '--zoom-origin-y': `${zoomOrigin.y}px`
      } as React.CSSProperties : {}}
      >
      {/* Starfield Background */}
      <div className="starfield-container">
        <div className="stars stars-small"></div>
        <div className="stars stars-medium"></div>
        <div className="stars stars-large"></div>
        <div className="stars stars-twinkle"></div>
      </div>
      {/* Mobile Design */}
      <div className="lg:hidden bg-black h-screen h-[100dvh] relative flex flex-col overflow-y-auto">
        {/* Mobile Header with Menu */}
        <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-center gap-4 z-20 bg-gradient-to-b from-black/90 to-transparent">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar Navigation */}
        <div className={`absolute top-0 left-0 h-full w-64 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="pt-16"></div>
          <nav className="flex-1">
            <div>
              <Link href="/" className="flex items-center gap-3 p-4 text-white font-medium relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
              <Link href="/my-codes" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
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

        {/* Mobile Overlay when menu is open */}
        {menuOpen && (
          <div
            className="absolute inset-0 bg-black bg-opacity-60 z-20"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        <div className="flex-1 flex flex-col px-4 pt-16 overflow-visible min-h-0">
          <div className="text-center mb-0 text-[18px] app-heading bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-300 bg-clip-text text-transparent">
            Back at it, Hunter
          </div>

          {/* Progress Legend - Mobile */}
          <div className="flex justify-center mb-0 px-1 -mt-2">
            <ProgressLegend
              darkMode={true}
              size={180}
              itemHeight={50}
              expanded={legendExpanded}
              onToggle={() => setLegendExpanded(!legendExpanded)}
              isMobile={true}
            />
          </div>

          <div className="flex items-center justify-center mb-6">
            <StarProgressVisual
              progressData={getStarProgressData()}
              size={400}
              onClick={handleStarSectionClick}
              className=""
            />
          </div>

          <div className="mt-3 mb-4">
            <div className="text-white text-center app-body mb-2">
              {!isLoading && radarState && (
                <>
                  <div className="text-[12px] mb-1 app-body">Your overall progression: <span className="text-[16px] mobile-progress-percent font-bold app-heading text-white">{calculateOverallPercentage()}%</span></div>
                </>
              )}
              {(isLoading || !radarState) && (
                <>
                  <div className="text-[12px] app-body">Loading your progression...</div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pb-8">
              <button onClick={handleCreateCheatCode} className="w-full py-4 px-6 mobile-btn rounded-2xl border-none text-[18px] app-subheading cursor-pointer transition-all duration-200 bg-white text-black hover:bg-gray-100 active:scale-98 text-center relative">
                Start New Chat
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-black"></div>
              </button>
              <Link href="/community-topics" className="w-full py-4 px-6 mobile-btn rounded-2xl border border-zinc-700 text-[17px] app-subheading cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-600 active:scale-98 text-center relative">
                View Community Topics
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-white/30"></div>
              </Link>
              <button onClick={handleShare} className="w-full py-2 px-0 text-[14px] font-medium cursor-pointer transition-all duration-200 bg-transparent text-zinc-400 hover:text-white active:scale-98 text-center">
                Share
              </button>
            </div>
          </div>
        </div>


        {/* Section Progress Modal */}
        {showProgressModal && (
          <SectionProgressModal
            section={showProgressModal}
            onClose={() => setShowProgressModal(null)}
          />
        )}

      </div>

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header with Menu Button */}
        <div className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center gap-4 z-20 bg-gradient-to-b from-black/90 to-transparent">
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
        <div className={`absolute top-0 left-0 h-full w-64 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="pt-20"></div>

          <nav className="flex-1">
            <div>
              <div className="flex items-center gap-3 p-4 text-white font-medium relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </div>
              <Link href="/my-codes" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
                <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
              </Link>
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
            className="absolute inset-0 bg-black bg-opacity-60 z-5"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex p-6 pt-20 min-h-screen relative">
          {/* Left Legend */}
          <div className="absolute left-2 top-24 z-10">
            <ProgressLegend
              darkMode={true}
              size={220}
              expanded={legendExpanded}
              onToggle={() => setLegendExpanded(!legendExpanded)}
              currentPercentage={calculateOverallPercentage()}
            />
          </div>

          {/* 8 DAY STREAK - positioned outside star */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ marginTop: '-340px', marginLeft: '-380px' }}>
            <StreakDisplay
              streakDays={5}
              size={150}
            />
          </div>

          {/* 60% Progress Circle - positioned outside star */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ marginTop: '-80px', marginLeft: '-540px' }}>
            <OverallProgressCircle
              percentage={calculateOverallPercentage()}
              level={getProgressLevel(calculateOverallPercentage())}
              size={280}
            />
            {/* Motivational text under OVR visual */}
            <div className="text-center mt-4 max-w-[380px] mx-auto">
              <div className="text-zinc-400 text-sm leading-5">
                Every elite player started exactly where you are now. Build cheat codes for each area to reach full power.
              </div>
            </div>
          </div>

          {/* Today For You Sidebar */}
          <div className="absolute right-6 top-24 z-10 w-96">
            <div className="today-for-you-section bg-black/85 rounded-2xl p-6 backdrop-blur-sm" style={{border: '1px solid rgba(50, 205, 50, 0.3)', boxShadow: '0 0 30px rgba(50, 205, 50, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)'}}>
              <h3 className="text-white text-xl font-bold mb-6 tracking-wide">TODAY FOR YOU</h3>

              {/* Quick Action Cards */}
              <div className="space-y-4">
                {/* Community Topic Card 1 - Enhanced but cleaner */}
                <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-white/25 group relative overflow-hidden">
                  {/* Subtle gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex-1">
                      <div className="text-white text-lg font-semibold mb-2 leading-tight pr-4 group-hover:text-yellow-100 transition-colors">
                        "I get nervous at the free throw line when everyone's watching"
                      </div>
                      <div className="text-zinc-400 text-sm uppercase tracking-wide">
                        PRE-GAME
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-md border border-yellow-500/30">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 text-xs font-bold">HOT</span>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="text-zinc-400 text-sm mb-3 leading-relaxed relative z-10">
                    When all eyes are on you and your heart starts racing
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3 relative z-10">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <span>247 players worked through this</span>
                  </div>

                  {/* Start Now Button */}
                  <div className="flex justify-end relative z-10">
                    <button className="border border-zinc-700 bg-transparent text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-900 hover:border-zinc-600 transition-colors flex items-center gap-2">
                      Start Now
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Community Topic Card 2 - Enhanced but cleaner */}
                <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-white/25 group relative overflow-hidden">
                  {/* Subtle gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex-1">
                      <div className="text-white text-lg font-semibold mb-2 leading-tight pr-4 group-hover:text-green-100 transition-colors">
                        "I feel like I'm not improving fast enough"
                      </div>
                      <div className="text-zinc-400 text-sm uppercase tracking-wide">
                        OFF COURT
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-md border border-green-500/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-xs font-bold">TRENDING</span>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="text-zinc-400 text-sm mb-3 leading-relaxed relative z-10">
                    Impatience with your development
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3 relative z-10">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <span>198 players trusted the process</span>
                  </div>

                  {/* Start Now Button */}
                  <div className="flex justify-end relative z-10">
                    <button className="border border-zinc-700 bg-transparent text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-900 hover:border-zinc-600 transition-colors flex items-center gap-2">
                      Start Now
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-0">
              <div className="text-[40px] app-heading text-white mb-0">
                Back at it, Hunter
              </div>
            </div>

            <div className="flex items-center justify-center">
            <StarProgressVisual
              progressData={getStarProgressData()}
              size={750}
              onClick={handleStarSectionClick}
              className=""
            />
            </div>

            <div className="text-center mb-4 -mt-12">
            {!isLoading && radarState && (
              <>
                <div className="text-zinc-400 text-[22px] leading-6 max-w-[420px] mx-auto mb-4">
                  Start a fresh chat or choose from topics<br />other players levelled up in.
                </div>
              </>
            )}
            {(isLoading || !radarState) && (
              <>
                <div className="text-[16px] mb-2 app-body">
                  Loading your progression...
                </div>
                <div className="text-zinc-400 text-[14px] leading-6 max-w-[350px] mx-auto mb-4">
                  Every elite player started exactly where you are now. Build cheat codes for each area to reach full power.
                </div>
              </>
            )}
            </div>

            <div className="space-y-2 w-full max-w-2xl">
              <button onClick={handleCreateCheatCode} className="w-full py-4 px-8 rounded-2xl border-none text-[20px] app-subheading cursor-pointer transition-all duration-200 bg-white text-black hover:bg-gray-100 active:scale-98 text-center relative">
                Start New Chat
                <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-black"></div>
              </button>
              <Link href="/community-topics" className="w-full py-4 px-8 rounded-2xl border border-zinc-700 text-[18px] app-subheading cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-800 hover:border-zinc-600 active:scale-98 text-center block relative">
                View Community Topics
                <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-white/30"></div>
              </Link>
              <button onClick={handleShare} className="w-full py-2 px-0 text-[14px] font-medium cursor-pointer transition-all duration-200 bg-transparent text-zinc-400 hover:text-white active:scale-98 text-center">
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Card Modal */}
      {activeCard && (
        <ShareCard
          data={activeCard}
          onDismiss={dismissShareCard}
        />
      )}

      {/* CSS Styles */}
      <style jsx global>{`
        /* Starfield Background */
        .starfield-background {
          position: relative;
          overflow: hidden;
        }

        .starfield-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }

        .stars-small {
          background:
            radial-gradient(circle at 25% 75%, #ffffff 0.8px, transparent 0.8px),
            radial-gradient(circle at 75% 25%, #87ceeb 0.8px, transparent 0.8px),
            radial-gradient(circle at 15% 45%, #ffffff 0.8px, transparent 0.8px);
          background-size: 350px 350px, 400px 400px, 320px 320px;
          animation: gentle-twinkle 20s ease-in-out infinite alternate;
          opacity: 0.4;
        }

        .stars-medium {
          background:
            radial-gradient(circle at 40% 60%, #ffffff 1.2px, transparent 1.2px),
            radial-gradient(circle at 80% 30%, #ffd700 1.2px, transparent 1.2px);
          background-size: 500px 500px, 450px 450px;
          animation: gentle-twinkle 28s ease-in-out infinite alternate-reverse;
          opacity: 0.3;
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
          opacity: 0.4;
        }


        @keyframes gentle-twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 0.5; }
          100% { opacity: 0.3; }
        }

        @keyframes bright-twinkle {
          0% { opacity: 0.1; }
          25% { opacity: 0.25; }
          50% { opacity: 0.4; }
          75% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }

        @keyframes star-sparkle {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
        }


        .today-for-you-section {
          transition: all 0.3s ease;
          position: relative;
          z-index: 10;
        }
        .today-for-you-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 35px rgba(50, 205, 50, 0.25), 0 12px 40px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
    </div>
  );
}
