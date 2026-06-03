'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { imageContentUrlForCid } from '@/config/ipfs-content-url';
import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { getHiveJsonMetadataDefaults } from '@/config/hive-json-metadata-public';
import { buildCommentOp, getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { buildHiveJsonMetadata, createUniqueRootPostPermlink } from '@/shared';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import type { PostEditorLinkedObject } from '../domain/post-editor-linked-object';
import {
  collectImageCidsFromEditorState,
  hasLexicalDraftBodyContent,
} from './editor-body-serialization';
import { lexicalStateToMarkdown } from './lexical-state-to-markdown';
import {
  mergeJsonMetadataWithObjects,
  validateLinkedObjectPercents,
} from './post-editor-objects-metadata';
import { checkPostExistsAction } from '../infrastructure/check-post-exists.action';
import { deleteUserDraftAction } from '../infrastructure/drafts.actions';

export type EditorPublishPhase = 'idle' | 'publishing' | 'confirming';

export type UseEditorPostPublishInput = {
  username: string;
  title: string;
  body: string;
  jsonMetadata: unknown;
  linkedObjects: readonly PostEditorLinkedObject[];
  draftId: string | null;
  legalAccepted: boolean;
  flushSave: () => Promise<void>;
};

export function useEditorPostPublish({
  username,
  title,
  body,
  jsonMetadata,
  linkedObjects,
  draftId,
  legalAccepted,
  flushSave,
}: UseEditorPostPublishInput) {
  useHydrateWalletProvider();
  const router = useRouter();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [phase, setPhase] = useState<EditorPublishPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const canPublishContent =
    legalAccepted &&
    validateLinkedObjectPercents(linkedObjects).ok &&
    title.trim().length > 0 &&
    hasLexicalDraftBodyContent(body);

  const publish = useCallback(async () => {
    if (!canPublishContent || phase !== 'idle') {
      return;
    }
    setError(null);
    setPhase('publishing');
    try {
      await flushSave();

      const resolveImageUrl = (cid: string, src: string) => {
        if (cid && contentBaseUrl) {
          return imageContentUrlForCid(contentBaseUrl, cid);
        }
        return src.trim();
      };
      const markdown = lexicalStateToMarkdown(body, { resolveImageUrl });
      if (!title.trim() || !hasLexicalDraftBodyContent(body)) {
        throw new Error('empty_post');
      }

      const permlink = await createUniqueRootPostPermlink(
        { title, author: username },
        { exists: checkPostExistsAction },
      );

      const defaults = getHiveJsonMetadataDefaults();
      const host =
        typeof window !== 'undefined' ? window.location.host : 'localhost';
      const baseMeta = buildHiveJsonMetadata({
        host,
        community: defaults.community,
        app: defaults.app,
        tags: [defaults.community],
      });
      const imageCids = collectImageCidsFromEditorState(body);
      const imageUrls = imageCids.map((cid) =>
        contentBaseUrl ? imageContentUrlForCid(contentBaseUrl, cid) : cid,
      );
      const merged = mergeJsonMetadataWithObjects(jsonMetadata, linkedObjects);
      const json_metadata = JSON.stringify({
        ...baseMeta,
        ...merged,
        ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
      });

      const op = buildCommentOp({
        parent_author: '',
        parent_permlink: defaults.community,
        author: username,
        permlink,
        title: title.trim(),
        body: markdown,
        json_metadata,
      });

      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });

      setPhase('confirming');
      await awaitTrxConfirmation(transactionId);

      if (draftId) {
        await deleteUserDraftAction(username, { draftId });
      }

      await refreshAfterBroadcast(router, () =>
        revalidateUserFeedAfterBroadcast(username),
      );

      router.push(`/@${encodeURIComponent(username)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'publish_failed');
      setPhase('idle');
    }
  }, [
    body,
    canPublishContent,
    contentBaseUrl,
    draftId,
    flushSave,
    jsonMetadata,
    linkedObjects,
    phase,
    router,
    title,
    username,
  ]);

  return {
    publish,
    phase,
    error,
    setError,
    canPublish: canPublishContent,
    busy: phase !== 'idle',
  };
}
