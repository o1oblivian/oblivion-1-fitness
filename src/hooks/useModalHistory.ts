import { useEffect, useRef } from 'react';
import { backNavManager } from '@/utils/backNavigationManager';

type ModalCloser = () => void;

export function useModalHistory(isOpen: boolean, onClose: ModalCloser, idPrefix: string = 'modal') {
  const closerRef = useRef(onClose);
  closerRef.current = onClose;
  const idRef = useRef<string>(`${idPrefix}_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (!isOpen) return;

    const modalId = idRef.current;
    const cleanup = backNavManager.pushModal(modalId, () => {
      closerRef.current();
    });

    return () => {
      cleanup();
    };
  }, [isOpen]);
}

