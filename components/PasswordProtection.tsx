'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const DEV_PASSWORD = 'mycheatcode2025';

const PROTECTED_ROUTES = [
  '/',
  '/chat',
  '/chat-history',
  '/my-codes',
  '/community-topics',
  '/profile',
  '/onboarding',
  '/start',
  '/welcome',
  '/debug',
  '/signup',
  '/auth',
  '/login'
];

export default function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // List of routes that should be PUBLIC (not protected)
    const PUBLIC_ROUTES = [
      '/waitlist',
      '/api'
    ];

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route)
    );

    if (isPublicRoute) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // All other routes are protected by default

    // Check if already authenticated
    const authenticated = sessionStorage.getItem('dev_authenticated') === 'true';
    if (authenticated) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEV_PASSWORD) {
      sessionStorage.setItem('dev_authenticated', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md text-center p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              MyCheatCode
            </h1>
            <h2 className="text-xl font-semibold text-white mb-2">
              Development Access
            </h2>
            <p className="text-zinc-400 text-sm">
              This area is currently in development
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900 text-white placeholder-zinc-400 transition-all duration-200"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-200"
            >
              Access
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-zinc-500 text-sm mb-3">
              Looking for early access?
            </p>
            <button
              onClick={() => router.push('/waitlist')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Join the waitlist →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}