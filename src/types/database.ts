export interface FoodLogRecord {
  id: string; athlete_id: string; meal_type: string; name: string;
  calories: number; protein: number; carbs: number; fat: number;
  logged_at: string; is_pending_sync?: boolean;
}

export interface WorkoutLogRecord {
  id: string; athlete_id: string; exercise_id: string; exercise_name: string;
  sets: number; reps: number; weight_kg: number; rpe: number;
  logged_at: string; is_pending_sync?: boolean;
}

export interface AthleteTelemetryRecord {
  athlete_id: string; steps: number; active_cals: number;
  readiness_score: number; updated_at: string; is_pending_sync?: boolean;
}

export interface CoachClientRecord {
  coach_id: string; athlete_id: string; status: string;
  assigned_program_id?: string | null; last_active_at: string; is_pending_sync?: boolean;
}

export interface BuddyProfileRecord {
  athlete_id: string; display_name: string; gym_id: string;
  training_split: string; experience_level: string; bio: string; is_discoverable: boolean;
}

export interface AthleteProfileRecord {
  athlete_id: string; display_name?: string; handle?: string;
  is_coach_visible: boolean; is_buddy_visible: boolean; updated_at: string;
}

export interface CoachPayoutAccountRecord {
  coach_id: string; stripe_account_id: string; charges_enabled: boolean;
  payouts_enabled: boolean; details_submitted: boolean; currency: string; country: string;
  payout_method?: 'stripe' | 'paypal' | 'bank'; destination_label?: string;
  paypal_email?: string; bank_account_name?: string; bank_routing_bsb?: string;
  bank_account_last4?: string; updated_at: string;
}

export interface CoachProfileRecord {
  id: string; name?: string; email?: string;
  stripe_connect_account_id: string | null; stripe_payouts_enabled: boolean;
  currency?: string; updated_at?: string;
}

export interface CoachPayoutLedgerRecord {
  id: string; coach_id: string; amount_cents: number; currency: string;
  stripe_transfer_id?: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed' | string;
  error_message?: string | null;
  created_at: string; updated_at?: string;
}

export interface CoachTransactionRecord {
  id: string; coach_id: string; athlete_id: string; athlete_name: string;
  program_title: string; gross_amount: number; platform_fee: number;
  coach_net: number; status: 'PENDING' | 'AVAILABLE' | 'PAID_OUT' | 'REFUNDED'; created_at: string;
}

export interface UserEntitlementRecord {
  user_id: string; tier: string; status: 'active' | 'inactive' | 'expired';
  platform: 'ios' | 'android' | 'web'; expires_at: string; updated_at: string;
}

export type DatabaseTable =
  | 'food_logs' | 'workout_logs' | 'athlete_telemetry' | 'coach_clients'
  | 'coach_payout_accounts' | 'coach_transactions' | 'platform_commissions'
  | 'buddy_profiles' | 'buddy_matches' | 'buddy_messages' | 'user_entitlements'
  | 'athlete_profiles' | 'coach_profiles' | 'coach_payout_ledger';

export interface DatabaseSyncMutation {
  id: string; table: DatabaseTable; operation: 'INSERT' | 'UPSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>; timestamp: number; retryCount: number;
}
