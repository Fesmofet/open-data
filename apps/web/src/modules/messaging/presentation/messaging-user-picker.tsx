'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { fetchUserSearchResults } from '@/modules/app-header/infrastructure/search.client';
import { UserAvatar } from '@/shared/presentation';

import { hiveAvatarUrl } from '../domain/messaging.helpers';
import type { ValidateMemberReason } from '../infrastructure/messaging-validate.client';

export type MessagingUserPickerHit = {
  name: string;
  profile_image: string | null;
};

export type MessagingUserPickerProps = {
  viewerUsername?: string | null;
  excludedAccounts?: readonly string[];
  maxSelectable: number;
  blockReasons?: ReadonlyMap<string, ValidateMemberReason>;
  onSelectionChange?: (selected: MessagingUserPickerHit[]) => void;
};

export function MessagingUserPicker({
  viewerUsername = null,
  excludedAccounts = [],
  maxSelectable,
  blockReasons,
  onSelectionChange,
}: MessagingUserPickerProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessagingUserPickerHit[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [selected, setSelected] = useState<MessagingUserPickerHit[]>([]);

  const viewer = viewerUsername?.trim().toLowerCase() ?? null;
  const excluded = useMemo(
    () => new Set(excludedAccounts.map((account) => account.trim().toLowerCase())),
    [excludedAccounts],
  );

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [onSelectionChange, selected]);

  const search = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearchPending(true);
    try {
      const hits = await fetchUserSearchResults(trimmed);
      setResults(
        (hits ?? []).map((hit) => ({
          name: hit.name,
          profile_image: hit.profile_image,
        })),
      );
    } finally {
      setSearchPending(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void search(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, search]);

  const selectedNames = useMemo(
    () => new Set(selected.map((hit) => hit.name.toLowerCase())),
    [selected],
  );

  const addUser = useCallback(
    (hit: MessagingUserPickerHit) => {
      if (viewer && hit.name.toLowerCase() === viewer) {
        return;
      }
      if (excluded.has(hit.name.toLowerCase())) {
        return;
      }
      if (selectedNames.has(hit.name.toLowerCase())) {
        return;
      }
      if (selected.length >= maxSelectable) {
        return;
      }
      const reason = blockReasons?.get(hit.name.toLowerCase());
      if (reason) {
        return;
      }
      setSelected((prev) => [...prev, hit]);
      setQuery('');
      setResults([]);
    },
    [blockReasons, excluded, maxSelectable, selected.length, selectedNames, viewer],
  );

  const removeUser = useCallback((name: string) => {
    const needle = name.toLowerCase();
    setSelected((prev) => prev.filter((hit) => hit.name.toLowerCase() !== needle));
  }, []);

  function reasonLabel(reason: ValidateMemberReason): string {
    switch (reason) {
      case 'muted_by_viewer':
        return t('messaging_member_muted');
      case 'muted_viewer':
        return t('messaging_member_muted_you');
      case 'governance_muted':
        return t('messaging_member_governance_muted');
      case 'already_member':
        return t('messaging_member_already');
      case 'group_full':
        return t('messaging_group_full');
    }
  }

  return (
    <div>
      {selected.length > 0 ? (
        <div>
          <p className="text-caption text-muted">{t('messaging_selected_users')}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {selected.map((hit) => (
              <li key={hit.name}>
                <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-control px-2 py-1">
                  <UserAvatar
                    username={hit.name}
                    avatarUrl={hit.profile_image ?? hiveAvatarUrl(hit.name)}
                    displayName={hit.name}
                    size={24}
                  />
                  <span className="text-body-sm text-fg">{hit.name}</span>
                  <button
                    type="button"
                    className="text-caption text-muted hover:text-fg"
                    aria-label={t('messaging_remove_selected_user').replace('{name}', hit.name)}
                    onClick={() => removeUser(hit.name)}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('messaging_search_user')}
        className="mt-3 w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm"
      />
      <ul className="mt-3 max-h-48 overflow-y-auto">
        {searchPending ? (
          <li className="px-2 py-3 text-body-sm text-muted">{t('app_header_search_loading')}</li>
        ) : null}
        {!searchPending && results.length === 0 && query.trim().length >= 2 ? (
          <li className="px-2 py-3 text-body-sm text-muted">{t('search_empty_state')}</li>
        ) : null}
        {results.map((hit) => {
          const lower = hit.name.toLowerCase();
          const isSelected = selectedNames.has(lower);
          const isViewer = viewer != null && lower === viewer;
          const isExcluded = excluded.has(lower);
          const blockReason = blockReasons?.get(lower);
          const atCap = selected.length >= maxSelectable && !isSelected;
          const disabled = isSelected || isViewer || isExcluded || atCap || blockReason != null;
          return (
            <li key={hit.name}>
              <button
                type="button"
                disabled={disabled}
                className="flex w-full items-center gap-3 rounded-btn px-2 py-2 text-left hover:bg-surface-control/60 disabled:opacity-50"
                onClick={() => addUser(hit)}
                title={blockReason ? reasonLabel(blockReason) : undefined}
              >
                <UserAvatar
                  username={hit.name}
                  avatarUrl={hit.profile_image ?? hiveAvatarUrl(hit.name)}
                  displayName={hit.name}
                  size={36}
                />
                <span className="min-w-0 flex-1 truncate text-body-sm text-fg">{hit.name}</span>
                {blockReason ? (
                  <span className="shrink-0 text-caption text-muted">
                    {reasonLabel(blockReason)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
