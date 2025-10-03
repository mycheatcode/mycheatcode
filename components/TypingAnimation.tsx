'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per word
  delay?: number; // milliseconds before starting
  onComplete?: () => void;
  className?: string;
}

export default function TypingAnimation({
  text,
  speed = 150,
  delay = 0,
  onComplete,
  className = ""
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const words = text.split(' ');

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentWordIndex(0);
    setIsComplete(false);
    setHasStarted(false);
  }, [text]);

  useEffect(() => {
    if (!hasStarted && delay > 0) {
      const delayTimer = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(delayTimer);
    } else if (!hasStarted) {
      setHasStarted(true);
    }
  }, [delay, hasStarted]);

  useEffect(() => {
    if (hasStarted && currentWordIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => {
          const newText = prev + (prev ? ' ' : '') + words[currentWordIndex];
          return newText;
        });
        setCurrentWordIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (hasStarted && !isComplete && currentWordIndex >= words.length) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentWordIndex, words, speed, onComplete, isComplete, hasStarted]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && hasStarted && (
        <span className="animate-pulse ml-1">|</span>
      )}
    </span>
  );
}