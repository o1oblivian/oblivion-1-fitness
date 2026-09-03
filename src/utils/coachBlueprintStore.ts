// O1FC Coach Blueprint Vault & Persistence Engine
// Allows coaches to save synthesized and custom workouts for rapid, recurring dispatch.

export type SetType = 'working' | 'warmup' | 'dropset' | 'amrap' | 'cluster';

export interface IntelligentSet {
  setNum: number;
  type: SetType;
  reps: number;
  weight: number;
  rpe: number;
}

export interface StagedExercise {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  movementType: 'Compound' | 'Isolation' | 'Functional' | 'Plyometric' | 'Mobility';
  restSec: number;
  tempo: string;
  supersetGroup?: string;
  progressionScheme: 'Straight' | 'Ascending' | 'Pyramid' | 'Reverse Pyramid' | 'Wave 5/3/1' | 'Cluster 4x(2+2)';
  sets: IntelligentSet[];
  notes: string;
  isExpanded?: boolean;
}

export interface CoachSavedBlueprint {
  id: string;
  title: string;
  split: string;
  focus: string;
  notes?: string;
  estimatedMinutes: number;
  equipment?: string;
  intensity?: string;
  createdAt: string;
  exercises: StagedExercise[];
}

const STORAGE_KEY = 'o1fc_coach_saved_blueprints';

export function getCoachSavedBlueprints(): CoachSavedBlueprint[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load coach blueprints from localStorage:', err);
    return [];
  }
}

export function saveCoachBlueprint(
  blueprint: Omit<CoachSavedBlueprint, 'id' | 'createdAt'>
): CoachSavedBlueprint {
  const existing = getCoachSavedBlueprints();
  const id = `bp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newBlueprint: CoachSavedBlueprint = {
    ...blueprint,
    id,
    createdAt: new Date().toISOString(),
  };

  const updated = [newBlueprint, ...existing];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to persist coach blueprint:', err);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc-coach-blueprints-updated', { detail: updated }));
  }

  return newBlueprint;
}

export function updateCoachBlueprintTitle(id: string, newTitle: string): CoachSavedBlueprint[] {
  const existing = getCoachSavedBlueprints();
  const updated = existing.map((bp) => (bp.id === id ? { ...bp, title: newTitle.trim() || bp.title } : bp));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to update coach blueprint title:', err);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc-coach-blueprints-updated', { detail: updated }));
  }

  return updated;
}

export function deleteCoachBlueprint(id: string): CoachSavedBlueprint[] {
  const existing = getCoachSavedBlueprints();
  const updated = existing.filter((b) => b.id !== id);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to delete coach blueprint:', err);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc-coach-blueprints-updated', { detail: updated }));
  }

  return updated;
}
