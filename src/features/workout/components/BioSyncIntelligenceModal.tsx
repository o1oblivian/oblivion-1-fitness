import React, { useState } from 'react';
import { X, Dna, Zap, Check, Activity, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface BioSyncIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoRegulate?: () => void;
  onShowToast?: (msg: string) => void;
}

type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';

interface PhaseMeta {
  title: string;
  daySpan: string;
  hormoneContext: string;
  powerImpact: string;
  rpeRecommendation: string;
  restInterval: string;
  rpeOffset: string;
}

const PHASE_DETAILS: Record<CyclePhase, PhaseMeta> = {
  MENSTRUAL: {
    title: 'Baseline System Deload // Early Follicular',
    daySpan: 'Days 01–05',
    hormoneContext: 'Estrogen and progesterone at physiological baseline.',
    powerImpact: 'Conservative load tolerance. Emphasize joint mobility and steady-state cardiac flush.',
    rpeRecommendation: 'Target RPE 6.5–7.0 (RIR 3–4). Auto-regulate down -5% on max loads.',
    restInterval: '120–150s extended recovery',
    rpeOffset: '-0.5 RPE',
  },
  FOLLICULAR: {
    title: 'Anabolic Ramp // High Work Capacity',
    daySpan: 'Days 06–13',
    hormoneContext: 'Ascending estradiol stimulates insulin sensitivity & glycogen storage.',
    powerImpact: 'Superior recovery kinetics between sets. Prime phase for hyper-trophy volume.',
    rpeRecommendation: 'Target RPE 7.5–8.5 (RIR 2). Progressive overload on core lifts.',
    restInterval: '90–120s optimal ATP replenishment',
    rpeOffset: '+0.5 RPE',
  },
  OVULATORY: {
    title: 'Peak Estrogen Window // Max Neuromuscular Recruitment',
    daySpan: 'Days 14–16',
    hormoneContext: 'Peak estradiol surge promotes maximal motor unit firing frequency.',
    powerImpact: 'Maximum force production and peak rate of force development (RFD).',
    rpeRecommendation: 'Target RPE 8.5–9.5 (RIR 1). Prime window for heavy PR attempts.',
    restInterval: '120–180s high CNS replenishment',
    rpeOffset: '+1.0 RPE (PEAK)',
  },
  LUTEAL: {
    title: 'Elevated Progesterone // Metabolic Endurance Shift',
    daySpan: 'Days 17–28',
    hormoneContext: 'Progesterone elevation increases core temperature and amino acid oxidation.',
    powerImpact: 'Higher cardiovascular strain. Shift towards hypertrophy volume and moderate load.',
    rpeRecommendation: 'Target RPE 7.0–8.0 (RIR 2–3). Prioritize intra-workout electrolytes.',
    restInterval: '90–120s structured pacing',
    rpeOffset: 'BASELINE',
  },
};

export const BioSyncIntelligenceModal: React.FC<BioSyncIntelligenceModalProps> = ({
  isOpen,
  onClose,
  onAutoRegulate,
  onShowToast,
}) => {
  const [activePhase, setActivePhase] = useState<CyclePhase>('OVULATORY');
  const [regulated, setRegulated] = useState(false);

  if (!isOpen) return null;

  const currentMeta = PHASE_DETAILS[activePhase];

  const handleAutoRegulate = () => {
    tactileEngine.playPRCelebration();
    setRegulated(true);
    if (onAutoRegulate) onAutoRegulate();
    onShowToast?.(`Bio-Sync auto-regulated: workout intensity calibrated to ${activePhase} profile.`);
    setTimeout(() => {
      onClose();
    }, 850);
  };

  return (
    <div
      id="biosync-intelligence-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60000] bg-black/80 flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#09090b] text-white w-full max-w-[480px] rounded-t-3xl md:rounded-3xl border border-white/10 flex flex-col overflow-y-auto shadow-2xl p-5 space-y-4 max-h-[88dvh] h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tactical font-bold text-sm tracking-wider uppercase text-white">
                  Bio-Sync Intelligence
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-purple-400">
                  ENDOCRINE
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">Endocrine Rhythm &amp; Neuromuscular Peaking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase Timeline Pushers (4-Slot Tactical Bar) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            <span>Biological Cycle Phase</span>
            <span className="text-purple-400 font-mono">{currentMeta.daySpan}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
            {(
              [
                { id: 'MENSTRUAL', label: 'Menstrual', code: '01-05' },
                { id: 'FOLLICULAR', label: 'Follicular', code: '06-13' },
                { id: 'OVULATORY', label: 'Ovulatory', code: '14-16' },
                { id: 'LUTEAL', label: 'Luteal', code: '17-28' },
              ] as const
            ).map((p) => {
              const isActive = activePhase === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setActivePhase(p.id);
                  }}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-purple-300 border border-purple-500/40 shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold block">{p.label}</span>
                  <span className="text-[9px] font-mono opacity-70 block">{p.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Intelligence Spotlight Card (Zero Dark Fog) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
              {currentMeta.daySpan} • {activePhase}
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              OFFSET: {currentMeta.rpeOffset}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-tactical font-bold text-white leading-snug">
              {currentMeta.title}
            </h4>
            <p className="text-xs font-sans text-neutral-300 mt-1 leading-relaxed">
              {currentMeta.hormoneContext}
            </p>
          </div>

          {/* Neuromuscular Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                RECOVERY WINDOW
              </span>
              <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                {currentMeta.restInterval}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                TARGET INTENSITY
              </span>
              <span className="text-xs font-mono font-bold text-purple-400 mt-0.5 block">
                {currentMeta.rpeRecommendation.split(' ')[1] || 'RPE 8.5'}
              </span>
            </div>
          </div>
        </div>

        {/* Auto-Regulation Recommendation Box */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-neutral-300 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Prescribed Bio-Sync Calibration:</span>
          </span>
          <p className="text-[11px] text-neutral-300 font-sans pl-5">
            {currentMeta.powerImpact}
          </p>
        </div>

        {/* Master Auto-Regulate Trigger */}
        <button
          type="button"
          onClick={handleAutoRegulate}
          className={`w-full py-3 px-5 rounded-xl font-tactical font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm ${
            regulated
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
              : 'bg-[#C4121A] hover:bg-[#a30f16] active:bg-[#800C11] text-white shadow-red-950/20'
          }`}
        >
          {regulated ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>RPE AUTO-REGULATION ENGAGED</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>ENGAGE BIO-SYNC AUTO-REGULATION</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BioSyncIntelligenceModal;
