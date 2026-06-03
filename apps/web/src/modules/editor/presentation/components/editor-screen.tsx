'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { fetchSearchObjectById } from '@/modules/app-header/infrastructure/search.client';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { hasLexicalDraftBodyContent } from '../../application/editor-body-serialization';
import {
  initialPostEditorTags,
  mergeRewardModeIntoJsonMetadata,
  mergeTagsIntoJsonMetadata,
  parseBeneficiariesFromDraft,
  parseRewardModeFromJsonMetadata,
  serializeBeneficiariesForPersist,
  validateBeneficiaries,
} from '../../application/post-editor-advanced-settings';
import { resolveEditorPublishDockStatus } from '../../application/resolve-editor-publish-dock-status';
import {
  appendLinkedObjectIfAbsent,
  mergeJsonMetadataWithObjects,
  parseLinkedObjectsFromJsonMetadata,
  serializeLinkedObjectsForPersist,
  validateLinkedObjectPercents,
} from '../../application/post-editor-objects-metadata';
import type { PostEditorBeneficiary } from '../../domain/post-editor-advanced-settings';
import type { PostEditorRewardMode } from '../../domain/post-editor-advanced-settings';
import { useEditorPostPublish } from '../../application/use-editor-post-publish';
import type { PostEditorLinkedObject } from '../../domain/post-editor-linked-object';
import {
  createUserDraftAction,
  patchUserDraftAction,
} from '../../infrastructure/drafts.actions';
import { EditorAdvancedSettingsPanel } from './editor-advanced-settings-panel';
import { EditorAttachedObjectsPanel } from './editor-attached-objects-panel';
import { EditorPostPreviewModal } from './editor-post-preview-modal';
import { EditorPublishDock } from './editor-publish-dock';
import { LexicalPostEditor } from './lexical-editor';
import {
  LastDraftsSidebar,
  type LastDraftSidebarItem,
} from './last-drafts-sidebar';

const POST_TITLE_MAX_LENGTH = 255;
const AUTOSAVE_DEBOUNCE_MS = 3000;

export type EditorScreenProps = {
  username: string;
  initialTitle?: string;
  initialBody?: string;
  /** Resolved draft id when loading by permlink/draftId on the server. */
  initialDraftId?: string | null;
  /** Draft `jsonMetadata` from query-api (includes `objects`). */
  initialJsonMetadata?: unknown;
  /** From server env (`getPostEditorDefaultBeneficiary`). */
  defaultBeneficiary?: PostEditorBeneficiary | null;
  initialBeneficiaries?: unknown;
  sidebarDrafts: LastDraftSidebarItem[];
};

export function EditorScreen({
  username,
  initialTitle = '',
  initialBody = '',
  initialDraftId = null,
  initialJsonMetadata = null,
  defaultBeneficiary = null,
  initialBeneficiaries = null,
  sidebarDrafts,
}: EditorScreenProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [jsonMetadata, setJsonMetadata] = useState<unknown>(initialJsonMetadata);
  const [linkedObjects, setLinkedObjects] = useState<PostEditorLinkedObject[]>(() =>
    parseLinkedObjectsFromJsonMetadata(initialJsonMetadata),
  );
  const [searchResultsById, setSearchResultsById] = useState<
    Record<string, SearchObjectResult>
  >({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [rewardMode, setRewardMode] = useState<PostEditorRewardMode>(() =>
    parseRewardModeFromJsonMetadata(initialJsonMetadata),
  );
  const [tags, setTags] = useState<string[]>(() =>
    initialPostEditorTags(initialJsonMetadata, initialDraftId === null),
  );
  const [beneficiaries, setBeneficiaries] = useState<PostEditorBeneficiary[]>(
    () =>
      parseBeneficiariesFromDraft(initialBeneficiaries, defaultBeneficiary),
  );

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLinked = parseLinkedObjectsFromJsonMetadata(initialJsonMetadata);
  const lastPersistedRef = useRef({
    title: initialTitle,
    body: initialBody,
    draftId: initialDraftId,
    linkedObjectsJson: serializeLinkedObjectsForPersist(initialLinked),
    tagsJson: JSON.stringify(
      initialPostEditorTags(initialJsonMetadata, initialDraftId === null),
    ),
    rewardMode: parseRewardModeFromJsonMetadata(initialJsonMetadata),
    beneficiariesJson: serializeBeneficiariesForPersist(
      parseBeneficiariesFromDraft(initialBeneficiaries, defaultBeneficiary),
    ),
  });
  const stateRef = useRef({
    title,
    body,
    draftId,
    jsonMetadata,
    linkedObjects,
    tags,
    rewardMode,
    beneficiaries,
  });
  useEffect(() => {
    stateRef.current = {
      title,
      body,
      draftId,
      jsonMetadata,
      linkedObjects,
      tags,
      rewardMode,
      beneficiaries,
    };
  }, [
    title,
    body,
    draftId,
    jsonMetadata,
    linkedObjects,
    tags,
    rewardMode,
    beneficiaries,
  ]);

  useEffect(() => {
    const ids = linkedObjects.map((o) => o.objectId);
    if (ids.length === 0) {
      return;
    }
    const controller = new AbortController();
    for (const objectId of ids) {
      void fetchSearchObjectById(objectId, { signal: controller.signal }).then(
        (result) => {
          if (controller.signal.aborted || !result) {
            return;
          }
          setSearchResultsById((prev) =>
            prev[objectId] ? prev : { ...prev, [objectId]: result },
          );
        },
      );
    }
    return () => controller.abort();
  }, [linkedObjects]);

  const cacheSearchResult = useCallback((result: SearchObjectResult) => {
    setSearchResultsById((prev) => ({ ...prev, [result.object_id]: result }));
  }, []);

  const buildJsonMetadataPayload = useCallback(
    (
      meta0: unknown,
      linked0: PostEditorLinkedObject[],
      tags0: string[],
      reward0: PostEditorRewardMode,
    ) =>
      mergeRewardModeIntoJsonMetadata(
        mergeTagsIntoJsonMetadata(
          mergeJsonMetadataWithObjects(meta0, linked0),
          tags0,
        ),
        reward0,
      ),
    [],
  );

  const runSave = useCallback(async () => {
    const {
      title: t0,
      body: b0,
      draftId: id0,
      jsonMetadata: meta0,
      linkedObjects: linked0,
      tags: tags0,
      rewardMode: reward0,
      beneficiaries: ben0,
    } = stateRef.current;
    const linkedJson = serializeLinkedObjectsForPersist(linked0);
    const tagsJson = JSON.stringify(tags0);
    const beneficiariesJson = serializeBeneficiariesForPersist(ben0);
    const last = lastPersistedRef.current;
    if (
      t0 === last.title &&
      b0 === last.body &&
      id0 === last.draftId &&
      linkedJson === last.linkedObjectsJson &&
      tagsJson === last.tagsJson &&
      reward0 === last.rewardMode &&
      beneficiariesJson === last.beneficiariesJson &&
      id0 !== null
    ) {
      return;
    }
    if (
      !validateLinkedObjectPercents(linked0).ok ||
      !validateBeneficiaries(ben0, username).ok
    ) {
      return;
    }
    const jsonMetadataPayload = buildJsonMetadataPayload(
      meta0,
      linked0,
      tags0,
      reward0,
    );
    if (
      !id0 &&
      !t0.trim() &&
      !b0.trim() &&
      linked0.length === 0 &&
      tags0.length === 0 &&
      ben0.length === 0
    ) {
      return;
    }
    if (!id0) {
      const r = await createUserDraftAction(username, {
        title: t0,
        body: b0,
        jsonMetadata: jsonMetadataPayload,
        beneficiaries: ben0,
      });
      if (r.ok) {
        const newId = r.value.draftId;
        setDraftId(newId);
        setJsonMetadata(r.value.jsonMetadata);
        lastPersistedRef.current = {
          title: t0,
          body: b0,
          draftId: newId,
          linkedObjectsJson: linkedJson,
          tagsJson,
          rewardMode: reward0,
          beneficiariesJson,
        };
        router.replace(`/editor?draftId=${encodeURIComponent(newId)}`);
        router.refresh();
      }
      return;
    }
    const r = await patchUserDraftAction(
      username,
      { draftId: id0 },
      {
        title: t0,
        body: b0,
        jsonMetadata: jsonMetadataPayload,
        beneficiaries: ben0,
      },
    );
    if (r.ok) {
      setJsonMetadata(r.value.jsonMetadata);
      lastPersistedRef.current = {
        title: t0,
        body: b0,
        draftId: id0,
        linkedObjectsJson: linkedJson,
        tagsJson,
        rewardMode: reward0,
        beneficiariesJson,
      };
      router.refresh();
    }
  }, [username, router, buildJsonMetadataPayload]);

  const runSaveRef = useRef(runSave);
  useEffect(() => {
    runSaveRef.current = runSave;
  }, [runSave]);

  const flushSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await runSaveRef.current();
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void runSaveRef.current();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, []);

  const handleLinkedObjectsChange = useCallback(
    (next: PostEditorLinkedObject[]) => {
      if (!validateLinkedObjectPercents(next).ok) {
        return;
      }
      setLinkedObjects(next);
      setJsonMetadata((prev: unknown) =>
        buildJsonMetadataPayload(prev, next, tags, rewardMode),
      );
    },
    [buildJsonMetadataPayload, tags, rewardMode],
  );

  const handleTagsChange = useCallback(
    (next: string[]) => {
      setTags(next);
      setJsonMetadata((prev: unknown) =>
        buildJsonMetadataPayload(prev, linkedObjects, next, rewardMode),
      );
      scheduleSave();
    },
    [buildJsonMetadataPayload, linkedObjects, rewardMode, scheduleSave],
  );

  const handleRewardModeChange = useCallback(
    (next: PostEditorRewardMode) => {
      setRewardMode(next);
      setJsonMetadata((prev: unknown) =>
        buildJsonMetadataPayload(prev, linkedObjects, tags, next),
      );
      scheduleSave();
    },
    [buildJsonMetadataPayload, linkedObjects, tags, scheduleSave],
  );

  const handleBeneficiariesChange = useCallback(
    (next: PostEditorBeneficiary[]) => {
      if (!validateBeneficiaries(next, username).ok) {
        return;
      }
      setBeneficiaries(next);
      scheduleSave();
    },
    [username, scheduleSave],
  );

  const handleLinkedObjectsChangeWithSave = useCallback(
    (next: PostEditorLinkedObject[]) => {
      handleLinkedObjectsChange(next);
      scheduleSave();
    },
    [handleLinkedObjectsChange, scheduleSave],
  );

  const handleObjectLinkedFromEditor = useCallback(
    (result: SearchObjectResult) => {
      cacheSearchResult(result);
      const { objects, added } = appendLinkedObjectIfAbsent(linkedObjects, result);
      if (added) {
        handleLinkedObjectsChangeWithSave(objects);
      }
    },
    [cacheSearchResult, linkedObjects, handleLinkedObjectsChangeWithSave],
  );

  useEffect(() => {
    const flush = () => {
      void runSaveRef.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      flush();
    };
  }, []);

  const objectValidation = validateLinkedObjectPercents(linkedObjects);
  const hasTitle = title.trim().length > 0;
  const hasBody = hasLexicalDraftBodyContent(body);
  const canPreview = hasTitle && hasBody;

  const dockStatus = useMemo(() => {
    const { messageKey, warning } = resolveEditorPublishDockStatus({
      linkedObjectsOk: objectValidation.ok,
      hasTitle,
      hasBody,
      legalAccepted,
    });
    return { line: t(messageKey), warning };
  }, [
    objectValidation.ok,
    hasTitle,
    hasBody,
    legalAccepted,
    t,
  ]);

  const {
    publish,
    phase: publishPhase,
    error: publishError,
    setError: setPublishError,
    canPublish,
    busy: publishBusy,
  } = useEditorPostPublish({
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
  });

  return (
    <main className="w-full min-w-0 pb-[calc(var(--shell-header-height,4rem)+0.75rem)]">
      <div
        className={[
          'grid w-full grid-cols-1 items-start gap-y-6',
          'lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--shell-right-width))]',
          'lg:gap-x-card-padding',
        ].join(' ')}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <input
              id="post-title"
              type="text"
              name="title"
              value={title}
              maxLength={POST_TITLE_MAX_LENGTH}
              onChange={(e) => {
                setTitle(e.target.value);
                scheduleSave();
              }}
              placeholder={t('title_placeholder')}
              className={[
                'w-full rounded-btn border border-border bg-surface-control px-3 py-2',
                'font-display text-body-lg text-fg placeholder:text-fg-tertiary',
                'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              ].join(' ')}
              autoComplete="off"
            />
          </div>

          <LexicalPostEditor
            bodyPlaceholder={t('story_placeholder')}
            initialBody={initialBody || undefined}
            onBodyChange={(serialized) => {
              setBody(serialized);
              scheduleSave();
            }}
            onObjectLinkedFromEditor={handleObjectLinkedFromEditor}
          />

          <EditorAdvancedSettingsPanel
            username={username}
            rewardMode={rewardMode}
            onRewardModeChange={handleRewardModeChange}
            beneficiaries={beneficiaries}
            onBeneficiariesChange={handleBeneficiariesChange}
            tags={tags}
            onTagsChange={handleTagsChange}
          />

          <EditorAttachedObjectsPanel
            linkedObjects={linkedObjects}
            searchResultsById={searchResultsById}
            onLinkedObjectsChange={handleLinkedObjectsChangeWithSave}
            onSearchResultCached={cacheSearchResult}
          />
        </div>

        <div className="min-w-0 self-start">
          <LastDraftsSidebar drafts={sidebarDrafts} />
        </div>
      </div>

      <EditorPublishDock
        statusLine={dockStatus.line}
        statusWarning={dockStatus.warning}
        canPreview={canPreview}
        canPublish={canPublish}
        legalAccepted={legalAccepted}
        onLegalAcceptedChange={(next) => {
          setLegalAccepted(next);
          if (next) {
            setPublishError(null);
          }
        }}
        publishPhase={publishPhase}
        busy={publishBusy}
        publishError={publishError}
        onPreview={() => setPreviewOpen(true)}
        onPublish={() => void publish()}
      />

      <EditorPostPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        username={username}
        title={title}
        bodyLexicalJson={body}
        linkedObjects={linkedObjects}
        searchResultsById={searchResultsById}
      />
    </main>
  );
}
