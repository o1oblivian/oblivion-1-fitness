import { createStore } from '../../utils/createStore';
import {
  ModalType,
  ModalPayloadMap,
  CardioScannerPayload,
  TravelPassPayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  GenericToastPayload,
  EliteReelsPayload,
} from './types';
import { tactileEngine } from '../../services/tactileEngine';

interface ModalStoreState {
  activeModal: ModalType | null;
  payload: Partial<ModalPayloadMap[ModalType]> | null;
}

interface ModalStoreActions {
  openModal: <T extends ModalType>(modalType: T, payload?: ModalPayloadMap[T]) => void;
  closeModal: () => void;
  openSettings: (payload?: GenericToastPayload) => void;
  openFullEliteReels: (options?: 'grid' | 'player' | EliteReelsPayload) => void;
  openCardioScanner: (payload?: CardioScannerPayload) => void;
  openTravelPass: (payload?: TravelPassPayload) => void;
  openExerciseSwapper: (payload?: ExerciseSwapperPayload) => void;
  openHydration: (payload?: HydrationPayload) => void;
  openSupplements: (payload?: GenericToastPayload) => void;
}

const initialState: ModalStoreState = {
  activeModal: null,
  payload: null,
};

const modalStore = createStore<ModalStoreState, ModalStoreActions>(initialState, (set) => ({
  openModal: (modalType, payload) => {
    tactileEngine.triggerSelectionBuzz();
    set({
      activeModal: modalType,
      payload: payload || {},
    });
  },

  closeModal: () => {
    set({
      activeModal: null,
      payload: null,
    });
  },

  openSettings: (payload) => {
    modalStore.actions.openModal('SETTINGS', payload || {});
  },

  openFullEliteReels: (options?: 'grid' | 'player' | EliteReelsPayload) => {
    const payload =
      typeof options === 'string'
        ? { initialMode: options }
        : options || { initialMode: 'player' as const };
    modalStore.actions.openModal('FULL_ELITE_REELS', payload);
  },

  openCardioScanner: (payload) => {
    modalStore.actions.openModal('CARDIO_SCANNER', payload || {});
  },

  openTravelPass: (payload) => {
    modalStore.actions.openModal('TRAVEL_PASS', payload || {});
  },

  openExerciseSwapper: (payload) => {
    modalStore.actions.openModal('EXERCISE_SWAPPER', payload || {});
  },

  openHydration: (payload) => {
    modalStore.actions.openModal('HYDRATION', payload || {});
  },

  openSupplements: (payload) => {
    modalStore.actions.openModal('SUPPLEMENTS', payload || {});
  },
}));

export const useModalStore = modalStore.useStore;
export const modalActions = modalStore.actions;
