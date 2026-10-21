import React, { useCallback, useRef, useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { SCALE, Unit, snap } from './portionMath';

/** Pointer, wheel, and keyboard handlers for the ruler element. */
export interface RulerHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The ruler's position and how it moves: drag with momentum, glide to a value, snap on release,
 * and a haptic tick each time a mark passes the needle. Positions are in the unit's own values.
 */
export function usePortionDial(unit: Unit, max: number) {
  const [pos, setPos] = useState(100);
  const posRef = useRef(pos);
  const animRef = useRef<number | null>(null);
  const tickRef = useRef({ bucket: 0, at: 0, quiet: false });
  const dragRef = useRef<{
    x: number;
    start: number;
    lastX: number;
    lastT: number;
    vel: number;
  } | null>(null);
  const cfg = SCALE[unit];

  const stopAnim = useCallback(() => {
    if (animRef.current != null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }, []);

  const place = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(max, next));
      posRef.current = clamped;
      setPos(clamped);
      const s = SCALE[unit];
      const bucket = Math.floor(snap(clamped, unit) / s.minor + 1e-9);
      const t = tickRef.current;
      if (bucket !== t.bucket) {
        t.bucket = bucket;
        const now = performance.now();
        if (!t.quiet && now - t.at > 28) {
          t.at = now;
          if (Math.abs((bucket * s.minor) % s.major) < 1e-9) tactileEngine.triggerSelectionBuzz();
          else tactileEngine.triggerDialHaptic();
        }
      }
    },
    [max, unit],
  );

  const glideTo = useCallback(
    (target: number, ms = 260) => {
      stopAnim();
      const from = posRef.current;
      const t0 = performance.now();
      tickRef.current.quiet = true;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        const eased = 1 - Math.pow(1 - p, 3);
        place(from + (target - from) * eased);
        if (p < 1) animRef.current = requestAnimationFrame(step);
        else {
          animRef.current = null;
          tickRef.current.quiet = false;
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    [place, stopAnim],
  );

  /** Put the ruler at a value with no animation or haptic, in the given unit's marks. */
  const jumpTo = useCallback((value: number, forUnit: Unit) => {
    posRef.current = value;
    setPos(value);
    tickRef.current.bucket = Math.floor(value / SCALE[forUnit].minor);
  }, []);

  /** Start over at a value, as when the dial opens. */
  const reset = useCallback((start: number, startUnit: Unit) => {
    posRef.current = start;
    setPos(start);
    tickRef.current = { bucket: Math.floor(start / SCALE[startUnit].minor), at: 0, quiet: false };
  }, []);

  const handlers: RulerHandlers = {
    onPointerDown: (e) => {
      stopAnim();
      tickRef.current.quiet = false;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        x: e.clientX,
        start: posRef.current,
        lastX: e.clientX,
        lastT: performance.now(),
        vel: 0,
      };
    },
    onPointerMove: (e) => {
      const d = dragRef.current;
      if (!d) return;
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.vel = 0.75 * ((e.clientX - d.lastX) / dt) + 0.25 * d.vel;
      d.lastX = e.clientX;
      d.lastT = now;
      place(d.start - (e.clientX - d.x) / cfg.ppu);
    },
    onPointerUp: () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;
      let vel = performance.now() - d.lastT > 80 ? 0 : d.vel;
      if (Math.abs(vel) < 0.08) {
        glideTo(snap(posRef.current, unit), 120);
        return;
      }
      let prev = performance.now();
      const coast = (t: number) => {
        const dt = t - prev;
        prev = t;
        place(posRef.current - (vel * dt) / cfg.ppu);
        vel *= Math.pow(0.994, dt);
        const atEdge = posRef.current <= 0 || posRef.current >= max;
        if (Math.abs(vel) > 0.03 && !atEdge) animRef.current = requestAnimationFrame(coast);
        else {
          animRef.current = null;
          glideTo(snap(posRef.current, unit), 120);
        }
      };
      animRef.current = requestAnimationFrame(coast);
    },
    onWheel: (e) => {
      stopAnim();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      place(snap(posRef.current + delta / cfg.ppu, unit));
    },
    onKeyDown: (e) => {
      const big = e.shiftKey ? cfg.major : cfg.minor;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') place(snap(posRef.current + big, unit));
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
        place(snap(posRef.current - big, unit));
      else return;
      e.preventDefault();
    },
  };

  return { pos, posRef, stopAnim, glideTo, jumpTo, reset, handlers };
}
