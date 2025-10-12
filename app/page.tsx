'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Navigate to chat with the message
    localStorage.setItem('initialMessage', message);
    router.push('/chat');
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans relative overflow-hidden">
      {/* Basketball Court Background - Desktop (Landscape) - Exact recreation */}
      <div className="hidden md:block absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1086 680" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <marker id="arrow-desktop" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M 2 2 L 9 5 L 2 8 z" fill="white"/>
            </marker>
          </defs>

          {/* Court outline */}
          <rect x="33" y="33" width="1020" height="614" stroke="white" strokeWidth="3" fill="none"/>

          {/* Center line */}
          <line x1="543" y1="33" x2="543" y2="647" stroke="white" strokeWidth="3"/>

          {/* Center circle */}
          <circle cx="543" cy="340" r="90" stroke="white" strokeWidth="3" fill="none"/>

          {/* Left three-point line - more rounded arc */}
          <path d="M 33 120 L 230 120 Q 280 340 230 560 L 33 560" stroke="white" strokeWidth="3" fill="none"/>

          {/* Right three-point line - more rounded arc */}
          <path d="M 1053 120 L 856 120 Q 806 340 856 560 L 1053 560" stroke="white" strokeWidth="3" fill="none"/>

          {/* Left key */}
          <rect x="33" y="250" width="160" height="180" stroke="white" strokeWidth="3" fill="none"/>
          {/* Left free throw circle */}
          <circle cx="193" cy="340" r="90" stroke="white" strokeWidth="3" fill="none" strokeDasharray="8,6"/>
          {/* Left basket circle */}
          <circle cx="93" cy="340" r="25" stroke="white" strokeWidth="3" fill="none"/>
          {/* Left basket marks */}
          <line x1="93" y1="315" x2="93" y2="305" stroke="white" strokeWidth="3"/>
          <line x1="93" y1="365" x2="93" y2="375" stroke="white" strokeWidth="3"/>

          {/* Right key */}
          <rect x="893" y="250" width="160" height="180" stroke="white" strokeWidth="3" fill="none"/>
          {/* Right free throw circle */}
          <circle cx="893" cy="340" r="90" stroke="white" strokeWidth="3" fill="none" strokeDasharray="8,6"/>
          {/* Right basket circle */}
          <circle cx="993" cy="340" r="25" stroke="white" strokeWidth="3" fill="none"/>
          {/* Right basket marks */}
          <line x1="993" y1="315" x2="993" y2="305" stroke="white" strokeWidth="3"/>
          <line x1="993" y1="365" x2="993" y2="375" stroke="white" strokeWidth="3"/>

          {/* Offensive players (O) - exactly positioned as in image */}
          <circle cx="240" cy="180" r="22" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="846" cy="180" r="22" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="543" cy="240" r="22" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="240" cy="590" r="22" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="846" cy="590" r="22" stroke="white" strokeWidth="3" fill="none"/>

          {/* Defensive players (X) - exactly positioned as in image */}
          <text x="360" y="210" fill="white" fontSize="48" fontWeight="normal" fontFamily="Arial">X</text>
          <text x="540" y="140" fill="white" fontSize="48" fontWeight="normal" fontFamily="Arial">X</text>
          <text x="360" y="520" fill="white" fontSize="48" fontWeight="normal" fontFamily="Arial">X</text>
          <text x="540" y="470" fill="white" fontSize="48" fontWeight="normal" fontFamily="Arial">X</text>
          <text x="860" y="520" fill="white" fontSize="48" fontWeight="normal" fontFamily="Arial">X</text>

          {/* Play arrows - exactly as in image */}
          <path d="M 380 195 L 530 150" stroke="white" strokeWidth="3" markerEnd="url(#arrow-desktop)"/>
          <path d="M 560 150 L 820 195" stroke="white" strokeWidth="3" markerEnd="url(#arrow-desktop)"/>
          <path d="M 380 505 Q 460 460 540 460" stroke="white" strokeWidth="3" markerEnd="url(#arrow-desktop)" strokeDasharray="12,8"/>
          <path d="M 560 460 Q 760 500 840 540" stroke="white" strokeWidth="3" markerEnd="url(#arrow-desktop)" strokeDasharray="12,8"/>
        </svg>
      </div>

      {/* Basketball Court Background - Mobile (Portrait) */}
      <div className="md:hidden absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <marker id="arrow-mobile" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M 2 2 L 10 6 L 2 10 z" fill="white" stroke="none"/>
            </marker>
            <filter id="rough-mobile">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5"/>
            </filter>
          </defs>

          {/* Court outline */}
          <path d="M 20 30 L 380 32 L 382 770 L 18 772 Z" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Center line */}
          <path d="M 18 400 L 382 402" stroke="white" strokeWidth="2.5" filter="url(#rough-mobile)"/>

          {/* Center circle */}
          <ellipse cx="200" cy="400" rx="55" ry="54" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Top hoop & backboard */}
          <line x1="170" y1="30" x2="230" y2="30" stroke="white" strokeWidth="3" filter="url(#rough-mobile)"/>
          <circle cx="200" cy="60" r="15" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Bottom hoop & backboard */}
          <line x1="170" y1="770" x2="230" y2="770" stroke="white" strokeWidth="3" filter="url(#rough-mobile)"/>
          <circle cx="200" cy="740" r="15" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Top key */}
          <rect x="110" y="30" width="180" height="140" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <ellipse cx="200" cy="170" rx="55" ry="54" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="6,4" filter="url(#rough-mobile)"/>

          {/* Bottom key */}
          <rect x="110" y="630" width="180" height="140" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <ellipse cx="200" cy="630" rx="55" ry="54" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="6,4" filter="url(#rough-mobile)"/>

          {/* Top free throw line */}
          <line x1="110" y1="170" x2="290" y2="170" stroke="white" strokeWidth="2.5" filter="url(#rough-mobile)"/>

          {/* Bottom free throw line */}
          <line x1="110" y1="630" x2="290" y2="630" stroke="white" strokeWidth="2.5" filter="url(#rough-mobile)"/>

          {/* Top three-point line - rounded arc */}
          <path d="M 60 30 L 60 140 Q 200 240 340 140 L 340 30" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Bottom three-point line - rounded arc */}
          <path d="M 60 770 L 60 660 Q 200 560 340 660 L 340 770" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Offensive players (O) - 5 players - CLOSER TO TOP HOOP */}
          <circle cx="140" cy="110" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="260" cy="110" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="200" cy="150" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="120" cy="210" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="280" cy="210" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Defensive players (X) - 5 players - CLOSER TO TOP HOOP */}
          <g filter="url(#rough-mobile)">
            <text x="128" y="178" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="248" y="178" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="188" y="220" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="105" y="280" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="265" y="280" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
          </g>

          {/* Play arrows - TOP HALF */}
          <path d="M 200 150 L 200 190" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-mobile)" filter="url(#rough-mobile)"/>
          <path d="M 140 110 Q 100 150 80 210" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-mobile)" strokeDasharray="8,5" filter="url(#rough-mobile)"/>
          <path d="M 260 110 Q 300 150 320 210" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-mobile)" strokeDasharray="8,5" filter="url(#rough-mobile)"/>
        </svg>
      </div>
      {/* Mobile & Desktop Header with Menu */}
      <div className="absolute top-0 left-0 right-0 px-4 lg:px-6 py-4 lg:py-5 flex items-center gap-4 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="text-white text-lg lg:text-xl font-semibold">MYCHEATCODE.AI</div>
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 px-4 md:whitespace-nowrap">
            Play With<br className="md:hidden" /> Confidence.
          </h1>
          <p className="text-zinc-400 text-sm md:text-base lg:text-lg max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-4">
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
              className="w-full px-6 py-4 bg-white text-black rounded-2xl border-2 border-white focus:outline-none focus:border-zinc-400 text-lg placeholder-zinc-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors font-medium"
            >
              Send
            </button>
          </div>
        </form>

        {/* Three Boxes */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/community-topics" className="group">
            <div className="bg-zinc-800 text-white rounded-2xl p-6 hover:bg-zinc-700 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center border-2 border-zinc-700">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1">Community Topics</h3>
              <p className="text-sm text-zinc-400">Explore curated topics</p>
            </div>
          </Link>

          <Link href="/my-codes" className="group">
            <div className="bg-zinc-800 text-white rounded-2xl p-6 hover:bg-zinc-700 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center border-2 border-zinc-700">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1">My Codes</h3>
              <p className="text-sm text-zinc-400">Your personal collection</p>
            </div>
          </Link>

          <Link href="/chat-history" className="group">
            <div className="bg-zinc-800 text-white rounded-2xl p-6 hover:bg-zinc-700 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center border-2 border-zinc-700">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1">Chat History</h3>
              <p className="text-sm text-zinc-400">Review past conversations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
