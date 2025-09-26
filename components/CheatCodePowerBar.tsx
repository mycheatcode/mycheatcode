'use client';

import { CheatCodePower, getPowerColor, getNextPowerMilestone } from '../app/utils/cheatCodePowerSystem';

interface CheatCodePowerBarProps {
  cheatCode: CheatCodePower;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CheatCodePowerBar({
  cheatCode,
  showDetails = true,
  size = 'medium'
}: CheatCodePowerBarProps) {
  const powerColor = getPowerColor(cheatCode.powerPercentage);
  const nextMilestone = getNextPowerMilestone(cheatCode.powerPercentage);

  // Size configurations
  const sizeConfig = {
    small: {
      height: 'h-2',
      textSize: 'text-xs',
      spacing: 'space-y-1'
    },
    medium: {
      height: 'h-3',
      textSize: 'text-sm',
      spacing: 'space-y-2'
    },
    large: {
      height: 'h-4',
      textSize: 'text-base',
      spacing: 'space-y-3'
    }
  };

  const config = sizeConfig[size];

  // Get boost indicators (only show fresh boost, honeymoon is invisible)
  const getBoostIndicator = () => {
    if (cheatCode.freshCodeBonusUsed < 2) {
      return (
        <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
          New Code Bonus
        </span>
      );
    }
    return null;
  };

  // Time since last use
  const getTimeSinceLastUse = () => {
    const now = Date.now();
    const diffMs = now - cheatCode.lastUsedTimestamp;
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMinutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  return (
    <div className={`${config.spacing}`}>
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`${config.textSize} font-medium text-white`}>
              {cheatCode.cheatCodeName}
            </span>
            {getBoostIndicator()}
          </div>
          <div className="flex items-center gap-2">
            <span className={`${config.textSize} font-bold`} style={{ color: powerColor }}>
              {Math.round(cheatCode.powerPercentage)}%
            </span>
            <span className="text-xs text-zinc-500">
              {cheatCode.totalLogs} logs
            </span>
          </div>
        </div>
      )}

      {/* Power bar */}
      <div className={`w-full bg-zinc-800 rounded-full ${config.height} overflow-hidden`}>
        {/* Background gradient track */}
        <div
          className={`${config.height} bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500 opacity-20 w-full`}
        ></div>

        {/* Actual power fill */}
        <div
          className={`${config.height} rounded-full transition-all duration-500 ease-out relative -mt-${config.height.split('-')[1]}`}
          style={{
            width: `${cheatCode.powerPercentage}%`,
            backgroundColor: powerColor,
            boxShadow: `0 0 8px ${powerColor}40`
          }}
        >
          {/* Shine effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${config.height} rounded-full animate-pulse`}></div>
        </div>
      </div>

      {/* Next milestone and additional info */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div>
            {nextMilestone ? (
              <span>Next: {nextMilestone.name} ({nextMilestone.target}%)</span>
            ) : (
              <span className="text-green-400 font-medium">✨ Mastery Achieved!</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{getTimeSinceLastUse()}</span>
            {/* Decay warning */}
            {(Date.now() - cheatCode.lastUsedTimestamp) > (24 * 60 * 60 * 1000) && (
              <span className="text-red-400">⚠️</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}