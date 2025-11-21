'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(true); // Start visible
  const pathname = usePathname();

  useEffect(() => {
    // Already visible, no need to do anything special
    setIsVisible(true);
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}