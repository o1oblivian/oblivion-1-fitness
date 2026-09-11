import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, HeartPulse, Activity,
  Timer, Check, Flame, ShieldCheck, Disc, Waves, Sparkles,
  Battery, Layers, Target, Bell, ArrowRight, ChevronRight
} from 'lucide-react';
import { haptic } from '../utils/haptics';

export type RecoveryCategoryMode =
  | 'mobility'
  | 'stretching'
  | 'taichi'
  | 'pilates'
  | 'yoga'
  | 'fascia'
  | 'thermal'
  | 'flush'
  | 'sleep'
  | 'decompression';

export interface RecoveryPracticeConfig {
  mode: RecoveryCategoryMode;
  categoryTitle: string;
  tag: string;
  exerciseName?: string;
  description: string;
  defaultDurationSeconds?: number;
}

interface RecoveryPracticeDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecoveryPracticeConfig;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

// Custom Audio Chime Generator using Web Audio API
function playChime(type: 'phase' | 'tick' | 'bell' | 'complete') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'phase') {
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } else if (type === 'bell') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now); // 528Hz Solfeggio clarity frequency
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.1, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.5);
      });
    }
  } catch {
    // audio errors suppressed
  }
}

export const RecoveryPracticeDeckModal: React.FC<RecoveryPracticeDeckModalProps> = ({
  isOpen,
  onClose,
  config,
  showToast,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [targetDuration, setTargetDuration] = useState(config.defaultDurationSeconds || 60);
  const [currentSide, setCurrentSide] = useState<'Left' | 'Right' | 'Both'>('Left');
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  // Category-specific states
  const [selectedJoint, setSelectedJoint] = useState('Hips');
  const [selectedMuscle, setSelectedMuscle] = useState('Glutes & Piriformis');
  const [selectedThermalMode, setSelectedThermalMode] = useState<'cold' | 'sauna' | 'contrast'>('cold');
  const [thermalTemp, setThermalTemp] = useState<number>(6); // 6°C cold plunge
  const [pilatesPumps, setPilatesPumps] = useState<number>(0);
  const [isContractPhase, setIsContractPhase] = useState<boolean>(false); // for PNF

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset when modal opens or config changes
  useEffect(() => {
    if (isOpen) {
      setIsRunning(false);
      setSecondsElapsed(0);
      setIsCompleted(false);
      setActivePhaseIndex(0);
      setPilatesPumps(0);
      setIsContractPhase(false);

      // Set defaults according to mode
      if (config.mode === 'stretching') {
        setTargetDuration(45);
        setCurrentSide('Left');
      } else if (config.mode === 'mobility') {
        setTargetDuration(60);
        setCurrentSide('Left');
      } else if (config.mode === 'thermal') {
        setTargetDuration(180); // 3 mins default cold plunge
        setCurrentSide('Both');
      } else if (config.mode === 'decompression') {
        setTargetDuration(45); // 45s dead hang
        setCurrentSide('Both');
      } else if (config.mode === 'pilates') {
        setTargetDuration(100); // The hundred 100 pumps
        setCurrentSide('Both');
      } else if (config.mode === 'taichi') {
        setTargetDuration(180); // 3 mins standing stake
        setCurrentSide('Both');
      } else if (config.mode === 'fascia') {
        setTargetDuration(90); // 90s ischemic compression
        setCurrentSide('Left');
      } else {
        setTargetDuration(config.defaultDurationSeconds || 60);
        setCurrentSide('Both');
      }
    }
  }, [isOpen, config]);

  // Main countdown/stopwatch runner
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;

          // For Pilates pump tracking
          if (config.mode === 'pilates') {
            setPilatesPumps((p) => Math.min(100, p + 1));
            if (audioEnabled && next % 5 === 0) {
              playChime('tick');
            }
          }

          // For PNF stretching contract/relax phase cycle
          if (config.mode === 'stretching') {
            // 20s stretch -> 7s contract -> 30s deep stretch
            const cycleSec = next % 57;
            if (cycleSec === 20) {
              setIsContractPhase(true);
              if (audioEnabled) playChime('phase');
              haptic.thump();
            } else if (cycleSec === 27) {
              setIsContractPhase(false);
              if (audioEnabled) playChime('bell');
              haptic.pulse();
            }
          }

          // Phase transition chimes
          if (next >= targetDuration) {
            setIsRunning(false);
            setIsCompleted(true);
            if (audioEnabled) playChime('complete');
            haptic.success();
            return targetDuration;
          }

          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetDuration, config.mode, audioEnabled]);

  const handleTogglePlay = useCallback(() => {
    haptic.tap();
    if (isCompleted) {
      setSecondsElapsed(0);
      setIsCompleted(false);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  }, [isCompleted]);

  const handleReset = useCallback(() => {
    haptic.tap();
    setIsRunning(false);
    setSecondsElapsed(0);
    setIsCompleted(false);
    setPilatesPumps(0);
    setIsContractPhase(false);
  }, []);

  const handleSwitchSide = useCallback(() => {
    haptic.tap();
    if (audioEnabled) playChime('phase');
    setCurrentSide((prev) => (prev === 'Left' ? 'Right' : 'Left'));
    setSecondsElapsed(0);
    setIsCompleted(false);
  }, [audioEnabled]);

  if (!isOpen) return null;

  const secondsLeft = Math.max(0, targetDuration - secondsElapsed);
  const progressPercent = Math.min(100, (secondsElapsed / targetDuration) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              {config.mode === 'mobility' && <Activity className="w-4.5 h-4.5" />}
              {config.mode === 'stretching' && <Timer className="w-4.5 h-4.5" />}
              {config.mode === 'taichi' && <Sparkles className="w-4.5 h-4.5" />}
              {config.mode === 'pilates' && <Target className="w-4.5 h-4.5" />}
              {config.mode === 'yoga' && <HeartPulse className="w-4.5 h-4.5" />}
              {config.mode === 'fascia' && <Disc className="w-4.5 h-4.5" />}
              {config.mode === 'thermal' && <Flame className="w-4.5 h-4.5" />}
              {config.mode === 'flush' && <Waves className="w-4.5 h-4.5" />}
              {config.mode === 'sleep' && <Battery className="w-4.5 h-4.5" />}
              {config.mode === 'decompression' && <Layers className="w-4.5 h-4.5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold tracking-tight text-white truncate">
                  {config.categoryTitle}
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                  {config.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {config.exerciseName || config.description}
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

        {/* Dynamic Practice Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Practice Specific Context Selector */}
          {config.mode === 'mobility' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Target Joint Capsule
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {['Hips', 'Shoulders', 'Thoracic Spine', 'Ankles', 'Wrists', 'Cervical Neck'].map((joint) => (
                  <button
                    key={joint}
                    onClick={() => {
                      haptic.tap();
                      setSelectedJoint(joint);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedJoint === joint
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {joint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.mode === 'thermal' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Thermal Exposure Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'cold' as const, label: 'Cold Plunge', temp: '4-8°C', secs: 180 },
                  { id: 'sauna' as const, label: 'Finnish Sauna', temp: '85-95°C', secs: 900 },
                  { id: 'contrast' as const, label: 'Contrast Ratio', temp: 'Heat/Cold', secs: 600 },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic.tap();
                      setSelectedThermalMode(item.id);
                      setTargetDuration(item.secs);
                      setSecondsElapsed(0);
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedThermalMode === item.id
                        ? 'bg-zinc-800 border-red-500/50 text-white'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className="text-[10px] font-mono text-zinc-500">{item.temp}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.mode === 'fascia' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Myofascial Trigger Group
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {['Glutes & Piriformis', 'Thoracic Spine', 'IT Band / TFL', 'Lats & Teres', 'Plantar Fascia', 'Pecs & Delts'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      haptic.tap();
                      setSelectedMuscle(m);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedMuscle === m
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Central Interactive Cadence Ring & Timer */}
          <div className="relative py-6 flex flex-col items-center justify-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
            {/* Circular Progress Display */}
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
                  stroke="#DC2626"
                  strokeWidth="8"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {config.mode === 'pilates' ? (
                  <>
                    <span className="text-3xl font-mono font-extrabold tracking-tight text-white">
                      {pilatesPumps} / 100
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                      Pumps Complete
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-mono font-extrabold tracking-tight text-white">
                      {formatTime(secondsLeft)}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                      {isCompleted ? 'Complete' : isRunning ? 'Remaining' : 'Interval Target'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sub-status Indicator */}
            <div className="mt-3 flex items-center gap-2">
              {config.mode === 'stretching' && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  isContractPhase
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {isContractPhase ? 'Contract & Push (7s @ 20%)' : 'Passive Stretch & Exhale'}
                </span>
              )}

              {(config.mode === 'stretching' || config.mode === 'mobility' || config.mode === 'fascia') && (
                <button
                  type="button"
                  onClick={handleSwitchSide}
                  className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Side: {currentSide}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}

              {config.mode === 'decompression' && (
                <span className="text-xs font-semibold text-zinc-400">
                  Relax lats & lumbar spine • Zero active pulling
                </span>
              )}

              {config.mode === 'thermal' && (
                <span className="text-xs font-semibold text-zinc-400">
                  {selectedThermalMode === 'cold'
                    ? 'Slow nasal breaths • Inhibit cold gasp'
                    : 'Relax vascular tone • Stay hydrated'}
                </span>
              )}

              {config.mode === 'taichi' && (
                <span className="text-xs font-semibold text-zinc-400">
                  Sink elbows • Root through the bubbling well
                </span>
              )}
            </div>
          </div>

          {/* Biomechanical Coaching Cues Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              <span>Biomechanical Protocol & Guidelines</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {config.mode === 'mobility' &&
                `Isolate the ${selectedJoint} joint through its complete circular perimeter. Maintain 30% irradiation throughout your abdominal wall to prevent compensatory torso twisting.`}
              {config.mode === 'stretching' &&
                'Inhale to lengthen the muscle. During the contraction phase, push gently into resistance. On the release exhale, allow the muscle spindle to relax 2-3cm deeper.'}
              {config.mode === 'pilates' &&
                'Maintain neutral pelvis and active transverse abdominis contraction. Pump arms briskly from the shoulders with rhythmic 5-beat nasal inhales and 5-beat pursed-lip exhales.'}
              {config.mode === 'taichi' &&
                'Align the crown of your head with the ceiling. Soften the knees, drop the tailbone, and cultivate slow continuous torque throughout the myofascial kinetic chain.'}
              {config.mode === 'thermal' &&
                'Deliberate cold exposure triggers rapid noradrenaline release and increases brown fat thermogenesis. Take deep physiological sighs to maintain autonomic control.'}
              {config.mode === 'fascia' &&
                `Apply sustained 60-90s ischemic compression directly onto trigger knots in the ${selectedMuscle}. Avoid rapid aggressive rolling; allow deep tissue viscoelastic relaxation.`}
              {config.mode === 'decompression' &&
                'Dead hangs allow gravitational distraction of the intervertebral discs and decompress the brachial plexus. Maintain soft breathing and loose hip flexors.'}
              {config.mode === 'flush' &&
                'Active recovery flush promotes venous return and lymphatic clearance without generating metabolic waste or muscular microtrauma.'}
              {config.mode === 'sleep' &&
                'Perform 5 rounds of physiological sighing (double sharp inhale through nose followed by long slow mouth sigh) to rapidly activate parasympathetic vagal braking.'}
              {config.mode === 'yoga' &&
                'Synchronize movement to breath. Hold peak asana alignment for 5 steady diaphragmatic breaths before flowing into the next posture.'}
            </p>
          </div>

          {/* Quick Duration Stepper Controls */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Interval Target
            </span>
            <div className="flex items-center gap-1">
              {[30, 45, 60, 90, 120, 180].map((secs) => (
                <button
                  key={secs}
                  onClick={() => {
                    haptic.tap();
                    setTargetDuration(secs);
                    setSecondsElapsed(0);
                    setIsCompleted(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    targetDuration === secs
                      ? 'bg-zinc-200 text-zinc-950 dark:bg-white dark:text-black shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {secs >= 60 ? `${secs / 60}m` : `${secs}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="h-11 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
              isRunning
                ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Session</span>
              </>
            ) : isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restart Practice</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start {config.categoryTitle}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
