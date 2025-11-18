'use client';

import { useState, useEffect, useRef } from 'react';

interface OnboardingTutorialsProps {
  onComplete: () => void;
}

export default function OnboardingTutorials({ onComplete }: OnboardingTutorialsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  // Start tutorials after a brief delay (let momentum animation play)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(true);
      setCurrentStep(1);
    }, 1500); // Wait 1.5 seconds after progress animation completes

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOverlay(false);
      // Mark tutorials as completed
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingTutorialsCompleted', 'true');
      }
      onComplete();
    }
  };

  if (!showOverlay) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/80 z-[100]"
        onClick={handleNext}
      />

      {/* Tutorial Step 1: Momentum Visual */}
      {currentStep === 1 && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="bg-zinc-900 rounded-2xl p-5 shadow-2xl animate-fadeIn border-2"
            style={{
              borderColor: '#00ff41',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Your Momentum</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                This shows your progress. Every time you practice a cheat code, your momentum grows. Keep it up!
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Step 2: Text Input */}
      {currentStep === 2 && (
        <div className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="bg-zinc-900 rounded-2xl p-5 shadow-2xl animate-fadeIn border-2"
            style={{
              borderColor: '#00ff41',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Start a New Chat</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Share what's on your mind here, and I'll help you create a personalized cheat code to overcome it.
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              Next
            </button>
          </div>
          {/* Arrow pointing down to text input */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <div
              className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"
              style={{ borderTop: '10px solid #00ff41' }}
            />
          </div>
        </div>
      )}

      {/* Tutorial Step 3: My Codes Button */}
      {currentStep === 3 && (
        <div className="fixed bottom-[70px] left-1/2 -translate-x-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="bg-zinc-900 rounded-2xl p-5 shadow-2xl animate-fadeIn border-2"
            style={{
              borderColor: '#00ff41',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Your Codes</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                All your saved codes live here. Practice anytime to build your momentum!
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              Next
            </button>
          </div>
          {/* Arrow pointing down-left to My Codes button */}
          <div className="absolute -bottom-4 left-[30%] -translate-x-1/2">
            <div
              className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"
              style={{ borderTop: '10px solid #00ff41' }}
            />
          </div>
        </div>
      )}

      {/* Tutorial Step 4: Explore Topics Button */}
      {currentStep === 4 && (
        <div className="fixed bottom-[70px] left-1/2 -translate-x-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="bg-zinc-900 rounded-2xl p-5 shadow-2xl animate-fadeIn border-2"
            style={{
              borderColor: '#00ff41',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.2)',
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>Browse Topics</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Not sure what to talk about? Explore relatable topics other players are working through.
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              Let's Go!
            </button>
          </div>
          {/* Arrow pointing down-right to Explore Topics button */}
          <div className="absolute -bottom-4 left-[70%] -translate-x-1/2">
            <div
              className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"
              style={{ borderTop: '10px solid #00ff41' }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
