import React, { useEffect, useRef } from 'react';

interface LiquidSilkBackgroundProps {
  className?: string;
  intensity?: number;
  speed?: number;
  theme?: 'light' | 'dark' | 'pearl' | 'silver';
  interactive?: boolean;
}

export const LiquidSilkBackground: React.FC<LiquidSilkBackgroundProps> = ({
  className = '',
  intensity = 1.0,
  speed = 1.0,
  theme = 'light',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth || 800);
    let height = (canvas.height = window.innerHeight || 600);
    let time = 0;

    let pointerX = width * 0.5;
    let pointerY = height * 0.5;
    let targetPointerX = pointerX;
    let targetPointerY = pointerY;

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 800;
      height = canvas.height = window.innerHeight || 600;
    };

    resize();
    window.addEventListener('resize', resize);

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (clientX !== undefined && clientY !== undefined) {
        targetPointerX = clientX;
        targetPointerY = clientY;
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Multi-layer procedural liquid silk wave parameters
    const waves = [
      { amp: 55 * intensity, freq: 0.002, speed: 0.0006 * speed, phase: 0 },
      { amp: 80 * intensity, freq: 0.0014, speed: -0.00045 * speed, phase: 1.8 },
      { amp: 40 * intensity, freq: 0.003, speed: 0.0008 * speed, phase: 3.4 },
      { amp: 65 * intensity, freq: 0.0018, speed: -0.0005 * speed, phase: 4.9 },
    ];

    const render = () => {
      time += 1;
      pointerX += (targetPointerX - pointerX) * 0.04;
      pointerY += (targetPointerY - pointerY) * 0.04;

      const logicalW = width;
      const logicalH = height;

      // ── 1. Base Pearlescent Light Gradient ──
      const baseGrad = ctx.createLinearGradient(0, 0, logicalW, logicalH);
      if (theme === 'dark') {
        baseGrad.addColorStop(0, '#0a0b0d');
        baseGrad.addColorStop(0.5, '#121418');
        baseGrad.addColorStop(1, '#08090a');
      } else {
        // High-end Luxury Light Palette (Pearl White, Silky Satin Platinum, Alabaster)
        baseGrad.addColorStop(0, '#fbfcfe');
        baseGrad.addColorStop(0.35, '#f4f6f8');
        baseGrad.addColorStop(0.7, '#ebeff3');
        baseGrad.addColorStop(1, '#e2e7ec');
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, logicalW, logicalH);

      // ── 2. Fluid Undulating Silk Folds ──
      const cols = 6;
      const stepY = logicalH / cols;

      for (let i = 0; i < cols; i++) {
        const yBase = i * stepY;
        const w1 = waves[i % waves.length];
        const w2 = waves[(i + 1) % waves.length];

        ctx.beginPath();
        ctx.moveTo(-50, logicalH + 50);
        ctx.lineTo(-50, yBase);

        const segments = 24;
        const stepX = (logicalW + 100) / segments;

        for (let j = 0; j <= segments; j++) {
          const x = -50 + j * stepX;

          // Trigonometric liquid displacement
          const wave1 = Math.sin(x * w1.freq + time * w1.speed + w1.phase) * w1.amp;
          const wave2 = Math.cos(x * w2.freq - time * w2.speed + w2.phase) * (w2.amp * 0.7);

          // Subtle pointer distension
          const dx = x - pointerX;
          const dy = yBase - pointerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const touchEffect = Math.max(0, 1 - dist / 350) * 28 * Math.sin(time * 0.05);

          const y = yBase + wave1 + wave2 + touchEffect;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = -50 + (j - 1) * stepX;
            const cx = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, y, cx, y);
          }
        }

        ctx.lineTo(logicalW + 50, logicalH + 50);
        ctx.closePath();

        // High-end pearlescent liquid shading
        const silkGrad = ctx.createLinearGradient(0, yBase - 80, logicalW, yBase + stepY + 120);
        if (theme === 'dark') {
          silkGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
          silkGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.08)');
          silkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        } else {
          // Light Silk Folds with delicate specular reflection
          const isEven = i % 2 === 0;
          if (isEven) {
            silkGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
            silkGrad.addColorStop(0.4, 'rgba(235, 240, 245, 0.55)');
            silkGrad.addColorStop(0.8, 'rgba(215, 224, 232, 0.4)');
            silkGrad.addColorStop(1, 'rgba(248, 250, 252, 0.65)');
          } else {
            silkGrad.addColorStop(0, 'rgba(240, 244, 248, 0.65)');
            silkGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
            silkGrad.addColorStop(0.7, 'rgba(224, 231, 239, 0.5)');
            silkGrad.addColorStop(1, 'rgba(245, 247, 250, 0.7)');
          }
        }

        ctx.fillStyle = silkGrad;
        ctx.fill();

        // ── 3. Fine Specular Crest Line (Silk Ribbon Highlight) ──
        ctx.beginPath();
        for (let j = 0; j <= segments; j++) {
          const x = -50 + j * stepX;
          const wave1 = Math.sin(x * w1.freq + time * w1.speed + w1.phase) * w1.amp;
          const wave2 = Math.cos(x * w2.freq - time * w2.speed + w2.phase) * (w2.amp * 0.7);
          const y = yBase + wave1 + wave2;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── 4. Ambient Soft Light Caustic (Vignette & Bloom) ──
      const radialGlow = ctx.createRadialGradient(
        pointerX,
        pointerY,
        10,
        pointerX,
        pointerY,
        Math.max(logicalW, logicalH) * 0.65
      );
      if (theme === 'dark') {
        radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      } else {
        radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        radialGlow.addColorStop(0.6, 'rgba(240, 244, 248, 0.15)');
        radialGlow.addColorStop(1, 'rgba(215, 222, 230, 0.3)');
      }
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, logicalW, logicalH);

      animationFrameId = requestAnimationFrame(render);
    };

    // Initial render synchronously
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [intensity, speed, theme, interactive]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#f4f6f8] dark:bg-[#0a0b0d] ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-100"
      />
      {/* Subtle organic satin sheen film */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-white/40 mix-blend-overlay pointer-events-none" />
    </div>
  );
};

