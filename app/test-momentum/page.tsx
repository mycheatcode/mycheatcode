'use client';

import { useState } from 'react';
import MomentumProgressToast, { useMomentumProgressToast, MomentumProgressData } from '@/components/MomentumProgressToast';

export default function TestMomentumPage() {
  const { toastData, showMomentumProgress, dismissToast } = useMomentumProgressToast();
  const [currentMomentum, setCurrentMomentum] = useState(25);

  // Predefined test scenarios
  const testScenarios = [
    {
      name: 'First Chat (+3%)',
      previous: 25,
      new: 28,
      source: 'chat' as const,
      chatCount: 1
    },
    {
      name: 'Reach 40% Milestone',
      previous: 37,
      new: 40,
      source: 'chat' as const,
      chatCount: 5
    },
    {
      name: 'Reach 50% Milestone',
      previous: 48,
      new: 50,
      source: 'chat' as const,
      chatCount: 10
    },
    {
      name: 'Reach 75% Milestone',
      previous: 73.5,
      new: 75,
      source: 'chat' as const,
      chatCount: 25
    },
    {
      name: 'Reach 100% Peak!',
      previous: 98,
      new: 100,
      source: 'chat' as const,
      chatCount: 50
    },
    {
      name: 'Code Usage Boost (+1%)',
      previous: 60,
      new: 61,
      source: 'code_usage' as const
    },
    {
      name: 'Custom from current',
      previous: currentMomentum,
      new: currentMomentum + 3,
      source: 'chat' as const,
      chatCount: Math.floor(currentMomentum / 2)
    }
  ];

  const handleTestScenario = (scenario: typeof testScenarios[0]) => {
    showMomentumProgress({
      previousMomentum: scenario.previous,
      newMomentum: scenario.new,
      source: scenario.source,
      chatCount: scenario.chatCount
    });
  };

  const handleCustomTest = () => {
    const gain = Math.random() * 5 + 1; // Random gain between 1-6%
    const newMomentum = Math.min(100, currentMomentum + gain);

    showMomentumProgress({
      previousMomentum: currentMomentum,
      newMomentum: newMomentum,
      source: Math.random() > 0.5 ? 'chat' : 'code_usage',
      chatCount: Math.floor(newMomentum / 2)
    });

    setCurrentMomentum(newMomentum);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-green-400">Momentum Progress Notifications Test</h1>
        <p className="text-zinc-400 mb-8">Test different momentum progress scenarios and see the gamified notifications in action</p>

        {/* Current Momentum Display */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Test Momentum</h2>
            <div className="text-3xl font-bold text-green-400">{currentMomentum}%</div>
          </div>
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${currentMomentum}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-2">
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <button
            onClick={() => setCurrentMomentum(25)}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Reset to 25%
          </button>
        </div>

        {/* Test Scenarios */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => handleTestScenario(scenario)}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg p-4 text-left transition-all hover:border-green-500/50"
              >
                <div className="font-semibold text-white mb-1">{scenario.name}</div>
                <div className="text-xs text-zinc-400">
                  {scenario.previous}% → {scenario.new}%
                  <span className="text-green-400 ml-2">
                    +{(scenario.new - scenario.previous).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Source: {scenario.source === 'chat' ? '💬 Chat' : '⚡ Code Usage'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Test */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Custom Test</h2>
          <button
            onClick={handleCustomTest}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Trigger Random Progress Notification
          </button>
          <p className="text-xs text-zinc-400 mt-2 text-center">
            Will add random 1-6% to current momentum
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-3 text-sm text-zinc-300">
            <div>
              <span className="font-semibold text-white">💬 Chat Completion:</span> When a user completes a chat and creates a cheat code, their momentum increases based on the tier system (first 5 chats = +3% each, chats 6-15 = +2% each, etc.)
            </div>
            <div>
              <span className="font-semibold text-white">⚡ Code Usage:</span> Using cheat codes logs activity which helps maintain momentum and prevent decay
            </div>
            <div>
              <span className="font-semibold text-white">🎯 Milestones:</span> Special celebrations trigger at 40%, 50%, 75%, and 100% momentum
            </div>
            <div>
              <span className="font-semibold text-white">📊 Progress Bar:</span> Animated progress bar shows current momentum with milestone markers
            </div>
            <div>
              <span className="font-semibold text-white">⏱️ Auto-dismiss:</span> Toasts automatically dismiss after 4 seconds but can be closed manually
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Integration Guide</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-green-400 font-mono text-xs mb-2">1. Add to your page/component:</div>
              <pre className="bg-black p-3 rounded-lg overflow-x-auto text-[11px] border border-zinc-800">
{`import MomentumProgressToast, { useMomentumProgressToast } from '@/components/MomentumProgressToast';

const { toastData, showMomentumProgress, dismissToast } = useMomentumProgressToast();`}
              </pre>
            </div>

            <div>
              <div className="text-green-400 font-mono text-xs mb-2">2. Show notification after momentum change:</div>
              <pre className="bg-black p-3 rounded-lg overflow-x-auto text-[11px] border border-zinc-800">
{`// After chat completion or code usage
const previousProgress = await getUserProgress(userId);
// ... perform action that increases momentum ...
const newProgress = await getUserProgress(userId);

showMomentumProgress({
  previousMomentum: previousProgress.progress,
  newMomentum: newProgress.progress,
  source: 'chat', // or 'code_usage'
  chatCount: newProgress.chatCount
});`}
              </pre>
            </div>

            <div>
              <div className="text-green-400 font-mono text-xs mb-2">3. Render the toast component:</div>
              <pre className="bg-black p-3 rounded-lg overflow-x-auto text-[11px] border border-zinc-800">
{`{toastData && (
  <MomentumProgressToast
    data={toastData}
    onDismiss={dismissToast}
  />
)}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Render Toast */}
      {toastData && (
        <MomentumProgressToast
          data={toastData}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
