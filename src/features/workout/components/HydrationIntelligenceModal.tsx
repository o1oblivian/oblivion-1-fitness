import React, { useState } from 'react';
import { X, Droplets, Plus, RotateCcw, ArrowRight, Sparkles, Waves } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface HydrationIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLiters: number;
  onAddLiters: (amount: number) => void;
  onResetLiters?: () => void;
  onShowToast?: (msg: string) => void;
}

export const HydrationIntelligenceModal: React.FC<HydrationIntelligenceModalProps> = ({
  isOpen,
  onClose,
  currentLiters,
  onAddLiters,
  onResetLiters,
  onShowToast,
}) => {
  const [beverageType, setBeverageType] = useState<'water' | 'electrolytes' | 'coffee'>('water');
  if (!isOpen) return null;

  const targetLiters = 3.0;
  const pct = Math.min(100, Math.round((currentLiters / targetLiters) * 100));

  const fastLogs = [
    { label: '250mL Glass', volume: 0.25, icon: '🥛' },
    { label: '500mL Shaker', volume: 0.5, icon: '🍶' },
    { label: '750mL Hydro Flask', volume: 0.75, icon: '🧊' },
    { label: '1.0L Tactical Chug', volume: 1.0, icon: '💧' },
  ];

  const getMultiplier = () => {
    switch (beverageType) {
      case 'electrolytes':
        return 1.2;
      case 'coffee':
        return 0.2;
      default:
        return 1.0;
    }
  };

  const handleLog = (volume: number, label: string) => {
    tactileEngine.triggerSelectionBuzz();
    const mult = getMultiplier();
    const effective = Number((volume * mult).toFixed(2));
    onAddLiters(effective);
    onShowToast?.(`Logged ${label} (+${(effective * 1000).toFixed(0)}mL net hydration)`);
  };

  const handleReset = () => {
    tactileEngine.triggerSelectionBuzz();
    if (onResetLiters) onResetLiters();
    onShowToast?.('Hydration reservoir reset to 0.0L');
  };

  const hydrationStateLabel =
    pct >= 100
      ? 'PEAK CELLULAR HYDRATION'
      : pct >= 66
      ? 'OPTIMAL INTRA-CELLULAR EQUILIBRIUM'
      : pct >= 33
      ? 'MODERATE OSMOTIC RESERVE'
      : 'DEHYDRATION DEFICIT';

  const hydrationStateColor =
    pct >= 100
      ? 'text-emerald-400'
      : pct >= 66
      ? 'text-[#38bdf8]'
      : pct >= 33
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div
      id="hydration-intelligence-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60000] bg-black/80 flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#09090b] text-white w-full max-w-md rounded-t-3xl md:rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl p-5 space-y-4 max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tactical font-bold text-sm tracking-wider uppercase text-white">
                  Hydration Intelligence
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-cyan-400">
                  OSMOTIC
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">Cellular Fluid Retention &amp; Electrolytes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Graduated Fluid Reservoir & Osmotic HUD (Zero Dark Fog) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                OSMOTIC FLUID EQUILIBRIUM
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-black text-white tracking-tight">
                  {currentLiters.toFixed(2)}
                </span>
                <span className="text-sm font-mono text-neutral-400">/ {targetLiters.toFixed(2)} L</span>
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${hydrationStateColor}`}>
                {hydrationStateLabel}
              </span>
            </div>

            {/* Percentage Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-right">
              <span className="text-lg font-mono font-black text-cyan-400 leading-none block">{pct}%</span>
              <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">TARGET</span>
            </div>
          </div>

          {/* Graduated Fluid Level Bar with Tick Marks */}
          <div className="space-y-1.5 pt-1">
            <div className="relative w-full h-4 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500 relative"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-neutral-500 px-0.5">
              <span>0.0L Baseline</span>
              <span>1.5L Halfway</span>
              <span>3.0L Target</span>
            </div>
          </div>
        </div>

        {/* Beverage Coefficient Segment Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            <span>Beverage Hydration Coefficient</span>
            <span className="text-cyan-400 font-mono">
              Factor: {getMultiplier()}x
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10">
            {(
              [
                { id: 'water', label: 'Pure Water', mult: '100%' },
                { id: 'electrolytes', label: 'Electrolytes', mult: '+120%' },
                { id: 'coffee', label: 'Coffee / Tea', mult: '20%' },
              ] as const
            ).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setBeverageType(b.id);
                }}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  beverageType === b.id
                    ? 'bg-white/10 text-cyan-400 border border-cyan-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-mono font-bold block">{b.label}</span>
                <span className="text-[9px] font-mono opacity-70 block">{b.mult}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1-Tap Fast Dispenser Tiles */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Tactile Volume Dispenser
          </span>
          <div className="grid grid-cols-2 gap-2">
            {fastLogs.map((item) => {
              const effectiveMl = Math.round(item.volume * getMultiplier() * 1000);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleLog(item.volume, item.label)}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-500/40 text-left active:scale-[0.98] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{item.icon}</span>
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono font-bold text-white block">{item.label}</span>
                    <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                      +{effectiveMl}mL effective
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-xs font-mono font-bold text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
              onShowToast?.(`Hydration updated: ${currentLiters.toFixed(2)}L logged.`);
            }}
            className="flex-2 py-2.5 px-5 rounded-xl bg-[#C4121A] hover:bg-[#a30f16] active:bg-[#800C11] text-white text-xs font-tactical font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span>CONFIRM ({pct}%)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HydrationIntelligenceModal;
