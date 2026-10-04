export interface AthleteProfileSettings {
  readonly dialClicks: boolean;
  readonly restChime: boolean;
  readonly prChime: boolean;
  readonly autoDispatch: boolean;
  readonly reelsPresence: boolean;
  readonly recoveryMode: boolean;
  readonly locationSharing: boolean;
  readonly appearance: 'Dark' | 'Light' | 'System';
  readonly inputMode: 'Haptic Dial' | 'Keypad';
  readonly pushAlerts: boolean;
  readonly ghostMode: boolean;
  readonly radarDiscovery: boolean;
}

export interface AthleteMembership {
  readonly tier: string;
  readonly status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  readonly renewsDate: string;
}

export interface AthleteProfile {
  readonly handle: string;
  readonly age: number;
  readonly heightCm?: number;
  readonly height?: number;
  readonly weightKg?: number;
  readonly weight?: number;
  readonly bio: string;
  readonly disciplines: readonly string[];
  readonly schedule: readonly string[];
  readonly membership?: AthleteMembership;
  readonly homeGym?: string;
  readonly settings: AthleteProfileSettings | Record<string, boolean>;
}
