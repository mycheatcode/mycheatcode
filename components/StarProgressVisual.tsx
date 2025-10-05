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
    preGame: 100,
    inGame: 100,
    postGame: 100,
    offCourt: 100,
    lockerRoom: 100
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
    const notchRadius = maxRadius + 35;

    // Draw notches in a circle
    for (let deg = 0; deg < 360; deg += 3) {
      const angle = (deg * Math.PI / 180) - Math.PI / 2;

      // Determine notch type
      let length: number, width: number, opacity: number, color: string;

      if (deg % 30 === 0) {
        // Major notches
        length = 20;
        width = 3;
        opacity = 0.9;
        color = '#ffffff';
      } else if (deg % 15 === 0) {
        // Medium notches
        length = 14;
        width = 2;
        opacity = 0.5;
        color = '#cccccc';
      } else if (deg % 6 === 0) {
        // Minor notches
        length = 8;
        width = 1.5;
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
      container.appendChild(notch);
    }
  };

  const drawDiamondStar = (container: Element, cx: number, cy: number, innerR: number, outerR: number, progressValues: number[]) => {
    const numSections = 5;
    const rings = 20;
    const sectorAngle = TAU / numSections;

    for (let section = 0; section < numSections; section++) {
      const progress = progressValues[section] / 100;
      // Map 0% to show a small baseline (like 10% size), then scale normally
      // This creates equal visual jumps: 0->25%, 25->50%, 50->75%, etc.
      const baselineSize = 0.1; // 10% baseline for 0%
      const visualProgress = progress === 0
        ? baselineSize
        : baselineSize + (1 - baselineSize) * progress;
      const sectionAngle = -Math.PI / 2 + section * sectorAngle;

      // Draw progress rings
      const maxRings = Math.floor(rings * visualProgress);
      for (let ring = 0; ring <= maxRings; ring++) {
        const ringProgress = ring / rings;
        if (ringProgress > visualProgress) continue;

        const radius = innerR + (outerR - innerR) * ringProgress;

        // Calculate color based on how far through the actual progress we are
        // This creates a gradient that spans from red through orange, yellow to green
        const actualProgressPosition = (ringProgress / visualProgress) * progress;
        const color = getGradientColor(actualProgressPosition);

        // Create diamond path
        const path = createDiamondPath(cx, cy, sectionAngle, radius, sectorAngle);

        const diamond = document.createElementNS("http://www.w3.org/2000/svg", "path");
        diamond.setAttribute("d", path);
        diamond.setAttribute("fill", "none");
        diamond.setAttribute("stroke", color);
        diamond.setAttribute("stroke-width", (1 + ringProgress * 2).toString());
        diamond.setAttribute("stroke-opacity", (0.3 + ringProgress * 0.6).toString());
        diamond.setAttribute("filter", ringProgress > 0.7 ? "url(#glow)" : "");

        // Add click handler if onClick is provided
        if (onClick) {
          diamond.style.cursor = 'pointer';
          diamond.addEventListener('click', () => onClick(section));
        }

        container.appendChild(diamond);
      }

      // Draw ghost guides
      for (let ring = 3; ring < rings; ring += 4) {
        const radius = innerR + (outerR - innerR) * (ring / rings);
        const path = createDiamondPath(cx, cy, sectionAngle, radius, sectorAngle);

        const ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ghost.setAttribute("d", path);
        ghost.setAttribute("fill", "none");
        ghost.setAttribute("stroke", "#444444");
        ghost.setAttribute("stroke-width", "0.5");
        ghost.setAttribute("stroke-opacity", "0.2");
        ghost.setAttribute("stroke-dasharray", "2,4");
        container.appendChild(ghost);
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
    const cl1x = cx + (leftX - cx) * 0.5 + 15 * Math.cos(leftAngle + Math.PI/2);
    const cl1y = cy + (leftY - cy) * 0.5 + 15 * Math.sin(leftAngle + Math.PI/2);
    path += ` Q ${cl1x} ${cl1y}, ${leftX} ${leftY}`;

    // Curve to tip
    const cl2x = leftX + (tipX - leftX) * 0.5 - 20 * Math.cos(angle - Math.PI/2);
    const cl2y = leftY + (tipY - leftY) * 0.5 - 20 * Math.sin(angle - Math.PI/2);
    path += ` Q ${cl2x} ${cl2y}, ${tipX} ${tipY}`;

    // Curve to right
    const cr1x = tipX + (rightX - tipX) * 0.5 - 20 * Math.cos(angle + Math.PI/2);
    const cr1y = tipY + (rightY - tipY) * 0.5 - 20 * Math.sin(angle + Math.PI/2);
    path += ` Q ${cr1x} ${cr1y}, ${rightX} ${rightY}`;

    // Curve back to center
    const cr2x = rightX + (cx - rightX) * 0.5 + 15 * Math.cos(rightAngle - Math.PI/2);
    const cr2y = rightY + (cy - rightY) * 0.5 + 15 * Math.sin(rightAngle - Math.PI/2);
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
      // YELLOW stage with gradient toward green
      const t = (progress - 0.50) / 0.25;
      return `rgb(${255 - t * 155}, ${220 + t * 35}, 0)`;
    } else {
      // GREEN stage getting brighter
      const t = (progress - 0.75) / 0.25;
      return `rgb(${100 - t * 50}, ${255 - t * 50}, ${50 + t * 50})`;
    }
  };

  return (
    <div className={`star-progress-container ${className}`}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`-${size * 0.25} -${size * 0.25} ${size * 1.5} ${size * 1.5}`}
        className="star-progress-svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g id="notches"></g>
        <g id="diamonds"></g>
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
                    fontSize: size > 400 ? '14px' : '12px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    fill: '#CCCCCC'
                  }}
                >
                  {sectionName}
                </text>
              );
            });
          })()}
        </g>
      </svg>
    </div>
  );
};

export default StarProgressVisual;