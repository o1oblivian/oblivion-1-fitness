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

export const INTAKE_GROUPS = ['discipline', 'training_age', 'coaching_intent', 'coaching_style', 'facility', 'frequency'] as const;

export const INTAKE_TITLES: Record<(typeof INTAKE_GROUPS)[number], string> = {
  discipline: 'Primary discipline',
  training_age: 'Training age',
  coaching_intent: 'Coaching intent',
  coaching_style: 'Coaching dynamic',
  facility: 'Facility',
  frequency: 'Weekly split',
};

interface TaxonomyState {
  options: TaxonomyOption[];
  ready: boolean;
}

interface TaxonomyActions {
  load: () => Promise<void>;
}

const CACHE_KEY = 'o1_club_taxonomy_v1';

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
    detail: row.detail || '',
    sortOrder: Number(row.sort_order || 0),
    active: row.active !== false,
  };
}

function fromConfig(): TaxonomyOption[] {
  return (fallbackRows as Array<Parameters<typeof mapRow>[0]>).map(mapRow).filter((row): row is TaxonomyOption => Boolean(row));
}

function readCache(): TaxonomyOption[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return fromConfig();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return fromConfig();
    return parsed.map(mapRow).filter((row): row is TaxonomyOption => Boolean(row));
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
    const rows = data.map(mapRow).filter((row): row is TaxonomyOption => Boolean(row));
    if (rows.length === 0) {
      set({ options: fromConfig(), ready: true });
      return;
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* private mode */
    }
    set({ options: rows, ready: true });
  },
}));

export const useClubTaxonomyStore = taxonomyStore.useStore;

export function useClubTaxonomy(): TaxonomyOption[] {
  const options = useClubTaxonomyStore((state) => state.options);
  useEffect(() => {
    void useClubTaxonomyStore.getState().load();
  }, []);
  return options;
}
