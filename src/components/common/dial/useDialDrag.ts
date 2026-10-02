/**
 * Oblivion 1 Fitness Club - Dial Drag & Touch Hook
 * Robust polar angle tracking from 135 to 405 degrees
 * Strict File Ceiling: < 140 lines
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { DialConfig } from './dialTypes';

export function useDialDrag(config: DialConfig, initialValue: number) {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const calculateValueFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      let theta = Math.atan2(dy, dx) * (180 / Math.PI);
      if (theta < 0) theta += 360;

      // Arc: 135 deg clockwise to 405 deg (45 deg). Dead zone: 45 to 135 (bottom 90 deg)
      let fraction = 0;
      if (theta >= 90 && theta < 135) {
        fraction = 0;
      } else if (theta > 45 && theta < 90) {
        fraction = 1;
      } else if (theta >= 135) {
        fraction = (theta - 135) / 270;
      } else {
        fraction = (theta + 360 - 135) / 270;
      }

      fraction = Math.max(0, Math.min(1, fraction));
      const raw = config.min + fraction * (config.max - config.min);
      const stepped = Math.round(raw / config.step) * config.step;
      const finalVal = Math.min(
        Math.max(Number(stepped.toFixed(1)), config.min),
        config.max
      );

      setValue((prev) => {
        if (prev !== finalVal) {
          tactileEngine.triggerDialHaptic();
          return finalVal;
        }
        return prev;
      });
    },
    [config]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    calculateValueFromPointer(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      calculateValueFromPointer(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      setIsDragging(false);
      try {
        if (svgRef.current?.hasPointerCapture(e.pointerId)) {
          svgRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {}
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, calculateValueFromPointer]);

  return {
    value,
    setValue,
    svgRef,
    handlePointerDown,
  };
}
