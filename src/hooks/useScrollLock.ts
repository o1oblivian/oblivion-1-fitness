import { useEffect } from 'react';

let lockCount = 0;
let saved: { scrollY: number; body: string; main: string; mainEl: HTMLElement | null } | null =
  null;

function lock() {
  lockCount += 1;
  if (lockCount > 1) return;
  const body = document.body;
  const main = document.querySelector('main');
  saved = {
    scrollY: window.scrollY,
    body: body.getAttribute('style') ?? '',
    main: main?.getAttribute('style') ?? '',
    mainEl: main,
  };
  body.style.position = 'fixed';
  body.style.top = `-${saved.scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (main) {
    main.style.overflow = 'hidden';
    main.style.overscrollBehavior = 'none';
  }
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !saved) return;
  const { scrollY, body, main, mainEl } = saved;
  document.body.setAttribute('style', body);
  if (mainEl) mainEl.setAttribute('style', main);
  window.scrollTo(0, scrollY);
  saved = null;
}

/** Freezes the page (body and the app's scrolling <main>) while a modal is open. Nested modals are ref-counted. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    lock();
    return unlock;
  }, [active]);
}
