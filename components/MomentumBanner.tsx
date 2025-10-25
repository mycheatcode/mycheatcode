'use client';

import { useState, useEffect } from 'react';

export interface MomentumBannerData {
  previousMomentum: number;
  newMomentum: number;
  chatCount?: number;
}

interface MomentumBannerProps {
  data: MomentumBannerData;
  onDismiss: () => void;
}

export default function MomentumBanner({ data, onDismiss }: MomentumBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const slideInTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => {
      clearTimeout(slideInTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const gain = data.newMomentum - data.previousMomentum;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{
        maxWidth: 'calc(100vw - 32px)',
        width: 'auto'
      }}
    >
      <div
        className="px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
        style={{
          backgroundColor: 'rgba(0, 255, 65, 0.15)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Up Arrow Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00ff41"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>

        {/* Text */}
        <div className="font-semibold text-base whitespace-nowrap" style={{ color: '#00ff41' }}>
          +{gain.toFixed(gain >= 10 ? 0 : 1)}% Momentum!
        </div>
      </div>
    </div>
  );
}

// Hook for managing momentum banner
export function useMomentumBanner() {
  const [bannerData, setBannerData] = useState<MomentumBannerData | null>(null);

  const showMomentumBanner = (data: MomentumBannerData) => {
    setBannerData(data);
  };

  const dismissBanner = () => {
    setBannerData(null);
  };

  return {
    bannerData,
    showMomentumBanner,
    dismissBanner
  };
}
