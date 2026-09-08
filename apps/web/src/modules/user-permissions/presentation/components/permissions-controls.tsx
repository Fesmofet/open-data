'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { SortDropdown } from '@/modules/user-social/presentation/components/sort-dropdown';
import { useInstantNavigation } from '@/shared/presentation';

import {
  USER_PERMISSIONS_AUTHORITY_TYPES,
  USER_PERMISSIONS_SORTS,
  type UserPermissionsAuthorityType,
  type UserPermissionsSort,
} from '../../application/dto/user-permissions.dto';

export function PermissionsTypeFilter() {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeType = useMemo((): UserPermissionsAuthorityType | 'all' => {
    const raw = searchParams.get('type') ?? '';
    return USER_PERMISSIONS_AUTHORITY_TYPES.includes(raw as UserPermissionsAuthorityType)
      ? (raw as UserPermissionsAuthorityType)
      : 'all';
  }, [searchParams]);

  const onSelect = useCallback(
    (next: UserPermissionsAuthorityType | 'all') => {
      const u = new URLSearchParams(searchParams.toString());
      if (next === 'all') {
        u.delete('type');
      } else {
        u.set('type', next);
      }
      navigateInstant({ href: `${pathname}?${u.toString()}`, method: 'replace', scroll: false });
    },
    [navigateInstant, pathname, searchParams],
  );

  const chips: { value: UserPermissionsAuthorityType | 'all'; label: string }[] = [
    { value: 'all', label: t('permissions_filter_all') },
    { value: 'posting', label: t('permissions_filter_posting') },
    { value: 'active', label: t('permissions_filter_active') },
    { value: 'owner', label: t('permissions_filter_owner') },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const selected = activeType === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(chip.value)}
            className={[
              'rounded-btn border px-3 py-1.5 text-body-sm transition-colors',
              selected
                ? 'border-accent bg-accent/10 font-weight-label text-fg'
                : 'border-border bg-surface text-fg-secondary hover:bg-surface-alt',
            ].join(' ')}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export function PermissionsTabLinks({
  profileAccountName,
}: {
  profileAccountName: string;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseHref = `/@${encodeURIComponent(profileAccountName)}/permissions`;

  const tabs = [
    { value: 'granted' as const, label: t('permissions_tab_granted') },
    { value: 'received' as const, label: t('permissions_tab_received') },
  ];

  const activeTab = searchParams.get('tab') === 'received' ? 'received' : 'granted';

  return (
    <div className="flex gap-4 border-b border-border">
      {tabs.map((tab) => {
        const u = new URLSearchParams(searchParams.toString());
        if (tab.value === 'granted') {
          u.delete('tab');
        } else {
          u.set('tab', tab.value);
        }
        const href = `${baseHref}?${u.toString()}`;
        const selected = activeTab === tab.value;
        return (
          <Link
            key={tab.value}
            href={href}
            aria-current={selected ? 'page' : undefined}
            className={[
              'border-b-2 px-1 pb-3 text-body-sm transition-colors',
              selected
                ? 'border-accent font-weight-label text-fg'
                : 'border-transparent text-fg-secondary hover:text-fg',
            ].join(' ')}
            suppressHydrationWarning
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PermissionsSortControl() {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = useMemo((): UserPermissionsSort => {
    const raw = searchParams.get('sort') ?? '';
    return USER_PERMISSIONS_SORTS.includes(raw as UserPermissionsSort)
      ? (raw as UserPermissionsSort)
      : 'a-z';
  }, [searchParams]);

  const options = useMemo(
    () => [
      { value: 'recency' as const, label: t('social_sort_recency') },
      { value: 'rank' as const, label: t('social_sort_rank') },
      { value: 'followers' as const, label: t('social_sort_followers') },
      { value: 'a-z' as const, label: t('social_sort_az') },
    ],
    [t],
  );

  const onChange = useCallback(
    (next: UserPermissionsSort) => {
      const u = new URLSearchParams(searchParams.toString());
      if (next === 'a-z') {
        u.delete('sort');
      } else {
        u.set('sort', next);
      }
      navigateInstant({ href: `${pathname}?${u.toString()}`, method: 'replace', scroll: false });
    },
    [navigateInstant, pathname, searchParams],
  );

  return <SortDropdown value={sort} options={options} onChange={onChange} />;
}
