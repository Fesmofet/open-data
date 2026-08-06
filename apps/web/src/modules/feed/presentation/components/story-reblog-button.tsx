'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { buildReblogOp, getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateHomeFeedAfterBroadcast, revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { StoryStatButton } from './story-stat-button';

function IconReblog({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export type StoryReblogButtonProps = {
  authorName: string;
  permlink: string;
  rebloggedByViewer: boolean;
  currentUsername: string | null;
  isOwnPost: boolean;
  onBroadcastRevalidate?: () => Promise<void>;
};

export function StoryReblogButton({
  authorName,
  permlink,
  rebloggedByViewer,
  currentUsername,
  isOwnPost,
  onBroadcastRevalidate,
}: StoryReblogButtonProps) {
  useHydrateWalletProvider();
  const router = useRouter();
  const [optimisticReblogged, setOptimisticReblogged] = useState(rebloggedByViewer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticReblogged(rebloggedByViewer);
    setError(null);
  }, [authorName, permlink, rebloggedByViewer]);

  const onReblog = useCallback(async () => {
    if (!currentUsername?.trim() || pending || optimisticReblogged || isOwnPost) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const op = buildReblogOp(currentUsername.trim(), authorName, permlink);
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      setOptimisticReblogged(true);
      setPending(false);
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, async () => {
          await revalidateUserFeedAfterBroadcast(authorName);
          await revalidateHomeFeedAfterBroadcast(currentUsername);
          await onBroadcastRevalidate?.();
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reblog failed');
      setPending(false);
    }
  }, [authorName, currentUsername, isOwnPost, onBroadcastRevalidate, optimisticReblogged, pending, permlink, router]);

  if (isOwnPost) {
    return null;
  }

  const canInteract = Boolean(currentUsername?.trim()) && !optimisticReblogged;

  return (
    <div className="inline-flex flex-col items-start">
      <StoryStatButton
        icon={<IconReblog />}
        label={optimisticReblogged ? 'Reblogged' : 'Reblog'}
        title={optimisticReblogged ? 'You already reblogged this post' : 'Reblog'}
        iconActive={optimisticReblogged}
        disabled={!canInteract || pending}
        onClick={() => void onReblog()}
        ariaPressed={optimisticReblogged}
      />
      {error ? (
        <span className="max-w-[12rem] text-nano text-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
