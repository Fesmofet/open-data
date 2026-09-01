'use client';

import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatObjectTypeLabel } from '@/modules/app-header/domain/search-nav-list';
import { CheckIcon, SearchIcon } from '@/icons';
import { ModalShell, useInstantNavigation } from '@/shared/presentation';

import { buildDiscoverHref } from '../../domain/discover-url';
import { listDiscoverObjectTypes } from '../../domain/discover-registry';
import { writeDiscoverObjectTypeCookie } from '../../domain/discover-type-cookie';

export type DiscoverTypeSheetProps = {
  open: boolean;
  onClose: () => void;
  usersMode: boolean;
  objectType: string | null;
  q: string;
  sort: 'newest' | 'oldest' | 'rank';
};

function matchesTypeSearch(type: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return formatObjectTypeLabel(type).toLowerCase().includes(needle);
}

export function DiscoverTypeSheet({
  open,
  onClose,
  usersMode,
  objectType,
  q,
  sort,
}: DiscoverTypeSheetProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const types = useMemo(() => listDiscoverObjectTypes(), []);
  const visibleTypes = useMemo(
    () => types.filter((type) => matchesTypeSearch(type, searchQuery)),
    [types, searchQuery],
  );

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const selectObjectType = (type: string) => {
    writeDiscoverObjectTypeCookie(type);
    const href = buildDiscoverHref({ type, q, sort });
    navigateInstant({ href, method: 'replace', scroll: false });
    onClose();
  };

  const selectUsers = () => {
    const href = buildDiscoverHref({ users: true, q, sort });
    navigateInstant({ href, method: 'replace', scroll: false });
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="sheet"
      ariaLabel={t('discover_select_type')}
      scrollBody
      header={
        <div className="border-b border-border px-gutter pb-3 pt-2">
          <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border" aria-hidden />
          <h2 className="text-center text-heading font-weight-label text-fg">
            {t('discover_page_title')}
          </h2>
          <div className="relative mt-3 flex items-center gap-2 rounded-btn border border-border bg-surface-control px-3 py-2">
            <SearchIcon size={18} className="shrink-0 text-fg-secondary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('discover_search_object_types')}
              className="min-w-0 flex-1 border-0 bg-transparent text-body text-fg outline-none placeholder:text-fg-tertiary"
            />
          </div>
        </div>
      }
    >
      <div className="px-gutter pb-gutter">
        <p className="mb-2 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
          {t('discover_objects_menu')}
        </p>
        {visibleTypes.length === 0 ? (
          <p className="py-4 text-body-sm text-fg-secondary">{t('discover_no_results')}</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {visibleTypes.map((type) => {
              const active = !usersMode && objectType === type;
              return (
                <li key={type}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={[
                      'flex w-full items-center justify-between px-2 py-3 text-start text-body transition-colors',
                      active ? 'font-weight-label text-accent' : 'text-fg hover:bg-ghost-surface',
                    ].join(' ')}
                    onClick={() => selectObjectType(type)}
                  >
                    <span>{formatObjectTypeLabel(type)}</span>
                    {active ? <CheckIcon size={18} className="shrink-0 text-accent" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mb-2 mt-6 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
          {t('discover_users_menu')}
        </p>
        <ul className="divide-y divide-border border-y border-border">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={usersMode}
              className={[
                'flex w-full items-center justify-between px-2 py-3 text-start text-body transition-colors',
                usersMode ? 'font-weight-label text-accent' : 'text-fg hover:bg-ghost-surface',
              ].join(' ')}
              onClick={selectUsers}
            >
              <span>{t('discover_all_users')}</span>
              {usersMode ? <CheckIcon size={18} className="shrink-0 text-accent" /> : null}
            </button>
          </li>
        </ul>
      </div>
    </ModalShell>
  );
}
