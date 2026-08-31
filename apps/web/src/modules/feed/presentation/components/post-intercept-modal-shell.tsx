'use client';

import { useRouter } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';

import { BrandFacebookIcon, BrandXIcon, CloseIcon, ReblogIcon } from '@/icons';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';
import { useDismissPostInterceptForObjectSurface } from '@/shared/presentation/hooks/use-dismiss-post-intercept-for-object-surface';

type PostInterceptModalShellProps = {
  children: ReactNode;
  /** When set, used instead of `router.back()` (e.g. editor preview). */
  onClose?: () => void;
  /** Hide reblog/share pills (editor preview). Default true. */
  showShareActions?: boolean;
};

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
        <CloseIcon size={16} />
      </ActionPill>
      {showShareActions ? (
        <>
          <ActionPill label="Reblog">
            <ReblogIcon size={16} />
          </ActionPill>
          <ActionPill label="Share on X" onClick={openShareX}>
            <BrandXIcon size={15} />
          </ActionPill>
          <ActionPill label="Share on Facebook" onClick={openShareFacebook}>
            <BrandFacebookIcon size={16} />
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
