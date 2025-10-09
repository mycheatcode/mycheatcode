'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import StarProgressVisual from '@/components/StarProgressVisual';
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

    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: 'Waitlist',
        page_location: window.location.href,
        page_path: '/waitlist',
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email) return;

    const formData: WaitlistSignupData = {
      email,
      position: 'Point Guard',
      level: 'High School',
      goals: ['Handling Pressure Moments (free throws, clutch shots, big games)'],
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

    // Track conversion attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', {
        event_category: 'Waitlist',
        event_label: 'Email Submitted',
        value: email,
      });
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: WaitlistApiResponse = await response.json();

      if (data.ok) {
        setShowSuccess(true);
        // Track successful conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            event_category: 'Waitlist',
            event_label: 'Successfully Joined',
            send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with actual conversion ID
          });
        }
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white text-xl font-bold app-label">
            MYCHEATCODE.AI
          </Link>
          <a
            href="#join"
            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all text-sm"
          >
            Join Beta
          </a>
        </div>
      </header>

      {/* Hero Section with Star Visual */}
      <section className="relative pt-32 pb-12 md:pb-32 px-4 md:px-6 starfield-background overflow-hidden">
        {/* Starfield Background for Hero */}
        <div className="starfield-container-hero">
          <div className="stars stars-small"></div>
          <div className="stars stars-medium"></div>
          <div className="stars stars-large"></div>
          <div className="stars stars-twinkle"></div>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 md:space-y-8 mb-2 md:mb-12">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Beta Coming Soon</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-7xl font-bold text-white leading-tight px-4">
              Your AI Mental Coach
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4">
              The mental performance tool basketball players have been waiting for.
            </p>

            {/* Email Signup */}
            <form id="join" onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-2 md:pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20 transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-lg hover:shadow-xl active:scale-95"
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <p className="text-sm text-zinc-500">
                Be ahead of the game
              </p>
            </form>
          </div>

          {/* Star Progress Visual from Homepage - Mobile Optimized */}
          <div className="flex items-center justify-center -my-12 md:my-6 w-full overflow-x-hidden">
            <div className="w-full flex justify-center">
              <div className="scale-[0.65] sm:scale-[0.85] md:scale-100 origin-center">
                <StarProgressVisual
                  progressData={{
                    preGame: 100,
                    inGame: 100,
                    postGame: 100,
                    offCourt: 100,
                    lockerRoom: 100
                  }}
                  size={800}
                  className=""
                />
              </div>
            </div>
          </div>
        </div>
        {/* Gradient fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-zinc-950 pointer-events-none z-10"></div>
      </section>

      {/* Feature Videos Section */}
      <section className="relative py-20 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto space-y-24">

          {/* Feature 1: Create Cheat Codes */}
          <div className="space-y-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Overcome every mental barrier on the court
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Talk with your AI coach to build confidence, master pressure moments, and elevate your mental game.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
              <video
                src="/waitlist-media/demo-1-homepage.mov"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Feature 2: Cheat Code Creation in Chat */}
          <div className="space-y-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Get swipeable cheat code cue cards
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Your AI coach creates interactive cue cards with What, When, How, Why, and a memorable phrase to use in the moment.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
              <video
                src="/waitlist-media/demo-2-chat.mov"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Feature 3: My Codes & Progress Tracking */}
          <div className="space-y-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Track your codes and build your mental arsenal
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                All your cheat codes in one place. Use them regularly to build consistency and track your mental strength across 5 key areas.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
              <video
                src="/waitlist-media/demo-3-mycodes.mov"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Feature 4: Community Topics */}
          <div className="space-y-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Browse community topics or create custom codes
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Get inspired by what other players are working through, or start from scratch with your own unique mental challenge.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
              <video
                src="/waitlist-media/demo-4-community.mov"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-y border-zinc-800 bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-400">1</span>
              </div>
              <h3 className="text-xl font-bold text-white">Chat with your AI coach</h3>
              <p className="text-zinc-400 leading-relaxed">
                Describe what you're struggling with mentally. Your coach helps you break it down.
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="text-xl font-bold text-white">Get your cheat code</h3>
              <p className="text-zinc-400 leading-relaxed">
                Receive a personalized mental strategy with actionable steps and a memorable phrase.
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-xl font-bold text-white">Use it in the moment</h3>
              <p className="text-zinc-400 leading-relaxed">
                Pull up your code before games, at the free throw line, or whenever you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Trusted by players at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <span className="text-zinc-400 font-bold text-lg">High School</span>
            <span className="text-zinc-400 font-bold text-lg">AAU</span>
            <span className="text-zinc-400 font-bold text-lg">College</span>
            <span className="text-zinc-400 font-bold text-lg">Semi-Pro</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-t from-zinc-950 to-black">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Ready to level up your
            <br />
            mental game?
          </h2>
          <p className="text-xl text-zinc-400">
            Join thousands of players building mental strength.
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20 transition-all"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-lg hover:shadow-xl active:scale-95"
              >
                {isSubmitting ? 'Joining...' : 'Join Beta'}
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

      {/* Starfield CSS */}
      <style jsx global>{`
        /* Starfield Background */
        .starfield-background {
          position: relative;
          overflow: hidden;
        }

        .starfield-container-hero {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }

        .stars-small {
          background:
            radial-gradient(circle at 25% 75%, #ffffff 0.8px, transparent 0.8px),
            radial-gradient(circle at 75% 25%, #87ceeb 0.8px, transparent 0.8px),
            radial-gradient(circle at 15% 45%, #ffffff 0.8px, transparent 0.8px);
          background-size: 350px 350px, 400px 400px, 320px 320px;
          animation: gentle-twinkle 20s ease-in-out infinite alternate;
          opacity: 0.35;
        }

        .stars-medium {
          background:
            radial-gradient(circle at 40% 60%, #ffffff 1.2px, transparent 1.2px),
            radial-gradient(circle at 80% 30%, #ffd700 1.2px, transparent 1.2px);
          background-size: 500px 500px, 450px 450px;
          animation: gentle-twinkle 28s ease-in-out infinite alternate-reverse;
          opacity: 0.25;
        }

        .stars-large {
          background:
            radial-gradient(circle at 60% 20%, #ffffff 2px, transparent 2px),
            radial-gradient(circle at 20% 80%, #87ceeb 2px, transparent 2px),
            radial-gradient(circle at 85% 70%, #ffd700 2px, transparent 2px);
          background-size: 800px 800px, 750px 750px, 900px 900px;
          animation: bright-twinkle 35s ease-in-out infinite;
          opacity: 0.2;
        }

        .stars-twinkle {
          background-image:
            radial-gradient(circle at 30% 40%, rgba(255,255,255,0.6) 3px, transparent 3px),
            radial-gradient(circle at 70% 70%, rgba(135,206,235,0.6) 3px, transparent 3px),
            radial-gradient(circle at 15% 20%, rgba(255,215,0,0.7) 2.5px, transparent 2.5px);
          background-size: 800px 800px, 700px 700px, 900px 900px;
          animation: star-sparkle 25s ease-in-out infinite alternate;
          opacity: 0.35;
        }

        @keyframes gentle-twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 0.45; }
          100% { opacity: 0.35; }
        }

        @keyframes bright-twinkle {
          0% { opacity: 0.15; }
          25% { opacity: 0.25; }
          50% { opacity: 0.3; }
          75% { opacity: 0.2; }
          100% { opacity: 0.15; }
        }

        @keyframes star-sparkle {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
          100% {
            opacity: 0.35;
            transform: scale(1);
          }
        }
      `}</style>
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
