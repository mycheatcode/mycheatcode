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
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [ageBracket, setAgeBracket] = useState('');
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
    if (isSubmitting || !email || !ageBracket) return;

    const formData: any = {
      email,
      firstName: firstName || undefined,
      ageBracket,
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
          <div className="text-white text-xl font-bold app-label">
            MYCHEATCODE.AI
          </div>
          <button
            onClick={() => {
              const joinSection = document.getElementById('join');
              joinSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all text-sm shadow-[0_4px_20px_rgb(255,255,255,0.3)] hover:shadow-[0_4px_30px_rgb(255,255,255,0.4)] active:scale-95"
          >
            Join Waitlist
          </button>
        </div>
      </header>

      {/* Hero Section with Star Visual */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-32 px-4 md:px-6 starfield-background overflow-hidden">
        {/* Starfield Background for Hero */}
        <div className="starfield-container-hero">
          <div className="stars stars-small"></div>
          <div className="stars stars-medium"></div>
          <div className="stars stars-large"></div>
          <div className="stars stars-twinkle"></div>
        </div>
        <div className="max-w-6xl mx-auto">
          <div id="join" className="text-center space-y-4 md:space-y-8 -mb-32 md:mb-12 relative z-20">
            {/* Main Headline */}
            <h1 className="text-4xl md:text-7xl font-bold leading-tight px-4">
              <span className="text-white">Mental coaching.</span>
              <br />
              <span className="text-zinc-500">Powered by AI.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4">
              Build confidence and master the mental side of basketball.
            </p>

            {/* Email Signup */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-2 md:pt-4 relative z-30">
              <div className="space-y-3">
                {/* First Name and Age - Side by Side */}
                <div className="flex gap-3">
                  {/* First Name (Optional) */}
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setError('');
                    }}
                    placeholder="First name (optional)"
                    className="flex-1 px-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl text-black placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 transition-all shadow-lg"
                  />

                  {/* Age Bracket (Required) */}
                  <select
                    value={ageBracket}
                    onChange={(e) => {
                      setAgeBracket(e.target.value);
                      setError('');
                    }}
                    className="flex-1 px-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl text-black focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 transition-all shadow-lg appearance-none cursor-pointer"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.5rem'
                    }}
                  >
                    <option value="" disabled>Age *</option>
                    <option value="13-15">13-15</option>
                    <option value="16-18">16-18</option>
                    <option value="19-24">19-24</option>
                    <option value="25+">25+</option>
                  </select>
                </div>

                {/* Email (Required) */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Email address *"
                  className="w-full px-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl text-black placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 transition-all shadow-lg"
                  required
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !ageBracket}
                  className="w-full px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_8px_30px_rgb(255,255,255,0.3)] hover:shadow-[0_8px_40px_rgb(255,255,255,0.4)] active:scale-95"
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <p className="text-sm text-zinc-500">
                Get ahead of the game
              </p>
            </form>
          </div>

          {/* Star Progress Visual with Desktop Status Levels */}
          <div className="flex items-center justify-center mt-0 -mb-16 md:my-6 w-full overflow-x-hidden">
            {/* Desktop Status Levels - Vertical Side Layout (Far Left) */}
            <div className="hidden md:flex flex-col gap-4 absolute left-8 lg:left-16 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 shadow-2xl">
              {/* Desktop Header */}
              <div className="mb-3">
                <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                  Watch Your Mental Game Rise
                </h3>
                <div className="h-px bg-gradient-to-r from-zinc-700 to-transparent mt-3"></div>
              </div>
              {[
                { name: 'Hall of Fame', range: '75-100%', color: '#32CD32', isActive: true },
                { name: 'All-Star', range: '50-74%', color: '#FFDC00', isActive: false },
                { name: 'Rookie', range: '25-49%', color: '#FF8C00', isActive: false },
                { name: 'Beginner', range: '0-24%', color: '#DC1414', isActive: false }
              ].map((level, index) => (
                <div key={level.name} className="relative">
                  {index < 3 && (
                    <div className="absolute left-2.5 top-7 w-px h-7 bg-gradient-to-b from-zinc-700 to-zinc-800"></div>
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 12 12">
                        <path
                          d="M6 1 L11 6 L6 11 L1 6 Z"
                          fill={level.color}
                          opacity={level.isActive ? "1" : "0.5"}
                          filter={level.isActive ? "url(#glow)" : ""}
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <div className={`text-sm font-semibold ${level.isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {level.name}
                      </div>
                      <div className="text-zinc-500 text-xs">
                        {level.range}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Star Visual - Centered */}
            <div className="w-full flex justify-center">
              <div className="scale-[0.55] sm:scale-[0.75] md:scale-90 origin-center">
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

          {/* Status Levels Display - Mobile Horizontal (Below Star) */}
          <div className="flex md:hidden justify-center mb-32 -mt-36">
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 shadow-2xl">
              {/* Mobile Header */}
              <div className="mb-3 text-center">
                <h3 className="text-xs text-zinc-400 font-semibold tracking-wide">
                  Watch Your Mental Game Rise
                </h3>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mt-2"></div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Beginner', range: '0-24%', color: '#DC1414', isActive: false },
                  { name: 'Rookie', range: '25-49%', color: '#FF8C00', isActive: false },
                  { name: 'All-Star', range: '50-74%', color: '#FFDC00', isActive: false },
                  { name: 'Hall of Fame', range: '75-100%', color: '#32CD32', isActive: true }
                ].map((level) => (
                  <div key={level.name} className="flex flex-col items-center text-center">
                    <svg width="18" height="18" viewBox="0 0 12 12" className="mb-1.5">
                      <path
                        d="M6 1 L11 6 L6 11 L1 6 Z"
                        fill={level.color}
                        opacity={level.isActive ? "1" : "0.5"}
                      />
                    </svg>
                    <div className={`text-[10px] font-semibold mb-0.5 ${level.isActive ? 'text-white' : 'text-zinc-400'}`}>
                      {level.name}
                    </div>
                    <div className="text-zinc-500 text-[9px]">
                      {level.range}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Gradient fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-zinc-950 pointer-events-none z-10"></div>
      </section>

      {/* Feature Videos Section */}
      <section className="relative pt-0 md:pt-4 pb-20 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto space-y-24">

          {/* Feature 1: Create Cheat Codes */}
          <div className="space-y-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Overcome any mental barrier on the court
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
                Get personalized cheat codes for any moment
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Your AI coach creates custom step-by-step strategies you can rely on.
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
                Collect codes for each part of your game
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Add and use strategies all season long. Accessible anytime, anywhere.
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
                Browse community topics for a quick start
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Real topics from real players. Find what speaks to you and level up your mental game.
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

      {/* The System */}
      <section className="py-20 px-6 border-y border-zinc-800 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-[2rem] p-8 shadow-xl">
              <div className="space-y-4">
                <div className="text-3xl font-bold text-white">
                  Chat = Growth
                </div>
                <div className="h-px w-16 bg-zinc-700"></div>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Each conversation develops your mental game
                </p>
              </div>
            </div>
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-[2rem] p-8 shadow-xl">
              <div className="space-y-4">
                <div className="text-3xl font-bold text-white">
                  Consistency = Strength
                </div>
                <div className="h-px w-16 bg-zinc-700"></div>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Progress fades if you're inactive. Keep chatting in all areas to stay sharp
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Built for players at</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <span className="text-zinc-400 font-bold text-lg">Junior High</span>
            <span className="text-zinc-400 font-bold text-lg">High School</span>
            <span className="text-zinc-400 font-bold text-lg">College</span>
            <span className="text-zinc-400 font-bold text-lg">AAU</span>
            <span className="text-zinc-400 font-bold text-lg">Semi-Pro</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-t from-zinc-950 to-black">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Ready to get started?
          </h2>
          <p className="text-xl text-zinc-400">
            Sign up now and get notified at launch
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-4">
            <div className="space-y-3">
              {/* First Name and Age - Side by Side */}
              <div className="flex gap-3">
                {/* First Name (Optional) */}
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError('');
                  }}
                  placeholder="First name (optional)"
                  className="flex-1 px-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl text-black placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 transition-all shadow-lg"
                />

                {/* Age Bracket (Required) */}
                <select
                  value={ageBracket}
                  onChange={(e) => {
                    setAgeBracket(e.target.value);
                    setError('');
                  }}
                  className="flex-1 px-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl text-black focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 transition-all shadow-lg appearance-none cursor-pointer"
                  required
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5rem'
                  }}
                >
                  <option value="" disabled>Age *</option>
                  <option value="13-15">13-15</option>
                  <option value="16-18">16-18</option>
                  <option value="19-24">19-24</option>
                  <option value="25+">25+</option>
                </select>
              </div>

              {/* Email (Required) */}
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Email address *"
                className="w-full px-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl text-black placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 transition-all shadow-lg"
                required
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !email || !ageBracket}
                className="w-full px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_8px_30px_rgb(255,255,255,0.3)] hover:shadow-[0_8px_40px_rgb(255,255,255,0.4)] active:scale-95"
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
