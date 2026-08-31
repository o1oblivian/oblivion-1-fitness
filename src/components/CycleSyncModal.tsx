import React, { useState, useEffect } from 'react';
import { X, Droplet, Flame, Zap, Moon, Sun, Activity, ChevronRight, Calendar } from 'lucide-react';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleData {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  symptoms: { date: string; energy: number; mood: number; cramps: number; sleep: number };
}

const PHASE_INFO: Record<CyclePhase, {
  name: string;
  days: string;
  color: string;
  bgColor: string;
  icon: typeof Moon;
  description: string;
  training: string[];
  avoid: string[];
  focus: string;
}> = {
  menstrual: {
    name: 'Menstrual',
    days: 'Days 1-5',
    color: '#4285F4',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    icon: Moon,
    description: 'Low estrogen and progesterone. Energy may be low — listen to your body.',
    training: ['Gentle mobility & stretching', 'Light yoga or pilates', 'Walk Zone 2 cardio', 'Low-intensity skill work'],
    avoid: ['Heavy PR attempts', 'Max-intensity intervals', 'High-impact plyometrics'],
    focus: 'Recovery & restoration',
  },
  follicular: {
    name: 'Follicular',
    days: 'Days 6-14',
    color: '#30D158',
    bgColor: 'rgba(48, 209, 88, 0.15)',
    icon: Sun,
    description: 'Rising estrogen. Energy and strength are climbing — ideal for pushing hard.',
    training: ['Heavy strength training', 'PR attempt window', 'High-intensity intervals', 'New skill learning'],
    avoid: ['Excessive volume without deload', 'Skipping warm-up on heavy days'],
    focus: 'Strength & power building',
  },
  ovulation: {
    name: 'Ovulation',
    days: 'Days 15-18',
    color: '#FF9F0A',
    bgColor: 'rgba(255, 159, 10, 0.15)',
    icon: Zap,
    description: 'Peak estrogen. Maximum power output and energy. Your strongest window.',
    training: ['Explosive power movements', 'Olympic lifts & complexes', 'Sprint intervals', 'Complex multi-joint exercises'],
    avoid: ['Long endurance sessions (recovery cost is higher)', 'Overtraining — short intense sessions are optimal'],
    focus: 'Peak performance & power',
  },
  luteal: {
    name: 'Luteal',
    days: 'Days 19-28',
    color: '#FF453A',
    bgColor: 'rgba(255, 69, 58, 0.15)',
    icon: Flame,
    description: 'High progesterone, then declining. Metabolism rises. Moderate intensity is optimal.',
    training: ['Moderate hypertrophy (8-12 reps)', 'Steady-state cardio', 'Progressive deload toward end', 'Core & stability work'],
    avoid: ['Max-effort lifts late in phase', 'New PRs in final days', 'High-sugar cravings — prioritize protein'],
    focus: 'Hypertrophy & consistency',
  },
};

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

interface CycleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUserEmail: string;
}

export const CycleSyncModal: React.FC<CycleSyncModalProps> = ({ isOpen, onClose, showToast, currentUserEmail }) => {
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [setupStart, setSetupStart] = useState('');
  const [setupCycleLen, setSetupCycleLen] = useState(28);
  const [setupPeriodLen, setSetupPeriodLen] = useState(5);
  const [currentDay, setCurrentDay] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase>('menstrual');

  const storageKey = `lumina_cycle_${currentUserEmail}`;

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data: CycleData = JSON.parse(raw);
        setCycleData(data);
        computePhase(data);
      }
    } catch (e) {}
  }, [isOpen, storageKey]);

  const computePhase = (data: CycleData) => {
    const start = new Date(data.lastPeriodStart);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dayInCycle = ((diffDays % data.cycleLength) + data.cycleLength) % data.cycleLength;
    setCurrentDay(dayInCycle + 1);

    if (dayInCycle < data.periodLength) {
      setCurrentPhase('menstrual');
    } else if (dayInCycle < 14) {
      setCurrentPhase('follicular');
    } else if (dayInCycle < 18) {
      setCurrentPhase('ovulation');
    } else {
      setCurrentPhase('luteal');
    }
  };

  const handleSave = () => {
    if (!setupStart) {
      showToast?.('Select your period start date', 'error');
      return;
    }
    const data: CycleData = {
      lastPeriodStart: setupStart,
      cycleLength: setupCycleLen,
      periodLength: setupPeriodLen,
      symptoms: { date: new Date().toISOString().slice(0, 10), energy: 3, mood: 3, cramps: 1, sleep: 3 },
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {}
    setCycleData(data);
    computePhase(data);
    showToast?.('Cycle tracking activated', 'success');
  };

  const handleLogPeriod = () => {
    if (!cycleData) return;
    const today = new Date().toISOString().slice(0, 10);
    const updated = { ...cycleData, lastPeriodStart: today };
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}
    setCycleData(updated);
    computePhase(updated);
    showToast?.('Period started — cycle reset', 'success');
  };

  if (!isOpen) return null;

  const phaseInfo = PHASE_INFO[currentPhase];
  const PhaseIcon = phaseInfo.icon;

  // Phase progress bar position
  const phaseStartDay = currentPhase === 'menstrual' ? 0 : currentPhase === 'follicular' ? 5 : currentPhase === 'ovulation' ? 14 : 18;
  const phaseEndDay = currentPhase === 'menstrual' ? (cycleData?.periodLength || 5) : currentPhase === 'follicular' ? 14 : currentPhase === 'ovulation' ? 18 : (cycleData?.cycleLength || 28);
  const cycleLen = cycleData?.cycleLength || 28;
  const phaseProgress = ((currentDay - phaseStartDay) / (phaseEndDay - phaseStartDay)) * 100;

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#14171F] border-t sm:border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-t-[32px] sm:rounded-[28px] shadow-2xl max-h-[90vh] overflow-y-auto pb-28"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#14171F]/95 backdrop-blur-md border-b border-[rgba(0,0,0,0.08)] dark:border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4" style={{ color: phaseInfo.color }} />
            <h2 className="text-sm font-black text-white tracking-tight">Cycle Sync</h2>
          </div>
          <button onClick={onClose} className="btn-nude-close" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── SETUP (no data) ─── */}
        {!cycleData && (
          <div className="p-3.5 space-y-3">
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(139, 92, 246, 0.2)', border: '2px solid rgba(139, 92, 246, 0.4)' }}>
                <Droplet className="w-8 h-8 text-[#4285F4]" />
              </div>
              <h3 className="text-lg font-black text-white">Sync Your Training to Your Cycle</h3>
              <p className="text-sm text-white/50 mt-1 leading-relaxed">Track your menstrual cycle and get phase-optimized workout recommendations. Your data stays on your device.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 mb-2 block">When did your last period start?</label>
                <input
                  type="date"
                  value={setupStart}
                  onChange={(e) => setSetupStart(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#4285F4]/50 transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 mb-2 block">Cycle Length</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    <button onClick={() => setSetupCycleLen(Math.max(21, setupCycleLen - 1))} className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">-</button>
                    <span className="flex-1 text-center text-sm font-bold text-white">{setupCycleLen} days</span>
                    <button onClick={() => setSetupCycleLen(Math.min(40, setupCycleLen + 1))} className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 mb-2 block">Period Length</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    <button onClick={() => setSetupPeriodLen(Math.max(2, setupPeriodLen - 1))} className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">-</button>
                    <span className="flex-1 text-center text-sm font-bold text-white">{setupPeriodLen} days</span>
                    <button onClick={() => setSetupPeriodLen(Math.min(10, setupPeriodLen + 1))} className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">+</button>
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className="w-full py-3.5 rounded-2xl bg-[#4285F4] hover:bg-[#4285F4] text-white font-black text-sm active:scale-95 transition-all shadow-lg cursor-pointer">
                Activate Cycle Tracking
              </button>
            </div>
          </div>
        )}

        {/* ─── CYCLE DASHBOARD (has data) ─── */}
        {cycleData && (
          <div className="p-4 space-y-4">
            {/* Current Phase Hero */}
            <div className="rounded-3xl p-4" style={{ background: phaseInfo.bgColor, border: `1px solid ${phaseInfo.color}40` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${phaseInfo.color}30` }}>
                  <PhaseIcon className="w-6 h-6" style={{ color: phaseInfo.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{phaseInfo.name} Phase</h3>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: `${phaseInfo.color}30`, color: phaseInfo.color }}>{phaseInfo.days}</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/50">Day {currentDay} of {cycleLen}</span>
                </div>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-3">{phaseInfo.description}</p>

              {/* Cycle progress bar */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                {PHASE_ORDER.map((p) => {
                  const info = PHASE_INFO[p];
                  const pStart = p === 'menstrual' ? 0 : p === 'follicular' ? 5 : p === 'ovulation' ? 14 : 18;
                  const pEnd = p === 'menstrual' ? cycleData.periodLength : p === 'follicular' ? 14 : p === 'ovulation' ? 18 : cycleLen;
                  const width = ((pEnd - pStart) / cycleLen) * 100;
                  return (
                    <div
                      key={p}
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${width}%`,
                        background: currentPhase === p ? info.color : `${info.color}30`,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Training Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">Training Recommendations</span>
              </div>

              <div className="bg-[#30D158]/10 border border-[#30D158]/20 rounded-2xl p-3 space-y-2">
                <span className="text-xs font-bold text-[#30D158]">Do This</span>
                {phaseInfo.training.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <ChevronRight className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-2xl p-3 space-y-2">
                <span className="text-xs font-bold text-[#FF453A]">Avoid / Modify</span>
                {phaseInfo.avoid.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <X className="w-3.5 h-3.5 text-[#FF453A] shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/40">Focus</span>
                  <p className="text-sm font-bold text-white mt-0.5">{phaseInfo.focus}</p>
                </div>
              </div>
            </div>

            {/* All Phases Overview */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">Your Cycle Map</span>
              <div className="grid grid-cols-4 gap-2">
                {PHASE_ORDER.map((p) => {
                  const info = PHASE_INFO[p];
                  const Icon = info.icon;
                  const isActive = currentPhase === p;
                  return (
                    <div
                      key={p}
                      className="rounded-2xl p-2.5 text-center transition-all"
                      style={{
                        background: isActive ? info.bgColor : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? `${info.color}50` : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: isActive ? info.color : 'rgba(255,255,255,0.3)' }} />
                      <span className="block text-[10px] font-bold" style={{ color: isActive ? info.color : 'rgba(255,255,255,0.4)' }}>{info.name}</span>
                      <span className="block text-[8px] font-mono text-white/30 mt-0.5">{info.days}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Log Period Button */}
            <button
              onClick={handleLogPeriod}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-[#4285F4]" />
              Log Period Started Today
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
