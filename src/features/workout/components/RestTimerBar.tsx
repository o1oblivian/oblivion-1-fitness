import React, { useEffect, useRef, useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useRestTimerStore } from '../store/useRestTimerStore';

const WARN_SECONDS = 10;

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const RestTimerBar: React.FC = () => {
  const timer = useRestTimerStore((s) => s.timer);
  const extend = useRestTimerStore((s) => s.extend);
  const skip = useRestTimerStore((s) => s.skip);
  const [now, setNow] = useState(() => Date.now());
  const warnedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer]);

  const remaining = timer ? (timer.endsAt - now) / 1000 : 0;

  useEffect(() => {
    if (!timer) return;
    if (remaining <= 0) {
      // Coming back long after the rest ended shouldn't chime out of nowhere.
      if (remaining > -5) tactileEngine.playTimerChime();
      skip();
      return;
    }
    if (remaining <= WARN_SECONDS && warnedFor.current !== timer.endsAt) {
      warnedFor.current = timer.endsAt;
      tactileEngine.triggerSelectionBuzz();
    }
  }, [remaining, timer, skip]);

  if (!timer || remaining <= 0) return null;

  const progress = Math.min(1, Math.max(0, 1 - remaining / timer.durationSec));
  const warning = remaining <= WARN_SECONDS;

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Rest ${clock(remaining)} remaining after ${timer.exerciseName}`}
      className="fixed inset-x-0 mx-auto w-[calc(100%-1.5rem)] max-w-[440px] z-40 rounded-2xl border border-white/[0.07] bg-o1-sheet/95 backdrop-blur-xl overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.6)]"
      style={{ bottom: 'calc(max(16px, env(safe-area-inset-bottom, 0px)) + 56px)' }}
    >
      <div className="flex items-center gap-3 pl-4 pr-1.5 h-12">
        <span className={`font-mono font-light text-[22px] tabular-nums leading-none ${warning ? 'text-[#C4121A]' : 'text-o1-text'}`}>
          {clock(remaining)}
        </span>
        <span className="flex-1 min-w-0 text-[11px] text-o1-muted truncate">Rest · {timer.exerciseName}</span>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            extend(30);
          }}
          className="h-9 px-3 rounded-xl text-[12px] text-o1-text border border-white/[0.07] hover:border-white/[0.14] active:scale-[0.97] transition cursor-pointer"
        >
          +30s
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            skip();
          }}
          className="h-9 px-3 rounded-xl text-[12px] text-o1-muted hover:text-o1-text active:scale-[0.97] transition cursor-pointer"
        >
          Skip
        </button>
      </div>
      <div className="h-[2px] bg-white/[0.06]" aria-hidden>
        <div className="h-full bg-[#C4121A] transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
};

export default RestTimerBar;
