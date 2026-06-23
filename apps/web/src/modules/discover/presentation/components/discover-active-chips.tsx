'use client';

import { useCallback, useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInstantNavigation } from '@/shared/presentation';

import { buildDiscoverHref, decodeTagFilter } from '../../domain/discover-url';
import { ChipRemoveIcon } from './discover-chip-icons';

/** Pill style for active search / tag filters in the feed column (matches header search chips, denser padding). */
export const DISCOVER_ACTIVE_CHIP_CLASS =
  'inline-flex max-w-full items-center gap-1 rounded-pill border border-border bg-surface-control px-2 py-0.5 text-caption text-fg';

export type DiscoverActiveChipsProps = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
};

export function DiscoverActiveChips({
  usersMode,
  objectType,
  q,
  tags,
  sort,
}: DiscoverActiveChipsProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const trimmedQ = q.trim();

  const activeCount = useMemo(
    () => (trimmedQ.length > 0 ? 1 : 0) + tags.length,
    [trimmedQ, tags],
  );

  const pushHref = useCallback(
    (nextTags: string[], nextQ = q) => {
      const href = buildDiscoverHref({
        users: usersMode,
        type: objectType ?? undefined,
        q: nextQ,
        tags: nextTags,
        sort,
      });
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [navigateInstant, usersMode, objectType, q, sort],
  );

  const removeQuery = useCallback(() => {
    pushHref(tags, '');
  }, [pushHref, tags]);

  const removeTag = useCallback(
    (tag: string) => {
      pushHref(tags.filter((t) => t !== tag));
    },
    [pushHref, tags],
  );

  const clearAll = useCallback(() => {
    pushHref([], '');
  }, [pushHref]);

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
              <ChipRemoveIcon />
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
                <ChipRemoveIcon />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
