import { useEffect, useRef, useState } from 'react';

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts from the number last shown up to `target`, so a score settles into place instead of
 * snapping. Shows the target straight away when the phone asks for reduced motion.
 */
export function useCountUp(target: number | null, durationMs = 700): number | null {
  const [shown, setShown] = useState<number | null>(target);
  const from = useRef<number>(0);

  useEffect(() => {
    if (target == null) {
      setShown(null);
      return;
    }
    if (prefersReducedMotion() || durationMs <= 0) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const value = Math.round(origin + (target - origin) * easeOutCubic(t));
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}
