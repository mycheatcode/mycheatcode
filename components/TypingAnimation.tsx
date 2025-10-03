'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // milliseconds before starting
  onComplete?: () => void;
  className?: string;
}

export default function TypingAnimation({
  text,
  speed = 100,
  delay = 0,
  onComplete,
  className = ""
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Reset animation when text changes
  useEffect(() => {
    console.log('TypingAnimation: Text changed to:', text);
    setDisplayedText('');
    setCurrentCharIndex(0);
    setIsComplete(false);
    setHasStarted(false);
  }, [text]);

  useEffect(() => {
    if (!hasStarted && delay > 0) {
      console.log('TypingAnimation: Starting with delay:', delay);
      const delayTimer = setTimeout(() => {
        console.log('TypingAnimation: Delay complete, starting animation');
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(delayTimer);
    } else if (!hasStarted) {
      console.log('TypingAnimation: Starting immediately');
      setHasStarted(true);
    }
  }, [delay, hasStarted]);

  useEffect(() => {
    if (hasStarted && currentCharIndex < text.length) {
      console.log(`TypingAnimation: Adding character ${currentCharIndex}: "${text[currentCharIndex]}"`);
      const timer = setTimeout(() => {
        setDisplayedText(prev => {
          const newText = prev + text[currentCharIndex];
          console.log('TypingAnimation: New displayed text:', newText);
          return newText;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (hasStarted && !isComplete && currentCharIndex >= text.length) {
      console.log('TypingAnimation: Animation complete');
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentCharIndex, text, speed, onComplete, isComplete, hasStarted]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && hasStarted && (
        <span className="animate-pulse ml-1">|</span>
      )}
    </span>
  );
}