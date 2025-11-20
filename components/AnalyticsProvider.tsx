'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics } from '@/lib/analytics';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Track session start on mount
  useEffect(() => {
    Analytics.trackSessionStart();
  }, []);

  // Track page views on navigation
  useEffect(() => {
    if (pathname) {
      const pageName = getPageName(pathname);
      Analytics.trackPageView(pageName);
    }
  }, [pathname]);

  return <>{children}</>;
}

// Helper to convert pathname to readable page name
function getPageName(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname === '/onboarding') return 'Onboarding';
  if (pathname === '/chat') return 'Coach Chat';
  if (pathname === '/codes') return 'My Cheat Codes';
  if (pathname === '/practice') return 'Practice Games';
  if (pathname === '/profile') return 'Profile';
  if (pathname.startsWith('/admin')) return 'Admin';
  return pathname;
}
