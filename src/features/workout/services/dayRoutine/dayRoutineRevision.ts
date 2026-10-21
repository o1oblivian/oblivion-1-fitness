import { useEffect, useState } from 'react';
import { useConsultationStore } from '../../../induction/useConsultationStore';

let dayRoutineRevision = 0;
const dayRoutineListeners = new Set<() => void>();

export function bumpDayRoutines() {
  dayRoutineRevision += 1;
  dayRoutineListeners.forEach((listener) => listener());
}

/** Re-render when a weekday workout is stored. */
export function useDayRoutineRevision(): number {
  const [revision, setRevision] = useState(dayRoutineRevision);
  useEffect(() => {
    const listener = () => setRevision(dayRoutineRevision);
    dayRoutineListeners.add(listener);
    return () => {
      dayRoutineListeners.delete(listener);
    };
  }, []);
  return revision;
}

// A change to any consultation answer that shapes the plan means the week must be rebuilt.
useConsultationStore.subscribe((next, prev) => {
  if (
    next.locked !== prev.locked ||
    next.frequencyDays !== prev.frequencyDays ||
    next.trainingAge !== prev.trainingAge ||
    next.facilities !== prev.facilities ||
    next.trainingDays !== prev.trainingDays ||
    next.sessionMinutes !== prev.sessionMinutes ||
    next.injuries !== prev.injuries ||
    next.ageBand !== prev.ageBand
  ) {
    bumpDayRoutines();
  }
});
