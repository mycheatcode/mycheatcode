'use client';

import { Section } from '../app/utils/progressionSystem';
import { useSectionRadar } from '../app/utils/useSectionRadar';

interface SectionProgressModalProps {
  section: Section;
  onClose: () => void;
}

export default function SectionProgressModal({ section, onClose }: SectionProgressModalProps) {
  const {
    getSectionScore,
    getSectionTarget,
    getSectionColorAsHex,
    getSectionStats,
    getGreenHold,
    getSectionConsistency,
    getSectionDecayStatus
  } = useSectionRadar();

  const sectionScore = getSectionScore(section);
  const sectionStats = getSectionStats(section);
  const nextTarget = getSectionTarget(section);
  const greenHold = getGreenHold(section);
  const consistency = getSectionConsistency(section);
  const decayStatus = getSectionDecayStatus(section);

  if (!sectionScore) return null;

  const { color, score } = sectionScore;
  const colorHex = getSectionColorAsHex(section);

  const getColorName = (color: string) => {
    const colorMap = {
      red: 'Red (Foundation)',
      orange: 'Orange (Rising)',
      yellow: 'Yellow (Elevated)',
      green: 'Green (Limitless)'
    };
    return colorMap[color as keyof typeof colorMap] || color;
  };

  const getProgressDescription = () => {
    if (color === 'green') {
      if (greenHold.hasActiveHold) {
        return `You've reached Green! Currently held for ${greenHold.formattedDuration}. Maintain consistency to keep this status.`;
      }
      return "You've reached the highest level! Maintain consistency to keep this status.";
    }
    if (nextTarget) {
      const { nextColor, scoreNeeded, logsNeeded, codesNeeded } = nextTarget;
      const requirements = [];
      if (scoreNeeded > 0) requirements.push(`${scoreNeeded} more power points`);
      if (logsNeeded > 0) requirements.push(`${logsNeeded} more logs`);
      if (codesNeeded > 0) requirements.push(`${codesNeeded} more unique cheat codes`);

      if (nextColor) {
        return `To reach ${getColorName(nextColor)}: ${requirements.join(' and ')}`;
      }
    }
    return '';
  };

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{section}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colorHex }}
            ></div>
            <span className="text-white font-semibold text-lg">{getColorName(color)}</span>
          </div>
          <p className="text-zinc-400 text-sm">{getProgressDescription()}</p>
        </div>

        {/* Enhanced Green Hold Timer */}
        {color === 'green' && greenHold.hasActiveHold && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-green-500/5 blur-xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-bold uppercase tracking-wide">Green Hold</span>
                </div>
                <div className="text-zinc-400 text-xs font-medium">
                  Active
                </div>
              </div>

              <div className="text-white text-3xl font-bold mb-2 leading-none">
                {greenHold.formattedDuration}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-zinc-300 text-sm">
                  Current hold streak
                </div>
                {greenHold.nextMilestone && (
                  <div className="text-green-400 text-xs font-semibold">
                    Next: {greenHold.nextMilestone.name}
                  </div>
                )}
              </div>

              {/* Progress indicator */}
              <div className="mb-3">
                <div className="w-full bg-zinc-800/50 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full transition-all duration-700 ease-out animate-pulse"></div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-zinc-500 text-xs">
                Started: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Frozen Hold Display (when dropped from Green) */}
        {color !== 'green' && (
          <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span className="text-zinc-400 text-sm font-semibold uppercase tracking-wide">Longest Hold</span>
            </div>
            <div className="text-zinc-300 text-xl font-bold mb-1">
              14 days
            </div>
            <div className="text-zinc-500 text-xs">
              Previous Green Hold record
            </div>
          </div>
        )}

        {/* Consistency Status for Green Sections */}
        {color === 'green' && (
          <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Green Maintenance</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Active Days (7-day window)</span>
                <span className={`font-semibold ${
                  consistency.activeDaysInWeek >= 4 ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {consistency.activeDaysInWeek}/7
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">7-Day Streak</span>
                <span className={`font-semibold ${
                  consistency.hasSevenDayStreak ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {consistency.hasSevenDayStreak ? '✓ Active' : '✗ Broken'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Consecutive Inactive Days</span>
                <span className={`font-semibold ${
                  consistency.consecutiveInactiveDays < 2 ? 'text-green-400' :
                  consistency.consecutiveInactiveDays === 2 ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {consistency.consecutiveInactiveDays}
                  {consistency.consecutiveInactiveDays >= 2 && ' ⚠️'}
                </span>
              </div>
              {consistency.graceDeadline && (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="text-orange-400 text-xs font-semibold">
                    ⏰ Grace Period: Drop to Yellow if no activity by {new Date(consistency.graceDeadline).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Stats */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Section Score</span>
            <span className="text-white font-semibold">{score}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Active Cheat Codes</span>
            <span className="text-white font-semibold">{sectionStats.activeCodesCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Total Logs</span>
            <span className="text-white font-semibold">{sectionStats.totalValidLogs}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Unique Cheat Codes</span>
            <span className="text-white font-semibold">{sectionStats.uniqueCodesUsed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Daily Logs Remaining</span>
            <span className="text-white font-semibold">{sectionStats.remainingDailyLogs}/3</span>
          </div>
        </div>

        {/* Decay Status */}
        {decayStatus.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Cheat Code Health</h3>
            <div className="space-y-2">
              {decayStatus.slice(0, 3).map(({ cheatCodeId, cheatCodeName, decayStatus: decay }) => (
                <div key={cheatCodeId} className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-300 text-xs font-medium truncate">{cheatCodeName}</span>
                  <div className="flex items-center gap-1">
                    {decay.isDecaying ? (
                      <span className="text-red-400 text-xs">🔋 Decaying</span>
                    ) : decay.isInDanger ? (
                      <span className="text-orange-400 text-xs">⚠️ {Math.ceil(decay.timeUntilDecay / (60 * 60 * 1000))}h</span>
                    ) : (
                      <span className="text-green-400 text-xs">✓ Active</span>
                    )}
                  </div>
                </div>
              ))}
              {decayStatus.length > 3 && (
                <div className="text-zinc-500 text-xs text-center">+{decayStatus.length - 3} more codes</div>
              )}
            </div>
          </div>
        )}

        {/* Progress Milestones */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Progression Milestones</h3>
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${
              sectionStats.totalValidLogs >= 2 && sectionStats.uniqueCodesUsed >= 1 ? 'text-orange-500' : 'text-zinc-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                sectionStats.totalValidLogs >= 2 && sectionStats.uniqueCodesUsed >= 1 ? 'bg-orange-500' : 'bg-zinc-600'
              }`}></div>
              Orange: 2 logs, 1 cheat code (25% avg power)
            </div>
            <div className={`flex items-center gap-2 ${
              sectionStats.totalValidLogs >= 6 && sectionStats.uniqueCodesUsed >= 2 ? 'text-yellow-400' : 'text-zinc-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                sectionStats.totalValidLogs >= 6 && sectionStats.uniqueCodesUsed >= 2 ? 'bg-yellow-400' : 'bg-zinc-600'
              }`}></div>
              Yellow: 6 logs, 2 cheat codes (50% avg power)
            </div>
            <div className={`flex items-center gap-2 ${
              sectionStats.totalValidLogs >= 12 && sectionStats.uniqueCodesUsed >= 3 ? 'text-green-500' : 'text-zinc-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                sectionStats.totalValidLogs >= 12 && sectionStats.uniqueCodesUsed >= 3 ? 'bg-green-500' : 'bg-zinc-600'
              }`}></div>
              Green: 12 logs, 3 cheat codes (75% avg power)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          <button
            onClick={() => {
              localStorage.setItem('selectedCategory', section);
              onClose();
              window.location.href = '/my-codes';
            }}
            className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-100 transition-colors"
          >
            View Codes
          </button>
        </div>
      </div>
    </div>
  );
}