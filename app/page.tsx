'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProgressCircles from '@/components/ProgressCircles';
import { createClient } from '@/lib/supabase/client';
import { getUserProgress, type ProgressData } from '@/lib/progress';
import MomentumProgressToast, { useMomentumProgressToast } from '@/components/MomentumProgressToast';
import Footer from '@/components/Footer';
import FeedbackButton from '@/components/FeedbackButton';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showProgressAnimation, setShowProgressAnimation] = useState(false);
  const [momentumGain, setMomentumGain] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [previousProgressValue, setPreviousProgressValue] = useState(0);
  const { toastData, showMomentumProgress, dismissToast } = useMomentumProgressToast();
  const router = useRouter();
  const supabase = createClient();

  // Get current user and load progress
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout | null = null;
    let animationInterval: NodeJS.Timeout | null = null;
    let endAnimationTimeout: NodeJS.Timeout | null = null;

    const loadProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const progress = await getUserProgress(user.id);
        setProgressData(progress);
        // Use the rounded-down progress for display
        setProgressPercentage(progress.progress);

        // Check if momentum increased since last home page visit
        if (typeof window !== 'undefined') {
          const lastHomeProgress = localStorage.getItem('lastHomePageProgress');
          if (lastHomeProgress) {
            const previousProgress = parseFloat(lastHomeProgress);
            if (progress.progress > previousProgress) {
              const gain = progress.progress - previousProgress;
              setMomentumGain(gain);
              setPreviousProgressValue(previousProgress);
              setAnimatedProgress(previousProgress);

              // Start number scroll animation after a small delay
              animationTimeout = setTimeout(() => {
                setShowProgressAnimation(true);

                // Animate number counting up
                const duration = 1500; // 1.5 seconds
                const steps = 30;
                const increment = gain / steps;
                let currentStep = 0;

                animationInterval = setInterval(() => {
                  currentStep++;
                  if (currentStep <= steps) {
                    setAnimatedProgress(previousProgress + (increment * currentStep));
                  } else {
                    setAnimatedProgress(progress.progress);
                    if (animationInterval) clearInterval(animationInterval);

                    // Hold at new value for a moment, then end animation
                    endAnimationTimeout = setTimeout(() => {
                      setShowProgressAnimation(false);
                      setMomentumGain(0);
                    }, 800);
                  }
                }, duration / steps);
              }, 500);
            } else {
              // No gain, just show current progress
              setAnimatedProgress(progress.progress);
            }
          } else {
            // First visit, just show current progress
            setAnimatedProgress(progress.progress);
          }
          // Store current progress for next visit
          localStorage.setItem('lastHomePageProgress', progress.progress.toString());
        }
      }
    };
    loadProgress();

    // Cleanup function to clear all timers and intervals
    return () => {
      if (animationTimeout) clearTimeout(animationTimeout);
      if (animationInterval) clearInterval(animationInterval);
      if (endAnimationTimeout) clearTimeout(endAnimationTimeout);
    };
  }, [supabase]);

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Store the message to be auto-sent in chat
    localStorage.setItem('autoSendMessage', message);
    router.push('/chat');
  };

  return (
    <div className="h-screen font-sans relative overflow-hidden flex flex-col" style={{ color: 'var(--text-primary)', backgroundColor: '#000000' }}>

      {/* Mobile & Desktop Header with Menu */}
      <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)', backgroundColor: 'transparent' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-lg lg:text-xl font-semibold tracking-wide" style={{ color: '#00ff41' }}>MYCHEATCODE.AI</div>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#000000' }}>
        <div className="pt-24 px-6">
          <div className="text-xs font-bold tracking-widest mb-6" style={{ color: 'var(--accent-color)' }}>NAVIGATION</div>
        </div>
        <nav className="flex-1 px-4">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </Link>
            <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
            </Link>
            <Link href="/relatable-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Relatable Topics</span>
            </Link>
            <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Chat History</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Profile</span>
            </Link>
          </div>
        </nav>
        <Footer />
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center flex-1 px-4 pt-16 pb-2 relative z-10 justify-between max-w-[430px] lg:max-w-[600px] mx-auto w-full">
        {/* Header Message */}
        <div className="text-left w-full rounded-3xl p-5 relative overflow-hidden flex-shrink-0 min-h-[110px] mb-2" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1.5 leading-tight" style={{ color: 'var(--text-primary)' }}>
              Play With<br />Confidence.
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Start chatting to build your confidence.
            </p>
          </div>
          {/* Half Court Image - Right Aligned */}
          <div
            className="absolute right-0 top-0 bottom-0 w-auto"
            style={{
              backgroundImage: 'url(/half-court.png)',
              backgroundSize: 'auto 100%',
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.5,
              filter: 'brightness(1.5)',
              width: '50%'
            }}
          />
        </div>

        {/* Progress Section - Centered and Larger */}
        <div className="flex flex-col items-center justify-center py-2">
          {/* Your Momentum Label */}
          <div className="text-center mb-3">
            <div
              className="text-xs font-semibold uppercase tracking-[1px]"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              YOUR MOMENTUM
            </div>
          </div>

          {/* Progress Visualizer */}
          <div className="w-[min(350px,75vw)] aspect-square -my-6 relative overflow-visible">
            <ProgressCircles
              theme="dark"
              progress={progressPercentage}
              onProgressUpdate={setProgressPercentage}
            />
          </div>

          {/* Progress Percentage with Animation */}
          <div className="text-center mt-2">
            <div
              className={`text-5xl font-bold mb-1 transition-all duration-300 ${showProgressAnimation ? 'number-pulse-green' : ''}`}
              style={{
                color: showProgressAnimation ? '#00ff41' : 'var(--text-primary)',
                transform: showProgressAnimation ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              {Math.floor(showProgressAnimation ? animatedProgress : progressPercentage)}%
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Elite players stay above 85%
            </p>
          </div>
        </div>

        {/* Bottom Section - Input and Button */}
        <div className="w-full space-y-3 flex-shrink-0 -mt-8">
        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="w-full">
          <div className="relative">
            <input
              type="text"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share what's on your mind..."
              className="w-full px-5 py-4 pr-24 rounded-2xl text-base focus:outline-none"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--input-text)'
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl transition-colors font-medium text-base"
              style={{
                background: 'var(--button-bg)',
                color: 'var(--button-text)'
              }}
            >
              Send
            </button>
          </div>
        </form>

        {/* View Relatable Topics Button */}
        <Link href="/relatable-topics" className="w-full">
          <button
            className="w-full px-5 py-4 rounded-2xl text-base font-medium transition-colors text-center"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--card-title)'
            }}
          >
            View Relatable Topics
          </button>
        </Link>
        </div>
      </div>

      {/* Momentum Progress Toast */}
      {toastData && (
        <MomentumProgressToast
          data={toastData}
          onDismiss={dismissToast}
        />
      )}

      {/* Floating Feedback Button */}
      <FeedbackButton />

    </div>
  );
}
