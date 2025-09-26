'use client';

import { useState, useEffect } from 'react';
import { Section } from '../app/utils/progressionSystem';

interface SectionRingProps {
  section: Section;
  score: number; // 0-100
  color: 'red' | 'orange' | 'yellow' | 'green';
  size?: 'small' | 'medium' | 'large';
  showGlow?: boolean;
  isAnimating?: boolean;
  greenHoldDays?: number;
  className?: string;
}

export default function SectionRing({
  section,
  score,
  color,
  size = 'medium',
  showGlow = false,
  isAnimating = false,
  greenHoldDays,
  className = ''
}: SectionRingProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger pulse animation when score changes
  useEffect(() => {
    if (isAnimating) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, score]);

  // Size configurations
  const sizeConfig = {
    small: { ring: 60, stroke: 4, font: 'text-xs' },
    medium: { ring: 80, stroke: 6, font: 'text-sm' },
    large: { ring: 120, stroke: 8, font: 'text-base' }
  };

  const { ring, stroke, font } = sizeConfig[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color configurations with premium styling
  const colorConfig = {
    red: {
      stroke: '#EF4444',
      glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      bg: 'bg-red-500/10'
    },
    orange: {
      stroke: '#F97316',
      glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]',
      bg: 'bg-orange-500/10'
    },
    yellow: {
      stroke: '#EAB308',
      glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]',
      bg: 'bg-yellow-500/10'
    },
    green: {
      stroke: '#22C55E',
      glow: 'drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]',
      bg: 'bg-green-500/10'
    }
  };

  const { stroke: strokeColor, glow, bg } = colorConfig[color];

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* SVG Ring */}
      <div className="relative">
        <svg
          width={ring}
          height={ring}
          className={`transform -rotate-90 transition-all duration-300 ease-out ${
            showGlow ? glow : ''
          } ${
            isPulsing ? 'animate-pulse scale-105' : ''
          }`}
        >
          {/* Background circle */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={stroke}
            fill="none"
          />

          {/* Progress circle */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-white font-bold ${font}`}>{score}%</div>
          {size !== 'small' && (
            <div className="text-zinc-400 text-xs uppercase tracking-wide">
              {section.replace('-', ' ')}
            </div>
          )}
        </div>
      </div>

      {/* Green Hold Timer */}
      {color === 'green' && greenHoldDays !== undefined && greenHoldDays > 0 && (
        <div className="mt-2 text-center">
          <div className="text-green-400 text-xs font-semibold">
            Green Hold: {greenHoldDays} day{greenHoldDays !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Upgrade/Demotion Banner */}
      {isPulsing && (
        <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${bg} border border-current/20 whitespace-nowrap`}>
          <span style={{ color: strokeColor }}>
            Section elevated to {color.charAt(0).toUpperCase() + color.slice(1)}
          </span>
        </div>
      )}
    </div>
  );
}