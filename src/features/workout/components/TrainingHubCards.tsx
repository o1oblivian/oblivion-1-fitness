import React, { useState } from 'react';
import { Cpu, User, ChevronDown, ChevronUp } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem } from '../../../types';
import { IntelCoachAccordionPanel } from './IntelCoachAccordionPanel';
import { CoachProtocolAccordionPanel } from './CoachProtocolAccordionPanel';

export interface TrainingHubCardsProps {
  expandedHubTab?: 'intel' | 'coach' | null;
  onToggleTab?: (tab: 'intel' | 'coach') => void;
  onDeployProtocol?: (exercises: ExerciseItem[]) => void;
  onShowToast?: (msg: string) => void;
  renderAccordionsInline?: boolean;
}

export const TrainingHubCards: React.FC<TrainingHubCardsProps> = ({
  expandedHubTab,
  onToggleTab,
  onDeployProtocol,
  onShowToast,
  renderAccordionsInline = true,
}) => {
  const [internalSegment, setInternalSegment] = useState<'intel' | 'coach' | null>(null);

  const isControlled = expandedHubTab !== undefined;
  const activeSegment = isControlled ? expandedHubTab : internalSegment;

  const handleSelect = (tab: 'intel' | 'coach') => {
    tactileEngine.triggerSelectionBuzz();
    if (isControlled && onToggleTab) onToggleTab(tab);
    else setInternalSegment((prev) => (prev === tab ? null : tab));
  };

  const isIntelActive = activeSegment === 'intel';
  const isCoachActive = activeSegment === 'coach';

  return (
    <div id="training-hub-cards-section" className="space-y-2.5 my-2 select-none">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          id="card-intel-coach"
          type="button"
          onClick={() => handleSelect('intel')}
          className={`relative rounded-full p-2.5 sm:px-3.5 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between border ${
            isIntelActive
              ? 'bg-white text-neutral-950 border-transparent shadow-md'
              : 'bg-o1-card text-white border-white/[0.07] hover:border-white/[0.14] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isIntelActive ? 'bg-o1-well text-sky-400' : 'bg-o1-well text-sky-500'
            }`}>
              <Cpu className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="font-bold text-xs sm:text-sm tracking-tight truncate leading-tight">Intel Coach</h4>
              <p className={`text-[10px] sm:text-[11px] truncate leading-tight mt-0.5 ${isIntelActive ? 'text-neutral-600' : 'text-neutral-500'}`}>
                Load &amp; Recovery Insights
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-1.5 text-neutral-400">
            {isIntelActive ? <ChevronUp className="w-4 h-4 stroke-[2.2]" /> : <ChevronDown className="w-4 h-4 stroke-[2.2]" />}
          </div>
        </button>

        <button
          id="card-my-coach"
          type="button"
          onClick={() => handleSelect('coach')}
          className={`relative rounded-full p-2.5 sm:px-3.5 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between border ${
            isCoachActive
              ? 'bg-white text-neutral-950 border-transparent shadow-md'
              : 'bg-o1-card text-white border-white/[0.07] hover:border-white/[0.14] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isCoachActive ? 'bg-o1-well text-red-500' : 'bg-o1-well text-red-500'
            }`}>
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="font-bold text-xs sm:text-sm tracking-tight truncate leading-tight">My Coach</h4>
              <p className={`text-[10px] sm:text-[11px] truncate leading-tight mt-0.5 ${isCoachActive ? 'text-neutral-600' : 'text-neutral-500'}`}>
                Assigned workouts
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-1.5 text-neutral-400">
            {isCoachActive ? <ChevronUp className="w-4 h-4 stroke-[2.2]" /> : <ChevronDown className="w-4 h-4 stroke-[2.2]" />}
          </div>
        </button>
      </div>

      {renderAccordionsInline && activeSegment === 'intel' && (
        <IntelCoachAccordionPanel
          onClose={() => (isControlled && onToggleTab ? onToggleTab('intel') : setInternalSegment(null))}
          onDeployProtocol={(exs) => {
            onDeployProtocol?.(exs);
            onShowToast?.(`Intel Session Deployed: ${exs.length} exercises scheduled.`);
            if (isControlled && onToggleTab) onToggleTab('intel');
            else setInternalSegment(null);
          }}
        />
      )}

      {renderAccordionsInline && activeSegment === 'coach' && (
        <CoachProtocolAccordionPanel
          onClose={() => (isControlled && onToggleTab ? onToggleTab('coach') : setInternalSegment(null))}
          onDeployProtocol={(exs) => {
            onDeployProtocol?.(exs);
            onShowToast?.(`Coach Protocol Deployed: ${exs.length} exercises scheduled.`);
            if (isControlled && onToggleTab) onToggleTab('coach');
            else setInternalSegment(null);
          }}
        />
      )}
    </div>
  );
};

export default TrainingHubCards;
