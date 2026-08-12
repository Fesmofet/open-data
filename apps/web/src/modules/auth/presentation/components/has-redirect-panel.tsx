'use client';

import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  buildHasAuthDeepLinkFromPayloadBase64,
  parseHasAuthFragmentPayload,
} from '@/modules/auth/infrastructure/providers/has/has-fragment-payload';

export function HasRedirectPanel() {
  const { t } = useI18n();
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHash(window.location.hash);
  }, []);

  const parsed = useMemo(() => {
    if (!hash) {
      return { kind: 'missing' as const };
    }
    try {
      const payload = parseHasAuthFragmentPayload(hash);
      const base64 = hash.startsWith('#') ? hash.slice(1) : hash;
      return {
        kind: 'ready' as const,
        payload,
        deepLink: buildHasAuthDeepLinkFromPayloadBase64(base64.trim()),
      };
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'missing') {
        return { kind: 'missing' as const };
      }
      return { kind: 'invalid' as const };
    }
  }, [hash]);

  function openKeychain() {
    if (parsed.kind !== 'ready') {
      return;
    }
    window.location.href = parsed.deepLink;
  }

  async function copyDeepLink() {
    if (parsed.kind !== 'ready') {
      return;
    }
    try {
      await navigator.clipboard.writeText(parsed.deepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  if (parsed.kind === 'missing') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-title-sm font-label font-weight-strong text-fg">
          {t('has_redirect_title')}
        </h1>
        <p className="text-body-sm text-fg-secondary">
          {t('has_redirect_missing_payload')}
        </p>
      </div>
    );
  }

  if (parsed.kind === 'invalid') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-title-sm font-label font-weight-strong text-fg">
          {t('has_redirect_title')}
        </h1>
        <p className="text-body-sm text-fg-secondary">
          {t('has_redirect_invalid_payload')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title-sm font-label font-weight-strong text-fg">
        {t('has_redirect_title')}
      </h1>
      <p className="text-body-sm text-fg-secondary">
        {t('has_redirect_external_browser_hint')}
      </p>
      <button
        type="button"
        onClick={openKeychain}
        className="rounded-card bg-accent px-4 py-3 text-body-sm font-label font-weight-strong text-on-accent"
      >
        {t('has_redirect_open_keychain')}
      </button>
      <button
        type="button"
        onClick={() => void copyDeepLink()}
        className="rounded-card border border-border bg-surface-control px-4 py-3 text-body-sm text-fg"
      >
        {copied ? t('has_redirect_copy_done') : t('has_redirect_copy_deep_link')}
      </button>
      <p className="break-all font-mono text-caption text-fg-secondary">
        {parsed.deepLink}
      </p>
    </div>
  );
}
