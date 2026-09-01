'use client';

import { useCallback, useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInstantNavigation } from '@/shared/presentation';
import { CloseIcon } from '@/icons';

import { buildDiscoverHref, decodeTagFilter, type DiscoverBox, type DiscoverMapView } from '../../domain/discover-url';

/** Pill style for active search / tag filters in the feed column (matches header search chips, denser padding). */
export const DISCOVER_ACTIVE_CHIP_CLASS =
  'inline-flex max-w-full items-center gap-1 rounded-pill border border-border bg-surface-control px-2 py-0.5 text-caption text-fg';

export type DiscoverActiveChipsProps = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
  box: DiscoverBox | null;
  map: DiscoverMapView | null;
};

export function DiscoverActiveChips({
  usersMode,
  objectType,
  q,
  tags,
  sort,
  box,
  map,
}: DiscoverActiveChipsProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const trimmedQ = q.trim();

  const activeCount = useMemo(
    () => (trimmedQ.length > 0 ? 1 : 0) + tags.length + (box ? 1 : 0),
    [trimmedQ, tags, box],
  );

  const pushHref = useCallback(
    (nextTags: string[], nextQ = q, nextBox: DiscoverBox | null = box) => {
      const href = buildDiscoverHref({
        users: usersMode,
        type: objectType ?? undefined,
        q: nextQ,
        tags: nextTags,
        sort,
        box: nextBox,
        map: map ?? undefined,
      });
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [navigateInstant, usersMode, objectType, q, sort, box, map],
  );

  const removeQuery = useCallback(() => {
    pushHref(tags, '');
  }, [pushHref, tags]);

  const removeTag = useCallback(
    (tag: string) => {
      pushHref(tags.filter((item) => item !== tag));
    },
    [pushHref, tags],
  );

  const clearAll = useCallback(() => {
    pushHref([], '', null);
  }, [pushHref]);

  const removeMapArea = useCallback(() => {
    pushHref(tags, q, null);
  }, [pushHref, tags, q]);

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-caption font-weight-label text-fg-tertiary">
          {t('discover_active_filters').replace('{count}', String(activeCount))}
        </span>
        <button
          type="button"
          className="shrink-0 text-caption text-accent underline-offset-2 hover:underline"
          onClick={clearAll}
        >
          {t('discover_clear_all')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {trimmedQ.length > 0 ? (
          <span className={DISCOVER_ACTIVE_CHIP_CLASS}>
            <span className="truncate font-weight-label">
              {t('discover_active_search_chip').replace('{query}', trimmedQ)}
            </span>
            <button
              type="button"
              aria-label={t('discover_remove_search').replace('{query}', trimmedQ)}
              className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
              onClick={removeQuery}
            >
              <CloseIcon size={16} />
            </button>
          </span>
        ) : null}
        {tags.map((tag) => {
          const label = decodeTagFilter(tag)?.value ?? tag;
          return (
            <span key={tag} className={DISCOVER_ACTIVE_CHIP_CLASS}>
              <span className="truncate font-weight-label">{label}</span>
              <button
                type="button"
                aria-label={t('discover_remove_filter').replace('{tag}', label)}
                className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
                onClick={() => removeTag(tag)}
              >
                <CloseIcon size={16} />
              </button>
            </span>
          );
        })}
        {box ? (
          <span className={DISCOVER_ACTIVE_CHIP_CLASS}>
            <span className="truncate font-weight-label">{t('discover_map_area_filter')}</span>
            <button
              type="button"
              aria-label={t('discover_remove_map_area')}
              className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
              onClick={removeMapArea}
            >
              <CloseIcon size={16} />
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
