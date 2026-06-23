'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { DISCOVER_ACTIVE_CHIP_CLASS } from '@/modules/discover/presentation/components/discover-active-chips';
import { ChipRemoveIcon } from '@/modules/discover/presentation/components/discover-chip-icons';
import { useInstantNavigation } from '@/shared/presentation';

import { buildProfilePostsHref } from '../../domain/profile-post-filters-url';
import { fetchProfilePostObjectFilters } from '../../infrastructure/profile-post-filters.client';

export type ProfilePostFilterChipsProps = {
  accountName: string;
  objectIds: string[];
};

export function ProfilePostFilterChips({ accountName, objectIds }: ProfilePostFilterChipsProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const [nameById, setNameById] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    if (objectIds.length === 0) {
      setNameById(new Map());
      return;
    }
    const ac = new AbortController();
    void (async () => {
      const res = await fetchProfilePostObjectFilters(accountName, {
        objectIds,
        signal: ac.signal,
      });
      if (!ac.signal.aborted && res) {
        setNameById(new Map(res.items.map((item) => [item.object_id, item.name])));
      }
    })();
    return () => ac.abort();
  }, [accountName, objectIds]);

  const pushObjectIds = useCallback(
    (nextObjectIds: string[]) => {
      const href = buildProfilePostsHref(accountName, nextObjectIds);
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [accountName, navigateInstant],
  );

  const removeObject = useCallback(
    (objectId: string) => {
      pushObjectIds(objectIds.filter((id) => id !== objectId));
    },
    [pushObjectIds, objectIds],
  );

  const clearAll = useCallback(() => {
    pushObjectIds([]);
  }, [pushObjectIds]);

  const activeCount = objectIds.length;

  const labels = useMemo(
    () =>
      objectIds.map((id) => ({
        id,
        label: nameById.get(id) ?? id,
      })),
    [objectIds, nameById],
  );

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-caption font-weight-label text-fg-tertiary">
          {t('profile_active_filters').replace('{count}', String(activeCount))}
        </span>
        <button
          type="button"
          className="text-caption text-link underline"
          onClick={clearAll}
        >
          {t('profile_clear_all_filters')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {labels.map(({ id, label }) => (
          <span key={id} className={DISCOVER_ACTIVE_CHIP_CLASS}>
            <span className="truncate">{label}</span>
            <button
              type="button"
              className="shrink-0 rounded-full p-0.5 text-fg-secondary hover:bg-surface-control hover:text-fg"
              onClick={() => removeObject(id)}
              aria-label={t('discover_remove_filter')}
            >
              <ChipRemoveIcon />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
