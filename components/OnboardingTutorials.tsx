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
    }, 4000); // Wait 4 seconds for momentum animation (1.5s animation + 2s hold + 0.5s buffer)

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < 3) {
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
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] max-w-sm px-6">
          <div
            className="bg-white text-black rounded-2xl p-6 shadow-2xl animate-fadeIn"
            style={{
              boxShadow: '0 0 40px rgba(0, 255, 65, 0.3)',
            }}
          >
            <h3 className="text-xl font-bold mb-3">Your Momentum 🔥</h3>
            <p className="text-base leading-relaxed mb-4">
              This shows your progress. Every time you practice a cheat code, your momentum grows. Keep it up!
            </p>
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
          {/* Arrow pointing up to momentum visual */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div
              className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white"
            />
          </div>
        </div>
      )}

      {/* Tutorial Step 2: Text Input */}
      {currentStep === 2 && (
        <div className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-[101] max-w-sm px-6">
          <div
            className="bg-white text-black rounded-2xl p-6 shadow-2xl animate-fadeIn"
            style={{
              boxShadow: '0 0 40px rgba(0, 255, 65, 0.3)',
            }}
          >
            <h3 className="text-xl font-bold mb-3">Start a New Chat 💬</h3>
            <p className="text-base leading-relaxed mb-4">
              Share what's on your mind here, and I'll help you create a personalized cheat code to overcome it.
            </p>
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
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <div
              className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white"
            />
          </div>
        </div>
      )}

      {/* Tutorial Step 3: Relatable Topics Button */}
      {currentStep === 3 && (
        <div className="fixed bottom-[70px] left-1/2 -translate-x-1/2 z-[101] max-w-sm px-6">
          <div
            className="bg-white text-black rounded-2xl p-6 shadow-2xl animate-fadeIn"
            style={{
              boxShadow: '0 0 40px rgba(0, 255, 65, 0.3)',
            }}
          >
            <h3 className="text-xl font-bold mb-3">Browse Topics 🏀</h3>
            <p className="text-base leading-relaxed mb-4">
              Not sure what to talk about? Check out relatable topics other players are working through.
            </p>
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
          {/* Arrow pointing down to relatable topics button */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <div
              className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white"
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
