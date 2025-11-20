'use client';

import { useState } from 'react';
import Link from 'next/link';
import FeedbackModal from '@/components/FeedbackModal';

export default function WelcomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const handleSignupClick = () => {
    // Store where the user came from for proper back navigation
    localStorage.setItem('signupReferrer', '/welcome');
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Mobile Design */}
      <div className="lg:hidden bg-black min-h-screen relative flex flex-col">
        {/* Header */}
        <div className="p-4 text-center border-b border-zinc-800 flex-shrink-0">
          <div className="text-white text-lg font-semibold">mycheatcode</div>
        </div>

        {/* Welcome Content */}
        <div className="flex-1 flex flex-col justify-center p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Your AI Mental Performance
              <br />
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Coach
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Gain an unfair advantage and unlock your full potential on the court.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Pre-Game Prep</h3>
                <p className="text-zinc-400 text-sm">Transform nervous energy into locked-in confidence before tip-off</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">In-Game Performance</h3>
                <p className="text-zinc-400 text-sm">Stay composed when the game's on the line and all eyes are on you</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Post-Game Recovery</h3>
                <p className="text-zinc-400 text-sm">Turn tough losses into fuel and big wins into momentum</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Locker Room Dynamics</h3>
                <p className="text-zinc-400 text-sm">Navigate team pressure and earn respect from coaches and teammates</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Off-Court Training</h3>
                <p className="text-zinc-400 text-sm">Break through mental blocks that hold you back during practice</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Link href="/signup" onClick={handleSignupClick} className="w-full py-4 px-6 rounded-xl border-none text-lg font-bold cursor-pointer transition-all duration-200 bg-zinc-800 text-white hover:bg-zinc-700 active:scale-98 text-center block">
                Start 3-Day Trial
              </Link>
              <div className="text-center mt-2">
                <p className="text-zinc-400 text-sm">$8/month after trial or $79/year</p>
              </div>
            </div>
            <Link href="/login" className="w-full py-4 px-6 rounded-xl border border-zinc-700 text-lg font-semibold cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-800 hover:border-zinc-600 active:scale-98 text-center block">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Features */}
        <div className="w-1/2 bg-black flex flex-col justify-center p-12">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold text-white mb-6">
              Your AI Mental Performance
              <br />
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Coach
              </span>
            </h1>
            <p className="text-zinc-400 text-xl leading-relaxed mb-12">
              Gain an unfair advantage and unlock your full potential on the court.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-2">Pre-Game Prep</h3>
                  <p className="text-zinc-400 leading-relaxed">Transform nervous energy into locked-in confidence before tip-off</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-2">In-Game Performance</h3>
                  <p className="text-zinc-400 leading-relaxed">Stay composed when the game's on the line and all eyes are on you</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-2">Post-Game Recovery</h3>
                  <p className="text-zinc-400 leading-relaxed">Turn tough losses into fuel and big wins into momentum</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-2">Locker Room Dynamics</h3>
                  <p className="text-zinc-400 leading-relaxed">Navigate team pressure and earn respect from coaches and teammates</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl mb-2">Off-Court Training</h3>
                  <p className="text-zinc-400 leading-relaxed">Break through mental blocks that hold you back during practice</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up */}
        <div className="w-1/2 bg-black flex flex-col justify-center p-12">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="text-white text-2xl font-bold mb-2">mycheatcode</div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Level Up?</h2>
              <p className="text-zinc-400">Join thousands of players building their mental game</p>
            </div>

            <div className="space-y-6">
              <div>
                <Link href="/signup" onClick={handleSignupClick} className="w-full py-4 px-8 rounded-xl border-none text-xl font-bold cursor-pointer transition-all duration-200 bg-zinc-800 text-white hover:bg-zinc-700 active:scale-98 text-center block">
                  Start 3-Day Trial
                </Link>
                <div className="text-center mt-3">
                  <p className="text-zinc-400 text-lg">$8/month after trial or $79/year</p>
                </div>
              </div>
              <Link href="/login" className="w-full py-4 px-8 rounded-xl border border-zinc-700 text-xl font-semibold cursor-pointer transition-all duration-200 bg-transparent text-white hover:bg-zinc-800 hover:border-zinc-600 active:scale-98 text-center block">
                Sign In
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
              <div className="text-zinc-500 text-sm">
                ✓ 3-day free trial • ✓ Cancel anytime • ✓ No long-term commitment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}