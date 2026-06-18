'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ACTIVITY_FILTER_GROUPS,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';
import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  replaceProfileActivityFiltersInUrl,
  toggleActivityFilter,
} from '../../domain/activity-filters-url';
import { PROFILE_FILTER_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';
import { useActivityFiltersFromUrl } from '../hooks/use-activity-filters-from-url';

type ActivityFiltersProps = {
  accountName: string;
  selectedFilters: ActivityFilterKey[];
};

type FilterSectionProps = {
  titleKey: string;
  filterKeys: readonly ActivityFilterKey[];
  selected: Set<ActivityFilterKey>;
  onToggle: (key: ActivityFilterKey, checked: boolean) => void;
  labelPrefix: string;
};

function FilterSection({
  titleKey,
  filterKeys,
  selected,
  onToggle,
  labelPrefix,
}: FilterSectionProps) {
  const { t } = useI18n();
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="text-caption font-weight-label uppercase tracking-wide text-muted">
        {t(titleKey)}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {filterKeys.map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-fg">
              <input
                type="checkbox"
                className="size-4 shrink-0 rounded-btn border border-border accent-accent"
                checked={selected.has(key)}
                onChange={(e) => onToggle(key, e.target.checked)}
              />
              <span>{t(`${labelPrefix}_${key}`)}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ActivityFilters({
  accountName,
  selectedFilters,
}: ActivityFiltersProps) {
  const { t } = useI18n();
  const [optimisticFilters, setOptimisticFilters] =
    useState<ActivityFilterKey[]>(selectedFilters);
  const selected = useMemo(() => new Set(optimisticFilters), [optimisticFilters]);

  useEffect(() => {
    setOptimisticFilters(selectedFilters);
  }, [selectedFilters]);

  const onToggle = useCallback(
    (key: ActivityFilterKey, checked: boolean) => {
      const next = toggleActivityFilter(optimisticFilters, key, checked);
      setOptimisticFilters(next);
      replaceProfileActivityFiltersInUrl(accountName, next);
    },
    [accountName, optimisticFilters],
  );

  return (
    <aside
      className={[
        PROFILE_FILTER_RAIL_STICKY_CLASS,
        'rounded-card border border-border bg-surface/60 p-card-padding',
      ].join(' ')}
      aria-label={t('activity_filters_title')}
    >
      <h2 className="text-body-sm font-weight-strong text-fg">
        {t('activity_filters_title')}
      </h2>
      <FilterSection
        titleKey="activity_filters_general"
        filterKeys={ACTIVITY_FILTER_GROUPS.general}
        selected={selected}
        onToggle={onToggle}
        labelPrefix="activity_filter"
      />
      <FilterSection
        titleKey="activity_filters_finance"
        filterKeys={ACTIVITY_FILTER_GROUPS.finance}
        selected={selected}
        onToggle={onToggle}
        labelPrefix="activity_filter"
      />
      <FilterSection
        titleKey="activity_filters_rewards"
        filterKeys={ACTIVITY_FILTER_GROUPS.rewards}
        selected={selected}
        onToggle={onToggle}
        labelPrefix="activity_filter"
      />
    </aside>
  );
}

export function ActivityFiltersFromUrl({ accountName }: { accountName: string }) {
  const selectedFilters = useActivityFiltersFromUrl();
  return (
    <ActivityFilters accountName={accountName} selectedFilters={selectedFilters} />
  );
}
