'use client';

import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatGalleryRankLabel } from '@/modules/object/domain/gallery-rank';

import { GalleryRankModal } from './gallery-rank-modal';

export type GalleryRankTriggerButtonProps = {
  variant: 'gallery' | 'card';
  updateId: string;
  objectId: string;
  rankScore: number | null;
  viewerRank: number | null;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  imagePreviewUrl?: string | null;
  /** Fired when rank modal opens or closes (e.g. disable parent Escape). */
  onOpenChange?: (open: boolean) => void;
};

export function GalleryRankTriggerButton({
  variant,
  updateId,
  objectId,
  rankScore,
  viewerRank,
  viewerUsername,
  onRequireLogin,
  imagePreviewUrl,
  onOpenChange,
}: GalleryRankTriggerButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [optimisticRankScore, setOptimisticRankScore] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setOptimisticRankScore(null);
    setConfirming(false);
  }, [updateId, rankScore, viewerRank]);

  const setOpenWithNotify = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const buttonClassName =
    variant === 'gallery'
      ? 'gallery-chrome-text rounded-btn border border-border/60 bg-surface/20 px-3 py-1.5 text-body-sm font-weight-label hover:bg-surface/40 disabled:opacity-50'
      : 'rounded-btn border border-border bg-surface-alt px-3 py-1.5 text-body-sm font-weight-label text-fg-secondary hover:bg-surface-control disabled:opacity-50';

  const displayRankScore = optimisticRankScore ?? rankScore;
  const rankBadge =
    displayRankScore != null ? (
      <span className="ml-1.5 tabular-nums text-caption text-muted">
        ({formatGalleryRankLabel(displayRankScore)})
      </span>
    ) : null;

  const onTriggerClick = () => {
    if (!viewerUsername?.trim()) {
      onRequireLogin?.();
      return;
    }
    setOpenWithNotify(true);
  };

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        disabled={confirming}
        onClick={onTriggerClick}
      >
        {confirming ? t('gallery_rank_confirming') : t('gallery_rank_set')}
        {!confirming ? rankBadge : null}
      </button>
      <GalleryRankModal
        open={open}
        onClose={() => setOpenWithNotify(false)}
        updateId={updateId}
        objectId={objectId}
        rankScore={rankScore}
        viewerRank={viewerRank}
        viewerUsername={viewerUsername}
        onRequireLogin={onRequireLogin}
        imagePreviewUrl={imagePreviewUrl}
        onRankSubmitted={(rank) => {
          setOptimisticRankScore(rank);
          setConfirming(true);
        }}
        onConfirmFinished={() => setConfirming(false)}
      />
    </>
  );
}
