'use client';

import { useEffect, useRef } from 'react';

interface FlowerProgressProps {
  progressValues?: number[];
  size?: number;
  onClick?: (sectionIndex: number) => void;
  className?: string;
}

export default function FlowerProgress({
  progressValues = [75, 60, 90, 45, 80],
  size = 300,
  onClick,
  className = ""
}: FlowerProgressProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const createFlowerProgress = () => {
      const TAU = Math.PI * 2;
      const rings = 30;
      const numSections = 5;
      const innerRadiusPct = 0.20;
      const outerRadiusPct = 0.92;

      const w = size, h = size;
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) / 2;

      const innerR = innerRadiusPct * R;
      const outerR = outerRadiusPct * R;

      const container = containerRef.current!;
      container.innerHTML = '';

      // Convert progress percentages to 0-1 values
      const sectionProgress = progressValues.map(p => p / 100);

      // Define specific petal angles to match label positions
      const petalAngles = [
        -3 * Math.PI / 4,  // Top-left (PRE-GAME)
        -Math.PI / 4,      // Top-right (IN-GAME)
        Math.PI / 4,       // Bottom-right (POST-GAME)
        Math.PI / 2,       // Bottom (OFF COURT)
        3 * Math.PI / 4    // Bottom-left (LOCKER ROOM)
      ];
      const wedgeSize = TAU / numSections;

      // FIRST: Draw ghost underlay showing 100% progress for all sections
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        const ghostProgress = 1.0; // Always show full progress for ghost
        const scaledProgress = 0.4 + (ghostProgress * 0.6); // Same scaling as real petals

        const sectionStart = petalAngles[sectionIdx];

        // Only draw every 3rd ring for the ghost to keep it subtle
        for (let ringIdx = 2; ringIdx < rings; ringIdx += 3) {
          const ringFraction = ringIdx / (rings - 1);

          if (ringFraction > scaledProgress) continue;

          // Ghost styling - more visible
          const strokeColor = "#999999";
          const strokeWidth = 1.0;
          const strokeOpacity = 0.35; // More visible but still subtle

          // Build the arc for this ghost ring
          let d = "";
          const samples = 100;

          for (let s = 0; s <= samples; s++) {
            const u = s / samples;
            const angle = sectionStart + u * wedgeSize;

            const localU = u;

            let petalShape;
            if (localU < 0.1) {
              petalShape = Math.pow(localU / 0.1, 1.7) * 0.4 + 0.05;
            } else if (localU > 0.9) {
              petalShape = Math.pow((1 - localU) / 0.1, 1.7) * 0.4 + 0.05;
            } else {
              const middleU = (localU - 0.1) / 0.8;
              petalShape = 0.45 + 0.55 * Math.pow(Math.sin(middleU * Math.PI), 0.7);
            }

            const baseRadius = innerR + ringFraction * (outerR - innerR) * scaledProgress;
            const r = baseRadius * (0.20 + 0.80 * petalShape);

            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          }

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", d);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", strokeColor);
          path.setAttribute("stroke-width", strokeWidth.toString());
          path.setAttribute("stroke-opacity", strokeOpacity.toString());
          path.setAttribute("stroke-linecap", "round");
          path.setAttribute("stroke-linejoin", "round");
          path.setAttribute("stroke-dasharray", "3,3"); // Dotted line for ghost

          container.appendChild(path);
        }
      }

      // SECOND: Draw actual progress petals on top
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        const progress = sectionProgress[sectionIdx];

        // Map progress so 0% = 0.4 (40% size) and 100% = 1.0 (full size)
        const scaledProgress = 0.4 + (progress * 0.6);

        // This section's angular range (valley to valley)
        const sectionStart = petalAngles[sectionIdx];

        // Draw rings for this section based on scaled progress
        const maxRings = Math.ceil(rings * scaledProgress);

        for (let ringIdx = 0; ringIdx < maxRings; ringIdx++) {
          const ringFraction = ringIdx / (rings - 1);

          // Only show this ring if it's within scaled progress
          if (ringFraction > scaledProgress) continue;

          // Fade last ring if partial
          const isLastRing = (ringIdx === maxRings - 1);
          const fadeMultiplier = (isLastRing && scaledProgress < 1) ?
            ((scaledProgress * rings) % 1) || 1 : 1;

          // Enhanced color gradient with much more distinct red phase
          let red, green, blue;
          if (ringFraction < 0.15) {
            // Pure deep red for first 15%
            red = 220 + Math.round(35 * (ringFraction / 0.15)); // 220 to 255
            green = Math.round(10 * (ringFraction / 0.15)); // Just a tiny hint, 0 to 10
            blue = 0;
          } else if (ringFraction < 0.30) {
            // Red with slowly increasing orange (15-30%)
            const localT = (ringFraction - 0.15) / 0.15;
            red = 255;
            green = Math.round(10 + 70 * localT); // 10 to 80
            blue = 0;
          } else if (ringFraction < 0.50) {
            // Red-orange to orange (30-50%)
            const localT = (ringFraction - 0.30) / 0.20;
            red = 255;
            green = Math.round(80 + 85 * localT); // 80 to 165
            blue = 0;
          } else if (ringFraction < 0.70) {
            // Orange to yellow (50-70%)
            const localT = (ringFraction - 0.50) / 0.20;
            red = 255;
            green = Math.round(165 + 90 * localT); // 165 to 255
            blue = 0;
          } else if (ringFraction < 0.85) {
            // Yellow to yellow-green (70-85%)
            const localT = (ringFraction - 0.70) / 0.15;
            red = Math.round(255 - 155 * localT); // 255 to 100
            green = 255;
            blue = 0;
          } else {
            // Yellow-green to green (85-100%)
            const localT = (ringFraction - 0.85) / 0.15;
            red = Math.round(100 * (1 - localT)); // 100 to 0
            green = 255;
            blue = 0;
          }

          const strokeColor = `rgb(${red}, ${green}, ${blue})`;
          const strokeWidth = 0.8 + 1.8 * Math.pow(ringFraction, 0.95);
          const strokeOpacity = (0.20 + 0.75 * Math.pow(ringFraction, 0.98)) * fadeMultiplier;

          // Build the arc for this ring - INDEPENDENT SHAPE PER PETAL
          let d = "";
          const samples = 100;

          for (let s = 0; s <= samples; s++) {
            const u = s / samples;
            const angle = sectionStart + u * wedgeSize;

            // Create petal-specific shape (no shared valleys)
            // Use a local shape function that creates a petal form
            const localU = u; // 0 at start of petal, 1 at end

            // Create a shape that's narrow at edges, wide in middle
            // Using a combination of sine and power functions for a nice petal shape
            let petalShape;
            if (localU < 0.1) {
              // Moderately narrow start
              petalShape = Math.pow(localU / 0.1, 1.7) * 0.4 + 0.05;
            } else if (localU > 0.9) {
              // Moderately narrow end
              petalShape = Math.pow((1 - localU) / 0.1, 1.7) * 0.4 + 0.05;
            } else {
              // Fuller middle with slight squared-off top
              const middleU = (localU - 0.1) / 0.8;
              petalShape = 0.45 + 0.55 * Math.pow(Math.sin(middleU * Math.PI), 0.7);
            }

            // Base radius for this ring at this scaled progress
            const baseRadius = innerR + ringFraction * (outerR - innerR) * scaledProgress;

            // Apply the petal shape - medium base width
            const r = baseRadius * (0.20 + 0.80 * petalShape);

            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          }

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", d);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", strokeColor);
          path.setAttribute("stroke-width", strokeWidth.toString());
          path.setAttribute("stroke-opacity", strokeOpacity.toString());
          path.setAttribute("stroke-linecap", "round");
          path.setAttribute("stroke-linejoin", "round");

          container.appendChild(path);
        }

        // Add click handler for this section if onClick is provided
        if (onClick) {
          const clickArea = document.createElementNS("http://www.w3.org/2000/svg", "path");

          // Create a larger clickable area for this petal
          let clickPath = "";
          const clickSamples = 50;
          const clickRadius = outerR * 1.1; // Slightly larger than visible area

          for (let s = 0; s <= clickSamples; s++) {
            const u = s / clickSamples;
            const angle = sectionStart + u * wedgeSize;

            const localU = u;
            let petalShape;
            if (localU < 0.1) {
              petalShape = Math.pow(localU / 0.1, 1.7) * 0.4 + 0.05;
            } else if (localU > 0.9) {
              petalShape = Math.pow((1 - localU) / 0.1, 1.7) * 0.4 + 0.05;
            } else {
              const middleU = (localU - 0.1) / 0.8;
              petalShape = 0.45 + 0.55 * Math.pow(Math.sin(middleU * Math.PI), 0.7);
            }

            const r = clickRadius * (0.20 + 0.80 * petalShape);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            clickPath += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          }

          // Close the path by connecting back to center
          clickPath += ` L ${cx} ${cy} Z`;

          clickArea.setAttribute("d", clickPath);
          clickArea.setAttribute("fill", "transparent");
          clickArea.setAttribute("stroke", "none");
          clickArea.setAttribute("cursor", "pointer");
          clickArea.addEventListener("click", () => onClick(sectionIdx));

          container.appendChild(clickArea);
        }
      }
    };

    createFlowerProgress();
  }, [progressValues, size, onClick]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`-${size * 0.15} -${size * 0.15} ${size * 1.3} ${size * 1.3}`}
      className={className}
      shapeRendering="geometricPrecision"
      role="img"
      aria-label="5-petal flower progress display"
    >
      <g ref={containerRef} id="petals"></g>

      {/* Section Labels */}
      <g className="section-labels" style={{fontSize: size > 400 ? '12px' : '10px', fontFamily: 'var(--font-dm-sans)', fontWeight: '600', letterSpacing: '2px', fill: '#CCCCCC'}}>
        {(() => {
          const center = size / 2;
          const labelRadius = size * 0.6; // Position labels further outside to avoid cutoff

          // Map sections to their actual petal positions (no top petal)
          // Petal arrangement: Top-left, Top-right, Bottom-Right, Bottom, Bottom-Left
          const sectionPositions = [
            { name: 'PRE-GAME', angle: -3 * Math.PI / 4 },      // Top-left
            { name: 'IN-GAME', angle: -Math.PI / 4 },           // Top-right
            { name: 'POST-GAME', angle: Math.PI / 4 },          // Bottom-right
            { name: 'OFF COURT', angle: Math.PI / 2 },          // Bottom
            { name: 'LOCKER ROOM', angle: 3 * Math.PI / 4 }    // Bottom-left
          ];

          return sectionPositions.map((section, index) => {
            // Calculate label position
            const labelX = center + labelRadius * Math.cos(section.angle);
            const labelY = center + labelRadius * Math.sin(section.angle);

            return (
              <text
                key={index}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {section.name}
              </text>
            );
          });
        })()}
      </g>
    </svg>
  );
}