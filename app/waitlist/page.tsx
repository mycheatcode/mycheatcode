'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  positionOptions,
  levelOptions,
  goalOptions,
  urgencyOptions,
  waitlistSignupSchema,
  type WaitlistSignupData,
  type WaitlistApiResponse
} from '@/lib/waitlist-types';

function WaitlistContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<WaitlistSignupData>({
    email: '',
    position: '' as any, // Will be validated on submit
    level: 'High School',
    goals: [],
    customGoal: '',
    urgency: undefined,
    referralCode: '',
    consent: false,
    nickname: '' // Honeypot field
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(0);

  // Auto-fill referral code from URL
  useEffect(() => {
    const referralCode = searchParams?.get('r');
    if (referralCode) {
      setFormData(prev => ({ ...prev, referralCode }));
    }

    // Handle error messages from URL params
    const error = searchParams?.get('error');
    if (error) {
      let errorMessage = 'An error occurred. Please try again.';
      switch (error) {
        case 'missing-token':
          errorMessage = 'Invalid confirmation link. Please sign up again.';
          break;
        case 'invalid-token':
          errorMessage = 'Confirmation link has expired. Please sign up again.';
          break;
        case 'confirmation-failed':
          errorMessage = 'Email confirmation failed. Please try again.';
          break;
      }
      setErrors({ general: errorMessage });
    }
  }, [searchParams]);

  // Cooldown timer
  useEffect(() => {
    if (submitCooldown > 0) {
      const timer = setTimeout(() => setSubmitCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [submitCooldown]);

  const handleInputChange = (field: keyof WaitlistSignupData, value: string | boolean | undefined | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    setFormData(prev => {
      let newGoals = [...prev.goals];

      if (goal === 'All of the Above') {
        if (checked) {
          // Select all goals except "Other"
          newGoals = goalOptions.filter(g => g !== 'Other' && g !== 'All of the Above');
          newGoals.push('All of the Above');
        } else {
          // Deselect all
          newGoals = [];
        }
      } else {
        if (checked) {
          // Remove "All of the Above" if selecting individual items
          newGoals = newGoals.filter(g => g !== 'All of the Above');
          // Add the new goal
          if (!newGoals.includes(goal)) {
            newGoals.push(goal);
          }
        } else {
          // Remove the goal
          newGoals = newGoals.filter(g => g !== goal);
        }
      }

      return { ...prev, goals: newGoals };
    });

    // Clear field error
    if (errors.goals) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.goals;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || submitCooldown > 0) return;

    // Client-side validation
    const result = waitlistSignupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string> = {};

      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          formattedErrors[field] = messages[0];
        }
      });

      setErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: WaitlistApiResponse = await response.json();

      if (data.ok) {
        setShowSuccess(true);
      } else if (data.fieldErrors) {
        setErrors(data.fieldErrors);
      } else {
        setErrors({ general: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
      setSubmitCooldown(5); // 5-second cooldown
    }
  };

  if (showSuccess) {
    return <SuccessView />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              MyCheatCode
            </h1>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Your Mental Game.<br />Unlocked.
          </h2>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-12">
            The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left side - Benefits & Use Cases */}
          <div className="space-y-12">
            {/* Key Benefits */}
            <div>
              <h3 className="text-4xl font-bold text-white mb-8">How It Works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Mental Cheat Codes</h4>
                    <p className="text-zinc-300 leading-relaxed">Personalized mental strategies that help you break through mental barriers, unlock your game and give you an instant edge in clutch moments.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">AI-Powered Coaching</h4>
                    <p className="text-zinc-300 leading-relaxed">Advanced AI trained on proven sports psychology methods, delivering expert-level coaching insights instantly, available 24/7.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Performance Analytics</h4>
                    <p className="text-zinc-300 leading-relaxed">Track your mental game improvements with data-driven insights that show real progress over time.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h3 className="text-4xl font-bold text-white mb-8">Upgrade Every Part of Your Game</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Confidence Issues</h4>
                  <p className="text-sm text-zinc-300">Overthinking, self-doubt, and nerves</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Pressure Situations</h4>
                  <p className="text-sm text-zinc-300">Free throws, clutch shots, big games</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Consistency</h4>
                  <p className="text-sm text-zinc-300">Peak performance game after game</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Focus & Flow</h4>
                  <p className="text-sm text-zinc-300">Staying locked in and in the zone</p>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Almost Ready</h3>
                <p className="text-lg text-zinc-300">The future of mental performance is almost here. Be the first to get the advantage.</p>
              </div>
            </div>

          </div>

          {/* Right side - Signup Form */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-zinc-900/30 border border-zinc-700/50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-3">Join The Waitlist</h3>
                <p className="text-lg text-zinc-300">Be the first to unlock your potential</p>
              </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
                <p className="text-red-300 text-sm text-center">{errors.general}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900 text-white placeholder-zinc-400 transition-all duration-200"
                placeholder="Your email address"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-400" role="alert">{errors.email}</p>
              )}
            </div>

            {/* Position */}
            <div>
              <select
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900 text-white transition-all duration-200"
                required
                aria-invalid={!!errors.position}
                aria-describedby={errors.position ? 'position-error' : undefined}
              >
                <option value="">Select your primary position</option>
                {positionOptions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-zinc-500">We'll use this to personalize your cheat codes and coaching prompts.</p>
              {errors.position && (
                <p id="position-error" className="mt-2 text-sm text-red-400" role="alert">{errors.position}</p>
              )}
            </div>

            {/* Level */}
            <div>
              <select
                id="level"
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900 text-white transition-all duration-200"
                required
                aria-invalid={!!errors.level}
                aria-describedby={errors.level ? 'level-error' : undefined}
              >
                {levelOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.level && (
                <p id="level-error" className="mt-2 text-sm text-red-400" role="alert">{errors.level}</p>
              )}
            </div>

            {/* Goals Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                What aspects do you want MyCheatCode to help you with? (Select all that apply)
              </label>
              <div className="space-y-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                {goalOptions.map(goal => (
                  <label key={goal} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.goals.includes(goal)}
                      onChange={(e) => handleGoalChange(goal, e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500/50 focus:ring-2"
                    />
                    <span className="text-sm text-zinc-300 leading-relaxed">{goal}</span>
                  </label>
                ))}

                {/* Custom Goal Input - Only show if "Other" is selected */}
                {formData.goals.includes('Other') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Please specify..."
                      value={formData.customGoal || ''}
                      onChange={(e) => handleInputChange('customGoal', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-400 text-sm"
                    />
                  </div>
                )}
              </div>
              {errors.goals && (
                <p id="goals-error" className="mt-2 text-sm text-red-400" role="alert">{errors.goals}</p>
              )}
            </div>

            {/* Urgency */}
            <div>
              <select
                id="urgency"
                value={formData.urgency || ''}
                onChange={(e) => handleInputChange('urgency', e.target.value || undefined)}
                className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900 text-white transition-all duration-200"
              >
                <option value="">When do you need this? (Optional)</option>
                {urgencyOptions.map(urgency => (
                  <option key={urgency} value={urgency}>{urgency}</option>
                ))}
              </select>
            </div>


          {/* Honeypot field (hidden) */}
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

            {/* Consent */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => handleInputChange('consent', e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-500 bg-zinc-900/50 border-2 border-zinc-700/50 rounded-md focus:ring-blue-500/50 focus:ring-2 accent-blue-500"
                  required
                  aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? 'consent-error' : undefined}
                />
                <span className="text-sm text-zinc-400 leading-relaxed">
                  Yes, send me early access and launch updates
                </span>
              </label>
              {errors.consent && (
                <p id="consent-error" className="mt-2 text-sm text-red-400" role="alert">{errors.consent}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || submitCooldown > 0}
              className="w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Joining...
                </>
              ) : submitCooldown > 0 ? (
                `Wait ${submitCooldown}s`
              ) : (
                'Claim Your Spot'
              )}
            </button>

              <p className="text-center text-sm text-zinc-500 mt-6">
                Free to join. No spam, ever.
              </p>
            </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SuccessView() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            MyCheatCode
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="max-w-lg text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Main Message */}
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Submission Entered
          </h1>

          <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
            Check your email to secure your spot. We'll notify you as soon as early access is available.
          </p>

          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-8">
            <p className="text-amber-200 text-sm">
              📧 <strong>Don't see the email?</strong> Check your spam/junk folder - sometimes our emails end up there!
            </p>
          </div>

          {/* Additional Info */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">What happens next?</h2>
            <ul className="text-left text-zinc-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>We'll send you updates as we build your AI basketball coach</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>You'll get early access before the public launch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Your feedback will help shape the final product</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-sm text-zinc-400">
            <p>Questions? Email us at <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">team@mycheatcode.ai</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <WaitlistContent />
    </Suspense>
  );
}
