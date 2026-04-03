"use client";
import { useEffect, useRef, useState } from 'react';

export function RouletteWheel({ prizes, onSpinDone }: { prizes: string[], onSpinDone: (prize: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    const numSlices = prizes.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    const colors = ['#FF00FF', '#00FFFF', '#00FF00', '#FF9900', '#9900FF', '#FF0000', '#0000FF', '#FFFF00'];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    for (let i = 0; i < numSlices; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, i * sliceAngle, (i + 1) * sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(i * sliceAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(prizes[i], radius - 15, 5);
      ctx.restore();
    }
    ctx.restore();

    // Draw pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 5);
    ctx.lineTo(centerX - 15, centerY - radius - 15);
    ctx.lineTo(centerX + 15, centerY - radius - 15);
    ctx.closePath();
    ctx.fillStyle = '#111';
    ctx.fill();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#111';
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(0);
  }, [prizes]);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const spinDuration = 4000;
    const startRotation = 0;
    const spins = 5;
    const randomOffset = Math.random() * Math.PI * 2;
    const endRotation = startRotation + spins * Math.PI * 2 + randomOffset;

    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (endRotation - startRotation) * easeProgress;

      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const normalizedRotation = currentRotation % (2 * Math.PI);
        let winningAngle = (1.5 * Math.PI - normalizedRotation) % (2 * Math.PI);
        if (winningAngle < 0) winningAngle += 2 * Math.PI;
        const sliceAngle = (2 * Math.PI) / prizes.length;
        const winningIndex = Math.floor(winningAngle / sliceAngle);
        
        onSpinDone(prizes[winningIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} width={320} height={320} className="max-w-full" />
      <button 
        onClick={spin} 
        disabled={isSpinning}
        className="mt-6 px-8 py-3 bg-primary text-white font-black text-lg rounded-full shadow-lg disabled:opacity-50 transition-transform active:scale-95"
      >
        {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL!'}
      </button>
    </div>
  );
}
