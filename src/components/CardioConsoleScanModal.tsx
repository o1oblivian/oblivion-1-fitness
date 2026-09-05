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
  AlertTriangle,
  ImageIcon,
  Upload,
} from 'lucide-react';
import { CardioMachineType, CardioMachineEntry } from '../types/cardio';
import { saveCardioLog } from '../utils/cardioStorage';
import { apiFetch } from '../utils/apiUrl';
import { useModalBackHandler } from '../utils/modalHistory';

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
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [stepsCount, setStepsCount] = useState<number | undefined>(undefined);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [detectedBrand, setDetectedBrand] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useModalBackHandler(isOpen, onClose, 'cardio_console_scan_modal');

  if (!isOpen) return null;

  const handleSelectMachine = (m: typeof MACHINES[0]) => {
    setMachineType(m.type);
    if (!photoPreview && caloriesBurned === 0 && durationMinutes === 0) {
      setDurationMinutes(m.defaultMins);
      setCaloriesBurned(m.defaultCals);
      setDistanceKm(m.dist > 0 ? m.dist : undefined);
      setStepsCount(Math.round(m.defaultMins * 140));
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setIsScanning(true);
      setScanSuccess(false);
      setScanError(null);
      setDetectedBrand(null);
      setParsedSummary(null);

      try {
        const mimeMatch = dataUrl.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const rawBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

        const res = await apiFetch('/api/cardio-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: rawBase64, mimeType }),
        }, 25000);

        const data = await res.json();
        if (res.ok && data.success && data.result) {
          const r = data.result;
          setScanSuccess(true);
          let cals = typeof r.caloriesBurned === 'number' ? r.caloriesBurned : 0;
          let mins = typeof r.durationMinutes === 'number' ? r.durationMinutes : 0;
          let dist = r.distanceKm;
          let steps = r.stepsCount;

          // If steps detected without calories (e.g. Casio G-Shock or smartwatch display), calculate standard human metabolic burn
          if (steps && steps > 0) {
            if (!cals || cals === 0) cals = Math.round(steps * 0.045);
            if (!dist || dist === 0) dist = Math.round(steps * 0.000762 * 100) / 100;
            if (!mins || mins === 0) mins = Math.round(steps / 100);
          }

          setCaloriesBurned(cals);
          setDurationMinutes(mins);
          if (dist !== undefined) setDistanceKm(dist);
          if (steps !== undefined) setStepsCount(steps);
          if (r.machineType && MACHINES.some((m) => m.type === r.machineType)) {
            setMachineType(r.machineType as CardioMachineType);
          }
          if (r.detectedBrand) setDetectedBrand(r.detectedBrand);
          if (r.summary) {
            setParsedSummary(r.summary);
          } else if (steps && steps > 0) {
            setParsedSummary(`${steps.toLocaleString()} steps • ${dist || 0} km • ~${cals} kcal burn`);
          }
        } else {
          setScanError(data.message || 'Could not detect console readouts. Please enter metrics manually.');
        }
      } catch (err: any) {
        console.error('Cardio OCR scan failed:', err);
        setScanError('Console scan request failed. Please check network or enter manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const resetPhoto = () => {
    setPhotoPreview(null);
    setScanSuccess(false);
    setScanError(null);
    setDetectedBrand(null);
    setParsedSummary(null);
  };

  const handleStepsChange = (val: number) => {
    setStepsCount(val);
    if (val > 0) {
      if (caloriesBurned === 0) {
        setCaloriesBurned(Math.round(val * 0.045));
      }
      if (!distanceKm || distanceKm === 0) {
        setDistanceKm(Math.round(val * 0.000762 * 100) / 100);
      }
      if (durationMinutes === 0) {
        setDurationMinutes(Math.round(val / 100));
      }
    }
  };

  const handleSave = () => {
    const computedSteps = stepsCount || (durationMinutes > 0 ? Math.round(durationMinutes * 140) : 0);
    let finalCals = caloriesBurned;
    let finalDist = distanceKm;
    let finalMins = durationMinutes;

    if (computedSteps > 0 && (!finalCals || finalCals === 0)) {
      finalCals = Math.round(computedSteps * 0.045);
    }
    if (computedSteps > 0 && (!finalDist || finalDist === 0)) {
      finalDist = Math.round(computedSteps * 0.000762 * 100) / 100;
    }
    if (computedSteps > 0 && (!finalMins || finalMins === 0)) {
      finalMins = Math.round(computedSteps / 100);
    }

    const entry = saveCardioLog({
      date: new Date().toISOString().slice(0, 10),
      machineType,
      durationMinutes: finalMins,
      caloriesBurned: finalCals,
      distanceKm: finalDist,
      stepsCount: computedSteps,
      photoUrl: photoPreview || undefined,
      notes: parsedSummary || `${MACHINES.find((m) => m.type === machineType)?.label || 'Cardio'} Session`,
      source: photoPreview ? 'ocr_scan' : 'manual_dial',
    });

    if (onSaved) onSaved(entry);
    onClose();
  };

  const modal = (
    <div
      id="cardio-modal-portal"
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 animate-in fade-in duration-150"
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
                  className={`capsule text-xs font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/40'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-neutral-600 dark:text-zinc-400 border border-neutral-200/80 dark:border-white/5'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* 2. Photo / Camera Scanner */}
          <div>
            {/* Hidden native inputs: Camera (capture="environment") & Gallery/Files (standard picker) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!photoPreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full p-3.5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/90 border transition-all ${
                  isDragging
                    ? 'border-red-500 bg-red-500/5 dark:bg-red-950/20'
                    : 'border-dashed border-neutral-300 dark:border-white/15'
                }`}
              >
                <div className="text-center mb-3">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">
                    Scan Cardio Console
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5">
                    Auto-extracts calories, time, distance & steps with AI Vision
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Take Photo with Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-neutral-200 dark:border-white/10 shadow-xs text-zinc-900 dark:text-white transition-all cursor-pointer active:scale-95 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="text-center leading-tight">
                      <span className="text-xs font-semibold block">Take Photo</span>
                      <span className="text-[10px] text-neutral-500 dark:text-zinc-400">Direct Camera</span>
                    </div>
                  </button>

                  {/* Upload from Gallery / Files */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-neutral-200 dark:border-white/10 shadow-xs text-zinc-900 dark:text-white transition-all cursor-pointer active:scale-95 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-200/60 dark:bg-white/10 border border-neutral-300/50 dark:border-white/15 text-zinc-800 dark:text-zinc-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="text-center leading-tight">
                      <span className="text-xs font-semibold block">Upload Photo</span>
                      <span className="text-[10px] text-neutral-500 dark:text-zinc-400">Gallery / Files</span>
                    </div>
                  </button>
                </div>

                <p className="text-[10px] text-center text-neutral-400 dark:text-zinc-500 mt-2.5">
                  or drag and drop a console photo here
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/15 bg-black h-36 flex items-center justify-center">
                <img src={photoPreview} alt="Console" className="w-full h-full object-cover" />
                
                {/* Reset button in corner */}
                <button
                  type="button"
                  onClick={resetPhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white cursor-pointer z-10 transition-transform active:scale-90"
                  title="Clear photo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Quick swap buttons overlay */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="capsule-xs bg-black/80 hover:bg-black text-white border border-white/20 flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="capsule-xs bg-black/80 hover:bg-black text-white border border-white/20 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload New</span>
                  </button>
                </div>

                {isScanning && (
                  <div className="absolute inset-0 bg-black/85 flex items-center justify-center gap-2 text-xs font-semibold text-white z-10">
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    AI Vision Reading Console...
                  </div>
                )}

                {scanSuccess && (
                  <div className="absolute bottom-2 inset-x-2 py-1.5 px-2.5 rounded-xl bg-black/85 border border-emerald-500/60 text-white text-[11px] flex flex-col gap-0.5 z-10">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {detectedBrand ? `${detectedBrand} Verified` : 'Live OCR Parsed'}
                      </span>
                      <span className="font-bold tabular-nums">+{caloriesBurned} kcal</span>
                    </div>
                    {parsedSummary && (
                      <div className="text-[10px] text-zinc-300 truncate">
                        {parsedSummary}
                      </div>
                    )}
                  </div>
                )}

                {scanError && (
                  <div className="absolute bottom-2 inset-x-2 py-1.5 px-2.5 rounded-xl bg-black/90 border border-amber-500/60 text-amber-300 text-[11px] flex items-center gap-1.5 z-10">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{scanError}</span>
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
                  onChange={(e) => handleStepsChange(Number(e.target.value))}
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
