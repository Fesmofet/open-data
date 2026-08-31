'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ThumbUpIcon } from '@/icons';
import { loadPostVotersAction } from '@/modules/feed/infrastructure/actions/load-post-voters.action';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, UserAvatar } from '@/shared/presentation';
import { useInfiniteScroll } from '@/shared/presentation/hooks/use-infinite-scroll';

import type { PostVoterRowView } from '../../application/dto/post-voters.dto';

type VoteDirection = 'up' | 'down';

type StoryVoteModalProps = {
  open: boolean;
  authorName: string;
  permlink: string;
  contentType?: 'post' | 'thread';
  initialUpvoteCount: number;
  initialDownvoteCount: number;
  onClose: () => void;
};

function VoterRow({ row }: { row: PostVoterRowView }) {
  const displayName = row.profile.displayName?.trim() || row.voter;
  const profileHref = `/@${encodeURIComponent(row.voter)}`;
  const percentLabel =
    row.percent > 0
      ? row.percent.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : null;

  return (
    <li className="flex items-center gap-3 py-2">
      <UserAvatar
        username={row.voter}
        avatarUrl={row.profile.avatarUrl}
        size={32}
        displayName={displayName}
        className="size-8 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={profileHref}
          suppressHydrationWarning
          className="truncate text-body-sm font-weight-label text-link hover:underline"
        >
          {displayName}
        </Link>
        <p className="text-caption text-muted">
          {row.valueLabel}
          {percentLabel != null ? (
            <>
              <span aria-hidden> · </span>
              {percentLabel}%
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}

export function StoryVoteModal({
  open,
  authorName,
  permlink,
  contentType = 'post',
  initialUpvoteCount,
  initialDownvoteCount,
  onClose,
}: StoryVoteModalProps) {
  const { t } = useI18n();
  const [direction, setDirection] = useState<VoteDirection>('up');
  const [items, setItems] = useState<PostVoterRowView[]>([]);
  const [upvoteCount, setUpvoteCount] = useState(initialUpvoteCount);
  const [downvoteCount, setDownvoteCount] = useState(initialDownvoteCount);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (dir: VoteDirection, cursor: string | null, append: boolean) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const page = await loadPostVotersAction({
          author: authorName,
          permlink,
          direction: dir,
          contentType,
          cursor,
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (!page) {
          setError('Failed to load voters');
          return;
        }
        setUpvoteCount(page.upvoteCount);
        setDownvoteCount(page.downvoteCount);
        setNextCursor(page.nextCursor);
        setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      } catch {
        if (requestId === requestIdRef.current) {
          setError('Failed to load voters');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [authorName, permlink, contentType],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setDirection('up');
    setItems([]);
    setNextCursor(null);
    setUpvoteCount(initialUpvoteCount);
    setDownvoteCount(initialDownvoteCount);
    void loadPage('up', null, false);
  }, [open, authorName, permlink, initialUpvoteCount, initialDownvoteCount, loadPage]);

  const switchDirection = useCallback(
    (dir: VoteDirection) => {
      if (dir === direction) {
        return;
      }
      setDirection(dir);
      setItems([]);
      setNextCursor(null);
      void loadPage(dir, null, false);
    },
    [direction, loadPage],
  );

  const loadMore = useCallback(() => {
    if (!nextCursor || loading) {
      return;
    }
    void loadPage(direction, nextCursor, true);
  }, [direction, loadPage, loading, nextCursor]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: nextCursor != null,
    isLoading: loading,
    onLoadMore: loadMore,
  });

  const upActive = direction === 'up';
  const downActive = direction === 'down';

  return (
    <AppModal
      open={open}
      onClose={onClose}
      labelledBy="story-vote-modal-title"
      panelClassName="flex h-[min(32rem,calc(100dvh-2rem))] w-full flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id="story-vote-modal-title" className="sr-only">
          {t('vote_upvotes')}
        </h2>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {upvoteCount > 0 ? (
            <button
              type="button"
              onClick={() => switchDirection('up')}
              className={[
                'inline-flex items-center gap-1.5 border-b-2 pb-1 text-body-sm font-weight-label transition-colors',
                upActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-fg-secondary',
              ].join(' ')}
            >
              <ThumbUpIcon size={16} className={upActive ? 'text-accent' : undefined} />
              <span className="tabular-nums">{upvoteCount}</span>
            </button>
          ) : null}
          {downvoteCount > 0 ? (
            <button
              type="button"
              onClick={() => switchDirection('down')}
              className={[
                'inline-flex items-center gap-1.5 border-b-2 pb-1 text-body-sm font-weight-label transition-colors',
                downActive
                  ? 'border-fg-secondary text-fg'
                  : 'border-transparent text-muted hover:text-fg-secondary',
              ].join(' ')}
            >
              <ThumbUpIcon size={16} className="rotate-180" />
              <span className="tabular-nums">{downvoteCount}</span>
            </button>
          ) : null}
        </div>
        <AppModalCloseButton onClose={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
        {error ? (
          <p className="py-4 text-body-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        {!error && items.length === 0 && !loading ? (
          <p className="py-4 text-body-sm text-muted" role="status">
            —
          </p>
        ) : null}
        <ul className="divide-y divide-border">
          {items.map((row) => (
            <VoterRow key={row.voter} row={row} />
          ))}
        </ul>
        {loading ? (
          <p className="py-3 text-center text-caption text-muted" role="status">
            …
          </p>
        ) : null}
        <div ref={sentinelRef} className="h-1" aria-hidden />
      </div>
    </AppModal>
  );
}
