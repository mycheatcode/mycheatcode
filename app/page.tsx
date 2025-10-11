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
    <div className="bg-black min-h-screen text-white font-sans">
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
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Anything you want to work on?
          </h1>
          <p className="text-zinc-400 text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
            Start talking, or explore topics<br />
            to get the conversation going.
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
