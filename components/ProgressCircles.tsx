'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ProgressCirclesProps {
  theme?: 'dark' | 'light';
  onProgressUpdate?: (percentage: number) => void;
  progress?: number; // Actual progress percentage from database (0-100)
}

const ProgressCircles = ({ theme = 'dark', onProgressUpdate, progress = 0 }: ProgressCirclesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedProgress, setAnimatedProgress] = useState(progress);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle progress growth animation when progress changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (progress === 0) return; // Don't animate if progress is 0

    // Get previous progress from localStorage
    const previousProgress = parseFloat(localStorage.getItem('lastMomentumProgress') || '0');

    // Only animate if there's a meaningful change (more than 0.1%)
    if (Math.abs(progress - previousProgress) < 0.1) {
      setAnimatedProgress(progress);
      return;
    }

    // If progress increased, animate the growth
    if (progress > previousProgress && previousProgress > 0) {
      setIsAnimating(true);
      const startProgress = previousProgress;
      const endProgress = progress;
      const duration = 3000; // 3 seconds animation for more noticeable effect
      const startTime = Date.now();
      let animationFrameId: number;

      const animateGrowth = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation (ease-in-out for more dramatic effect)
        const easeInOut = progressRatio < 0.5
          ? 4 * progressRatio * progressRatio * progressRatio
          : 1 - Math.pow(-2 * progressRatio + 2, 3) / 2;
        const currentProgress = startProgress + (endProgress - startProgress) * easeInOut;

        setAnimatedProgress(currentProgress);

        if (progressRatio < 1) {
          animationFrameId = requestAnimationFrame(animateGrowth);
        } else {
          setIsAnimating(false);
          // Store new progress value
          localStorage.setItem('lastMomentumProgress', progress.toString());
        }
      };

      animationFrameId = requestAnimationFrame(animateGrowth);

      // Cleanup function
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    } else {
      // No animation needed, just set directly
      setAnimatedProgress(progress);
      localStorage.setItem('lastMomentumProgress', progress.toString());
    }
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const themes = {
      dark: {
        bg: '#0a0a0a',
        canvasBg: 'transparent',
        color: [0, 255, 65]  // #00ff41 digital green
      },
      light: {
        bg: '#fafafa',
        canvasBg: 'transparent',
        color: [0, 255, 65]  // #00ff41 digital green
      }
    };

    const currentTheme = themes[theme];

    const animate = () => {
      time += 0.01;
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Scale radii based on container size (use smaller dimension)
      const baseSize = Math.min(w, h);
      const goalRadius = baseSize * 0.34;      // 34% of container (fixed outer circle)

      // Calculate inner circle radius based on animated progress percentage
      // Use LINEAR radius growth so visual matches percentage more accurately
      const progressRatio = animatedProgress / 100;
      const progressRadius = goalRadius * progressRatio;

      const segments = 100;

      // Draw goal circle (outer, filled and translucent)
      ctx.fillStyle = `rgba(${currentTheme.color[0]}, ${currentTheme.color[1]}, ${currentTheme.color[2]}, 0.15)`;
      ctx.beginPath();

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;

        const angleDiff1 = Math.atan2(Math.sin(angle - Math.PI * 0.3), Math.cos(angle - Math.PI * 0.3));
        const angleDiff2 = Math.atan2(Math.sin(angle - Math.PI * 1.2), Math.cos(angle - Math.PI * 1.2));
        const angleDiff3 = Math.atan2(Math.sin(angle - Math.PI * 1.8), Math.cos(angle - Math.PI * 1.8));

        const pull1 = Math.sin(time * 0.7) * 4 * Math.exp(-Math.pow(angleDiff1 / 0.8, 2));
        const pull2 = Math.sin(time * 0.9 + 1) * 3.5 * Math.exp(-Math.pow(angleDiff2 / 0.7, 2));
        const pull3 = Math.sin(time * 0.6 + 2) * 3 * Math.exp(-Math.pow(angleDiff3 / 0.9, 2));

        const radius = goalRadius + pull1 + pull2 + pull3;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.fill();

      // Draw progress circle (inner) with enhanced glow
      ctx.shadowBlur = 50;
      ctx.shadowColor = `rgba(${currentTheme.color[0]}, ${currentTheme.color[1]}, ${currentTheme.color[2]}, 1)`;
      ctx.fillStyle = `rgba(${currentTheme.color[0]}, ${currentTheme.color[1]}, ${currentTheme.color[2]}, 1)`;
      ctx.beginPath();

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;

        const angleDiff1 = Math.atan2(Math.sin(angle - Math.PI * 0.3), Math.cos(angle - Math.PI * 0.3));
        const angleDiff2 = Math.atan2(Math.sin(angle - Math.PI * 1.2), Math.cos(angle - Math.PI * 1.2));
        const angleDiff3 = Math.atan2(Math.sin(angle - Math.PI * 1.8), Math.cos(angle - Math.PI * 1.8));

        const pull1 = Math.sin(time * 0.7) * 3 * Math.exp(-Math.pow(angleDiff1 / 0.8, 2));
        const pull2 = Math.sin(time * 0.9 + 1) * 2.5 * Math.exp(-Math.pow(angleDiff2 / 0.7, 2));
        const pull3 = Math.sin(time * 0.6 + 2) * 2 * Math.exp(-Math.pow(angleDiff3 / 0.9, 2));

        const radius = progressRadius + pull1 + pull2 + pull3;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pass the animated progress percentage to the callback
      if (onProgressUpdate) {
        onProgressUpdate(Math.round(animatedProgress));
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, animatedProgress, onProgressUpdate]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};

export default ProgressCircles;
