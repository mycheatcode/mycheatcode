'use client';

import React from 'react';

interface StreakDisplayProps {
  streakDays: number;
  size?: number;
  className?: string;
}

export default function StreakDisplay({
  streakDays,
  size = 180,
  className = ""
}: StreakDisplayProps) {
  const radius = size * 0.4;
  const strokeWidth = size * 0.015;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />

          {/* Detailed notches around the circle */}
          {(() => {
            const notches = [];
            const notchRadius = radius + strokeWidth / 2;

            for (let deg = 0; deg < 360; deg += 3) {
              const angle = (deg * Math.PI / 180) - Math.PI / 2;

              // Determine notch type based on degree
              let length: number, width: number, opacity: number, color: string;

              if (deg % 30 === 0) {
                // Major notches every 30 degrees
                length = size * 0.033;
                width = size * 0.005;
                opacity = 0.9;
                color = '#ffffff';
              } else if (deg % 15 === 0) {
                // Medium notches every 15 degrees
                length = size * 0.023;
                width = size * 0.0033;
                opacity = 0.5;
                color = '#cccccc';
              } else if (deg % 6 === 0) {
                // Minor notches every 6 degrees
                length = size * 0.013;
                width = size * 0.0025;
                opacity = 0.3;
                color = '#888888';
              } else {
                continue;
              }

              const startR = notchRadius + size * 0.058;
              const endR = startR + length;

              const x1 = size / 2 + startR * Math.cos(angle);
              const y1 = size / 2 + startR * Math.sin(angle);
              const x2 = size / 2 + endR * Math.cos(angle);
              const y2 = size / 2 + endR * Math.sin(angle);

              notches.push(
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={width}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                />
              );
            }

            return notches;
          })()}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-white font-bold mb-1" style={{ fontSize: `${size * 0.33}px` }}>{streakDays}</div>
          <div className="text-zinc-400 font-medium tracking-wider" style={{ fontSize: `${size * 0.077}px` }}>DAY</div>
          <div className="text-zinc-500 tracking-wider" style={{ fontSize: `${size * 0.066}px` }}>STREAK</div>
        </div>
      </div>
    </div>
  );
}