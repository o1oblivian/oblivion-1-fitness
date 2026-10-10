import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import type { MuscleId, VolumeStatus } from './types';

export interface MuscleSpec {
  id: MuscleId;
  label: string;
  /** Productive weekly hard-set range. Below = under-trained, above = over. */
  min: number;
  max: number;
}

export const MUSCLES: MuscleSpec[] = [
  { id: 'chest', label: 'Chest', min: 10, max: 20 },
  { id: 'upperBack', label: 'Upper Back', min: 10, max: 20 },
  { id: 'shoulders', label: 'Shoulders', min: 8, max: 18 },
  { id: 'biceps', label: 'Biceps', min: 6, max: 14 },
  { id: 'triceps', label: 'Triceps', min: 6, max: 14 },
  { id: 'forearms', label: 'Forearms', min: 4, max: 12 },
  { id: 'core', label: 'Core', min: 4, max: 14 },
  { id: 'lowerBack', label: 'Lower Back', min: 3, max: 10 },
  { id: 'quads', label: 'Quads', min: 8, max: 18 },
  { id: 'hamstrings', label: 'Hamstrings', min: 6, max: 14 },
  { id: 'glutes', label: 'Glutes', min: 6, max: 16 },
  { id: 'calves', label: 'Calves', min: 6, max: 14 },
];

export const MUSCLE_BY_ID: Record<MuscleId, MuscleSpec> = MUSCLES.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<MuscleId, MuscleSpec>,
);

export function volumeStatus(sets: number, spec: MuscleSpec): VolumeStatus {
  if (sets <= 0) return 'none';
  if (sets < spec.min) return 'under';
  if (sets <= spec.max) return 'optimal';
  return 'over';
}

export interface MuscleCredit {
  primary: MuscleId[];
  secondary: MuscleId[];
}

type Rule = { test: RegExp; primary: MuscleId[]; secondary: MuscleId[] };

const IGNORE =
  /\b(run|running|jog|sprint|treadmill|elliptical|swim|swimming|cycling|bike|assault|ski ?erg|rower|rowing machine|erg|stretch|mobility|yoga|foam|cardio|walk(?!ing lunge)|hike|meditat|breath)/i;

/** Ordered: the first matching rule wins, so specific movements sit above generic ones. */
const RULES: Rule[] = [
  // Legs & hinge first so "leg press / leg curl / leg extension" never match upper-body rules.
  { test: /leg curl|hamstring curl|nordic|glute[- ]?ham/i, primary: ['hamstrings'], secondary: [] },
  { test: /romanian|\brdl\b|stiff[- ]?leg|good morning/i, primary: ['hamstrings', 'glutes', 'lowerBack'], secondary: [] },
  { test: /deadlift/i, primary: ['hamstrings', 'glutes', 'lowerBack'], secondary: ['upperBack', 'forearms', 'quads'] },
  { test: /back extension|hyperextension|superman/i, primary: ['lowerBack'], secondary: ['glutes', 'hamstrings'] },
  { test: /hip thrust|glute bridge|bridge|glute|kickback.*glute|abductor|donkey/i, primary: ['glutes'], secondary: ['hamstrings'] },
  { test: /calf|heel raise|tibialis/i, primary: ['calves'], secondary: [] },
  { test: /lunge|split squat|step[- ]?up|bulgarian/i, primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  { test: /squat|leg press|hack|leg extension|sissy|wall sit/i, primary: ['quads'], secondary: ['glutes'] },
  { test: /clean|snatch|thruster|kettlebell swing|\bswing\b|jerk/i, primary: ['glutes', 'hamstrings', 'quads'], secondary: ['upperBack', 'shoulders'] },

  // Close-grip pressing & triceps before chest.
  { test: /close[- ]?grip bench|jm press|skull|tricep|pushdown|push[- ]?down|tate/i, primary: ['triceps'], secondary: ['chest'] },
  { test: /\bdips?\b/i, primary: ['chest', 'triceps'], secondary: ['shoulders'] },

  // Shoulders before back/chest so "reverse fly", "upright row", "face pull" land correctly.
  { test: /face pull|reverse fly|reverse flye|rear delt/i, primary: ['shoulders'], secondary: ['upperBack'] },
  { test: /upright row|lateral raise|side raise|front raise|overhead press|shoulder press|military|arnold|pike push|push press|\bohp\b|landmine press/i, primary: ['shoulders'], secondary: ['triceps'] },

  // Back.
  { test: /shrug/i, primary: ['upperBack'], secondary: ['forearms'] },
  { test: /pull[- ]?up|chin[- ]?up|pulldown|pull[- ]?down|\brow\b|pullover|t[- ]?bar|seal row|\bpullups?\b/i, primary: ['upperBack'], secondary: ['biceps', 'forearms'] },

  // Chest.
  { test: /bench|chest press|push[- ]?up|pec|\bfly\b|flye|crossover|floor press|incline press|decline press/i, primary: ['chest'], secondary: ['triceps', 'shoulders'] },

  // Arms.
  { test: /curl/i, primary: ['biceps'], secondary: ['forearms'] },
  { test: /extension|kickback/i, primary: ['triceps'], secondary: [] },
  { test: /wrist|forearm|grip|farmer|carry|dead hang/i, primary: ['forearms'], secondary: ['core', 'upperBack'] },

  // Core.
  { test: /crunch|sit[- ]?up|plank|leg raise|knee raise|russian twist|woodchop|wood chop|hollow|dead bug|ab wheel|rollout|\babs?\b|core|pallof|v[- ]?up/i, primary: ['core'], secondary: [] },
];

const GROUP_ALIASES: { test: RegExp; ids: MuscleId[] }[] = [
  { test: /lower back|spine|erector/i, ids: ['lowerBack'] },
  { test: /posterior chain/i, ids: ['hamstrings', 'glutes', 'lowerBack'] },
  { test: /lower body/i, ids: ['quads', 'glutes', 'hamstrings'] },
  { test: /chest|pec/i, ids: ['chest'] },
  { test: /shoulder|delt/i, ids: ['shoulders'] },
  { test: /bicep/i, ids: ['biceps'] },
  { test: /tricep/i, ids: ['triceps'] },
  { test: /forearm|grip/i, ids: ['forearms'] },
  { test: /core|\babs?\b|oblique/i, ids: ['core'] },
  { test: /quad/i, ids: ['quads'] },
  { test: /hamstring/i, ids: ['hamstrings'] },
  { test: /glute|hip/i, ids: ['glutes'] },
  { test: /calf|calves/i, ids: ['calves'] },
  { test: /lat|back|trap|rhomboid/i, ids: ['upperBack'] },
  { test: /\barms?\b/i, ids: ['biceps', 'triceps'] },
];

function idsFromGroupText(text: string | undefined): MuscleId[] {
  if (!text) return [];
  for (const alias of GROUP_ALIASES) {
    if (alias.test.test(text)) return alias.ids;
  }
  return [];
}

let definitionIndex: Map<string, (typeof EXERCISE_DATABASE)[number]> | null = null;

function lookupDefinition(name: string) {
  if (!definitionIndex) {
    definitionIndex = new Map();
    for (const def of EXERCISE_DATABASE) {
      definitionIndex.set(def.name.toLowerCase(), def);
    }
  }
  return definitionIndex.get(name.toLowerCase());
}

const cache = new Map<string, MuscleCredit | null>();

/** Returns null for non-resistance work (cardio, mobility) or unknown movements. */
export function classifyExercise(rawName: string): MuscleCredit | null {
  const name = rawName.trim();
  if (!name) return null;
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  let result: MuscleCredit | null = null;

  if (!IGNORE.test(name) || /\brow\b/i.test(name)) {
    const rule = RULES.find((r) => r.test.test(name));
    if (rule) {
      result = { primary: rule.primary, secondary: rule.secondary };
    } else {
      const def = lookupDefinition(name);
      if (def) {
        const primary = idsFromGroupText(def.primaryMuscle || def.primaryMuscleGroup);
        const secondary = (def.secondaryMuscles || []).flatMap((s) => idsFromGroupText(s));
        if (primary.length > 0) {
          result = {
            primary,
            secondary: secondary.filter((id) => !primary.includes(id)),
          };
        }
      }
    }
  }

  cache.set(name, result);
  return result;
}
