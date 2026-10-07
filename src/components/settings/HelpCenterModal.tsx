import React, { useState } from 'react';
import { X, BookOpen, Activity, Zap, Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MANUAL_TOPICS = [
  {
    id: 'telemetry',
    icon: Activity,
    title: 'Workout & Biometric Telemetry',
    summary: 'RPE, RIR & Barbell Math',
    desc: 'Oblivion 1 dynamically computes 1RM, volume tonnage, and fatigue index based on your logged Reps in Reserve (RIR) and Rate of Perceived Exertion (RPE). Barbell defaults include a 20kg Olympic bar standard.',
  },
  {
    id: 'fuel',
    icon: Zap,
    title: 'Fuel OS Macro Intelligence',
    summary: 'Precision Calorie & Macro Target Split',
    desc: 'Fuel OS calculates maintenance, surplus, or deficit caloric targets according to your athlete profile. Use the Quick-Add or Optical Meal Scanner to log meals directly into your daily nutritional ledger.',
  },
  {
    id: 'radar',
    icon: Compass,
    title: 'Buddy Radar & Privacy Matrix',
    summary: '5km Proximity & Spotter Matching',
    desc: 'The Radar scans for verified athletes within your facility or 5km perimeter. Incognito mode allows you to train privately without broadcasting telemetry to other nearby members.',
  },
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [expanded, setExpanded] = useState<string | null>('telemetry');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl flex flex-col overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-o1-crimson/10 border border-o1-crimson/30">
              <BookOpen className="w-4 h-4 text-o1-crimson" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-tactical">Help &amp; Telemetry Manual</h2>
              <p className="text-[10px] font-mono text-neutral-500">Oblivion 1 Athlete OS Knowledge Base</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-o1-well border border-white/[0.07] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar py-4 space-y-3 flex-1 text-xs">
          {MANUAL_TOPICS.map((t) => {
            const isExp = expanded === t.id;
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className="rounded-2xl border border-white/[0.07] bg-o1-well overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setExpanded(isExp ? null : t.id);
                  }}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-o1-crimson shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs font-tactical">{t.title}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono">{t.summary}</p>
                    </div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />}
                </button>
                {isExp && (
                  <div className="px-3.5 pb-3.5 pt-1 text-[11px] font-mono text-neutral-300 leading-relaxed border-t border-white/[0.05]">
                    {t.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 text-xs font-semibold tracking-wide transition cursor-pointer"
        >
          Close Manual
        </button>
      </div>
    </div>
  );
};
