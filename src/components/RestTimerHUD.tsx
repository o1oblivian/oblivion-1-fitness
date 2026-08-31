import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Plus, Pause, Play, SkipForward, X } from 'lucide-react';
import { formatDuration } from '@/hooks/useAppState';

interface Props {
  seconds: number;
  running: boolean;
  paused: boolean;
  onAdd30: () => void;
  onPauseResume: () => void;
  onSkip: () => void;
}

export function RestTimerHUD({ seconds, running, paused, onAdd30, onPauseResume, onSkip }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = running && seconds > 0;

  const progress = Math.min(1, 1 - seconds / 180);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-20 right-4 z-50 pb-[env(safe-area-inset-bottom,0px)]"
        >
          {/* Expanded popover */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 p-3 flex flex-col gap-2"
              >
                <button
                  onClick={() => { onAdd30(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/80 text-xs font-semibold hover:bg-white/[0.12] active:scale-[0.97] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+30 seconds</span>
                </button>
                <button
                  onClick={() => { onPauseResume(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/80 text-xs font-semibold hover:bg-white/[0.12] active:scale-[0.97] transition-all cursor-pointer"
                >
                  {paused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-sky-400" />}
                  <span>{paused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={() => { onSkip(); setExpanded(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Rest</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact pill */}
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setExpanded(e => !e)}
              className="relative overflow-hidden flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-full bg-black/85 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30 cursor-pointer hover:bg-black/90 active:scale-[0.96] transition-all"
            >
              {/* Progress ring background */}
              <div className="absolute bottom-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-300" style={{ width: `${progress * 100}%` }} />

              <div className="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <Timer className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-sm font-bold font-mono text-white tabular-nums">{formatDuration(seconds)}</span>
            </button>

            {/* Quick dismiss X */}
            <button
              onClick={() => { onSkip(); setExpanded(false); }}
              className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.15] active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
