'use client';

import { useEffect, useId, useState } from 'react';

import { InfoIcon } from '@/icons/named';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';
import { WalletHoverTooltip } from '@/modules/user-wallet/presentation/components/shared/wallet-hover-tooltip';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import { isValidHiveAccountName, normalizeHiveAccountName } from '../../domain/hive-account-name';
import { buildGrantAuthorityOpAction } from '../../infrastructure/actions/build-authority-update-op.server';
import { useAuthorityBroadcast } from '../hooks/use-authority-broadcast';

export type GrantAuthorityModalProps = {
  open: boolean;
  onClose: () => void;
  profileAccountName: string;
  onSuccess: () => Promise<void>;
};

export function GrantAuthorityModal({
  open,
  onClose,
  profileAccountName,
  onSuccess,
}: GrantAuthorityModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const descId = useId();
  const weightInputId = useId();
  const { broadcast, pending, error, setError } = useAuthorityBroadcast();

  const [grantee, setGrantee] = useState('');
  const [authorityType, setAuthorityType] = useState<'posting' | 'active'>('posting');
  const [weight, setWeight] = useState('1');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeConfirm, setActiveConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setGrantee('');
    setAuthorityType('posting');
    setWeight('1');
    setValidationError(null);
    setActiveConfirm(false);
    setError(null);
  }, [open, setError]);

  async function onGrant() {
    setValidationError(null);
    setError(null);

    const normalizedGrantee = normalizeHiveAccountName(grantee);
    if (!isValidHiveAccountName(normalizedGrantee)) {
      setValidationError(t('permissions_invalid_grantee'));
      return;
    }
    if (normalizedGrantee === normalizeHiveAccountName(profileAccountName)) {
      setValidationError(t('permissions_self_grant'));
      return;
    }

    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight < 1) {
      setValidationError(t('permissions_invalid_weight'));
      return;
    }

    if (authorityType === 'active' && !activeConfirm) {
      setValidationError(t('permissions_active_grant_ack_required'));
      return;
    }

    const built = await buildGrantAuthorityOpAction({
      grantor: profileAccountName,
      grantee: normalizedGrantee,
      authorityType,
      weight: parsedWeight,
    });

    if (!built.ok) {
      if (built.error === 'invalid_grantee') {
        setValidationError(t('permissions_invalid_grantee'));
      } else if (built.error === 'self_grant') {
        setValidationError(t('permissions_self_grant'));
      } else if (built.error === 'not_authorized') {
        setValidationError(t('permissions_not_authorized'));
      } else {
        setValidationError(t('permissions_grant_failed'));
      }
      return;
    }

    const ok = await broadcast([built.operation]);
    if (!ok) {
      return;
    }

    await onSuccess();
    onClose();
  }

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId} describedBy={descId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-heading-sm font-weight-heading text-fg">
              {t('permissions_grant_modal_title')}
            </h2>
            <p id={descId} className="mt-1 text-body-sm text-fg-secondary">
              {t('permissions_grant_modal_subtitle')}
            </p>
          </div>
          <AppModalCloseButton onClose={onClose} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-body-sm font-weight-label text-fg">
              {t('permissions_grant_recipient')}
            </label>
            <UserRefSearchField value={grantee} onChange={setGrantee} />
          </div>

          <div>
            <span className="mb-1 block text-body-sm font-weight-label text-fg">
              {t('permissions_grant_role')}
            </span>
            <div className="flex gap-2">
              {(['posting', 'active'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  aria-pressed={authorityType === role}
                  onClick={() => setAuthorityType(role)}
                  className={[
                    'rounded-btn border px-3 py-1.5 text-body-sm capitalize',
                    authorityType === role
                      ? 'border-accent bg-accent/10 font-weight-label text-fg'
                      : 'border-border text-fg-secondary hover:bg-surface-alt',
                  ].join(' ')}
                >
                  {t(`permissions_authority_${role}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <label
                htmlFor={weightInputId}
                className="text-body-sm font-weight-label text-fg"
              >
                {t('permissions_grant_weight')}
              </label>
              <WalletHoverTooltip
                content={t('permissions_weight_tooltip')}
                placement="bottom"
                align="start"
              >
                <button
                  type="button"
                  aria-label={t('permissions_weight_tooltip')}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-fg-secondary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <InfoIcon size={16} aria-hidden />
                </button>
              </WalletHoverTooltip>
            </div>
            <input
              id={weightInputId}
              type="number"
              min={1}
              step={1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg"
            />
          </div>

          {authorityType === 'active' ? (
            <label className="flex items-start gap-2 text-body-sm text-fg-secondary">
              <input
                type="checkbox"
                checked={activeConfirm}
                onChange={(e) => setActiveConfirm(e.target.checked)}
              />
              {t('permissions_active_grant_ack')}
            </label>
          ) : null}

          {validationError ? (
            <p className="text-body-sm text-status-error" role="alert">
              {validationError}
            </p>
          ) : null}
          {error ? (
            <p className="text-body-sm text-status-error" role="alert">
              {t('wallet_broadcast_failed')}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn px-4 py-2 text-body-sm text-fg-secondary hover:bg-surface-alt"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onGrant()}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-on-accent disabled:opacity-50"
          >
            {pending ? '…' : t('permissions_grant_submit')}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
