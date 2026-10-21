import type { Athlete } from '../../services/coachService';
import type { FloorCardAction } from './FloorAthleteCard';

/** Who a coach is writing to, and which workout or check-in the note answers. */
export interface FeedbackTarget {
  athleteId: string;
  name: string;
  avatar?: string;
  athlete?: Athlete;
  workoutId?: string;
  checkinId?: string;
}

/** Builds the buttons shown on an athlete card for a feedback target. */
export type ActionsFor = (target: FeedbackTarget, feedbackLabel?: string) => FloorCardAction[];

/** "5m ago", "3h ago", "2d ago". Empty when the date does not parse. */
export function ago(iso: string | undefined): string {
  const at = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(at)) return '';
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

/** A count for a stat tile, or "--" when it is missing or not above zero. */
export function stat(value: number | null | undefined, unit = ''): string {
  return value == null || !Number.isFinite(value) || value <= 0
    ? '--'
    : `${Math.round(value).toLocaleString()}${unit}`;
}

export function kg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '--';
  return `${Math.round(value).toLocaleString()} kg`;
}

export function rosterId(athlete: Athlete): string {
  return athlete.client_id || athlete.id;
}

/** Roster row for the target, or a minimal one so athletes outside the roster can still get a workout. */
export function dispatchTarget(target: FeedbackTarget): Athlete {
  return (
    target.athlete ?? {
      id: target.athleteId,
      client_id: target.athleteId,
      name: target.name,
      handle: '',
      avatar: target.avatar,
      status: 'Active',
      readiness: null,
      volume: null,
    }
  );
}
