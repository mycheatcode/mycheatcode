'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Navigate to chat with the message
    localStorage.setItem('initialMessage', message);
    router.push('/chat');
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden" style={{ color: 'var(--text-primary)' }}>
      {/* Basketball Court Background - Desktop (Landscape) - Clean design */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" style={{ opacity: '0.08' }}>
        <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRacing="xMidYMid slice">
          {/* Top half court */}
          <path d="M 100 50 L 1100 50 L 1100 400 Q 900 550 600 400 Q 300 550 100 400 Z" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Top key/paint */}
          <rect x="450" y="50" width="300" height="200" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Top free throw circle (bottom half) */}
          <path d="M 450 250 Q 600 320 750 250" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Top basket */}
          <line x1="575" y1="50" x2="625" y2="50" stroke="var(--accent-color)" strokeWidth="4"/>
          <circle cx="600" cy="80" r="15" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Center line */}
          <line x1="100" y1="400" x2="1100" y2="400" stroke="var(--accent-color)" strokeWidth="3"/>

          {/* Center circle */}
          <circle cx="600" cy="400" r="100" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Bottom half court */}
          <path d="M 100 400 Q 300 250 600 400 Q 900 250 1100 400 L 1100 750 L 100 750 Z" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Bottom key/paint */}
          <rect x="450" y="550" width="300" height="200" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Bottom free throw circle (top half) */}
          <path d="M 450 550 Q 600 480 750 550" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>

          {/* Bottom basket */}
          <line x1="575" y1="750" x2="625" y2="750" stroke="var(--accent-color)" strokeWidth="4"/>
          <circle cx="600" cy="720" r="15" stroke="var(--accent-color)" strokeWidth="3" fill="none"/>
        </svg>
      </div>

      {/* Basketball Court Background - Mobile (Portrait) - Clean design */}
      <div className="md:hidden absolute inset-0 pointer-events-none" style={{ opacity: '0.08' }}>
        <svg className="w-full h-full" viewBox="0 0 400 1000" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Top half court */}
          <path d="M 50 50 L 350 50 L 350 500 Q 275 600 200 500 Q 125 600 50 500 Z" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Top key/paint */}
          <rect x="125" y="50" width="150" height="120" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Top free throw circle (bottom half) */}
          <path d="M 125 170 Q 200 215 275 170" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Top basket */}
          <line x1="175" y1="50" x2="225" y2="50" stroke="var(--accent-color)" strokeWidth="3"/>
          <circle cx="200" cy="75" r="12" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Center line */}
          <line x1="50" y1="500" x2="350" y2="500" stroke="var(--accent-color)" strokeWidth="2.5"/>

          {/* Center circle */}
          <circle cx="200" cy="500" r="60" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Bottom half court */}
          <path d="M 50 500 Q 125 400 200 500 Q 275 400 350 500 L 350 950 L 50 950 Z" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Bottom key/paint */}
          <rect x="125" y="830" width="150" height="120" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Bottom free throw circle (top half) */}
          <path d="M 125 830 Q 200 785 275 830" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>

          {/* Bottom basket */}
          <line x1="175" y1="950" x2="225" y2="950" stroke="var(--accent-color)" strokeWidth="3"/>
          <circle cx="200" cy="925" r="12" stroke="var(--accent-color)" strokeWidth="2.5" fill="none"/>
        </svg>
      </div>
      {/* Mobile & Desktop Header with Menu */}
      <div className="absolute top-0 left-0 right-0 px-4 lg:px-6 py-4 lg:py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)', backgroundColor: 'transparent' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-lg lg:text-xl font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--accent-color)', backgroundColor: 'transparent' }}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`fixed top-0 left-0 h-full w-64 lg:w-80 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-20"></div>
        <nav className="flex-1">
          <div>
            <Link href="/" className="flex items-center gap-3 p-4 text-white font-medium relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>
            <Link href="/my-codes" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>
            <Link href="/community-topics" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Community Topics</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>
            <Link href="/chat-history" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Chat History</span>
              <div className="absolute bottom-0 left-4 right-4 h-px bg-zinc-800"></div>
            </Link>
            <Link href="/profile" className="flex items-center gap-3 p-4 text-zinc-400 hover:text-white cursor-pointer transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Profile</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-8">
        {/* Header Message */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 px-4 md:whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
            Play With<br className="md:hidden" /> Confidence.
          </h1>
          <p className="text-sm md:text-base lg:text-lg max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-4" style={{ color: 'var(--text-secondary)' }}>
            Start talking, or explore topics to get the conversation going.
          </p>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="w-full max-w-2xl mb-8">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-6 py-4 rounded-2xl text-lg focus:outline-none"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--input-text)'
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl transition-colors font-medium"
              style={{
                background: 'var(--button-bg)',
                color: 'var(--button-text)'
              }}
            >
              Send
            </button>
          </div>
        </form>

        {/* Three Boxes */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/community-topics" className="group">
            <div className="rounded-2xl p-6 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center" style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3" style={{ color: 'var(--card-title)' }}>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--card-title)' }}>Community Topics</h3>
              <p className="text-sm" style={{ color: 'var(--card-description)' }}>Explore curated topics</p>
            </div>
          </Link>

          <Link href="/my-codes" className="group">
            <div className="rounded-2xl p-6 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center" style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3" style={{ color: 'var(--card-title)' }}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--card-title)' }}>My Codes</h3>
              <p className="text-sm" style={{ color: 'var(--card-description)' }}>Your personal collection</p>
            </div>
          </Link>

          <Link href="/chat-history" className="group">
            <div className="rounded-2xl p-6 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center" style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3" style={{ color: 'var(--card-title)' }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--card-title)' }}>Chat History</h3>
              <p className="text-sm" style={{ color: 'var(--card-description)' }}>Review past conversations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
