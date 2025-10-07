'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  waitlistSignupSchema,
  type WaitlistSignupData,
  type WaitlistApiResponse
} from '@/lib/waitlist-types';

function WaitlistContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const referralCode = searchParams?.get('r');
    const errorParam = searchParams?.get('error');

    if (errorParam) {
      let errorMessage = 'An error occurred. Please try again.';
      switch (errorParam) {
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
      setError(errorMessage);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email) return;

    const formData: WaitlistSignupData = {
      email,
      position: 'Guard',
      level: 'High School',
      goals: ['Mental toughness in pressure situations'],
      customGoal: '',
      urgency: undefined,
      referralCode: searchParams?.get('r') || '',
      consent: true,
      nickname: ''
    };

    const result = waitlistSignupSchema.safeParse(formData);
    if (!result.success) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: WaitlistApiResponse = await response.json();

      if (data.ok) {
        setShowSuccess(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white">
              Check your email
            </h1>
            <p className="text-xl text-zinc-400">
              We sent you a confirmation link. Click it to secure your spot.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-sm text-zinc-400">
              Don't see it? Check your spam folder or{' '}
              <button
                onClick={() => setShowSuccess(false)}
                className="text-white hover:text-zinc-300 underline"
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white text-xl font-bold app-label">
            MYCHEATCODE.AI
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-zinc-400">Now in Beta</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Master your mental game.
            <br />
            <span className="text-zinc-500">Perform under pressure.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The AI mental performance coach built for basketball players.
            Get personalized cheat codes for every moment on the court.
          </p>

          {/* Email Signup */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <p className="text-sm text-zinc-500">
              Join 2,847+ players • Free forever
            </p>
          </form>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 md:p-12">
            <div className="space-y-12">
              {/* Feature 1 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Create cheat codes for any situation</h3>
                  <p className="text-lg text-zinc-400">
                    Talk with your AI coach and build mental strategies for pressure moments, confidence issues, or recovery from mistakes.
                  </p>
                </div>
                <div className="bg-black border border-zinc-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🧠</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-zinc-400">Coach</p>
                      <p className="text-white">What's on your mind? I'll help you build a cheat code for it.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">👤</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-zinc-400">You</p>
                      <p className="text-white">I get nervous at the free throw line when everyone's watching...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Track your mental strength across all areas</h3>
                  <p className="text-lg text-zinc-400">
                    See your progress in 5 key areas: Pre-Game, In-Game, Post-Game, Off Court, and Locker Room.
                  </p>
                </div>
                <div className="bg-black border border-zinc-800 rounded-xl p-8">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['Pre-Game', 'In-Game', 'Post-Game', 'Off Court', 'Locker Room'].map((area) => (
                      <div key={area} className="text-center space-y-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full mx-auto"></div>
                        <p className="text-xs text-zinc-400">{area}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Browse community topics or start your own</h3>
                  <p className="text-lg text-zinc-400">
                    Get inspired by what other players are working through, or create a completely custom cheat code.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-black border border-zinc-800 rounded-xl p-6 space-y-3 hover:border-zinc-700 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-white">"I lose confidence after I miss my first few shots"</h4>
                    <p className="text-sm text-zinc-500">When early misses spiral into a rough shooting night</p>
                    <p className="text-xs text-zinc-600">156 players found their rhythm</p>
                  </div>
                  <div className="bg-black border border-zinc-800 rounded-xl p-6 space-y-3 hover:border-zinc-700 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-white">"I replay every mistake I made after games"</h4>
                    <p className="text-sm text-zinc-500">When your mind won't stop showing you the lowlights</p>
                    <p className="text-xs text-zinc-600">134 players moved forward</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-sm text-zinc-500 uppercase tracking-wider">Trusted by players at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <span className="text-zinc-600 font-semibold">High School</span>
            <span className="text-zinc-600 font-semibold">AAU</span>
            <span className="text-zinc-600 font-semibold">College</span>
            <span className="text-zinc-600 font-semibold">Semi-Pro</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to level up your mental game?
          </h2>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              © 2025 MyCheatCode. All rights reserved.
            </p>
            <a
              href="mailto:team@mycheatcode.ai"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              team@mycheatcode.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <WaitlistContent />
    </Suspense>
  );
}
