'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per word
  onComplete?: () => void;
  className?: string;
}

export default function TypingAnimation({
  text,
  speed = 150,
  onComplete,
  className = ""
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const words = text.split(' ');

  useEffect(() => {
    if (currentWordIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => {
          const newText = prev + (prev ? ' ' : '') + words[currentWordIndex];
          return newText;
        });
        setCurrentWordIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentWordIndex, words, speed, onComplete, isComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="animate-pulse ml-1">|</span>
      )}
    </span>
  );
}