'use client';

import QRCode from 'qrcode';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppLoader } from '@/shared/presentation/components/app-loader';

import { isMobileBrowser } from '../../domain/device/is-mobile-browser';
import {
  ExternalLinkIcon,
  InfoIcon,
  QrCodeIcon,
  SmartphoneIcon,
} from '@/icons';

export type KeychainHasLoginPanelProps = {
  deepLink: string;
  expiresAtMs: number | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
};

function InstructionCallout() {
  const { t } = useI18n();

  return (
    <div
      className="flex gap-2.5 rounded-card border border-border bg-surface-control px-3 py-2.5"
      role="note"
    >
      <InfoIcon size={20} className="mt-0.5 shrink-0 text-fg-secondary" />
      <p className="text-body-sm text-fg-secondary">
        {t('auth_keychain_has_instruction_prefix')}{' '}
        <span className="font-label font-weight-strong text-fg">
          {t('auth_keychain_has_instruction_posting')}
        </span>{' '}
        and{' '}
        <span className="font-label font-weight-strong text-fg">
          {t('auth_keychain_has_instruction_active')}
        </span>{' '}
        {t('auth_keychain_has_instruction_suffix')}
      </p>
    </div>
  );
}

type StepRowProps = {
  step: number;
  icon: ReactNode;
  children: ReactNode;
};

function StepRow({ step, icon, children }: StepRowProps) {
  return (
    <li className="flex gap-3">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-surface-control text-caption font-label text-accent"
        aria-hidden
      >
        {step}
      </span>
      <span className="mt-0.5 shrink-0 text-fg-secondary">{icon}</span>
      <p className="text-body-sm text-fg-secondary">{children}</p>
    </li>
  );
}

type StepTextProps = {
  emphasisKey: string;
  restKey: string;
};

function StepText({ emphasisKey, restKey }: StepTextProps) {
  const { t } = useI18n();

  return (
    <>
      <span className="font-label font-weight-strong text-fg">{t(emphasisKey)}</span>
      {t(restKey)}
    </>
  );
}

function OrDivider() {
  const { t } = useI18n();

  return (
    <div className="flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-caption text-fg-secondary">{t('auth_keychain_has_or')}</span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

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

  const stepTwoEmphasisKey = isMobile
    ? 'auth_keychain_has_step_mobile_emphasis'
    : 'auth_keychain_has_step_scan_emphasis';
  const stepTwoRestKey = isMobile
    ? 'auth_keychain_has_step_mobile_rest'
    : 'auth_keychain_has_step_scan_rest';

  return (
    <div className="mt-3 flex flex-col gap-4">
      <InstructionCallout />

      <ol className="flex list-none flex-col gap-3 p-0">
        <StepRow step={1} icon={<SmartphoneIcon className="block" />}>
          <StepText
            emphasisKey="auth_keychain_has_step_open_emphasis"
            restKey="auth_keychain_has_step_open_rest"
          />
        </StepRow>
        <StepRow step={2} icon={<QrCodeIcon size={20} className="block" />}>
          <StepText emphasisKey={stepTwoEmphasisKey} restKey={stepTwoRestKey} />
        </StepRow>
      </ol>

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
            className="flex h-[220px] w-[220px] items-center justify-center rounded-card border border-border bg-surface-control"
            aria-hidden
          >
            <AppLoader size="sm" layout="inline" />
          </div>
        )}

        <OrDivider />

        <button
          type="button"
          onClick={openDeepLink}
          className="flex w-full items-center justify-center gap-2 rounded-btn border border-accent bg-surface px-4 py-2.5 font-label text-accent transition-colors hover:bg-ghost-surface"
        >
          <ExternalLinkIcon className="shrink-0" />
          {t('auth_keychain_has_click_here')}
        </button>
      </div>

      {pending ? (
        <AppLoader
          size="sm"
          layout="inline"
          label={t('auth_keychain_has_waiting')}
          className="justify-center"
        />
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
