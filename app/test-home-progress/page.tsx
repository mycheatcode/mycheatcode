'use client';

import { useState } from 'react';
import ProgressCircles from '@/components/ProgressCircles';

export default function TestHomeProgressPage() {
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulated progress values
  const previousProgress = 45;
  const newProgress = 48;
  const gain = newProgress - previousProgress;

  const animations = [
    {
      id: 'current',
      name: 'Current Implementation',
      description: 'Full-screen overlay with large text, then returns to home page',
    },
    {
      id: 'pulse-in-place',
      name: 'Pulse In Place',
      description: 'Progress circle pulses and shows +% gain on the home page itself',
    },
    {
      id: 'spotlight',
      name: 'Spotlight Focus',
      description: 'Dims everything except progress circle, shows gain, then reveals page',
    },
    {
      id: 'slide-reveal',
      name: 'Slide & Reveal',
      description: 'Progress slides up with gain displayed, then settles into place',
    },
  ];

  const showAnimation = (animationId: string) => {
    setActiveAnimation(animationId);
    setIsAnimating(true);

    // Auto-dismiss after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 3000);
  };

  const dismissAnimation = () => {
    setIsAnimating(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: '#2a2a2a' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#00ff41' }}>
          Home Page Progress Animation Test Lab
        </h1>
        <p className="text-sm" style={{ color: '#888888' }}>
          Testing different animations for when user returns to home page with momentum gain
        </p>
      </div>

      {/* Animation Options Grid */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {animations.map((animation) => (
            <button
              key={animation.id}
              onClick={() => showAnimation(animation.id)}
              className="p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: activeAnimation === animation.id ? 'rgba(0, 255, 65, 0.1)' : '#0a0a0a',
                borderColor: activeAnimation === animation.id ? '#00ff41' : '#2a2a2a',
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>
                {animation.name}
              </h3>
              <p className="text-sm" style={{ color: '#888888' }}>
                {animation.description}
              </p>
              {activeAnimation === animation.id && (
                <div className="mt-3 text-xs font-semibold" style={{ color: '#00ff41' }}>
                  ● ACTIVE
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Home Page */}
      <div className="flex flex-col items-center flex-1 px-4 pt-8 pb-4 relative justify-between max-w-[430px] lg:max-w-[600px] mx-auto w-full min-h-[600px]">
        {/* Progress Section - Centered and Larger */}
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          {/* Your Momentum Label */}
          <div className="text-center mb-2">
            <div className="text-sm font-semibold uppercase tracking-[1px]" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              YOUR MOMENTUM
            </div>
          </div>

          {/* Current Implementation - Full Screen Overlay */}
          {activeAnimation === 'current' && isAnimating && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                animation: 'fade-in 0.3s ease-out',
              }}
              onClick={dismissAnimation}
            >
              <div className="text-center" onClick={(e) => e.stopPropagation()}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </div>
                <div className="text-6xl font-bold mb-4" style={{ color: '#00ff41', animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  +{gain}%
                </div>
                <div className="text-2xl font-semibold" style={{ color: '#ffffff' }}>
                  Momentum Gained!
                </div>
              </div>
            </div>
          )}

          {/* Spotlight Focus - Background Overlay */}
          {activeAnimation === 'spotlight' && isAnimating && (
            <div
              className="fixed inset-0 z-[90]"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                animation: 'fade-in 0.3s ease-out',
              }}
              onClick={dismissAnimation}
            />
          )}

          {/* Always visible Progress Circle - with conditional animations */}
          <div className={`w-[min(400px,85vw)] aspect-square -my-8 relative ${
            activeAnimation === 'spotlight' && isAnimating ? 'z-[100]' : ''
          } ${
            activeAnimation === 'slide-reveal' ? 'overflow-visible' : ''
          }`}>
            <div className={
              activeAnimation === 'pulse-in-place' && isAnimating ? 'pulse-container' :
              activeAnimation === 'spotlight' && isAnimating ? 'spotlight-glow' :
              activeAnimation === 'slide-reveal' && isAnimating ? 'slide-reveal-grow' :
              ''
            }>
              <ProgressCircles
                theme="dark"
                progress={newProgress}
                onProgressUpdate={() => {}}
              />
            </div>

            {/* Pulse In Place - Overlay Text */}
            {activeAnimation === 'pulse-in-place' && isAnimating && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: 'fade-in-out 2.5s ease-in-out' }}
              >
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: '#00ff41', animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    +{gain}%
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>
                    Momentum
                  </div>
                </div>
              </div>
            )}

            {/* Spotlight Focus - Overlay Text */}
            {activeAnimation === 'spotlight' && isAnimating && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: 'scale-in-out 2.5s ease-in-out' }}
              >
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2" style={{ color: '#00ff41' }}>
                    +{gain}%
                  </div>
                  <div className="text-base font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>
                    Momentum Gained
                  </div>
                </div>
              </div>
            )}

            {/* Slide & Reveal - Card Overlay */}
            {activeAnimation === 'slide-reveal' && isAnimating && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: 'slide-up-fade 2.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div
                  className="px-8 py-6 rounded-3xl text-center"
                  style={{
                    backgroundColor: 'rgba(0, 255, 65, 0.15)',
                    border: '2px solid #00ff41',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="text-5xl font-bold mb-2" style={{ color: '#00ff41' }}>
                    +{gain}%
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>
                    Momentum Gained
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Percentage */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-1" style={{ color: '#ffffff' }}>
              {newProgress}%
            </div>
            <p className="text-sm" style={{ color: '#888888' }}>
              Elite players stay above 85%
            </p>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          80% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.9);
          }
        }

        @keyframes pop {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scale-in-out {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
          70% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        @keyframes slide-up-fade {
          0% {
            opacity: 0;
            transform: translateY(100px);
          }
          30% {
            opacity: 1;
            transform: translateY(0);
          }
          70% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }

        .pulse-container {
          animation: pulse-scale 2.5s ease-in-out;
        }

        @keyframes pulse-scale {
          0% {
            transform: scale(1);
          }
          15% {
            transform: scale(1.05);
          }
          30% {
            transform: scale(1);
          }
          45% {
            transform: scale(1.05);
          }
          60% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }

        .spotlight-glow {
          animation: glow-pulse 2.5s ease-in-out;
          filter: drop-shadow(0 0 30px rgba(0, 255, 65, 0.4));
        }

        @keyframes glow-pulse {
          0% {
            filter: drop-shadow(0 0 0px rgba(0, 255, 65, 0));
          }
          20% {
            filter: drop-shadow(0 0 40px rgba(0, 255, 65, 0.6));
          }
          80% {
            filter: drop-shadow(0 0 40px rgba(0, 255, 65, 0.6));
          }
          100% {
            filter: drop-shadow(0 0 0px rgba(0, 255, 65, 0));
          }
        }

        .slide-reveal-grow {
          animation: grow-bounce 2.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes grow-bounce {
          0% {
            transform: translateY(30px) scale(0.85);
            opacity: 0.7;
          }
          30% {
            transform: translateY(0) scale(1.08);
            opacity: 1;
          }
          50% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
