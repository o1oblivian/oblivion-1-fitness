import { describe, expect, it } from 'vitest';
import { createStore } from './createStore';

describe('createStore', () => {
  it('merges an object passed to setState', () => {
    const store = createStore({ a: 1, b: 2 }, () => ({}));
    store.setState({ b: 5 });
    expect(store.getState()).toMatchObject({ a: 1, b: 5 });
  });

  it('passes the current state to a setState updater', () => {
    const store = createStore({ count: 1 }, () => ({}));
    store.setState((prev) => ({ count: prev.count + 1 }));
    store.setState((prev) => ({ count: prev.count + 1 }));
    expect(store.getState().count).toBe(3);
  });

  it('notifies subscribers of a setState', () => {
    const store = createStore({ count: 0 }, () => ({}));
    const seen: number[] = [];
    store.useStore.subscribe((state) => seen.push(state.count));
    store.setState({ count: 4 });
    expect(seen).toEqual([4]);
  });

  it('lets actions update state', () => {
    const store = createStore({ count: 0 }, (set) => ({
      increment: () => set((prev) => ({ count: prev.count + 1 })),
    }));
    store.getState().increment();
    expect(store.getState().count).toBe(1);
  });
});
