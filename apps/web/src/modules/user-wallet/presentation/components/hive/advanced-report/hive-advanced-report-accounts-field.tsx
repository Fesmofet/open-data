'use client';

import { useEffect, useRef, useState } from 'react';

import { fetchUserSearchResults } from '@/modules/app-header/infrastructure/search.client';
import type { SearchUserResult } from '@/modules/app-header/domain/search-response.schema';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserAvatar } from '@/shared/presentation';

const SEARCH_DEBOUNCE_MS = 300;

type HiveAdvancedReportAccountsFieldProps = {
  accounts: readonly string[];
  onChange: (accounts: string[]) => void;
};

function normalizeAccount(name: string): string {
  return name.trim().replace(/^@/, '').toLowerCase();
}

export function HiveAdvancedReportAccountsField({
  accounts,
  onChange,
}: HiveAdvancedReportAccountsFieldProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedSet = new Set(accounts.map(normalizeAccount));

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchUserSearchResults(q, { signal: controller.signal }).then((users) => {
        if (!controller.signal.aborted) {
          setResults(users ?? []);
          setOpen(true);
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function addAccount(name: string) {
    const normalized = normalizeAccount(name);
    if (!normalized || selectedSet.has(normalized)) {
      return;
    }
    onChange([...accounts.map(normalizeAccount), normalized]);
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeAccount(name: string) {
    const normalized = normalizeAccount(name);
    onChange(accounts.map(normalizeAccount).filter((acc) => acc !== normalized));
  }

  return (
    <div className="space-y-2">
      <label className="flex flex-col gap-1 text-body-sm">
        <span className="font-weight-strong">{t('users_search_title')}</span>
        <input
          ref={inputRef}
          type="search"
          className="rounded-input border border-border bg-bg px-2 py-1.5"
          placeholder={t('find_users_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          autoComplete="off"
        />
      </label>

      {open && results.length > 0 ? (
        <ul className="max-h-48 overflow-y-auto rounded-card border border-border bg-bg shadow-whisper">
          {results.map((user) => {
            const disabled = selectedSet.has(normalizeAccount(user.name));
            return (
              <li key={user.name}>
                <button
                  type="button"
                  disabled={disabled}
                  className={[
                    'flex w-full items-center gap-2 px-3 py-2 text-start text-body-sm',
                    disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-ghost-surface',
                  ].join(' ')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addAccount(user.name)}
                >
                  <UserAvatar
                    username={user.name}
                    avatarUrl={user.profile_image ?? undefined}
                    displayName={user.name}
                    size={32}
                  />
                  <span>@{user.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {accounts.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {accounts.map((account) => (
            <li
              key={account}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-control px-2 py-1"
            >
              <UserAvatar username={account} size={24} />
              <span className="text-body-sm">@{account}</span>
              <button
                type="button"
                className="text-muted hover:text-fg"
                aria-label={t('object_edit_delegation_clear_user')}
                onClick={() => removeAccount(account)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
