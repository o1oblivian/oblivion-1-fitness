import React from 'react';
import { User, Sparkles, Play } from 'lucide-react';
import { useCoachStore } from '../../../stores/useCoachStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { mockAssignedWorkouts } from '../../../services/devMocks';
import { resolveTodaySession, startTodaySession } from '../../log/todaySession';

interface CoachProtocolAccordionPanelProps {
  onClose: () => void;
  onLoaded?: (title: string) => void;
}

export const CoachProtocolAccordionPanel: React.FC<CoachProtocolAccordionPanelProps> = ({ onClose, onLoaded }) => {
  const assigned = useCoachStore((s) => s.assignedWorkouts);
  const workout = assigned.find((row) => row.status !== 'completed') ?? mockAssignedWorkouts()[0] ?? null;

  const handleOpenCoachHub = () => {
    tactileEngine.triggerSelectionBuzz();
    useCoachStore.getState().setSelectedSubTab('STORE');
    const coachTab = document.getElementById('nav-tab-coach') || document.getElementById('dock-tab-coach');
    if (coachTab) coachTab.click();
  };

  const handleLoad = () => {
    if (!workout) return;
    tactileEngine.triggerSelectionBuzz();
    useCoachStore.getState().ingestAssigned(workout);
    const session = resolveTodaySession();
    if (session.origin !== 'coach') return;
    startTodaySession(session);
    onLoaded?.(session.title);
    onClose();

    setTimeout(() => {
      const activeEl = document.getElementById('active-log-section') || document.getElementById('active-log-card');
      activeEl?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 shadow-sm space-y-2.5 text-white">
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-300">
            <User className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold tracking-wider text-white leading-tight">
              Coach Training Protocol
            </h3>
            <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
              Assigned workouts &amp; active programs
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCoachHub}
          className="text-[10px] font-mono font-bold text-o1-crimson bg-o1-crimson/10 border border-o1-crimson/30 hover:bg-o1-crimson/20 px-2.5 py-1 rounded-xl tracking-wider transition-colors cursor-pointer"
        >
          Coach Hub
        </button>
      </div>

      {workout ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-o1-crimson fill-o1-crimson" />
              <span className="font-mono text-xs font-bold tracking-wider">From your coach</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              ● Ready to load
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-o1-well border border-white/[0.07] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{workout.title}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">
                  {workout.coachName} · {workout.exercises.length} exercises
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoad}
                className="min-h-[44px] px-4 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 active:scale-95 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Load</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {workout.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.08] text-neutral-200 text-xs font-mono font-medium border border-white/[0.07]"
                >
                  {exercise.name} ({exercise.sets}×{exercise.reps} reps)
                </div>
              ))}
            </div>

            {workout.notes && (
              <p className="text-xs text-neutral-400 italic font-mono pt-1.5 border-t border-white/[0.05] leading-relaxed">
                “{workout.notes}”
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="px-1 py-3 text-[13px] text-neutral-400">
          No workout from your coach yet. When your coach sends one, it shows up here.
        </p>
      )}
    </div>
  );
};

export default CoachProtocolAccordionPanel;
