import { createStore } from '../../utils/createStore';
import {
  ModalType,
  ModalPayloadMap,
  CoachProfilePayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  GenericToastPayload,
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
  openCoachProfile: (payload: CoachProfilePayload) => void;
  openCardioScanner: () => void;
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

  openCoachProfile: (payload) => {
    modalStore.actions.openModal('COACH_PROFILE', payload);
  },

  openCardioScanner: () => {
    modalStore.actions.openModal('CARDIO_SCANNER', {});
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
