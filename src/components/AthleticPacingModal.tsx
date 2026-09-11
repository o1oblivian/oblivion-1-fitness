import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Timer, Zap,
  Activity, Flame, Trophy, ShieldCheck, ChevronRight
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface AthleticPacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sportName?: string;
  categoryTitle?: string;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

function playSportBuzzer(type: 'work' | 'rest' | 'countdown') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'countdown') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'work') {
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'rest') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // audio errors suppressed
  }
}

export const AthleticPacingModal: React.FC<AthleticPacingModalProps> = ({
  isOpen,
  onClose,
  sportName = 'Hyrox 1km Run Interval',
  categoryTitle = 'Sports & Hybrid Conditioning',
  showToast,
}) => {
  const [workSeconds, setWorkSeconds] = useState(40);
  const [restSeconds, setRestSeconds] = useState(20);
  const [totalRounds, setTotalRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<'work' | 'rest'>('work');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(40);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Target Cadence / Pace calculator
  const [targetCadence, setTargetCadence] = useState(85); // RPM / SPM

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRunning(false);
      setCurrentRound(1);
      setCurrentPhase('work');
      setPhaseSecondsLeft(workSeconds);
      setIsCompleted(false);
    }
  }, [isOpen, workSeconds]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition between Work and Rest
            if (currentPhase === 'work') {
              if (currentRound >= totalRounds) {
                setIsRunning(false);
                setIsCompleted(true);
                if (audioEnabled) playSportBuzzer('work');
                haptic.success();
                return 0;
              }
              setCurrentPhase('rest');
              if (audioEnabled) playSportBuzzer('rest');
              haptic.pulse();
              return restSeconds;
            } else {
              setCurrentRound((r) => r + 1);
              setCurrentPhase('work');
              if (audioEnabled) playSportBuzzer('work');
              haptic.pulse();
              return workSeconds;
            }
          }

          if (prev <= 4 && audioEnabled) {
            playSportBuzzer('countdown');
            haptic.tap();
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentPhase, currentRound, totalRounds, workSeconds, restSeconds, audioEnabled]);

  const handleToggle = useCallback(() => {
    haptic.tap();
    if (isCompleted) {
      setCurrentRound(1);
      setCurrentPhase('work');
      setPhaseSecondsLeft(workSeconds);
      setIsCompleted(false);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  }, [isCompleted, workSeconds]);

  const handleReset = useCallback(() => {
    haptic.tap();
    setIsRunning(false);
    setCurrentRound(1);
    setCurrentPhase('work');
    setPhaseSecondsLeft(workSeconds);
    setIsCompleted(false);
  }, [workSeconds]);

  if (!isOpen) return null;

  const currentTotalPhase = currentPhase === 'work' ? workSeconds : restSeconds;
  const progressPercent = Math.min(
    100,
    ((currentTotalPhase - phaseSecondsLeft) / currentTotalPhase) * 100
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold tracking-tight text-white truncate">
                  {categoryTitle}
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                  Pacing OS
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {sportName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setAudioEnabled(!audioEnabled);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                audioEnabled ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-600'
              }`}
              title={audioEnabled ? 'Audio Chimes On' : 'Audio Chimes Muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pacing Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Round & Interval Counter */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                Current Round
              </span>
              <span className="text-xl font-mono font-bold text-white">
                Round {currentRound} of {totalRounds}
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                currentPhase === 'work'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {currentPhase === 'work' ? 'Sprint / Work Interval' : 'Active Rest Flush'}
            </span>
          </div>

          {/* Central Interval Clock */}
          <div className="relative py-6 flex flex-col items-center justify-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={currentPhase === 'work' ? '#DC2626' : '#10B981'}
                  strokeWidth="8"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-mono font-extrabold tracking-tight text-white">
                  {phaseSecondsLeft}s
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                  {currentPhase === 'work' ? 'Work Interval' : 'Rest Window'}
                </span>
              </div>
            </div>
          </div>

          {/* Interval Configuration Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Preset Interval Format
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Tabata (20s / 10s)', work: 20, rest: 10, rounds: 8 },
                { label: 'Hyrox (40s / 20s)', work: 40, rest: 20, rounds: 6 },
                { label: 'EMOM (50s / 10s)', work: 50, rest: 10, rounds: 10 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    haptic.tap();
                    setWorkSeconds(preset.work);
                    setRestSeconds(preset.rest);
                    setTotalRounds(preset.rounds);
                    setPhaseSecondsLeft(preset.work);
                    setCurrentRound(1);
                    setCurrentPhase('work');
                    setIsRunning(false);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    workSeconds === preset.work && restSeconds === preset.rest
                      ? 'bg-zinc-800 border-amber-500/50 text-white'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label.split(' ')[0]}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{preset.work}s/{preset.rest}s</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cadence & Strategy Guidelines */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Athletic Split & Cadence Cues</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Target a stable anaerobic threshold cadence during work intervals. Never exceed 90% HRmax in round 1; build progressive stroke rate or speed split over the final 3 rounds.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="h-11 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleToggle}
            className={`flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
              isRunning
                ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'
                : 'bg-amber-500 hover:bg-amber-600 text-black font-extrabold'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Interval</span>
              </>
            ) : isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restart Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Pacer (Round {currentRound})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
