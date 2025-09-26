'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from './ChatInterface';
import { SectionType } from '../../lib/types';

export default function NewChatPage() {
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(null);
  const router = useRouter();

  const sections: { key: SectionType; label: string; icon: string; description: string }[] = [
    {
      key: 'pre_game',
      label: 'Pre-Game',
      icon: '🎯',
      description: 'Preparation, focus, visualization'
    },
    {
      key: 'in_game',
      label: 'In-Game',
      icon: '⚡',
      description: 'Performance, pressure, decision making'
    },
    {
      key: 'post_game',
      label: 'Post-Game',
      icon: '📊',
      description: 'Reflection, analysis, learning'
    },
    {
      key: 'locker_room',
      label: 'Locker Room',
      icon: '🏀',
      description: 'Team dynamics, confidence, energy'
    },
    {
      key: 'off_court',
      label: 'Off Court',
      icon: '🏃‍♂️',
      description: 'Training, lifestyle, mental development'
    }
  ];

  const handleBack = () => {
    if (selectedSection) {
      setSelectedSection(null);
    } else {
      const referrer = localStorage.getItem('chatReferrer');
      if (referrer) {
        localStorage.removeItem('chatReferrer');
        router.push(referrer);
      } else {
        router.push('/');
      }
    }
  };

  // If section is selected, show chat interface
  if (selectedSection) {
    return <ChatInterface section={selectedSection} onBack={handleBack} />;
  }

  // Otherwise, show section selection
  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold">Chat with Coach</h1>
            <p className="text-sm text-zinc-400">Choose your context</p>
          </div>
        </div>
      </div>

      {/* Section Selection */}
      <div className="p-4">
        <div className="mb-6 text-center">
          <p className="text-zinc-300 text-sm">
            What area would you like to talk about today?
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setSelectedSection(section.key)}
              className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{section.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{section.label}</h3>
                  <p className="text-sm text-zinc-400">{section.description}</p>
                </div>
                <div className="text-zinc-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <h4 className="font-medium text-white mb-2">💡 How it works</h4>
          <ul className="space-y-1 text-sm text-zinc-400">
            <li>• Share what's on your mind</li>
            <li>• I'll listen and ask questions</li>
            <li>• When you're ready, I'll suggest a Cheat Code</li>
            <li>• No pressure - just conversation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}