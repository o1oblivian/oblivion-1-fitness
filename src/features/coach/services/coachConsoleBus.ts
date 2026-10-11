export type CoachConsoleAction = 'programs' | 'dispatch';

const ACTION_EVENT = 'o1-coach-console-action';
let pending: CoachConsoleAction | null = null;

/** Switches to the Coach tab and asks the console to open a tool, even if it is not mounted yet. */
export function openCoachConsole(action: CoachConsoleAction): void {
  pending = action;
  window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'coach' }));
  window.dispatchEvent(new CustomEvent(ACTION_EVENT));
}

/** Notifies on every console request without consuming it. Returns the unsubscribe. */
export function onCoachConsoleRequested(listener: () => void): () => void {
  window.addEventListener(ACTION_EVENT, listener);
  return () => window.removeEventListener(ACTION_EVENT, listener);
}

/** Runs `handler` for the pending action now and for every later request. Returns the unsubscribe. */
export function onCoachConsoleAction(handler: (action: CoachConsoleAction) => void): () => void {
  const flush = () => {
    if (!pending) return;
    const action = pending;
    pending = null;
    handler(action);
  };
  flush();
  window.addEventListener(ACTION_EVENT, flush);
  return () => window.removeEventListener(ACTION_EVENT, flush);
}
