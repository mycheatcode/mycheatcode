'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Section } from './utils/progressionSystem';
import { useSectionRadar } from './utils/useSectionRadar';
import SectionProgressModal from '../components/SectionProgressModal';
import { generateShareCard } from './utils/engagementSystem';
import ShareCard, { useShareCard } from '../components/ShareCard';

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
    return getRadarScore();
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

  return (
    <div
      className={`bg-black min-h-screen text-white font-sans page-zoom-container ${isZooming ? 'page-zoom-active' : ''}`}
      style={zoomOrigin ? {
        '--zoom-origin-x': `${zoomOrigin.x}px`,
        '--zoom-origin-y': `${zoomOrigin.y}px`
      } as React.CSSProperties : {}}
      >
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
            YOUR ANALYSIS
          </div>

          {/* Color Legend - Mobile */}
          <div className="flex justify-center mb-0 px-1 -mt-2">
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-3 py-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <span className="text-zinc-400 text-[8px] font-medium">Activated</span>
                </div>
                <div className="flex items-center gap-1 group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  <span className="text-zinc-400 text-[8px] font-medium">Rising</span>
                </div>
                <div className="flex items-center gap-1 group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                  <span className="text-zinc-400 text-[8px] font-medium">Elevated</span>
                </div>
                <div className="flex items-center gap-1 group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-zinc-400 text-[8px] font-medium">Limitless</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center overflow-visible -mt-4 h-[50vh]">
            <svg width="min(320px, 85vw)" height="min(320px, 85vw)" viewBox="0 0 360 320" className="radar-svg radar-svg-mobile" style={{overflow: 'visible'}}>
              <defs></defs>
              <style>
                {`
                  @keyframes pulseExpand1 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.08); opacity: 1; }
                  }

                  @keyframes pulseExpand2 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.07); opacity: 1; }
                  }

                  @keyframes pulseExpand3 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.09); opacity: 1; }
                  }

                  @keyframes pulseExpand4 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.075); opacity: 1; }
                  }

                  @keyframes pulseExpand5 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.085); opacity: 1; }
                  }

                  @keyframes nextBarBlink {
                    0% { opacity: 0.12; }
                    50% { opacity: 0.35; }
                    100% { opacity: 0.12; }
                  }

                  .next-bar-blink {
                    animation: nextBarBlink 3s ease-in-out infinite;
                  }

                  .animate-group-1 {
                    animation: pulseExpand1 7.2s linear infinite;
                    animation-delay: 0s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-2 {
                    animation: pulseExpand2 8.1s linear infinite;
                    animation-delay: 1.2s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-3 {
                    animation: pulseExpand3 6.8s linear infinite;
                    animation-delay: 2.4s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-4 {
                    animation: pulseExpand4 7.9s linear infinite;
                    animation-delay: 3.6s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-5 {
                    animation: pulseExpand5 7.5s linear infinite;
                    animation-delay: 4.8s;
                    transform-origin: 180px 160px;
                  }
                `}
              </style>

              <defs>
                {/* Heat Map Gradients with smooth blending - as specified */}
                <radialGradient id="heatmap100" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="30%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="35%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="50%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="60%" stopColor="#FFFF00" stopOpacity="1"/>
                  <stop offset="75%" stopColor="#FFFF00" stopOpacity="1"/>
                  <stop offset="85%" stopColor="#00FF00" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#00FF00" stopOpacity="1"/>
                </radialGradient>
                <radialGradient id="heatmap75" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="40%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="46.67%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="66.67%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="80%" stopColor="#FFFF00" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#FFFF00" stopOpacity="1"/>
                </radialGradient>
                <radialGradient id="heatmap50" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="60%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="65%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#FFA500" stopOpacity="1"/>
                </radialGradient>
                <radialGradient id="heatmap25" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#FF0000" stopOpacity="1"/>
                </radialGradient>

              </defs>

              <circle cx="180" cy="160" r="125" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="180" cy="160" r="105" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="180" cy="160" r="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="180" cy="160" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="180" cy="160" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>


              {/* Wifi section visualization */}
              {renderWifiSignals(180, 160, false)}




              {/* Center dot */}
              <circle cx="180" cy="160" r="6" fill="rgba(255,255,255,0.8)" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>

              {/* Inner ring on top of everything */}
              <circle cx="180" cy="160" r="25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>

              {/* Section Labels with Green Hold Badges */}
              <g>
                {/* PRE-GAME */}
                <text x="280" y="18" textAnchor="middle" fill="#CCCCCC" fontSize="10" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">PRE-GAME</text>
                {getGreenHold('Pre-Game').hasActiveHold && (
                  <g>
                    <circle cx="315" cy="14" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="315" y="17" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* IN-GAME */}
                <text x="350" y="162" textAnchor="middle" fill="#CCCCCC" fontSize="10" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">IN-GAME</text>
                {getGreenHold('In-Game').hasActiveHold && (
                  <g>
                    <circle cx="380" cy="158" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="380" y="161" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* POST-GAME */}
                <text x="230" y="317" textAnchor="middle" fill="#CCCCCC" fontSize="10" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">POST-GAME</text>
                {getGreenHold('Post-Game').hasActiveHold && (
                  <g>
                    <circle cx="265" cy="313" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="265" y="316" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* OFF-COURT */}
                <text x="6" y="180" textAnchor="middle" fill="#CCCCCC" fontSize="10" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">OFF-COURT</text>
                {getGreenHold('Off Court').hasActiveHold && (
                  <g>
                    <circle cx="45" cy="176" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="45" y="179" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* LOCKER ROOM */}
                <text x="55" y="18" textAnchor="middle" fill="#CCCCCC" fontSize="10" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">LOCKER ROOM</text>
                {getGreenHold('Locker Room').hasActiveHold && (
                  <g>
                    <circle cx="105" cy="14" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="105" y="17" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}
              </g>

              {/* Title underlines and connecting lines */}
              <g stroke="#999" strokeWidth="0.8" fill="none" opacity="0.7">
                {/* PRE-GAME */}
                <line x1="245" y1="26" x2="315" y2="26"/>
                <line x1="245" y1="26" x2="235" y2="37"/>

                {/* IN-GAME */}
                <line x1="325" y1="170" x2="365" y2="170"/>
                <line x1="325" y1="170" x2="307" y2="151"/>

                {/* POST-GAME */}
                <line x1="185" y1="325" x2="255" y2="325"/>
                <line x1="185" y1="325" x2="175" y2="306"/>

                {/* OFF-COURT */}
                <line x1="3" y1="188" x2="33" y2="188"/>
                <line x1="33" y1="188" x2="48" y2="169"/>

                {/* LOCKER ROOM */}
                <line x1="20" y1="26" x2="90" y2="26"/>
                <line x1="90" y1="26" x2="102" y2="37"/>
              </g>

            </svg>
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
              <button onClick={handleCreateCheatCode} className="w-full py-2.5 px-5 mobile-btn rounded-full border-none text-[16px] app-subheading cursor-pointer transition-all duration-200 bg-white text-black hover:bg-gray-100 active:scale-98 text-center relative">
                Create Cheat Code
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-black"></div>
              </button>
              <Link href="/community-topics" className="w-full py-2.5 px-5 mobile-btn rounded-full border border-zinc-700 text-[15px] app-subheading cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-600 active:scale-98 text-center relative">
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
          <div className="absolute left-6 top-24">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 pr-12 backdrop-blur-sm relative">
              <button
                onClick={() => setLegendExpanded(!legendExpanded)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={`transform transition-transform ${legendExpanded ? 'rotate-180' : ''}`}>
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-base font-medium group-hover:text-zinc-300 transition-colors duration-200">Activated</span>
                </div>
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-base font-medium group-hover:text-zinc-300 transition-colors duration-200">Rising</span>
                </div>
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/30 group-hover:shadow-yellow-400/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-base font-medium group-hover:text-zinc-300 transition-colors duration-200">Elevated</span>
                </div>
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-base font-medium group-hover:text-zinc-300 transition-colors duration-200">Limitless</span>
                </div>
              </div>

              {legendExpanded && (
                <div className="space-y-3 border-t border-zinc-800 pt-3 mt-3 max-w-64">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/30 mt-1 flex-shrink-0"></div>
                    <div className="text-xs text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium mb-1">Activated</div>
                      Foundation level - First cheat code created. Building initial mental frameworks and awareness.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30 mt-1 flex-shrink-0"></div>
                    <div className="text-xs text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium mb-1">Rising</div>
                      Development level - Consistent practice building momentum. Skills becoming more natural.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/30 mt-1 flex-shrink-0"></div>
                    <div className="text-xs text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium mb-1">Elevated</div>
                      Advanced level - Peak performance moments frequent. Can access cheat codes under pressure.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/30 mt-1 flex-shrink-0"></div>
                    <div className="text-xs text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium mb-1">Limitless</div>
                      Elite level - Unconscious competence. Cheat codes integrated and automatic in all situations.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center">
            <div className="text-center mb-0 mt-2">
              <div className="text-[32px] app-heading bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-300 bg-clip-text text-transparent mb-0">
                YOUR ANALYSIS
              </div>
            </div>

            <div className="flex items-center justify-center mb-0 overflow-visible -mt-8 h-[60vh]">
            <svg width="min(900px, 85vw)" height="min(900px, 85vw)" viewBox="0 0 480 440" className="radar-svg radar-svg-desktop" style={{overflow: 'visible'}}>
              <defs></defs>
              <style>
                {`
                  @keyframes pulseExpandDesktop1 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.08); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop2 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.07); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop3 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.09); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop4 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.075); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop5 {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.085); opacity: 1; }
                  }

                  .next-bar-blink {
                    animation: nextBarBlink 3s ease-in-out infinite;
                  }

                  .animate-group-desktop-1 {
                    animation: pulseExpandDesktop1 7.2s linear infinite;
                    animation-delay: 0s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-2 {
                    animation: pulseExpandDesktop2 8.1s linear infinite;
                    animation-delay: 1.2s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-3 {
                    animation: pulseExpandDesktop3 6.8s linear infinite;
                    animation-delay: 2.4s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-4 {
                    animation: pulseExpandDesktop4 7.9s linear infinite;
                    animation-delay: 3.6s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-5 {
                    animation: pulseExpandDesktop5 7.5s linear infinite;
                    animation-delay: 4.8s;
                    transform-origin: 240px 220px;
                  }
                `}
              </style>

              <defs>
                <radialGradient id="heatmap100Desktop" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="30%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="35%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="50%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="60%" stopColor="#FFFF00" stopOpacity="1"/>
                  <stop offset="75%" stopColor="#FFFF00" stopOpacity="1"/>
                  <stop offset="85%" stopColor="#00FF00" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#00FF00" stopOpacity="1"/>
                </radialGradient>
                <radialGradient id="heatmap75Desktop" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="40%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="46.67%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="66.67%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="80%" stopColor="#FFFF00" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#FFFF00" stopOpacity="1"/>
                </radialGradient>
                <radialGradient id="heatmap50Desktop" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="60%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="65%" stopColor="#FFA500" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#FFA500" stopOpacity="1"/>
                </radialGradient>
                <radialGradient id="heatmap25Desktop" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#FF0000" stopOpacity="1"/>
                </radialGradient>
              </defs>

              <circle cx="240" cy="220" r="125" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="240" cy="220" r="105" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="240" cy="220" r="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="240" cy="220" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="240" cy="220" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>

              {/* Complete underlying layer - see-through */}

              {/* Wifi section visualization - Desktop */}
              {renderWifiSignals(240, 220, true)}




              {/* Center dot */}
              <circle cx="240" cy="220" r="8" fill="rgba(255,255,255,0.8)" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>

              {/* Desktop Section Labels with Green Hold Badges */}
              <g>
                {/* PRE-GAME */}
                <text x="350" y="78" textAnchor="middle" fill="#CCCCCC" fontSize="12" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">PRE-GAME</text>
                {getGreenHold('Pre-Game').hasActiveHold && (
                  <g>
                    <circle cx="395" cy="74" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="395" y="78" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* IN-GAME */}
                <text x="410" y="222" textAnchor="middle" fill="#CCCCCC" fontSize="12" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">IN-GAME</text>
                {getGreenHold('In-Game').hasActiveHold && (
                  <g>
                    <circle cx="445" cy="218" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="445" y="222" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* POST-GAME */}
                <text x="300" y="382" textAnchor="middle" fill="#CCCCCC" fontSize="12" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">POST-GAME</text>
                {getGreenHold('Post-Game').hasActiveHold && (
                  <g>
                    <circle cx="345" cy="378" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="345" y="382" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* OFF-COURT */}
                <text x="62" y="240" textAnchor="middle" fill="#CCCCCC" fontSize="12" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">OFF-COURT</text>
                {getGreenHold('Off Court').hasActiveHold && (
                  <g>
                    <circle cx="25" cy="236" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="25" y="240" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* LOCKER ROOM */}
                <text x="105" y="78" textAnchor="middle" fill="#CCCCCC" fontSize="12" fontFamily="var(--font-dm-sans)" fontWeight="600" letterSpacing="2px">LOCKER ROOM</text>
                {getGreenHold('Locker Room').hasActiveHold && (
                  <g>
                    <circle cx="170" cy="74" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="170" y="78" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}
              </g>

              {/* Title underlines and connecting lines */}
              <g stroke="#999" strokeWidth="0.8" fill="none" opacity="0.7">
                {/* PRE-GAME */}
                <line x1="310" y1="86" x2="390" y2="86"/>
                <line x1="310" y1="86" x2="300" y2="97"/>

                {/* IN-GAME */}
                <line x1="380" y1="230" x2="430" y2="230"/>
                <line x1="380" y1="230" x2="362" y2="211"/>

                {/* POST-GAME */}
                <line x1="250" y1="390" x2="330" y2="390"/>
                <line x1="250" y1="390" x2="240" y2="371"/>

                {/* OFF-COURT */}
                <line x1="50" y1="248" x2="106" y2="248"/>
                <line x1="106" y1="248" x2="118" y2="229"/>

                {/* LOCKER ROOM */}
                <line x1="60" y1="86" x2="150" y2="86"/>
                <line x1="150" y1="86" x2="162" y2="97"/>
              </g>

            </svg>
          </div>

          <div className="text-center mb-5 -mt-3">
            {!isLoading && radarState && (
              <>
                <div className="text-[16px] mb-2 app-body">Your overall progression: <span className="text-[28px] font-bold app-heading text-white">{calculateOverallPercentage()}%</span></div>
                <div className="text-zinc-400 text-[14px] leading-6 max-w-[350px] mx-auto mb-3">
                  Every elite player started exactly where you are now. Build cheat codes for each area to reach full power.
                </div>
              </>
            )}
            {(isLoading || !radarState) && (
              <>
                <div className="text-[16px] mb-2 app-body">
                  Loading your progression...
                </div>
                <div className="text-zinc-400 text-[14px] leading-6 max-w-[350px] mx-auto mb-3">
                  Every elite player started exactly where you are now. Build cheat codes for each area to reach full power.
                </div>
              </>
            )}
          </div>

          <div className="space-y-2 w-full max-w-2xl pb-8">
            <button onClick={handleCreateCheatCode} className="w-full py-3 px-6 rounded-full border-none text-[18px] app-subheading cursor-pointer transition-all duration-200 bg-white text-black hover:bg-gray-100 active:scale-98 text-center relative">
              Create Cheat Code
              <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-black"></div>
            </button>
            <Link href="/community-topics" className="w-full py-3 px-6 rounded-full border border-zinc-700 text-[16px] app-subheading cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-800 hover:border-zinc-600 active:scale-98 text-center block relative">
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
    </div>
  );
}
