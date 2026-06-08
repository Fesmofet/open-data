'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type SVGProps } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { buildOdlUpdateVoteOp } from '@opden-data-layer/hive-broadcast';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { useOdlCustomJsonId } from '@/config/odl-network-provider';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { AddUpdateModal } from '@/modules/object-updates/presentation/components/add-update-modal';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';
import { useLockBodyScroll, UserAvatar } from '@/shared/presentation';

import type { GalleryApprovalStatsIndex } from '@/modules/object/domain/gallery-approval-stats';
import {
  EMPTY_GALLERY_APPROVAL_STAT,
  resolveGalleryPhotoApprovalStat,
} from '@/modules/object/domain/gallery-approval-stats';
import { fetchGalleryApprovalStatsAction } from '@/app/(app)/object/[object-id]/gallery/gallery-approval.actions';

import type { ProjectedGalleryAlbumView } from '../../domain/object-page.types';
import { GalleryImage } from './gallery-image';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const hiveAvatarUrl = (creator: string): string =>
  `https://images.hive.blog/u/${encodeURIComponent(creator)}/avatar`;

function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="30"
      height="48"
      viewBox="0 0 20 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polyline points="14 4 6 16 14 28" />
    </svg>
  );
}

function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="30"
      height="48"
      viewBox="0 0 20 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polyline points="6 4 14 16 6 28" />
    </svg>
  );
}

export type ObjectGalleryViewerProps = {
  objectId: string;
  objectName: string;
  album: ProjectedGalleryAlbumView;
  initialIndex: number;
  onClose: () => void;
  viewerUsername: string | null;
  onRequireLogin: () => void;
  supportedUpdateTypes: readonly string[];
  updateTypeCounts?: Record<string, number>;
};

export function ObjectGalleryViewer({
  objectId,
  objectName,
  album,
  initialIndex,
  onClose,
  viewerUsername,
  onRequireLogin,
  supportedUpdateTypes,
  updateTypeCounts,
}: ObjectGalleryViewerProps) {
  useHydrateWalletProvider();
  const odlCustomJsonId = useOdlCustomJsonId();
  const router = useRouter();
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [albumDropdownOpen, setAlbumDropdownOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [approvalStats, setApprovalStats] = useState<GalleryApprovalStatsIndex>({
    byUpdateId: {},
    byUrl: {},
  });
  const [optimisticVotes, setOptimisticVotes] = useState<
    Record<string, 'for' | 'against' | null>
  >({});
  const [votePending, setVotePending] = useState(false);
  const [voteConfirming, setVoteConfirming] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const albumDropdownRef = useRef<HTMLDivElement>(null);

  const photos = album.items;
  const count = photos.length;
  const currentPhoto = photos[activeIndex];
  const displayName = objectName.trim() || objectId;
  const canSetAvatar = supportedUpdateTypes.includes(UPDATE_TYPES.IMAGE);

  const currentStat = currentPhoto
    ? resolveGalleryPhotoApprovalStat(currentPhoto, approvalStats)
    : EMPTY_GALLERY_APPROVAL_STAT;

  const votableUpdateId =
    currentPhoto?.update_id ?? currentStat.updateId ?? '';
  const effectiveVote = votableUpdateId
    ? (optimisticVotes[votableUpdateId] ?? currentStat.viewer_vote)
    : null;
  const voteDisabled = votePending || voteConfirming;

  useLockBodyScroll(true);

  useEffect(() => {
    setActiveIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, album.name]);

  useEffect(() => {
    let cancelled = false;
    void fetchGalleryApprovalStatsAction(objectId).then((stats) => {
      if (!cancelled) {
        setApprovalStats(stats);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [objectId]);

  useEffect(() => {
    setVoteError(null);
  }, [activeIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (avatarModalOpen) {
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [avatarModalOpen, onClose]);

  useEffect(() => {
    if (!albumDropdownOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (
        albumDropdownRef.current &&
        !albumDropdownRef.current.contains(event.target as Node)
      ) {
        setAlbumDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [albumDropdownOpen]);

  const goPrev = useCallback(() => {
    if (count <= 1) {
      return;
    }
    setZoom(1);
    setActiveIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    if (count <= 1) {
      return;
    }
    setZoom(1);
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  const onSetAsAvatar = useCallback(() => {
    setAlbumDropdownOpen(false);
    if (!viewerUsername?.trim()) {
      onRequireLogin();
      return;
    }
    setAvatarModalOpen(true);
  }, [onRequireLogin, viewerUsername]);

  const onVote = useCallback(
    async (vote: 'for' | 'against') => {
      const voter = viewerUsername?.trim();
      if (!voter) {
        onRequireLogin();
        return;
      }
      if (votePending || voteConfirming) {
        return;
      }
      const updateId =
        currentPhoto?.update_id ?? currentStat.updateId;
      if (!updateId) {
        return;
      }
      const currentVote = optimisticVotes[updateId] ?? currentStat.viewer_vote;
      if (currentVote === vote) {
        return;
      }
      setVoteError(null);
      setVotePending(true);
      try {
        const op = buildOdlUpdateVoteOp({
          id: odlCustomJsonId,
          updateId,
          objectId,
          voter,
          vote,
          required_posting_auths: [voter],
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        setOptimisticVotes((prev) => ({ ...prev, [updateId]: vote }));
        setVotePending(false);
        setVoteConfirming(true);
        void awaitTrxConfirmation(transactionId).finally(() => {
          void refreshAfterBroadcast(router, () =>
            revalidateObjectAfterBroadcast(objectId),
          ).finally(() => {
            void fetchGalleryApprovalStatsAction(objectId).then(setApprovalStats);
            setVoteConfirming(false);
          });
        });
      } catch (err) {
        setVoteError(
          err instanceof Error ? err.message : t('object_edit_validation_error'),
        );
        setVotePending(false);
      }
    },
    [
      currentPhoto?.update_id,
      currentStat.updateId,
      currentStat.viewer_vote,
      objectId,
      odlCustomJsonId,
      onRequireLogin,
      optimisticVotes,
      router,
      t,
      viewerUsername,
      voteConfirming,
      votePending,
    ],
  );

  if (!currentPhoto) {
    return null;
  }

  const overlay = (
    <div
      className="gallery-scrim fixed inset-0 z-[150] flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none text-fg"
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery')}
    >
      <header className="gallery-chrome-border grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center justify-start gap-2">
          {currentStat.creator ? (
            <>
              <Link
                href={`/@${encodeURIComponent(currentStat.creator)}`}
                className="inline-flex shrink-0 rounded-circle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                aria-label={`View profile: ${currentStat.creator}`}
                suppressHydrationWarning
              >
                <UserAvatar
                  username={currentStat.creator}
                  avatarUrl={hiveAvatarUrl(currentStat.creator)}
                  size={32}
                  displayName={currentStat.creator}
                />
              </Link>
              <Link
                href={`/@${encodeURIComponent(currentStat.creator)}`}
                className="gallery-chrome-text truncate text-body-sm font-weight-label hover:underline focus-visible:rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                suppressHydrationWarning
              >
                {currentStat.creator}
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-4 text-body-sm">
          <span className="gallery-chrome-text truncate font-weight-label">
            <span className="gallery-chrome-text-muted">{t('object_gallery_viewer_related_object')}</span>{' '}
            {displayName}
          </span>
          <div ref={albumDropdownRef} className="relative">
            <button
              type="button"
              className="gallery-chrome-control inline-flex items-center gap-1 px-2 py-1"
              aria-expanded={albumDropdownOpen}
              onClick={() => setAlbumDropdownOpen((open) => !open)}
            >
              <span className="gallery-chrome-text-muted">{t('album')}:</span>
              <span>{album.name}</span>
              <span aria-hidden className="text-caption">
                {albumDropdownOpen ? '▴' : '▾'}
              </span>
            </button>
            {albumDropdownOpen ? (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[12rem] overflow-hidden rounded-btn border border-border bg-surface shadow-card-float">
                <div className="border-b border-border px-3 py-2 text-body-sm text-fg">
                  {album.name}
                </div>
                {canSetAvatar ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-body-sm text-fg hover:bg-ghost-surface"
                    onClick={onSetAsAvatar}
                  >
                    {t('object_gallery_set_as_avatar')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="gallery-chrome-control gallery-chrome-icon-btn gallery-chrome-icon-btn--zoom-out"
            aria-label={t('object_gallery_zoom_out')}
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
          />
          <button
            type="button"
            className="gallery-chrome-control gallery-chrome-icon-btn gallery-chrome-icon-btn--zoom-in"
            aria-label={t('object_gallery_zoom_in')}
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
          />
          <button
            type="button"
            className="gallery-chrome-control gallery-chrome-icon-btn gallery-chrome-icon-btn--close"
            aria-label={t('close')}
            onClick={onClose}
          />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 py-4">
        {count > 1 ? (
          <button
            type="button"
            className="gallery-nav-arrow absolute left-4 z-10 inline-flex shrink-0 items-center justify-center p-2 md:left-6"
            aria-label={t('object_detail_gallery_prev')}
            onClick={goPrev}
          >
            <IconChevronLeft />
          </button>
        ) : null}
        <div className="relative h-full w-full max-w-container-page overflow-hidden">
          <div
            className="relative mx-auto h-full w-full max-h-[calc(100vh-8rem)]"
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.15s ease',
            }}
          >
            <GalleryImage
              src={currentPhoto.url}
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
        </div>
        {count > 1 ? (
          <button
            type="button"
            className="gallery-nav-arrow absolute right-4 z-10 inline-flex shrink-0 items-center justify-center p-2 md:right-6"
            aria-label={t('object_detail_gallery_next')}
            onClick={goNext}
          >
            <IconChevronRight />
          </button>
        ) : null}
      </div>

      <footer className="gallery-chrome-footer flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={voteDisabled || !votableUpdateId}
            aria-pressed={effectiveVote === 'for'}
            onClick={() => void onVote('for')}
            className={`gallery-vote-btn ${effectiveVote === 'for' ? 'gallery-vote-btn--active-for' : ''}`}
          >
            {t('object_updates_approve')} {currentStat.forCount}
          </button>
          <button
            type="button"
            disabled={voteDisabled || !votableUpdateId}
            aria-pressed={effectiveVote === 'against'}
            onClick={() => void onVote('against')}
            className={`gallery-vote-btn ${effectiveVote === 'against' ? 'gallery-vote-btn--active-against' : ''}`}
          >
            {t('object_updates_reject')} {currentStat.againstCount}
          </button>
        </div>
        <span>
          {t('object_updates_approval')}{' '}
          <span className="gallery-approval-percent font-weight-label">
            {currentStat.approvePercent.toFixed(2)}%
          </span>
        </span>
        {voteError ? (
          <p className="gallery-vote-error w-full text-caption" role="alert">
            {voteError}
          </p>
        ) : null}
      </footer>

      {canSetAvatar && viewerUsername ? (
        <AddUpdateModal
          mode="generic"
          open={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          objectId={objectId}
          viewerUsername={viewerUsername}
          updateType={UPDATE_TYPES.IMAGE}
          initialValue={{ url: currentPhoto.url }}
          updateTypeCounts={updateTypeCounts}
        />
      ) : null}
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(overlay, document.body);
}
