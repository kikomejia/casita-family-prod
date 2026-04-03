"use client";
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export function ConfettiOverlay({ show, onComplete }: { show: boolean, onComplete?: () => void }) {
  useEffect(() => {
    if (show) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff00ff', '#00ffff', '#00ff00', '#ff9900', '#9900ff']
      });
      if (onComplete) {
        setTimeout(onComplete, 3000);
      }
    }
  }, [show, onComplete]);
  return null;
}
