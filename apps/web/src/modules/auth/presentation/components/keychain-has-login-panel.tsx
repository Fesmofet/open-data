'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { isMobileBrowser } from '../../domain/device/is-mobile-browser';

export type KeychainHasLoginPanelProps = {
  deepLink: string;
  expiresAtMs: number | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
};

export function KeychainHasLoginPanel({
  deepLink,
  expiresAtMs,
  pending,
  error,
  onCancel,
}: KeychainHasLoginPanelProps) {
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const isMobile = isMobileBrowser();

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(deepLink, { width: 220, margin: 1 })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [deepLink]);

  function openDeepLink() {
    window.location.href = deepLink;
  }

  const expired =
    expiresAtMs != null && expiresAtMs <= Date.now() && !pending;

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="rounded-card border border-border bg-surface-muted px-3 py-2 text-body-sm text-fg-secondary">
        {t('auth_keychain_has_instruction')}
      </div>

      <p className="text-body-sm text-fg-secondary">
        {isMobile ? t('auth_keychain_has_mobile_hint') : t('auth_keychain_has_qr_hint')}
      </p>

      <div className="flex flex-col items-center gap-3">
        {qrDataUrl ? (
          <button
            type="button"
            onClick={isMobile ? openDeepLink : undefined}
            className="rounded-card border border-border bg-surface p-2"
            aria-label={t('auth_keychain_has_click_here')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL */}
            <img
              src={qrDataUrl}
              alt=""
              width={220}
              height={220}
              className="block"
            />
          </button>
        ) : (
          <div
            className="flex h-[220px] w-[220px] items-center justify-center rounded-card border border-border bg-surface-muted text-caption text-fg-secondary"
            aria-hidden
          >
            …
          </div>
        )}

        <p className="text-body-sm text-fg-secondary">
          {t('auth_keychain_has_or')}{' '}
          <button
            type="button"
            onClick={openDeepLink}
            className="font-label text-link hover:underline"
          >
            {t('auth_keychain_has_click_here')}
          </button>
        </p>
      </div>

      {pending ? (
        <p className="text-body-sm text-fg-secondary" role="status">
          {t('auth_keychain_has_waiting')}
        </p>
      ) : null}

      {expired ? (
        <p className="text-body-sm text-error" role="alert">
          {t('auth_keychain_has_expired')}
        </p>
      ) : null}

      {error ? (
        <p className="text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCancel}
        className="self-start text-body-sm text-fg-secondary hover:text-fg"
      >
        {t('cancel')}
      </button>
    </div>
  );
}
