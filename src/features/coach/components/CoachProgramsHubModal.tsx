import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus, Layers, Dumbbell, Calendar, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useUserStore } from '../../../stores/useUserStore';
import { ProgramCreatorModal } from './programCreator';
import type { ProgramFormData } from './programCreator/types';
import { fetchOwnPrograms, publishProgram, unlistProgram } from '../services/coachBridge';
import { exerciseCount } from '../services/programPlan';
import type { StorefrontProgram } from '../../reels/services/coachStorefront';

export interface CoachProgramsHubModalProps {
  isOpen: boolean;
  /** Open straight into the creator; closing it closes the hub too. */
  startInCreator?: boolean;
  onClose: () => void;
  onPublished?: (program: StorefrontProgram) => void;
}

export const CoachProgramsHubModal: React.FC<CoachProgramsHubModalProps> = ({
  isOpen,
  startInCreator = false,
  onClose,
  onPublished,
}) => {
  const coachName = useUserStore((s) => s.name);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadFailed(false);
    const coachId = await getAuthenticatedUserId();
    const rows = coachId ? await fetchOwnPrograms(coachId) : null;
    if (rows) setPrograms(rows);
    else {
      setPrograms((prev) => prev ?? []);
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setNotice('');
    void load();
    if (startInCreator) setIsCreatorOpen(true);
  }, [isOpen, startInCreator, load]);

  if (!isOpen) return null;

  const handleProgramCreated = async (form: ProgramFormData): Promise<boolean> => {
    const coachId = await getAuthenticatedUserId();
    if (!coachId) return false;
    const program = await publishProgram(coachId, coachName || 'Coach', form);
    if (!program) return false;
    setPrograms((prev) => [program, ...(prev ?? []).filter((p) => p.id !== program.id)]);
    setNotice(`${program.title} is live on your profile.`);
    onPublished?.(program);
    return true;
  };

  const handleDelete = async (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    setRemovingId(id);
    const coachId = await getAuthenticatedUserId();
    const ok = coachId ? await unlistProgram(coachId, id) : false;
    setRemovingId(null);
    if (ok) {
      setPrograms((prev) => (prev ?? []).filter((p) => p.id !== id));
      setNotice('Program removed. Enrolled athletes keep their copy.');
    } else {
      setNotice('Could not remove the program. Try again.');
    }
  };

  const count = programs?.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 flex items-center justify-center p-3 select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Programs"
    >
      <div className="w-full max-w-md bg-o1-sheet border border-white/[0.07] rounded-2xl p-3.5 space-y-2.5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-2 min-h-[44px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 text-o1-crimson flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-o1-text">Programs</h3>
              <p className="text-[11px] text-o1-muted">
                {programs === null
                  ? 'Loading…'
                  : count === 1
                    ? '1 published program'
                    : `${count} published programs`}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-o1-muted active:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {notice ? (
          <p role="status" className="text-[12px] text-o1-text">
            {notice}
          </p>
        ) : null}
        {loadFailed ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-2 rounded-xl border border-o1-crimson/30 bg-o1-crimson/10 px-3 py-2"
          >
            <p className="text-[12px] text-o1-text">Could not load your programs.</p>
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-[36px] px-2 text-[12px] font-semibold text-o1-text"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="overflow-y-auto no-scrollbar flex-1 space-y-2">
          {programs === null ? (
            <p className="py-8 text-center text-[13px] text-o1-muted">Loading programs…</p>
          ) : programs.length === 0 ? (
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
            programs.map((prog) => {
              const exercises = exerciseCount(prog.plan);
              return (
                <div
                  key={prog.id}
                  className="p-3 rounded-2xl bg-o1-surface border border-white/[0.07] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-semibold text-o1-text truncate">
                      {prog.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-o1-muted mt-0.5">
                      {prog.level ? <span>{prog.level}</span> : null}
                      {prog.level && prog.weeks ? <span aria-hidden>·</span> : null}
                      {prog.weeks ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {prog.weeks}
                        </span>
                      ) : null}
                      {exercises ? <span aria-hidden>·</span> : null}
                      {exercises ? <span>{exercises} exercises</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={removingId === prog.id}
                    onClick={() => void handleDelete(prog.id)}
                    onBlur={() => setConfirmId((id) => (id === prog.id ? null : id))}
                    aria-label={
                      confirmId === prog.id
                        ? `Confirm remove ${prog.title}`
                        : `Remove ${prog.title}`
                    }
                    className={`flex h-10 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-50 ${
                      confirmId === prog.id
                        ? 'bg-o1-crimson px-3 text-[12px] font-semibold text-white'
                        : 'w-10 text-o1-muted active:bg-white/[0.06]'
                    }`}
                  >
                    {confirmId === prog.id ? 'Remove' : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsCreatorOpen(true);
          }}
          className="w-full h-[48px] rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" />
          New program
        </button>
      </div>

      {isCreatorOpen && (
        <ProgramCreatorModal
          isOpen
          onClose={() => {
            setIsCreatorOpen(false);
            if (startInCreator) onClose();
          }}
          onPublished={handleProgramCreated}
        />
      )}
    </div>
  );
};
