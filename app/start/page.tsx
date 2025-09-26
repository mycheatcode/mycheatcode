'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to welcome page
    router.push('/welcome');
  }, [router]);

  return (
    <div className="bg-black min-h-screen text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">mycheatcode.ai</div>
        <div className="text-zinc-400">Loading...</div>
      </div>
    </div>
  );
}