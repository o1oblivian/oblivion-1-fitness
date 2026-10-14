import { createStore } from '../../utils/createStore';
import { supabase } from '../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../services/authUser';
import {
  ConsultationProfile,
  EMPTY_CONSULTATION,
  MembershipTier,
  parseFacilities,
  parseInjuries,
  parseTrainingDays,
} from './consultationTypes';

const KEY = 'o1_consultation_v1';

function readLocal(): ConsultationProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_CONSULTATION;
    const stored = JSON.parse(raw);
    return {
      ...EMPTY_CONSULTATION,
      ...stored,
      facilities: parseFacilities(stored.facilities ?? stored.facility),
      injuries: parseInjuries(stored.injuries),
      trainingDays: parseTrainingDays(stored.trainingDays),
    };
  } catch {
    return EMPTY_CONSULTATION;
  }
}

function writeLocal(profile: ConsultationProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* private mode */
  }
}

function snapshot(state: ConsultationProfile): ConsultationProfile {
  const keys = Object.keys(EMPTY_CONSULTATION) as (keyof ConsultationProfile)[];
  return Object.fromEntries(keys.map((key) => [key, state[key]])) as unknown as ConsultationProfile;
}

async function saveCloud(profile: ConsultationProfile): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return;
  const core = {
    user_id: userId,
    primary_discipline: profile.primaryDiscipline || null,
    training_age: profile.trainingAge || null,
    coaching_intent: profile.coachingIntent || null,
    coaching_style: profile.coachingStyle || null,
    frequency_days: profile.frequencyDays || null,
    facility: profile.facilities.join(',') || null,
    selected_tier: profile.selectedTier,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('athlete_consultations').upsert({
    ...core,
    age_band: profile.ageBand || null,
    goal: profile.goal || null,
    training_days: profile.trainingDays.join(',') || null,
    session_minutes: profile.sessionMinutes || null,
    injuries: profile.injuries.join(',') || null,
    competition_date: profile.competitionDate || null,
  });
  if (!error) return;
  // Columns from 20261014_consultation_v2.sql may not exist yet; keep the core answers in sync.
  const retry = /column|schema cache/i.test(error.message) ? await supabase.from('athlete_consultations').upsert(core) : { error };
  if (retry.error) console.warn('[Consultation] Cloud save failed; kept on this device:', retry.error.message);
}

interface ConsultationActions {
  patch: (partial: Partial<ConsultationProfile>) => void;
  /** Edits after the consultation is finished (Settings). Saves locally and to the cloud. */
  update: (partial: Partial<ConsultationProfile>) => Promise<void>;
  lockIn: (tier?: MembershipTier) => Promise<void>;
  /** Restores a consultation saved from another device. Resolves true when one was found. */
  hydrate: () => Promise<boolean>;
}

const seeded = readLocal();

const consultationStore = createStore<ConsultationProfile, ConsultationActions>(seeded, (set, get) => ({
  patch: (partial) => {
    const next = { ...snapshot(get()), ...partial };
    writeLocal(next);
    set(partial);
  },
  update: async (partial) => {
    const next = { ...snapshot(get()), ...partial };
    writeLocal(next);
    set(partial);
    if (next.locked) await saveCloud(next);
  },
  lockIn: async (tier) => {
    const next = { ...snapshot(get()), selectedTier: tier || get().selectedTier || 'core', locked: true };
    writeLocal(next);
    set({ selectedTier: next.selectedTier, locked: true });
    await saveCloud(next);
  },
  hydrate: async () => {
    if (get().locked) return true;
    const userId = await getAuthenticatedUserId();
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return false;
    const { data, error } = await supabase
      .from('athlete_consultations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return false;
    const next: ConsultationProfile = {
      ageBand: data.age_band || '',
      goal: data.goal || '',
      primaryDiscipline: data.primary_discipline || '',
      trainingAge: data.training_age || '',
      coachingIntent: data.coaching_intent || '',
      coachingStyle: data.coaching_style || '',
      frequencyDays: Number(data.frequency_days) || EMPTY_CONSULTATION.frequencyDays,
      trainingDays: parseTrainingDays(data.training_days),
      sessionMinutes: Number(data.session_minutes) || 0,
      facilities: parseFacilities(data.facility),
      injuries: parseInjuries(data.injuries),
      competitionDate: data.competition_date || '',
      selectedTier: (data.selected_tier as MembershipTier) || 'core',
      locked: true,
    };
    writeLocal(next);
    set(next);
    return true;
  },
}));

export const useConsultationStore = consultationStore.useStore;
