import React, { useEffect, useState } from 'react';
import { X, Plus, Layers, Dumbbell, Calendar, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/safeStorage';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { ProgramCreatorModal } from './programCreator';
import type { ProgramFormData } from './programCreator/types';
import { publishProgram, unlistProgram } from '../services/coachBridge';

const PROGRAMS_KEY = 'o1_coach_custom_programs';

type SavedProgram = Partial<ProgramFormData> & { id: string };

export interface CoachProgramsHubModalProps {
  isOpen: boolean;
  /** Open straight into the creator; closing it closes the hub too. */
  startInCreator?: boolean;
  onClose: () => void;
  onPublished?: (program: SavedProgram) => void;
}

function readPrograms(): SavedProgram[] {
  const stored = safeStorage.getItem<unknown>(PROGRAMS_KEY, []);
  return (Array.isArray(stored) ? (stored as Partial<SavedProgram>[]) : []).map((row, idx) => ({ ...row, id: row.id || `prog-local-${idx}` }));
}

export const CoachProgramsHubModal: React.FC<CoachProgramsHubModalProps> = ({
  isOpen,
  startInCreator = false,
  onClose,
  onPublished,
}) => {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [programs, setPrograms] = useState<SavedProgram[]>(readPrograms);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && startInCreator) setIsCreatorOpen(true);
  }, [isOpen, startInCreator]);

  if (!isOpen) return null;

  const persist = (next: SavedProgram[]) => {
    setPrograms(next);
    safeStorage.setItem(PROGRAMS_KEY, next);
  };

  const handleProgramCreated = (form: ProgramFormData) => {
    const program: SavedProgram = { ...form, id: `prog-${Date.now()}` };
    persist([program, ...programs]);
    setIsCreatorOpen(false);
    const weekOne = (form.weeks?.[0]?.days ?? [])
      .map((day) => [day.dayName, day.splitFocus].filter(Boolean).join(' '))
      .filter(Boolean);
    void (async () => {
      const coachId = await getAuthenticatedUserId();
      if (coachId) {
        await publishProgram(coachId, {
          id: program.id,
          title: form.title,
          description: form.shortOverview || form.description,
          priceUsd: form.priceUsd,
          trainingDaysPerWeek: form.trainingDaysPerWeek,
          durationWeeks: form.durationWeeks,
          category: form.category,
          coverImage: form.coverImage,
          isFreeCommunity: form.isFreeCommunity,
          weekOne,
        });
      }
      onPublished?.(program);
    })();
  };

  const handleDelete = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    persist(programs.filter((p) => p.id !== id));
    void getAuthenticatedUserId().then((coachId) => (coachId ? unlistProgram(coachId, id) : false));
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 flex items-center justify-center p-3 select-none animate-fadeIn" role="dialog" aria-modal="true" aria-label="Programs">
      <div className="w-full max-w-md bg-o1-sheet border border-white/[0.07] rounded-2xl p-3.5 space-y-2.5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-2 min-h-[44px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 text-o1-crimson flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-o1-text">Programs</h3>
              <p className="text-[11px] text-o1-muted">
                {programs.length === 1 ? '1 program' : `${programs.length} programs`}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-o1-muted active:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1 space-y-2">
          {programs.length === 0 ? (
            <div className="p-5 rounded-2xl border border-dashed border-white/[0.07] text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center mx-auto text-o1-muted">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h4 className="text-[13px] font-semibold text-o1-text">No programs yet</h4>
              <p className="text-[12px] text-o1-muted max-w-xs mx-auto">
                Build a multi-week program to assign to your athletes or sell on your profile.
              </p>
            </div>
          ) : (
            programs.map((prog) => (
              <div key={prog.id} className="p-3 rounded-2xl bg-o1-surface border border-white/[0.07] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-[13px] font-semibold text-o1-text truncate">{prog.title || 'Untitled program'}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-o1-muted mt-0.5">
                    <span>{prog.difficulty || 'Custom'}</span>
                    <span aria-hidden>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {prog.durationWeeks || 4} weeks
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(prog.id)}
                  onBlur={() => setConfirmId((id) => (id === prog.id ? null : id))}
                  aria-label={confirmId === prog.id ? `Confirm remove ${prog.title || 'program'}` : `Remove ${prog.title || 'program'}`}
                  className={`flex h-10 shrink-0 items-center justify-center rounded-xl transition ${
                    confirmId === prog.id ? 'bg-o1-crimson px-3 text-[12px] font-semibold text-white' : 'w-10 text-o1-muted active:bg-white/[0.06]'
                  }`}
                >
                  {confirmId === prog.id ? 'Remove' : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsCreatorOpen(true); }}
          className="w-full h-[48px] rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" />
          New program
        </button>
      </div>

      <ProgramCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => {
          setIsCreatorOpen(false);
          if (startInCreator) onClose();
        }}
        onPublished={handleProgramCreated}
      />
    </div>
  );
};

export default CoachProgramsHubModal;
