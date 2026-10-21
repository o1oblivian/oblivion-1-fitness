import type { ExerciseItem } from '../../../../types';
import { tactileEngine } from '../../../../services/tactileEngine';
import { archiveSession, type ArchiveOutcome } from '../../../../services/sessionArchive';
import { useCoachStore } from '../../../../stores/useCoachStore';
import { useUserStore } from '../../../../stores/useUserStore';
import { settleFinishedSession } from '../../../log/todaySession';
import { localDayKey, releaseForgotten } from '../../../log/services/dayLogService';
import { readLinkedCoach } from '../../../coach/services/coachLink';
import { fetchMyLinkedCoach, publishFinishedWorkout } from '../../../coach/services/coachBridge';
import { priorBestKg, setIsPr } from '../../services/sessionPr';
import { useWorkoutStore } from '../../store/useWorkoutStore';

interface FinishCallbacks {
  /** Nothing was ticked, so nothing was saved. */
  onNothingSaved: () => void;
  /** The session is saved on this device; the finish sheet and open exercise can close. */
  onCommitted: () => void;
  /** The summary line to show, including what is planned next. */
  onSaved: (text: string) => void;
  /** The account backup finished (or was queued) after the session was saved. */
  onBackup: (outcome: ArchiveOutcome) => void;
}

/**
 * Saves the current session, tells the linked coach, and backs it up to the account.
 * The caller shows the results through the callbacks.
 */
export function finishSession(exercises: ExerciseItem[], callbacks: FinishCallbacks): void {
  const todayKey = localDayKey(new Date().toISOString());
  releaseForgotten(todayKey, 'workout');
  // Best lifts before today, so a set that beats them can be flagged as a record.
  const priors = new Map(
    exercises.map((e) => {
      const name = e.name || e.exerciseName || 'Exercise';
      return [name, priorBestKg(name, todayKey)] as const;
    }),
  );

  const session = useWorkoutStore.getState().commitSession();
  if (!session) {
    callbacks.onNothingSaved();
    return;
  }
  callbacks.onCommitted();
  tactileEngine.playPRCelebration();

  const athleteUser = useUserStore.getState();
  const finished = {
    id: crypto.randomUUID(),
    athleteId: athleteUser.userId || '',
    athleteName: athleteUser.name || 'Athlete',
    athleteAvatar: athleteUser.avatarUrl,
    title: session.title,
    tonnageKg: session.tonnageKg,
    totalSets: session.completedSets,
    totalReps: session.totalReps,
    avgRpe: session.avgRpe ?? 0,
    durationMinutes: session.durationMinutes,
    completedAt: new Date().toISOString(),
    exercises: session.exercises.map((e) => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      weightKg: e.weightKg,
      rpe: 0,
    })),
  };
  useCoachStore.getState().recordFinishedWorkout(finished);
  // The saved link only exists once the Coach tab has opened since joining, so ask the account too.
  void (async () => {
    const coachId = readLinkedCoach()?.id || (await fetchMyLinkedCoach())?.coach?.id;
    if (coachId) await publishFinishedWorkout(finished, coachId);
  })();

  const settled = settleFinishedSession();
  const burn = session.burnedKcal ? ` · ~${session.burnedKcal} kcal` : '';
  const summary = `Saved · ${session.durationMinutes} min${burn}.`;
  callbacks.onSaved(settled.nextTitle ? `${summary} Next up: ${settled.nextTitle}.` : summary);

  void (async () => {
    const outcome = await archiveSession({
      id: session.id,
      title: session.title,
      duration: session.durationMinutes > 0 ? `${session.durationMinutes}m` : '',
      duration_seconds: session.durationMinutes * 60,
      tonnage_kg: session.tonnageKg,
      total_sets: session.completedSets,
      strain: 0,
      exercises: session.items.map((e) => {
        const name = e.name || e.exerciseName || 'Exercise';
        const prior = priors.get(name) ?? 0;
        return {
          name,
          sets: e.sets.map((set) => {
            const weightKg = Number(set.weightKg ?? set.weight) || 0;
            const reps = Number(set.reps) || 0;
            return { ...set, weightKg, reps, is_pr: setIsPr(name, weightKg, reps, prior) };
          }),
          reps: e.sets[0]?.reps || 0,
          weightKg: e.sets[0]?.weightKg || e.sets[0]?.weight || 0,
          rpe: e.sets[0]?.rpe || 0,
        };
      }),
    });
    callbacks.onBackup(outcome);
  })();
}
