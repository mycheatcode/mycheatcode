'use client';

import { Section } from '../app/utils/progressionSystem';

interface RadarData {
  preGame: number;
  preGameColor: 'red' | 'orange' | 'yellow' | 'green';
  inGame: number;
  inGameColor: 'red' | 'orange' | 'yellow' | 'green';
  postGame: number;
  postGameColor: 'red' | 'orange' | 'yellow' | 'green';
  offCourt: number;
  offCourtColor: 'red' | 'orange' | 'yellow' | 'green';
  lockerRoom: number;
  lockerRoomColor: 'red' | 'orange' | 'yellow' | 'green';
}

interface HomepageRadarProps {
  radarData: RadarData;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  showGreenHoldBadges?: boolean;
  disableAnimations?: boolean;
  className?: string;
}

export default function HomepageRadar({
  radarData,
  size = 'medium',
  showLabels = true,
  showGreenHoldBadges = false,
  disableAnimations = false,
  className = ''
}: HomepageRadarProps) {

  // Size configurations
  const sizeConfig = {
    small: {
      svgSize: 240,
      viewBox: "0 0 360 320",
      centerX: 180,
      centerY: 160,
      fontSize: 9,
      strokeWidth: 0.8
    },
    medium: {
      svgSize: 340,
      viewBox: "0 0 360 320",
      centerX: 180,
      centerY: 160,
      fontSize: 11,
      strokeWidth: 1
    },
    large: {
      svgSize: 480,
      viewBox: "0 0 480 440",
      centerX: 240,
      centerY: 220,
      fontSize: 13,
      strokeWidth: 1.2
    }
  };

  const { svgSize, viewBox, centerX, centerY, fontSize, strokeWidth } = sizeConfig[size];
  const gradientSuffix = size === 'large' ? 'Desktop' : '';

  // Render progression rings for a section
  const renderProgressionRings = (sectionName: keyof RadarData, maskId: string, animateClass: string) => {
    const powerPercentage = radarData[sectionName] as number;

    return (
      <g mask={`url(#${maskId})`} className={disableAnimations ? '' : animateClass}>
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
              strokeDasharray="5,5"
              opacity="0.6"
            />
          );
        })()}
      </g>
    );
  };

  // Calculate positions for large vs small radar
  const positions = size === 'large' ? {
    preGame: { x: 340, y: 78, labelX: 340, labelY: 78, badgeX: 375, badgeY: 74 },
    inGame: { x: 410, y: 222, labelX: 410, labelY: 222, badgeX: 440, badgeY: 218 },
    postGame: { x: 290, y: 377, labelX: 290, labelY: 377, badgeX: 325, badgeY: 373 },
    offCourt: { x: 120, y: 315, labelX: 120, labelY: 315, badgeX: 90, badgeY: 311 },
    lockerRoom: { x: 90, y: 125, labelX: 90, labelY: 125, badgeX: 60, badgeY: 121 },
    sectionPaths: [
      "M 240 220 L 240 95 A 125 125 0 0 1 348.3 155.1 Z",
      "M 240 220 L 348.3 155.1 A 125 125 0 0 1 318.3 307.4 Z",
      "M 240 220 L 318.3 307.4 A 125 125 0 0 1 161.7 307.4 Z",
      "M 240 220 L 161.7 307.4 A 125 125 0 0 1 131.7 155.1 Z",
      "M 240 220 L 131.7 155.1 A 125 125 0 0 1 240 95 Z"
    ],
    radarLines: [
      { x1: 240, y1: 220, x2: 240, y2: 95 },
      { x1: 240, y1: 220, x2: 346.8, y2: 156.4 },
      { x1: 240, y1: 220, x2: 316.8, y2: 324.4 },
      { x1: 240, y1: 220, x2: 163.2, y2: 324.4 },
      { x1: 240, y1: 220, x2: 133.2, y2: 156.4 }
    ]
  } : {
    preGame: { x: 280, y: 18, labelX: 280, labelY: 18, badgeX: 315, badgeY: 14 },
    inGame: { x: 350, y: 162, labelX: 350, labelY: 162, badgeX: 380, badgeY: 158 },
    postGame: { x: 230, y: 317, labelX: 230, labelY: 317, badgeX: 265, badgeY: 313 },
    offCourt: { x: 80, y: 255, labelX: 80, labelY: 255, badgeX: 50, badgeY: 251 },
    lockerRoom: { x: 50, y: 65, labelX: 50, labelY: 65, badgeX: 20, badgeY: 61 },
    sectionPaths: [
      "M 180 160 L 180 35 A 125 125 0 0 1 288.3 95.1 Z",
      "M 180 160 L 288.3 95.1 A 125 125 0 0 1 258.3 247.4 Z",
      "M 180 160 L 258.3 247.4 A 125 125 0 0 1 101.7 247.4 Z",
      "M 180 160 L 101.7 247.4 A 125 125 0 0 1 71.7 95.1 Z",
      "M 180 160 L 71.7 95.1 A 125 125 0 0 1 180 35 Z"
    ],
    radarLines: [
      { x1: 180, y1: 160, x2: 180, y2: 35 },
      { x1: 180, y1: 160, x2: 286.8, y2: 96.4 },
      { x1: 180, y1: 160, x2: 256.8, y2: 264.4 },
      { x1: 180, y1: 160, x2: 103.2, y2: 264.4 },
      { x1: 180, y1: 160, x2: 73.2, y2: 96.4 }
    ]
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={viewBox}
        className="radar-svg"
        style={{
          overflow: 'visible',
          filter: `drop-shadow(0 0 ${size === 'large' ? '30px' : '20px'} rgba(255, 255, 255, 0.1)) drop-shadow(0 0 ${size === 'large' ? '60px' : '40px'} rgba(255, 255, 255, 0.05))`
        }}
      >
        <defs>
          {/* Heat Map Gradients */}
          <radialGradient id={`heatmap100${gradientSuffix}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="30%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="35%" stopColor="#FFA500" stopOpacity="1"/>
            <stop offset="50%" stopColor="#FFA500" stopOpacity="1"/>
            <stop offset="60%" stopColor="#FFFF00" stopOpacity="1"/>
            <stop offset="75%" stopColor="#FFFF00" stopOpacity="1"/>
            <stop offset="85%" stopColor="#00FF00" stopOpacity="1"/>
            <stop offset="100%" stopColor="#00FF00" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id={`heatmap75${gradientSuffix}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="40%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="46.67%" stopColor="#FFA500" stopOpacity="1"/>
            <stop offset="66.67%" stopColor="#FFA500" stopOpacity="1"/>
            <stop offset="80%" stopColor="#FFFF00" stopOpacity="1"/>
            <stop offset="100%" stopColor="#FFFF00" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id={`heatmap50${gradientSuffix}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="60%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="65%" stopColor="#FFA500" stopOpacity="1"/>
            <stop offset="100%" stopColor="#FFA500" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id={`heatmap25${gradientSuffix}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="1"/>
            <stop offset="100%" stopColor="#FF0000" stopOpacity="1"/>
          </radialGradient>

          {/* Masks for each section */}
          <mask id={`mask1${gradientSuffix}`}>
            <path d={positions.sectionPaths[0]} fill="white"/>
          </mask>
          <mask id={`mask2${gradientSuffix}`}>
            <path d={positions.sectionPaths[1]} fill="white"/>
          </mask>
          <mask id={`mask3${gradientSuffix}`}>
            <path d={positions.sectionPaths[2]} fill="white"/>
          </mask>
          <mask id={`mask4${gradientSuffix}`}>
            <path d={positions.sectionPaths[3]} fill="white"/>
          </mask>
          <mask id={`mask5${gradientSuffix}`}>
            <path d={positions.sectionPaths[4]} fill="white"/>
          </mask>
        </defs>

        {/* Outer radar rings */}
        <circle cx={centerX} cy={centerY} r="125" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>
        <circle cx={centerX} cy={centerY} r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>
        <circle cx={centerX} cy={centerY} r="75" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>
        <circle cx={centerX} cy={centerY} r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>

        {/* Complete underlying layer - see-through */}
        <g opacity="0.12" className="radar-breathe">
          <circle cx={centerX} cy={centerY} r="125" fill={`url(#heatmap100${gradientSuffix})`}/>
        </g>

        {/* Section progress visualization with layered rings */}
        {renderProgressionRings('preGame', `mask1${gradientSuffix}`, 'animate-group-1')}
        {renderProgressionRings('inGame', `mask2${gradientSuffix}`, 'animate-group-2')}
        {renderProgressionRings('postGame', `mask3${gradientSuffix}`, 'animate-group-3')}
        {renderProgressionRings('offCourt', `mask4${gradientSuffix}`, 'animate-group-4')}
        {renderProgressionRings('lockerRoom', `mask5${gradientSuffix}`, 'animate-group-5')}

        {/* Radar dividing lines */}
        <g stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
          {positions.radarLines.map((line, index) => (
            <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}/>
          ))}
        </g>

        {/* Center dot */}
        <circle cx={centerX} cy={centerY} r="10" fill="#000" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>

        {/* Inner ring on top of everything */}
        <circle cx={centerX} cy={centerY} r="25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>

        {/* Section Labels */}
        {showLabels && (
          <g>
            <text x={positions.preGame.labelX} y={positions.preGame.labelY} textAnchor="middle" fill="#888" fontSize={fontSize} fontWeight="500" letterSpacing="1.2">PRE-GAME</text>
            <text x={positions.inGame.labelX} y={positions.inGame.labelY} textAnchor="middle" fill="#888" fontSize={fontSize} fontWeight="500" letterSpacing="1.2">IN-GAME</text>
            <text x={positions.postGame.labelX} y={positions.postGame.labelY} textAnchor="middle" fill="#888" fontSize={fontSize} fontWeight="500" letterSpacing="1.2">POST-GAME</text>
            <text x={positions.offCourt.labelX} y={positions.offCourt.labelY} textAnchor="middle" fill="#888" fontSize={fontSize} fontWeight="500" letterSpacing="1.2">OFF COURT</text>
            <text x={positions.lockerRoom.labelX} y={positions.lockerRoom.labelY} textAnchor="middle" fill="#888" fontSize={fontSize} fontWeight="500" letterSpacing="1.2">LOCKER ROOM</text>
          </g>
        )}

        {/* Green Hold Badges */}
        {showGreenHoldBadges && (
          <g>
            {radarData.preGameColor === 'green' && (
              <g>
                <circle cx={positions.preGame.badgeX} cy={positions.preGame.badgeY} r="6" fill="#00FF00" opacity="0.8" />
                <text x={positions.preGame.badgeX} y={positions.preGame.badgeY + 3} textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
              </g>
            )}
            {radarData.inGameColor === 'green' && (
              <g>
                <circle cx={positions.inGame.badgeX} cy={positions.inGame.badgeY} r="6" fill="#00FF00" opacity="0.8" />
                <text x={positions.inGame.badgeX} y={positions.inGame.badgeY + 3} textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
              </g>
            )}
            {radarData.postGameColor === 'green' && (
              <g>
                <circle cx={positions.postGame.badgeX} cy={positions.postGame.badgeY} r="6" fill="#00FF00" opacity="0.8" />
                <text x={positions.postGame.badgeX} y={positions.postGame.badgeY + 3} textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
              </g>
            )}
            {radarData.offCourtColor === 'green' && (
              <g>
                <circle cx={positions.offCourt.badgeX} cy={positions.offCourt.badgeY} r="6" fill="#00FF00" opacity="0.8" />
                <text x={positions.offCourt.badgeX} y={positions.offCourt.badgeY + 3} textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
              </g>
            )}
            {radarData.lockerRoomColor === 'green' && (
              <g>
                <circle cx={positions.lockerRoom.badgeX} cy={positions.lockerRoom.badgeY} r="6" fill="#00FF00" opacity="0.8" />
                <text x={positions.lockerRoom.badgeX} y={positions.lockerRoom.badgeY + 3} textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">H</text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}