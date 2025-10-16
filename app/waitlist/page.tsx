'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProgressCircles from '@/components/ProgressCircles';

export default function WaitlistV2Page() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [ageBracket, setAgeBracket] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHeaderButton, setShowHeaderButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const scrolled = window.scrollY;
        setShowHeaderButton(scrolled > heroHeight * 0.5);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#00b248' }}>MYCHEATCODE.AI</h2>
            <button
              onClick={() => {
                const form = document.getElementById('waitlist-form');
                if (form) {
                  const elementRect = form.getBoundingClientRect();
                  const absoluteElementTop = elementRect.top + window.pageYOffset;
                  const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
                  window.scrollTo({ top: middle, behavior: 'smooth' });
                }
              }}
              className={`px-6 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-base font-bold transition-all hover:scale-105 ${
                showHeaderButton ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
              }`}
              style={{ backgroundColor: '#00b248', color: '#FFFFFF', transition: 'opacity 0.3s, transform 0.3s' }}
            >
              JOIN WAITLIST
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient Background - Like MyFitnessPal */}
      <div id="hero-section" style={{ backgroundColor: '#FFFFFF' }}>

        {/* Hero Section */}
        <main className="container mx-auto px-4 pt-12 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Mobile: Centered stacked, Desktop: Side by side layout */}
            <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
              {/* Headline - Mobile centered, Desktop left-aligned */}
              <div className="text-center mb-8 md:text-left md:mb-0 md:order-1">
                <p className="text-base md:text-lg text-gray-600 mb-4">
                  The first AI basketball confidence coach
                </p>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 text-black">
                  Build On Court<br />
                  Confidence
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto md:mx-0 mb-8">
                  Master the mental game of basketball and unlock your full potential on the court.
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    const form = document.getElementById('waitlist-form');
                    if (form) {
                      const elementRect = form.getBoundingClientRect();
                      const absoluteElementTop = elementRect.top + window.pageYOffset;
                      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
                      window.scrollTo({ top: middle, behavior: 'smooth' });
                    }
                  }}
                  className="px-12 py-4 rounded-full text-xl font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto md:mx-0 shadow-xl"
                  style={{ backgroundColor: '#00b248', color: '#FFFFFF' }}
                >
                  JOIN WAITLIST
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </button>
              </div>

              {/* iPhone Mockup - Mobile centered, Desktop right side */}
              <div className="flex justify-center items-center mb-16 md:mb-0 md:justify-end md:order-2">
                {/* iPhone Frame */}
                <div className="relative" style={{ width: '280px', height: '560px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black overflow-hidden" style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}>
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
            </div>
          </div>
        </main>
      </div>

      {/* How It Works Section - Green background with decorative elements */}
      <section className="relative py-20 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, #00b248 0%, #009639 50%, #007a2e 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto space-y-20 relative z-10">

          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Build confidence<br />in 1-2-3
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Your AI coach helps you overcome mental barriers and perform at your best
            </p>
          </div>

          {/* Feature 1: Chat with your coach */}
          <div className="md:grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Text Content */}
            <div className="order-1 md:order-2 mb-12 md:mb-0">
              <div className="flex justify-center md:justify-start mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold" style={{ color: '#00b248' }}>1</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center md:text-left mb-6">
                Chat with your coach
              </h2>
              <p className="text-xl leading-relaxed text-white/90 text-center md:text-left max-w-xl mx-auto md:mx-0">
                Each conversation is geared towards confidence, and handling what the game throws at you
              </p>
            </div>
            {/* iPhone Image */}
            <div className="flex justify-center md:justify-end order-2 md:order-1">
              <div className="relative rounded-[40px] overflow-hidden p-8 flex items-start justify-center transition-transform hover:scale-105 duration-300" style={{
                width: '400px',
                height: '400px',
                background: '#FFFFFF',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px', marginTop: '-20px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black overflow-hidden" style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}>
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

          {/* Feature 2: Get personalized cheat codes */}
          <div className="md:grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mt-32">
            {/* Text Content - on left for desktop */}
            <div className="order-1 md:order-1 mb-12 md:mb-0">
              <div className="flex justify-center md:justify-start mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold" style={{ color: '#00b248' }}>2</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center md:text-left mb-6">
                Get personalized cheat codes
              </h2>
              <p className="text-xl leading-relaxed text-white/90 text-center md:text-left max-w-xl mx-auto md:mx-0">
                Your AI coach creates custom step-by-step strategies you can rely on.
              </p>
            </div>
            {/* iPhone Image - on right for desktop */}
            <div className="flex justify-center md:justify-start order-2 md:order-2">
              <div className="relative rounded-[40px] overflow-visible shadow-2xl p-8 flex items-center justify-center" style={{
                width: '400px',
                height: '600px',
                background: '#FFFFFF'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black overflow-hidden" style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}>
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

          {/* Feature 3: Collect your codes */}
          <div className="md:grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mt-32">
            {/* Text Content */}
            <div className="order-1 md:order-2 mb-12 md:mb-0">
              <div className="flex justify-center md:justify-start mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold" style={{ color: '#00b248' }}>3</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center md:text-left mb-6">
                Save & collect your codes
              </h2>
              <p className="text-xl leading-relaxed text-white/90 text-center md:text-left max-w-xl mx-auto md:mx-0">
                Add and use your strategies all season long. Accessible anytime, anywhere.
              </p>
            </div>
            {/* iPhone Image */}
            <div className="flex justify-center md:justify-end order-2 md:order-1">
              <div className="relative rounded-[40px] overflow-hidden p-8 flex items-start justify-center transition-transform hover:scale-105 duration-300" style={{
                width: '400px',
                height: '400px',
                background: '#FFFFFF',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px', marginTop: '-20px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black overflow-hidden" style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}>
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

          {/* Feature 4: Browse topics */}
          <div className="md:grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mt-32">
            {/* Text Content - on left for desktop */}
            <div className="order-1 md:order-1 mb-12 md:mb-0">
              <div className="flex justify-center md:justify-start mb-6">
                <div className="px-6 py-3 bg-white rounded-full shadow-lg">
                  <span className="text-base font-bold" style={{ color: '#00b248' }}>BONUS FEATURE</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center md:text-left mb-6">
                Community topics
              </h2>
              <p className="text-xl leading-relaxed text-white/90 text-center md:text-left max-w-xl mx-auto md:mx-0">
                Browse common topics among players for a quick start
              </p>
            </div>
            {/* iPhone Image - on right for desktop */}
            <div className="flex justify-center md:justify-start order-2 md:order-2">
              <div className="relative rounded-[40px] overflow-hidden p-8 flex items-start justify-center transition-transform hover:scale-105 duration-300" style={{
                width: '400px',
                height: '400px',
                background: '#FFFFFF',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="relative" style={{ width: '280px', height: '560px', marginTop: '-20px' }}>
                  <div className="absolute inset-0 rounded-[42px] border-[10px] border-black overflow-hidden" style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}>
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

      {/* Track Your Progress Section - White background with subtle pattern */}
      <section className="relative py-20 px-4 overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(#00b248 1px, transparent 1px), linear-gradient(90deg, #00b248 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Track Your Progress
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Watch your confidence grow with every conversation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Progress Visual */}
            <div className="flex justify-center">
              <div className="w-[min(400px,85vw)] aspect-square">
                <ProgressCircles
                  theme="light"
                  onProgressUpdate={() => {}}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-black">
                Your Momentum Visual
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                This dynamic visual represents your consistency and growth. The inner circle shows your current momentum, while the outer ring displays your goal threshold.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Stay consistent to keep your momentum strong. The more you engage with your AI coach, the brighter your progress shines.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff41' }}></div>
                  <span className="text-sm font-semibold text-gray-700">Elite players stay above 85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The System - White background like MyFitnessPal */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-3xl p-8 shadow-xl" style={{ background: 'linear-gradient(135deg, #00b248 0%, #009639 100%)' }}>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-white">
                  Chat = Growth
                </div>
                <div className="h-px w-16 bg-white/30"></div>
                <p className="text-lg leading-relaxed text-white/90">
                  Each conversation develops your mental game
                </p>
              </div>
            </div>
            <div className="rounded-3xl p-8 shadow-xl" style={{ background: 'linear-gradient(135deg, #00b248 0%, #009639 100%)' }}>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-white">
                  Consistency = Strength
                </div>
                <div className="h-px w-16 bg-white/30"></div>
                <p className="text-lg leading-relaxed text-white/90">
                  Progress fades if you're inactive. Keep chatting in all areas to stay sharp
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy - White background */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-black">
            It's All In The Mind
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-gray-600">
            The mental game separates good players from great ones. We give you the tools to master yours—one conversation at a time.
          </p>
        </div>
      </section>

      {/* FAQ Section - White background */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-black text-center mb-12">
            FAQ
          </h2>
          <div className="space-y-4">
            {[
              {
                question: "Is MyCheatCode.AI free?",
                answer: "We're currently in beta and building our waitlist. Pricing details will be shared with waitlist members first."
              },
              {
                question: "How does the AI coach work?",
                answer: "Our AI coach uses advanced conversational AI trained specifically for basketball confidence and mental performance. It provides personalized strategies based on your specific challenges and goals."
              },
              {
                question: "What makes this different from regular coaching?",
                answer: "MyCheatCode.AI is available 24/7, provides instant feedback, and creates custom mental strategies you can save and use anytime. It's like having a confidence coach in your pocket."
              },
              {
                question: "Do I need basketball experience to use this?",
                answer: "No! Whether you're just starting out or playing at an elite level, MyCheatCode.AI adapts to your experience and helps you build confidence for your specific situations."
              }
            ].map((faq, index) => (
              <details key={index} className="group border-b border-gray-200">
                <summary className="flex justify-between items-center cursor-pointer py-6 text-left">
                  <span className="text-xl font-semibold text-black pr-4">{faq.question}</span>
                  <svg
                    className="w-6 h-6 flex-shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="pb-6 text-lg text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
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
          <h2 className="text-3xl md:text-7xl font-bold text-black leading-tight">
            Get your confidence<br />cheat code
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Sign up now and get early access at launch
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-4" id="waitlist-form">
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
              className="w-full px-6 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed"
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
