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
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background - Like MyFitnessPal */}
      <div style={{ background: 'linear-gradient(180deg, #00e676 0%, #00c853 50%, #00b248 100%)' }}>
        {/* Header Navigation */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-center gap-3 flex-wrap">
            <button className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all" style={{ backgroundColor: '#FFFFFF', color: '#00b248' }}>
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

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-8 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Headline */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 text-white">
                Mental coaching.<br />
                <span className="text-white/80">Powered by AI.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
                Build confidence and master the mental side of basketball.
              </p>

              {/* CTA Button */}
              <button
                onClick={() => {
                  const form = document.getElementById('waitlist-form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-12 py-4 rounded-full text-xl font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto shadow-xl"
                style={{ backgroundColor: '#FFFFFF', color: '#00b248' }}
              >
                START TODAY
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </button>
            </div>

            {/* iPhone Mockup - No container background */}
            <div className="flex justify-center items-center mb-16">
              {/* iPhone Frame */}
              <div className="relative" style={{ width: '280px', height: '560px' }}>
                <div className="absolute inset-0 rounded-[42px] border-[10px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                  {/* Screen Content Area - Home Page Screenshot */}
                  <div className="absolute inset-[2px] rounded-[34px] overflow-hidden" style={{ backgroundColor: '#000000' }}>
                    <img
                      src="/waitlist-media/home-page.png"
                      alt="MyCheatCode Home Page"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center 8%' }}
                    />
                  </div>

                  {/* Home Indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>

          {/* Star Rating & Testimonials Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6" fill="#FFD700" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <p className="text-white/80 text-lg font-semibold mb-6">Join thousands of players building mental strength</p>
          </div>

          {/* Waitlist Form */}
          <div id="waitlist-form" className="max-w-md mx-auto mb-24">
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
                  backgroundColor: '#00ff41',
                  color: '#000000',
                  boxShadow: '0 4px 20px rgba(0, 255, 65, 0.3)'
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
      </div>

      {/* Feature Videos Section - White background like MyFitnessPal */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto space-y-20">

          {/* Feature 1: Overcome Mental Barriers */}
          <div className="space-y-6">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-black">
                Overcome any mental barrier on the court
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-gray-600">
                Talk with your AI coach to build confidence, master pressure moments, and elevate your mental game.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl p-8 flex items-start justify-center" style={{
                width: '400px',
                height: '400px',
                background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px', marginTop: '-20px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                    <div className="absolute inset-[2px] rounded-[34px] overflow-hidden" style={{ backgroundColor: '#000000' }}>
                      <img
                        src="/waitlist-media/chat-with-coach.png"
                        alt="Chat with AI Coach"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 8%' }}
                      />
                    </div>
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Personalized Cheat Codes */}
          <div className="space-y-6">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-black">
                Get personalized cheat codes for any moment
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-gray-600">
                Your AI coach creates custom step-by-step strategies you can rely on.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative rounded-[40px] overflow-visible shadow-2xl p-8 flex items-center justify-center" style={{
                width: '400px',
                height: '600px',
                background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                    <div className="absolute inset-[2px] rounded-[34px] overflow-hidden" style={{ backgroundColor: '#000000' }}>
                      <video
                        src="/waitlist-media/cheat-code-cue-cards.mov"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 8%' }}
                      />
                    </div>
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Collect Codes */}
          <div className="space-y-6">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-black">
                Collect codes for each part of your game
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-gray-600">
                Add and use strategies all season long. Accessible anytime, anywhere.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl p-8 flex items-start justify-center" style={{
                width: '400px',
                height: '400px',
                background: 'linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px', marginTop: '-20px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                    <div className="absolute inset-[2px] rounded-[34px] overflow-hidden" style={{ backgroundColor: '#000000' }}>
                      <img
                        src="/waitlist-media/my-codes-library.png"
                        alt="My Codes Library"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 8%' }}
                      />
                    </div>
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Community Topics */}
          <div className="space-y-6">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-black">
                Browse community topics for a quick start
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-gray-600">
                Real topics from real players. Find what speaks to you and level up your mental game.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl p-8 flex items-start justify-center" style={{
                width: '400px',
                height: '400px',
                background: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px', marginTop: '-20px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black shadow-2xl overflow-hidden" style={{ backgroundColor: '#000000' }}>
                    <div className="absolute inset-[2px] rounded-[34px] overflow-hidden" style={{ backgroundColor: '#000000' }}>
                      <img
                        src="/waitlist-media/community-topics.png"
                        alt="Community Topics"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 8%' }}
                      />
                    </div>
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* The System - White background like MyFitnessPal */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border-2 rounded-3xl p-8 shadow-xl bg-white" style={{ borderColor: '#00ff41' }}>
              <div className="space-y-4">
                <div className="text-3xl font-bold" style={{ color: '#00ff41' }}>
                  Chat = Growth
                </div>
                <div className="h-px w-16" style={{ backgroundColor: '#00ff41' }}></div>
                <p className="text-lg leading-relaxed text-gray-700">
                  Each conversation develops your mental game
                </p>
              </div>
            </div>
            <div className="border-2 rounded-3xl p-8 shadow-xl bg-white" style={{ borderColor: '#00ff41' }}>
              <div className="space-y-4">
                <div className="text-3xl font-bold" style={{ color: '#00ff41' }}>
                  Consistency = Strength
                </div>
                <div className="h-px w-16" style={{ backgroundColor: '#00ff41' }}></div>
                <p className="text-lg leading-relaxed text-gray-700">
                  Progress fades if you're inactive. Keep chatting in all areas to stay sharp
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Success Stories / Testimonials - Dark navy like MyFitnessPal */}
      <section className="py-20 px-4" style={{ backgroundColor: '#151824' }}>
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-3xl md:text-5xl font-bold" style={{ color: '#FFFFFF' }}>
            Real players. Real results.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex gap-1 justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="#FFD700" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="italic mb-4" style={{ color: '#FFFFFF' }}>"This app helped me overcome my fear of taking the last shot. Game changer."</p>
              <p className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>- Sarah M.</p>
            </div>
            <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex gap-1 justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="#00ff41" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="italic mb-4" style={{ color: '#FFFFFF' }}>"I used to get so nervous before games. Now I have strategies that actually work."</p>
              <p className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>- Marcus J.</p>
            </div>
            <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex gap-1 justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="#FFD700" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="italic mb-4" style={{ color: '#FFFFFF' }}>"Finally, someone who gets the mental side of basketball. This is the edge I needed."</p>
              <p className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>- Tyler K.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy - White background */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-black">
            Knowledge is power
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-gray-600">
            The mental game separates good players from great ones. We give you the tools to master yours—one conversation at a time.
          </p>
        </div>
      </section>

      {/* Social Proof - Built for players at */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-sm uppercase tracking-wider font-semibold text-gray-500">Built for players at</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <span className="font-bold text-lg" style={{ color: '#00ff41' }}>Junior High</span>
            <span className="font-bold text-lg text-black">High School</span>
            <span className="font-bold text-lg" style={{ color: '#00ff41' }}>College</span>
            <span className="font-bold text-lg text-black">AAU</span>
            <span className="font-bold text-lg" style={{ color: '#00ff41' }}>Semi-Pro</span>
          </div>
        </div>
      </section>

      {/* Final CTA Section - White background */}
      <section className="py-32 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold text-black leading-tight">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600">
            Sign up now and get notified at launch
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setError('');
                }}
                placeholder="First name (optional)"
                className="flex-1 px-5 py-3.5 rounded-full text-sm focus:outline-none transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e5e5'
                }}
              />
              <select
                value={ageBracket}
                onChange={(e) => {
                  setAgeBracket(e.target.value);
                  setError('');
                }}
                className="flex-1 px-5 py-3.5 rounded-full text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                required
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e5e5',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300ff41'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
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
              className="w-full px-5 py-3.5 rounded-full text-sm focus:outline-none transition-all"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e5e5'
              }}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !email || !ageBracket}
              className="w-full px-6 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                boxShadow: '0 4px 20px rgba(0, 255, 65, 0.3)'
              }}
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
            {error && (
              <p className="text-sm text-center text-red-600">{error}</p>
            )}
          </form>
        </div>
      </section>

      {/* Footer - Dark navy like MyFitnessPal */}
      <footer className="py-12 px-4" style={{ backgroundColor: '#151824' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              © 2025 MyCheatCode. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm transition-colors" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Privacy</Link>
              <Link href="#" className="text-sm transition-colors" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Terms</Link>
              <a
                href="mailto:team@mycheatcode.ai"
                className="text-sm transition-colors"
                style={{ color: '#00ff41' }}
              >
                team@mycheatcode.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
