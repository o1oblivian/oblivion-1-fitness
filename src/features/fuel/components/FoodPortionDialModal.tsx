import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Gauge, Hash, Delete, RotateCcw, Flame } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface FoodPortionDialModalProps {
  isOpen: boolean;
  initialGrams?: number;
  foodName?: string;
  food?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    serving_grams?: number;
    serving_size?: string;
  } | null;
  onSetGrams: (grams: number) => void;
  onClose: () => void;
}

const PRESET_GRAMS = [50, 75, 100, 150, 200, 250, 300];

export const FoodPortionDialModal: React.FC<FoodPortionDialModalProps> = ({
  isOpen,
  initialGrams = 100,
  foodName,
  food,
  onSetGrams,
  onClose,
}) => {
  const [grams, setGrams] = useState<number>(initialGrams || 100);
  const [mode, setMode] = useState<'dial' | 'numpad'>('dial');
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGrams(initialGrams || (food?.serving_grams || 100));
    }
  }, [isOpen, initialGrams, food]);

  // Max value 2000g
  const maxGrams = 2000;

  // Arc angles: start at 135 deg (bottom left), sweep 270 deg to 405 deg (bottom right)
  const angleFromGrams = (g: number) => {
    const clamped = Math.max(0, Math.min(maxGrams, g));
    return 135 + (clamped / maxGrams) * 270;
  };

  const gramsFromAngle = (deg: number) => {
    let norm = deg;
    if (norm < 135) norm += 360;
    const fraction = (norm - 135) / 270;
    const clamped = Math.max(0, Math.min(1, fraction));
    return Math.round(clamped * maxGrams);
  };

  const handlePointerEvent = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      let theta = Math.atan2(dy, dx) * (180 / Math.PI);
      if (theta < 0) theta += 360;

      const computedGrams = gramsFromAngle(theta);
      setGrams(computedGrams);
      tactileEngine.triggerDialHaptic();
    },
    []
  );

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handlePointerEvent(e);
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) handlePointerEvent(e);
    };
    const onPointerUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, handlePointerEvent]);

  // Numpad handlers
  const handleNumpadDigit = (digit: string) => {
    tactileEngine.triggerDialHaptic();
    const currentStr = grams === 0 ? '' : String(grams);
    const newStr = currentStr + digit;
    const num = parseInt(newStr, 10);
    if (!isNaN(num)) {
      setGrams(Math.min(maxGrams, num));
    }
  };

  const handleNumpadBackspace = () => {
    tactileEngine.triggerSelectionBuzz();
    const currentStr = String(grams);
    if (currentStr.length <= 1) {
      setGrams(0);
    } else {
      setGrams(parseInt(currentStr.slice(0, -1), 10) || 0);
    }
  };

  const handleNumpadClear = () => {
    tactileEngine.triggerSelectionBuzz();
    setGrams(0);
  };

  const handleQuickDelta = (delta: number) => {
    tactileEngine.triggerDialHaptic();
    setGrams((prev) => Math.max(0, Math.min(maxGrams, prev + delta)));
  };

  if (!isOpen) return null;

  // Live scaled nutrition calculations
  const baseServingG = food?.serving_grams && food.serving_grams > 0 ? food.serving_grams : 100;
  const ratio = grams / baseServingG;
  const liveKcal = food ? Math.round(food.calories * ratio) : null;
  const liveP = food ? Math.round(food.protein * ratio * 10) / 10 : null;
  const liveC = food ? Math.round(food.carbs * ratio * 10) / 10 : null;
  const liveF = food ? Math.round(food.fats * ratio * 10) / 10 : null;

  const currentAngle = angleFromGrams(grams);
  const rad = (currentAngle * Math.PI) / 180;
  const radius = 105;
  const cx = 140;
  const cy = 140;
  const needleX = cx + radius * Math.cos(rad);
  const needleY = cy + radius * Math.sin(rad);

  const startRad = (135 * Math.PI) / 180;
  const startX = cx + radius * Math.cos(startRad);
  const startY = cy + radius * Math.sin(startRad);

  const isLargeArc = currentAngle - 135 > 180 ? 1 : 0;
  const filledPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLargeArc} 1 ${needleX} ${needleY}`;

  const endRad = (405 * Math.PI) / 180;
  const endX = cx + radius * Math.cos(endRad);
  const endY = cy + radius * Math.sin(endRad);
  const bgPath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;

  const majorTicks = [
    { value: 0, label: '0' },
    { value: 300, label: '300g' },
    { value: 600, label: '600g' },
    { value: 1000, label: '1kg' },
    { value: 2000, label: '2kg' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3.5 max-h-[92vh] overflow-y-auto">
        {/* Header with Title and Mode Switcher */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="min-w-0 pr-2">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              Select Weight
            </h3>
            {foodName && (
              <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {foodName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mode Switcher: Dial vs Numpad */}
            <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setMode('dial');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'dial'
                    ? 'bg-white dark:bg-[#27272a] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Dial Gauge"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Dial</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setMode('numpad');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'numpad'
                    ? 'bg-white dark:bg-[#27272a] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Numpad Keypad"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Numpad</span>
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DIAL MODE */}
        {mode === 'dial' && (
          <div className="flex flex-col items-center justify-center py-1 relative">
            <svg
              ref={dialRef}
              onPointerDown={onPointerDown}
              viewBox="0 0 280 280"
              className="w-56 h-56 cursor-grab active:cursor-grabbing touch-none select-none"
            >
              {/* Background Arc Track */}
              <path
                d={bgPath}
                fill="none"
                stroke="currentColor"
                className="text-neutral-200 dark:text-white/10"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Filled Active Arc Track (Amber) */}
              {grams > 0 && (
                <path
                  d={filledPath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              )}

              {/* Radial Ticks */}
              {Array.from({ length: 33 }).map((_, i) => {
                const tickG = (i / 32) * maxGrams;
                const tickAng = angleFromGrams(tickG);
                const tickRad = (tickAng * Math.PI) / 180;
                const isMajor = i % 8 === 0;
                const innerR = isMajor ? radius - 15 : radius - 9;
                const outerR = radius - 2;
                const x1 = cx + innerR * Math.cos(tickRad);
                const y1 = cy + innerR * Math.sin(tickRad);
                const x2 = cx + outerR * Math.cos(tickRad);
                const y2 = cy + outerR * Math.sin(tickRad);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? '#9CA3AF' : '#4B5563'}
                    strokeWidth={isMajor ? 2 : 1}
                  />
                );
              })}

              {/* Major Tick Labels */}
              {majorTicks.map((t) => {
                const tAng = angleFromGrams(t.value);
                const tRad = (tAng * Math.PI) / 180;
                const textR = radius - 26;
                const tx = cx + textR * Math.cos(tRad);
                const ty = cy + textR * Math.sin(tRad);
                return (
                  <text
                    key={t.value}
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontFamily="'Outfit', sans-serif"
                    fill="#9CA3AF"
                    fontWeight="bold"
                  >
                    {t.label}
                  </text>
                );
              })}

              {/* Needle / Indicator Thumb */}
              <circle
                cx={needleX}
                cy={needleY}
                r="9"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="filter drop-shadow-md"
              />
              <circle cx={needleX} cy={needleY} r="3" fill="#FFFFFF" />
            </svg>

            {/* Big Center Display */}
            <div
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setMode('numpad');
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center cursor-pointer hover:scale-105 transition-transform"
              title="Tap to use Numpad"
            >
              <span className="text-[10px] font-mono font-bold text-neutral-400 block tracking-widest uppercase">
                GRAMS
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-neutral-900 dark:text-neutral-100 block leading-tight">
                {grams}
              </span>
              <span className="text-[10px] text-amber-500 font-semibold block">tap for numpad</span>
            </div>
          </div>
        )}

        {/* NUMPAD MODE */}
        {mode === 'numpad' && (
          <div className="space-y-2.5 py-1">
            {/* Digital Readout */}
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-neutral-400">Weight:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-neutral-900 dark:text-white tracking-tight">
                  {grams}
                </span>
                <span className="text-sm font-mono font-bold text-amber-500">g</span>
              </div>
            </div>

            {/* Delta shortcuts */}
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => handleQuickDelta(-25)}
                className="flex-1 py-1 rounded-lg bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                -25g
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(25)}
                className="flex-1 py-1 rounded-lg bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                +25g
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(50)}
                className="flex-1 py-1 rounded-lg bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                +50g
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(100)}
                className="flex-1 py-1 rounded-lg bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                +100g
              </button>
            </div>

            {/* Tactical 3x4 Numpad */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadDigit(digit)}
                  className="py-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 active:bg-amber-500 active:text-white text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 transition-all active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNumpadClear}
                className="py-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] hover:bg-red-100 dark:hover:bg-red-950/40 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                title="Clear"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>C</span>
              </button>
              <button
                type="button"
                onClick={() => handleNumpadDigit('0')}
                className="py-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 active:bg-amber-500 active:text-white text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 transition-all active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleNumpadBackspace}
                className="py-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Preset Quick-Add Pills */}
        <div className="flex items-center justify-center gap-1 flex-wrap pt-0.5">
          {PRESET_GRAMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setGrams(p);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                grams === p
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#18181b] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {p}g
            </button>
          ))}
        </div>

        {/* Live Macro Preview HUD */}
        {food && liveKcal !== null && (
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
              <Flame className="w-3.5 h-3.5 text-[#C4121A] fill-[#C4121A]/20" />
              <span>{liveKcal} kcal</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
              <span className="text-red-500">{liveP}g P</span>
              <span className="text-amber-500">{liveC}g C</span>
              <span className="text-green-500">{liveF}g F</span>
            </div>
          </div>
        )}

        {/* Confirm Action Button */}
        <button
          type="button"
          disabled={grams <= 0}
          onClick={() => {
            if (grams > 0) {
              tactileEngine.playPRCelebration();
              onSetGrams(grams);
              onClose();
            }
          }}
          className="w-full py-3 rounded-2xl bg-[#C4121A] hover:bg-[#A30F16] active:scale-98 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Log {grams}g {liveKcal !== null ? `(${liveKcal} kcal)` : ''}</span>
        </button>
      </div>
    </div>
  );
};
