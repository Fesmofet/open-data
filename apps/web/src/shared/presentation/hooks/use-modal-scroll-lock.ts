'use client';

import { useEffect } from 'react';

/**
 * Locks page scroll while a modal is open.
 * Uses `html.modal-open` (see `global.css`) and compensates for scrollbar width on `<html>`.
 */
export function useModalScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevPaddingRight = document.documentElement.style.paddingRight;

    document.documentElement.classList.add('modal-open');
    if (scrollbarWidth > 0) {
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.documentElement.classList.remove('modal-open');
      document.documentElement.style.paddingRight = prevPaddingRight;
    };
  }, [active]);
}
