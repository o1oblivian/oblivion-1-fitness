export type OnboardingStep = 1 | 2 | 3 | 4;

export type AthleticFocusType =
  | 'HYROX & RACING'
  | 'STRENGTH & 1RM'
  | 'HYPERTROPHY & VOLUME'
  | 'FUNCTIONAL METCON'
  | 'LONGEVITY & HEALTH';

export interface DevicePermissions {
  location: boolean;
  camera: boolean;
  microphone: boolean;
  notifications: boolean;
}

export interface OnboardingData {
  email: string;
  isSignUp: boolean;
  isReviewerBypass: boolean;
  rememberMe: boolean;
  heightCm: number;
  weightKg: number;
  dailyStepTarget: number;
  primaryFocus: AthleticFocusType;
  permissions: DevicePermissions;
  // Backward compatibility fields
  disciplines?: string[];
  preferredTime?: 'Morning' | 'Afternoon' | 'Evening';
  trainingFrequency?: number;
  homeGym?: string;
  showOnRadar?: boolean;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  email: '',
  isSignUp: false,
  isReviewerBypass: false,
  rememberMe: true,
  heightCm: 180,
  weightKg: 82.5,
  dailyStepTarget: 10000,
  primaryFocus: 'HYROX & RACING',
  disciplines: ['Bodybuilding', 'Powerlifting'],
  preferredTime: 'Morning',
  trainingFrequency: 5,
  homeGym: 'Oblivion 1 Metro Hub',
  showOnRadar: true,
  permissions: {
    location: false,
    camera: false,
    microphone: false,
    notifications: false,
  },
};
