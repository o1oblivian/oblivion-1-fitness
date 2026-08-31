import { useEffect, useRef } from 'react';

/**
 * Universal Hook for mobile hardware back button and browser edge-swipe back dismissal.
 * When a modal is open:
 * 1. Pushes a modal state to window.history.
 * 2. Listens to window 'popstate' to close the modal when user presses hardware back or swipes back.
 * 3. Safely pops the pushed history state if modal is closed via in-app UI (X button, backdrop, Done).
 * 4. Listens to 'Escape' keyboard key for desktop accessibility.
 */
export function useModalBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalId: string = 'fitlab_modal'
) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      // If modal was closed from UI and we previously pushed a history state, step back to clean history
      if (isPushedRef.current) {
        isPushedRef.current = false;
        try {
          if (window.history.state?.fitlab_modal === modalId) {
            window.history.back();
          }
        } catch (e) {
          // ignore history errors in strict sandboxes
        }
      }
      return;
    }

    // Modal is OPEN -> Push history state entry
    try {
      window.history.pushState({ fitlab_modal: modalId, timestamp: Date.now() }, '');
      isPushedRef.current = true;
    } catch (e) {
      // ignore
    }

    const handlePopState = (event: PopStateEvent) => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        try {
          if (window.history.state?.fitlab_modal === modalId) {
            window.history.back();
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isOpen, modalId]);
}
