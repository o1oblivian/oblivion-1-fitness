import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/safeStorage';

const HINT_KEY = 'o1fc_hint_swipe_delete_v3';
/** Real swipe-opens before the row stops repeating its nudge; it still nudges once on appear. */
const LEARN_AFTER = 3;
const AXIS_LOCK_PX = 8;
const PEEK_FIRST_MS = 400;
/** Peek and return inside the first three seconds. */
const PEEK_HOLD_MS = 2400;
/** Enough to show the red edge of the action, not the whole button. */
const PEEK_PX = 22;

let closeOpenRow: (() => void) | null = null;
const learnedListeners = new Set<() => void>();

const swipeCount = () => Number(safeStorage.getItem<number>(HINT_KEY, 0)) || 0;

function recordSwipe() {
  const next = swipeCount() + 1;
  if (next > LEARN_AFTER) return;
  safeStorage.setItem(HINT_KEY, next);
  if (next === LEARN_AFTER) learnedListeners.forEach((fn) => fn());
}

interface SwipeSecondaryAction {
  label: string;
  ariaLabel: string;
  onAction: () => void;
}

export interface SwipeToRevealProps {
  children: React.ReactNode;
  actionLabel: string;
  actionAriaLabel: string;
  onAction: () => void;
  /** Neutral button revealed to the left of the crimson action (e.g. Edit). */
  secondaryAction?: SwipeSecondaryAction;
  /** Slides the row open to show its actions, then back, until the member has swiped a few times. */
  hint?: boolean;
  className?: string;
  contentClassName?: string;
}

export const SwipeToReveal: React.FC<SwipeToRevealProps> = ({
  children,
  actionLabel,
  actionAriaLabel,
  onAction,
  secondaryAction,
  hint = false,
  className = '',
  contentClassName = '',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; base: number; axis: 'x' | 'y' | null; id: number } | null>(null);
  const swallowClick = useRef(false);
  const nudgedOnce = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  const [peekHint, setPeekHint] = useState(() => hint && swipeCount() < LEARN_AFTER);

  const revealWidth = () => (actionRef.current?.offsetWidth ?? 72) + 8;

  const close = useCallback(() => {
    setOpen(false);
    setOffset(0);
  }, []);

  const openRow = useCallback(() => {
    if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
    closeOpenRow = close;
    setOpen(true);
    setOffset(-revealWidth());
  }, [close]);

  useEffect(() => {
    if (!open) {
      if (closeOpenRow === close) closeOpenRow = null;
      return;
    }
    const onOutside = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onOutside, true);
    return () => document.removeEventListener('pointerdown', onOutside, true);
  }, [open, close]);

  useEffect(() => () => {
    if (closeOpenRow === close) closeOpenRow = null;
  }, [close]);

  useEffect(() => {
    if (!hint || !peekHint || nudgedOnce.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const onLearned = () => setPeekHint(false);
    learnedListeners.add(onLearned);
    const timers: number[] = [];
    const busy = () => {
      const root = rootRef.current;
      return !root || gesture.current !== null || root.contains(document.activeElement) || closeOpenRow !== null;
    };
    timers.push(
      window.setTimeout(() => {
        if (busy()) return;
        nudgedOnce.current = true;
        setOffset((v) => (v === 0 ? -PEEK_PX : v));
        timers.push(window.setTimeout(() => setOffset((v) => (v === -PEEK_PX ? 0 : v)), PEEK_HOLD_MS));
      }, PEEK_FIRST_MS),
    );
    return () => {
      learnedListeners.delete(onLearned);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [hint, peekHint]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, base: open ? -revealWidth() : 0, axis: null, id: e.pointerId };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (g.axis !== 'x') return;
    const width = revealWidth();
    setOffset(Math.min(0, Math.max(-width * 1.25, g.base + dx)));
  };

  const endGesture = (e: React.PointerEvent, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (g.axis !== 'x') return;
    setDragging(false);
    swallowClick.current = true;
    window.setTimeout(() => {
      swallowClick.current = false;
    }, 0);
    const width = revealWidth();
    const shouldOpen = !cancelled && g.base + (e.clientX - g.x) < -width / 2;
    if (shouldOpen) {
      if (!open) {
        tactileEngine.triggerSelectionBuzz();
        recordSwipe();
      }
      openRow();
    } else {
      close();
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (swallowClick.current || open) {
      e.preventDefault();
      e.stopPropagation();
      if (open && !swallowClick.current) close();
    }
  };

  const actionVisible = offset < 0 || open;

  return (
    <div ref={rootRef} className={`relative overflow-hidden ${className}`}>
      <div ref={actionRef} className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-1">
        {secondaryAction && (
          <button
            type="button"
            onFocus={() => !open && openRow()}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              close();
              secondaryAction.onAction();
            }}
            aria-label={secondaryAction.ariaLabel}
            className={`h-9 px-3.5 rounded-full bg-o1-sheet border border-white/[0.14] hover:border-white/25 text-[12px] text-o1-text cursor-pointer transition-opacity ${
              actionVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          type="button"
          onFocus={() => !open && openRow()}
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            close();
            onAction();
          }}
          aria-label={actionAriaLabel}
          tabIndex={0}
          className={`h-9 px-3.5 max-w-[60vw] truncate rounded-full bg-[#C4121A] hover:bg-[#A30F16] active:bg-[#800C11] text-[12px] text-white cursor-pointer transition-opacity ${
            actionVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {actionLabel}
        </button>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endGesture(e, false)}
        onPointerCancel={(e) => endGesture(e, true)}
        onClickCapture={onClickCapture}
        style={{
          transform: `translate3d(${offset}px,0,0)`,
          transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          touchAction: 'pan-y',
        }}
        className={`relative ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
};


