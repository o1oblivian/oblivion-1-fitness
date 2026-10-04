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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-neutral-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#C4121A]/10 border border-[#C4121A]/30">
              <BookOpen className="w-4 h-4 text-[#C4121A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-tactical">Help &amp; Telemetry Manual</h2>
              <p className="text-[10px] font-mono text-neutral-500">Oblivion 1 Athlete OS Knowledge Base</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 cursor-pointer"
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
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] overflow-hidden transition-all"
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
                    <Icon className="w-4 h-4 text-[#C4121A] shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs font-tactical">{t.title}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono">{t.summary}</p>
                    </div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />}
                </button>
                {isExp && (
                  <div className="px-3.5 pb-3.5 pt-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-200 dark:border-neutral-800/80">
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
          className="w-full py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#a30f16] text-white text-xs font-tactical font-semibold uppercase tracking-wider transition cursor-pointer"
        >
          Close Manual
        </button>
      </div>
    </div>
  );
};
