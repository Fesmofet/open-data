'use client';

import { useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInstantNavigation } from '@/shared/presentation';
import { SortDropdown } from '@/modules/user-social/presentation/components/sort-dropdown';

import { buildDiscoverHref, type DiscoverBox, type DiscoverMapView } from '../../domain/discover-url';

export type DiscoverSort = 'newest' | 'oldest' | 'rank';

export type DiscoverSortSelectProps = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  tags: string[];
  sort: DiscoverSort;
  box: DiscoverBox | null;
  map: DiscoverMapView | null;
};

export function DiscoverSortSelect({
  usersMode,
  objectType,
  q,
  tags,
  sort,
  box,
  map,
}: DiscoverSortSelectProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();

  const options = useMemo(
    () => [
      { value: 'newest' as const, label: t('discover_sort_newest') },
      { value: 'oldest' as const, label: t('discover_sort_oldest') },
      { value: 'rank' as const, label: t('discover_sort_rank') },
    ],
    [t],
  );

  return (
    <SortDropdown
      value={sort}
      options={options}
      label={t('discover_sort_label')}
      showLabelOnMobile
      onChange={(next) => {
        const href = buildDiscoverHref({
          users: usersMode,
          type: objectType ?? undefined,
          q,
          tags,
          sort: next,
          box,
          map: map ?? undefined,
        });
        navigateInstant({ href, method: 'replace', scroll: false });
      }}
    />
  );
}
