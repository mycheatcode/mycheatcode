'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // milliseconds before starting
  onComplete?: () => void;
  onTextChange?: () => void; // Called whenever displayed text changes
  className?: string;
  style?: React.CSSProperties;
}

export default function TypingAnimation({
  text,
  speed = 80,
  delay = 0,
  onComplete,
  onTextChange,
  className = "",
  style
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const currentIndex = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTextChangeRef = useRef(onTextChange);

  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTextChangeRef.current = onTextChange;
  });

  useEffect(() => {

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

      intervalRef.current = setInterval(() => {
        if (currentIndex.current < text.length) {
          const char = text[currentIndex.current];

          setDisplayedText(prev => {
            const newText = prev + char;
            onTextChangeRef.current?.(); // Notify parent that text changed
            return newText;
          });

          currentIndex.current++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsComplete(true);
          onCompleteRef.current?.();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, delay]);

  return (
    <span className={className} style={style}>
      {displayedText}
      {!isComplete && (
        <span className="animate-pulse ml-1" style={{ color: '#00ff41' }}>|</span>
      )}
    </span>
  );
}