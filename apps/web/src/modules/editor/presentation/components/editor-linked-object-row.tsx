'use client';

import type { CSSProperties } from 'react';

import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { ObjectCard } from '@/modules/feed/presentation';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { POST_EDITOR_OBJECTS_PERCENT_TOTAL } from '../../domain/post-editor-linked-object';
import type { PostEditorLinkedObject } from '../../domain/post-editor-linked-object';
import { searchObjectResultToObjectView } from '../../application/search-object-to-card-view';

export type EditorLinkedObjectRowProps = {
  linked: PostEditorLinkedObject;
  searchResult: SearchObjectResult | null;
  onRemove: () => void;
  onPercentChange: (percent: number) => void;
};

function EditorObjectToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={[
        'flex h-6 w-11 shrink-0 items-center rounded-pill border border-border p-1 transition-colors',
        checked ? 'bg-accent' : 'bg-surface-control',
      ].join(' ')}
      onClick={() => onChange(!checked)}
    >
      <span
        className={[
          'size-4 shrink-0 rounded-circle bg-surface shadow-card transition-[margin-inline-start] duration-200',
          checked ? 'ms-5' : 'ms-0',
        ].join(' ')}
        aria-hidden
      />
    </button>
  );
}

export function EditorLinkedObjectRow({
  linked,
  searchResult,
  onRemove,
  onPercentChange,
}: EditorLinkedObjectRowProps) {
  const { t } = useI18n();
  const view = searchResult
    ? searchObjectResultToObjectView(searchResult)
    : searchObjectResultToObjectView({
        object_id: linked.objectId,
        object_type: '',
        name: linked.objectId,
        image_url: null,
        parent_name: null,
      });

  return (
    <ObjectCard
      object={view}
      as="div"
      layout="editorRow"
      hideAdministrativeHeart
      trailing={
        <>
          <EditorObjectToggle
            checked
            onChange={(checked) => {
              if (!checked) {
                onRemove();
              }
            }}
            label={t('editor_linked_objects')}
          />
          <div className="flex w-28 flex-col items-stretch gap-1">
            <label className="sr-only" htmlFor={`percent-${linked.objectId}`}>
              {t('linked_objects_remaining')}
            </label>
            <input
              id={`percent-${linked.objectId}`}
              type="range"
              min={0}
              max={POST_EDITOR_OBJECTS_PERCENT_TOTAL}
              step={1}
              value={linked.percent}
              className="editor-linked-object-percent-slider w-full"
              style={
                {
                  '--slider-fill': `${linked.percent}%`,
                } as CSSProperties
              }
              onChange={(e) => onPercentChange(Number(e.target.value))}
            />
            <span className="text-end text-caption tabular-nums text-fg-secondary">
              {linked.percent}%
            </span>
          </div>
        </>
      }
    />
  );
}
