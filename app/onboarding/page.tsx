'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import OnboardingChatWrapper from './OnboardingChatWrapper';

const AGE_OPTIONS = [
  { value: '13-15', label: '13-15' },
  { value: '16-18', label: '16-18' },
  { value: '19-24', label: '19-24' },
  { value: '25+', label: '25+' }
];

const LEVEL_OPTIONS = [
  { value: 'middle_school', label: 'Middle School' },
  { value: 'high_school', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'rec', label: 'Rec/Pickup' },
  { value: 'solo', label: 'Training Solo' }
];

const SPECIFIC_SCENARIOS = [
  {
    value: 'airball_laugh',
    label: 'You airball in front of everyone and hear someone laugh',
    category: 'In-Game'
  },
  {
    value: 'coach_yells',
    label: "Coach yells at you and you can't shake it off",
    category: 'Off Court'
  },
  {
    value: 'miss_spiral',
    label: "You're playing great, then miss one shot and spiral",
    category: 'In-Game'
  },
  {
    value: 'pressure_counting',
    label: "Teammates are counting on you and you feel the pressure",
    category: 'In-Game'
  },
  {
    value: 'better_opponent',
    label: "You're matched up against someone way better than you",
    category: 'Pre-Game'
  },
  {
    value: 'mistake_replaying',
    label: "You made a mistake and can't stop replaying it",
    category: 'Post-Game'
  },
  {
    value: 'overthinking',
    label: "You're in your head overthinking instead of just playing",
    category: 'In-Game'
  },
  {
    value: 'faking_confidence',
    label: "Everyone else seems confident but you're faking it",
    category: 'Locker Room'
  }
];

const ZONE_STATES = [
  { value: 'automatic', label: 'Automatic - not thinking, just flowing' },
  { value: 'fearless', label: 'Fearless - ready for any moment' },
  { value: 'locked_in', label: "Locked in - nothing can break my focus" },
  { value: 'loose', label: 'Loose - relaxed and confident' },
  { value: 'next_play', label: "Next play mentality - mistakes don't stick" }
];


export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form data
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [level, setLevel] = useState('');
  const [specificScenario, setSpecificScenario] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [zoneState, setZoneState] = useState('');
  const [generatedCode, setGeneratedCode] = useState<{title: string; description: string} | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [practiceChoice, setPracticeChoice] = useState<string | null>(null);
  const [coachMessage, setCoachMessage] = useState('');
  const [initialChatMessage, setInitialChatMessage] = useState<string>('');
  const [showChat, setShowChat] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const totalSteps = 7;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('No session found:', error);
          router.push('/signup');
          return;
        }

        setIsAuthenticated(true);
        setCheckingAuth(false);
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/signup');
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    // Validation for each step
    if (step === 1 && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (step === 2 && !age) {
      setError('Please select your age');
      return;
    }
    if (step === 3 && !level) {
      setError('Please select your level');
      return;
    }
    if (step === 4 && !specificScenario) {
      setError('Please select the scenario that resonates most');
      return;
    }
    if (step === 6 && !zoneState) {
      setError('Please select what being in the zone feels like for you');
      return;
    }

    setError('');

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Step 7 is the last step, no need to call handleSubmit here
      // The OnboardingChatWrapper handles completion
    }
  };

  const handleChatComplete = () => {
    // Called when user clicks "Get Reps In" button - start practice game
    // For now, we'll redirect to home and save the code
    // TODO: In the future, this should open the practice game directly
    handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) {
      setError('');
      setStep(step - 1);
    }
  };

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Generate first cheat code when entering step 7
  useEffect(() => {
    if (step === 7 && !generatedCode && !generatingCode) {
      generateFirstCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const generateFirstCode = async () => {
    setGeneratingCode(true);
    // Scroll to top when loading starts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const scenario = SPECIFIC_SCENARIOS.find(s => s.value === specificScenario);
      const zone = ZONE_STATES.find(z => z.value === zoneState);

      // Use the new personalization system
      const response = await fetch('/api/generate-onboarding-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age,
          level,
          confidenceLevel,
          scenario: specificScenario, // Send the value (key)
          scenarioLabel: scenario?.label || '', // Send the human-readable label
          zoneState: zoneState, // Send the value (key)
          zoneStateLabel: zone?.label || '' // Send the human-readable label
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();

      // Store the coach message and move to step 7 (chat view)
      setCoachMessage(data.message);
      setStep(7);
    } catch (err) {
      console.error('Error generating code:', err);
      setError('Failed to generate your cheat code. Please try again.');
      setGeneratingCode(false);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError || !session?.user) {
        console.error('Auth error:', authError);
        setError('Not authenticated. Please sign in again.');
        setLoading(false);
        return;
      }

      const user = session.user;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: name,
          age_bracket: age,
          skill_level: level,
          confidence_level: confidenceLevel,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Failed to save your information. Please try again.');
        setLoading(false);
        return;
      }

      // Save the generated cheat code to the database
      if (generatedCode) {
        const scenario = SPECIFIC_SCENARIOS.find(s => s.value === specificScenario);
        const { error: codeError } = await supabase
          .from('cheat_codes')
          .insert({
            user_id: user.id,
            title: generatedCode.title,
            category: scenario?.category || 'In-Game',
            content: generatedCode.description,
            is_active: true,
            created_at: new Date().toISOString()
          });

        if (codeError) {
          console.error('Error saving cheat code:', codeError);
          // Don't fail the whole onboarding if code save fails
        }
      }

      // Success! Redirect to home page with tutorial flag
      router.push('/?onboarding=complete');
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const getConfidenceLabel = (value: number) => {
    const labels = [
      'I doubt myself constantly',
      'Not very confident',
      'Sometimes confident',
      'Usually confident',
      'I play with full confidence'
    ];
    return labels[value - 1];
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl" style={{ color: '#00ff41' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render the form if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-black text-white font-sans flex flex-col overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full bg-zinc-900 h-1 flex-shrink-0">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${(step / totalSteps) * 100}%`,
            backgroundColor: '#00ff41'
          }}
        />
      </div>

      {/* Header with Back Arrow */}
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full flex-shrink-0">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="p-2 -ml-2 text-white hover:text-green-500 transition-colors disabled:opacity-50"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          ) : (
            <div className="w-10"></div>
          )}
          <div className="text-zinc-500 text-sm">
            Step {step} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 max-w-2xl mx-auto w-full overflow-y-auto">

        {/* Error Message */}
        {error && (
          <div className="w-full mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="w-full space-y-8 animate-fade-in">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-center">
                What's your name?
              </h1>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-5 text-xl text-center text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Age */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-center">
                How old are you?
              </h1>
              <div className="grid grid-cols-2 gap-4">
                {AGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAge(option.value)}
                    className={`p-6 rounded-xl text-lg font-semibold transition-all ${
                      age === option.value
                        ? 'text-black border-2'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
                    }`}
                    style={age === option.value ? { backgroundColor: '#00ff41', borderColor: '#00ff41' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Level */}
          {step === 3 && (
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-center">
                What level are you playing at?
              </h1>
              <div className="space-y-3">
                {LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLevel(option.value)}
                    className={`w-full p-5 rounded-xl text-lg font-semibold transition-all ${
                      level === option.value
                        ? 'text-black border-2'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
                    }`}
                    style={level === option.value ? { backgroundColor: '#00ff41', borderColor: '#00ff41' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Pick Specific Scenario */}
          {step === 4 && (
            <div className="space-y-6 pb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
                  Pick the moment that hits hardest for you
                </h1>
                <p className="text-center text-zinc-400">
                  Which scenario would affect you the most?
                </p>
              </div>
              <div className="space-y-3">
                {SPECIFIC_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.value}
                    onClick={() => setSpecificScenario(scenario.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                      specificScenario === scenario.value
                        ? 'text-black'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                    style={specificScenario === scenario.value ? { backgroundColor: '#00ff41', borderColor: '#00ff41' } : { borderColor: '#27272a' }}
                  >
                    <div className="font-medium leading-snug">
                      {scenario.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Confidence Slider */}
          {step === 5 && (
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold text-center">
                How confident do you feel on the court?
              </h1>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2" style={{ color: '#00ff41' }}>
                    {confidenceLevel}
                  </div>
                  <div className="text-zinc-400 text-sm">
                    {getConfidenceLabel(confidenceLevel)}
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00ff41 0%, #00ff41 ${((confidenceLevel - 1) / 4) * 100}%, #27272a ${((confidenceLevel - 1) / 4) * 100}%, #27272a 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Zone State */}
          {step === 6 && (
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-center">
                What does it feel like when you're in the zone?
              </h1>
              <div className="space-y-3">
                {ZONE_STATES.map((zone) => (
                  <button
                    key={zone.value}
                    onClick={() => setZoneState(zone.value)}
                    className={`w-full p-5 rounded-xl text-left font-medium transition-all ${
                      zoneState === zone.value
                        ? 'text-black border-2'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
                    }`}
                    style={zoneState === zone.value ? { backgroundColor: '#00ff41', borderColor: '#00ff41' } : {}}
                  >
                    {zone.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Your First Cheat Code (Chat Experience) */}
          {step === 7 && (
            <div className="space-y-8">
              {generatingCode ? (
                // Loading state - centered
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center space-y-8">
                    {/* Pulsing Green Circle - matches game loading visual */}
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
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Creating your first cheat code...</h2>
                      <p className="text-zinc-400">
                        Based on everything you've shared, I'm crafting a personalized mental tool just for you.
                      </p>
                    </div>
                  </div>
                </div>
              ) : coachMessage ? (
                // Chat interface with personalized code
                <div className="fixed inset-0 z-50 bg-black">
                  <OnboardingChatWrapper
                    name={name}
                    initialMessage={coachMessage}
                    userAnswer={ZONE_STATES.find(z => z.value === zoneState)?.label || zoneState}
                    scenarioCategory={SPECIFIC_SCENARIOS.find(s => s.value === specificScenario)?.category || 'In-Game'}
                    scenarioId={specificScenario}
                    onComplete={handleChatComplete}
                    onBack={() => setStep(6)}
                  />
                </div>
              ) : null}
            </div>
          )}


        </div>

        {/* Continue Button - Hidden on step 7 */}
        {step !== 7 && (
          <div className="w-full mt-8 mb-8">
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}
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
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00ff41;
          cursor: pointer;
          border: 3px solid #000;
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00ff41;
          cursor: pointer;
          border: 3px solid #000;
        }
      `}</style>
    </div>
  );
}
