import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Check, ArrowRight, Dumbbell, Sparkles } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { SetData } from '../types';

interface WarmupLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  workingWeight: number;
  unit?: 'KG' | 'LBS';
  onApplyWarmupSets: (warmupSets: SetData[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

interface WarmupStep {
  stepNumber: number;
  percentage: number;
  reps: number;
  calculatedWeight: number;
  label: string;
  purpose: string;
  plateGuide: string;
}

export const WarmupLadderModal: React.FC<WarmupLadderModalProps> = ({
  isOpen,
  onClose,
  exerciseName,
  workingWeight: initialWorkingWeight,
  unit = 'KG',
  onApplyWarmupSets,
  showToast,
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWorkingWeight > 0 ? initialWorkingWeight : (unit === 'KG' ? 100 : 225));
  const [selectedUnit, setSelectedUnit] = useState<'KG' | 'LBS'>(unit);
  const [barWeight, setBarWeight] = useState<number>(selectedUnit === 'KG' ? 20 : 45);

  if (!isOpen) return null;

  // Round weight to nearest practical gym plate increment (2.5 kg or 5 lbs)
  const roundToIncrement = (val: number, isLbs: boolean) => {
    const inc = isLbs ? 5 : 2.5;
    return Math.max(barWeight, Math.round(val / inc) * inc);
  };

  const calculatePlateGuide = (totalWeight: number) => {
    if (totalWeight <= barWeight) return 'Bar only';
    const sideWeight = (totalWeight - barWeight) / 2;
    if (sideWeight <= 0) return 'Bar only';

    const plates = selectedUnit === 'KG'
      ? [25, 20, 15, 10, 5, 2.5, 1.25]
      : [45, 35, 25, 10, 5, 2.5];

    let rem = sideWeight;
    const parts: string[] = [];

    for (const p of plates) {
      const count = Math.floor(rem / p);
      if (count > 0) {
        parts.push(count > 1 ? `${count}x${p}` : `${p}`);
        rem -= count * p;
      }
    }

    return parts.length > 0 ? `${parts.join('+')} / side` : 'Bar only';
  };

  // Scientific 4-Stage Protocol
  const steps: WarmupStep[] = [
    {
      stepNumber: 1,
      percentage: 0,
      reps: 10,
      calculatedWeight: barWeight,
      label: 'Stage 1: Movement Groove',
      purpose: 'Synovial joint fluid & pattern rehearsal',
      plateGuide: 'Empty Barbell',
    },
    {
      stepNumber: 2,
      percentage: 50,
      reps: 5,
      calculatedWeight: roundToIncrement(targetWeight * 0.5, selectedUnit === 'LBS'),
      label: 'Stage 2: Submaximal Power',
      purpose: 'Motor unit recruitment at max velocity',
      plateGuide: calculatePlateGuide(roundToIncrement(targetWeight * 0.5, selectedUnit === 'LBS')),
    },
    {
      stepNumber: 3,
      percentage: 70,
      reps: 3,
      calculatedWeight: roundToIncrement(targetWeight * 0.7, selectedUnit === 'LBS'),
      label: 'Stage 3: Neural Potentiation',
      purpose: 'Bar speed potentiation & tension groove',
      plateGuide: calculatePlateGuide(roundToIncrement(targetWeight * 0.7, selectedUnit === 'LBS')),
    },
    {
      stepNumber: 4,
      percentage: 85,
      reps: 1,
      calculatedWeight: roundToIncrement(targetWeight * 0.85, selectedUnit === 'LBS'),
      label: 'Stage 4: CNS Primer',
      purpose: 'Sensory accommodation without lactate build-up',
      plateGuide: calculatePlateGuide(roundToIncrement(targetWeight * 0.85, selectedUnit === 'LBS')),
    },
  ];

  const handleApply = () => {
    haptic.pulse();
    const newSets: SetData[] = steps.map((s, idx) => ({
      id: `warmup_${Date.now()}_${idx}`,
      weight: s.calculatedWeight,
      reps: s.reps,
      rpe: 5 + idx,
      isWarmup: true,
    }));

    onApplyWarmupSets(newSets);
    showToast?.(`Loaded ${newSets.length} scientific warm-up sets for ${exerciseName}`, 'success');
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white tracking-wide truncate">
                Scientific Warm-Up Ladder
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono truncate">{exerciseName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Working Set Weight Selector & Unit Switch */}
        <div className="p-4 border-b border-white/5 bg-zinc-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Target Working Load
            </span>
            <div className="flex items-center rounded-lg bg-white/5 p-0.5 border border-white/10">
              {(['KG', 'LBS'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    setSelectedUnit(u);
                    setBarWeight(u === 'KG' ? 20 : 45);
                    haptic.tap();
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-colors cursor-pointer ${
                    selectedUnit === u ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Math.max(barWeight, Number(e.target.value) || 0))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white text-center font-bold focus:outline-none focus:border-amber-500/50"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-zinc-500">{selectedUnit}</span>
            </div>

            {/* Quick adjust presets */}
            <div className="flex items-center gap-1">
              {[-10, -5, +5, +10].map((delta) => (
                <button
                  key={delta}
                  onClick={() => {
                    setTargetWeight((prev) => Math.max(barWeight, prev + delta));
                    haptic.tap();
                  }}
                  className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-300 border border-white/5 transition-colors cursor-pointer"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Stage Warm-Up Ladder Breakdown */}
        <div className="p-3.5 space-y-2 overflow-y-auto max-h-72">
          {steps.map((step) => (
            <div
              key={step.stepNumber}
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  W{step.stepNumber}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white font-mono">
                      {step.calculatedWeight} {selectedUnit} × {step.reps}
                    </span>
                    {step.percentage > 0 && (
                      <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-zinc-400">
                        {step.percentage}%
                      </span>
                    )}
                  </div>
                  <p className="text-[9.5px] text-zinc-400 truncate">{step.purpose}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[9px] font-mono text-amber-400/90 block">
                  {step.plateGuide}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-white/10 bg-zinc-900/80 flex items-center justify-between gap-2">
          <div className="text-[10px] font-mono text-zinc-400">
            Inserts 4 sets into queue (tagged W1–W4)
          </div>

          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Insert Protocol</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
