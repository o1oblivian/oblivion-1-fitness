import React, { useState, useEffect } from 'react';
import { Pill, ChevronDown, Coffee, Sparkles, RotateCcw } from 'lucide-react';
import { SupplementTracker } from '../SupplementTracker';
import { triggerHaptic } from '../../utils/haptics';

interface SupplementsHubProps {
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

export const SupplementsHub: React.FC<SupplementsHubProps> = ({
  currentUserEmail = 'athlete@ofc.app',
  showToast,
}) => {
  const email = (currentUserEmail || 'athlete@ofc.app').toLowerCase();
  const storageKey = `${STORAGE_PREFIX}${email}`;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('o1fc_supplements_hub_expanded');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    triggerHaptic('light');
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('o1fc_supplements_hub_expanded', String(next));
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === TODAY()) {
          setState({
            sodiumMg: parsed.sodiumMg || 0,
            caffeineMg: parsed.caffeineMg || 0,
            creatineG: parsed.creatineG || 0,
            date: parsed.date,
          });
        }
      }
    } catch {}
  }, [storageKey]);

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

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    save({ sodiumMg: 0, caffeineMg: 0, creatineG: 0 });
    showToast?.('Daily electrolyte and supplement counters reset.', 'success');
  };

  return (
    <div className="w-full bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Unified Single Header */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer select-none text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
            <Pill className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Supplements &amp; Electrolytes
            </h2>
            <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              {isExpanded ? 'Daily intake checklist, salt, caffeine & creatine' : 'Tap to expand intake log & electrolyte levels'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isExpanded && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              title="Reset daily counters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expandable Unified Body */}
      {isExpanded && (
        <div className="px-3 pb-3.5 sm:px-4 sm:pb-4 space-y-4 border-t border-slate-100 dark:border-white/5 pt-3 animate-in fade-in duration-200">
          {/* Section 1: Quick Ergogenics & Electrolytes Gauges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Daily Electrolytes &amp; Gauges
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                Quick-add daily boosters
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* 1. Sodium */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                    Sodium
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {Math.min(100, Math.round((state.sodiumMg / TARGETS.sodiumMg) * 100))}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                      {state.sodiumMg}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      /{TARGETS.sodiumMg}mg
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (state.sodiumMg / TARGETS.sodiumMg) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => addSodium(250)}
                    className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                  >
                    +250
                  </button>
                  <button
                    type="button"
                    onClick={() => addSodium(500)}
                    className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                  >
                    +500
                  </button>
                </div>
              </div>

              {/* 2. Caffeine */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase flex items-center gap-1">
                    <Coffee className="w-2.5 h-2.5 text-orange-500" />
                    Caffeine
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {Math.min(100, Math.round((state.caffeineMg / TARGETS.caffeineMg) * 100))}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                      {state.caffeineMg}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      /{TARGETS.caffeineMg}mg
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (state.caffeineMg / TARGETS.caffeineMg) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => addCaffeine(50)}
                    className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => addCaffeine(100)}
                    className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                  >
                    +100
                  </button>
                </div>
              </div>

              {/* 3. Creatine */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-red-500" />
                    Creatine
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {Math.min(100, Math.round((state.creatineG / TARGETS.creatineG) * 100))}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                      {state.creatineG.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      /{TARGETS.creatineG}g
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (state.creatineG / TARGETS.creatineG) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => addCreatine(2.5)}
                    className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                  >
                    +2.5g
                  </button>
                  <button
                    type="button"
                    onClick={() => addCreatine(5.0)}
                    className="flex-1 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                  >
                    +5g
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/80 dark:border-white/10 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Supplement Intake Checklist
              </span>
            </div>
            <SupplementTracker showToast={showToast} currentUserEmail={currentUserEmail} />
          </div>
        </div>
      )}
    </div>
  );
};
