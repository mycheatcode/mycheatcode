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
  const renderProgressionRings = (sectionName: string, centerX: number, centerY: number, mask: string, animateClass: string, isDesktop: boolean) => {
    const progress = getSectionProgressInfo(sectionName);
    const { color, powerPercentage } = progress;

    const gradientSuffix = isDesktop ? 'Desktop' : '';

    return (
      <g mask={`url(#${mask})`} className={animateClass}>
        {/* Base red ring - always present */}
        <circle cx={centerX} cy={centerY} r="35" fill={`url(#heatmap25${gradientSuffix})`}/>

        {/* Orange ring - appears at 25% average power */}
        {powerPercentage >= 25 && (
          <circle cx={centerX} cy={centerY} r="55" fill={`url(#heatmap50${gradientSuffix})`}/>
        )}

        {/* Yellow ring - appears at 50% average power */}
        {powerPercentage >= 50 && (
          <circle cx={centerX} cy={centerY} r="75" fill={`url(#heatmap75${gradientSuffix})`}/>
        )}

        {/* Green ring - appears at 75% average power */}
        {powerPercentage >= 75 && (
          <circle cx={centerX} cy={centerY} r="95" fill={`url(#heatmap100${gradientSuffix})`}/>
        )}

        {/* Growth potential ring - shows next level target */}
        {(() => {
          let targetRadius = 55; // Default to Orange target
          let targetColor = 'rgba(255, 165, 0, 0.4)'; // Orange

          if (powerPercentage >= 75) {
            // Already at Green - no growth ring
            return null;
          } else if (powerPercentage >= 50) {
            // At Yellow, show Green target
            targetRadius = 95;
            targetColor = 'rgba(0, 255, 0, 0.4)';
          } else if (powerPercentage >= 25) {
            // At Orange, show Yellow target
            targetRadius = 75;
            targetColor = 'rgba(255, 255, 0, 0.4)';
          } else {
            // At Red, show Orange target
            targetRadius = 55;
            targetColor = 'rgba(255, 165, 0, 0.4)';
          }

          return (
            <circle
              cx={centerX}
              cy={centerY}
              r={targetRadius}
              fill="none"
              stroke={targetColor}
              strokeWidth="2"
              strokeDasharray="8,4"
            />
          );
        })()}
      </g>
    );
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
      if (gh && gh.hasActiveHold) {
        greenHoldData[section] = gh.currentDuration; // minutes or days per your hook
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
      <div className="lg:hidden bg-black min-h-screen relative pb-[90px] flex flex-col">
        <div className="p-4 text-center border-b border-zinc-800 flex-shrink-0">
          <div className="text-white text-lg font-semibold">mycheatcode.ai</div>
        </div>

        <div className="flex-1 flex flex-col p-4 pt-8 overflow-visible">
          <div className="text-center mt-2 mb-6 text-[24px] font-semibold tracking-[3px] uppercase bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-300 bg-clip-text text-transparent">
            Your Analysis
          </div>

          {/* Color Legend - Mobile */}
          <div className="flex justify-center mb-6 px-1 relative">
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-md shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-[10px] font-medium group-hover:text-zinc-300 transition-colors duration-200 whitespace-nowrap">Activated</span>
                </div>
                <div className="flex items-center gap-1.5 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-md shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-[10px] font-medium group-hover:text-zinc-300 transition-colors duration-200 whitespace-nowrap">Rising</span>
                </div>
                <div className="flex items-center gap-1.5 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-md shadow-yellow-400/30 group-hover:shadow-yellow-400/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-[10px] font-medium group-hover:text-zinc-300 transition-colors duration-200 whitespace-nowrap">Elevated</span>
                </div>
                <div className="flex items-center gap-1.5 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-md shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-[10px] font-medium group-hover:text-zinc-300 transition-colors duration-200 whitespace-nowrap">Limitless</span>
                </div>
                <button
                  onClick={() => setLegendExpanded(!legendExpanded)}
                  className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={`transform transition-transform ${legendExpanded ? 'rotate-45' : ''}`}>
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {legendExpanded && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-zinc-900/90 border border-zinc-800/60 rounded-2xl px-3 py-3 backdrop-blur-md shadow-xl max-w-[90vw]">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/30 mt-1 flex-shrink-0"></div>
                    <div className="text-[9px] text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium">Activated</div>
                      Foundation level - First cheat code created. Building initial mental frameworks and awareness.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30 mt-1 flex-shrink-0"></div>
                    <div className="text-[9px] text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium">Rising</div>
                      Development level - Consistent practice building momentum. Skills becoming more natural.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/30 mt-1 flex-shrink-0"></div>
                    <div className="text-[9px] text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium">Elevated</div>
                      Advanced level - Peak performance moments frequent. Can access cheat codes under pressure.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/30 mt-1 flex-shrink-0"></div>
                    <div className="text-[9px] text-zinc-400 leading-tight">
                      <div className="text-zinc-300 font-medium">Limitless</div>
                      Elite level - Unconscious competence. Cheat codes integrated and automatic in all situations.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center overflow-visible">
            <svg width="min(340px, 85vw)" height="min(340px, 85vw)" viewBox="0 0 360 320" className="radar-svg radar-svg-mobile" style={{overflow: 'visible', filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.1)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.05))'}}>
              <style>
                {`
                  @keyframes pulseExpand1 {
                    0%, 85%, 100% { transform: scale(1); opacity: 1; }
                    25% { transform: scale(1.12); opacity: 1; }
                  }

                  @keyframes pulseExpand2 {
                    0%, 70%, 100% { transform: scale(1); opacity: 1; }
                    35% { transform: scale(1.08); opacity: 1; }
                  }

                  @keyframes pulseExpand3 {
                    0%, 90%, 100% { transform: scale(1); opacity: 1; }
                    15% { transform: scale(1.15); opacity: 1; }
                  }

                  @keyframes pulseExpand4 {
                    0%, 75%, 100% { transform: scale(1); opacity: 1; }
                    45% { transform: scale(1.1); opacity: 1; }
                  }

                  @keyframes pulseExpand5 {
                    0%, 80%, 100% { transform: scale(1); opacity: 1; }
                    30% { transform: scale(1.13); opacity: 1; }
                  }

                  .animate-group-1 {
                    animation: pulseExpand1 7.2s ease-in-out infinite;
                    animation-delay: 0.3s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-2 {
                    animation: pulseExpand2 8.1s ease-in-out infinite;
                    animation-delay: 2.7s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-3 {
                    animation: pulseExpand3 6.8s ease-in-out infinite;
                    animation-delay: 5.1s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-4 {
                    animation: pulseExpand4 7.9s ease-in-out infinite;
                    animation-delay: 1.8s;
                    transform-origin: 180px 160px;
                  }

                  .animate-group-5 {
                    animation: pulseExpand5 7.5s ease-in-out infinite;
                    animation-delay: 4.2s;
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

                <mask id="mask1">
                  <path d="M 180 160 L 180 35 A 125 125 0 0 1 288.3 95.1 Z" fill="white"/>
                </mask>
                <mask id="mask2">
                  <path d="M 180 160 L 288.3 95.1 A 125 125 0 0 1 258.3 247.4 Z" fill="white"/>
                </mask>
                <mask id="mask3">
                  <path d="M 180 160 L 258.3 247.4 A 125 125 0 0 1 101.7 247.4 Z" fill="white"/>
                </mask>
                <mask id="mask4">
                  <path d="M 180 160 L 101.7 247.4 A 125 125 0 0 1 71.7 95.1 Z" fill="white"/>
                </mask>
                <mask id="mask5">
                  <path d="M 180 160 L 71.7 95.1 A 125 125 0 0 1 180 35 Z" fill="white"/>
                </mask>
              </defs>

              <circle cx="180" cy="160" r="125" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <circle cx="180" cy="160" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <circle cx="180" cy="160" r="75" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <circle cx="180" cy="160" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

              {/* Complete underlying layer - see-through */}
              <g opacity="0.12" className="radar-breathe">
                <circle cx="180" cy="160" r="125" fill="url(#heatmap100)"/>
              </g>

              {/* Section progress visualization with layered rings */}
              {renderProgressionRings('Pre-Game', 180, 160, 'mask1', 'animate-group-1', false)}
              {renderProgressionRings('In-Game', 180, 160, 'mask2', 'animate-group-2', false)}
              {renderProgressionRings('Post-Game', 180, 160, 'mask3', 'animate-group-3', false)}
              {renderProgressionRings('Off Court', 180, 160, 'mask4', 'animate-group-4', false)}
              {renderProgressionRings('Locker Room', 180, 160, 'mask5', 'animate-group-5', false)}

              {/* Clickable radar sections */}
              <g>
                <path
                  d="M 180 160 L 180 35 A 125 125 0 0 1 288.3 95.1 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Pre-Game', e)}
                />
              </g>

              <g>
                <path
                  d="M 180 160 L 288.3 95.1 A 125 125 0 0 1 258.3 247.4 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('In-Game', e)}
                />
              </g>

              <g>
                <path
                  d="M 180 160 L 258.3 247.4 A 125 125 0 0 1 101.7 247.4 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Post-Game', e)}
                />
              </g>

              <g>
                <path
                  d="M 180 160 L 101.7 247.4 A 125 125 0 0 1 71.7 95.1 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Off Court', e)}
                />
              </g>

              <g>
                <path
                  d="M 180 160 L 71.7 95.1 A 125 125 0 0 1 180 35 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Locker Room', e)}
                />
              </g>

              <g stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" fill="none">
                <line x1="180" y1="160" x2="180" y2="35"/>
                <line x1="180" y1="160" x2="286.8" y2="96.4"/>
                <line x1="180" y1="160" x2="256.8" y2="264.4"/>
                <line x1="180" y1="160" x2="103.2" y2="264.4"/>
                <line x1="180" y1="160" x2="73.2" y2="96.4"/>
              </g>

              <circle cx="180" cy="160" r="10" fill="#000" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

              {/* Inner ring on top of everything */}
              <circle cx="180" cy="160" r="25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

              {/* Section Labels with Green Hold Badges */}
              <g>
                {/* PRE-GAME */}
                <text x="280" y="18" textAnchor="middle" fill="#888" fontSize="11" fontWeight="500" letterSpacing="1.2">PRE-GAME</text>
                {getGreenHold('Pre-Game').hasActiveHold && (
                  <g>
                    <circle cx="315" cy="14" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="315" y="17" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* IN-GAME */}
                <text x="350" y="162" textAnchor="middle" fill="#888" fontSize="11" fontWeight="500" letterSpacing="1.2">IN-GAME</text>
                {getGreenHold('In-Game').hasActiveHold && (
                  <g>
                    <circle cx="380" cy="158" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="380" y="161" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* POST-GAME */}
                <text x="230" y="317" textAnchor="middle" fill="#888" fontSize="11" fontWeight="500" letterSpacing="1.2">POST-GAME</text>
                {getGreenHold('Post-Game').hasActiveHold && (
                  <g>
                    <circle cx="265" cy="313" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="265" y="316" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* OFF-COURT */}
                <text x="6" y="180" textAnchor="middle" fill="#888" fontSize="11" fontWeight="500" letterSpacing="1.2">OFF-COURT</text>
                {getGreenHold('Off Court').hasActiveHold && (
                  <g>
                    <circle cx="45" cy="176" r="6" fill="#00FF00" opacity="0.8" />
                    <text x="45" y="179" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
                  </g>
                )}

                {/* LOCKER ROOM */}
                <text x="55" y="18" textAnchor="middle" fill="#888" fontSize="11" fontWeight="500" letterSpacing="1.2">LOCKER ROOM</text>
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

          <div className="mt-6 mb-8">
            <div className="text-white text-center text-[15px] leading-6 mb-6">
              {!isLoading && radarState && (
                <>
                  Your overall progression: <strong className="text-white font-bold text-[16px]">{calculateOverallPercentage()}%</strong>
                  <div className="text-zinc-500 text-[13px] mt-1 leading-5">
                    Every elite player started exactly where you are now.<br/>
                    Build cheat codes for each area to reach full power.
                  </div>
                </>
              )}
              {(isLoading || !radarState) && (
                <>
                  Loading your progression...
                  <div className="text-zinc-500 text-[13px] mt-1 leading-5">
                    Every elite player started exactly where you are now.<br/>
                    Build cheat codes for each area to reach full power.
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleCreateCheatCode} className="w-full py-3.5 px-6 rounded-xl border-none text-[16px] font-bold cursor-pointer transition-all duration-200 bg-zinc-800 text-white hover:bg-zinc-700 active:scale-98 text-center relative">
                Create Cheat Code
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-black"></div>
              </button>
              <Link href="/community-topics" className="w-full py-3.5 px-6 rounded-xl border border-zinc-700 text-[16px] font-semibold cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-600 active:scale-98 text-center relative">
                View Community Topics
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-white/30"></div>
              </Link>
              <button onClick={handleShare} className="w-full py-2 px-0 text-[14px] font-medium cursor-pointer transition-all duration-200 bg-transparent text-zinc-400 hover:text-white active:scale-98 text-center mt-3">
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden">
          <div className="h-8 bg-gradient-to-t from-black via-black/90 to-transparent"></div>
          <div className="bg-black">
            <div className="flex">
              <Link href="/chat-history" className="flex-1 flex flex-col items-center justify-center py-3 text-zinc-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span className="text-xs mt-1">Chat History</span>
              </Link>
              <Link href="/my-codes" className="flex-1 flex flex-col items-center justify-center py-3 text-zinc-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span className="text-xs mt-1">My Codes</span>
              </Link>
              <Link href="/profile" className="flex-1 flex flex-col items-center justify-center py-3 text-zinc-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="text-xs mt-1">Profile</span>
              </Link>
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
        <div className="flex-1 flex p-6 pt-20 min-h-screen relative">
          {/* Left Legend */}
          <div className="absolute left-6 top-24">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 pr-10 backdrop-blur-sm relative">
              <button
                onClick={() => setLegendExpanded(!legendExpanded)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={`transform transition-transform ${legendExpanded ? 'rotate-45' : ''}`}>
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-300 transition-colors duration-200">Activated</span>
                </div>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-300 transition-colors duration-200">Rising</span>
                </div>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/30 group-hover:shadow-yellow-400/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-300 transition-colors duration-200">Elevated</span>
                </div>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-200"></div>
                  <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-300 transition-colors duration-200">Limitless</span>
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
            <div className="text-center mb-4 mt-4">
              <div className="text-3xl font-bold tracking-[3px] uppercase bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-300 bg-clip-text text-transparent mb-3">
                Your Analysis
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center mb-4 overflow-visible max-h-[60vh]">
            <svg width="650" height="650" viewBox="0 0 480 440" className="radar-svg radar-svg-desktop" style={{overflow: 'visible', filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.1)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.05))'}}>
              <style>
                {`
                  @keyframes pulseExpandDesktop1 {
                    0%, 85%, 100% { transform: scale(1); opacity: 1; }
                    25% { transform: scale(1.12); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop2 {
                    0%, 70%, 100% { transform: scale(1); opacity: 1; }
                    35% { transform: scale(1.08); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop3 {
                    0%, 90%, 100% { transform: scale(1); opacity: 1; }
                    15% { transform: scale(1.15); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop4 {
                    0%, 75%, 100% { transform: scale(1); opacity: 1; }
                    45% { transform: scale(1.1); opacity: 1; }
                  }

                  @keyframes pulseExpandDesktop5 {
                    0%, 80%, 100% { transform: scale(1); opacity: 1; }
                    30% { transform: scale(1.13); opacity: 1; }
                  }

                  .animate-group-desktop-1 {
                    animation: pulseExpandDesktop1 7.2s ease-in-out infinite;
                    animation-delay: 0.3s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-2 {
                    animation: pulseExpandDesktop2 8.1s ease-in-out infinite;
                    animation-delay: 2.7s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-3 {
                    animation: pulseExpandDesktop3 6.8s ease-in-out infinite;
                    animation-delay: 5.1s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-4 {
                    animation: pulseExpandDesktop4 7.9s ease-in-out infinite;
                    animation-delay: 1.8s;
                    transform-origin: 240px 220px;
                  }

                  .animate-group-desktop-5 {
                    animation: pulseExpandDesktop5 7.5s ease-in-out infinite;
                    animation-delay: 4.2s;
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
                <mask id="mask1-desktop">
                  <path d="M 240 220 L 240 95 A 125 125 0 0 1 348.3 155.1 Z" fill="white"/>
                </mask>
                <mask id="mask2-desktop">
                  <path d="M 240 220 L 348.3 155.1 A 125 125 0 0 1 318.3 307.4 Z" fill="white"/>
                </mask>
                <mask id="mask3-desktop">
                  <path d="M 240 220 L 318.3 307.4 A 125 125 0 0 1 161.7 307.4 Z" fill="white"/>
                </mask>
                <mask id="mask4-desktop">
                  <path d="M 240 220 L 161.7 307.4 A 125 125 0 0 1 131.7 155.1 Z" fill="white"/>
                </mask>
                <mask id="mask5-desktop">
                  <path d="M 240 220 L 131.7 155.1 A 125 125 0 0 1 240 95 Z" fill="white"/>
                </mask>
              </defs>

              <circle cx="240" cy="220" r="125" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <circle cx="240" cy="220" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <circle cx="240" cy="220" r="75" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <circle cx="240" cy="220" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

              {/* Complete underlying layer - see-through */}
              <g opacity="0.12" className="radar-breathe">
                <circle cx="240" cy="220" r="125" fill="url(#heatmap100Desktop)"/>
              </g>

              {/* Section progress visualization with layered rings - Desktop */}
              {renderProgressionRings('Pre-Game', 240, 220, 'mask1-desktop', 'animate-group-desktop-1', true)}
              {renderProgressionRings('In-Game', 240, 220, 'mask2-desktop', 'animate-group-desktop-2', true)}
              {renderProgressionRings('Post-Game', 240, 220, 'mask3-desktop', 'animate-group-desktop-3', true)}
              {renderProgressionRings('Off Court', 240, 220, 'mask4-desktop', 'animate-group-desktop-4', true)}
              {renderProgressionRings('Locker Room', 240, 220, 'mask5-desktop', 'animate-group-desktop-5', true)}

              {/* Clickable radar sections - Desktop */}
              <g>
                <path
                  d="M 240 220 L 240 95 A 125 125 0 0 1 348.3 155.1 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Pre-Game', e)}
                />
              </g>

              <g>
                <path
                  d="M 240 220 L 348.3 155.1 A 125 125 0 0 1 318.3 307.4 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('In-Game', e)}
                />
              </g>

              <g>
                <path
                  d="M 240 220 L 318.3 307.4 A 125 125 0 0 1 161.7 307.4 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Post-Game', e)}
                />
              </g>

              <g>
                <path
                  d="M 240 220 L 161.7 307.4 A 125 125 0 0 1 131.7 155.1 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Off Court', e)}
                />
              </g>

              <g>
                <path
                  d="M 240 220 L 131.7 155.1 A 125 125 0 0 1 240 95 Z"
                  fill="transparent"
                  className="radar-section"
                  onClick={(e) => handleSectionClick('Locker Room', e)}
                />
              </g>

              <g stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" fill="none">
                <line x1="240" y1="220" x2="240" y2="95"/>
                <line x1="240" y1="220" x2="346.8" y2="156.4"/>
                <line x1="240" y1="220" x2="316.8" y2="324.4"/>
                <line x1="240" y1="220" x2="163.2" y2="324.4"/>
                <line x1="240" y1="220" x2="133.2" y2="156.4"/>
              </g>

              <circle cx="240" cy="220" r="11.5" fill="#000" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

              {/* Inner ring on top of everything */}
              <circle cx="240" cy="220" r="25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

              {/* Desktop Section Labels with Green Hold Badges */}
              <g>
                {/* PRE-GAME */}
                <text x="350" y="78" textAnchor="middle" fill="#888" fontSize="13" fontWeight="500" letterSpacing="1.4">PRE-GAME</text>
                {getGreenHold('Pre-Game').hasActiveHold && (
                  <g>
                    <circle cx="395" cy="74" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="395" y="78" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* IN-GAME */}
                <text x="410" y="222" textAnchor="middle" fill="#888" fontSize="13" fontWeight="500" letterSpacing="1.4">IN-GAME</text>
                {getGreenHold('In-Game').hasActiveHold && (
                  <g>
                    <circle cx="445" cy="218" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="445" y="222" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* POST-GAME */}
                <text x="300" y="382" textAnchor="middle" fill="#888" fontSize="13" fontWeight="500" letterSpacing="1.4">POST-GAME</text>
                {getGreenHold('Post-Game').hasActiveHold && (
                  <g>
                    <circle cx="345" cy="378" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="345" y="382" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* OFF-COURT */}
                <text x="62" y="240" textAnchor="middle" fill="#888" fontSize="13" fontWeight="500" letterSpacing="1.4">OFF-COURT</text>
                {getGreenHold('Off Court').hasActiveHold && (
                  <g>
                    <circle cx="25" cy="236" r="8" fill="#00FF00" opacity="0.9" />
                    <text x="25" y="240" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">H</text>
                  </g>
                )}

                {/* LOCKER ROOM */}
                <text x="105" y="78" textAnchor="middle" fill="#888" fontSize="13" fontWeight="500" letterSpacing="1.4">LOCKER ROOM</text>
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

          <div className="text-center mb-6">
            {!isLoading && radarState && (
              <>
                <div className="text-white text-lg mb-3">
                  Your overall progression: <strong className="text-xl font-bold">{calculateOverallPercentage()}%</strong>
                </div>
                <div className="text-zinc-400 text-sm leading-relaxed">
                  Every elite player started exactly where you are now.<br/>
                  Build cheat codes for each area to reach full power.
                </div>
              </>
            )}
            {(isLoading || !radarState) && (
              <>
                <div className="text-white text-lg mb-3">
                  Loading your progression...
                </div>
                <div className="text-zinc-400 text-sm leading-relaxed">
                  Every elite player started exactly where you are now.<br/>
                  Build cheat codes for each area to reach full power.
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 w-full max-w-2xl pb-6">
            <button onClick={handleCreateCheatCode} className="w-full py-3 px-8 rounded-xl border-none text-xl font-bold cursor-pointer transition-all duration-200 bg-zinc-800 text-white hover:bg-zinc-700 active:scale-98 text-center relative">
              Create Cheat Code
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-black"></div>
            </button>
            <Link href="/community-topics" className="w-full py-3 px-8 rounded-xl border border-zinc-700 text-xl font-semibold cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-800 hover:border-zinc-600 active:scale-98 text-center block relative">
              View Community Topics
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-white/30"></div>
            </Link>
            <button onClick={handleShare} className="w-full py-3 px-0 text-lg font-medium cursor-pointer transition-all duration-200 bg-transparent text-zinc-400 hover:text-white active:scale-98 text-center mt-4">
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
