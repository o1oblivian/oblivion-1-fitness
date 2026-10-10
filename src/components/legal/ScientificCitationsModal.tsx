import React from 'react';
import { X, BookOpen, Activity, Flame, Dumbbell, Zap } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

export interface ScientificCitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CitationItem {
  id: string;
  title: string;
  citation: string;
  application: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const CITATIONS: CitationItem[] = [
  {
    id: 'mifflin-st-jeor',
    title: 'Mifflin-St Jeor Energy Expenditure Model',
    citation:
      'Mifflin, M. D., et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr, 51(2), 241-247.',
    application: 'Drives Fuel OS BMR and maintenance TDEE baselines.',
    icon: Flame,
    accentColor: 'text-o1-crimson',
  },
  {
    id: 'compendium-met',
    title: 'Compendium of Physical Activities (Ainsworth METs)',
    citation:
      'Ainsworth, B. E., et al. (2011). Compendium of Physical Activities: a second update of codes and MET values. Med Sci Sports Exerc, 43(8), 1575-1581.',
    application: 'Used for exercise caloric burn and metabolic flux calculations.',
    icon: Activity,
    accentColor: 'text-sky-600',
  },
  {
    id: 'brzycki-formula',
    title: 'Brzycki Formula for 1RM Estimation',
    citation:
      'Brzycki, M. (1993). Strength testing—predicting a one-rep max from repetitions-to-fatigue. JOPERD, 64(1), 88-90.',
    application: 'Powers submaximal mechanical tonnage and 1RM progression tracking.',
    icon: Dumbbell,
    accentColor: 'text-neutral-900',
  },
  {
    id: 'acwr-model',
    title: 'Acute:Chronic Workload Ratio (ACWR) & Injury Risk Mitigation',
    citation:
      'Gabbett, T. J. (2016). The training—injury prevention paradox: should athletes be training smarter and harder? Br J Sports Med, 50(5), 273-280.',
    application:
      'Informs the Microcycle 5-Axis Spider Chart and the 0.8–1.3x sweet-spot index.',
    icon: Zap,
    accentColor: 'text-amber-600',
  },
];

export const ScientificCitationsModal: React.FC<ScientificCitationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    tactileEngine.triggerSelectionBuzz();
    onClose();
  };

  return (
    <div
      id="scientific-citations-modal"
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="o1-sheet-card bg-o1-card text-neutral-100 border border-white/[0.07] w-full overflow-y-auto p-4 shadow-xl relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.05]">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-o1-crimson" />
              <h3 className="text-base font-bold text-white leading-tight font-tactical">
                Scientific Sources &amp; Medical Citations
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Peer-Reviewed Physiological Models &amp; Mathematical Frameworks
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-o1-well hover:bg-white/[0.06] text-neutral-400 hover:text-white flex items-center justify-center transition-colors -mr-1 -mt-1 cursor-pointer border border-white/[0.07]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citation Cards */}
        <div className="py-4 space-y-3">
          {CITATIONS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                className="bg-o1-well border border-white/[0.07] rounded-2xl p-4 transition-all hover:border-white/[0.14]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${c.accentColor} shrink-0`} />
                  <h4 className="font-bold text-white text-xs tracking-wide font-tactical">
                    {c.title}
                  </h4>
                </div>

                <div className="text-[11px] text-neutral-300 font-mono bg-black border border-white/[0.07] rounded-xl p-2.5 my-2">
                  <span className="font-semibold text-neutral-100">Citation: </span>
                  {c.citation}
                </div>

                <div className="text-xs text-neutral-400 flex items-baseline gap-1.5 mt-1">
                  <span className="font-semibold text-neutral-200 shrink-0">
                    Application:
                  </span>
                  <span>{c.application}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.05] flex flex-col items-center">
          <button
            type="button"
            onClick={handleClose}
            className="w-full bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white font-bold text-xs py-3 rounded-full tracking-wider shadow-md transition-all cursor-pointer font-tactical"
          >
            [ Close citations ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScientificCitationsModal;
