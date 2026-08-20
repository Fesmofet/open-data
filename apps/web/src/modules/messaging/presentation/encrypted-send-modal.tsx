'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  encryptEphemeralOneWay,
  isHiveMemoCiphertext,
  normalizeHiveMemoCiphertext,
} from '@opden-data-layer/hive-memo-crypto';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useHydrateWalletProvider } from '@/modules/auth';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import { canUseKeychainMemoCrypto } from '../infrastructure/memo-crypto-capability';
import type { SendEncryptedMessageInput } from '../domain/messaging.types';
import {
  encodeMessageWithKeychain,
  probeKeychainMemoKey,
} from '../infrastructure/keychain-memo-crypto.adapter';
import { fetchMemoPublicKey } from '../infrastructure/memo-public-key.client';
import {
  MessagingUserPicker,
  type MessagingUserPickerHit,
} from './messaging-user-picker';

export type EncryptedSendModalProps = {
  open: boolean;
  onClose: () => void;
  channelKind: 'direct' | 'group' | 'object';
  peer?: string | null;
  members?: string[];
  viewerUsername: string | null;
  body: string;
  pending?: boolean;
  onSendEncrypted: (input: SendEncryptedMessageInput) => void | Promise<void>;
};

type EncryptPreview = {
  ciphertext: string;
  mode: 'memo' | 'ephemeral';
  to: string;
};

export function EncryptedSendModal({
  open,
  onClose,
  channelKind,
  peer = null,
  members = [],
  viewerUsername,
  body,
  pending = false,
  onSendEncrypted,
}: EncryptedSendModalProps) {
  useHydrateWalletProvider();
  const { t } = useI18n();
  const titleId = useId();
  const viewer = viewerUsername?.trim() ?? '';
  const [recipient, setRecipient] = useState('');
  const [hasMemoKey, setHasMemoKey] = useState<boolean | null>(null);
  const [oneWayConsent, setOneWayConsent] = useState(false);
  const [preview, setPreview] = useState<EncryptPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [encryptPending, setEncryptPending] = useState(false);

  const memberOptions = useMemo(() => {
    const needle = viewer.toLowerCase();
    return members
      .map((account) => account.trim())
      .filter((account) => account.length > 0 && account.toLowerCase() !== needle);
  }, [members, viewer]);

  useEffect(() => {
    if (!open) {
      setRecipient('');
      setHasMemoKey(null);
      setOneWayConsent(false);
      setPreview(null);
      setError(null);
      setEncryptPending(false);
      return;
    }
    if (channelKind === 'direct' && peer) {
      setRecipient(peer.trim());
    }
  }, [channelKind, open, peer]);

  const handleObjectRecipientChange = useCallback((selected: MessagingUserPickerHit[]) => {
    setRecipient(selected[0]?.name ?? '');
  }, []);

  useEffect(() => {
    if (!open || !viewer) {
      return;
    }
    if (!canUseKeychainMemoCrypto()) {
      setHasMemoKey(false);
      return;
    }
    let cancelled = false;
    void probeKeychainMemoKey(viewer).then((ok) => {
      if (!cancelled) {
        setHasMemoKey(ok);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, viewer]);

  const resolvedRecipient = recipient.trim();
  const keychainMemoAvailable = canUseKeychainMemoCrypto();
  const memoKeyReady = hasMemoKey !== null;
  const canEncrypt =
    resolvedRecipient.length > 0 &&
    body.trim().length > 0 &&
    !encryptPending &&
    !pending &&
    memoKeyReady;

  const buildPreview = useCallback(async () => {
    if (!canEncrypt || !viewer) {
      return;
    }
    setEncryptPending(true);
    setError(null);
    setPreview(null);
    try {
      let ciphertext: string | null = null;
      let mode: 'memo' | 'ephemeral' = 'memo';
      let keychainError: string | null = null;

      if (keychainMemoAvailable) {
        try {
          ciphertext = await encodeMessageWithKeychain(viewer, resolvedRecipient, body.trim());
          mode = 'memo';
        } catch (err) {
          keychainError = err instanceof Error ? err.message : null;
        }
      }

      if (ciphertext == null) {
        if (!oneWayConsent) {
          setError(keychainError ?? t('messaging_encrypt_one_way_consent'));
          return;
        }
        const { memo_public_key: recipientMemoPublic } =
          await fetchMemoPublicKey(resolvedRecipient);
        ciphertext = normalizeHiveMemoCiphertext(
          encryptEphemeralOneWay(recipientMemoPublic, body.trim()),
        );
        mode = 'ephemeral';
      }

      if (!isHiveMemoCiphertext(ciphertext)) {
        setError(t('messaging_encrypt_failed'));
        return;
      }
      setPreview({ ciphertext, mode, to: resolvedRecipient });
    } catch {
      setError(t('messaging_encrypt_failed'));
    } finally {
      setEncryptPending(false);
    }
  }, [
    body,
    canEncrypt,
    oneWayConsent,
    resolvedRecipient,
    keychainMemoAvailable,
    t,
    viewer,
  ]);

  const truncatedCiphertext =
    preview && preview.ciphertext.length > 48
      ? `${preview.ciphertext.slice(0, 24)}…${preview.ciphertext.slice(-12)}`
      : preview?.ciphertext ?? '';

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId} panelClassName="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-section font-weight-strong text-fg">
          {t('messaging_encrypt_send_title')}
        </h2>
        <AppModalCloseButton onClose={onClose} ariaLabel={t('close')} />
      </div>

      <p className="text-body-sm text-muted">{t('messaging_encrypt_select_recipient')}</p>

      {channelKind === 'direct' ? (
        <p className="mt-2 rounded-btn border border-border px-3 py-2 text-body-sm text-fg">
          {resolvedRecipient || peer}
        </p>
      ) : null}

      {channelKind === 'group' ? (
        <select
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          className="mt-2 w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm"
        >
          <option value="">{t('messaging_encrypt_select_recipient')}</option>
          {memberOptions.map((account) => (
            <option key={account} value={account}>
              {account}
            </option>
          ))}
        </select>
      ) : null}

      {channelKind === 'object' ? (
        <div className="mt-2">
          <MessagingUserPicker
            viewerUsername={viewerUsername}
            maxSelectable={1}
            onSelectionChange={handleObjectRecipientChange}
          />
        </div>
      ) : null}

      {hasMemoKey === false ? (
        <div className="mt-4 space-y-2 rounded-card border border-border bg-surface-control/40 p-3">
          {!keychainMemoAvailable ? (
            <p className="text-body-sm text-fg">{t('messaging_encrypt_signer_one_way_info')}</p>
          ) : (
            <p className="text-body-sm text-fg">{t('messaging_encrypt_import_memo')}</p>
          )}
          <p className="text-body-sm text-muted">{t('messaging_encrypt_one_way_warning')}</p>
          <label className="flex items-center gap-2 text-body-sm text-fg">
            <input
              type="checkbox"
              checked={oneWayConsent}
              onChange={(event) => setOneWayConsent(event.target.checked)}
            />
            {t('messaging_encrypt_one_way_consent')}
          </label>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-body-sm text-danger">{error}</p> : null}

      {preview ? (
        <div className="mt-4 space-y-2 rounded-card border border-border p-3">
          <p className="text-caption font-weight-label text-muted">
            {t('messaging_encrypt_preview')}
          </p>
          <p className="break-all font-mono text-caption text-fg">{truncatedCiphertext}</p>
          <p className="text-body-sm text-muted">
            {preview.mode === 'ephemeral'
              ? t('messaging_message_one_way').replace('{to}', preview.to)
              : t('messaging_message_encrypted')}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-btn border border-border px-3 py-2 text-body-sm"
          onClick={onClose}
          disabled={pending}
        >
          {t('cancel')}
        </button>
        {!preview ? (
          <button
            type="button"
            className="rounded-btn bg-accent px-3 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
            disabled={!canEncrypt}
            onClick={() => void buildPreview()}
          >
            {encryptPending || !memoKeyReady
              ? t('messaging_encrypt_checking_memo')
              : t('messaging_encrypt_preview')}
          </button>
        ) : (
          <button
            type="button"
            className="rounded-btn bg-accent px-3 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              void onSendEncrypted({
                ciphertext: preview.ciphertext,
                mode: preview.mode,
                to: preview.to,
              })
            }
          >
            {t('messaging_send')}
          </button>
        )}
      </div>
    </AppModal>
  );
}
