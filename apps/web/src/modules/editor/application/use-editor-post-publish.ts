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
import { revalidateHomeFeedAfterBroadcast, revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import type { PostEditorLinkedObject } from '../domain/post-editor-linked-object';
import {
  collectImageCidsFromEditorState,
  hasLexicalDraftBodyContent,
} from './editor-body-serialization';
import { buildHivePostImageMetadata } from './build-hive-post-image-metadata';
import { lexicalStateToMarkdown } from './lexical-state-to-markdown';
import {
  buildPublishCommentOptions,
  buildPublishTags,
  stripEditorOnlyJsonMetadataFields,
  validateBeneficiaries,
} from './post-editor-advanced-settings';
import type { PostEditorBeneficiary } from '../domain/post-editor-advanced-settings';
import type { PostEditorRewardMode } from '../domain/post-editor-advanced-settings';
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
  tags: readonly string[];
  rewardMode: PostEditorRewardMode;
  beneficiaries: readonly PostEditorBeneficiary[];
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
  tags,
  rewardMode,
  beneficiaries,
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
    validateBeneficiaries(beneficiaries, username).ok &&
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
      const publishTags = buildPublishTags(tags, defaults.community);
      const baseMeta = buildHiveJsonMetadata({
        host,
        community: defaults.community,
        app: defaults.app,
        tags: publishTags,
      });
      const imageCids = collectImageCidsFromEditorState(body);
      const imageUrls = buildHivePostImageMetadata(
        imageCids,
        contentBaseUrl,
        (cid) => imageContentUrlForCid(contentBaseUrl!, cid),
      );
      const merged = stripEditorOnlyJsonMetadataFields(
        mergeJsonMetadataWithObjects(jsonMetadata, linkedObjects) as Record<
          string,
          unknown
        >,
      );
      const json_metadata = JSON.stringify({
        ...baseMeta,
        ...merged,
        tags: publishTags,
        ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
      });

      const commentOp = buildCommentOp({
        parent_author: '',
        parent_permlink: defaults.community,
        author: username,
        permlink,
        title: title.trim(),
        body: markdown,
        json_metadata,
      });

      const optionsOp = buildPublishCommentOptions({
        author: username,
        permlink,
        rewardMode,
        beneficiaries,
      });

      const { transactionId } = await getWalletFacade().broadcast({
        operations: [commentOp, optionsOp],
      });

      setPhase('confirming');
      await awaitTrxConfirmation(transactionId);

      if (draftId) {
        await deleteUserDraftAction(username, { draftId });
      }

      await refreshAfterBroadcast(router, async () => {
        await revalidateUserFeedAfterBroadcast(username);
        await revalidateHomeFeedAfterBroadcast(username);
      });

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
    beneficiaries,
    phase,
    rewardMode,
    router,
    tags,
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
