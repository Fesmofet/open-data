'use client';

import { useRouter } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';

import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';
import { useDismissPostInterceptForObjectSurface } from '@/shared/presentation/hooks/use-dismiss-post-intercept-for-object-surface';

type PostInterceptModalShellProps = {
  children: ReactNode;
  /** When set, used instead of `router.back()` (e.g. editor preview). */
  onClose?: () => void;
  /** Hide reblog/share pills (editor preview). Default true. */
  showShareActions?: boolean;
};

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconReblog() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconShareX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconShareFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function ActionPill({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-circle border border-border bg-surface text-fg-secondary shadow-card hover:bg-surface-control hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {children}
    </button>
  );
}

/**
 * Backdrop + centered panel for intercepting routes.
 * The action pills (close, share) float to the right of the card on desktop,
 * or appear inside the card header on mobile.
 */
export function PostInterceptModalShell({
  children,
  onClose: onCloseProp,
  showShareActions = true,
}: PostInterceptModalShellProps) {
  const router = useRouter();
  const hideForObjectSurface = useDismissPostInterceptForObjectSurface();

  const onClose = useCallback(() => {
    if (onCloseProp) {
      onCloseProp();
      return;
    }
    router.back();
  }, [onCloseProp, router]);

  const openShareX = useCallback(() => {
    const shareUrl = window.location.href;
    window.open(
      `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener',
    );
  }, []);

  const openShareFacebook = useCallback(() => {
    const shareUrl = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener',
    );
  }, []);

  if (hideForObjectSurface) {
    return null;
  }

  const mobileHeader = (
    <div className="flex items-center justify-end border-b border-border px-4 py-2 lg:hidden">
      <ModalShellCloseButton onClose={onClose} />
    </div>
  );

  const desktopAside = (
    <div className="flex flex-col gap-2 pt-4">
      <ActionPill label="Close" onClick={onClose}>
        <IconClose />
      </ActionPill>
      {showShareActions ? (
        <>
          <ActionPill label="Reblog">
            <IconReblog />
          </ActionPill>
          <ActionPill label="Share on X" onClick={openShareX}>
            <IconShareX />
          </ActionPill>
          <ActionPill label="Share on Facebook" onClick={openShareFacebook}>
            <IconShareFacebook />
          </ActionPill>
        </>
      ) : null}
    </div>
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      align="start"
      maxWidthClass="max-w-container-post"
      panelClassName="border-0"
      aside={desktopAside}
      header={mobileHeader}
    >
      <div className="px-6 py-5 sm:px-8 sm:py-6">{children}</div>
    </ModalShell>
  );
}
