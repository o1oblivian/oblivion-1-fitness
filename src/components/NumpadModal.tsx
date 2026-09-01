import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Delete, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { recordSmartInput } from '../utils/frequencyDefaults';
import {
  playSoftTickSound,
  playSweetConfirmChime,
  speakNumberVoice,
} from '../utils/audio';

interface NumpadModalProps {
  isOpen: boolean;
  type: string;
  maxVal: number;
  initialVal: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
}

export const NumpadModal: React.FC<NumpadModalProps> = ({
  isOpen,
  type,
  maxVal,
  initialVal,
  onConfirm,
  onClose,
}) => {
  const [inputStr, setInputStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fitlab_aston_sound');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isOpen) {
      const initial = initialVal !== undefined && initialVal > 0 ? String(initialVal) : '';
      setInputStr(initial);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, initialVal]);

  if (!isOpen) return null;

  const t = type.toLowerCase();
  const isWeight = t.includes('weight') || t.includes('kg') || t.includes('lb') || t.includes('load');
  const isRpe = t.includes('rpe') || t.includes('intensity') || t.includes('effort');
  const isTimer = t.includes('timer') || t.includes('time') || t.includes('sec') || t.includes('rest');
  const isReps = t.includes('rep');
  const isSteps = t.includes('step') || t.includes('pedometer');

  let unitLabel = 'VALUE';
  let presets: number[] = [5, 10, 15, 20, 25, 30];
  let effectiveMax = maxVal || 500;

  if (isReps) {
    unitLabel = 'REPS';
    presets = [5, 8, 10, 12, 15, 20, 25, 30];
    effectiveMax = 50;
  } else if (isWeight) {
    unitLabel = 'KG';
    presets = [20, 40, 60, 80, 100, 140, 180, 220];
    effectiveMax = 500;
  } else if (isRpe) {
    unitLabel = 'RPE';
    presets = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];
    effectiveMax = 10;
  } else if (isTimer) {
    unitLabel = 'SECONDS';
    presets = [30, 45, 60, 90, 120, 180];
    effectiveMax = 3600;
  } else if (isSteps) {
    unitLabel = 'STEPS';
    presets = [5000, 8000, 10000, 12000, 15000, 20000];
    effectiveMax = 30000;
  }

  // Soft sweet tick audio feedback & spoken numbers
  const triggerAudioFeedback = (nextValNum: number, charSpoken?: string) => {
    if (!soundEnabled) return;
    const ratio = effectiveMax > 0 ? Math.min(1, Math.max(0.1, nextValNum / effectiveMax)) : 0.4;
    playSoftTickSound(0.9 + ratio * 0.5);

    if (charSpoken) {
      if (charSpoken === '.') {
        speakNumberVoice('point');
      } else {
        speakNumberVoice(nextValNum > 0 ? nextValNum : charSpoken);
      }
    }
  };

  const handleKeyPress = (char: string) => {
    if (char === '.' && inputStr.includes('.')) return;
    if (inputStr.length >= 7) return;

    let nextStr = inputStr;
    if (nextStr === '0' && char !== '.') {
      nextStr = char;
    } else {
      nextStr = nextStr + char;
    }

    const num = parseFloat(nextStr);
    let finalStr = nextStr;
    if (!isNaN(num) && num > effectiveMax) {
      finalStr = String(effectiveMax);
    }
    setInputStr(finalStr);
    const parsed = parseFloat(finalStr) || 0;
    triggerAudioFeedback(parsed, char);
  };

  const handleBackspace = () => {
    if (soundEnabled) playSoftTickSound(0.8);
    setInputStr((prev) => {
      const next = prev.slice(0, -1);
      if (soundEnabled) {
        if (next.length > 0) {
          speakNumberVoice(next);
        } else {
          speakNumberVoice('zero');
        }
      }
      return next;
    });
  };

  const handleClear = () => {
    if (soundEnabled) {
      playSoftTickSound(0.75);
      speakNumberVoice('clear');
    }
    setInputStr('');
  };

  const handlePreset = (val: number) => {
    setInputStr(String(val));
    if (soundEnabled) {
      playSoftTickSound(1.1);
      const unit = isWeight ? 'kilos' : isReps ? 'reps' : isTimer ? 'seconds' : isSteps ? 'steps' : '';
      speakNumberVoice(`${val} ${unit}`);
    }
  };

  const handleConfirm = () => {
    const parsed = parseFloat(inputStr);
    const finalVal = isNaN(parsed) ? 0 : Math.min(effectiveMax, Math.max(0, parsed));
    recordSmartInput('input_numpad_' + type, finalVal);

    if (soundEnabled) {
      playSweetConfirmChime();
      const unit = isWeight ? 'kilos' : isReps ? 'reps' : isTimer ? 'seconds' : isSteps ? 'steps' : '';
      speakNumberVoice(`${finalVal} ${unit}`);
    }

    onConfirm(finalVal);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fitlab_aston_sound', String(next));
      } catch {}
      if (next) {
        playSoftTickSound(1.2);
        speakNumberVoice('Number voice active');
      }
      return next;
    });
  };

  const displayValue = inputStr === '' ? '0' : inputStr;

  return createPortal(
    <div
      id="numpad-modal-backdrop"
      className="fixed inset-0 z-[99990] flex items-center justify-center pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] px-3 sm:px-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="numpad-modal-card"
        className="w-full max-w-[340px] bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center shadow-2xl text-zinc-900 dark:text-white relative overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls: Sound Toggle & Close Button */}
        <div className="w-full flex items-center justify-between z-30 mb-2 px-0.5">
          <button
            type="button"
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            }`}
            title="Audio feedback toggle"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Voice' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type & Readout Glass Screen */}
        <div className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center relative mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {type || 'Tactical Numpad'}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="font-mono font-black text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
              {displayValue}
            </span>
            <span className="text-xs font-mono font-bold text-amber-500 uppercase">
              {unitLabel}
            </span>
          </div>
        </div>

        {/* Quick Tactical Preset Chips */}
        <div className="w-full mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center items-center">
            {presets.map((val) => {
              const isSelected = parseFloat(inputStr) === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePreset(val)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all shrink-0 cursor-pointer active:scale-95 border ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-700 font-semibold'
                  }`}
                >
                  {isTimer
                    ? val < 60
                      ? `${val}s`
                      : `${Math.floor(val / 60)}m`
                    : isWeight
                    ? `${val}kg`
                    : isSteps && val >= 1000
                    ? `${val / 1000}k`
                    : `${val}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactical Numpad Grid */}
        <div className="grid grid-cols-3 gap-1.5 w-full mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-11 rounded-xl flex items-center justify-center font-mono font-bold text-xl text-zinc-800 hover:text-amber-500 dark:text-zinc-100 dark:hover:text-amber-400 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-all cursor-pointer select-none active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Decimal / Dot or Quick Reset */}
          <button
            type="button"
            onClick={() => (isRpe || isWeight ? handleKeyPress('.') : handleClear())}
            className="h-11 rounded-xl flex items-center justify-center font-mono font-bold text-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer select-none active:scale-95"
          >
            {isRpe || isWeight ? '.' : <RotateCcw className="w-4 h-4" />}
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-11 rounded-xl flex items-center justify-center font-mono font-bold text-xl text-zinc-800 hover:text-amber-500 dark:text-zinc-100 dark:hover:text-amber-400 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-all cursor-pointer select-none active:scale-95"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-11 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-500 active:text-red-500 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer select-none active:scale-95"
            title="Backspace"
          >
            <Delete className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Action Buttons: Confirm & Clear */}
        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer active:scale-95"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

