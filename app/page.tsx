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
      {/* Basketball Court Background - Desktop (Landscape) */}
      <div className="hidden md:block absolute inset-0 opacity-[0.12] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <marker id="arrow-desktop" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M 2 2 L 10 6 L 2 10 z" fill="white" stroke="none"/>
            </marker>
            <filter id="rough-desktop">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5"/>
            </filter>
          </defs>

          {/* Court outline - hand-drawn style */}
          <path d="M 30 25 L 1170 27 L 1172 573 L 28 575 Z" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Center line */}
          <path d="M 600 23 Q 602 300 600 577" stroke="white" strokeWidth="2.5" filter="url(#rough-desktop)"/>

          {/* Center circle */}
          <ellipse cx="600" cy="300" rx="75" ry="73" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Left hoop & backboard */}
          <line x1="30" y1="270" x2="30" y2="330" stroke="white" strokeWidth="3" filter="url(#rough-desktop)"/>
          <circle cx="55" cy="300" r="18" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Right hoop & backboard */}
          <line x1="1170" y1="270" x2="1170" y2="330" stroke="white" strokeWidth="3" filter="url(#rough-desktop)"/>
          <circle cx="1145" cy="300" r="18" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Left key */}
          <rect x="30" y="210" width="190" height="180" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>
          <path d="M 220 300 m -70,0 a 70,70 0 1,0 140,0 a 70,70 0 1,0 -140,0" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="6,4" filter="url(#rough-desktop)"/>

          {/* Right key */}
          <rect x="980" y="210" width="190" height="180" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>
          <path d="M 980 300 m -70,0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="6,4" filter="url(#rough-desktop)"/>

          {/* Left free throw line */}
          <line x1="220" y1="210" x2="220" y2="390" stroke="white" strokeWidth="2.5" filter="url(#rough-desktop)"/>

          {/* Right free throw line */}
          <line x1="980" y1="210" x2="980" y2="390" stroke="white" strokeWidth="2.5" filter="url(#rough-desktop)"/>

          {/* Left three-point line */}
          <path d="M 30 100 L 285 102 Q 287 300 285 498 L 30 500" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Right three-point line */}
          <path d="M 1170 100 L 915 102 Q 913 300 915 498 L 1170 500" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Offensive players (O) - 5 players */}
          <circle cx="450" cy="180" r="16" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>
          <circle cx="600" cy="220" r="16" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>
          <circle cx="750" cy="180" r="16" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>
          <circle cx="500" cy="350" r="16" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>
          <circle cx="700" cy="350" r="16" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-desktop)"/>

          {/* Defensive players (X) - 5 players */}
          <g filter="url(#rough-desktop)">
            <text x="435" y="285" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="585" y="325" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="735" y="285" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="480" y="445" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="680" y="445" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">X</text>
          </g>

          {/* Play arrows - screen action */}
          <path d="M 600 220 L 720 200" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-desktop)" filter="url(#rough-desktop)"/>
          <path d="M 750 180 Q 800 220 850 280" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-desktop)" strokeDasharray="8,5" filter="url(#rough-desktop)"/>
          <path d="M 450 180 Q 380 250 350 320" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-desktop)" strokeDasharray="8,5" filter="url(#rough-desktop)"/>
        </svg>
      </div>

      {/* Basketball Court Background - Mobile (Portrait) */}
      <div className="md:hidden absolute inset-0 opacity-[0.12] pointer-events-none">
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

          {/* Top three-point line */}
          <path d="M 60 30 L 62 200 Q 200 220 338 200 L 340 30" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Bottom three-point line */}
          <path d="M 60 770 L 62 600 Q 200 580 338 600 L 340 770" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Offensive players (O) - 5 players */}
          <circle cx="140" cy="480" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="260" cy="480" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="200" cy="520" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="120" cy="580" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>
          <circle cx="280" cy="580" r="14" stroke="white" strokeWidth="2.5" fill="none" filter="url(#rough-mobile)"/>

          {/* Defensive players (X) - 5 players */}
          <g filter="url(#rough-mobile)">
            <text x="128" y="548" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="248" y="548" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="188" y="590" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="105" y="650" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
            <text x="265" y="650" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">X</text>
          </g>

          {/* Play arrows */}
          <path d="M 200 520 L 200 560" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-mobile)" filter="url(#rough-mobile)"/>
          <path d="M 140 480 Q 100 520 80 580" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-mobile)" strokeDasharray="8,5" filter="url(#rough-mobile)"/>
          <path d="M 260 480 Q 300 520 320 580" stroke="white" strokeWidth="2.5" markerEnd="url(#arrow-mobile)" strokeDasharray="8,5" filter="url(#rough-mobile)"/>
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-4">
            Anything you want to work on?
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
          <Link href="/my-codes" className="group">
            <div className="bg-white text-black rounded-2xl p-6 hover:bg-zinc-100 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center border-2 border-white">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1">My Codes</h3>
              <p className="text-sm text-zinc-600">Your personal collection</p>
            </div>
          </Link>

          <Link href="/community-topics" className="group">
            <div className="bg-white text-black rounded-2xl p-6 hover:bg-zinc-100 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center border-2 border-white">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1">Community Topics</h3>
              <p className="text-sm text-zinc-600">Explore curated topics</p>
            </div>
          </Link>

          <Link href="/chat-history" className="group">
            <div className="bg-white text-black rounded-2xl p-6 hover:bg-zinc-100 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center border-2 border-white">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mb-3">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <h3 className="text-xl font-bold mb-1">Chat History</h3>
              <p className="text-sm text-zinc-600">Review past conversations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
