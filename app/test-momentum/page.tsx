'use client';

import { useState } from 'react';
import MomentumProgressToast from '@/components/MomentumProgressToast';

export default function TestMomentumPage() {
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const [toastData, setToastData] = useState<any>(null);

  const animations = [
    {
      id: 'current',
      name: 'Current Full-Screen Toast',
      description: 'Existing full-screen celebration with large icon and text',
    },
    {
      id: 'slide-up',
      name: 'Slide Up from Bottom',
      description: 'Card slides up from bottom with momentum info',
    },
    {
      id: 'confetti',
      name: 'Confetti Burst',
      description: 'Confetti animation with momentum display',
    },
    {
      id: 'pulse',
      name: 'Pulse Circle',
      description: 'Pulsing circle with percentage growing from center',
    },
  ];

  const showAnimation = (animationId: string) => {
    setActiveAnimation(animationId);

    // Show the current toast for comparison
    if (animationId === 'current') {
      setToastData({
        previousMomentum: 45,
        newMomentum: 48,
        source: 'chat',
        chatCount: 12,
      });
    }
  };

  const dismissToast = () => {
    setToastData(null);
    setActiveAnimation(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: '#2a2a2a' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#00ff41' }}>
          Momentum Animation Test Lab
        </h1>
        <p className="text-sm" style={{ color: '#888888' }}>
          Click each option to preview different animation styles
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

      {/* Current Animation - Using existing component */}
      {toastData && (
        <MomentumProgressToast
          data={toastData}
          onDismiss={dismissToast}
        />
      )}

      {/* Slide Up Animation */}
      {activeAnimation === 'slide-up' && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={dismissToast}
        >
          <div
            className="w-full max-w-md mb-8 p-8 rounded-3xl"
            style={{
              backgroundColor: '#0a0a0a',
              border: '2px solid #00ff41',
              animation: 'slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 65, 0.2)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold mb-1" style={{ color: '#ffffff' }}>
                  +3% Momentum
                </div>
                <div className="text-sm" style={{ color: '#888888' }}>
                  Keep building your confidence!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Animation */}
      {activeAnimation === 'confetti' && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={dismissToast}
        >
          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: i % 3 === 0 ? '#00ff41' : i % 3 === 1 ? '#ffffff' : '#888888',
                top: '50%',
                left: '50%',
                animation: `confetti-${i % 4} 1s ease-out forwards`,
              }}
            />
          ))}

          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-6xl font-bold mb-4" style={{ color: '#00ff41', animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              +3%
            </div>
            <div className="text-2xl font-semibold" style={{ color: '#ffffff' }}>
              Momentum Gained!
            </div>
          </div>
        </div>
      )}

      {/* Pulse Circle Animation */}
      {activeAnimation === 'pulse' && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)' }}
          onClick={dismissToast}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* Pulsing circles */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: '200px',
                height: '200px',
                border: '3px solid #00ff41',
                opacity: 0.3,
                animation: 'pulse-ring 1.5s ease-out infinite',
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: '200px',
                height: '200px',
                border: '3px solid #00ff41',
                opacity: 0.3,
                animation: 'pulse-ring 1.5s ease-out 0.5s infinite',
              }}
            />

            {/* Center content */}
            <div
              className="w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
                border: '3px solid #00ff41',
              }}
            >
              <div className="text-5xl font-bold mb-2" style={{ color: '#00ff41', animation: 'count-up 0.8s ease-out' }}>
                +3%
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Momentum
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        @keyframes confetti-0 {
          to {
            transform: translate(-100px, 200px) rotate(45deg);
            opacity: 0;
          }
        }

        @keyframes confetti-1 {
          to {
            transform: translate(100px, 200px) rotate(-45deg);
            opacity: 0;
          }
        }

        @keyframes confetti-2 {
          to {
            transform: translate(-150px, -100px) rotate(90deg);
            opacity: 0;
          }
        }

        @keyframes confetti-3 {
          to {
            transform: translate(150px, -100px) rotate(-90deg);
            opacity: 0;
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes count-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
