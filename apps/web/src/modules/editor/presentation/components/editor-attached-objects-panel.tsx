'use client';

import { useCallback, useMemo } from 'react';

import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { MAX_POST_EDITOR_ATTACHED_OBJECTS } from '../../domain/post-editor-linked-object';

import {
  appendLinkedObjectIfAbsent,
  applySliderPercent,
  remainingPercentWeight,
  validateLinkedObjectPercents,
  withEqualPercents,
} from '../../application/post-editor-objects-metadata';
import type { PostEditorLinkedObject } from '../../domain/post-editor-linked-object';
import { EditorLinkedObjectRow } from './editor-linked-object-row';
import { EditorObjectSearchField } from './editor-object-search-field';

export type EditorAttachedObjectsPanelProps = {
  linkedObjects: PostEditorLinkedObject[];
  searchResultsById: Readonly<Record<string, SearchObjectResult>>;
  onLinkedObjectsChange: (objects: PostEditorLinkedObject[]) => void;
  onSearchResultCached: (result: SearchObjectResult) => void;
  onNavigateToCreateObject: () => void;
};

export function EditorAttachedObjectsPanel({
  linkedObjects,
  searchResultsById,
  onLinkedObjectsChange,
  onSearchResultCached,
  onNavigateToCreateObject,
}: EditorAttachedObjectsPanelProps) {
  const { t } = useI18n();

  const attachedIds = useMemo(
    () => linkedObjects.map((o) => o.objectId),
    [linkedObjects],
  );

  const atCapacity = linkedObjects.length >= MAX_POST_EDITOR_ATTACHED_OBJECTS;
  const validation = validateLinkedObjectPercents(linkedObjects);
  const remaining = remainingPercentWeight(linkedObjects);

  const handleAdd = useCallback(
    (result: SearchObjectResult) => {
      onSearchResultCached(result);
      const { objects, added } = appendLinkedObjectIfAbsent(linkedObjects, result);
      if (added) {
        onLinkedObjectsChange(objects);
      }
    },
    [linkedObjects, onLinkedObjectsChange, onSearchResultCached],
  );

  const handleRemove = useCallback(
    (objectId: string) => {
      const filtered = linkedObjects.filter((o) => o.objectId !== objectId);
      onLinkedObjectsChange(
        filtered.length > 0 ? withEqualPercents(filtered) : [],
      );
    },
    [linkedObjects, onLinkedObjectsChange],
  );

  const handlePercentChange = useCallback(
    (objectId: string, percent: number) => {
      onLinkedObjectsChange(applySliderPercent(linkedObjects, objectId, percent));
    },
    [linkedObjects, onLinkedObjectsChange],
  );

  return (
    <section className="flex flex-col gap-3" aria-labelledby="editor-attached-objects-heading">
      <p
        id="editor-attached-objects-heading"
        className="text-body-sm text-fg-secondary"
      >
        {t('editor_search_elements')}
      </p>

      <EditorObjectSearchField
        attachedObjectIds={attachedIds}
        onSelect={handleAdd}
        disabled={atCapacity}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNavigateToCreateObject}
          className="text-body-sm text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t('create_new_object')}
        </button>
      </div>

      {linkedObjects.length > 0 ? (
        <>
          <h3 className="font-label text-body-sm font-weight-label text-heading">
            {t('editor_linked_objects')}
          </h3>
          <ul className="flex flex-col gap-card-padding">
            {linkedObjects.map((linked) => (
              <li key={linked.objectId} className="list-none">
                <EditorLinkedObjectRow
                  linked={linked}
                  searchResult={searchResultsById[linked.objectId] ?? null}
                  onRemove={() => handleRemove(linked.objectId)}
                  onPercentChange={(percent) =>
                    handlePercentChange(linked.objectId, percent)
                  }
                />
              </li>
            ))}
          </ul>
          <p
            className={[
              'text-body-sm tabular-nums',
              validation.ok ? 'text-fg-secondary' : 'text-warning',
            ].join(' ')}
            title={t('linked_objects_tooltip')}
          >
            {t('linked_objects_remaining')}: {remaining}
          </p>
        </>
      ) : null}

      {atCapacity ? (
        <p className="text-caption text-muted" role="status">
          {t('editor_linked_objects')} ({MAX_POST_EDITOR_ATTACHED_OBJECTS})
        </p>
      ) : null}
    </section>
  );
}
