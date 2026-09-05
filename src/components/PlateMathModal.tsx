import React, { useState, useMemo } from 'react';
import { X, Check, RotateCcw, Plus, Minus, ArrowRight, Shield } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { playDigitalCrownClick } from '../utils/audio';
import { useModalBackHandler } from '../utils/modalHistory';

interface PlateConfig {
  weight: number;
  label: string;
  color: string;
  borderColor: string;
  textColor: string;
  heightClass: string; // visual relative height
  widthClass: string;
}

export const OLYMPIC_PLATES_KG: PlateConfig[] = [
  {
    weight: 25,
    label: '25kg',
    color: 'bg-[#C53030] dark:bg-[#E53E3E]',
    borderColor: 'border-[#9B2C2C] dark:border-[#FEB2B2]',
    textColor: 'text-white',
    heightClass: 'h-28',
    widthClass: 'w-4.5',
  },
  {
    weight: 20,
    label: '20kg',
    color: 'bg-[#2B6CB0] dark:bg-[#3182CE]',
    borderColor: 'border-[#2C5282] dark:border-[#BEE3F8]',
    textColor: 'text-white',
    heightClass: 'h-28',
    widthClass: 'w-4',
  },
  {
    weight: 15,
    label: '15kg',
    color: 'bg-[#D69E2E] dark:bg-[#ECC94B]',
    borderColor: 'border-[#B7791F] dark:border-[#FEFCBF]',
    textColor: 'text-zinc-900',
    heightClass: 'h-24',
    widthClass: 'w-3.5',
  },
  {
    weight: 10,
    label: '10kg',
    color: 'bg-[#38A169] dark:bg-[#48BB78]',
    borderColor: 'border-[#276749] dark:border-[#C6F6D5]',
    textColor: 'text-white',
    heightClass: 'h-20',
    widthClass: 'w-3',
  },
  {
    weight: 5,
    label: '5kg',
    color: 'bg-zinc-200 dark:bg-stone-300',
    borderColor: 'border-stone-400 dark:border-stone-400',
    textColor: 'text-zinc-900',
    heightClass: 'h-16',
    widthClass: 'w-2.5',
  },
  {
    weight: 2.5,
    label: '2.5kg',
    color: 'bg-[#9B2C2C] dark:bg-[#C53030]',
    borderColor: 'border-stone-800 dark:border-white/40',
    textColor: 'text-white',
    heightClass: 'h-13',
    widthClass: 'w-2',
  },
  {
    weight: 1.25,
    label: '1.25kg',
    color: 'bg-stone-400 dark:bg-zinc-500',
    borderColor: 'border-stone-600 dark:border-zinc-300',
    textColor: 'text-white',
    heightClass: 'h-10',
    widthClass: 'w-1.5',
  },
  {
    weight: 0.5,
    label: '0.5kg',
    color: 'bg-stone-700 dark:bg-stone-600',
    borderColor: 'border-stone-900 dark:border-white/20',
    textColor: 'text-white',
    heightClass: 'h-8',
    widthClass: 'w-1',
  },
];

export const OLYMPIC_PLATES_LBS: PlateConfig[] = [
  {
    weight: 45,
    label: '45lb',
    color: 'bg-[#2B6CB0] dark:bg-[#3182CE]',
    borderColor: 'border-[#2C5282] dark:border-[#BEE3F8]',
    textColor: 'text-white',
    heightClass: 'h-28',
    widthClass: 'w-4.5',
  },
  {
    weight: 35,
    label: '35lb',
    color: 'bg-[#D69E2E] dark:bg-[#ECC94B]',
    borderColor: 'border-[#B7791F] dark:border-[#FEFCBF]',
    textColor: 'text-zinc-900',
    heightClass: 'h-24',
    widthClass: 'w-4',
  },
  {
    weight: 25,
    label: '25lb',
    color: 'bg-[#38A169] dark:bg-[#48BB78]',
    borderColor: 'border-[#276749] dark:border-[#C6F6D5]',
    textColor: 'text-white',
    heightClass: 'h-20',
    widthClass: 'w-3.5',
  },
  {
    weight: 10,
    label: '10lb',
    color: 'bg-stone-800 dark:bg-stone-700',
    borderColor: 'border-stone-900 dark:border-white/20',
    textColor: 'text-white',
    heightClass: 'h-16',
    widthClass: 'w-2.5',
  },
  {
    weight: 5,
    label: '5lb',
    color: 'bg-zinc-300 dark:bg-stone-400',
    borderColor: 'border-stone-400 dark:border-stone-500',
    textColor: 'text-zinc-900',
    heightClass: 'h-13',
    widthClass: 'w-2',
  },
  {
    weight: 2.5,
    label: '2.5lb',
    color: 'bg-stone-500 dark:bg-stone-600',
    borderColor: 'border-stone-600 dark:border-white/20',
    textColor: 'text-white',
    heightClass: 'h-10',
    widthClass: 'w-1.5',
  },
];

export const OLYMPIC_PLATES = OLYMPIC_PLATES_KG;

export const BAR_WEIGHTS_KG = [
  { label: '20kg (Olympic)', weight: 20 },
  { label: '15kg (Women\'s)', weight: 15 },
  { label: '10kg (Junior)', weight: 10 },
  { label: '0kg (Machine)', weight: 0 },
];

export const BAR_WEIGHTS_LBS = [
  { label: '45lb (Olympic)', weight: 45 },
  { label: '35lb (Women\'s)', weight: 35 },
  { label: '55lb (Trap/SSB)', weight: 55 },
  { label: '25lb (Junior)', weight: 25 },
  { label: '0lb (Machine)', weight: 0 },
];

export const BAR_WEIGHTS = BAR_WEIGHTS_KG;

interface PlateMathModalProps {
  isOpen: boolean;
  initialWeight: number;
  exerciseName?: string;
  onApplyWeight: (weight: number) => void;
  onClose: () => void;
}

export const PlateMathModal: React.FC<PlateMathModalProps> = ({
  isOpen,
  initialWeight,
  exerciseName,
  onApplyWeight,
  onClose,
}) => {
  const [unit, setUnit] = useState<'kg' | 'lbs'>(() => {
    try {
      const stored = localStorage.getItem('o1fc_weight_unit');
      if (stored === 'lbs' || stored === 'kg') return stored;
    } catch {}
    return 'kg';
  });

  const activePlates = useMemo(() => (unit === 'lbs' ? OLYMPIC_PLATES_LBS : OLYMPIC_PLATES_KG), [unit]);
  const activeBars = useMemo(() => (unit === 'lbs' ? BAR_WEIGHTS_LBS : BAR_WEIGHTS_KG), [unit]);

  const [barWeight, setBarWeight] = useState<number>(() => (unit === 'lbs' ? 45 : 20));
  const [targetWeight, setTargetWeight] = useState<number>(() => Math.max(0, initialWeight || (unit === 'lbs' ? 135 : 60)));

  // Toggle unit handler
  const handleToggleUnit = (newUnit: 'kg' | 'lbs') => {
    if (newUnit === unit) return;
    haptic.tap();
    playDigitalCrownClick(1.0);
    setUnit(newUnit);
    try {
      localStorage.setItem('o1fc_weight_unit', newUnit);
    } catch {}

    if (newUnit === 'lbs') {
      const converted = Math.round((targetWeight * 2.20462) / 5) * 5;
      setBarWeight(45);
      setTargetWeight(Math.max(45, converted || 135));
    } else {
      const converted = Math.round((targetWeight / 2.20462) / 2.5) * 2.5;
      setBarWeight(20);
      setTargetWeight(Math.max(20, converted || 60));
    }
  };

  // Sync initial weight when opened
  React.useEffect(() => {
    if (isOpen) {
      const def = unit === 'lbs' ? 135 : 60;
      setTargetWeight(Math.max(0, initialWeight || def));
      setBarWeight(unit === 'lbs' ? 45 : 20);
    }
  }, [isOpen, initialWeight, unit]);

  // Compute plates per side
  const calculation = useMemo(() => {
    const total = Math.max(0, targetWeight);
    const weightToLoad = Math.max(0, total - barWeight);
    const perSide = weightToLoad / 2;

    let remaining = perSide;
    const platesPerSide: { plate: PlateConfig; count: number }[] = [];

    activePlates.forEach((plate) => {
      if (remaining >= plate.weight - 0.001) {
        const count = Math.floor(remaining / plate.weight);
        if (count > 0) {
          platesPerSide.push({ plate, count });
          remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
        }
      }
    });

    const totalLoadedPerSide = perSide - remaining;
    const totalActualLoad = barWeight + totalLoadedPerSide * 2;

    return {
      weightToLoad,
      perSide,
      platesPerSide,
      remainingPerSide: remaining,
      totalActualLoad,
    };
  }, [targetWeight, barWeight, activePlates]);

  useModalBackHandler(isOpen, onClose, 'plate_math_modal');

  if (!isOpen) return null;

  const stepSize = unit === 'lbs' ? 5 : 2.5;

  const handleAddWeight = (delta: number) => {
    haptic.tap();
    playDigitalCrownClick(delta > 0 ? 1.1 : 0.9);
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + delta) * 100) / 100));
  };

  const handleAddPlatePerSide = (plateWeight: number) => {
    haptic.tap();
    playDigitalCrownClick(1.05);
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + plateWeight * 2) * 100) / 100));
  };

  const handleRemovePlatePerSide = (plateWeight: number) => {
    haptic.tap();
    playDigitalCrownClick(0.95);
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev - plateWeight * 2) * 100) / 100));
  };

  const handleConfirm = () => {
    haptic.thump();
    onApplyWeight(targetWeight);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-[#13161A] rounded-2xl border border-[#EAE8E3] dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#EAE8E3] dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02]">
          <div>
            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Plate Math Visualizer</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-600/10 text-red-600 dark:text-red-400 font-bold">
                Olympic
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-stone-400 truncate">
              {exerciseName || 'Barbell Plate Breakdown'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Toggle KG / LBS */}
            <div className="flex items-center bg-zinc-200/80 dark:bg-white/10 p-0.5 rounded-lg border border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleToggleUnit('kg')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                  unit === 'kg'
                    ? 'bg-white dark:bg-stone-800 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-stone-400 hover:text-zinc-900'
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => handleToggleUnit('lbs')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                  unit === 'lbs'
                    ? 'bg-white dark:bg-stone-800 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-stone-400 hover:text-zinc-900'
                }`}
              >
                LBS
              </button>
            </div>

            <button
              onClick={() => {
                haptic.tap();
                onClose();
              }}
              className="btn-nude-close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar">
          {/* Target Load Display & Bar Selector */}
          <div className="bg-zinc-50 dark:bg-white/[0.03] border border-[#EAE8E3] dark:border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-stone-400">
                Total Target Weight
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddWeight(-stepSize)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-stone-300 active:scale-90 transition-transform cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 py-1 bg-white dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 rounded-lg text-[18px] font-mono font-extrabold text-stone-950 dark:text-white">
                  {targetWeight} <span className="text-[12px] font-sans font-normal text-stone-400">{unit}</span>
                </div>
                <button
                  onClick={() => handleAddWeight(stepSize)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-stone-300 active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barbell Selection Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase shrink-0">Bar:</span>
              {activeBars.map((b) => (
                <button
                  key={b.label}
                  onClick={() => {
                    haptic.tap();
                    setBarWeight(b.weight);
                  }}
                  className={`h-6.5 px-2.5 rounded-md text-[10.5px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                    barWeight === b.weight
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-2xs'
                      : 'bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-stone-400 hover:bg-zinc-100'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barbell Visualizer Sleeve */}
          <div className="bg-stone-950 dark:bg-black/80 rounded-xl p-4 border border-stone-800 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
            <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest absolute top-2.5 left-3">
              Barbell Sleeve (Per Side: <span className="text-white font-bold">{calculation.perSide}{unit}</span>)
            </div>

            {/* Visual Barbell Graphic */}
            <div className="w-full flex items-center justify-center mt-4">
              <div className="relative flex items-center">
                {/* Inside Collar */}
                <div className="w-4 h-16 bg-stone-700 border-r-2 border-stone-900 rounded-l-xs shadow-md z-10 flex items-center justify-center">
                  <div className="w-1.5 h-8 bg-stone-800 rounded-xs" />
                </div>

                {/* Plates Loaded Stack */}
                <div className="flex items-center gap-0.5 bg-stone-800/40 px-1 py-4 border-y-2 border-stone-700 min-w-[140px] max-w-[220px] overflow-x-auto">
                  {calculation.platesPerSide.length === 0 ? (
                    <span className="text-[11px] font-mono text-zinc-500 px-2 italic">
                      Empty Bar (0{unit} on sleeve)
                    </span>
                  ) : (
                    calculation.platesPerSide.flatMap(({ plate, count }, pIdx) =>
                      Array.from({ length: count }).map((_, cIdx) => (
                        <div
                          key={`${pIdx}-${cIdx}`}
                          className={`${plate.color} ${plate.borderColor} ${plate.heightClass} ${plate.widthClass} rounded-xs border shadow-sm flex flex-col items-center justify-center relative shrink-0 transition-all hover:scale-105`}
                          title={`${plate.label} (${count} loaded)`}
                        >
                          <span className={`text-[7px] font-black font-mono rotate-90 ${plate.textColor} whitespace-nowrap`}>
                            {plate.weight}
                          </span>
                        </div>
                      ))
                    )
                  )}
                </div>

                {/* Outer Collar & Bar Tip */}
                <div className="w-3 h-8 bg-stone-600 border border-stone-800 rounded-r-xs shadow-xs" />
                <div className="w-6 h-3 bg-zinc-500 rounded-r-sm" />
              </div>
            </div>

            {/* Quick summary line */}
            <div className="text-[11px] font-mono text-stone-300 mt-3 text-center">
              {calculation.platesPerSide.length > 0 ? (
                <span>
                  Load per side:{' '}
                  {calculation.platesPerSide
                    .map((p) => `${p.count}×${p.plate.label}`)
                    .join(' + ')}
                </span>
              ) : (
                <span>Unloaded Barbell ({barWeight}{unit})</span>
              )}
              {calculation.remainingPerSide > 0 && (
                <span className="text-[#D4A24A] block text-[10px]">
                  * {calculation.remainingPerSide * 2}{unit} remainder not divisible by available plates
                </span>
              )}
            </div>
          </div>

          {/* Quick 1-Tap Plate Increment Palette */}
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-stone-400 mb-1.5 flex items-center justify-between">
              <span>Quick Plate Adjustments (+2 per side)</span>
              <span className="text-[10px] text-stone-400">1-Tap Load</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {activePlates.map((plate) => {
                const loadedCount =
                  calculation.platesPerSide.find((p) => p.plate.weight === plate.weight)?.count || 0;

                return (
                  <div
                    key={plate.weight}
                    className="flex flex-col items-center bg-zinc-50 dark:bg-white/[0.02] border border-[#EAE8E3] dark:border-white/10 rounded-xl p-1.5 shadow-2xs"
                  >
                    <span className="text-[11px] font-mono font-extrabold text-zinc-900 dark:text-white">
                      {plate.label}
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">
                      {loadedCount > 0 ? `${loadedCount} per side` : '0 loaded'}
                    </span>
                    <div className="flex items-center gap-1 mt-1 w-full">
                      <button
                        onClick={() => handleRemovePlatePerSide(plate.weight)}
                        disabled={loadedCount === 0}
                        className="flex-1 h-6 rounded bg-zinc-200/80 dark:bg-white/10 disabled:opacity-30 text-zinc-700 dark:text-stone-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAddPlatePerSide(plate.weight)}
                        className="flex-1 h-6 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Target Presets */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {(unit === 'lbs'
              ? [95, 135, 185, 225, 275, 315, 365, 405, 495]
              : [40, 60, 80, 100, 120, 140, 160, 180, 200]
            ).map((w) => (
              <button
                key={w}
                onClick={() => {
                  haptic.tap();
                  playDigitalCrownClick(1.0);
                  setTargetWeight(w);
                }}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                  targetWeight === w
                    ? 'bg-[#C4121A] dark:bg-[#D91F28] text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-stone-300 hover:bg-zinc-200'
                }`}
              >
                {w}{unit}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] border-t border-[#EAE8E3] dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] flex items-center gap-2">
          <button
            onClick={() => {
              haptic.tap();
              setTargetWeight(barWeight);
            }}
            className="h-10 px-3 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-stone-300 text-[12px] font-medium flex items-center gap-1.5 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleConfirm}
            className="flex-1 h-10 rounded-xl bg-[#C4121A] dark:bg-[#D91F28] hover:bg-[#B8121A] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply {targetWeight}{unit} to Set</span>
          </button>
        </div>
      </div>
    </div>
  );
};
