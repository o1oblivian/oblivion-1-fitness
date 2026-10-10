import { createStore } from '../../utils/createStore';
import { supabase } from '../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../services/authUser';
import { ConsultationProfile, EMPTY_CONSULTATION, MembershipTier } from './consultationTypes';

const KEY = 'o1_consultation_v1';

function readLocal(): ConsultationProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_CONSULTATION;
    return { ...EMPTY_CONSULTATION, ...JSON.parse(raw) };
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

interface ConsultationActions {
  patch: (partial: Partial<ConsultationProfile>) => void;
  lockIn: (tier?: MembershipTier) => Promise<void>;
}

const seeded = readLocal();

const consultationStore = createStore<ConsultationProfile, ConsultationActions>(seeded, (set, get) => ({
  patch: (partial) => {
    const next = { ...get(), ...partial };
    writeLocal(next);
    set(partial);
  },
  lockIn: async (tier) => {
    const next = { ...get(), selectedTier: tier || get().selectedTier || 'core', locked: true };
    writeLocal(next);
    set({ selectedTier: next.selectedTier, locked: true });
    const userId = await getAuthenticatedUserId();
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return;
    await supabase.from('athlete_consultations').upsert({
      user_id: userId,
      primary_discipline: next.primaryDiscipline || null,
      training_age: next.trainingAge || null,
      coaching_intent: next.coachingIntent || null,
      coaching_style: next.coachingStyle || null,
      frequency_days: next.frequencyDays || null,
      facility: next.facility || null,
      selected_tier: next.selectedTier,
      updated_at: new Date().toISOString(),
    });
  },
}));

export const useConsultationStore = consultationStore.useStore;
