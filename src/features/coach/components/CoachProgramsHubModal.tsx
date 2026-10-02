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
    <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C4121A]/10 text-[#C4121A] flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-neutral-900 dark:text-white">
                PROGRAMS HUB
              </h3>
              <p className="text-[10px] font-mono text-neutral-500">
                {customPrograms.length} active custom blueprints
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1 space-y-2.5">
          {customPrograms.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-[#18181B] border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h4 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                NO BLUEPRINTS PUBLISHED // DRAFT YOUR FIRST ROUTINE
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans max-w-xs mx-auto">
                Create structured multi-week periodized regimens to assign directly to athletes or sell in the store.
              </p>
            </div>
          ) : (
            customPrograms.map((prog, idx) => (
              <div
                key={prog.id || idx}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="font-tactical font-black text-xs text-neutral-900 dark:text-white truncate">
                    {prog.title || 'Untitled Blueprint'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 mt-0.5">
                    <span className="text-[#C4121A] font-bold">{prog.difficulty || 'Custom'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {prog.durationWeeks || 4}W
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(prog.id, e)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 transition cursor-pointer"
                  title="Delete Draft"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsCreatorOpen(true); }}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#C4121A] hover:bg-[#a30f16] text-white font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>DRAFT NEW BLUEPRINT</span>
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
