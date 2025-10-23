'use client';

import React, { useEffect, useRef } from 'react';

interface ProgressCirclesProps {
  theme?: 'dark' | 'light';
  onProgressUpdate?: (percentage: number) => void;
  progress?: number; // Actual progress percentage from database (0-100)
}

const ProgressCircles = ({ theme = 'dark', onProgressUpdate, progress = 0 }: ProgressCirclesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      // Calculate inner circle radius based on actual progress percentage
      // Use LINEAR radius growth so visual matches percentage more accurately
      const progressRatio = progress / 100;
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

      // Pass the actual progress percentage to the callback
      // (No need to calculate - we already have it from the database)
      if (onProgressUpdate) {
        onProgressUpdate(progress);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, progress, onProgressUpdate]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};

export default ProgressCircles;
