import { useEffect, useRef, useCallback } from 'react';

type ModalCloser = () => void;

const modalStack: ModalCloser[] = [];
let listenerAttached = false;

function handlePopState() {
  const closer = modalStack.pop();
  if (closer) closer();
}

function attachListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('popstate', handlePopState);
}

export function useModalHistory(isOpen: boolean, onClose: ModalCloser) {
  const closerRef = useRef(onClose);
  closerRef.current = onClose;

  const stableClose = useCallback(() => {
    closerRef.current();
  }, []);

  useEffect(() => {
    attachListener();
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modalOpen: true }, '');
      modalStack.push(stableClose);
    }
    return () => {
      const idx = modalStack.indexOf(stableClose);
      if (idx !== -1) modalStack.splice(idx, 1);
    };
  }, [isOpen, stableClose]);
}
