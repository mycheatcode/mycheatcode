'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [name, setName] = useState('');
  const router = useRouter();

  const levels = [
    { id: 'youth', label: 'Youth/Recreational', desc: 'Just starting out or playing for fun' },
    { id: 'high-school', label: 'High School', desc: 'Varsity or JV level competition' },
    { id: 'college', label: 'College', desc: 'D1, D2, D3, or JUCO level' },
    { id: 'pro', label: 'Professional', desc: 'Pro, semi-pro, or overseas' },
  ];

  const goals = [
    { id: 'confidence', label: 'Build Confidence', icon: '💪' },
    { id: 'focus', label: 'Improve Focus', icon: '🎯' },
    { id: 'pressure', label: 'Handle Pressure', icon: '🔥' },
    { id: 'consistency', label: 'Stay Consistent', icon: '📈' },
    { id: 'leadership', label: 'Develop Leadership', icon: '👑' },
    { id: 'recovery', label: 'Bounce Back', icon: '🔄' },
  ];

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = () => {
    // Here you would save the onboarding data to your database
    router.push('/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">What's your name?</h2>
            <p className="text-zinc-400 mb-8">Let's personalize your experience</p>

            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors text-center text-lg"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">What level do you play at?</h2>
            <p className="text-zinc-400 mb-8">This helps us customize your cheat codes</p>

            <div className="space-y-3 max-w-md mx-auto">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    selectedLevel === level.id
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-semibold">{level.label}</div>
                  <div className="text-sm text-zinc-400">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">What are your goals?</h2>
            <p className="text-zinc-400 mb-8">Select all that apply (you can change these later)</p>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedGoals.includes(goal.id)
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-2xl mb-2">{goal.icon}</div>
                  <div className="text-sm font-semibold">{goal.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to your mental game, {name}!
            </h2>
            <p className="text-zinc-400 mb-8">
              Your personalized cheat codes are being prepared. Ready to start building your mental performance?
            </p>

            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md mx-auto mb-8">
              <h3 className="text-white font-semibold mb-4">Your Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Level:</span>
                  <span className="text-white">{levels.find(l => l.id === selectedLevel)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Goals:</span>
                  <span className="text-white">{selectedGoals.length} selected</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return name.trim().length > 0;
      case 2: return selectedLevel !== '';
      case 3: return selectedGoals.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="text-white text-lg font-semibold">mycheatcode.ai</div>
            <div className="text-zinc-400 text-sm">
              Step {currentStep} of 4
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            {renderStep()}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl transition-all ${
                currentStep === 1
                  ? 'opacity-50 cursor-not-allowed text-zinc-500'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Back
            </button>

            <button
              onClick={() => {
                if (currentStep === 4) {
                  handleComplete();
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                canProceed()
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {currentStep === 4 ? 'Start Building' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}