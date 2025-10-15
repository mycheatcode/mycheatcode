'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaitlistV2Page() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // TODO: Add email to waitlist
    console.log('Waitlist signup:', email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #8BA5D5 0%, #5B7EC8 50%, #4169E1 100%)' }}>
      {/* Header Navigation */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-center gap-3 flex-wrap">
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all" style={{ backgroundColor: '#FFFFFF', color: '#4169E1' }}>
            Reviews
          </button>
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all border-2 hover:bg-white/10" style={{ backgroundColor: 'transparent', borderColor: '#FFFFFF', color: '#FFFFFF' }}>
            How It Works
          </button>
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all border-2 hover:bg-white/10" style={{ backgroundColor: 'transparent', borderColor: '#FFFFFF', color: '#FFFFFF' }}>
            Apps
          </button>
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all border-2 hover:bg-white/10" style={{ backgroundColor: 'transparent', borderColor: '#FFFFFF', color: '#FFFFFF' }}>
            Our Philosophy
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* CTA Button */}
          <div className="text-center mb-12">
            <button
              onClick={() => {
                const form = document.getElementById('waitlist-form');
                form?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-12 py-4 rounded-full text-xl font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto shadow-xl"
              style={{ backgroundColor: '#FFFFFF', color: '#4169E1' }}
            >
              START TODAY
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </button>
          </div>

          {/* iPhone Mockup Container */}
          <div className="flex justify-center items-center mb-12">
            <div className="relative" style={{ width: '375px', height: '812px' }}>
              {/* iPhone Frame */}
              <div className="absolute inset-0 rounded-[55px] border-[12px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[28px] bg-black rounded-b-3xl z-20"></div>

                {/* Screen Content Area - Placeholder for screenshot */}
                <div className="absolute inset-[2px] rounded-[45px] overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="text-center px-8">
                      <div className="text-6xl mb-4">📱</div>
                      <p className="text-gray-500 text-sm font-medium">App Screenshot</p>
                      <p className="text-gray-400 text-xs mt-2">Place your iPhone screenshot here</p>
                      <p className="text-gray-300 text-xs mt-1">Recommended: 1170 x 2532 px</p>
                    </div>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-gray-300 rounded-full"></div>
              </div>

              {/* Phone Shadow */}
              <div className="absolute inset-0 rounded-[55px]" style={{
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.4), 0 15px 30px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'none'
              }}></div>
            </div>
          </div>

          {/* Waitlist Form */}
          <div id="waitlist-form" className="mt-16 max-w-md mx-auto">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-6 py-4 rounded-full text-base focus:outline-none focus:ring-4 transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#333333',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      border: 'none'
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#4169E1',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  Join Waitlist
                </button>
                <p className="text-center text-white text-sm opacity-90">
                  Be the first to get access when we launch
                </p>
              </form>
            ) : (
              <div className="text-center p-8 rounded-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(10px)' }}>
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                <p className="text-white text-opacity-90">We'll notify you when we launch.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16">
        <div className="flex items-center justify-center gap-4 text-white text-sm">
          <Link href="#" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link href="#" className="hover:underline">Terms</Link>
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="text-white text-sm hover:underline">
            ← Back to Main Site
          </Link>
        </div>
      </footer>
    </div>
  );
}
