'use client';

import React, { useEffect, useRef } from 'react';

interface StarProgressVisualProps {
  progressData?: {
    preGame: number;
    inGame: number;
    postGame: number;
    offCourt: number;
    lockerRoom: number;
  };
  size?: number;
  showControls?: boolean;
  onClick?: (sectionIndex: number) => void;
  className?: string;
}

const StarProgressVisual = ({
  progressData = {
    preGame: 65,
    inGame: 65,
    postGame: 65,
    offCourt: 65,
    lockerRoom: 65
  },
  size = 600,
  showControls = false,
  onClick,
  className = ""
}: StarProgressVisualProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const TAU = Math.PI * 2;

  useEffect(() => {
    if (svgRef.current) {
      createStarVisual([
        progressData.preGame,
        progressData.inGame,
        progressData.postGame,
        progressData.offCourt,
        progressData.lockerRoom
      ]);
    }
  }, [progressData]);

  const createStarVisual = (progressValues: number[]) => {
    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size * 0.38;
    const innerRadius = size * 0.12;

    // Clear existing elements
    const notchContainer = svgRef.current!.querySelector('#notches')!;
    const diamondContainer = svgRef.current!.querySelector('#diamonds')!;
    notchContainer.innerHTML = '';
    diamondContainer.innerHTML = '';

    // Draw floating notches
    drawFloatingNotches(notchContainer, cx, cy, maxRadius);

    // Draw diamond star sections
    drawDiamondStar(diamondContainer, cx, cy, innerRadius, maxRadius, progressValues);
  };

  const drawFloatingNotches = (container: Element, cx: number, cy: number, maxRadius: number) => {
    const notchRadius = maxRadius + (size * 0.058);

    // Draw notches in a circle
    for (let deg = 0; deg < 360; deg += 3) {
      const angle = (deg * Math.PI / 180) - Math.PI / 2;

      // Determine notch type
      let length: number, width: number, opacity: number, color: string;

      if (deg % 30 === 0) {
        // Major notches
        length = size * 0.033;
        width = size * 0.005;
        opacity = 0.9;
        color = '#ffffff';
      } else if (deg % 15 === 0) {
        // Medium notches
        length = size * 0.023;
        width = size * 0.0033;
        opacity = 0.5;
        color = '#cccccc';
      } else if (deg % 6 === 0) {
        // Minor notches
        length = size * 0.013;
        width = size * 0.0025;
        opacity = 0.3;
        color = '#888888';
      } else {
        continue; // Skip to keep it clean
      }

      const startR = notchRadius;
      const endR = notchRadius + length;

      const x1 = cx + startR * Math.cos(angle);
      const y1 = cy + startR * Math.sin(angle);
      const x2 = cx + endR * Math.cos(angle);
      const y2 = cy + endR * Math.sin(angle);

      const notch = document.createElementNS("http://www.w3.org/2000/svg", "line");
      notch.setAttribute("x1", x1.toString());
      notch.setAttribute("y1", y1.toString());
      notch.setAttribute("x2", x2.toString());
      notch.setAttribute("y2", y2.toString());
      notch.setAttribute("stroke", color);
      notch.setAttribute("stroke-width", width.toString());
      notch.setAttribute("stroke-opacity", opacity.toString());
      notch.setAttribute("stroke-linecap", "round");
      notch.style.pointerEvents = 'none'; // Disable pointer events on notches
      container.appendChild(notch);
    }
  };

  const drawDiamondStar = (container: Element, cx: number, cy: number, innerR: number, outerR: number, progressValues: number[]) => {
    const numSections = 5;
    const rings = 20;
    const sectorAngle = TAU / numSections;

    for (let section = 0; section < numSections; section++) {
      // Use actual progress data (now forced to 100%)
      const sectionProgress = section === 0 ? progressData.preGame :
                             section === 1 ? progressData.inGame :
                             section === 2 ? progressData.postGame :
                             section === 3 ? progressData.offCourt :
                             progressData.lockerRoom;
      const progress = sectionProgress / 100;
      const sectionAngle = -Math.PI / 2 + section * sectorAngle;

      // Draw 100% full potential outline FIRST (behind everything)
      const fullPath = createDiamondPath(cx, cy, sectionAngle, outerR, sectorAngle);
      const fullOutline = document.createElementNS("http://www.w3.org/2000/svg", "path");
      fullOutline.setAttribute("d", fullPath);
      fullOutline.setAttribute("fill", "none");
      fullOutline.setAttribute("stroke", "#999999");
      fullOutline.setAttribute("stroke-width", (size * 0.004).toString());
      fullOutline.setAttribute("stroke-opacity", "0.35");
      fullOutline.setAttribute("stroke-dasharray", `${size * 0.012},${size * 0.008}`);
      fullOutline.style.pointerEvents = 'none';
      container.appendChild(fullOutline);

      // Draw ghost guides
      for (let ring = 3; ring < rings; ring += 4) {
        const radius = innerR + (outerR - innerR) * (ring / rings);
        const path = createDiamondPath(cx, cy, sectionAngle, radius, sectorAngle);

        const ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ghost.setAttribute("d", path);
        ghost.setAttribute("fill", "none");
        ghost.setAttribute("stroke", "#444444");
        ghost.setAttribute("stroke-width", (size * 0.001).toString());
        ghost.setAttribute("stroke-opacity", "0.2");
        ghost.setAttribute("stroke-dasharray", `${size * 0.003},${size * 0.007}`);
        ghost.style.pointerEvents = 'none'; // Disable pointer events on ghost guides
        container.appendChild(ghost);
      }

      // Draw progress rings ON TOP - use direct progress for equal arm lengths
      const maxRings = Math.floor(rings * progress);
      for (let ring = 0; ring <= maxRings; ring++) {
        const ringProgress = ring / rings;
        if (ringProgress > progress) continue;

        const radius = innerR + (outerR - innerR) * ringProgress;

        // Calculate color based on how far through the actual progress we are
        // This creates a gradient that spans from red through orange, yellow to green
        const actualProgressPosition = ringProgress;
        const color = getGradientColor(actualProgressPosition);

        // Create diamond path
        const path = createDiamondPath(cx, cy, sectionAngle, radius, sectorAngle);

        const diamond = document.createElementNS("http://www.w3.org/2000/svg", "path");
        diamond.setAttribute("d", path);
        diamond.setAttribute("fill", "none");
        diamond.setAttribute("stroke", color);
        diamond.setAttribute("stroke-width", ((size * 0.002) + ringProgress * (size * 0.004)).toString());
        diamond.setAttribute("stroke-opacity", (0.3 + ringProgress * 0.6).toString());
        diamond.setAttribute("filter", ringProgress > 0.7 ? "url(#glow)" : "");
        diamond.style.pointerEvents = 'none'; // Disable pointer events on diamonds

        container.appendChild(diamond);
      }
    }
  };

  const createDiamondPath = (cx: number, cy: number, angle: number, radius: number, sectorAngle: number): string => {
    // Create a curved diamond shape
    const tipX = cx + radius * Math.cos(angle);
    const tipY = cy + radius * Math.sin(angle);

    const spread = 0.3;
    const width = radius * 0.35;

    const leftAngle = angle - sectorAngle * spread;
    const leftX = cx + width * Math.cos(leftAngle);
    const leftY = cy + width * Math.sin(leftAngle);

    const rightAngle = angle + sectorAngle * spread;
    const rightX = cx + width * Math.cos(rightAngle);
    const rightY = cy + width * Math.sin(rightAngle);

    // Build curved path
    let path = `M ${cx} ${cy}`;

    // Curve to left
    const curveFactor1 = size * 0.025; // Scale curve control distance
    const cl1x = cx + (leftX - cx) * 0.5 + curveFactor1 * Math.cos(leftAngle + Math.PI/2);
    const cl1y = cy + (leftY - cy) * 0.5 + curveFactor1 * Math.sin(leftAngle + Math.PI/2);
    path += ` Q ${cl1x} ${cl1y}, ${leftX} ${leftY}`;

    // Curve to tip
    const curveFactor2 = size * 0.033; // Scale curve control distance
    const cl2x = leftX + (tipX - leftX) * 0.5 - curveFactor2 * Math.cos(angle - Math.PI/2);
    const cl2y = leftY + (tipY - leftY) * 0.5 - curveFactor2 * Math.sin(angle - Math.PI/2);
    path += ` Q ${cl2x} ${cl2y}, ${tipX} ${tipY}`;

    // Curve to right
    const cr1x = tipX + (rightX - tipX) * 0.5 - curveFactor2 * Math.cos(angle + Math.PI/2);
    const cr1y = tipY + (rightY - tipY) * 0.5 - curveFactor2 * Math.sin(angle + Math.PI/2);
    path += ` Q ${cr1x} ${cr1y}, ${rightX} ${rightY}`;

    // Curve back to center
    const cr2x = rightX + (cx - rightX) * 0.5 + curveFactor1 * Math.cos(rightAngle - Math.PI/2);
    const cr2y = rightY + (cy - rightY) * 0.5 + curveFactor1 * Math.sin(rightAngle - Math.PI/2);
    path += ` Q ${cr2x} ${cr2y}, ${cx} ${cy}`;

    path += ' Z';
    return path;
  };

  const getGradientColor = (progress: number): string => {
    // Create smooth gradient through all 4 stages
    // RED (0-24%) -> ORANGE (25-49%) -> YELLOW (50-74%) -> GREEN (75-100%)

    if (progress < 0.25) {
      // RED stage with slight gradient toward orange
      const t = progress / 0.25;
      return `rgb(${220 + t * 35}, ${20 + t * 60}, 0)`;
    } else if (progress < 0.50) {
      // ORANGE stage with gradient toward yellow
      const t = (progress - 0.25) / 0.25;
      return `rgb(255, ${80 + t * 140}, 0)`;
    } else if (progress < 0.75) {
      // YELLOW stage - keep it dominant yellow with minimal green shift
      const t = (progress - 0.50) / 0.25;
      // Use exponential curve to delay green appearance until very end of yellow range
      const greenShift = Math.pow(t, 3); // Cubic curve keeps it yellow longer
      return `rgb(${255 - greenShift * 105}, ${220 + greenShift * 25}, 0)`;
    } else {
      // GREEN stage getting brighter
      const t = (progress - 0.75) / 0.25;
      return `rgb(${150 - t * 50}, ${245 + t * 10}, ${0 + t * 50})`;
    }
  };

  return (
    <div className={`star-progress-container ${className}`}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`-${size * 0.25} -${size * 0.25} ${size * 1.5} ${size * 1.5}`}
        className="star-progress-svg animate-gentle-pulse"
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.006} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g id="notches" className="animate-slow-rotate"></g>
        <g id="diamonds" className="animate-gentle-breathe"></g>
        <g id="labels">
          {(() => {
            const cx = size / 2;
            const cy = size / 2;
            const labelRadius = size * 0.55; // Position labels at star tips
            const sections = ['PRE-GAME', 'IN-GAME', 'POST-GAME', 'OFF COURT', 'LOCKER ROOM'];
            const numSections = 5;
            const sectorAngle = (Math.PI * 2) / numSections;

            return sections.map((sectionName, index) => {
              // Calculate angle for each section (starting from top)
              const angle = -Math.PI / 2 + index * sectorAngle;

              // Calculate label position at the star tip
              const labelX = cx + labelRadius * Math.cos(angle);
              const labelY = cy + labelRadius * Math.sin(angle);

              return (
                <text
                  key={index}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: `${Math.max(10, size * 0.02)}px`,
                    fontFamily: 'var(--font-dm-sans)',
                    fontWeight: '600',
                    letterSpacing: `${size * 0.0017}px`,
                    fill: '#CCCCCC'
                  }}
                >
                  {sectionName}
                </text>
              );
            });
          })()}
        </g>
        <g id="clickable-areas">
          {onClick && (() => {
            const cx = size / 2;
            const cy = size / 2;
            const innerR = size * 0.05;
            const outerR = size * 0.45;
            const numSections = 5;
            const sectorAngle = TAU / numSections;

            return Array.from({ length: numSections }, (_, section) => {
              const angle = -Math.PI / 2 + section * sectorAngle;

              // Create diamond-shaped clickable area matching the visual
              const spread = 0.35;
              const tipX = cx + outerR * Math.cos(angle);
              const tipY = cy + outerR * Math.sin(angle);

              const leftAngle = angle - sectorAngle * spread;
              const leftX = cx + (outerR * 0.4) * Math.cos(leftAngle);
              const leftY = cy + (outerR * 0.4) * Math.sin(leftAngle);

              const rightAngle = angle + sectorAngle * spread;
              const rightX = cx + (outerR * 0.4) * Math.cos(rightAngle);
              const rightY = cy + (outerR * 0.4) * Math.sin(rightAngle);

              const path = `M ${cx} ${cy} L ${leftX} ${leftY} L ${tipX} ${tipY} L ${rightX} ${rightY} Z`;

              return (
                <path
                  key={section}
                  d={path}
                  fill="transparent"
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(section);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('fill', 'rgba(255,255,255,0.1)');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('fill', 'transparent');
                  }}
                />
              );
            });
          })()}
        </g>
      </svg>

      <style jsx>{`
        .animate-gentle-pulse {
          animation: gentle-pulse 4s ease-in-out infinite;
        }

        .animate-slow-rotate {
          animation: slow-rotate 180s linear infinite;
          transform-origin: ${size / 2}px ${size / 2}px;
        }

        .animate-gentle-breathe {
          animation: gentle-breathe 3s ease-in-out infinite, star-pulse 5s ease-in-out infinite;
        }

        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        @keyframes slow-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes gentle-breathe {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.01);
            filter: brightness(1.1);
          }
        }

        @keyframes star-pulse {
          0%, 100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default StarProgressVisual;