import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, CheckCircle2, Play, Dumbbell, ChevronDown, ChevronUp,
  Trophy, Flame, Calendar, Clock, UserCheck, Sparkles, Send, ArrowRight
} from 'lucide-react';
import {
  getAthleteActivePrograms,
  markSessionCompleted,
  ScheduleEntry,
  ProgramEnrollment,
} from '@/utils/programScheduleStore';
import { getDispatchedWorkouts, DispatchedWorkout, dispatchWorkout } from '@/utils/dispatchStore';

interface ProgramProgressTrackerProps {
  currentUserEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onLoadExercises: (exercises: string[], source: string) => void;
}

interface ActiveProgram {
  enrollment: ProgramEnrollment;
  sessions: (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
  nextUnlockedIndex: number;
}

export const ProgramProgressTracker: React.FC<ProgramProgressTrackerProps> = ({
  currentUserEmail,
  showToast,
  onLoadExercises,
}) => {
  const [programs, setPrograms] = useState<ActiveProgram[]>([]);
  const [dispatchedWorkouts, setDispatchedWorkouts] = useState<DispatchedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const email = currentUserEmail || 'athlete@o1fc.app';
      const [progData, dispData] = await Promise.all([
        getAthleteActivePrograms(email),
        getDispatchedWorkouts(),
      ]);

      setPrograms(progData || []);
      setDispatchedWorkouts(dispData || []);
      if (progData && progData.length > 0 && !expandedProgram) {
        setExpandedProgram(progData[0].enrollment.id);
      }
    } catch (e) {
      console.error('Error loading coach programs:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUserEmail, expandedProgram]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dispatched_workouts_updated', handleUpdate);
      window.addEventListener('program_schedule_updated', handleUpdate);
      return () => {
        window.removeEventListener('dispatched_workouts_updated', handleUpdate);
        window.removeEventListener('program_schedule_updated', handleUpdate);
      };
    }
  }, [loadData]);

  const handleStartSession = (program: ActiveProgram, sessionIndex: number) => {
    const session = program.sessions[sessionIndex];
    if (!session || sessionIndex !== program.nextUnlockedIndex) return;

    const exercises = (session.exercises || []).map((e: any) => e.name).filter(Boolean);
    if (exercises.length === 0) {
      showToast('No exercises in this session', 'error');
      return;
    }
    onLoadExercises(exercises, `${session.focus_label || 'Workout'} - Wk${session.week_number} D${session.day_number}`);
  };

  const handleCompleteSession = async (program: ActiveProgram, sessionIndex: number) => {
    const session = program.sessions[sessionIndex];
    if (!session || sessionIndex !== program.nextUnlockedIndex) return;

    setCompletingId(session.id);
    const success = await markSessionCompleted(session.id);

    if (success) {
      showToast('Session completed! Next day unlocked.', 'success');
      await loadData();
    } else {
      showToast('Failed to mark session complete', 'error');
    }
    setCompletingId(null);
  };

  const handleLoadDispatchedWorkout = (workout: DispatchedWorkout) => {
    const exerciseNames = workout.exercises.map(e => e.name).filter(Boolean);
    if (exerciseNames.length === 0) {
      showToast('No exercises found in dispatched workout', 'error');
      return;
    }
    onLoadExercises(exerciseNames, `Coach: ${workout.title}`);
    showToast(`Loaded "${workout.title}" (${exerciseNames.length} movements)`, 'success');
  };

  const handleGenerateSampleDispatch = async () => {
    const sampleWorkout: Omit<DispatchedWorkout, 'id' | 'createdAt' | 'status'> = {
      coachId: 'coach_pro_o1fc',
      coachName: 'O1FC Pro Coach',
      clientIds: [currentUserEmail || 'athlete@o1fc.app'],
      clientNames: ['Athlete'],
      title: 'Coach Prescription: Upper Power & Hypertrophy',
      routineCategory: 'Upper',
      scheduledDay: 'Today',
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: 'Focus on 2-second eccentric phase. Keep rest strictly to 75 seconds between compound lifts.',
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10', targetLoad: '80% 1RM' },
        { name: 'Weighted Pull-Up', sets: 4, reps: '6-8', targetLoad: 'RPE 8.5' },
        { name: 'Standing Overhead Barbell Press', sets: 3, reps: '8-10', targetLoad: '75% 1RM' },
        { name: 'Cable Lateral Raise', sets: 3, reps: '12-15', targetLoad: 'RPE 9' },
        { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', targetLoad: 'RPE 8' },
      ],
    };

    await dispatchWorkout(sampleWorkout);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dispatched_workouts_updated'));
    }
    await loadData();
    showToast('Sample Coach Dispatch generated and ready!', 'success');
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] p-6 shadow-xl text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#EA4335] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">Syncing Coach Dispatches...</span>
        </div>
      </div>
    );
  }

  const hasContent = programs.length > 0 || dispatchedWorkouts.length > 0;

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] p-4 sm:p-5 space-y-4 shadow-xl text-zinc-900 dark:text-white animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
            <UserCheck className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">Coach Training Protocol</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Assigned workouts & active programs</span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#EA4335] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
          COACH HUB
        </span>
      </div>

      {/* Dispatched Workouts List */}
      {dispatchedWorkouts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#EA4335]" /> Dispatched Workouts ({dispatchedWorkouts.length})
            </span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {dispatchedWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{workout.title}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{workout.coachName}</span>
                      <span>•</span>
                      <span>{workout.exercises.length} exercises</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadDispatchedWorkout(workout)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" /> Load
                  </button>
                </div>

                {/* Exercises summary */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {workout.exercises.map((ex, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      {ex.name} ({ex.sets}x{ex.reps})
                    </span>
                  ))}
                </div>

                {workout.notes && (
                  <p className="text-[9px] italic text-zinc-500 dark:text-zinc-400 pt-0.5 border-t border-zinc-200/50 dark:border-zinc-800">
                    "{workout.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Week Programs */}
      {programs.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-[#EA4335]" /> Enrolled Programs
          </div>
          {programs.map((program) => {
            const isExpanded = expandedProgram === program.enrollment.id;
            const completedCount = program.sessions.filter((s) => s.completed).length;
            const totalCount = program.sessions.length;
            const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            const currentWeek = program.sessions[program.nextUnlockedIndex]?.week_number || 1;
            const weekSessions = program.sessions.filter((s) => s.week_number === currentWeek);

            return (
              <div
                key={program.enrollment.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedProgram(isExpanded ? null : program.enrollment.id)}
                  className="w-full flex items-center gap-3 p-3 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300 dark:border-zinc-700">
                    <Trophy className="w-4 h-4 text-[#EA4335]" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[11px] font-bold text-zinc-900 dark:text-white leading-tight truncate">
                      Active Periodized Program
                    </div>
                    <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Week {currentWeek} — {completedCount}/{totalCount} sessions done
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-200 dark:text-zinc-800" />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5"
                          strokeDasharray={`${progressPct} 100`}
                          strokeLinecap="round"
                          className="text-[#EA4335]"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-[#EA4335]">
                        {Math.round(progressPct)}%
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </div>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1.5 animate-fadeIn border-t border-zinc-200 dark:border-zinc-800 pt-2">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1 pb-1">
                      Week {currentWeek} Sessions
                    </div>

                    {weekSessions.map((session, localIdx) => {
                      const globalIdx = program.sessions.findIndex((s) => s.id === session.id);
                      const isCompleted = !!session.completed;
                      const isActive = globalIdx === program.nextUnlockedIndex;
                      const isLocked = globalIdx > program.nextUnlockedIndex;

                      return (
                        <SessionRow
                          key={session.id}
                          session={session}
                          dayIndex={localIdx}
                          isCompleted={isCompleted}
                          isActive={isActive}
                          isLocked={isLocked}
                          isCompleting={completingId === session.id}
                          onStart={() => handleStartSession(program, globalIdx)}
                          onComplete={() => handleCompleteSession(program, globalIdx)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State / Sample Dispatch Generator */}
      {!hasContent && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto text-zinc-500 dark:text-zinc-400">
            <UserCheck className="w-5 h-5 text-[#EA4335]" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-white">No Coach Workouts Dispatched Yet</div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
              When your coach assigns or dispatches a personalized training protocol, it will appear here ready to launch.
            </p>
          </div>
          <div className="pt-1">
            <button
              onClick={handleGenerateSampleDispatch}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EA4335]" />
              Generate Sample Coach Dispatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SessionRowProps {
  session: ScheduleEntry & { completed?: boolean; completed_at?: string | null };
  dayIndex: number;
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
  isCompleting: boolean;
  onStart: () => void;
  onComplete: () => void;
}

const SessionRow: React.FC<SessionRowProps> = ({
  session,
  dayIndex,
  isCompleted,
  isActive,
  isLocked,
  isCompleting,
  onStart,
  onComplete,
}) => {
  const exerciseCount = (session.exercises || []).length;

  return (
    <div
      className={`relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl border transition-all ${
        isCompleted
          ? 'border-red-400/20 bg-red-500/[0.04]'
          : isActive
          ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800/80 shadow-sm'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30'
      }`}
    >
      {/* Status icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
        isCompleted
          ? 'bg-red-500/15'
          : isActive
          ? 'bg-[#EA4335]/15'
          : 'bg-zinc-200 dark:bg-zinc-800'
      }`}>
        {isCompleted ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[#EA4335]" />
        ) : isActive ? (
          <Flame className="w-3.5 h-3.5 text-[#EA4335]" />
        ) : (
          <Lock className="w-3 h-3 text-zinc-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-bold leading-none ${
          isCompleted
            ? 'text-[#EA4335]'
            : isActive
            ? 'text-zinc-900 dark:text-white'
            : 'text-zinc-400 dark:text-zinc-500'
        }`}>
          Day {dayIndex + 1}{session.focus_label ? ` — ${session.focus_label}` : ''}
        </div>
        <div className={`text-[9px] font-semibold mt-0.5 ${
          isCompleted
            ? 'text-red-500/70'
            : isActive
            ? 'text-zinc-500 dark:text-zinc-400'
            : 'text-zinc-400 dark:text-zinc-600'
        }`}>
          {isCompleted && session.completed_at
            ? `Done ${new Date(session.completed_at).toLocaleDateString()}`
            : `${exerciseCount} exercises`}
        </div>
      </div>

      {/* Action button */}
      {isActive && !isCompleted && (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onStart}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Play className="w-3 h-3 fill-currentColor" />
            Start
          </button>
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-[#EA4335] text-[9px] font-bold active:scale-95 transition-all cursor-pointer border border-red-400/20 disabled:opacity-50"
          >
            {isCompleting ? (
              <div className="w-3 h-3 border-2 border-[#EA4335] border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Done
          </button>
        </div>
      )}

      {isCompleted && (
        <CheckCircle2 className="w-4 h-4 text-[#EA4335] shrink-0" />
      )}
    </div>
  );
};

