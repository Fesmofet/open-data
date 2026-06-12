'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { useLockBodyScroll } from '../hooks/use-lock-body-scroll';

/** Above app header (z-50) and feed overlays; below map fullscreen modals. */
export const APP_MODAL_Z_INDEX = 110;

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  panelClassName?: string;
};

/**
 * Centered dialog portaled to `document.body` with body scroll lock and Escape to close.
 * Use for compact overlays so `position: fixed` is not clipped by feed/header `backdrop-filter`.
 */
export function AppModal({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  panelClassName = '',
}: AppModalProps) {
  const [mounted, setMounted] = useState(false);
  useLockBodyScroll(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open || !mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-overlay/50 backdrop-blur-[1px]"
        style={{ zIndex: APP_MODAL_Z_INDEX }}
        aria-hidden
        onClick={onClose}
      />
      <div
        className="pointer-events-none fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: APP_MODAL_Z_INDEX }}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          className={[
            'pointer-events-auto w-full max-w-md rounded-card border border-border bg-surface shadow-card-float',
            panelClassName,
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

export function AppModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="flex size-8 shrink-0 items-center justify-center rounded-circle text-fg-secondary hover:bg-surface-control hover:text-fg"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
