'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { getHiveJsonMetadataDefaults } from '@/config/hive-json-metadata-public';
import { CompactComposeEditor } from '@/modules/editor';
import { buildCommentOp, getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateHomeFeedAfterBroadcast, revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';
import { buildHiveJsonMetadataString, createCommentPermlink } from '@/shared';

import type { FeedStoryView } from '../../application/dto/feed-story.dto';

export type StoryCommentEditorProps = {
  story: FeedStoryView;
  currentUsername: string;
  parentAuthor?: string;
  parentPermlink?: string;
  onSubmitted?: () => void;
  onBroadcastRevalidate?: () => Promise<void>;
};

export function StoryCommentEditor({
  story,
  currentUsername,
  parentAuthor,
  parentPermlink,
  onSubmitted,
  onBroadcastRevalidate,
}: StoryCommentEditorProps) {
  useHydrateWalletProvider();
  const router = useRouter();
  const [bodyPlain, setBodyPlain] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const onSubmit = useCallback(async () => {
    const body = bodyPlain.trim();
    if (!body || pending) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const defaults = getHiveJsonMetadataDefaults();
      const json_metadata = buildHiveJsonMetadataString({
        host: window.location.host,
        ...defaults,
      });
      const replyParentAuthor = parentAuthor ?? story.authorName;
      const replyParentPermlink = parentPermlink ?? story.permlink;
      const op = buildCommentOp({
        parent_author: replyParentAuthor,
        parent_permlink: replyParentPermlink,
        author: currentUsername,
        permlink: createCommentPermlink(replyParentAuthor, replyParentPermlink),
        title: '',
        body,
        json_metadata,
      });
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      setBodyPlain('');
      setEditorKey((k) => k + 1);
      setPending(false);
      setConfirming(true);
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, async () => {
          await revalidateUserFeedAfterBroadcast(story.authorName);
          await revalidateHomeFeedAfterBroadcast(currentUsername);
          await onBroadcastRevalidate?.();
        }).finally(() => {
          setConfirming(false);
          onSubmitted?.();
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comment failed');
      setPending(false);
    }
  }, [
    bodyPlain,
    currentUsername,
    onSubmitted,
    onBroadcastRevalidate,
    parentAuthor,
    parentPermlink,
    pending,
    router,
    story.authorName,
    story.permlink,
  ]);

  const canSubmit = bodyPlain.trim().length > 0 && !pending;

  return (
    <CompactComposeEditor
      className="mt-4 border-t border-border pt-3"
      editorKey={editorKey}
      bodyPlaceholder="Write your comment…"
      onBodyChange={setBodyPlain}
      onSend={onSubmit}
      canSend={canSubmit}
      sendAriaLabel="Submit comment"
      sendVariant="neutral"
      outputMode="plain"
      footer={
        <>
          {confirming ? (
            <p className="mt-2 flex items-center gap-2 text-body-sm text-fg-secondary">
              <span
                className="inline-block h-3 w-3 animate-spin rounded-circle border-2 border-current border-t-transparent"
                aria-hidden
              />
              Waiting for confirmation…
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-body-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </>
      }
    />
  );
}
