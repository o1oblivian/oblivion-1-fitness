import { useEffect, useRef } from 'react';
import { backNavManager } from './backNavigationManager';

/**
 * Universal Hook for mobile hardware back button, Android edge-swipe gesture, and browser back dismissal.
 * When a modal is open:
 * 1. Pushes the modal dismiss callback to the backNavManager stack.
 * 2. On Android back press or browser back, closes the top modal cleanly without exiting the app.
 * 3. Supports Escape key for keyboard/desktop accessibility.
 */
export function useModalBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalId: string = 'fitlab_modal'
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const uniqueIdRef = useRef<string>(`${modalId}_${Math.random().toString(36).substring(2, 7)}`);

  useEffect(() => {
    if (!isOpen) return;

    const id = uniqueIdRef.current;
    const cleanup = backNavManager.pushModal(id, () => {
      onCloseRef.current();
    });

    return () => {
      cleanup();
    };
  }, [isOpen]);
}

