'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { useModalScrollLock } from '../hooks/use-modal-scroll-lock';
import { MODAL_Z_INDEX_DEFAULT } from './modal-shell.constants';

export type ModalShellVariant = 'dialog' | 'fullscreen';

export type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  variant?: ModalShellVariant;
  zIndex?: number;
  labelledBy?: string;
  describedBy?: string;
  ariaLabel?: string;
  closeOnBackdrop?: boolean;
  /** Extra classes on the scrim layer (`post-modal-scrim` base). */
  scrimClassName?: string;
  /** Extra classes on the dialog panel (card or fullscreen surface). */
  panelClassName?: string;
  /** Dialog shell alignment; `start` for tall overlays (e.g. post intercept). */
  align?: 'center' | 'start';
  /** Max width utility for dialog variant (default `max-w-md`). */
  maxWidthClass?: string;
  /** When false, body uses `overflow-hidden` (fullscreen media layouts). Default: true for dialog, false for fullscreen. */
  scrollBody?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  /** Renders beside the panel on desktop (e.g. post modal action pills). */
  aside?: ReactNode;
};

export type ModalShellCloseButtonProps = {
  onClose: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function ModalShellCloseButton({
  onClose,
  disabled = false,
  ariaLabel = 'Close',
  className = '',
}: ModalShellCloseButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClose}
      disabled={disabled}
      className={[
        'flex size-8 shrink-0 items-center justify-center rounded-circle text-fg-secondary hover:bg-surface-control hover:text-fg disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
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

/**
 * Portaled overlay with enforced scroll architecture:
 * shell `overflow-hidden` → panel `flex flex-col` → single scroll body.
 */
export function ModalShell({
  open,
  onClose,
  children,
  variant = 'dialog',
  zIndex = MODAL_Z_INDEX_DEFAULT,
  labelledBy,
  describedBy,
  ariaLabel,
  closeOnBackdrop = true,
  scrimClassName = '',
  panelClassName = '',
  align = 'center',
  maxWidthClass = 'max-w-md',
  scrollBody,
  header,
  footer,
  aside,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  const isFullscreen = variant === 'fullscreen';
  const bodyScrolls = scrollBody ?? !isFullscreen;

  useModalScrollLock(open);

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

  const shellAlign =
    align === 'start'
      ? 'items-start justify-center py-8'
      : 'items-center justify-center';

  const panelBase = isFullscreen
    ? 'h-dvh max-h-dvh w-full flex flex-col overflow-hidden overscroll-none'
    : [
        'w-full flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card-float',
        maxWidthClass,
      ].join(' ');

  const bodyClass = bodyScrolls
    ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
    : 'flex min-h-0 flex-1 flex-col overflow-hidden';

  const dialogContent = (
    <>
      <div
        className={['post-modal-scrim fixed inset-0', scrimClassName].join(' ')}
        style={{ zIndex }}
        aria-hidden
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={[
          'pointer-events-none fixed inset-0 overflow-hidden',
          isFullscreen ? 'flex flex-col' : `flex p-4 ${shellAlign}`,
        ].join(' ')}
        style={{ zIndex }}
        role="presentation"
      >
        <div
          className={[
            'pointer-events-auto min-w-0',
            isFullscreen
              ? 'flex h-full min-h-0 flex-1 flex-col'
              : aside
                ? 'flex w-full max-w-container-post items-start gap-3'
                : `flex w-full justify-center`,
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            aria-label={ariaLabel}
            className={[
              panelBase,
              panelClassName,
              !isFullscreen && aside ? 'min-w-0 flex-1' : '',
            ].join(' ')}
          >
            {header ? <div className="shrink-0">{header}</div> : null}
            <div className={bodyClass}>{children}</div>
            {footer ? <div className="shrink-0">{footer}</div> : null}
          </div>
          {aside ? (
            <div
              className="hidden shrink-0 flex-col gap-2 lg:flex"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {aside}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  return createPortal(dialogContent, document.body);
}
