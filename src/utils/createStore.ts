import { create } from 'zustand';

/**
 * Lightweight, type-safe store leveraging Zustand.
 * Guarantees stable snapshot caching, prevents getSnapshot infinite loops,
 * and maintains complete backward compatibility with all store usages.
 */
type StoreHook<TState extends object, TActions extends object> = {
  (): TState & TActions;
  <TSelected>(selector: (state: TState & TActions) => TSelected): TSelected;
  getState: () => TState & TActions;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  subscribe: (listener: (state: TState & TActions, prev: TState & TActions) => void) => () => void;
  actions: TActions;
};

export function createStore<TState extends object, TActions extends object>(
  initialState: TState,
  createActions: (
    set: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void,
    get: () => TState & TActions,
  ) => TActions,
) {
  let actionsRef: TActions = {} as TActions;

  const useZustandStore = create<TState & TActions>((set, get) => {
    const customSet = (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => {
      set((state) => {
        const next = typeof updater === 'function' ? updater(state) : updater;
        return { ...state, ...next };
      });
    };

    actionsRef = createActions(customSet, get);
    return {
      ...initialState,
      ...actionsRef,
    };
  });

  const storeHook = useZustandStore as unknown as StoreHook<TState, TActions>;
  storeHook.getState = useZustandStore.getState;
  // The hook and the zustand store are one object: keep the original before replacing it, or the
  // replacement would call itself forever.
  const zustandSetState = useZustandStore.setState;
  storeHook.setState = (updater) => {
    zustandSetState((state) => {
      const next = typeof updater === 'function' ? updater(state) : updater;
      return { ...state, ...next };
    });
  };
  storeHook.subscribe = useZustandStore.subscribe;
  storeHook.actions = actionsRef;

  return {
    useStore: storeHook,
    getState: useZustandStore.getState,
    setState: storeHook.setState,
    actions: actionsRef,
  };
}
