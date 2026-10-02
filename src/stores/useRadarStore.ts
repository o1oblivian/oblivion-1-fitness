import { create } from 'zustand';
import { AthleteBlip, RadarCorridor } from '../types';
import { tactileEngine } from '../services/tactileEngine';
import { RadarView, RadarAthlete, RadarState, RadarActions, RadarStore } from './radarTypes';

export type { RadarView, RadarAthlete, RadarState, RadarActions, RadarStore };

export const computeDisplayedAthletes = (
  radiusKm: number,
  searchQuery: string,
  selectedDisciplines: string[],
  athletes: AthleteBlip[]
): AthleteBlip[] => {
  const q = searchQuery.toLowerCase().trim();
  return athletes.filter((a) => {
    const withinRadius = a.distanceKm <= radiusKm;
    const matchesSearch =
      !q ||
      a.callsign.toLowerCase().includes(q) ||
      a.realName.toLowerCase().includes(q) ||
      a.locationLabel.toLowerCase().includes(q) ||
      a.activeSession.toLowerCase().includes(q) ||
      a.discipline.toLowerCase().includes(q);
    const matchesDisc =
      selectedDisciplines.length === 0 ||
      selectedDisciplines.some((d) => a.discipline.toLowerCase().includes(d.toLowerCase()));
    return withinRadius && matchesSearch && matchesDisc;
  });
};

const getInitialTravelDetails = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('o1fc_travel_corridor') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ignore legacy hardcoded Sydney default if present
      if (parsed && parsed.travelCity && parsed.travelCity.toLowerCase() !== 'sydney') {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return {
    travelOrigin: '',
    travelOriginCode: '',
    travelCity: '',
    travelDestinationCode: '',
    travelArrivalDate: '',
    travelDepartureDate: '',
    travelRadiusKm: 25,
  };
};

const savedTravel = getInitialTravelDetails();

const initialRadarState: RadarState = {
  radiusKm: 25,
  corridor: 'local_25km',
  searchQuery: '',
  isScanning: false,
  isTravelPassOpen: false,
  isFilterModalOpen: false,
  isVitalsOpen: false,
  activeView: 'athletes',
  selectedDisciplines: [],
  selectedTimes: [],
  selectedAthlete: null,
  requestModalAthlete: null,
  toastMessage: null,
  buddies: [],
  athletes: [],
  displayedAthletes: [],
  ...savedTravel,
};

export const useRadarStore = create<RadarStore>((set, get) => ({
  ...initialRadarState,
  setRadius: (radiusKm: number) => {
    tactileEngine.triggerSelectionBuzz();
    const corridor: RadarCorridor = radiusKm > 25 ? 'regional_250km' : 'local_25km';
    set((s) => ({
      radiusKm,
      corridor,
      displayedAthletes: computeDisplayedAthletes(radiusKm, s.searchQuery, s.selectedDisciplines, s.athletes),
    }));
  },
  setCorridor: (corridor: RadarCorridor) => {
    tactileEngine.triggerSelectionBuzz();
    const radiusKm = corridor === 'regional_250km' ? 250 : 25;
    set((s) => ({
      corridor,
      radiusKm,
      displayedAthletes: computeDisplayedAthletes(radiusKm, s.searchQuery, s.selectedDisciplines, s.athletes),
    }));
  },
  setSearchQuery: (searchQuery: string) => {
    set((s) => ({
      searchQuery,
      displayedAthletes: computeDisplayedAthletes(s.radiusKm, searchQuery, s.selectedDisciplines, s.athletes),
    }));
  },
  toggleTravelPass: (open?: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    set((s) => ({ isTravelPassOpen: open !== undefined ? open : !s.isTravelPassOpen }));
  },
  toggleFilterModal: (open?: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    set((s) => ({ isFilterModalOpen: open !== undefined ? open : !s.isFilterModalOpen }));
  },
  toggleVitals: (open?: boolean) => set((s) => ({ isVitalsOpen: open !== undefined ? open : !s.isVitalsOpen })),
  setIsScanning: (isScanning: boolean) => set({ isScanning }),
  setActiveView: (activeView: RadarView) => {
    tactileEngine.triggerSelectionBuzz();
    set({ activeView });
  },
  setSelectedDisciplines: (selectedDisciplines) => {
    set((s) => ({
      selectedDisciplines,
      displayedAthletes: computeDisplayedAthletes(s.radiusKm, s.searchQuery, selectedDisciplines, s.athletes),
    }));
  },
  setSelectedTimes: (selectedTimes) => set({ selectedTimes }),
  setSelectedAthlete: (selectedAthlete) => {
    if (selectedAthlete) tactileEngine.triggerSelectionBuzz();
    set({ selectedAthlete });
  },
  setRequestModalAthlete: (requestModalAthlete) => {
    if (requestModalAthlete) tactileEngine.triggerSelectionBuzz();
    set({ requestModalAthlete });
  },
  showToast: () => {},
  clearToast: () => set({ toastMessage: null }),
  handleRescan: () => {
    tactileEngine.triggerDialHaptic();
    set({ isScanning: true });
    setTimeout(() => {
      set({ isScanning: false });
      tactileEngine.triggerSelectionBuzz();
    }, 800);
  },
  handleExpandTo250: () => {
    tactileEngine.triggerDialHaptic();
    set((s) => ({
      radiusKm: 250,
      corridor: 'regional_250km',
      displayedAthletes: computeDisplayedAthletes(250, s.searchQuery, s.selectedDisciplines, s.athletes),
    }));
  },
  handleContractTo25: () => {
    tactileEngine.triggerSelectionBuzz();
    set((s) => ({
      radiusKm: 25,
      corridor: 'local_25km',
      displayedAthletes: computeDisplayedAthletes(25, s.searchQuery, s.selectedDisciplines, s.athletes),
    }));
  },
  setTravelDetails: (details) => {
    set((s) => {
      const updated = { ...s, ...details };
      try {
        if (!updated.travelCity) {
          localStorage.removeItem('o1fc_travel_corridor');
        } else {
          localStorage.setItem('o1fc_travel_corridor', JSON.stringify({
            travelOrigin: updated.travelOrigin,
            travelOriginCode: updated.travelOriginCode,
            travelCity: updated.travelCity,
            travelDestinationCode: updated.travelDestinationCode,
            travelArrivalDate: updated.travelArrivalDate,
            travelDepartureDate: updated.travelDepartureDate,
            travelRadiusKm: updated.travelRadiusKm,
          }));
        }
      } catch (e) {
        // Ignore storage errors
      }
      return updated;
    });
  },
  applyFilters: (filters) => {
    tactileEngine.triggerDialHaptic();
    const corridor: RadarCorridor = filters.radiusKm > 25 ? 'regional_250km' : 'local_25km';
    set((s) => ({
      selectedDisciplines: filters.disciplines,
      selectedTimes: filters.times,
      radiusKm: filters.radiusKm,
      corridor,
      isFilterModalOpen: false,
      displayedAthletes: computeDisplayedAthletes(filters.radiusKm, s.searchQuery, filters.disciplines, s.athletes),
    }));
  },
  getDisplayedAthletes: () => get().displayedAthletes,
  setAthletes: (newAthletes: AthleteBlip[]) => {
    set((s) => ({
      athletes: newAthletes,
      displayedAthletes: computeDisplayedAthletes(s.radiusKm, s.searchQuery, s.selectedDisciplines, newAthletes),
    }));
  },
  setBuddies: (buddies) => set({ buddies }),
  addAthlete: (newAthlete: AthleteBlip) => {
    set((s) => {
      const updated = [...s.athletes, newAthlete];
      return {
        athletes: updated,
        displayedAthletes: computeDisplayedAthletes(s.radiusKm, s.searchQuery, s.selectedDisciplines, updated),
      };
    });
  },
  resetRadar: () => set(initialRadarState),
  seedRadarDemo: () => {
    // Genuine radar only - no mock seeding
  },
  clearRadarState: () => set({ buddies: [], athletes: [], displayedAthletes: [], isScanning: false }),
}));

export default useRadarStore;
