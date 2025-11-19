'use client';

import { useState } from 'react';

interface HomeTutorialProps {
  onComplete: () => void;
}

export default function HomeTutorial({ onComplete }: HomeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to MyCheatCode!",
      description: "You just created your first mental game tool. Let's show you how to get the most out of the app.",
      targetElement: null,
      position: 'center'
    },
    {
      title: "Your Codes Library",
      description: "All your cheat codes are saved here. Tap to view and practice them anytime.",
      targetElement: 'my-codes-button',
      position: 'bottom'
    },
    {
      title: "Explore Topics",
      description: "Need help with something specific? Browse real struggles from real players and create more codes.",
      targetElement: 'topics-button',
      position: 'bottom'
    },
    {
      title: "Track Your Progress",
      description: "This momentum bar shows your mental game growth. Practice codes to level up!",
      targetElement: 'progress-circle',
      position: 'top'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-[100]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        onClick={handleSkip}
      />

      {/* Tutorial card */}
      <div
        className={`fixed z-[101] ${currentStepData.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={{
          ...(currentStepData.position === 'top' && { top: '25%', left: '50%', transform: 'translateX(-50%)' }),
          ...(currentStepData.position === 'bottom' && { bottom: '25%', left: '50%', transform: 'translateX(-50%)' }),
          maxWidth: '90%',
          width: '340px'
        }}
      >
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            backgroundColor: '#0a0a0a',
            border: '2px solid rgba(0, 255, 65, 0.3)'
          }}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  backgroundColor: index <= currentStep ? '#00ff41' : 'rgba(255, 255, 255, 0.2)'
                }}
              />
            ))}
          </div>

          <h2 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>
            {currentStepData.title}
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#999' }}>
            {currentStepData.description}
          </p>

          <div className="flex items-center gap-3">
            {currentStep < steps.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 rounded-xl font-semibold transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#999'
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: '#00ff41',
                    color: '#000'
                  }}
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: '#00ff41',
                  color: '#000'
                }}
              >
                Got It!
              </button>
            )}
          </div>
        </div>

        {/* Pointer arrow */}
        {currentStepData.position === 'bottom' && (
          <div className="flex justify-center mt-2">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '12px solid rgba(0, 255, 65, 0.3)'
              }}
            />
          </div>
        )}
        {currentStepData.position === 'top' && (
          <div className="flex justify-center mb-2">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderBottom: '12px solid rgba(0, 255, 65, 0.3)'
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
