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

  // Auto-fill referral code from URL
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

  // Cooldown timer
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
      setSubmitCooldown(5);
    }
  };

  // Simplified signup form component for reuse
  const SignupForm = ({ className = "", showAllFields = true }) => (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {errors.general && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
          <p className="text-red-300 text-sm text-center">{errors.general}</p>
        </div>
      )}

      <div>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 text-white placeholder-white/60 transition-all duration-200"
          placeholder="Your email address"
          required
        />
        {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
      </div>

      {showAllFields && (
        <>
          <div>
            <select
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 text-white transition-all duration-200"
              required
            >
              <option value="">Select your primary position</option>
              {positionOptions.map(position => (
                <option key={position} value={position} className="bg-zinc-900 text-white">{position}</option>
              ))}
            </select>
            {errors.position && <p className="mt-2 text-sm text-red-400">{errors.position}</p>}
          </div>

          <div>
            <select
              value={formData.level}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 text-white transition-all duration-200"
              required
            >
              <option value="">Select your level of play</option>
              {levelOptions.map(level => (
                <option key={level} value={level} className="bg-zinc-900 text-white">{level}</option>
              ))}
            </select>
            {errors.level && <p className="mt-2 text-sm text-red-400">{errors.level}</p>}
          </div>
        </>
      )}

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => handleInputChange('consent', e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-500 bg-white/5 border-2 border-white/20 rounded-md focus:ring-blue-500/50 focus:ring-2 accent-blue-500"
            required
          />
          <span className="text-sm text-white/80 leading-relaxed">
            Yes, send me early access and launch updates
          </span>
        </label>
        {errors.consent && <p className="mt-2 text-sm text-red-400">{errors.consent}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || submitCooldown > 0}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Joining...
          </>
        ) : submitCooldown > 0 ? (
          `Wait ${submitCooldown}s`
        ) : (
          'Get Early Access'
        )}
      </button>
    </form>
  );

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              MyCheatCode
            </h1>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

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

            <div className="text-sm text-zinc-400">
              <p>Questions? Email us at <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">team@mycheatcode.ai</a></p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,70,255,0.1),transparent)] "></div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              MyCheatCode
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
                  Unlock Your<br />Unlimited Potential
                </h2>
                <p className="text-xl text-zinc-300 leading-relaxed mb-8">
                  The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court.
                </p>
              </div>

              {/* Quick signup form */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Get Early Access</h3>
                <SignupForm showAllFields={false} />
                <p className="text-center text-sm text-zinc-500 mt-4">
                  Free to join. No spam, ever.
                </p>
              </div>
            </div>

            {/* Right Content - App Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="bg-black rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>

                  {/* Mockup of your app interface */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white mb-2">Your Analysis</h4>
                      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">45%</span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-2">Mental Performance Score</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 text-center">
                        <div className="text-xs text-red-300">Pre-Game</div>
                        <div className="text-lg font-bold text-white">25%</div>
                      </div>
                      <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 text-center">
                        <div className="text-xs text-orange-300">In-Game</div>
                        <div className="text-lg font-bold text-white">40%</div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                        <div className="text-xs text-yellow-300">Post-Game</div>
                        <div className="text-lg font-bold text-white">60%</div>
                      </div>
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2 text-center">
                        <div className="text-xs text-green-300">Off Court</div>
                        <div className="text-lg font-bold text-white">75%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl">
                    Create Cheat Code
                  </button>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                AI Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                24/7 Coach
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              How It Works
            </h3>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Personalized mental strategies that help you break through mental barriers and give you an instant edge in clutch moments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Mental Cheat Codes</h4>
              <p className="text-zinc-400 leading-relaxed">Personalized mental strategies that help you break through mental barriers and unlock your game.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-4">AI-Powered Coaching</h4>
              <p className="text-zinc-400 leading-relaxed">Advanced AI trained on proven sports psychology methods, delivering expert-level coaching insights instantly.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Performance Analytics</h4>
              <p className="text-zinc-400 leading-relaxed">Track your mental game improvements with data-driven insights that show real progress over time.</p>
            </div>
          </div>

          {/* Second CTA */}
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-8 lg:p-12 text-center">
            <h3 className="text-2xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Ready to Unlock Your Potential?
            </h3>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join thousands of players who are already transforming their mental game with AI-powered coaching.
            </p>

            <div className="max-w-md mx-auto">
              <SignupForm />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-t from-black via-zinc-900 to-zinc-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Coming Soon
          </h3>
          <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
            The future of mental performance is almost here. Be the first to get the advantage.
          </p>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-12">
            <div className="max-w-lg mx-auto">
              <h4 className="text-xl font-semibold mb-6">Join The Waitlist</h4>
              <SignupForm />
              <p className="text-sm text-zinc-500 mt-6">
                Free to join. No spam, ever.
              </p>
            </div>
          </div>

          <div className="mt-12 text-sm text-zinc-500">
            <p>Questions? Email us at <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">team@mycheatcode.ai</a></p>
          </div>
        </div>
      </section>
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