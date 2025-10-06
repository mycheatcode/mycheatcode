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

          {/* Notches around the circle */}
          {[...Array(24)].map((_, i) => {
            const angle = (i * 15) * (Math.PI / 180);
            const innerRadius = radius + strokeWidth;
            const outerRadius = innerRadius + size * 0.03;

            const x1 = size / 2 + innerRadius * Math.cos(angle);
            const y1 = size / 2 + innerRadius * Math.sin(angle);
            const x2 = size / 2 + outerRadius * Math.cos(angle);
            const y2 = size / 2 + outerRadius * Math.sin(angle);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={1}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-white text-6xl font-bold mb-1">{streakDays}</div>
          <div className="text-zinc-400 text-sm font-medium tracking-wider">DAY</div>
          <div className="text-zinc-500 text-xs tracking-wider">STREAK</div>
        </div>
      </div>
    </div>
  );
}