import React, { useState, useEffect } from 'react';
import { Zap, Coffee, Sparkles, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface MicronutrientMatrixProps {
  currentUserEmail?: string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

interface ErgogenicsState {
  sodiumMg: number;
  caffeineMg: number;
  creatineG: number;
  date: string;
}

const STORAGE_PREFIX = 'o1fc_ergogenics_';
const TODAY = () => new Date().toISOString().slice(0, 10);

const TARGETS = {
  sodiumMg: 2400,
  caffeineMg: 350,
  creatineG: 5.0,
};

export const MicronutrientMatrix: React.FC<MicronutrientMatrixProps> = ({
  currentUserEmail = 'athlete@ofc.app',
  showToast,
}) => {
  const email = (currentUserEmail || 'athlete@ofc.app').toLowerCase();
  const storageKey = `${STORAGE_PREFIX}${email}`;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('o1fc_supplements_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    triggerHaptic('light');
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('o1fc_supplements_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const [state, setState] = useState<ErgogenicsState>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === TODAY()) {
          return {
            sodiumMg: parsed.sodiumMg || 0,
            caffeineMg: parsed.caffeineMg || 0,
            creatineG: parsed.creatineG || 0,
            date: parsed.date,
          };
        }
      }
    } catch {}
    return {
      sodiumMg: 0,
      caffeineMg: 0,
      creatineG: 0,
      date: TODAY(),
    };
  });

  const save = (updated: Partial<ErgogenicsState>) => {
    setState((prev) => {
      const next: ErgogenicsState = { ...prev, ...updated, date: TODAY() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addSodium = (amount: number) => {
    triggerHaptic('light');
    save({ sodiumMg: Math.max(0, state.sodiumMg + amount) });
    showToast?.(`Sodium: ${state.sodiumMg + amount}mg / ${TARGETS.sodiumMg}mg`, 'success');
  };

  const addCaffeine = (amount: number) => {
    triggerHaptic('light');
    save({ caffeineMg: Math.max(0, state.caffeineMg + amount) });
    showToast?.(`Caffeine: ${state.caffeineMg + amount}mg / ${TARGETS.caffeineMg}mg`, 'success');
  };

  const addCreatine = (amountG: number) => {
    triggerHaptic('light');
    const newG = Math.round((state.creatineG + amountG) * 10) / 10;
    save({ creatineG: Math.max(0, newG) });
    showToast?.(`Creatine: ${newG}g / ${TARGETS.creatineG}g saturated`, 'success');
  };

  const handleReset = () => {
    triggerHaptic('medium');
    save({ sodiumMg: 0, caffeineMg: 0, creatineG: 0 });
    showToast?.('Supplements & micronutrient counters reset for today.', 'success');
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-neutral-200/90 dark:border-white/10 rounded-2xl p-4 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 text-left group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Electrolytes &amp; Supplements</span>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-stone-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors ml-0.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 dark:text-stone-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors ml-0.5" />
              )}
            </h3>
            <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400">
              Daily salt, caffeine, and creatine saturation
            </p>
          </div>
        </button>

        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          title="Reset daily counters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collapsible Content: 3 Micronutrient & Ergogenic Gauges */}
      {isExpanded && (
        <div className="grid grid-cols-3 gap-2.5 animate-fadeIn pt-0.5">
          {/* 1. Sodium */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                Sodium
              </span>
              <span className="text-[9px] font-mono text-neutral-400">
                {Math.min(100, Math.round((state.sodiumMg / TARGETS.sodiumMg) * 100))}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black font-mono text-neutral-900 dark:text-white">
                  {state.sodiumMg}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  / {TARGETS.sodiumMg}mg
                </span>
              </div>
              {/* Gauge bar */}
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (state.sodiumMg / TARGETS.sodiumMg) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-1 pt-1">
              <button
                onClick={() => addSodium(250)}
                className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              >
                +250
              </button>
              <button
                onClick={() => addSodium(500)}
                className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              >
                +500
              </button>
            </div>
          </div>

          {/* 2. Caffeine */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-1">
                <Coffee className="w-2.5 h-2.5 text-orange-500" />
                Caffeine
              </span>
              <span className="text-[9px] font-mono text-neutral-400">
                {Math.min(100, Math.round((state.caffeineMg / TARGETS.caffeineMg) * 100))}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black font-mono text-neutral-900 dark:text-white">
                  {state.caffeineMg}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  / {TARGETS.caffeineMg}mg
                </span>
              </div>
              {/* Gauge bar */}
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (state.caffeineMg / TARGETS.caffeineMg) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-1 pt-1">
              <button
                onClick={() => addCaffeine(50)}
                className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              >
                +50
              </button>
              <button
                onClick={() => addCaffeine(100)}
                className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              >
                +100
              </button>
            </div>
          </div>

          {/* 3. Creatine */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-red-500" />
                Creatine
              </span>
              <span className="text-[9px] font-mono text-neutral-400">
                {Math.min(100, Math.round((state.creatineG / TARGETS.creatineG) * 100))}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black font-mono text-neutral-900 dark:text-white">
                  {state.creatineG.toFixed(1)}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  / {TARGETS.creatineG}g
                </span>
              </div>
              {/* Gauge bar */}
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (state.creatineG / TARGETS.creatineG) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-1 pt-1">
              <button
                onClick={() => addCreatine(2.5)}
                className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              >
                +2.5g
              </button>
              <button
                onClick={() => addCreatine(5.0)}
                className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              >
                +5g
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
