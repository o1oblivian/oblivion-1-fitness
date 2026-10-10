import { Athlete } from './coachService';
import { mockFloorAthletes } from '../../../services/devMocks';
import { isSampleId } from './sampleIds';

/** Real athletes when the coach has any; otherwise dev mocks (empty in release builds). */
export function coachPeople(real: Athlete[]): { people: Athlete[]; sample: boolean } {
  const live = real.filter((athlete) => !isSampleId(athlete.id));
  if (live.length > 0) return { people: live, sample: false };
  const samples = mockFloorAthletes();
  return { people: samples, sample: samples.length > 0 };
}
