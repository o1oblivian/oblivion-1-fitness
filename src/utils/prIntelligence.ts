/**
 * OFC Live PR Intelligence & Auto-Progressive Overload Engine
 * Epley 1RM & Rep Max Comparison Engine
 */

export interface ExercisePRStats {
  exerciseName: string;
  allTimePR1RM: number;
  allTimePRWeight: number;
  allTimePRReps: number;
  allTimePRDate?: string;
  lastWeek1RM: number;
  lastWeekVolume: number;
  previousSession1RM: number;
  previousSessionDate?: string;
  totalHistoricalSessions: number;
}

export interface SetProgressEvaluation {
  current1RM: number;
  allTimePR1RM: number;
  isNewPR: boolean;
  prDiff: number; // e.g. +2.5 kg
  prPercent: number; // e.g. +2.4%
  lastWeek1RM: number;
  lastWeekDiff: number;
  lastWeekVolume: number;
  currentSetVolume: number;
  historySetsCount: number;
  statusBadge: {
    text: string;
    subtext?: string;
    variant: 'pr' | 'gain' | 'match' | 'neutral' | 'empty';
    isCelebration: boolean;
  };
}

/**
 * Standard Epley formula for estimated 1-Rep Max
 * 1RM = Weight * (1 + Reps / 30)
 */
export function calculate1RM(weight: number | string, reps: number | string): number {
  const w = Math.max(0, parseFloat(String(weight)) || 0);
  const r = Math.max(0, parseInt(String(reps)) || 0);

  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;

  const raw1RM = w * (1 + r / 30);
  return Math.round(raw1RM * 10) / 10;
}

/**
 * Estimate weights for target rep ranges based on 1RM
 */
export function calculateRepMaxTable(oneRM: number): Record<number, number> {
  const table: Record<number, number> = {};
  if (oneRM <= 0) return table;

  const reps = [1, 2, 3, 5, 6, 8, 10, 12, 15];
  reps.forEach((r) => {
    if (r === 1) {
      table[r] = oneRM;
    } else {
      // Inverse Epley: Weight = 1RM / (1 + Reps / 30)
      const estimatedWeight = oneRM / (1 + r / 30);
      table[r] = Math.round(estimatedWeight * 2) / 2; // snap to 0.5kg
    }
  });

  return table;
}

const LOCAL_PR_KEY = (email: string) => `o1fc_pr_records_${email || 'athlete'}`;

/**
 * Retrieves historical session records from localStorage and calculates PR stats
 */
export function getExerciseHistoryStats(
  exerciseName: string,
  userEmail: string = 'athlete@o1fc.app'
): ExercisePRStats {
  const defaultStats: ExercisePRStats = {
    exerciseName,
    allTimePR1RM: 0,
    allTimePRWeight: 0,
    allTimePRReps: 0,
    lastWeek1RM: 0,
    lastWeekVolume: 0,
    previousSession1RM: 0,
    totalHistoricalSessions: 0,
  };

  if (typeof window === 'undefined' || !exerciseName) return defaultStats;

  try {
    const normTarget = exerciseName.trim().toLowerCase();
    
    // Check manual override PR cache first
    let cachedPRs: Record<string, { pr1RM: number; weight: number; reps: number; date: string }> = {};
    try {
      cachedPRs = JSON.parse(localStorage.getItem(LOCAL_PR_KEY(userEmail)) || '{}');
    } catch {}

    const cachedPR = cachedPRs[normTarget];
    if (cachedPR) {
      defaultStats.allTimePR1RM = cachedPR.pr1RM;
      defaultStats.allTimePRWeight = cachedPR.weight;
      defaultStats.allTimePRReps = cachedPR.reps;
      defaultStats.allTimePRDate = cachedPR.date;
    }

    // Load past completed sessions
    const storageKey = `o1fc_completed_sessions_${userEmail}`;
    const sessionsRaw = localStorage.getItem(storageKey);
    if (!sessionsRaw) return defaultStats;

    const sessions = JSON.parse(sessionsRaw);
    if (!Array.isArray(sessions) || sessions.length === 0) return defaultStats;

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    let max1RMAllTime = defaultStats.allTimePR1RM;
    let maxWeightAllTime = defaultStats.allTimePRWeight;
    let maxRepsAllTime = defaultStats.allTimePRReps;
    let max1RMLastWeek = 0;
    let volumeLastWeek = 0;
    let prevSession1RM = 0;
    let matchingSessionsCount = 0;

    // Iterate completed sessions sorted newest first
    sessions.forEach((session: any) => {
      const sessionTime = new Date(session.completed_at || session.completedAt || now).getTime();
      const ageMs = now - sessionTime;
      const isLastWeekWindow = ageMs >= sevenDaysMs && ageMs <= fourteenDaysMs;

      let sessionHadExercise = false;
      let sessionMax1RM = 0;

      const exercises = session.exercises || [];
      exercises.forEach((ex: any) => {
        const exName = (ex.name || '').trim().toLowerCase();
        if (exName === normTarget || (normTarget.length > 4 && exName.includes(normTarget))) {
          sessionHadExercise = true;
          const sets = ex.sets || [];
          sets.forEach((s: any) => {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            if (w > 0 && r > 0) {
              const epley = calculate1RM(w, r);
              if (epley > sessionMax1RM) sessionMax1RM = epley;
              if (epley > max1RMAllTime) {
                max1RMAllTime = epley;
                maxWeightAllTime = w;
                maxRepsAllTime = r;
              }
              if (isLastWeekWindow) {
                volumeLastWeek += w * r;
                if (epley > max1RMLastWeek) max1RMLastWeek = epley;
              }
            }
          });
        }
      });

      if (sessionHadExercise) {
        matchingSessionsCount++;
        if (prevSession1RM === 0 && sessionMax1RM > 0) {
          prevSession1RM = sessionMax1RM;
          defaultStats.previousSessionDate = session.completed_at;
        }
      }
    });

    return {
      exerciseName,
      allTimePR1RM: max1RMAllTime,
      allTimePRWeight: maxWeightAllTime,
      allTimePRReps: maxRepsAllTime,
      lastWeek1RM: max1RMLastWeek,
      lastWeekVolume: volumeLastWeek,
      previousSession1RM: prevSession1RM,
      totalHistoricalSessions: matchingSessionsCount,
    };
  } catch {
    return defaultStats;
  }
}

/**
 * Record a new Personal Record into persistent memory
 */
export function recordPersonalRecord(
  exerciseName: string,
  weight: number,
  reps: number,
  userEmail: string = 'athlete@o1fc.app'
): boolean {
  if (!exerciseName || weight <= 0 || reps <= 0) return false;
  try {
    const normTarget = exerciseName.trim().toLowerCase();
    const epley = calculate1RM(weight, reps);
    const key = LOCAL_PR_KEY(userEmail);
    const cached = JSON.parse(localStorage.getItem(key) || '{}');

    if (!cached[normTarget] || epley > cached[normTarget].pr1RM) {
      cached[normTarget] = {
        pr1RM: epley,
        weight,
        reps,
        date: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(cached));
      return true;
    }
  } catch {}
  return false;
}

/**
 * Compares an active set in real time against historical athletic baseline
 */
export function evaluateSetProgression(
  exerciseName: string,
  weight: number | string,
  reps: number | string,
  allSetsInExercise: { weight?: number | string; reps?: number | string }[] = [],
  userEmail: string = 'athlete@o1fc.app'
): SetProgressEvaluation {
  const numWeight = Math.max(0, parseFloat(String(weight)) || 0);
  const numReps = Math.max(0, parseInt(String(reps)) || 0);
  const current1RM = calculate1RM(numWeight, numReps);
  const currentSetVolume = numWeight * numReps;

  // Total current exercise volume
  const currentExerciseVolume = allSetsInExercise.reduce(
    (acc, s) => acc + (parseFloat(String(s.weight)) || 0) * (parseInt(String(s.reps)) || 0),
    0
  );

  const history = getExerciseHistoryStats(exerciseName, userEmail);
  const allTimePR = history.allTimePR1RM;
  const lastWeek1RM = history.lastWeek1RM;
  const lastWeekVol = history.lastWeekVolume;

  const prDiff = allTimePR > 0 && current1RM > 0 ? Math.round((current1RM - allTimePR) * 10) / 10 : 0;
  const prPercent = allTimePR > 0 && current1RM > 0 ? Math.round(((current1RM - allTimePR) / allTimePR) * 1000) / 10 : 0;
  const lastWeekDiff = lastWeek1RM > 0 && current1RM > 0 ? Math.round((current1RM - lastWeek1RM) * 10) / 10 : 0;

  // Evaluation badges
  if (current1RM <= 0 || numWeight <= 0 || numReps <= 0) {
    return {
      current1RM: 0,
      allTimePR1RM: allTimePR,
      isNewPR: false,
      prDiff: 0,
      prPercent: 0,
      lastWeek1RM,
      lastWeekDiff: 0,
      lastWeekVolume: lastWeekVol,
      currentSetVolume: 0,
      historySetsCount: history.totalHistoricalSessions,
      statusBadge: {
        text: allTimePR > 0 ? `PR ${allTimePR}kg` : 'Epley 1RM',
        variant: 'empty',
        isCelebration: false,
      },
    };
  }

  // 1. All-Time PR Breakthrough!
  if (allTimePR > 0 && current1RM > allTimePR) {
    return {
      current1RM,
      allTimePR1RM: allTimePR,
      isNewPR: true,
      prDiff,
      prPercent,
      lastWeek1RM,
      lastWeekDiff,
      lastWeekVolume: lastWeekVol,
      currentSetVolume,
      historySetsCount: history.totalHistoricalSessions,
      statusBadge: {
        text: `+${prDiff} kg PR`,
        subtext: `1RM ${current1RM}kg (+${prPercent}%)`,
        variant: 'pr',
        isCelebration: true,
      },
    };
  }

  // 2. Matches All-Time PR
  if (allTimePR > 0 && Math.abs(current1RM - allTimePR) <= 0.2) {
    return {
      current1RM,
      allTimePR1RM: allTimePR,
      isNewPR: false,
      prDiff: 0,
      prPercent: 0,
      lastWeek1RM,
      lastWeekDiff,
      lastWeekVolume: lastWeekVol,
      currentSetVolume,
      historySetsCount: history.totalHistoricalSessions,
      statusBadge: {
        text: `Matches PR (${allTimePR}kg)`,
        variant: 'match',
        isCelebration: false,
      },
    };
  }

  // 3. Progressive Overload vs Last Week's 1RM or Volume
  if (lastWeek1RM > 0 && current1RM > lastWeek1RM) {
    return {
      current1RM,
      allTimePR1RM: allTimePR,
      isNewPR: false,
      prDiff,
      prPercent,
      lastWeek1RM,
      lastWeekDiff,
      lastWeekVolume: lastWeekVol,
      currentSetVolume,
      historySetsCount: history.totalHistoricalSessions,
      statusBadge: {
        text: `+${lastWeekDiff}kg vs Last Wk`,
        subtext: `1RM: ${current1RM}kg`,
        variant: 'gain',
        isCelebration: false,
      },
    };
  }

  // 4. Volume comparison vs Last Week
  if (lastWeekVol > 0 && currentExerciseVolume > lastWeekVol) {
    const volGainPct = Math.round(((currentExerciseVolume - lastWeekVol) / lastWeekVol) * 100);
    return {
      current1RM,
      allTimePR1RM: allTimePR,
      isNewPR: false,
      prDiff,
      prPercent,
      lastWeek1RM,
      lastWeekDiff,
      lastWeekVolume: lastWeekVol,
      currentSetVolume,
      historySetsCount: history.totalHistoricalSessions,
      statusBadge: {
        text: `Vol +${volGainPct}% vs Last Wk`,
        subtext: `1RM: ${current1RM}kg`,
        variant: 'gain',
        isCelebration: false,
      },
    };
  }

  // 5. Standard calculated 1RM
  return {
    current1RM,
    allTimePR1RM: allTimePR,
    isNewPR: false,
    prDiff,
    prPercent,
    lastWeek1RM,
    lastWeekDiff,
    lastWeekVolume: lastWeekVol,
    currentSetVolume,
    historySetsCount: history.totalHistoricalSessions,
    statusBadge: {
      text: `1RM ${current1RM}kg`,
      subtext: allTimePR > 0 ? `${prDiff}kg of PR (${allTimePR}kg)` : undefined,
      variant: 'neutral',
      isCelebration: false,
    },
  };
}
