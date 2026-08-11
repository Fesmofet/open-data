'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppLoader, UserAvatar } from '@/shared/presentation';

import { ChevronDownIcon } from './auth-login-icons';

import {
  clearAccountHistory,
  getAccountHistory,
} from '../../domain/account-history';
import type { WalletProviderId, WalletProviderMeta } from '../../domain/types';
import { useHivesignerLogin } from './hivesigner-login';
import { KeychainHasLoginPanel } from './keychain-has-login-panel';
import { useKeychainLogin } from './keychain-login';

const PROVIDER_ICON_SIZE = 28;

export type ProviderListProps = {
  providers: readonly WalletProviderMeta[];
  onLoginSuccess?: () => void;
};

export function ProviderList({ providers, onLoginSuccess }: ProviderListProps) {
  const [expandedId, setExpandedId] = useState<WalletProviderId | null>(null);

  return (
    <div className="mt-4 flex flex-col gap-2">
      {providers.map((provider) =>
        provider.id === 'hivesigner' ? (
          <HivesignerProviderRow key={provider.id} provider={provider} />
        ) : (
          <KeychainProviderRow
            key={provider.id}
            provider={provider}
            expanded={expandedId === provider.id}
            onExpand={() =>
              setExpandedId((current) =>
                current === provider.id ? null : provider.id,
              )
            }
            onLoginSuccess={onLoginSuccess}
          />
        ),
      )}
    </div>
  );
}

type HivesignerProviderRowProps = {
  provider: WalletProviderMeta;
};

function HivesignerProviderRow({ provider }: HivesignerProviderRowProps) {
  const hivesigner = useHivesignerLogin();

  return (
    <div>
      <button
        type="button"
        onClick={() => hivesigner.signIn()}
        disabled={hivesigner.pending}
        className="flex w-full items-center gap-3 rounded-btn border border-border bg-surface px-4 py-3 text-left text-body text-fg transition-colors hover:bg-ghost-surface disabled:opacity-50"
      >
        <ProviderIcon src={provider.iconSrc} alt="" />
        <span className="font-label">{provider.displayName}</span>
        {hivesigner.pending ? (
          <span className="ml-auto">
            <AppLoader size="sm" layout="inline" />
          </span>
        ) : null}
      </button>
      {hivesigner.error ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {hivesigner.error}
        </p>
      ) : null}
    </div>
  );
}

type KeychainProviderRowProps = {
  provider: WalletProviderMeta;
  expanded: boolean;
  onExpand: () => void;
  onLoginSuccess?: () => void;
};

function KeychainProviderRow({
  provider,
  expanded,
  onExpand,
  onLoginSuccess,
}: KeychainProviderRowProps) {
  const { t } = useI18n();
  const inputId = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const keychain = useKeychainLogin({ onLoginSuccess });

  const refreshHistory = useCallback(() => {
    setHistory(getAccountHistory());
  }, []);

  useEffect(() => {
    if (!expanded) {
      setHistoryOpen(false);
      setUsername('');
      return undefined;
    }
    refreshHistory();
    keychain.clearError();
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [expanded, refreshHistory, keychain.clearError]);

  useEffect(() => {
    if (!historyOpen) {
      return undefined;
    }
    function onPointerDown(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [historyOpen]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    await keychain.signIn(username);
  }

  function handleSelectAccount(name: string) {
    setUsername(name);
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  function handleClearHistory() {
    clearAccountHistory();
    refreshHistory();
    setHistoryOpen(false);
  }

  if (keychain.mode === 'has-waiting') {
    return (
      <div ref={rowRef} className="relative">
        <div className="flex items-center gap-3 rounded-btn border border-border-strong bg-surface px-3 py-2">
          <ProviderIcon src={provider.iconSrc} alt="" />
          <span className="font-label text-fg">{provider.displayName}</span>
          <ChevronDownIcon className="ml-auto shrink-0 rotate-180 text-fg-secondary" />
        </div>
        {keychain.hasDeepLink ? (
          <KeychainHasLoginPanel
            deepLink={keychain.hasDeepLink}
            expiresAtMs={keychain.hasExpiresAtMs}
            pending={keychain.pending}
            error={keychain.error}
            onCancel={keychain.cancelHas}
          />
        ) : (
          <div className="mt-3 flex justify-center" role="status">
            <AppLoader size="sm" layout="inline" />
          </div>
        )}
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-center gap-3 rounded-btn border border-border bg-surface px-4 py-3 text-left text-body text-fg transition-colors hover:bg-ghost-surface"
      >
        <ProviderIcon src={provider.iconSrc} alt="" />
        <span className="font-label">{provider.displayName}</span>
        <ChevronDownIcon className="ml-auto shrink-0 text-fg-secondary" />
      </button>
    );
  }

  return (
    <div ref={rowRef} className="relative">
      <form
        onSubmit={handleSignIn}
        className="flex items-center gap-3 rounded-btn border border-border-strong bg-surface px-3 py-2"
      >
        <ProviderIcon src={provider.iconSrc} alt="" />
        <label htmlFor={inputId} className="sr-only">
          {t('auth_keychain_username_label')}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="min-w-0 flex-1 rounded-btn border border-accent bg-surface-control px-3 py-2 text-body text-fg outline-none focus-visible:ring-2 focus-visible:ring-outline-focus"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={() => {
            refreshHistory();
            if (getAccountHistory().length > 0) {
              setHistoryOpen(true);
            }
          }}
          placeholder={t('auth_keychain_username_placeholder')}
          autoComplete="username"
          disabled={keychain.pending}
        />
        <button
          type="submit"
          disabled={keychain.pending || !username.trim()}
          className="shrink-0 rounded-btn bg-accent px-4 py-2 font-label text-accent-fg hover:bg-accent-hover disabled:opacity-50"
        >
          {keychain.pending ? t('auth_keychain_signing') : t('auth_keychain_sign_in')}
        </button>
        <ChevronDownIcon className="shrink-0 rotate-180 text-fg-secondary" aria-hidden />
      </form>

      {historyOpen && history.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-btn border border-border bg-surface shadow-card-float"
          role="listbox"
        >
          {history.map((name) => (
            <li key={name}>
              <button
                type="button"
                role="option"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-body text-fg hover:bg-ghost-surface"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectAccount(name)}
              >
                <UserAvatar username={name} size={24} displayName={name} />
                <span className="font-label">{name}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-border">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-body-sm text-fg-secondary hover:bg-ghost-surface hover:text-fg"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearHistory}
            >
              {t('auth_keychain_clear_history')}
            </button>
          </li>
        </ul>
      ) : null}

      {keychain.error ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {keychain.error}
        </p>
      ) : null}
    </div>
  );
}

function ProviderIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={PROVIDER_ICON_SIZE}
      height={PROVIDER_ICON_SIZE}
      className="shrink-0 rounded-btn"
      unoptimized
    />
  );
}
