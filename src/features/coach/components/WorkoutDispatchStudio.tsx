import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, Dumbbell, Search, Send, Sparkles, Users, X } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { Athlete, fetchCoachClients, isValidUuid } from '../services/coachService';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { tactileEngine } from '../../../services/tactileEngine';
import { isSampleId } from '../services/sampleIds';
import { mergeRoster, type DispatchTab } from './dispatch/dispatchTypes';
import { useDispatchStack } from './dispatch/useDispatchStack';
import { DispatchStackTab, localDateKey, type WorkoutSetup } from './dispatch/DispatchStackTab';
import { DispatchLibraryTab } from './dispatch/DispatchLibraryTab';
import { DispatchBlueprintsTab } from './dispatch/DispatchBlueprintsTab';
import { DispatchAthletePicker } from './dispatch/DispatchAthletePicker';

export interface WorkoutDispatchStudioProps {
  isOpen?: boolean;
  onClose: () => void;
  athleteId?: string;
  targetAthlete?: Athlete | null;
  roster?: Athlete[];
  onDispatched?: (title: string, athleteName: string) => void;
}

const NO_ROSTER: Athlete[] = [];

const TABS: { id: DispatchTab; label: string; icon: typeof Dumbbell }[] = [
  { id: 'stack', label: 'Workout', icon: Dumbbell },
  { id: 'library', label: 'Library', icon: Search },
  { id: 'blueprints', label: 'Blueprints', icon: Sparkles },
];

export const WorkoutDispatchStudio: React.FC<WorkoutDispatchStudioProps> = ({
  isOpen = true,
  onClose,
  athleteId,
  targetAthlete = null,
  roster = NO_ROSTER,
  onDispatched,
}) => {
  const [activeTab, setActiveTab] = useState<DispatchTab>('stack');
  const lockedId = targetAthlete?.id || athleteId || '';
  const [athletes, setAthletes] = useState<Athlete[]>(() => mergeRoster(targetAthlete ? [targetAthlete] : [], roster));
  const [selectedIds, setSelectedIds] = useState<string[]>(lockedId ? [lockedId] : roster.map((row) => row.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coachCue, setCoachCue] = useState('');
  const [setup, setSetup] = useState<WorkoutSetup>(() => ({ title: 'Custom workout', date: localDateKey(), focus: 'Hypertrophy (8-12)' }));
  const dispatch = useDispatchStack();
  const { stack, telemetry } = dispatch;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (message: string, ms: number) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const seeded = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    void getAuthenticatedUserId()
      .then((coachId) => (coachId ? fetchCoachClients(coachId) : null))
      .then((res) => {
        if (!live) return;
        const merged = mergeRoster(targetAthlete ? [targetAthlete] : [], roster, res ?? []);
        setAthletes(merged);
        if (seeded.current) return;
        seeded.current = true;
        const match = lockedId ? merged.find((row) => row.id === lockedId || row.client_id === lockedId) : undefined;
        if (match) setSelectedIds([match.id]);
        else if (!lockedId) setSelectedIds((prev) => (prev.length ? prev : merged.map((row) => row.id)));
      });
    return () => {
      live = false;
    };
  }, [isOpen, lockedId, targetAthlete, roster]);

  const selectedAthletes = useMemo(() => athletes.filter((a) => selectedIds.includes(a.id)), [athletes, selectedIds]);

  const handleDispatch = async () => {
    if (stack.length === 0 || isSubmitting) return;
    if (selectedAthletes.length === 0) {
      flash('Pick at least one athlete.', 2000);
      return;
    }
    const linked = selectedAthletes.filter((athlete) => isValidUuid(athlete.client_id || athlete.id) && !isSampleId(athlete.id));
    if (!linked.length) {
      flash('Pick a linked client. Nothing was saved on this phone.', 2500);
      return;
    }

    setIsSubmitting(true);
    tactileEngine.playPRCelebration();
    try {
      const coachId = (await getAuthenticatedUserId()) || '';
      const cue = coachCue.trim();
      const exercises = stack.map((ex) => ({ name: ex.name, muscle: ex.muscle, cue: ex.cue, setsCount: ex.sets.length, sets: ex.sets }));
      const [y, m, d] = setup.date.split('-').map(Number);
      const day = new Date(y, (m || 1) - 1, d || 1, 6);
      const assignedAt = setup.date === localDateKey() || Number.isNaN(day.getTime()) ? new Date().toISOString() : day.toISOString();
      if (!isValidUuid(coachId)) {
        setIsSubmitting(false);
        flash('Sign in to send workouts.', 2500);
        return;
      }
      const rows = linked.map((athlete) => {
          const personId = athlete.client_id || athlete.id;
          return {
            coach_id: coachId,
            client_id: personId,
            athlete_id: personId,
            title: setup.title,
            parameters: {
              date: setup.date,
              focus: setup.focus,
              coachCue: cue,
              totalSets: telemetry.sets,
              estTime: telemetry.estTime,
              volumeTons: telemetry.volumeTons,
            },
            exercises,
            status: 'pending',
            assigned_date: assignedAt,
          };
        });
      const { error } = await supabase.from('assigned_workouts').insert(rows);
      if (error) throw new Error(error.message);

      setToast(linked.length > 1 ? `Sent to ${linked.length} athletes` : `Sent to ${linked[0]?.name || 'athlete'}`);
      onDispatched?.(setup.title, linked.map((a) => a.name).join(', '));
      closeTimer.current = setTimeout(onClose, 1500);
    } catch (e) {
      setIsSubmitting(false);
      flash(e instanceof Error ? e.message : 'Could not send the workout.', 2500);
    }
  };

  if (!isOpen) return null;

  const target =
    selectedAthletes.length === 1 ? selectedAthletes[0].name
      : selectedAthletes.length > 1 ? `${selectedAthletes.length} athletes`
      : 'pick an athlete';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 select-none p-0 sm:p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Send a workout">
      <div className="w-full max-w-lg h-full sm:h-[94vh] bg-o1-canvas text-o1-text sm:rounded-2xl flex flex-col overflow-hidden border border-white/[0.07]">
        <div className="p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:pt-3 border-b border-white/[0.07] bg-o1-surface shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-o1-text truncate">Workout</h2>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
              }}
              className="w-11 h-11 rounded-full bg-o1-sheet border border-white/[0.07] flex items-center justify-center text-o1-text active:scale-95"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1.5 px-3 rounded-2xl border border-white/[0.07]">
            <div className="flex items-center gap-3.5 text-o1-muted">
              <span>Sets <strong className="text-o1-text">{telemetry.sets}</strong></span>
              <span>Time <strong className="text-o1-text">{telemetry.estTime ? `${telemetry.estTime}m` : '--'}</strong></span>
              <span>Volume <strong className="text-o1-text">{Number(telemetry.volumeTons) > 0 ? `${telemetry.volumeTons}k kg` : '--'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              {telemetry.muscleDistribution.slice(0, 2).map((m) => (
                <span key={m.muscle} className="px-2 py-0.5 rounded-md bg-o1-sheet border border-white/[0.07] text-[10px] font-semibold text-o1-text">
                  {m.muscle} <span className="text-o1-crimson">{m.percentage}%</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveTab(id);
                }}
                className={`h-10 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  activeTab === id ? 'bg-o1-crimson text-white' : 'bg-o1-sheet border border-white/[0.07] text-o1-text'
                }`}
              >
                <Icon size={14} />
                {id === 'stack' ? `${label} (${stack.length})` : label}
              </button>
            ))}
          </div>
        </div>

        {toast ? (
          <div role="status" aria-live="polite" className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            {toast}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'stack' ? (
            <DispatchStackTab setup={setup} onSetupChange={setSetup} dispatch={dispatch} onOpenLibrary={() => setActiveTab('library')} />
          ) : activeTab === 'library' ? (
            <DispatchLibraryTab
              stack={stack}
              onAdd={(item) => {
                dispatch.addFromCatalog(item);
                flash(`Added ${item.name}`, 1500);
              }}
            />
          ) : (
            <DispatchBlueprintsTab
              onLoad={(bp) => {
                dispatch.loadBlueprint(bp);
                setSetup((prev) => ({ ...prev, title: bp.title, focus: `${bp.intensityMode} · ${bp.durationMins}m` }));
                setActiveTab('stack');
              }}
            />
          )}
        </div>

        <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3 border-t border-white/[0.07] bg-o1-surface shrink-0 space-y-2">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-o1-text truncate">{setup.title} ({setup.date})</h4>
            <p className="text-[11px] text-o1-muted truncate">
              {stack.length} exercises · {telemetry.sets} sets · For {target}
            </p>
          </div>

          <input
            type="text"
            value={coachCue}
            onChange={(e) => setCoachCue(e.target.value)}
            placeholder="Note for the athlete (optional)"
            aria-label="Note for the athlete"
            className="h-[44px] w-full rounded-xl border border-white/[0.07] bg-o1-sheet px-3 text-[13px] text-o1-text placeholder:text-o1-muted outline-none focus:border-o1-crimson"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setPickerOpen(true);
              }}
              className="h-[44px] shrink-0 px-3 rounded-full border border-white/[0.07] bg-o1-sheet text-xs font-semibold text-o1-text flex items-center gap-1.5"
            >
              <Users size={12} className="text-o1-muted" />
              Athletes ({selectedIds.length})
            </button>
            <button
              type="button"
              disabled={isSubmitting || stack.length === 0 || selectedIds.length === 0}
              onClick={() => void handleDispatch()}
              className="h-[44px] flex-1 px-4 rounded-full bg-o1-crimson active:bg-o1-crimson-hover active:scale-95 disabled:opacity-50 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5"
            >
              <Send size={13} />
              {isSubmitting ? 'Sending…' : 'Send workout'}
            </button>
          </div>
        </div>

        {pickerOpen ? (
          <DispatchAthletePicker athletes={athletes} selectedIds={selectedIds} onChange={setSelectedIds} onClose={() => setPickerOpen(false)} />
        ) : null}
      </div>
    </div>
  );
};


