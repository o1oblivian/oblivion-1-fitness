import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Delete, Play, Pause, RotateCcw } from 'lucide-react';
import { getDialConfig } from '@/components/RotaryDialModal';

interface TacticalNumpadModalProps {
  isOpen: boolean;
  type: string;
  maxVal: number;
  initialVal: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
}

const playKeyTick = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
};

const playConfirmChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {}
};

export const TacticalNumpadModal: React.FC<TacticalNumpadModalProps> = ({
  isOpen,
  type,
  maxVal,
  initialVal,
  onConfirm,
  onClose,
}) => {
  const config = getDialConfig(type, maxVal);
  const [display, setDisplay] = useState<string>('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerVal, setTimerVal] = useState(0);
  const [bellRung, setBellRung] = useState(false);

  const isTimer = config.category === 'timer';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setDisplay(initialVal > 0 ? String(initialVal) : '');
      setIsTimerRunning(false);
      setTimerVal(initialVal || 0);
      setBellRung(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialVal]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && isTimer) {
      interval = setInterval(() => {
        setTimerVal((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setBellRung(true);
            playConfirmChime();
            if (navigator.vibrate) navigator.vibrate([150, 80, 150, 80, 250]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isTimer]);

  if (!isOpen) return null;

  const currentNumeric = parseFloat(display) || 0;
  const displayValue = isTimer && isTimerRunning ? timerVal : currentNumeric;

  const handleDigit = (digit: string) => {
    if (navigator.vibrate) navigator.vibrate(6);
    playKeyTick();
    const next = display + digit;
    const numericNext = parseFloat(next);
    if (numericNext <= config.max) {
      setDisplay(next);
      if (isTimer) setTimerVal(Math.round(numericNext));
    }
  };

  const handleDecimal = () => {
    if (display.includes('.')) return;
    if (navigator.vibrate) navigator.vibrate(6);
    playKeyTick();
    setDisplay(display === '' ? '0.' : display + '.');
  };

  const handleBackspace = () => {
    if (navigator.vibrate) navigator.vibrate(8);
    const next = display.slice(0, -1);
    setDisplay(next);
    if (isTimer) setTimerVal(Math.round(parseFloat(next) || 0));
  };

  const handleClear = () => {
    if (navigator.vibrate) navigator.vibrate(12);
    setDisplay('');
    if (isTimer) setTimerVal(0);
    setBellRung(false);
  };

  const handlePresetSelect = (val: number) => {
    if (navigator.vibrate) navigator.vibrate(12);
    playKeyTick();
    setDisplay(String(val));
    if (isTimer) { setTimerVal(val); setIsTimerRunning(false); }
  };

  const handleConfirm = () => {
    if (navigator.vibrate) navigator.vibrate(18);
    playConfirmChime();
    const finalVal = isTimer ? timerVal : Math.min(config.max, Math.max(0, currentNumeric));
    onConfirm(finalVal);
    onClose();
  };

  const formatTimer = (val: number) => {
    const mins = Math.floor(val / 60);
    const secs = val % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return createPortal(
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] px-3 sm:px-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center w-full max-w-[340px] bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl transition-all overflow-hidden text-zinc-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="w-full flex items-center justify-between z-10 mb-3 px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {config.unit}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl px-4 py-3 mb-3 flex flex-col items-center">
          {isTimer && isTimerRunning ? (
            <div className="flex flex-col items-center">
              <span className="font-mono font-black text-3xl text-zinc-900 dark:text-white tracking-tight">{formatTimer(timerVal)}</span>
              {bellRung && <span className="text-[8px] font-mono font-black text-amber-500 animate-bounce mt-1">TARGET REACHED</span>}
            </div>
          ) : (
            <span className="font-mono font-black text-3xl text-zinc-900 dark:text-white tracking-tight min-h-[2.25rem]">
              {display || <span className="text-zinc-400 dark:text-zinc-600">0</span>}
            </span>
          )}
          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isTimer ? 'seconds' : `max ${config.max} ${config.unit.toLowerCase()}`}
          </span>
        </div>

        {/* Timer Controls */}
        {isTimer && (
          <div className="w-full flex gap-2 mb-3 z-10">
            <button
              onClick={() => {
                if (timerVal <= 0 && currentNumeric > 0) setTimerVal(Math.round(currentNumeric));
                else if (timerVal <= 0) setTimerVal(60);
                setIsTimerRunning(!isTimerRunning);
                setBellRung(false);
              }}
              className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isTimerRunning ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-black'
              }`}
            >
              {isTimerRunning ? <><Pause className="w-3.5 h-3.5" /><span>Hold</span></> : <><Play className="w-3.5 h-3.5 fill-current" /><span>Engage</span></>}
            </button>
            <button
              onClick={() => { setIsTimerRunning(false); setTimerVal(initialVal || 60); setDisplay(String(initialVal || 60)); setBellRung(false); }}
              className="px-2.5 py-2 text-xs font-mono font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /><span>Reset</span>
            </button>
          </div>
        )}

        {/* Numpad Grid */}
        <div className="w-full grid grid-cols-3 gap-1.5 mb-3">
          {KEYS.map((key) => {
            if (key === 'del') {
              return (
                <button
                  key={key}
                  onClick={handleBackspace}
                  onDoubleClick={handleClear}
                  className="h-11 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-500 active:text-red-500 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer active:scale-95"
                >
                  <Delete className="w-5 h-5 stroke-[1.75]" />
                </button>
              );
            }
            if (key === '.') {
              if (config.step >= 1 && config.category !== 'rpe') {
                return (
                  <button
                    key={key}
                    onClick={handleClear}
                    className="h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-mono font-bold text-sm bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer active:scale-95"
                  >
                    C
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={handleDecimal}
                  className="h-11 rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-mono font-bold text-lg bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer active:scale-95"
                >
                  .
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                className="h-11 rounded-xl flex items-center justify-center text-zinc-800 hover:text-amber-500 dark:text-zinc-100 dark:hover:text-amber-400 font-mono font-bold text-xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-all cursor-pointer active:scale-95"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Presets */}
        <div className="w-full z-10 mb-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar justify-center items-center">
            {config.presets.map((val) => {
              const isSelected = currentNumeric === val;
              return (
                <button
                  key={val}
                  onClick={() => handlePresetSelect(val)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all shrink-0 cursor-pointer active:scale-95 border ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-700 font-semibold'
                  }`}
                >
                  {isTimer
                    ? (val < 60 ? `${val}s` : `${Math.floor(val / 60)}m`)
                    : config.category === 'weight'
                    ? `${val}kg`
                    : config.category === 'food_grams' || config.unit === 'G'
                    ? `${val}g`
                    : config.category === 'steps' && val >= 1000
                    ? `${val / 1000}k`
                    : `${val}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Confirm</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default TacticalNumpadModal;
