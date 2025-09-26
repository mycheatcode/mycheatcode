'use client';

import { useState, useEffect } from 'react';
import { EngagementEvent, InAppPrompt, Badge, ShareCardData } from '../app/utils/engagementSystem';

interface EngagementFeedbackProps {
  event?: EngagementEvent;
  eventData?: any;
  onDismiss?: () => void;
}

// Level-up banner for section upgrades
interface LevelUpBannerProps {
  newColor: 'yellow' | 'green';
  section: string;
  onDismiss: () => void;
}

function LevelUpBanner({ newColor, section, onDismiss }: LevelUpBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colorConfig = {
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' }
  };

  const { bg, border, text } = colorConfig[newColor];

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className={`${bg} ${border} border rounded-xl px-4 py-3 backdrop-blur-sm shadow-lg`}>
        <div className="flex items-center gap-3">
          <div className={`${text} text-sm font-semibold`}>
            Section elevated to {newColor.charAt(0).toUpperCase() + newColor.slice(1)}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-zinc-400 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// Demotion banner for section downgrades
interface DemotionBannerProps {
  newColor: 'red' | 'orange' | 'yellow';
  section: string;
  longestHold?: number;
  onDismiss: () => void;
}

function DemotionBanner({ newColor, section, longestHold, onDismiss }: DemotionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colorConfig = {
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' }
  };

  const { bg, border, text } = colorConfig[newColor];

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className={`${bg} ${border} border rounded-xl px-4 py-3 backdrop-blur-sm shadow-lg max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className={`${text} text-sm font-semibold mb-1`}>
              Dropped to {newColor.charAt(0).toUpperCase() + newColor.slice(1)}
            </div>
            {longestHold && longestHold > 0 && (
              <div className="text-zinc-400 text-xs">
                Longest Green Hold: {longestHold} day{longestHold !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-zinc-400 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// In-app prompt slide-up
interface InAppPromptComponentProps {
  prompt: InAppPrompt;
  onAction?: () => void;
  onDismiss: () => void;
}

function InAppPromptComponent({ prompt, onAction, onDismiss }: InAppPromptComponentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const priorityColors = {
    low: 'bg-zinc-800/50 border-zinc-700/50',
    medium: 'bg-blue-500/10 border-blue-500/30',
    high: 'bg-orange-500/10 border-orange-500/30'
  };

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`${priorityColors[prompt.priority]} border rounded-xl p-4 backdrop-blur-sm shadow-lg`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm mb-1">{prompt.title}</h4>
            <p className="text-zinc-300 text-sm">{prompt.message}</p>
          </div>
          <div className="flex items-center gap-2">
            {prompt.actionLabel && onAction && (
              <button
                onClick={onAction}
                className="bg-white text-black px-3 py-1 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                {prompt.actionLabel}
              </button>
            )}
            {prompt.dismissible && (
              <button
                onClick={handleDismiss}
                className="text-zinc-400 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Badge unlock modal
interface BadgeModalProps {
  badge: Badge;
  onShare?: () => void;
  onDismiss: () => void;
}

function BadgeModal({ badge, onShare, onDismiss }: BadgeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const accentColors = {
    silver: 'text-zinc-300',
    gold: 'text-yellow-400',
    green: 'text-green-400',
    neutral: 'text-white'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
              <div className={`text-2xl ${accentColors[badge.accentColor]}`}>
                {badge.iconType === 'geometric' ? '◆' :
                 badge.iconType === 'line-art' ? '◇' : '●'}
              </div>
            </div>
            <h3 className="text-white text-lg font-bold mb-2">{badge.name}</h3>
            <p className="text-zinc-400 text-sm">{badge.description}</p>
          </div>

          <div className="flex gap-3">
            {onShare && (
              <button
                onClick={onShare}
                className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors"
              >
                Share
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex-1 bg-white/10 text-white py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main engagement feedback component
export default function EngagementFeedback({ event, eventData, onDismiss }: EngagementFeedbackProps) {
  if (!event || !eventData) return null;

  switch (event) {
    case 'section_upgraded':
      return (
        <LevelUpBanner
          newColor={eventData.newColor}
          section={eventData.section}
          onDismiss={onDismiss!}
        />
      );

    case 'section_demoted':
      return (
        <DemotionBanner
          newColor={eventData.newColor}
          section={eventData.section}
          longestHold={eventData.longestHold}
          onDismiss={onDismiss!}
        />
      );

    case 'badge_earned':
      return (
        <BadgeModal
          badge={eventData.badge}
          onShare={eventData.onShare}
          onDismiss={onDismiss!}
        />
      );

    default:
      return null;
  }
}

// Hook for managing engagement feedback
export function useEngagementFeedback() {
  const [activeEvent, setActiveEvent] = useState<{
    event: EngagementEvent;
    eventData: any;
  } | null>(null);

  const showFeedback = (event: EngagementEvent, eventData: any) => {
    setActiveEvent({ event, eventData });
  };

  const dismissFeedback = () => {
    setActiveEvent(null);
  };

  return {
    activeEvent,
    showFeedback,
    dismissFeedback
  };
}