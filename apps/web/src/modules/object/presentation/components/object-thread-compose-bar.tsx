'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { getHiveJsonMetadataDefaults } from '@/config/hive-json-metadata-public';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { CompactComposeEditor } from '@/modules/editor';
import { buildCommentOp, getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';
import { buildHiveJsonMetadataString, createCommentPermlink } from '@/shared';

import { appendObjectAnchorToThreadBody } from '../../domain/append-object-anchor-to-thread-body';
import { resolveLeoThreadParentAction } from '../../infrastructure/actions/resolve-leo-thread-parent.action';
import { ObjectThreadAnchorChip } from './object-thread-anchor-chip';

export type ObjectThreadComposeBarProps = {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
  onRequireLogin?: () => void;
};

export function ObjectThreadComposeBar({
  objectId,
  objectName,
  viewerUsername,
  onRequireLogin,
}: ObjectThreadComposeBarProps) {
  useHydrateWalletProvider();
  const router = useRouter();
  const { t } = useI18n();
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

    if (!viewerUsername?.trim()) {
      onRequireLogin?.();
      return;
    }

    setError(null);
    setPending(true);

    try {
      const parentResult = await resolveLeoThreadParentAction();
      if (!parentResult.ok) {
        setError(t('object_thread_parent_unavailable'));
        setPending(false);
        return;
      }

      const publishBody = appendObjectAnchorToThreadBody(body, objectId);
      const defaults = getHiveJsonMetadataDefaults();
      const json_metadata = buildHiveJsonMetadataString({
        host: window.location.host,
        ...defaults,
      });

      const op = buildCommentOp({
        parent_author: parentResult.parentAuthor,
        parent_permlink: parentResult.parentPermlink,
        author: viewerUsername,
        permlink: createCommentPermlink(
          parentResult.parentAuthor,
          parentResult.parentPermlink,
        ),
        title: '',
        body: publishBody,
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
          await revalidateObjectAfterBroadcast(objectId);
        }).finally(() => {
          setConfirming(false);
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('object_thread_publish_failed'));
      setPending(false);
    }
  }, [bodyPlain, objectId, onRequireLogin, pending, router, t, viewerUsername]);

  const canSubmit = bodyPlain.trim().length > 0 && !pending;

  return (
    <div className="mb-2">
      <ObjectThreadAnchorChip objectName={objectName} />
      <CompactComposeEditor
        className="rounded-card border border-border bg-surface/60 p-card-padding pt-3"
        editorKey={editorKey}
        bodyPlaceholder={t('object_thread_compose_placeholder')}
        onBodyChange={setBodyPlain}
        onSend={onSubmit}
        canSend={canSubmit}
        sendAriaLabel={t('object_thread_send')}
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
                {t('object_thread_confirming')}
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
    </div>
  );
}
