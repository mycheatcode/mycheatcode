'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

const CONFIDENCE_BLOCKERS = [
  { value: 'missed_shots', label: 'Missing shots' },
  { value: 'pressure', label: 'Pressure situations' },
  { value: 'mistakes', label: 'Making mistakes in front of others' },
  { value: 'comparison', label: 'Comparing myself to teammates' },
  { value: 'coach_reactions', label: "Coach's reactions" },
  { value: 'self_talk', label: 'Negative self-talk' },
  { value: 'competition', label: 'Playing against better competition' }
];

const CONFIDENCE_GOALS = [
  { value: 'bounce_back', label: 'Bounce back faster after mistakes' },
  { value: 'pressure_moments', label: 'Stay confident in pressure moments' },
  { value: 'stop_overthinking', label: 'Stop overthinking and just play' },
  { value: 'self_belief', label: 'Believe in myself even when struggling' },
  { value: 'consistency', label: 'Play with consistent confidence' }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [level, setLevel] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [why, setWhy] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const totalSteps = 7;

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
    if (step === 5 && blockers.length === 0) {
      setError('Please select at least one option');
      return;
    }
    if (step === 6 && !goal) {
      setError('Please select what you want to work on');
      return;
    }

    setError('');

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setError('');
      setStep(step - 1);
    }
  };

  const toggleBlocker = (blocker: string) => {
    if (blockers.includes(blocker)) {
      setBlockers(blockers.filter(b => b !== blocker));
    } else {
      if (blockers.length < 3) {
        setBlockers([...blockers, blocker]);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: name,
          age_bracket: age,
          skill_level: level,
          confidence_level: confidenceLevel,
          confidence_blockers: blockers,
          confidence_goal: goal,
          biggest_challenge: why || null,
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

      // Success! Redirect to home
      router.push('/');
      router.refresh();
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

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-zinc-900 h-1">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${(step / totalSteps) * 100}%`,
            backgroundColor: '#00ff41'
          }}
        />
      </div>

      {/* Header with Back Arrow */}
      <div className="p-6 max-w-2xl mx-auto w-full">
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
      <div className="flex-1 flex flex-col p-6 pt-8 max-w-2xl mx-auto w-full">

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

          {/* Step 4: Confidence Level */}
          {step === 4 && (
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

          {/* Step 5: Confidence Blockers */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">
                  What kills your confidence most?
                </h1>
                <p className="text-center text-zinc-400 text-sm">
                  Select up to 3
                </p>
              </div>
              <div className="space-y-3">
                {CONFIDENCE_BLOCKERS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleBlocker(option.value)}
                    className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                      blockers.includes(option.value)
                        ? 'text-black border-2'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
                    }`}
                    style={blockers.includes(option.value) ? { backgroundColor: '#00ff41', borderColor: '#00ff41' } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {blockers.includes(option.value) && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Goal */}
          {step === 6 && (
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-center">
                What do you want to work on?
              </h1>
              <div className="space-y-3">
                {CONFIDENCE_GOALS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGoal(option.value)}
                    className={`w-full p-5 rounded-xl text-left font-medium transition-all ${
                      goal === option.value
                        ? 'text-black border-2'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
                    }`}
                    style={goal === option.value ? { backgroundColor: '#00ff41', borderColor: '#00ff41' } : {}}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Why */}
          {step === 7 && (
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-center">
                Why does this matter to you?
              </h1>
              <p className="text-center text-zinc-400 text-sm -mt-2">
                Optional - but it helps me coach you better
              </p>
              <textarea
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Share your thoughts..."
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-5 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
              />
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="w-full mt-12">
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : step === totalSteps ? "Let's Go!" : 'Continue'}
          </button>
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
