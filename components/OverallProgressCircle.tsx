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

          {/* Detailed notches around the circle */}
          {(() => {
            const notches = [];
            const notchRadius = normalizedRadius + strokeWidth / 2;

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
          <div className="flex items-center gap-1 mb-2">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path
                d="M6 1 L11 6 L6 11 L1 6 Z"
                fill="rgb(255, 220, 0)"
              />
            </svg>
            <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgb(255, 220, 0)' }}>{level}</span>
          </div>
          <div className="text-white text-5xl font-bold mb-3">{percentage}%</div>
          <div className="text-zinc-400 text-xs text-center leading-tight font-medium tracking-wider mb-3">
            OVR MENTAL<br />STRENGTH
          </div>
          <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold tracking-wide">
            ↑15%
          </div>
        </div>
      </div>
    </div>
  );
}