import { AthleteBlip, RadarCorridor } from '../types';
import { DemoAthlete } from '../features/radar/types';

export type RadarView = 'athletes' | 'gyms';

export interface RadarAthlete {
  id: string;
  name: string;
  handle: string;
  distanceKm: number;
  activity: string;
  status: 'ONLINE' | 'ACTIVE' | 'RECOVERY';
  avatarUrl?: string;
  isPartner?: boolean;
}

export interface RadarState {
  radiusKm: number;
  corridor: RadarCorridor;
  searchQuery: string;
  isScanning: boolean;
  isTravelPassOpen: boolean;
  isFilterModalOpen: boolean;
  isVitalsOpen: boolean;
  activeView: RadarView;
  selectedDisciplines: string[];
  selectedTimes: string[];
  selectedAthlete: AthleteBlip | null;
  requestModalAthlete: AthleteBlip | null;
  toastMessage: string | null;
  buddies: DemoAthlete[];
  athletes: AthleteBlip[];
  displayedAthletes: AthleteBlip[];
  travelOrigin: string;
  travelOriginCode: string;
  travelCity: string;
  travelDestinationCode: string;
  travelArrivalDate: string;
  travelDepartureDate: string;
  travelRadiusKm: number;
  travelLat: number;
  travelLng: number;
}

export interface RadarActions {
  setRadius: (radiusKm: number) => void;
  setCorridor: (corridor: RadarCorridor) => void;
  setSearchQuery: (query: string) => void;
  toggleTravelPass: (open?: boolean) => void;
  toggleFilterModal: (open?: boolean) => void;
  toggleVitals: (open?: boolean) => void;
  setIsScanning: (scanning: boolean) => void;
  setActiveView: (view: RadarView) => void;
  setSelectedDisciplines: (disciplines: string[]) => void;
  setSelectedTimes: (times: string[]) => void;
  setSelectedAthlete: (athlete: AthleteBlip | null) => void;
  setRequestModalAthlete: (athlete: AthleteBlip | null) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  handleRescan: () => void;
  handleExpandTo250: () => void;
  handleContractTo25: () => void;
  setTravelDetails: (details: Partial<{
    travelOrigin: string;
    travelOriginCode: string;
    travelCity: string;
    travelDestinationCode: string;
    travelArrivalDate: string;
    travelDepartureDate: string;
    travelRadiusKm: number;
    travelLat: number;
    travelLng: number;
    city: string;
    arrivalDate: string;
    departureDate: string;
    radiusKm: number;
  }>) => void;
  applyFilters: (filters: { disciplines: string[]; times: string[]; radiusKm: number }) => void;
  getDisplayedAthletes: () => AthleteBlip[];
  setAthletes: (athletes: AthleteBlip[]) => void;
  setBuddies: (buddies: DemoAthlete[]) => void;
  addAthlete: (athlete: AthleteBlip) => void;
  resetRadar: () => void;
  seedRadarDemo: () => void;
  clearRadarState: () => void;
}

export type RadarStore = RadarState & RadarActions;
