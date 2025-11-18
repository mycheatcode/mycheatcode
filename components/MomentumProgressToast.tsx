'use client';

import { useState, useEffect } from 'react';

export interface MomentumProgressData {
  previousMomentum: number;
  newMomentum: number;
  source: 'chat' | 'code_usage' | 'cheat_code_received' | 'completion';
  chatCount?: number;
  milestoneReached?: string; // e.g., "50%", "75%", "100%"
}

interface MomentumProgressToastProps {
  data: MomentumProgressData;
  onDismiss: () => void;
}

export default function MomentumProgressToast({ data, onDismiss }: MomentumProgressToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto dismiss after 2.5 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 2500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const gain = data.newMomentum - data.previousMomentum;
  const isMilestone = data.milestoneReached !== undefined;

  // Get milestone message
  const getMessage = () => {
    // Check for cheat code celebration first
    if (data.source === 'cheat_code_received') {
      return 'Cheat Code Created!';
    }

    if (isMilestone) {
      if (data.newMomentum === 100) return 'Peak Momentum Reached!';
      if (data.newMomentum === 75) return '75% Momentum Reached!';
      if (data.newMomentum === 50) return '50% Momentum Reached!';
      if (data.newMomentum === 40) return '40% Momentum Reached!';
    }
    return `+${gain.toFixed(gain >= 10 ? 0 : 1)}% Momentum!`;
  };

  // Get milestone icon
  const getMilestoneIcon = () => {
    // Lightning bolt for cheat code celebrations
    if (data.source === 'cheat_code_received') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent-color)' }}>
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      );
    }

    if (!isMilestone) {
      // Regular up arrow
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      );
    }

    // Trophy icon for all milestones
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
      </svg>
    );
  };

  // For non-milestone gains, show confetti-style layout
  const showConfettiStyle = !isMilestone && data.source !== 'cheat_code_received';

  return (
    <div
      className={`fixed top-0 left-0 right-0 bottom-0 z-[100] transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className={`transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-90'
        }`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          maxWidth: '100%'
        }}
      >
        {/* Icon */}
        <div style={{
          marginBottom: showConfettiStyle ? '16px' : '16px',
          transform: 'scale(1.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {getMilestoneIcon()}
        </div>

        {/* Confetti-style text layout for regular momentum gains */}
        {showConfettiStyle ? (
          <>
            <div
              className="font-bold mb-4"
              style={{
                color: '#00ff41',
                fontSize: 'clamp(48px, 12vw, 96px)',
                textAlign: 'center',
                animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                lineHeight: '1'
              }}
            >
              +{gain.toFixed(gain >= 10 ? 0 : 1)}%
            </div>
            <div
              className="font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(20px, 5vw, 32px)',
                textAlign: 'center'
              }}
            >
              Momentum Gained!
            </div>
          </>
        ) : (
          /* Original layout for milestones and cheat codes */
          <div
            className="font-bold"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(24px, 8vw, 48px)',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              width: '100%'
            }}
          >
            {getMessage()}
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
}

// Hook for managing momentum progress toasts
export function useMomentumProgressToast() {
  const [toastData, setToastData] = useState<MomentumProgressData | null>(null);

  const showMomentumProgress = (data: MomentumProgressData) => {
    // Don't show notification if already at 100% momentum
    if (data.previousMomentum >= 100) {
      return;
    }

    // Check if milestone was reached
    const milestones = [25, 40, 50, 75, 100];
    const reachedMilestone = milestones.find(
      m => data.previousMomentum < m && data.newMomentum >= m
    );

    setToastData({
      ...data,
      milestoneReached: reachedMilestone ? `${reachedMilestone}%` : undefined
    });
  };

  const dismissToast = () => {
    setToastData(null);
  };

  return {
    toastData,
    showMomentumProgress,
    dismissToast
  };
}
