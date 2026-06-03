'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { formatObjectTypeLabel } from '@/modules/app-header/domain/search-nav-list';
import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { fetchObjectSearchResults } from '@/modules/app-header/infrastructure/search.client';
import { useI18n } from '@/i18n/providers/i18n-provider';

const SEARCH_DEBOUNCE_MS = 300;
const DROPDOWN_MAX_HEIGHT_PX = 192;
const DROPDOWN_MIN_HEIGHT_PX = 80;
const DROPDOWN_GAP_PX = 4;
const DROPDOWN_Z_INDEX = 50;

type DropdownRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function measureDropdownRect(input: HTMLInputElement): DropdownRect {
  const rect = input.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP_PX;
  const spaceAbove = rect.top - DROPDOWN_GAP_PX;
  const openBelow =
    spaceBelow >= DROPDOWN_MIN_HEIGHT_PX || spaceBelow >= spaceAbove;

  if (openBelow) {
    const maxHeight = Math.min(
      DROPDOWN_MAX_HEIGHT_PX,
      Math.max(DROPDOWN_MIN_HEIGHT_PX, spaceBelow),
    );
    return {
      top: rect.bottom + DROPDOWN_GAP_PX,
      left: rect.left,
      width: rect.width,
      maxHeight,
    };
  }

  const maxHeight = Math.min(
    DROPDOWN_MAX_HEIGHT_PX,
    Math.max(DROPDOWN_MIN_HEIGHT_PX, spaceAbove),
  );
  return {
    top: Math.max(DROPDOWN_GAP_PX, rect.top - DROPDOWN_GAP_PX - maxHeight),
    left: rect.left,
    width: rect.width,
    maxHeight,
  };
}

export type EditorObjectSearchFieldProps = {
  attachedObjectIds: readonly string[];
  onSelect: (result: SearchObjectResult) => void;
  disabled?: boolean;
};

export function EditorObjectSearchField({
  attachedObjectIds,
  onSelect,
  disabled = false,
}: EditorObjectSearchFieldProps) {
  const { t } = useI18n();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchObjectResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const attachedSet = new Set(attachedObjectIds);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      void fetchObjectSearchResults(q, { signal: controller.signal }).then((objects) => {
        if (controller.signal.aborted) {
          return;
        }
        setSearchResults(objects ?? []);
        setSearching(false);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredResults = searchResults.filter(
    (r) => !attachedSet.has(r.object_id),
  );

  const showDropdown =
    !disabled &&
    searchQuery.trim().length >= 2 &&
    filteredResults.length > 0 &&
    !searching;

  useLayoutEffect(() => {
    if (!showDropdown) {
      setDropdownRect(null);
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const update = () => setDropdownRect(measureDropdownRect(input));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showDropdown, searchQuery, filteredResults.length]);

  const dropdown =
    portalReady &&
    showDropdown &&
    dropdownRect &&
    typeof document !== 'undefined'
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            className="fixed overflow-y-auto rounded-btn border border-border bg-surface shadow-card-float"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              maxHeight: dropdownRect.maxHeight,
              zIndex: DROPDOWN_Z_INDEX,
            }}
          >
            {filteredResults.map((result) => {
              const title = result.name?.trim() || result.object_id;
              const img = result.image_url;
              return (
                <li key={result.object_id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 px-2 py-2 text-start hover:bg-ghost-surface"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelect(result);
                      setSearchQuery('');
                      setSearchResults([]);
                      setDropdownRect(null);
                    }}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-btn bg-surface-control">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-10 w-10 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-caption text-muted">
                          —
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-weight-label text-fg">
                        {title}
                      </span>
                      {result.parent_name ? (
                        <span className="block truncate text-body-sm text-muted">
                          {result.parent_name}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 rounded-btn bg-surface-control px-1.5 py-0.5 text-caption text-muted">
                      {formatObjectTypeLabel(result.object_type)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listId : undefined}
        aria-autocomplete="list"
        disabled={disabled}
        value={searchQuery}
        placeholder={t('editor_search_object_by_name')}
        className={[
          'w-full rounded-btn border border-border bg-surface-control px-3 py-2',
          'text-body text-fg placeholder:text-fg-tertiary',
          'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searching && searchQuery.trim().length >= 2 ? (
        <p className="mt-1 text-caption text-muted">{t('app_header_search_loading')}</p>
      ) : null}
      {dropdown}
    </div>
  );
}
