'use client';

import { useState, useEffect } from 'react';
import type { GameScenario, GameSessionResult } from '@/lib/types/game';
import { ONBOARDING_GAME_SCENARIOS } from '@/lib/onboarding-game-scenarios';

interface CheatCodeGameProps {
  cheatCodeId: string;
  cheatCodeTitle: string;
  isFirstPlay?: boolean;
  onboardingScenarioId?: string; // If provided, use premade scenarios instead of fetching
  onComplete?: (result: GameSessionResult) => void;
  onClose?: () => void;
}

interface CheatCodeData {
  phrase?: string;
  what?: string;
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
  onboardingScenarioId,
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
  const [submitting, setSubmitting] = useState(false);
  const MOTIVATIONAL_QUOTES = [
    { text: "Your thoughts shape your reality on the court", author: null },
    { text: "Confidence is built one rep at a time", author: null },
    { text: "Mental reps count just as much as physical ones", author: null },
    { text: "Champions aren't born in the gym, they're made in the mind", author: null },
    { text: "Your next shot is always your best shot", author: null },
    { text: "Hard work beats talent when talent doesn't work hard.", author: "Kevin Durant" },
    { text: "Trust the process, trust yourself", author: null },
    { text: "Everything negative - pressure, challenges - is all an opportunity for me to rise.", author: "Kobe Bryant" },
    { text: "Pressure is a privilege", author: null },
    { text: "The mind is the limit", author: null },
    { text: "Believe in your training", author: null },
    { text: "The only difference between a good shot and a bad shot is if it goes in or not.", author: "Charles Barkley" },
  ];

  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );
  const [cheatCodeData, setCheatCodeData] = useState<CheatCodeData | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<typeof scenarios[0]['options'][0] | null>(null);

  const currentScenario = scenarios[currentScenarioIndex];
  const currentPrompt = PROMPTS[currentScenarioIndex % PROMPTS.length];

  // Rotate motivational quotes while loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 4000); // Change quote every 4 seconds

    return () => clearInterval(interval);
  }, [loading, MOTIVATIONAL_QUOTES.length]);

  // Fetch scenarios on mount with retry logic
  useEffect(() => {
    console.log('🎮 CheatCodeGame mounted with:', { cheatCodeId, onboardingScenarioId });

    // If we have an onboarding scenario ID and temp code ID, use hardcoded scenarios
    if (onboardingScenarioId && cheatCodeId === 'temp-onboarding-code') {
      console.log('🎯 Using hardcoded onboarding scenarios for:', onboardingScenarioId);
      const onboardingScenarios = ONBOARDING_GAME_SCENARIOS[onboardingScenarioId];

      if (onboardingScenarios && onboardingScenarios.length > 0) {
        // Only use first 2 scenarios for onboarding (quick taste)
        setScenarios(onboardingScenarios.slice(0, 2));
        setLoading(false);
        return;
      } else {
        console.error('❌ No onboarding scenarios found for:', onboardingScenarioId);
        setError('Failed to load game scenarios');
        setLoading(false);
        return;
      }
    }

    // Otherwise, fetch scenarios from API
    let retryCount = 0;
    const maxRetries = 25; // Increased retries for safety
    const retryDelay = 1500; // Faster retry - 1.5 seconds between retries
    const minLoadTime = 4000; // Minimum 4 seconds (1 quote display)
    const startTime = Date.now();
    const absoluteTimeout = 60000; // 60 second hard timeout
    let timeoutId: NodeJS.Timeout | null = null;

    // Set absolute timeout to prevent infinite loops
    const hardTimeoutId = setTimeout(() => {
      console.error('⏰ Hard timeout reached after 60 seconds');
      setError('Game loading timeout. Please try again.');
      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }, absoluteTimeout);

    async function fetchScenarios() {
      try {
        const response = await fetch('/api/game/get-scenarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          cache: 'no-store',
          body: JSON.stringify({
            cheat_code_id: cheatCodeId,
            auto_generate: true, // Always allow auto-generation
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('❌ API returned error status:', response.status, data);
          clearTimeout(hardTimeoutId);
          setError(data.error || data.details || `HTTP ${response.status}: ${response.statusText}`);
          setLoading(false);
          return;
        }

        if (!data.success) {
          // API returned an error
          console.error('❌ API error:', data.error, data.details);
          clearTimeout(hardTimeoutId);
          setError(data.error || 'Failed to load game. Please try again.');
          setLoading(false);
          return;
        }

        if (!data.has_scenarios) {
          // If generation was triggered, give it more time
          if (data.generating && retryCount === 0) {
            console.log(`🎮 Scenarios are being generated, will retry in ${retryDelay}ms...`);
          }

          // Retry if scenarios aren't ready yet (might still be generating)
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Scenarios not ready, retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})...`);
            timeoutId = setTimeout(fetchScenarios, retryDelay);
            return;
          }

          clearTimeout(hardTimeoutId);
          setError('Scenarios are still being generated. Please try again in a few moments.');
          setLoading(false);
          return;
        }

        // Success! Clear the hard timeout
        clearTimeout(hardTimeoutId);

        // Ensure minimum loading time for at least 1 quote
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);

        setTimeout(() => {
          setScenarios(data.scenarios);
          setLoading(false);
        }, remainingTime);
      } catch (err) {
        console.error('❌ Error fetching scenarios:', err);
        clearTimeout(hardTimeoutId);
        setError('Failed to load game. Please check your connection and try again.');
        setLoading(false);
      }
    }

    // Start fetching immediately - no initial delay
    fetchScenarios();
  }, [cheatCodeId, onboardingScenarioId]);

  // Fetch cheat code data for intro screen
  useEffect(() => {
    // Skip fetching during onboarding - we use premade scenarios and don't need the DB data
    if (onboardingScenarioId) {
      console.log('⏭️ Skipping cheat code fetch for onboarding scenario:', onboardingScenarioId);
      return;
    }

    async function fetchCheatCodeData() {
      try {
        console.log('🎯 Fetching cheat code data for:', cheatCodeId);
        const response = await fetch('/api/game/get-cheat-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cheat_code_id: cheatCodeId }),
        });
        const data = await response.json();
        console.log('🎯 API response:', data);

        // Debug: Log raw content if available
        if (data.debug && data.rawContent) {
          console.log('🐛 DEBUG MODE - Raw content from database:');
          console.log(data.rawContent);
        }

        if (data.success && data.cheatCode) {
          console.log('✅ Setting cheat code data:', data.cheatCode);
          setCheatCodeData({
            phrase: data.cheatCode.phrase,
            what: data.cheatCode.what,
          });
        } else {
          console.error('❌ API returned unsuccessful or missing cheatCode:', data);
        }
      } catch (err) {
        console.error('❌ Failed to fetch cheat code data:', err);
      }
    }
    fetchCheatCodeData();
  }, [cheatCodeId, onboardingScenarioId]);

  // Handle browser back button to prevent navigation away from app
  useEffect(() => {
    if (!onClose) return;

    // Push a history state when modal opens
    window.history.pushState({ modal: 'game-intro' }, '');

    const handlePopState = () => {
      // When back button is pressed, close the modal instead of navigating
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

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
    setSelectedFeedback(selectedOptionData);

    // Update score immediately for correct tracking
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
    setSubmitting(true);
    try {
      // Ensure we have the final answer recorded before submitting
      const finalAnswers = [...userAnswers];

      // Debug logging
      console.log('📤 Submitting game session:', {
        cheat_code_id: cheatCodeId,
        scenario_ids: scenarios.map(s => s.id),
        user_answers: finalAnswers,
        scenarios_length: scenarios.length,
        answers_length: finalAnswers.length,
        is_first_play: isFirstPlay,
      });

      // Otherwise, submit to API for regular games
      const response = await fetch('/api/game/submit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cheat_code_id: cheatCodeId,
          scenario_ids: scenarios.map(s => s.id),
          user_answers: finalAnswers,
          is_first_play: isFirstPlay,
        }),
      });

      const data = await response.json();

      console.log('📥 API response:', data);

      if (data.success) {
        setResult(data.result);
        setGameComplete(true);
        if (onComplete) {
          onComplete(data.result);
        }
      } else {
        console.error('❌ API returned error:', data);
        // Create a fallback result so user can still see their score
        const fallbackResult: GameSessionResult = {
          session_id: 'error-session',
          score: score,
          total_questions: scenarios.length,
          momentum_awarded: 0,
          is_first_play: false,
          previous_momentum: 0,
          new_momentum: 0,
        };
        setResult(fallbackResult);
        setGameComplete(true);
      }
    } catch (err) {
      console.error('❌ Failed to submit game session:', err);
      // Create a fallback result so user can still see their score
      const fallbackResult: GameSessionResult = {
        session_id: 'error-session',
        score: score,
        total_questions: scenarios.length,
        momentum_awarded: 0,
        is_first_play: false,
        previous_momentum: 0,
        new_momentum: 0,
      };
      setResult(fallbackResult);
      setGameComplete(true);
    } finally {
      setSubmitting(false);
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
          <div className="relative min-h-[160px] flex flex-col items-center justify-center">
            <div
              key={currentQuoteIndex}
              className="space-y-4"
              style={{
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            >
              <p className="text-3xl md:text-4xl font-bold text-white leading-relaxed px-4 text-center">
                "{MOTIVATIONAL_QUOTES[currentQuoteIndex].text}"
              </p>
              {MOTIVATIONAL_QUOTES[currentQuoteIndex].author && (
                <p className="text-lg text-gray-400 text-center">
                  — {MOTIVATIONAL_QUOTES[currentQuoteIndex].author}
                </p>
              )}
            </div>
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

  // Intro screen - show before starting the game
  if (showIntro && !loading) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6 z-[200]">
        {/* Back Button - matches chat style */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2 transition-colors"
            aria-label="Go back"
            style={{ color: '#00ff41' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        )}

        <div className="max-w-2xl w-full">
          {/* 1. Green Circle */}
          <div className="flex justify-center mb-8">
            <div
              className="w-20 h-20 rounded-full"
              style={{
                backgroundColor: '#00ff41',
                boxShadow: '0 0 40px rgba(0, 255, 65, 0.4)'
              }}
            />
          </div>

          {/* 2. Header */}
          <div className="text-center mb-3">
            <h1 className="text-4xl font-bold">Ready?</h1>
          </div>

          {/* 3. Subtext */}
          <div className="text-center mb-8">
            <p className="text-xl text-gray-400">Practice your cheat code</p>
          </div>

          {/* 4. Practice game description */}
          <div className="text-center mb-10">
            <p className="text-base text-gray-300 leading-relaxed">
              For each of the following scenarios, choose the best mental reframe - the thought that would help you perform at your best.
            </p>
          </div>

          {/* 5. Start Practice button */}
          <button
            onClick={() => {
              setShowIntro(false);
              setShowScenario(true);
              setScenarioTimeLeft(10);
            }}
            className="w-full py-5 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] mb-6"
            style={{
              backgroundColor: '#00ff41',
              color: '#000000',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.3)',
            }}
          >
            Start Practice
          </button>

          {/* 6. Remember section - ALWAYS show with border box, positioned UNDER button */}
          <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50">
            <p className="text-base text-gray-300 leading-relaxed text-center">
              <span className="font-semibold text-white">Remember:</span> {cheatCodeData && cheatCodeData.phrase && cheatCodeData.what
                ? (() => {
                    // Extract the first sentence from the why section (before "remember:" or first period)
                    const firstSentence = cheatCodeData.what.split(/remember:|\./).filter(s => s.trim().length > 10)[0] || cheatCodeData.what;

                    // Remove "This works because" and capitalize first letter
                    let cleanedText = firstSentence
                      .replace(/^this works because\s+/i, '')
                      .trim();

                    // Capitalize first letter
                    cleanedText = cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);

                    return `${cleanedText}.`;
                  })()
                : cheatCodeData && cheatCodeData.phrase
                ? `This mindset shift will help you perform at your best.`
                : `Practice your "${cheatCodeTitle}" mindset shift.`}
            </p>
          </div>
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

            {result.momentum_awarded === 0 && result.no_momentum_reason && (
              <div className="pt-4 border-t border-[#1a1a1a]">
                <div className="text-sm text-gray-500 mb-2">Momentum</div>
                <div className="text-base text-gray-300 leading-relaxed">
                  {result.no_momentum_reason === 'daily_cap' && (
                    <>Great work! You've earned your daily momentum cap. Keep practicing to maintain your skills, and come back tomorrow for more gains!</>
                  )}
                  {result.no_momentum_reason === 'daily_code_limit' && (
                    <>You've practiced this code 3 times today! Try a different code or come back tomorrow for more momentum.</>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Only show Play Again for non-onboarding games */}
            {!onboardingScenarioId && (
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
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={
                  onboardingScenarioId
                    ? {
                        backgroundColor: '#00ff41',
                        color: '#000000',
                        boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                      }
                    : { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }
              >
                Continue
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

  // Intro screen is shown earlier (lines 357-413) before scenarios are loaded

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
      <div className="fixed inset-0 bg-black text-white flex flex-col p-4 lg:p-8 z-[200]">
        {/* Question Counter Header - Compact */}
        <div className="max-w-2xl w-full mx-auto pt-2 lg:pt-4 pb-1 lg:pb-2">
          <div className="text-center text-xs lg:text-sm text-gray-500">
            Question {currentScenarioIndex + 1} of {scenarios.length}
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col overflow-hidden justify-center">
          {/* Top Section - Scenario (compact) */}
          <div className="flex-shrink-0 space-y-4 lg:space-y-6 py-4 lg:py-6">
            {/* Shot Clock Timer */}
            <div className="flex justify-center">
              <div className="relative">
                <svg width="80" height="80" className="transform -rotate-90 lg:w-[70px] lg:h-[70px]">
                  {/* Background circle */}
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#1a1a1a" strokeWidth="5" className="lg:cx-35 lg:cy-35 lg:r-32" />
                  {/* Progress circle */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke={timeLeft > 12 ? '#00ff41' : timeLeft > 6 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - timeLeft / 24)}`}
                    className="lg:cx-35 lg:cy-35 lg:r-32"
                    style={{
                      transition: 'stroke-dashoffset 1s linear',
                      filter: timeLeft > 12 ? 'drop-shadow(0 0 6px rgba(0, 255, 65, 0.6))' : 'none',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl lg:text-2xl font-bold">{timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Scenario */}
            <div className="text-center space-y-3 lg:space-y-4">
              <h2 className="text-lg lg:text-lg leading-snug px-3">{currentScenario.situation}</h2>

              <p className="text-base lg:text-base italic text-red-400/90 px-3">
                "{currentScenario.current_thought}"
              </p>
            </div>
          </div>

          {/* Bottom Section - Prompt & Options (scrollable) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Prompt */}
            {!showFeedback && (
              <p className="text-center text-base lg:text-base text-gray-400 mb-4 lg:mb-6 flex-shrink-0">{currentPrompt}</p>
            )}

            {/* Scrollable Options Container */}
            <div className="flex-1 overflow-y-auto pb-4 lg:pb-8" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              <div className="space-y-4 lg:space-y-4">
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
                    className={`w-full p-5 lg:p-5 rounded-xl text-left transition-all ${
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
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 font-mono text-base lg:text-base flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className={`text-base lg:text-base leading-relaxed ${showFeedback && !isOptimal && !isSelected ? 'text-gray-600' : ''}`}>
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>

            {/* Progress - fixed at bottom of options section */}
            <div className="flex justify-center gap-2 pt-4 lg:pt-6 flex-shrink-0">
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[250] animate-fadeIn flex flex-col">
          {/* Scrollable content area - centered vertically */}
          <div className="flex-1 overflow-y-auto p-6 pb-2 flex items-center">
            <div className="max-w-xl w-full mx-auto space-y-6 animate-slideUp">
              {isTimeout ? (
                <>
                  {/* Timeout indicator */}
                  <div className="text-center">
                    <div className="text-5xl mb-3">⏱️</div>
                    <h3 className="text-xl font-bold">Time's Up!</h3>
                  </div>

                  {/* Timeout message */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                    <p className="text-base leading-relaxed text-gray-300">
                      No worries! Check out the optimal reframe - this is how you want to think in the moment. You're building the skill! 💪
                    </p>
                  </div>

                  {/* Show the optimal answer highlighted */}
                  {selectedOption !== null && (
                    <div className="bg-[#0a0a0a] border border-[#00ff41]/30 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="text-xl">✅</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white mb-1.5">Optimal Reframe:</div>
                          <div className="text-base text-gray-300">{shuffledOptions[selectedOption].text}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : selectedFeedback ? (
                <>
                  {/* Indicator */}
                  <div className="text-center">
                    <div className="text-5xl mb-3">
                      {selectedFeedback.type === 'optimal' ? '✅' : selectedFeedback.type === 'helpful' ? '💡' : '❌'}
                    </div>
                    <h3 className="text-xl font-bold">
                      {selectedFeedback.type === 'optimal'
                        ? 'Great Choice!'
                        : selectedFeedback.type === 'helpful'
                        ? 'Good Thinking'
                        : 'Not Quite'}
                    </h3>
                  </div>

                  {/* Feedback */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                    <p className="text-base leading-relaxed text-gray-300">{selectedFeedback.feedback}</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Fixed Continue Button at bottom */}
          <div className="flex-shrink-0 p-6 pt-4">
            <div className="max-w-xl w-full mx-auto">
              <button
                onClick={handleNext}
                disabled={submitting}
                className="w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#00ff41',
                  color: '#000000',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Loading Results...
                  </div>
                ) : (
                  currentScenarioIndex < scenarios.length - 1 ? 'Continue →' : 'See Results'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay - Pulsing Green Circle */}
      {submitting && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[300]">
          <div className="text-center space-y-6">
            <div
              className="w-24 h-24 rounded-full mx-auto animate-pulse-glow"
              style={{
                backgroundColor: '#00ff41',
                boxShadow: '0 0 60px rgba(0, 255, 65, 0.6), 0 0 120px rgba(0, 255, 65, 0.4)',
              }}
            />
            <p className="text-lg text-gray-300 font-medium">Loading Results...</p>
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
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .animate-pulse-glow {
          animation: pulseGlow 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
