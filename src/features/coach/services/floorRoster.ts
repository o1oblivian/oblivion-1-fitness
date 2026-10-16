import type { Athlete } from './coachService';
import { isSampleId } from './sampleIds';

/** Linked clients only. An empty roster stays empty. */
export function liveClients(real: Athlete[]): Athlete[] {
  return real.filter((athlete) => !isSampleId(athlete.id) && !isSampleId(athlete.client_id));
}
