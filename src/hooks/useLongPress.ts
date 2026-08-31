import { useRef, useCallback, useState } from 'react';

interface UseLongPressOptions {
  threshold?: number; // duration in ms, default 1000ms (1 second)
  onStart?: () => void;
  onCancel?: () => void;
  onFinish?: () => void;
}

export function useLongPress(
  callback: () => void,
  { threshold = 1000, onStart, onCancel, onFinish }: UseLongPressOptions = {}
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent standard context menu on mobile hold if needed
      if (timerRef.current) clearTimeout(timerRef.current);
      isHoldingRef.current = true;
      setIsPressing(true);
      if (onStart) onStart();

      timerRef.current = setTimeout(() => {
        if (isHoldingRef.current) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(50);
            } catch {
              // ignore vibration error
            }
          }
          callback();
          setIsPressing(false);
          isHoldingRef.current = false;
          if (onFinish) onFinish();
        }
      }, threshold);
    },
    [callback, threshold, onStart, onFinish]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsPressing(false);
      if (onCancel) onCancel();
    }
  }, [onCancel]);

  return {
    isPressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: cancel,
      onTouchCancel: cancel,
      // prevent context menu on long touch
      onContextMenu: (e: React.MouseEvent) => {
        if (isHoldingRef.current) {
          e.preventDefault();
        }
      },
    },
  };
}
