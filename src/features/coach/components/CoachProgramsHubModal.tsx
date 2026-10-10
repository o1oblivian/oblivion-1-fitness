import React, { useState } from 'react';
import { X, Plus, Layers, Dumbbell, Calendar, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ProgramCreatorModal } from './programCreator';

export interface CoachProgramsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (p: any) => void;
}

export const CoachProgramsHubModal: React.FC<CoachProgramsHubModalProps> = ({
  isOpen,
  onClose,
  onPublished,
}) => {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [customPrograms, setCustomPrograms] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('o1_coach_custom_programs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  const handleProgramCreated = (prog: any) => {
    const next = [prog, ...customPrograms];
    setCustomPrograms(next);
    try {
      localStorage.setItem('o1_coach_custom_programs', JSON.stringify(next));
    } catch {}
    setIsCreatorOpen(false);
    onPublished?.(prog);
    const id = prog?.id || `prog-${Date.now()}`;
    const weekOne = Array.isArray(prog?.weeks?.[0]?.days)
      ? prog.weeks[0].days.map((day: { dayName?: string; splitFocus?: string }) => [day.dayName, day.splitFocus].filter(Boolean).join(' ')).filter(Boolean)
      : [];
    void (async () => {
      const { getAuthenticatedUserId } = await import('../../../services/authUser');
      const { publishProgram } = await import('../services/coachBridge');
      const coachId = await getAuthenticatedUserId();
      if (coachId) {
        await publishProgram(coachId, {
          id,
          title: prog?.title,
          description: prog?.shortOverview || prog?.description,
          priceUsd: prog?.priceUsd,
          trainingDaysPerWeek: prog?.trainingDaysPerWeek,
          durationWeeks: prog?.durationWeeks,
          category: prog?.category,
          coverImage: prog?.coverImage,
          isFreeCommunity: prog?.isFreeCommunity,
          weekOne,
        });
      }
    })();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    const next = customPrograms.filter((p) => p.id !== id);
    setCustomPrograms(next);
    try {
      localStorage.setItem('o1_coach_custom_programs', JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-o1-card border border-white/[0.07] rounded-2xl p-3.5 shadow-2xl space-y-2.5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 min-h-[44px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 text-o1-crimson flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-tactical font-black text-sm tracking-wider text-white">
                Programs Hub
              </h3>
              <p className="text-[10px] font-mono text-neutral-500">
                {customPrograms.length} active custom blueprints
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-white/[0.06] text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1 space-y-2.5">
          {customPrograms.length === 0 ? (
            <div className="p-5 rounded-2xl bg-o1-well border border-dashed border-white/[0.07] text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center mx-auto text-neutral-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h4 className="font-tactical font-black text-xs tracking-wider text-white">
                NO BLUEPRINTS PUBLISHED // DRAFT YOUR FIRST ROUTINE
              </h4>
              <p className="text-[11px] text-neutral-400 font-sans max-w-xs mx-auto">
                Create structured multi-week periodized regimens to assign directly to athletes or sell in the store.
              </p>
            </div>
          ) : (
            customPrograms.map((prog, idx) => (
              <div
                key={prog.id || idx}
                className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="font-tactical font-black text-xs text-white truncate">
                    {prog.title || 'Untitled Blueprint'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 mt-0.5">
                    <span className="text-o1-crimson font-bold">{prog.difficulty || 'Custom'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {prog.durationWeeks || 4}W
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(prog.id, e)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 transition cursor-pointer"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsCreatorOpen(true); }}
          className="w-full py-2.5 px-4 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover text-white font-tactical font-black text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Draft New Blueprint</span>
        </button>
      </div>

      <ProgramCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onPublished={handleProgramCreated}
      />
    </div>
  );
};

export default CoachProgramsHubModal;
