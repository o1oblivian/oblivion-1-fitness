export interface SquadAthlete {
  id: string;
  callsign: string;
  name: string;
  tier: 'Tier 1 Operator' | 'Vanguard' | 'Cadet';
  status: 'In Session' | 'Telemetry Warning' | 'Audit Due' | 'Optimal Rest';
  statusColor: 'cyan' | 'crimson' | 'amber';
  heartRate: number;
  cnsStrain: number; // 0 - 21 scale
  recoveryScore: number; // 0 - 100%
  lastCheckIn: string;
  currentProtocol: string;
  jointMobilityAlert?: string;
  tempoScore: number; // 0 - 100%
}

export interface BiomechanicsAuditData {
  athleteId: string;
  athleteName: string;
  lift: string;
  kneeValgusAngle: string;
  barPathDeviation: string;
  hipHingeDegrees: string;
  tempoAdherence: number;
  tacticalVerdict: string;
  timestamp: string;
}

export interface CoachDirective {
  readonly id: string;
  readonly tag: 'RECOVERY' | 'TRAINING' | 'NUTRITION' | 'PERFORMANCE';
  readonly title: string;
  readonly summary: string;
  readonly affectedCount: number;
  readonly priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  readonly badgeStyle: string;
}

export interface AssignedRoutineRecord {
  readonly id: string;
  readonly athleteId: string;
  readonly athleteName: string;
  readonly title: string;
  readonly assignedAt: string;
}

export interface CoachEarningsTransaction {
  readonly id: string;
  readonly athleteName: string;
  readonly plan: string;
  readonly amount: number;
  readonly date: string;
  readonly status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
}

export type CoachEarnings = readonly CoachEarningsTransaction[];

export interface CoachProtocol {
  readonly directives: readonly CoachDirective[];
  readonly assignedRoutines: readonly AssignedRoutineRecord[];
  readonly athleteRoster: readonly SquadAthlete[];
  readonly earningsTransactions: readonly CoachEarningsTransaction[];
}

export interface DispatchedExercise {
  readonly id: string;
  readonly name: string;
  readonly sets: number;
  readonly reps: number | string;
  readonly rpe?: number;
  readonly targetMuscle?: string;
  readonly restSecs?: number;
  readonly notes?: string;
}

export interface CoachDispatchedWorkout {
  readonly id: string;
  readonly title: string;
  readonly coachName: string;
  readonly coachAvatar?: string;
  readonly category: string;
  readonly totalSets: number;
  readonly durationMins: number;
  readonly status: 'pending' | 'active' | 'completed';
  readonly dispatchedAt: string;
  readonly notes?: string;
  readonly exercises: readonly DispatchedExercise[];
}
