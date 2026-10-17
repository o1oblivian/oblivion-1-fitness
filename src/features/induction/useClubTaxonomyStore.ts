import { useEffect } from 'react';
import fallbackRows from '../../../shared/clubTaxonomy.json';
import { supabase } from '../../services/supabaseClient';
import { createStore } from '../../utils/createStore';

export interface TaxonomyOption {
  id: string;
  groupKey: string;
  optionKey: string;
  label: string;
  detail: string;
  sortOrder: number;
  active: boolean;
}

/** Consultation steps in order. `discipline` and `competition` only show when they apply. */
export const INTAKE_GROUPS = [
  'age_band',
  'goal',
  'discipline',
  'training_age',
  'facility',
  'training_days',
  'session_length',
  'plan_style',
  'competition',
] as const;

export type IntakeGroup = (typeof INTAKE_GROUPS)[number];

/** Short names for each answer, shown in summaries and coach applications. */
export const INTAKE_TITLES = {
  age_band: 'Age',
  goal: 'Goal',
  discipline: 'Sport',
  training_age: 'Training experience',
  facility: 'Where you train',
  training_days: 'Training days',
  session_length: 'Session length',
  injuries: 'Areas to protect',
  plan_style: 'Your plan',
  competition: 'Competition',
  coaching_intent: 'Coaching',
  coaching_style: 'Feedback style',
  frequency: 'Days a week',
} as const;

export const INTAKE_PROMPTS: Record<IntakeGroup, { title: string; subtitle: string }> = {
  age_band: { title: 'How old are you?', subtitle: 'Keeps your training safe and comfortable for your age.' },
  goal: { title: 'What do you want most?', subtitle: 'Pick the one that matters most right now.' },
  discipline: { title: 'Which sport or event?', subtitle: 'Puts matching workouts, reels and coaches first.' },
  training_age: { title: 'How much have you trained before?', subtitle: 'Sets how many sets, how heavy and how hard you start.' },
  facility: { title: 'Where do you train?', subtitle: 'Pick all that apply. Workouts use only your equipment.' },
  training_days: { title: 'Which days can you train?', subtitle: 'Tap your days. The rest are for recovery.' },
  session_length: { title: 'How long per workout?', subtitle: 'Sets how many exercises we give you.' },
  plan_style: { title: 'Want us to plan your workouts?', subtitle: 'You can change this any time in Settings.' },
  competition: { title: 'When is your next event?', subtitle: 'Your training will build toward this date.' },
};

/** Groups whose meaning lives in code. Their wording ships with the app, not the database. */
const CODE_OWNED = new Set(['age_band', 'goal', 'discipline', 'training_age', 'facility', 'session_length', 'injuries', 'plan_style', 'coaching_intent', 'coaching_style']);

interface TaxonomyState {
  options: TaxonomyOption[];
  ready: boolean;
}

interface TaxonomyActions {
  load: () => Promise<void>;
}

const CACHE_KEY = 'o1_club_taxonomy_v1';

const CONFIG_DETAIL = new Map(
  (fallbackRows as Array<{ group_key?: string; option_key?: string; detail?: string }>)
    .filter((row) => row.detail)
    .map((row) => [`${row.group_key}:${row.option_key}`, String(row.detail)]),
);

function mapRow(row: {
  id?: string;
  group_key?: string;
  option_key?: string;
  label?: string;
  detail?: string;
  sort_order?: number;
  active?: boolean;
}): TaxonomyOption | null {
  if (!row.group_key || !row.option_key || !row.label) return null;
  return {
    id: String(row.id || `${row.group_key}:${row.option_key}`),
    groupKey: row.group_key,
    optionKey: row.option_key,
    label: row.label,
    detail: row.detail || CONFIG_DETAIL.get(`${row.group_key}:${row.option_key}`) || '',
    sortOrder: Number(row.sort_order || 0),
    active: row.active !== false,
  };
}

function fromConfig(): TaxonomyOption[] {
  return (fallbackRows as Array<Parameters<typeof mapRow>[0]>).map(mapRow).filter((row): row is TaxonomyOption => Boolean(row));
}

/** Remote rows for database-managed groups, app wording for code-owned groups and anything missing. */
function withConfig(remote: TaxonomyOption[]): TaxonomyOption[] {
  const managed = remote.filter((row) => !CODE_OWNED.has(row.groupKey));
  const known = new Set(managed.map((row) => `${row.groupKey}:${row.optionKey}`));
  return [...managed, ...fromConfig().filter((row) => !known.has(`${row.groupKey}:${row.optionKey}`))];
}

function readCache(): TaxonomyOption[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return fromConfig();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return fromConfig();
    return withConfig(parsed.map(mapRow).filter((row): row is TaxonomyOption => Boolean(row)));
  } catch {
    return fromConfig();
  }
}

export function optionsIn(options: TaxonomyOption[], group: string): TaxonomyOption[] {
  return options.filter((row) => row.groupKey === group && row.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

const taxonomyStore = createStore<TaxonomyState, TaxonomyActions>({ options: readCache(), ready: false }, (set) => ({
  load: async () => {
    const { data, error } = await supabase
      .from('club_taxonomy_options')
      .select('id, group_key, option_key, label, detail, sort_order, active')
      .eq('active', true);
    if (error || !Array.isArray(data) || data.length === 0) {
      const local = readCache();
      set({ options: local, ready: true });
      return;
    }
    const remote = data.map(mapRow).filter((row): row is TaxonomyOption => Boolean(row));
    if (remote.length === 0) {
      set({ options: fromConfig(), ready: true });
      return;
    }
    const rows = withConfig(remote);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* private mode */
    }
    set({ options: rows, ready: true });
  },
}));

const useClubTaxonomyStore = taxonomyStore.useStore;

export function useClubTaxonomy(): TaxonomyOption[] {
  const options = useClubTaxonomyStore((state) => state.options);
  useEffect(() => {
    void useClubTaxonomyStore.getState().load();
  }, []);
  return options;
}
