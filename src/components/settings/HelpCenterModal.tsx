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
    title: 'Logging workouts',
    summary: 'Sets, effort and weights',
    desc: 'Tick each set when you finish it. The app adds up the total weight you lifted and estimates your best for each lift. Effort is how hard a set felt: Easy, Good, Hard or Max in Simple mode, or RPE from 1 to 10 in Pro mode. Barbell weights include a 20 kg bar. Switch between Simple and Pro in Settings.',
  },
  {
    id: 'fuel',
    icon: Zap,
    title: 'Food tracking',
    summary: 'Calories, protein, carbs and fat',
    desc: 'Fuel sets daily targets for calories, protein, carbs and fat from your profile, whether you want to lose, keep or gain weight. Log meals with Quick-Add or by scanning your meal with the camera.',
  },
  {
    id: 'radar',
    icon: Compass,
    title: 'Buddy Radar and privacy',
    summary: 'Find training partners nearby',
    desc: 'Radar shows verified members training near you so you can find a partner or a spotter. Turn on Incognito to train privately without appearing to anyone nearby.',
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
              <h2 className="text-sm font-bold tracking-wider font-tactical">Help</h2>
              <p className="text-[10px] font-mono text-neutral-500">How Oblivion 1 works</p>
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
