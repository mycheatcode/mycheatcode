'use client';

import { useState, useEffect } from 'react';
import type { GameScenario, GameSessionResult } from '@/lib/types/game';

interface CheatCodeGameProps {
  cheatCodeId: string;
  cheatCodeTitle: string;
  isFirstPlay?: boolean;
  onComplete?: (result: GameSessionResult) => void;
  onClose?: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const PROMPTS = [
  "What should you think instead?",
  "What's a better thought?",
  "How should you reframe this?",
  "What's the flip?",
];

export default function CheatCodeGame({
  cheatCodeId,
  cheatCodeTitle,
  isFirstPlay = false,
  onComplete,
  onClose,
}: CheatCodeGameProps) {
  const [scenarios, setScenarios] = useState<GameScenario[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(24);
  const [gameComplete, setGameComplete] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<typeof scenarios[0]['options']>([]);
  const [showScenario, setShowScenario] = useState(true);
  const [scenarioTimeLeft, setScenarioTimeLeft] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const MOTIVATIONAL_QUOTES = [
    "Your thoughts shape your reality on the court",
    "Confidence is built one rep at a time",
    "Mental reps count just as much as physical ones",
    "The game is 90% mental, the other half is physical - Yogi Berra",
    "Champions aren't born in the gym, they're made in the mind",
    "Your next shot is always your best shot",
    "Trust the process, trust yourself",
    "Pressure is a privilege",
    "The mind is the limit",
    "Believe in your training",
  ];

  const currentScenario = scenarios[currentScenarioIndex];
  const currentPrompt = PROMPTS[currentScenarioIndex % PROMPTS.length];

  // Rotate motivational quotes while loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 3000); // Change quote every 3 seconds

    return () => clearInterval(interval);
  }, [loading, MOTIVATIONAL_QUOTES.length]);

  // Fetch scenarios on mount with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 4000; // 4 seconds between retries (total wait: ~20 seconds)

    async function fetchScenarios() {
      try {
        const response = await fetch('/api/game/get-scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cheat_code_id: cheatCodeId }),
        });

        const data = await response.json();

        if (!data.success || !data.has_scenarios) {
          // Retry if scenarios aren't ready yet (might still be generating)
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Scenarios not ready, retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(fetchScenarios, retryDelay);
            return;
          }

          setError('Scenarios are still being generated. Please try again in a few moments.');
          setLoading(false);
          return;
        }

        setScenarios(data.scenarios);
        setLoading(false);
      } catch (err) {
        setError('Failed to load game');
        setLoading(false);
      }
    }

    fetchScenarios();
  }, [cheatCodeId]);

  // Shuffle options when scenario changes
  useEffect(() => {
    if (currentScenario) {
      setShuffledOptions(shuffleArray(currentScenario.options));
      setShowScenario(true);
      setScenarioTimeLeft(10);
      setTimeLeft(24); // Reset question timer to full 24 seconds
      setSelectedOption(null); // Clear selected option
      setIsTimeout(false); // Clear timeout flag
    }
  }, [currentScenarioIndex, currentScenario]);

  // Scenario countdown timer (10 seconds)
  useEffect(() => {
    if (!showScenario || showFeedback || gameComplete || !currentScenario) return;

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
  }, [showScenario, showFeedback, gameComplete, currentScenario]);

  // Answer timer logic (24 seconds)
  useEffect(() => {
    if (showScenario || showFeedback || gameComplete || !currentScenario) return;

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
  }, [showScenario, showFeedback, gameComplete, currentScenario]);

  const handleTimeUp = () => {
    // Find and highlight the optimal answer so user can learn from it
    const optimalIndex = shuffledOptions.findIndex(opt => opt.type === 'optimal');
    if (optimalIndex !== -1) {
      setSelectedOption(optimalIndex); // Highlight it for learning
    }
    setUserAnswers([...userAnswers, -1]); // -1 indicates timeout/no answer (no points)
    setIsTimeout(true); // Mark as timeout to show special feedback
    setShowFeedback(true);
  };

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;

    const selectedOptionData = shuffledOptions[index];

    // Find the original index in the scenario's options
    const originalIndex = currentScenario.options.findIndex(
      opt => opt.text === selectedOptionData.text
    );

    setSelectedOption(index);
    setUserAnswers([...userAnswers, originalIndex]);

    if (selectedOptionData.type === 'optimal') {
      setScore(score + 1);
    }

    setShowFeedback(true);
  };

  const handleNext = async () => {
    if (currentScenarioIndex < scenarios.length - 1) {
      // Move to next scenario
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
      setTimeLeft(24);
    } else {
      // Game complete - submit session
      await submitGameSession();
    }
  };

  const submitGameSession = async () => {
    try {
      const response = await fetch('/api/game/submit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cheat_code_id: cheatCodeId,
          scenario_ids: scenarios.map(s => s.id),
          user_answers: userAnswers,
          is_first_play: isFirstPlay,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setGameComplete(true);
        if (onComplete) {
          onComplete(data.result);
        }
      }
    } catch (err) {
      console.error('Failed to submit game session:', err);
      setGameComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[200]">
        <div className="text-center space-y-12 max-w-2xl px-6">
          {/* Pulsing Green Circle - matches home momentum visual */}
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-full"
              style={{
                backgroundColor: '#00ff41',
                animation: 'pulse 2s ease-in-out infinite',
                boxShadow: '0 0 40px rgba(0, 255, 65, 0.6)'
              }}
            />
          </div>

          {/* Rotating Motivational Quote - Front and Center */}
          <div className="relative min-h-[120px] flex items-center justify-center">
            <p
              key={currentQuoteIndex}
              className="text-3xl md:text-4xl font-bold text-white leading-relaxed px-4"
              style={{
                animation: 'fadeIn 0.5s ease-in-out',
                color: '#00ff41'
              }}
            >
              "{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"
            </p>
          </div>

          {/* Loading Text - Smaller, less prominent */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Preparing your practice...</div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6 z-[200]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-2xl font-bold text-red-400">Error</div>
          <div className="text-gray-300">{error}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameComplete && result) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6 z-[200]">
        <div className="max-w-xl w-full space-y-8 text-center">
          <div className="text-6xl mb-4">
            {result.score === 3 ? '🔥' : result.score === 2 ? '💪' : result.score === 1 ? '👍' : '🎯'}
          </div>

          <h2 className="text-3xl font-bold">
            {result.score}/{result.total_questions} Correct
          </h2>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 space-y-4">
            <div className="text-lg text-gray-300">
              {result.score === 3 && "Perfect! You've got this reframe down!"}
              {result.score === 2 && "Nice work! You're getting the hang of it."}
              {result.score === 1 && "Good start! Keep practicing this reframe."}
              {result.score === 0 && "Keep practicing - you'll get it!"}
            </div>

            {result.momentum_awarded > 0 && (
              <div className="pt-4 border-t border-[#1a1a1a]">
                <div className="text-sm text-gray-500 mb-2">Momentum Gained</div>
                <div className="text-3xl font-bold" style={{ color: '#00ff41' }}>
                  +{result.momentum_awarded.toFixed(1)}%
                </div>
                {result.is_first_play && (
                  <div className="text-sm text-gray-400 mt-2">
                    Congrats on your first practice!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Reset game state to play again
                setCurrentScenarioIndex(0);
                setSelectedOption(null);
                setShowFeedback(false);
                setScore(0);
                setTimeLeft(24);
                setGameComplete(false);
                setUserAnswers([]);
                setResult(null);
                setShowIntro(true);
                setShowScenario(true);
                setScenarioTimeLeft(10);
              }}
              className="w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              Play Again
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] bg-white/10 hover:bg-white/20"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentScenario) {
    return null;
  }

  const selectedFeedback = selectedOption !== null ? shuffledOptions[selectedOption] : null;

  // Intro card - shown before the first scenario
  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6 z-[200]">
        <div className="max-w-2xl w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold">Get Reps In</h1>
            <p className="text-lg text-gray-400">Practice your mental reframe</p>
          </div>

          {/* Instructions */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 space-y-6">
            <div className="space-y-4 text-gray-300">
              <p className="text-base leading-relaxed">
                You'll see {scenarios.length} real basketball scenarios where negative thoughts show up.
              </p>
              <p className="text-base leading-relaxed">
                For each one, choose the best mental reframe - the thought that would help you perform at your best.
              </p>
              <p className="text-base leading-relaxed">
                Take your time to read each scenario, then pick the answer that feels right.
              </p>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={() => {
              setShowIntro(false);
              setShowScenario(true);
              setScenarioTimeLeft(10);
            }}
            className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#00ff41',
              color: '#000000',
              boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
            }}
          >
            Start Practice
          </button>
        </div>
      </div>
    );
  }

  // Scenario introduction screen
  if (showScenario) {
    const progress = ((10 - scenarioTimeLeft) / 10) * 100;

    return (
      <div className="fixed inset-0 bg-black z-[200]">
        {/* Green progress bar at top */}
        <div className="absolute top-0 left-0 right-0 w-full h-1.5" style={{ backgroundColor: '#1a1a1a' }}>
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: '#00ff41',
              boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
            }}
          />
        </div>

        {/* Main content area - Perfectly centered */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          {/* Scenario text */}
          <div className="space-y-10 text-center animate-fadeIn max-w-2xl">
            <h2 className="text-2xl md:text-3xl leading-relaxed text-white">
              {currentScenario.situation}
            </h2>

            <p className="text-xl md:text-2xl italic text-red-400">
              "{currentScenario.current_thought}"
            </p>
          </div>
        </div>

        {/* Skip button anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 px-6 flex justify-center">
          <div className="w-full max-w-2xl">
            <button
              onClick={() => setShowScenario(false)}
              className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              I'm Ready
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black text-white flex flex-col p-6 z-[200]">
        {/* Question Counter Header */}
        <div className="max-w-2xl w-full mx-auto pt-4 pb-2">
          <div className="text-center text-sm text-gray-500">
            Question {currentScenarioIndex + 1} of {scenarios.length}
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col overflow-hidden">
          {/* Top Section - Scenario (fixed height) */}
          <div className="flex-shrink-0 space-y-6 py-6">
            {/* Shot Clock Timer */}
            <div className="flex justify-center">
              <div className="relative">
                <svg width="100" height="100" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="6" />
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
                      filter: timeLeft > 12 ? 'drop-shadow(0 0 6px rgba(0, 255, 65, 0.6))' : 'none',
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
              <h2 className="text-xl leading-relaxed px-4">{currentScenario.situation}</h2>

              <p className="text-base italic text-red-400/90 px-4">
                "{currentScenario.current_thought}"
              </p>
            </div>
          </div>

          {/* Bottom Section - Prompt & Options (scrollable) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Prompt */}
            {!showFeedback && (
              <p className="text-center text-base text-gray-400 mb-5 flex-shrink-0">{currentPrompt}</p>
            )}

            {/* Scrollable Options Container */}
            <div className="flex-1 overflow-y-auto pb-4" style={{ maxHeight: 'calc(100vh - 500px)' }}>
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
                            boxShadow: '0 0 15px rgba(0, 255, 65, 0.2)',
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
            </div>

            {/* Progress - fixed at bottom of options section */}
            <div className="flex justify-center gap-2 pt-4 flex-shrink-0">
              {scenarios.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full ${index === currentScenarioIndex ? 'w-8' : 'w-1.5'}`}
                  style={{
                    backgroundColor: index <= currentScenarioIndex ? '#00ff41' : '#1a1a1a',
                    boxShadow: index <= currentScenarioIndex ? '0 0 8px rgba(0, 255, 65, 0.4)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 z-[250] animate-fadeIn">
          <div className="max-w-xl w-full space-y-8 animate-slideUp">
            {isTimeout ? (
              <>
                {/* Timeout indicator */}
                <div className="text-center">
                  <div className="text-6xl mb-4">⏱️</div>
                  <h3 className="text-2xl font-bold">Time's Up!</h3>
                </div>

                {/* Timeout message */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                  <p className="text-lg leading-relaxed text-gray-300">
                    No worries! Check out the optimal reframe highlighted below - this is how you want to think in the moment. You're building the skill! 💪
                  </p>
                </div>

                {/* Show the optimal answer highlighted */}
                {selectedOption !== null && (
                  <div className="bg-[#0a0a0a] border border-[#00ff41]/30 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✅</div>
                      <div className="flex-1">
                        <div className="text-base font-medium text-white mb-2">Optimal Reframe:</div>
                        <div className="text-lg text-gray-300">{shuffledOptions[selectedOption].text}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : selectedFeedback ? (
              <>
                {/* Indicator */}
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {selectedFeedback.type === 'optimal' ? '✅' : selectedFeedback.type === 'helpful' ? '💡' : '❌'}
                  </div>
                  <h3 className="text-2xl font-bold">
                    {selectedFeedback.type === 'optimal'
                      ? 'Great Choice!'
                      : selectedFeedback.type === 'helpful'
                      ? 'Good Thinking'
                      : 'Not Quite'}
                  </h3>
                </div>

                {/* Feedback */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                  <p className="text-lg leading-relaxed text-gray-300">{selectedFeedback.feedback}</p>
                </div>
              </>
            ) : null}

            {/* Continue Button */}
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
              }}
            >
              {currentScenarioIndex < scenarios.length - 1 ? 'Continue →' : 'See Results'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
