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
    position: '' as any,
    level: '' as any,
    goals: [],
    customGoal: '',
    urgency: undefined,
    referralCode: '',
    consent: false,
    nickname: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(0);

  useEffect(() => {
    const referralCode = searchParams?.get('r');
    if (referralCode) {
      setFormData(prev => ({ ...prev, referralCode }));
    }

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

  useEffect(() => {
    if (submitCooldown > 0) {
      const timer = setTimeout(() => setSubmitCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [submitCooldown]);

  const handleInputChange = (field: keyof WaitlistSignupData, value: string | boolean | undefined | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          newGoals = goalOptions.filter(g => g !== 'Other' && g !== 'All of the Above');
          newGoals.push('All of the Above');
        } else {
          newGoals = [];
        }
      } else {
        if (checked) {
          newGoals = newGoals.filter(g => g !== 'All of the Above');
          if (!newGoals.includes(goal)) {
            newGoals.push(goal);
          }
        } else {
          newGoals = newGoals.filter(g => g !== goal);
        }
      }
      return { ...prev, goals: newGoals };
    });

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
        headers: { 'Content-Type': 'application/json' },
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
      setSubmitCooldown(5);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              You're In!
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Check your email to confirm your spot. We'll notify you the moment early access opens.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-8">
              <p className="text-amber-200 text-sm">
                📧 <strong>Don't see the email?</strong> Check your spam folder - our emails sometimes land there!
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-4">What happens next?</h2>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">Exclusive updates as we perfect your AI coach</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">First access before anyone else</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">Direct input on features and training methods</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-32">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300 font-medium">Now in development</span>
            </div>

            <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Unlock Your<br />Unlimited Potential
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
              The first A.I. Mental Performance Coach designed specifically for basketball players.
              Master your mental game and perform when it matters most.
            </p>

            {/* Hero CTA */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!formData.email || isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 whitespace-nowrap"
                >
                  Get Access
                </button>
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
              <p className="text-gray-400 text-sm mt-3">Join 2,847+ players on the waitlist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-400 mb-8">Trusted by players at every level</p>
          <div className="flex justify-center items-center gap-8 opacity-50">
            <div className="text-gray-400 font-semibold">High School</div>
            <div className="text-gray-400 font-semibold">College</div>
            <div className="text-gray-400 font-semibold">Semi-Pro</div>
            <div className="text-gray-400 font-semibold">Professional</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Mental Cheat Codes for Every Situation
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our AI analyzes your specific challenges and creates personalized mental strategies that give you an instant edge when you need it most.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="group">
              <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 p-1 rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                <div className="bg-black rounded-2xl p-8 h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Pressure Moments</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Clutch free throws, game-winning shots, big games. Get personalized techniques to stay calm and execute when it matters most.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-1 rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                <div className="bg-black rounded-2xl p-8 h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Confidence Building</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Overcome self-doubt and overthinking. Build unshakeable confidence that shows up consistently in your performance.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-1 rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                <div className="bg-black rounded-2xl p-8 h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Mental Recovery</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Bounce back from missed shots, bad calls, and tough losses. Learn to reset your mindset instantly and stay in the game.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Why Top Players Choose MyCheatCode
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-semibold text-white mb-2">Instant Results</h4>
              <p className="text-gray-400 text-sm">See improvement in your next game</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
              <div className="text-3xl mb-4">🎯</div>
              <h4 className="font-semibold text-white mb-2">Personalized</h4>
              <p className="text-gray-400 text-sm">Tailored to your position and level</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
              <div className="text-3xl mb-4">🧠</div>
              <h4 className="font-semibold text-white mb-2">Science-Based</h4>
              <p className="text-gray-400 text-sm">Proven sports psychology methods</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
              <div className="text-3xl mb-4">📱</div>
              <h4 className="font-semibold text-white mb-2">Always Available</h4>
              <p className="text-gray-400 text-sm">24/7 mental coaching on demand</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Signup Form */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Get Early Access
              </h2>
              <p className="text-xl text-gray-400">
                Be among the first to unlock your unlimited potential
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-300 text-center">{errors.general}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Primary Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    required
                  >
                    <option value="" className="bg-gray-900">Select your position</option>
                    {positionOptions.map(position => (
                      <option key={position} value={position} className="bg-gray-900">{position}</option>
                    ))}
                  </select>
                  {errors.position && <p className="text-red-400 text-sm mt-1">{errors.position}</p>}
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Level of Play</label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  required
                >
                  <option value="" className="bg-gray-900">Select your level of play</option>
                  {levelOptions.map(level => (
                    <option key={level} value={level} className="bg-gray-900">{level}</option>
                  ))}
                </select>
                {errors.level && <p className="text-red-400 text-sm mt-1">{errors.level}</p>}
              </div>

              <div>
                <label className="block text-white font-medium mb-3">What do you want to improve? (Select all that apply)</label>
                <div className="grid md:grid-cols-2 gap-3">
                  {goalOptions.map(goal => (
                    <label key={goal} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.goals.includes(goal)}
                        onChange={(e) => handleGoalChange(goal, e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500/50"
                      />
                      <span className="text-white text-sm leading-relaxed">{goal}</span>
                    </label>
                  ))}
                </div>
                {errors.goals && <p className="text-red-400 text-sm mt-1">{errors.goals}</p>}
              </div>

              {formData.goals.includes('Other') && (
                <div>
                  <input
                    type="text"
                    placeholder="Please specify..."
                    value={formData.customGoal || ''}
                    onChange={(e) => handleInputChange('customGoal', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => handleInputChange('consent', e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500/50"
                    required
                  />
                  <span className="text-white leading-relaxed">
                    Yes, send me early access updates and launch notifications
                  </span>
                </label>
                {errors.consent && <p className="text-red-400 text-sm mt-1">{errors.consent}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || submitCooldown > 0}
                className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-2xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Securing Your Spot...
                  </div>
                ) : submitCooldown > 0 ? (
                  `Please wait ${submitCooldown}s`
                ) : (
                  'Claim Your Early Access'
                )}
              </button>

              <p className="text-center text-gray-400 text-sm">
                Free to join • No spam, ever • Unsubscribe anytime
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              MyCheatCode
            </h3>
          </div>
          <p className="text-gray-400 mb-4">
            Questions? Email us at{' '}
            <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300 transition-colors">
              team@mycheatcode.ai
            </a>
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 MyCheatCode. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <WaitlistContent />
    </Suspense>
  );
}