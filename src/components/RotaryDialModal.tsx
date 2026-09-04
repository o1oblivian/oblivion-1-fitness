import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { playDigitalCrownClick, playRealBellSound } from '../utils/audio';

interface RotaryDialModalProps {
  isOpen: boolean;
  type: string;
  maxVal: number;
  initialVal: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
}

export interface DialProfile {
  title: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  highZoneStart: number;
  presets: number[];
  isTimer: boolean;
  scaleMarks: { val: number; label: string }[];
}

export const getSupercarProfile = (type: string, maxVal: number): DialProfile => {
  const t = (type || '').toLowerCase();

  // Food scale / portion weight in grams (Checked before gym workout weight load!)
  const isFoodGrams =
    t.includes('(g)') ||
    t.includes('gram') ||
    t.includes('food') ||
    t.includes('scale') ||
    t.includes('portion') ||
    t.includes('serving');

  if (isFoodGrams) {
    const max = Math.max(300, maxVal || 1000);
    return {
      title: 'FOOD PORTION',
      unit: 'G',
      min: 5,
      max: max,
      step: 5,
      highZoneStart: Math.round(max * 0.75),
      presets: [25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500].filter((v) => v <= max),
      isTimer: false,
      scaleMarks: [
        { val: 0, label: '0' },
        { val: Math.round(max * 0.2), label: `${Math.round(max * 0.2)}g` },
        { val: Math.round(max * 0.4), label: `${Math.round(max * 0.4)}g` },
        { val: Math.round(max * 0.6), label: `${Math.round(max * 0.6)}g` },
        { val: Math.round(max * 0.8), label: `${Math.round(max * 0.8)}g` },
        { val: max, label: max >= 1000 ? `${(max / 1000).toFixed(0)}kg` : `${max}g` },
      ],
    };
  }

  if (t.includes('rep')) {
    const max = Math.max(30, maxVal || 50);
    return {
      title: 'REPETITIONS',
      unit: 'REPS',
      min: 0,
      max: max,
      step: 1,
      highZoneStart: Math.round(max * 0.75),
      presets: [5, 8, 10, 12, 15, 20, 25, 30].filter((v) => v <= max),
      isTimer: false,
      scaleMarks: [
        { val: 0, label: '0' },
        { val: Math.round(max * 0.2), label: `${Math.round(max * 0.2)}` },
        { val: Math.round(max * 0.4), label: `${Math.round(max * 0.4)}` },
        { val: Math.round(max * 0.6), label: `${Math.round(max * 0.6)}` },
        { val: Math.round(max * 0.8), label: `${Math.round(max * 0.8)}` },
        { val: max, label: `${max}` },
      ],
    };
  }

  if (t.includes('weight') || t.includes('kg') || t.includes('lb') || t.includes('load')) {
    const max = Math.max(100, maxVal || 300);
    return {
      title: 'WEIGHT LOAD',
      unit: 'KG',
      min: 0,
      max: max,
      step: max > 100 ? 2.5 : 1,
      highZoneStart: Math.round(max * 0.8),
      presets: [20, 40, 60, 80, 100, 140, 180, 220].filter((v) => v <= max),
      isTimer: false,
      scaleMarks: [
        { val: 0, label: '0' },
        { val: Math.round(max * 0.2), label: `${Math.round(max * 0.2)}` },
        { val: Math.round(max * 0.4), label: `${Math.round(max * 0.4)}` },
        { val: Math.round(max * 0.6), label: `${Math.round(max * 0.6)}` },
        { val: Math.round(max * 0.8), label: `${Math.round(max * 0.8)}` },
        { val: max, label: `${max}` },
      ],
    };
  }

  if (t.includes('timer') || t.includes('time') || t.includes('sec') || t.includes('rest')) {
    const max = Math.max(180, maxVal || 300);
    return {
      title: 'REST TIMER',
      unit: 'SEC',
      min: 0,
      max: max,
      step: 5,
      highZoneStart: Math.round(max * 0.75),
      presets: [30, 45, 60, 90, 120, 180].filter((v) => v <= max),
      isTimer: true,
      scaleMarks: [
        { val: 0, label: '0s' },
        { val: 30, label: '30s' },
        { val: 60, label: '1m' },
        { val: 120, label: '2m' },
        { val: 180, label: '3m' },
        { val: Math.min(max, 300), label: `${Math.round(Math.min(max, 300) / 60)}m` },
      ],
    };
  }

  if (t.includes('rpe') || t.includes('effort') || t.includes('intensity')) {
    return {
      title: 'RPE INTENSITY',
      unit: 'RPE',
      min: 1,
      max: 10,
      step: 0.5,
      highZoneStart: 8.5,
      presets: [6, 7, 7.5, 8, 8.5, 9, 9.5, 10],
      isTimer: false,
      scaleMarks: [
        { val: 1, label: '1' },
        { val: 3, label: '3' },
        { val: 5, label: '5' },
        { val: 7, label: '7' },
        { val: 8.5, label: '8.5' },
        { val: 10, label: '10' },
      ],
    };
  }

  if (t.includes('step')) {
    const max = Math.max(20000, maxVal || 30000);
    return {
      title: 'DAILY STEP TARGET',
      unit: 'STEPS',
      min: 1000,
      max: max,
      step: 250,
      highZoneStart: 12000,
      presets: [5000, 7500, 8000, 10000, 12000, 15000, 20000].filter((v) => v <= max),
      isTimer: false,
      scaleMarks: [
        { val: 0, label: '0' },
        { val: 5000, label: '5k' },
        { val: 10000, label: '10k' },
        { val: 15000, label: '15k' },
        { val: 20000, label: '20k' },
        { val: max, label: `${Math.round(max / 1000)}k` },
      ],
    };
  }

  if (t.includes('cal') || t.includes('kcal') || t.includes('burn')) {
    const max = Math.max(1500, maxVal || 3500);
    return {
      title: 'CALORIE GOAL',
      unit: 'KCAL',
      min: 100,
      max: max,
      step: 50,
      highZoneStart: Math.round(max * 0.8),
      presets: [400, 600, 800, 1000, 1500, 2000, 2500].filter((v) => v <= max),
      isTimer: false,
      scaleMarks: [
        { val: 0, label: '0' },
        { val: Math.round(max * 0.25), label: `${Math.round(max * 0.25)}` },
        { val: Math.round(max * 0.5), label: `${Math.round(max * 0.5)}` },
        { val: Math.round(max * 0.75), label: `${Math.round(max * 0.75)}` },
        { val: max, label: `${max}` },
      ],
    };
  }

  if (t.includes('dist') || t.includes('km') || t.includes('mile')) {
    const max = Math.max(10, maxVal || 42);
    return {
      title: 'DISTANCE TARGET',
      unit: 'KM',
      min: 0,
      max: max,
      step: 0.5,
      highZoneStart: Math.round(max * 0.75),
      presets: [3, 5, 8, 10, 15, 21].filter((v) => v <= max),
      isTimer: false,
      scaleMarks: [
        { val: 0, label: '0' },
        { val: Math.round(max * 0.25), label: `${Math.round(max * 0.25)}` },
        { val: Math.round(max * 0.5), label: `${Math.round(max * 0.5)}` },
        { val: Math.round(max * 0.75), label: `${Math.round(max * 0.75)}` },
        { val: max, label: `${max}k` },
      ],
    };
  }

  const effectiveMax = Math.max(10, maxVal || 100);
  return {
    title: (type || 'VALUE').toUpperCase(),
    unit: (type || 'VAL').toUpperCase(),
    min: 0,
    max: effectiveMax,
    step: 1,
    highZoneStart: Math.round(effectiveMax * 0.8),
    presets: [
      Math.round(effectiveMax * 0.25),
      Math.round(effectiveMax * 0.5),
      Math.round(effectiveMax * 0.75),
      effectiveMax,
    ],
    isTimer: false,
    scaleMarks: [
      { val: 0, label: '0' },
      { val: Math.round(effectiveMax * 0.25), label: `${Math.round(effectiveMax * 0.25)}` },
      { val: Math.round(effectiveMax * 0.5), label: `${Math.round(effectiveMax * 0.5)}` },
      { val: Math.round(effectiveMax * 0.75), label: `${Math.round(effectiveMax * 0.75)}` },
      { val: effectiveMax, label: `${effectiveMax}` },
    ],
  };
};

export const getDialConfig = (type: string, maxVal: number) => {
  const profile = getSupercarProfile(type, maxVal);
  const t = (type || '').toLowerCase();
  const isFoodGrams =
    t.includes('(g)') ||
    t.includes('gram') ||
    t.includes('food') ||
    t.includes('scale') ||
    t.includes('portion') ||
    t.includes('serving');

  return {
    category: profile.isTimer
      ? 'timer'
      : isFoodGrams
      ? 'food_grams'
      : t.includes('rep')
      ? 'reps'
      : t.includes('weight') || t.includes('kg')
      ? 'weight'
      : t.includes('rpe')
      ? 'rpe'
      : t.includes('step')
      ? 'steps'
      : 'generic',
    max: profile.max,
    min: profile.min,
    step: profile.step,
    unit: profile.unit,
    labels: profile.scaleMarks.map((m) => ({ value: m.val, label: m.label })),
    presets: profile.presets,
  };
};

export const RotaryDialModal: React.FC<RotaryDialModalProps> = ({
  isOpen,
  type,
  maxVal,
  initialVal,
  onConfirm,
  onClose,
}) => {
  const profile = getSupercarProfile(type, maxVal);
  const [val, setVal] = useState<number>(() => Math.max(profile.min, initialVal ?? profile.min));
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dialContainerRef = useRef<HTMLDivElement>(null);
  const prevAngleRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const clean = Math.max(profile.min, Math.min(profile.max, initialVal ?? profile.min));
      setVal(clean);
      setIsTimerRunning(false);
      setIsDragging(false);
      prevAngleRef.current = null;
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialVal, profile.min, profile.max]);

  // Timer countdown engine
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && profile.isTimer) {
      timer = setInterval(() => {
        setVal((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            haptic.pulse();
            playRealBellSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, profile.isTimer]);

  const snapAndSet = (raw: number) => {
    const clamped = Math.max(profile.min, Math.min(profile.max, raw));
    let snapped = clamped;
    if (profile.step >= 1) {
      snapped = Math.round(clamped / profile.step) * profile.step;
    } else {
      const inv = 1 / profile.step;
      snapped = Math.round(clamped * inv) / inv;
    }
    const finalVal = Math.round(snapped * 100) / 100;
    if (finalVal !== val) {
      haptic.tap();
      const pitch = 0.85 + (finalVal / Math.max(1, profile.max)) * 0.45;
      playDigitalCrownClick(pitch);
      setVal(finalVal);
    }
  };

  // Continuous Polar Angle Tracking
  const processPointer = (clientX: number, clientY: number) => {
    if (!dialContainerRef.current) return;
    const rect = dialContainerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Inner hub deadzone protection
    if (distance < 40) return;

    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (profile.isTimer) {
      const norm = (angleDeg + 90 + 360) % 360;
      if (prevAngleRef.current === null) {
        prevAngleRef.current = norm;
        return;
      }
      let delta = norm - prevAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      prevAngleRef.current = norm;
      const deltaSec = (delta / 360) * 60;
      snapAndSet(val + deltaSec);
      return;
    }

    // Gauge geometry: starts at 135° (7:30 o'clock) and sweeps 270° clockwise to 45° (4:30 o'clock)
    let relativeDeg = (angleDeg - 135 + 360) % 360;
    if (relativeDeg > 270) {
      // Bottom 90° deadzone: clamp smoothly to the nearest edge
      relativeDeg = relativeDeg > 315 ? 0 : 270;
    }
    const ratio = Math.max(0, Math.min(1, relativeDeg / 270));
    const targetVal = profile.min + ratio * (profile.max - profile.min);
    snapAndSet(targetVal);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    if (!dialContainerRef.current) return;
    const rect = dialContainerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 35 || dist > 170) return;

    setIsDragging(true);
    if (isTimerRunning) setIsTimerRunning(false);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    processPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    processPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      prevAngleRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleConfirm = () => {
    haptic.thump();
    onConfirm(val);
    onClose();
  };

  if (!isOpen) return null;

  // Geometry Specs (Clean circular scale)
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const outerBezelR = 140;
  const trackR = 118;
  const scaleNumbersR = 92;
  const centerHubR = 64;

  const startDeg = profile.isTimer ? -90 : 135;
  const totalSweep = profile.isTimer ? 360 : 270;
  const valRange = profile.max - profile.min;
  const progressRatio = valRange > 0 ? Math.max(0, Math.min(1, (val - profile.min) / valRange)) : 0;
  const isHighZone = val >= profile.highZoneStart;

  // Needle angle & tip
  const needleDeg = startDeg + progressRatio * totalSweep;
  const needleRad = (needleDeg * Math.PI) / 180;
  const needleBladeLen = trackR - 2;
  const needleTipX = cx + needleBladeLen * Math.cos(needleRad);
  const needleTipY = cy + needleBladeLen * Math.sin(needleRad);

  // Graduation Tick Marks
  const tickCount = 64;
  const tickMarks = Array.from({ length: tickCount }).map((_, i) => {
    const tRatio = i / (tickCount - 1);
    const tAngle = startDeg + tRatio * totalSweep;
    const rad = (tAngle * Math.PI) / 180;
    const isMajor = i % 8 === 0;
    const isSub = i % 2 === 0;
    const len = isMajor ? 12 : isSub ? 7 : 4;

    const x1 = cx + trackR * Math.cos(rad);
    const y1 = cy + trackR * Math.sin(rad);
    const x2 = cx + (trackR - len) * Math.cos(rad);
    const y2 = cy + (trackR - len) * Math.sin(rad);

    const isPassed = tAngle <= needleDeg + 0.5;
    const isTickHighZone = !profile.isTimer && profile.min + tRatio * valRange >= profile.highZoneStart;

    let className = 'stroke-zinc-400 dark:stroke-white/20';
    if (isPassed) {
      className = isTickHighZone ? 'stroke-red-500' : 'stroke-amber-500';
    } else if (isTickHighZone) {
      className = 'stroke-red-500/30';
    }

    return { x1, y1, x2, y2, className, strokeWidth: isMajor ? 2.2 : isSub ? 1.2 : 0.8 };
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-black/30 dark:bg-black/50 animate-in fade-in duration-150 select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container - Stripped of heavy frames and borders */}
      <div
        className="relative flex flex-col items-center w-full max-w-[360px] bg-[#F7F5F0] dark:bg-[#12151E] rounded-3xl p-5 shadow-lg text-zinc-900 dark:text-white overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-800 dark:text-zinc-200 uppercase">
            {profile.title}
          </span>

          {/* Nude / Bare Close X Button */}
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer active:scale-90"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Rotary Dial Canvas */}
        <div
          ref={dialContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-[300px] h-[300px] flex items-center justify-center select-none touch-none my-1 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
            {/* 1. Outer Dial Background - Frameless nude dial surface */}
            <circle
              cx={cx}
              cy={cy}
              r={outerBezelR}
              className="fill-[#EBE7DF] dark:fill-[#181B26]"
            />

            {/* 2. Graduation Ticks */}
            {tickMarks.map((t, idx) => (
              <line
                key={idx}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                className={t.className}
                strokeWidth={t.strokeWidth}
              />
            ))}

            {/* 3. Scale Marks & Numbers */}
            {profile.scaleMarks.map((mark, idx) => {
              const p = (mark.val - profile.min) / (valRange || 1);
              const markAngle = startDeg + p * totalSweep;
              const rad = (markAngle * Math.PI) / 180;
              const lx = cx + scaleNumbersR * Math.cos(rad);
              const ly = cy + scaleNumbersR * Math.sin(rad);
              const isMarkActive = Math.abs(val - mark.val) <= valRange / profile.scaleMarks.length / 1.8;

              return (
                <text
                  key={idx}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isMarkActive ? '12' : '10'}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={isMarkActive ? '700' : '500'}
                  className={
                    isMarkActive
                      ? 'fill-amber-500 font-bold'
                      : 'fill-zinc-600 dark:fill-zinc-400'
                  }
                >
                  {mark.label}
                </text>
              );
            })}

            {/* 4. Indicator Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={needleTipX}
              y2={needleTipY}
              className={isHighZone ? 'stroke-red-500' : 'stroke-amber-500'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* 5. Draggable Dot on the Track */}
            <circle
              cx={needleTipX}
              cy={needleTipY}
              r="6"
              className={isHighZone ? 'fill-red-500 stroke-[#F7F5F0] dark:stroke-[#12151E]' : 'fill-amber-500 stroke-[#F7F5F0] dark:stroke-[#12151E]'}
              strokeWidth="2"
            />

            {/* 6. Inner Center Hub - Frameless nude hub surface */}
            <circle
              cx={cx}
              cy={cy}
              r={centerHubR}
              className="fill-[#F7F5F0] dark:fill-[#12151E]"
            />
          </svg>

          {/* Central Digital Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
              {profile.unit}
            </span>

            {profile.isTimer ? (
              <div className="flex flex-col items-center mt-0.5">
                <span className="font-mono font-black text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight tabular-nums">
                  {`${Math.floor(val / 60)
                    .toString()
                    .padStart(2, '0')}:${(val % 60).toString().padStart(2, '0')}`}
                </span>
                {isTimerRunning && (
                  <span className="text-[9px] font-mono font-bold text-amber-500 tracking-wider uppercase mt-0.5">
                    RUNNING
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-baseline justify-center mt-0.5">
                <span
                  className={`font-mono font-black text-4xl sm:text-5xl tracking-tight tabular-nums ${
                    isHighZone ? 'text-red-500' : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  {val}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timer Controls (Only in Timer Mode) */}
        {profile.isTimer && (
          <div className="w-full flex items-center justify-between gap-2 my-2 px-1" onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                if (val <= 0) snapAndSet(60);
                setIsTimerRunning(!isTimerRunning);
              }}
              className={`flex-1 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isTimerRunning
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>PAUSE TIMER</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START TIMER</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                snapAndSet(initialVal || 60);
              }}
              className="px-2.5 py-2 text-xs font-mono font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>
        )}

        {/* Quick-Select Presets - Nude / Bare Numbers Buttons */}
        <div className="w-full my-3" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-1 no-scrollbar justify-center items-center">
            {profile.presets.map((pVal) => {
              const isSelected = val === pVal;
              return (
                <button
                  key={pVal}
                  type="button"
                  onClick={() => snapAndSet(pVal)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`px-1 py-1 text-xs font-mono transition-all shrink-0 cursor-pointer active:scale-90 ${
                    isSelected
                      ? 'text-amber-500 font-black scale-110 underline decoration-amber-500 decoration-2 underline-offset-4'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-semibold'
                  }`}
                >
                  {profile.isTimer
                    ? pVal < 60
                      ? `${pVal}s`
                      : `${Math.floor(pVal / 60)}m`
                    : profile.unit === 'KG'
                    ? `${pVal}kg`
                    : profile.unit === 'G'
                    ? `${pVal}g`
                    : `${pVal}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="w-full" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleConfirm}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer select-none"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {profile.isTimer
                ? `CONFIRM ${Math.floor(val / 60)
                    .toString()
                    .padStart(2, '0')}:${(val % 60).toString().padStart(2, '0')}`
                : `SET ${val} ${profile.unit}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RotaryDialModal;
