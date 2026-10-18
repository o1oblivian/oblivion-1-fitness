type AthleticFocusType =
  | 'HYROX & RACING'
  | 'STRENGTH & 1RM'
  | 'HYPERTROPHY & VOLUME'
  | 'FUNCTIONAL METCON'
  | 'LONGEVITY & HEALTH';

interface DevicePermissions {
  camera: boolean;
  notifications: boolean;
}

export interface OnboardingData {
  email: string;
  isSignUp: boolean;
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
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  email: '',
  isSignUp: false,
  rememberMe: true,
  heightCm: 180,
  weightKg: 82.5,
  dailyStepTarget: 10000,
  primaryFocus: 'HYROX & RACING',
  disciplines: ['Bodybuilding', 'Powerlifting'],
  preferredTime: 'Morning',
  trainingFrequency: 5,
  permissions: {
    camera: false,
    notifications: false,
  },
};
