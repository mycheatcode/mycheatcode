'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaitlistV2Page() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [ageBracket, setAgeBracket] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email || !ageBracket) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          ageBracket,
          referralCode: '',
          consent: true,
          nickname: ''
        }),
      });

      const data = await response.json();

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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #8BA5D5 0%, #5B7EC8 50%, #4169E1 100%)' }}>
        <div className="max-w-md w-full text-center space-y-6 bg-white/10 backdrop-blur-md rounded-3xl p-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">
              Check your email
            </h1>
            <p className="text-lg text-white/90">
              We sent you a confirmation link. Click it to secure your spot.
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-white/80 hover:text-white underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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

          {/* iPhone Mockup Container - Smaller like MyFitnessPal */}
          <div className="flex justify-center items-center mb-12">
            <div className="relative" style={{ width: '280px', height: '605px' }}>
              {/* iPhone Frame */}
              <div className="absolute inset-0 rounded-[42px] border-[10px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[105px] h-[22px] bg-black rounded-b-3xl z-20"></div>

                {/* Screen Content Area - Placeholder for screenshot */}
                <div className="absolute inset-[2px] rounded-[34px] overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="text-center px-6">
                      <div className="text-5xl mb-3">📱</div>
                      <p className="text-gray-500 text-xs font-medium">App Screenshot</p>
                      <p className="text-gray-400 text-[10px] mt-1">Place screenshot here</p>
                      <p className="text-gray-300 text-[10px] mt-0.5">1170 x 2532 px</p>
                    </div>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-300 rounded-full"></div>
              </div>

              {/* Phone Shadow */}
              <div className="absolute inset-0 rounded-[42px]" style={{
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 12px 24px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'none'
              }}></div>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 text-white">
              Mental coaching.<br />
              <span className="text-white/60">Powered by AI.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Build confidence and master the mental side of basketball.
            </p>
          </div>

          {/* Waitlist Form */}
          <div id="waitlist-form" className="mt-12 max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError('');
                  }}
                  placeholder="First name (optional)"
                  className="flex-1 px-5 py-3.5 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#333333',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: 'none'
                  }}
                />
                <select
                  value={ageBracket}
                  onChange={(e) => {
                    setAgeBracket(e.target.value);
                    setError('');
                  }}
                  className="flex-1 px-5 py-3.5 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-white/30 transition-all appearance-none cursor-pointer"
                  required
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#333333',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="" disabled>Age *</option>
                  <option value="13-15">13-15</option>
                  <option value="16-18">16-18</option>
                  <option value="19-24">19-24</option>
                  <option value="25+">25+</option>
                </select>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Email address *"
                className="w-full px-5 py-3.5 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#333333',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  border: 'none'
                }}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !email || !ageBracket}
                className="w-full px-6 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#4169E1',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
              {error && (
                <p className="text-sm text-white/90 text-center">{error}</p>
              )}
              <p className="text-center text-white/80 text-sm">
                Get ahead of the game
              </p>
            </form>
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
