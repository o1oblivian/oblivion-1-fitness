import React from 'react';
import { X, Heart, Activity, Moon, Zap, ShieldCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  score?: number;
}

export const ReadinessTelemetryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  score = 82,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-4 shadow-xl text-white space-y-3 overflow-y-auto relative"
      >
        {/* Specular hairline highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Heart className="w-4 h-4 fill-sky-500/20" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold block">
                BIOMETRIC TELEMETRY
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">Neuromuscular Readiness</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Hero Banner */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              Readiness Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-mono font-black text-sky-400">{score}%</span>
              <span className="text-xs font-semibold text-neutral-200">Optimal Neuromuscular State</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* 4 Biometric Metric Tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* HRV */}
          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase font-bold">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>HRV (Variability)</span>
            </div>
            <div className="text-base font-mono font-bold text-white">74 ms</div>
            <div className="text-[10px] font-mono text-sky-400">+6 ms above 7d baseline</div>
          </div>

          {/* RHR */}
          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase font-bold">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>Resting Heart Rate</span>
            </div>
            <div className="text-base font-mono font-bold text-white">48 bpm</div>
            <div className="text-[10px] font-mono text-sky-400">Optimal recovery</div>
          </div>

          {/* Sleep Architecture */}
          <div className="col-span-2 p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase font-bold">
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Sleep Architecture</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">7h 42m</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300 pt-0.5">
              <span>Deep: <strong className="text-white">1h 55m</strong></span>
              <span>REM: <strong className="text-white">2h 10m</strong></span>
              <span className="text-sky-400">94% Efficiency</span>
            </div>
          </div>

          {/* CNS Strain */}
          <div className="col-span-2 p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">CNS Strain Index</span>
                <span className="text-xs font-mono text-white font-bold">Low (1.4 / 5.0)</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono text-sky-400 font-bold uppercase">
              Primed
            </span>
          </div>
        </div>

        {/* Training Recommendation */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border-l-2 border-sky-400 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
            Intelligence Prescription
          </span>
          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
            "Cardiovascular and muscular systems are fully primed for high mechanical tension compound pressing."
          </p>
        </div>

        {/* Bottom Dismiss Button */}
        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/[0.07] text-white text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition cursor-pointer"
        >
          Acknowledge Readiness
        </button>
      </div>
    </div>
  );
};

export default ReadinessTelemetryModal;
