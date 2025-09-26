'use client';

import { useState, useRef } from 'react';
import { ShareCardData } from '../app/utils/engagementSystem';
import HomepageRadar from './HomepageRadar';

// Helper function to determine level based on overall percentage
function getPerformanceLevel(percentage: number): string {
  if (percentage >= 75) return 'Limitless';
  if (percentage >= 50) return 'Elevated';
  if (percentage >= 25) return 'Rising';
  return 'Activated';
}

interface ShareCardProps {
  data: ShareCardData;
  onShare?: (platform: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ShareCard({ data, onShare, onDismiss, className = '' }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  const handleShare = async (platform: string) => {
    if (onShare) {
      onShare(platform);
    }

    // Generate share text based on card type
    const shareTexts = {
      green_hold: `${data.title} in ${data.subtitle} 💚 Locked in with mycheatcode.ai`,
      full_radar: `${data.title} 🎯 Locked In. No Days Off. Built with mycheatcode.ai`,
      milestone: `${data.title} - ${data.subtitle} Built with mycheatcode.ai`,
      radar_snapshot: `${data.title} 🎯 Section Snapshot Built with mycheatcode.ai`
    };

    const text = shareTexts[data.type] || `${data.title} - Built with mycheatcode.ai`;

    // Share based on platform
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct text sharing, so copy to clipboard
        await navigator.clipboard.writeText(text);
        alert('Share text copied to clipboard! Paste it in your Instagram story.');
        break;
      case 'messages':
        if (navigator.share) {
          navigator.share({ text });
        } else {
          await navigator.clipboard.writeText(text);
          alert('Share text copied to clipboard!');
        }
        break;
      default:
        await navigator.clipboard.writeText(text);
        break;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Share Card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-8 max-w-sm w-full relative overflow-hidden"
        >

          {/* Brand Mark in Top Left */}
          <div className="absolute top-4 left-4 text-zinc-500 text-xs uppercase tracking-wide font-medium">
            mycheatcode.ai
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Visual Element - Exact Homepage Radar */}
            <div className="mb-6">
              <div className="relative w-72 h-72 mx-auto mb-4">
                <HomepageRadar
                  radarData={data.visualData?.radarData ? {
                    preGame: data.visualData.radarData.preGame,
                    preGameColor: data.visualData.radarData.preGameColor,
                    inGame: data.visualData.radarData.inGame,
                    inGameColor: data.visualData.radarData.inGameColor,
                    postGame: data.visualData.radarData.postGame,
                    postGameColor: data.visualData.radarData.postGameColor,
                    offCourt: data.visualData.radarData.offCourt,
                    offCourtColor: data.visualData.radarData.offCourtColor,
                    lockerRoom: data.visualData.radarData.lockerRoom,
                    lockerRoomColor: data.visualData.radarData.lockerRoomColor
                  } : {
                    preGame: data.type === 'full_radar' ? 100 : 85,
                    preGameColor: 'green',
                    inGame: data.type === 'full_radar' ? 100 : 75,
                    inGameColor: 'green',
                    postGame: data.type === 'full_radar' ? 100 : 90,
                    postGameColor: 'green',
                    offCourt: data.type === 'full_radar' ? 100 : 80,
                    offCourtColor: 'green',
                    lockerRoom: data.type === 'full_radar' ? 100 : 70,
                    lockerRoomColor: 'green'
                  }}
                  size="medium"
                  showLabels={false}
                  showGreenHoldBadges={false}
                  disableAnimations={true}
                />

                {/* Center highlight for specific achievements */}
                {data.type === 'green_hold' && data.visualData?.greenHoldDays && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-green-400 text-3xl font-bold">{data.visualData.greenHoldDays}</div>
                      <div className="text-green-400 text-xs font-medium uppercase tracking-wide">Days</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Overall Stats and Key Features */}
              {data.type === 'radar_snapshot' && data.visualData?.radarData && (
                <div className="flex justify-center items-center gap-8 mb-4">
                  {/* Overall Average */}
                  <div className="text-center">
                    <div className="text-xs text-zinc-400 mb-1">Overall Average</div>
                    <div className="text-xl font-bold text-white">
                      {Math.round((
                        data.visualData.radarData.preGame +
                        data.visualData.radarData.inGame +
                        data.visualData.radarData.postGame +
                        data.visualData.radarData.offCourt +
                        data.visualData.radarData.lockerRoom
                      ) / 5)}%
                    </div>
                  </div>

                  {/* Green Sections Count or Longest Streak */}
                  <div className="text-center">
                    {(() => {
                      const greenSections = [
                        data.visualData.radarData.preGameColor,
                        data.visualData.radarData.inGameColor,
                        data.visualData.radarData.postGameColor,
                        data.visualData.radarData.offCourtColor,
                        data.visualData.radarData.lockerRoomColor
                      ].filter(color => color === 'green').length;

                      const longestGreenHold = Math.max(
                        0,
                        ...(data.visualData.greenHoldData ? Object.values(data.visualData.greenHoldData) : [])
                      );

                      if (longestGreenHold > 0) {
                        return (
                          <>
                            <div className="text-xs text-zinc-400 mb-1">Longest Streak</div>
                            <div className="text-xl font-bold text-green-500">
                              {longestGreenHold}d
                            </div>
                          </>
                        );
                      } else if (greenSections > 0) {
                        return (
                          <>
                            <div className="text-xs text-zinc-400 mb-1">Green Sections</div>
                            <div className="text-xl font-bold text-green-500">
                              {greenSections}/5
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <div className="text-xs text-zinc-400 mb-1">Building</div>
                            <div className="text-xl font-bold text-zinc-500">
                              Progress
                            </div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Section-specific highlight */}
              {data.type === 'milestone' && data.subtitle && (
                <div className="text-green-400 text-sm font-semibold text-center">
                  {data.subtitle} → Green
                </div>
              )}
            </div>

            {/* Text */}
            <div className="mb-6">
              <h2 className="text-white text-2xl font-bold mb-2 leading-tight">
                {data.type === 'radar_snapshot' && data.visualData?.radarData ? (
                  (() => {
                    const overallPercentage = Math.round((
                      data.visualData.radarData.preGame +
                      data.visualData.radarData.inGame +
                      data.visualData.radarData.postGame +
                      data.visualData.radarData.offCourt +
                      data.visualData.radarData.lockerRoom
                    ) / 5);
                    return getPerformanceLevel(overallPercentage);
                  })()
                ) : (
                  data.title
                )}
              </h2>
              <p className="text-zinc-300 text-sm font-medium">
                {data.type === 'radar_snapshot' ? 'My Status' : data.subtitle}
              </p>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleShare('twitter')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button
              onClick={() => handleShare('instagram')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </button>
            <button
              onClick={() => handleShare('messages')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.626 0 12-4.974 12-11.11C24 4.975 18.626.001 12.001.001z"/>
              </svg>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleShare('copy')}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Copy Link
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing share cards
export function useShareCard() {
  const [activeCard, setActiveCard] = useState<ShareCardData | null>(null);

  const showShareCard = (data: ShareCardData) => {
    setActiveCard(data);
  };

  const dismissShareCard = () => {
    setActiveCard(null);
  };

  return {
    activeCard,
    showShareCard,
    dismissShareCard
  };
}