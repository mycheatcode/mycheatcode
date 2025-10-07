'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // milliseconds before starting
  onComplete?: () => void;
  className?: string;
}

export default function TypingAnimation({
  text,
  speed = 80,
  delay = 0,
  onComplete,
  className = ""
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const currentIndex = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🎯 TypingAnimation: Starting with text:', text);

    // Reset everything
    setDisplayedText('');
    setIsComplete(false);
    currentIndex.current = 0;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start delay then animation
    const startTimer = setTimeout(() => {
      console.log('🚀 TypingAnimation: Starting typing animation');

      intervalRef.current = setInterval(() => {
        if (currentIndex.current < text.length) {
          const char = text[currentIndex.current];
          console.log(`⌨️ Adding character ${currentIndex.current}: "${char}"`);

          setDisplayedText(prev => {
            const newText = prev + char;
            console.log(`📝 New displayed text: "${newText}"`);
            return newText;
          });

          currentIndex.current++;
        } else {
          console.log('✅ TypingAnimation: Complete!');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="animate-pulse ml-1 text-green-500">|</span>
      )}
    </span>
  );
}