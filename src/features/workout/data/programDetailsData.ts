import { mockProgramDetails } from '../../../services/devMocks';

export interface ProgramExerciseDetail {
  name: string;
  sets: string;
  reps: string;
  load: string;
}

export interface ProgramDetailInfo {
  banner: string;
  subtitle: string;
  focus: string;
  level: string;
  duration: string;
  exercises: ProgramExerciseDetail[];
}

export function getProgramDetailData(programTitle: string): ProgramDetailInfo | null {
  return mockProgramDetails()[programTitle.toUpperCase()] ?? null;
}
