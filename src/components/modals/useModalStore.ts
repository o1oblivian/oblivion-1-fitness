import { createStore } from '../../utils/createStore';
import {
  ModalType,
  ModalPayloadMap,
  CardioScannerPayload,
  MealScannerPayload,
  TravelPassPayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  BioSyncPayload,
  GenericToastPayload,
  ProgramReelsStoryPayload,
} from './types';
import { tactileEngine } from '../../services/tactileEngine';

export interface ModalStoreState {
  activeModal: ModalType | null;
  payload: Partial<ModalPayloadMap[ModalType]> | null;
}

export interface ModalStoreActions {
  openModal: <T extends ModalType>(
    modalType: T,
    payload?: ModalPayloadMap[T]
  ) => void;
  closeModal: () => void;
  openSettings: (payload?: GenericToastPayload) => void;
  openBiometricSheet: (payload?: GenericToastPayload) => void;
  openFullEliteReels: () => void;
  openCardioScanner: (payload?: CardioScannerPayload) => void;
  openMealScanner: (payload?: MealScannerPayload) => void;
  openTravelPass: (payload?: TravelPassPayload) => void;
  openExerciseSwapper: (payload?: ExerciseSwapperPayload) => void;
  openHydration: (payload?: HydrationPayload) => void;
  openBioSync: (payload?: BioSyncPayload) => void;
  openSupplements: (payload?: GenericToastPayload) => void;
  openProgramReelsStory: (payload?: ProgramReelsStoryPayload) => void;
}

const initialState: ModalStoreState = {
  activeModal: null,
  payload: null,
};

const modalStore = createStore<ModalStoreState, ModalStoreActions>(
  initialState,
  (set) => ({
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

    openBiometricSheet: (payload) => {
      modalStore.actions.openModal('BIOMETRIC_SHEET', payload || {});
    },

    openFullEliteReels: () => {
      modalStore.actions.openModal('FULL_ELITE_REELS', {});
    },

    openCardioScanner: (payload) => {
      modalStore.actions.openModal('CARDIO_SCANNER', payload || {});
    },

    openMealScanner: (payload) => {
      modalStore.actions.openModal('MEAL_SCANNER', payload || {});
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

    openBioSync: (payload) => {
      modalStore.actions.openModal('BIO_SYNC', payload || {});
    },

    openSupplements: (payload) => {
      modalStore.actions.openModal('SUPPLEMENTS', payload || {});
    },

    openProgramReelsStory: (payload) => {
      modalStore.actions.openModal('PROGRAM_REELS_STORY', payload || {});
    },
  })
);

export const useModalStore = modalStore.useStore;
export const getModalState = modalStore.getState;
export const setModalState = modalStore.setState;
export const modalActions = modalStore.actions;
