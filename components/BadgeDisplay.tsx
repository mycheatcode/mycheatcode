'use client';

import { Badge, AVAILABLE_BADGES } from '../app/utils/engagementSystem';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  className?: string;
}

export function BadgeDisplay({ badge, size = 'medium', showDescription = false, className = '' }: BadgeDisplayProps) {
  const sizeConfig = {
    small: { container: 'w-8 h-8', icon: 'text-sm', font: 'text-xs' },
    medium: { container: 'w-12 h-12', icon: 'text-lg', font: 'text-sm' },
    large: { container: 'w-16 h-16', icon: 'text-2xl', font: 'text-base' }
  };

  const { container, icon, font } = sizeConfig[size];

  const accentColors = {
    silver: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20',
    gold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    neutral: 'text-white bg-white/10 border-white/20'
  };

  const iconSymbols = {
    geometric: '◆',
    'line-art': '◇',
    metallic: '●'
  };

  const colorClass = badge.isUnlocked
    ? accentColors[badge.accentColor]
    : 'text-zinc-600 bg-zinc-600/10 border-zinc-600/20';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${container} rounded-full border ${colorClass} flex items-center justify-center ${
        badge.isUnlocked ? '' : 'opacity-50'
      }`}>
        <div className={icon}>
          {iconSymbols[badge.iconType]}
        </div>
      </div>

      {(size !== 'small' || showDescription) && (
        <div className="flex-1">
          <div className={`font-semibold ${font} ${badge.isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
            {badge.name}
          </div>
          {showDescription && (
            <div className={`text-xs ${badge.isUnlocked ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed`}>
              {badge.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AchievementsGridProps {
  unlockedBadges: Record<string, Badge>;
  className?: string;
}

export function AchievementsGrid({ unlockedBadges, className = '' }: AchievementsGridProps) {
  const allBadges = Object.keys(AVAILABLE_BADGES).map(badgeId => {
    const unlocked = unlockedBadges[badgeId];
    return unlocked || {
      ...AVAILABLE_BADGES[badgeId],
      isUnlocked: false
    };
  });

  // Sort badges: unlocked first, then by name
  const sortedBadges = allBadges.sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">Achievements</h2>
        <div className="text-zinc-400 text-sm">
          {Object.keys(unlockedBadges).length} of {Object.keys(AVAILABLE_BADGES).length}
        </div>
      </div>

      <div className="grid gap-3">
        {sortedBadges.map(badge => (
          <BadgeDisplay
            key={badge.id}
            badge={badge}
            size="medium"
            showDescription={true}
            className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors"
          />
        ))}
      </div>
    </div>
  );
}

// Compact badge strip for profile/header
interface BadgeStripProps {
  unlockedBadges: Record<string, Badge>;
  maxVisible?: number;
  className?: string;
}

export function BadgeStrip({ unlockedBadges, maxVisible = 5, className = '' }: BadgeStripProps) {
  const badges = Object.values(unlockedBadges)
    .filter(badge => badge.isUnlocked)
    .sort((a, b) => (b.unlockedTimestamp || 0) - (a.unlockedTimestamp || 0))
    .slice(0, maxVisible);

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {badges.map(badge => (
        <BadgeDisplay
          key={badge.id}
          badge={badge}
          size="small"
        />
      ))}
      {Object.keys(unlockedBadges).length > maxVisible && (
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-zinc-400 text-xs font-medium">
            +{Object.keys(unlockedBadges).length - maxVisible}
          </span>
        </div>
      )}
    </div>
  );
}