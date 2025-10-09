'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

  // Star visualization effect
  useEffect(() => {
    const container = document.getElementById('heroVisualContainer');
    const svg = document.getElementById('starSvg');

    if (!container || !svg) return;

    // Add twinkling stars style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .star-twinkle {
        animation: twinkle var(--duration) ease-in-out infinite;
        animation-delay: var(--delay);
      }
    `;
    document.head.appendChild(style);

    // Create background stars
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star-twinkle';
      star.style.cssText = `
        position: absolute;
        width: ${Math.random() * 2 + 1}px;
        height: ${Math.random() * 2 + 1}px;
        background: white;
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --duration: ${Math.random() * 3 + 2}s;
        --delay: ${Math.random() * 2}s;
        z-index: 1;
      `;
      container.appendChild(star);
    }

    // Color gradient function
    const getColorForProgress = (progress: number) => {
      if (progress < 0.25) {
        const t = progress / 0.25;
        return `rgb(${Math.round(220 + 35 * t)}, ${Math.round(38 + 127 * t)}, ${Math.round(38 - 38 * t)})`;
      } else if (progress < 0.5) {
        const t = (progress - 0.25) / 0.25;
        return `rgb(255, ${Math.round(165 + 90 * t)}, 0)`;
      } else if (progress < 0.75) {
        const t = (progress - 0.5) / 0.25;
        return `rgb(${Math.round(255 - 101 * t)}, 255, ${Math.round(71 * t)})`;
      } else {
        const t = (progress - 0.75) / 0.25;
        return `rgb(${Math.round(154 - 70 * t)}, ${Math.round(255 - 51 * t)}, ${Math.round(71 + 1 * t)})`;
      }
    };

    // Star points calculation
    const calculateStarPoints = (cx: number, cy: number, outerRadius: number, innerRadius: number) => {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        points.push([
          cx + radius * Math.cos(angle),
          cy + radius * Math.sin(angle)
        ]);
      }
      return points;
    };

    // Render the star
    const cx = 400;
    const cy = 400;
    const outerRadius = 250;
    const innerRadius = 100;
    const progress = 1.0; // 100% Hall of Fame

    const points = calculateStarPoints(cx, cy, outerRadius, innerRadius);
    const pointsStr = points.map(p => p.join(',')).join(' ');

    // Create star polygon
    const starPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    starPath.setAttribute('points', pointsStr);
    starPath.setAttribute('fill', getColorForProgress(progress));
    starPath.setAttribute('stroke', '#ffffff');
    starPath.setAttribute('stroke-width', '3');
    svg.appendChild(starPath);

    // Add diamonds at star tips
    points.forEach((point, i) => {
      if (i % 2 === 0) {
        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const size = 12;
        const diamondPoints = [
          [point[0], point[1] - size],
          [point[0] + size, point[1]],
          [point[0], point[1] + size],
          [point[0] - size, point[1]]
        ];
        diamond.setAttribute('points', diamondPoints.map(p => p.join(',')).join(' '));
        diamond.setAttribute('fill', '#ffffff');
        svg.appendChild(diamond);
      }
    });

    // Add notches (floating markers)
    const numNotches = 20;
    const notchRadius = outerRadius + 60;

    for (let i = 0; i < numNotches; i++) {
      const angle = (2 * Math.PI / numNotches) * i;
      const x = cx + notchRadius * Math.cos(angle);
      const y = cy + notchRadius * Math.sin(angle);

      const notch = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      notch.setAttribute('x1', String(x - 10 * Math.cos(angle)));
      notch.setAttribute('y1', String(y - 10 * Math.sin(angle)));
      notch.setAttribute('x2', String(x + 10 * Math.cos(angle)));
      notch.setAttribute('y2', String(y + 10 * Math.sin(angle)));
      notch.setAttribute('stroke', '#ffffff');
      notch.setAttribute('stroke-width', '2');
      svg.appendChild(notch);
    }

    // Add labels
    const labels = [
      { text: 'PRE-GAME', angle: -Math.PI / 2, radius: notchRadius + 40 },
      { text: 'LOCKER ROOM', angle: -Math.PI / 2 - (2 * Math.PI / 5), radius: notchRadius + 40 },
      { text: 'IN-GAME', angle: -Math.PI / 2 + (2 * Math.PI / 5), radius: notchRadius + 40 },
      { text: 'OFF COURT', angle: -Math.PI / 2 - (4 * Math.PI / 5), radius: notchRadius + 40 },
      { text: 'POST-GAME', angle: -Math.PI / 2 + (4 * Math.PI / 5), radius: notchRadius + 40 }
    ];

    labels.forEach(({ text, angle, radius }) => {
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(y));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('fill', '#ffffff');
      label.setAttribute('font-size', '14');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      label.textContent = text;
      svg.appendChild(label);
    });

    return () => {
      // Cleanup
      style.remove();
    };
  }, []);

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

      {/* Hero Section with Screenshot */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 mb-12">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Now in Beta</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Master your mental game.
              <br />
              <span className="bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                Perform under pressure.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              The AI mental performance coach built for basketball players.
              <br />
              Get personalized <span className="text-white font-semibold">cheat codes</span> for every moment on and off the court.
            </p>

            {/* Email Signup */}
            <form id="join" onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 pt-4">
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
              <p className="text-sm text-zinc-500">
                Join <span className="text-white font-semibold">2,847+</span> players • Free forever
              </p>
            </form>
          </div>

          {/* Interactive Star Visualization */}
          <div className="relative w-full max-w-[800px] mx-auto aspect-square">
            <div
              id="heroVisualContainer"
              className="relative w-full h-full overflow-hidden rounded-2xl"
              style={{
                background: 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)'
              }}
            >
              {/* Background stars will be added via useEffect */}
              <svg
                id="starSvg"
                viewBox="0 0 800 800"
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 2 }}
              >
                {/* Star will be rendered via useEffect */}
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Videos Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-6xl mx-auto space-y-24">

          {/* Feature 1: Create Cheat Codes */}
          <div className="space-y-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Create cheat codes for any situation
              </h2>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Talk with your AI coach and build mental strategies for pressure moments, confidence issues, or recovery from mistakes.
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
      <section className="py-20 px-6 border-y border-zinc-800">
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
