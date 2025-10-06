'use client';

import React from 'react';

interface OverallProgressCircleProps {
  percentage: number;
  level: string;
  size?: number;
  className?: string;
}

export default function OverallProgressCircle({
  percentage,
  level,
  size = 180,
  className = ""
}: OverallProgressCircleProps) {
  const radius = size * 0.4;
  const strokeWidth = size * 0.02;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />

          {/* Progress circle */}
          <circle
            stroke="#32CD32"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
            className="transition-all duration-1000 ease-out"
          />

          {/* Notches around the circle */}
          {[...Array(24)].map((_, i) => {
            const angle = (i * 15) * (Math.PI / 180);
            const innerRadius = normalizedRadius + strokeWidth / 2;
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
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
            <span className="text-yellow-400 text-xs font-semibold tracking-wide">{level}</span>
          </div>
          <div className="text-white text-4xl font-bold mb-1">{percentage}%</div>
          <div className="text-zinc-400 text-xs text-center leading-tight">
            OVR MENTAL<br />STRENGTH
          </div>
          <div className="mt-2 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
            ↑15%
          </div>
        </div>
      </div>
    </div>
  );
}