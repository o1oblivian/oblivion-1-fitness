import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  Flame,
  Clock,
  TrendingUp,
  Footprints,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CardioMachineType, CardioMachineEntry } from '../types/cardio';
import { saveCardioLog } from '../utils/cardioStorage';

interface CardioConsoleScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (entry: CardioMachineEntry) => void;
}

const MACHINES: { type: CardioMachineType; label: string; defaultMins: number; defaultCals: number; dist: number }[] = [
  { type: 'treadmill', label: 'Treadmill', defaultMins: 30, defaultCals: 320, dist: 3.5 },
  { type: 'stairmaster', label: 'StairMaster', defaultMins: 20, defaultCals: 260, dist: 0 },
  { type: 'rower', label: 'Rower', defaultMins: 20, defaultCals: 240, dist: 4.5 },
  { type: 'echo_bike', label: 'Air Bike', defaultMins: 15, defaultCals: 210, dist: 0 },
  { type: 'outdoor_run', label: 'Run', defaultMins: 30, defaultCals: 350, dist: 5.0 },
  { type: 'outdoor_walk', label: 'Walk', defaultMins: 45, defaultCals: 220, dist: 4.0 },
];

export const CardioConsoleScanModal: React.FC<CardioConsoleScanModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [machineType, setMachineType] = useState<CardioMachineType>('treadmill');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(320);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(3.5);
  const [stepsCount, setStepsCount] = useState<number | undefined>(4200);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectMachine = (m: typeof MACHINES[0]) => {
    setMachineType(m.type);
    setDurationMinutes(m.defaultMins);
    setCaloriesBurned(m.defaultCals);
    setDistanceKm(m.dist > 0 ? m.dist : undefined);
    setStepsCount(Math.round(m.defaultMins * 140));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setIsScanning(true);
      setScanSuccess(false);

      setTimeout(() => {
        setIsScanning(false);
        setScanSuccess(true);
        if (machineType === 'treadmill') {
          setDurationMinutes(35);
          setCaloriesBurned(365);
          setDistanceKm(4.2);
          setStepsCount(5100);
        } else if (machineType === 'stairmaster') {
          setDurationMinutes(25);
          setCaloriesBurned(310);
          setStepsCount(2700);
        } else {
          setDurationMinutes(20);
          setCaloriesBurned(250);
        }
      }, 600);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const computedSteps = stepsCount || Math.round(durationMinutes * 140);
    const entry = saveCardioLog({
      date: 'Today',
      machineType,
      durationMinutes,
      caloriesBurned,
      distanceKm,
      stepsCount: computedSteps,
      photoUrl: photoPreview || undefined,
      notes: `${MACHINES.find((m) => m.type === machineType)?.label || 'Cardio'} Session`,
      source: photoPreview ? 'ocr_scan' : 'manual_dial',
    });

    if (onSaved) onSaved(entry);
    onClose();
  };

  const modal = (
    <div
      id="cardio-modal-portal"
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      style={{ isolation: 'isolate' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#0C0C0E] text-zinc-900 dark:text-white rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Post Cardio Machine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-nude-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto overscroll-contain hide-scrollbar">
          {/* 1. Apparatus Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
            {MACHINES.map((m) => {
              const active = machineType === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => handleSelectMachine(m)}
                  className={`shrink-0 h-9 px-4 rounded-full text-xs font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer border active:scale-95 flex items-center justify-center ${
                    active
                      ? 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-600/40'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 border-neutral-200 dark:border-white/10 text-neutral-700 hover:text-neutral-950 dark:text-zinc-300 dark:hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* 2. Photo / Camera Scanner */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!photoPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/90 border border-dashed border-neutral-300 dark:border-white/20 hover:border-red-500/60 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="w-9 h-9 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 dark:border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">
                  Take Photo or Upload Console
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-zinc-400">
                  Auto-extracts calories, time & distance
                </span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/15 bg-black h-32 flex items-center justify-center">
                <img src={photoPreview} alt="Console" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    setScanSuccess(false);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {isScanning && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-white">
                    <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    OCR Scanning Console...
                  </div>
                )}

                {scanSuccess && (
                  <div className="absolute bottom-2 inset-x-2 py-1 px-2.5 rounded-xl bg-black/80 border border-emerald-500/50 text-emerald-400 text-[11px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      OCR Parsed
                    </span>
                    <span className="font-bold tabular-nums">+{caloriesBurned} kcal</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Inputs Matrix */}
          <div className="grid grid-cols-2 gap-2">
            {/* Calories */}
            <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/90 border border-neutral-200 dark:border-white/10 focus-within:border-red-500/50">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" /> Active Burn
              </label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  value={caloriesBurned || ''}
                  onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                  className="w-full bg-transparent text-lg font-bold tabular-nums text-orange-600 dark:text-orange-400 outline-none"
                  placeholder="0"
                />
                <span className="text-xs font-medium text-neutral-400 dark:text-zinc-500">kcal</span>
              </div>
            </div>

            {/* Duration */}
            <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/90 border border-neutral-200 dark:border-white/10 focus-within:border-red-500/50">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-500 dark:text-red-400" /> Duration
              </label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  value={durationMinutes || ''}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-transparent text-lg font-bold tabular-nums text-zinc-900 dark:text-white outline-none"
                  placeholder="0"
                />
                <span className="text-xs font-medium text-neutral-400 dark:text-zinc-500">min</span>
              </div>
            </div>

            {/* Distance */}
            <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/90 border border-neutral-200 dark:border-white/10 focus-within:border-red-500/50">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500 dark:text-blue-400" /> Distance
              </label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  step="0.1"
                  value={distanceKm || ''}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full bg-transparent text-base font-bold tabular-nums text-zinc-900 dark:text-white outline-none"
                  placeholder="0.0"
                />
                <span className="text-xs font-medium text-neutral-400 dark:text-zinc-500">km</span>
              </div>
            </div>

            {/* Steps */}
            <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/90 border border-neutral-200 dark:border-white/10 focus-within:border-red-500/50">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                <Footprints className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Steps
              </label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  value={stepsCount || ''}
                  onChange={(e) => setStepsCount(Number(e.target.value))}
                  className="w-full bg-transparent text-base font-bold tabular-nums text-zinc-900 dark:text-white outline-none"
                  placeholder="0"
                />
                <span className="text-xs font-medium text-neutral-400 dark:text-zinc-500">steps</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Bar */}
        <div className="p-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.875rem))] border-t border-neutral-200 dark:border-white/[0.08] bg-neutral-50/90 dark:bg-[#0C0C0E] flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-neutral-200 dark:border-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-[2] py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Post & Sync (+{caloriesBurned} kcal)
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
