'use client';

import { useState, useEffect } from 'react';

// Mock scenarios based on common basketball mental blocks
const SCENARIOS = [
  {
    id: 1,
    situation: "You just airballed your first shot of the game.",
    currentThought: "I'm trash. Coach is gonna bench me.",
    relatedCode: "Shooter's Memory",
    options: [
      {
        text: "Whatever. I'll just pass more now.",
        type: 'negative',
        feedback: "That's avoidant thinking. You're letting one miss dictate your entire game and staying in your comfort zone instead of pushing through."
      },
      {
        text: "Why did I even take that shot?",
        type: 'negative',
        feedback: "That's rumination. You're dwelling on the past instead of moving forward. This thinking pattern keeps you stuck."
      },
      {
        text: "One shot doesn't define my game.",
        type: 'helpful',
        feedback: "This neutralizes the spiral, which is good. But it's not aggressive enough to push you forward. It's defensive, not offensive."
      },
      {
        text: "I missed, but I'm a shooter — I keep letting it fly.",
        type: 'optimal',
        feedback: "Perfect! This is an aggressive reframe. You acknowledged the miss (realistic), claimed your identity (confident), and committed to action (forward-moving). This is 'Shooter's Memory' in action."
      }
    ]
  },
  {
    id: 2,
    situation: "Coach yells at you in front of the whole team during practice.",
    currentThought: "Everyone thinks I'm terrible. I can't do anything right.",
    relatedCode: "Growth Lens",
    options: [
      {
        text: "I'm the worst player on the team.",
        type: 'negative',
        feedback: "That's catastrophizing. One moment of criticism becomes total failure in your mind. This thinking keeps you small."
      },
      {
        text: "Coach always picks on me for no reason.",
        type: 'negative',
        feedback: "That's victimization. You're making it personal and removing your agency. This keeps you powerless."
      },
      {
        text: "It's just coaching, not a personal attack.",
        type: 'helpful',
        feedback: "This is neutralizing - you're not spiraling, which is good. But it's passive. It stops the bleeding but doesn't drive growth."
      },
      {
        text: "Coach sees potential in me — that's why he pushes.",
        type: 'optimal',
        feedback: "Excellent! This flips the script completely. You're reframing criticism as investment. This is 'Growth Lens' - seeing challenge as evidence of belief, not proof of failure."
      }
    ]
  },
  {
    id: 3,
    situation: "You're guarding the best player on the other team and they just scored on you three times in a row.",
    currentThought: "I can't guard this guy. I'm getting exposed.",
    relatedCode: "Compete Mode",
    options: [
      {
        text: "I hope coach subs me out soon.",
        type: 'negative',
        feedback: "That's escape thinking. You're wishing for rescue instead of rising to the challenge. This keeps you from growth."
      },
      {
        text: "This is embarrassing. Everyone's watching me fail.",
        type: 'negative',
        feedback: "That's shame spiraling. You're focused on perception instead of performance. This kills your confidence."
      },
      {
        text: "It's okay, they're just really good.",
        type: 'helpful',
        feedback: "This gives you permission to fail, which reduces pressure. But it's also giving up. It's too passive for competition."
      },
      {
        text: "This is my chance to prove I can compete with the best.",
        type: 'optimal',
        feedback: "Perfect! This is 'Compete Mode' - you're reframing the challenge as an opportunity. Instead of being exposed, you're being tested. This mindset makes you dangerous."
      }
    ]
  },
  {
    id: 4,
    situation: "Your teammate ignores you on the pass when you're wide open and turns it over.",
    currentThought: "Nobody trusts me. I'm invisible out here.",
    relatedCode: "Trust My Work",
    options: [
      {
        text: "Why even get open if they won't pass?",
        type: 'negative',
        feedback: "That's learned helplessness. You're letting one moment make you quit trying. This creates a self-fulfilling prophecy."
      },
      {
        text: "They must think I'm not good enough.",
        type: 'negative',
        feedback: "That's mind-reading and personalizing. You're creating a story that might not be true. This erodes your confidence."
      },
      {
        text: "That happens sometimes. Keep playing.",
        type: 'helpful',
        feedback: "This is acceptance - you're not spiraling. But it's passive. You're enduring instead of asserting yourself."
      },
      {
        text: "Keep getting open. My work will speak for itself.",
        type: 'optimal',
        feedback: "Excellent! This is 'Trust My Work' - you're staying in your control, not reacting to what you can't control. You're focused on earning it through action, not waiting for permission."
      }
    ]
  },
  {
    id: 5,
    situation: "You catch the ball with a chance to attack the basket, but you feel pressure to pass quickly.",
    currentThought: "I should get rid of it. I don't want to mess up.",
    relatedCode: "Attack Mode",
    options: [
      {
        text: "Better safe than sorry. Just pass it.",
        type: 'negative',
        feedback: "That's playing not to lose. You're avoiding risk but also avoiding opportunity. This keeps you small."
      },
      {
        text: "What if I turn it over and coach gets mad?",
        type: 'negative',
        feedback: "That's outcome anxiety. You're focused on what could go wrong instead of what you can do right. This creates hesitation."
      },
      {
        text: "I'll try if I see a really good opening.",
        type: 'helpful',
        feedback: "This is conditional confidence - you'll act only if it's 'perfect.' But perfect moments are rare. This keeps you waiting instead of seizing."
      },
      {
        text: "This is my moment. Attack strong.",
        type: 'optimal',
        feedback: "Perfect! This is 'Attack Mode' - you're claiming the opportunity with aggression. You shifted from fear (don't mess up) to action (attack strong). This is how you grow."
      }
    ]
  }
];

const PROMPTS = [
  "What should you think instead?",
  "What's a better thought?",
  "What's a more helpful thought?",
  "How should you reframe this?",
  "What would be better to focus on?"
];

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ReframeGameTest() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(24);
  const [gameComplete, setGameComplete] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<typeof SCENARIOS[0]['options']>([]);
  const [showScenario, setShowScenario] = useState(true);
  const [scenarioTimeLeft, setScenarioTimeLeft] = useState(5);

  const currentScenario = SCENARIOS[currentScenarioIndex];
  const currentPrompt = PROMPTS[currentScenarioIndex % PROMPTS.length];

  // Shuffle options when scenario changes
  useEffect(() => {
    setShuffledOptions(shuffleArray(currentScenario.options));
    setShowScenario(true);
    setScenarioTimeLeft(10);
  }, [currentScenarioIndex]);

  // Scenario countdown timer (5 seconds)
  useEffect(() => {
    if (!showScenario || showFeedback || gameComplete) return;

    const timer = setInterval(() => {
      setScenarioTimeLeft((prev) => {
        if (prev <= 1) {
          setShowScenario(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showScenario, showFeedback, gameComplete]);

  // Answer timer logic (24 seconds) - only runs after scenario is shown
  useEffect(() => {
    if (showScenario || showFeedback || gameComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showScenario, showFeedback, gameComplete]);

  const handleTimeUp = () => {
    setShowFeedback(true);
  };

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;

    const selected = currentScenario.options[index];
    setSelectedOption(index);
    setShowFeedback(true);

    if (selected.type === 'optimal') {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentScenarioIndex < SCENARIOS.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
      setTimeLeft(24);
    } else {
      setGameComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setTimeLeft(24);
    setGameComplete(false);
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="text-6xl">🎯</div>
            <h1 className="text-3xl font-bold">Session Complete</h1>
          </div>

          <div className="space-y-2">
            <div className="text-7xl font-bold" style={{ color: '#00ff88' }}>
              {score}/{SCENARIOS.length}
            </div>
            <p className="text-gray-400">Optimal Reframes</p>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-4 rounded-xl font-semibold transition-all"
            style={{ backgroundColor: '#00ff88', color: '#000' }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const selectedFeedback = selectedOption !== null ? shuffledOptions[selectedOption] : null;

  // Scenario introduction screen
  if (showScenario) {
    const progress = ((10 - scenarioTimeLeft) / 10) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Green progress bar at top */}
        <div className="w-full h-1.5" style={{ backgroundColor: '#1a1a1a' }}>
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: '#00ff41',
              boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
            }}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">
          {/* Countdown with circular progress ring */}
          <div className="relative mb-16">
            <svg className="transform -rotate-90" width="120" height="120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                stroke="#1a1a1a"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                stroke="#00ff41"
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 1s linear',
                  filter: 'drop-shadow(0 0 8px rgba(0, 255, 65, 0.6))'
                }}
                strokeLinecap="round"
              />
            </svg>
            {/* Countdown number in center */}
            <div
              className="absolute inset-0 flex items-center justify-center text-5xl font-bold tabular-nums"
              style={{
                color: '#00ff41',
                textShadow: '0 0 20px rgba(0, 255, 65, 0.5)'
              }}
            >
              {scenarioTimeLeft}
            </div>
          </div>

          {/* Scenario text */}
          <div className="space-y-8 mb-12 text-center animate-fadeIn">
            <h2 className="text-2xl md:text-3xl leading-relaxed text-white px-4">
              {currentScenario.situation}
            </h2>

            <p className="text-lg md:text-xl italic text-red-400 px-4">
              "{currentScenario.currentThought}"
            </p>
          </div>
        </div>

        {/* Skip button anchored to bottom */}
        <div className="pb-8 px-6 flex justify-center max-w-2xl mx-auto w-full">
          <button
            onClick={() => setShowScenario(false)}
            className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#00ff41',
              color: '#000000',
              boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
            }}
          >
            I'm Ready
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col p-6">
        {/* Question Counter Header */}
        <div className="max-w-2xl w-full mx-auto pt-4 pb-2">
          <div className="text-center text-sm text-gray-500">
            Question {currentScenarioIndex + 1} of {SCENARIOS.length}
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-center gap-30">

          {/* Top Section - Scenario */}
          <div className="space-y-6">
            {/* Shot Clock Timer */}
            <div className="flex justify-center">
              <div className="relative">
                <svg width="100" height="100" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="6"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={timeLeft > 12 ? '#00ff41' : timeLeft > 6 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / 24)}`}
                    style={{
                      transition: 'stroke-dashoffset 1s linear',
                      filter: timeLeft > 12 ? 'drop-shadow(0 0 6px rgba(0, 255, 65, 0.6))' : 'none'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Scenario */}
            <div className="text-center space-y-6">
              <h2 className="text-xl leading-relaxed px-4">
                {currentScenario.situation}
              </h2>

              <p className="text-base italic text-red-400/90 px-4">
                "{currentScenario.currentThought}"
              </p>
            </div>
          </div>

          {/* Bottom Section - Prompt & Options */}
          <div className="space-y-5">
            {/* Prompt */}
            {!showFeedback && (
              <p className="text-center text-base text-gray-400">
                {currentPrompt}
              </p>
            )}

            {/* Options */}
            <div className="space-y-3">
              {shuffledOptions.map((option, index) => {
                const isSelected = selectedOption === index;
                const isOptimal = option.type === 'optimal';
                const showAsCorrect = showFeedback && isOptimal;
                const showAsWrong = showFeedback && isSelected && !isOptimal;

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      showFeedback
                        ? showAsCorrect
                          ? 'border-2'
                          : showAsWrong
                          ? 'bg-red-500/20 border-2 border-red-500'
                          : 'bg-[#0a0a0a] border border-[#1a1a1a] opacity-40'
                        : 'bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] cursor-pointer'
                    }`}
                    style={
                      showAsCorrect
                        ? {
                            backgroundColor: 'rgba(0, 255, 65, 0.15)',
                            borderColor: '#00ff41',
                            boxShadow: '0 0 15px rgba(0, 255, 65, 0.2)'
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className={showFeedback && !isOptimal && !isSelected ? 'text-gray-600' : ''}>
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            <div className="flex justify-center gap-2 pt-2">
              {SCENARIOS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index === currentScenarioIndex
                      ? 'w-8'
                      : 'w-1.5'
                  }`}
                  style={{
                    backgroundColor: index <= currentScenarioIndex ? '#00ff41' : '#1a1a1a',
                    boxShadow: index <= currentScenarioIndex ? '0 0 8px rgba(0, 255, 65, 0.4)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && selectedFeedback && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="max-w-xl w-full space-y-8 animate-slideUp">
            {/* Indicator */}
            <div className="text-center">
              <div className="text-6xl mb-4">
                {selectedFeedback.type === 'optimal' ? '✅' : selectedFeedback.type === 'helpful' ? '⚠️' : '❌'}
              </div>
              <h3 className="text-2xl font-bold">
                {selectedFeedback.type === 'optimal' ? 'Great Choice!' : selectedFeedback.type === 'helpful' ? 'Could Be Better' : 'Not Quite'}
              </h3>
            </div>

            {/* Feedback */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <p className="text-lg leading-relaxed text-gray-300">
                {selectedFeedback.feedback}
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
              }}
            >
              {currentScenarioIndex < SCENARIOS.length - 1 ? 'Continue →' : 'See Results'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
