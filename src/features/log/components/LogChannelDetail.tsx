import React from 'react';
import { LogLedger, type LedgerRowActions } from './LogLedger';
import { collapsedReps, collapsedWeight, formatLoad, knownSets } from '../liftLedger';
import { resistanceMet } from '../../workout/utils/sessionEnergy';
import type {
  CardioDayRecord,
  MeditationDayRecord,
  NutritionDayRecord,
  SleepDayRecord,
  TelemetryCategory,
  WorkoutDayRecord,
} from '../store/useTelemetryHistoryStore';
import { cardioLine, line, mindfulLine, part, sheetFig, sleepLine, stepKcalText } from './logHistoryFormat';

export function ChannelDetail({
  category,
  workout,
  cardio,
  food,
  sleep,
  mindful,
  steps,
  rowActions,
}: {
  category: TelemetryCategory;
  workout?: WorkoutDayRecord;
  cardio?: CardioDayRecord;
  food?: NutritionDayRecord;
  sleep?: SleepDayRecord;
  mindful?: MeditationDayRecord;
  steps: number;
  rowActions?: LedgerRowActions;
}) {
  if (category === 'workout') {
    const loggedLifts = (workout?.exercises || []).filter((exercise) => knownSets(exercise).length > 0 || (exercise.completed && ((exercise.reps || 0) > 0 || (exercise.weightKg || 0) > 0)));
    if (!workout?.hasData || (loggedLifts.length === 0 && !(workout.completedSets > 0) && !(workout.tonnageKg > 0))) {
      return <EmptyCopy>No lifts logged yet</EmptyCopy>;
    }
    const exercises = loggedLifts;
    const rows = exercises.length > 0
      ? exercises.map((exercise, index) => {
          const setLog = knownSets(exercise);
          return {
            id: `${exercise.name}-${index}`,
            name: exercise.name || 'Lift',
            cells: [
              setLog.length > 0 ? String(setLog.length) : sheetFig(exercise.sets),
              collapsedReps(setLog, exercise.reps),
              collapsedWeight(setLog, exercise.weightKg),
            ],
            details: setLog.length > 1
              ? setLog.map((set, setIndex) => ({
                  id: `${exercise.name}-${index}-${setIndex}`,
                  name: String(setIndex + 1),
                  cells: ['', sheetFig(set.reps), formatLoad(set.weightKg)],
                }))
              : undefined,
          };
        })
      : [{
          id: 'session',
          name: workout.routineName || 'Workout',
          cells: [sheetFig(workout.completedSets), '--', sheetFig(workout.tonnageKg)],
        }];
    return (
      <>
        <LogLedger
          nameLabel="Lift"
          columns={[{ label: 'Sets', width: '2.5rem' }, { label: 'Reps', width: '3.25rem' }, { label: 'kg', width: '4.75rem' }]}
          rows={rows}
          rowActions={exercises.length > 0 ? rowActions : undefined}
        />
        {(workout.burnedKcal ?? 0) > 0 && <BurnNote workout={workout} />}
      </>
    );
  }

  if (category === 'cardio') {
    const logged = line([
      part(cardio?.distanceKm, ' km', 1),
      part(cardio?.durationMinutes, ' min'),
      part(cardio?.burnedKcal, ' kcal'),
    ]);
    if (logged === '--' && steps > 0) {
      return (
        <LogLedger
          nameLabel="Day"
          columns={[{ label: 'steps', width: '4.5rem' }, { label: 'kcal', width: '3.75rem' }]}
          rows={[{ id: 'steps', name: 'Steps', cells: [steps.toLocaleString(), stepKcalText(cardio) || '--'] }]}
          rowActions={rowActions}
        />
      );
    }
    const summary = cardioLine(cardio, steps);
    if (summary === '--') return <EmptyCopy>No cardio logged for this day.</EmptyCopy>;
    const name = cardio?.activityType && cardio.activityType !== 'Steps' ? cardio.activityType : 'Cardio';
    return (
      <LogLedger
        nameLabel="Session"
        columns={[{ label: 'km', width: '3rem' }, { label: 'min', width: '3rem' }, { label: 'kcal', width: '3.25rem' }]}
        rows={[{
          id: 'cardio',
          name,
          cells: [sheetFig(cardio?.distanceKm, 1), sheetFig(cardio?.durationMinutes), sheetFig(cardio?.burnedKcal)],
        }]}
        rowActions={rowActions}
      />
    );
  }

  if (category === 'nutrition') {
    if (!food?.hasData || (food.calories <= 0 && (food.meals || []).length === 0)) return <EmptyCopy>No food logged for this day.</EmptyCopy>;
    const meals = food.meals || [];
    const rows = meals.length > 0
      ? meals.map((meal, index) => ({
          id: `meal:${index}`,
          name: meal.name || 'Meal',
          cells: [sheetFig(meal.calories), sheetFig(meal.proteinG, 1), sheetFig(meal.carbsG, 1), sheetFig(meal.fatsG, 1)],
        }))
      : [{
          id: 'day',
          name: 'Day',
          cells: [sheetFig(food.calories), sheetFig(food.proteinG, 1), sheetFig(food.carbsG, 1), sheetFig(food.fatsG, 1)],
        }];
    return (
      <LogLedger
        nameLabel="Meal"
        columns={[
          { label: 'kcal', width: '3.25rem' },
          { label: 'P', width: '2.25rem' },
          { label: 'C', width: '2.25rem' },
          { label: 'F', width: '2.25rem' },
        ]}
        rows={rows}
        rowActions={rowActions}
      />
    );
  }

  if (category === 'sleep') {
    if (sleepLine(sleep) === '--') return <EmptyCopy>No sleep logged for this day.</EmptyCopy>;
    const hasRecovery = (sleep?.recoveryPercent ?? 0) > 0;
    return (
      <LogLedger
        nameLabel="Rest"
        columns={hasRecovery ? [{ label: 'h', width: '3rem' }, { label: 'Recovery', width: '4.5rem' }] : [{ label: 'h', width: '3rem' }]}
        rows={[{
          id: 'sleep',
          name: 'Sleep',
          cells: hasRecovery ? [sheetFig(sleep?.durationHours, 1), `${sheetFig(sleep?.recoveryPercent)}%`] : [sheetFig(sleep?.durationHours, 1)],
        }]}
        rowActions={rowActions}
      />
    );
  }

  if (mindfulLine(mindful) === '--') return <EmptyCopy>No mindful session logged for this day.</EmptyCopy>;
  const mindfulName = [mindful?.protocol, mindful?.coherence].filter(Boolean).join(' · ') || 'Mindful';
  return (
    <LogLedger
      nameLabel="Session"
      columns={[{ label: 'min', width: '3rem' }]}
      rows={[{ id: 'mindful', name: mindfulName, cells: [sheetFig(mindful?.minutes)] }]}
      rowActions={rowActions}
    />
  );
}

function BurnNote({ workout }: { workout: WorkoutDayRecord }) {
  const rpe = workout.intensityRpe > 0 ? workout.intensityRpe : null;
  const met = Math.round(resistanceMet(rpe) * 10) / 10;
  const inputs = line([part(workout.durationMinutes, ' min'), rpe ? `RPE ${rpe}` : null, `${met} MET`]);
  return (
    <div className="mt-3 pt-2.5 border-t border-white/[0.07] space-y-1">
      <p className="text-[12px] text-o1-text">
        {Math.round(workout.burnedKcal ?? 0).toLocaleString()} kcal active <span className="text-o1-muted">· {inputs}</span>
      </p>
      <p className="text-[11px] leading-relaxed text-o1-muted">
        Active burn only, from training time, effort and bodyweight. Watches add resting burn to the total, so they read higher for the same session.
      </p>
    </div>
  );
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="pt-2 text-[11px] text-neutral-500">{children}</p>;
}
