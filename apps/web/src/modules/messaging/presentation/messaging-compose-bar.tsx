'use client';

import { useCallback, useMemo, useState } from 'react';

import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { LexicalPostEditor } from '@/modules/editor';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import { buildMessagingMarkdownFromLexical } from '../application/build-messaging-markdown';
import { useMessagingEncryptSend } from '../application/use-messaging-encrypt-send';
import type { SendEncryptedMessageInput } from '../domain/messaging.types';
import { canSendMessageBody, shouldShowPlainSendDisclaimer } from '../domain/messaging.helpers';
import { MESSAGING_COLUMN_FOOTER_SHELL_CLASS } from './messaging-layout.constants';
import { EncryptedSendModal } from './encrypted-send-modal';
import { LockClosedIcon, LockOpenIcon, SendArrowIcon } from './messaging-icons';
import {
  PlainSendDisclaimerModal,
} from './plain-send-disclaimer-modal';

export type MessagingComposeBarProps = {
  channelKind: 'direct' | 'group' | 'object';
  peer?: string | null;
  members?: string[];
  viewerUsername: string | null;
  hasPriorMessages?: boolean;
  disabled?: boolean;
  pending?: boolean;
  pendingEncrypted?: boolean;
  onSendPlain: (body: string) => void | Promise<void>;
  onSendEncrypted: (input: SendEncryptedMessageInput) => boolean | void | Promise<boolean | void>;
  onRequireLogin?: () => void;
};

export function MessagingComposeBar({
  channelKind,
  peer = null,
  members = [],
  viewerUsername,
  hasPriorMessages = true,
  disabled = false,
  pending = false,
  pendingEncrypted = false,
  onSendPlain,
  onSendEncrypted,
  onRequireLogin,
}: MessagingComposeBarProps) {
  const { t } = useI18n();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [bodyLexicalJson, setBodyLexicalJson] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [encryptEnabled, setEncryptEnabled] = useState(false);
  const [plainDisclaimerOpen, setPlainDisclaimerOpen] = useState(false);
  const [encryptModalOpen, setEncryptModalOpen] = useState(false);
  const [keychainGateOpen, setKeychainGateOpen] = useState(false);
  const [pendingPlainBody, setPendingPlainBody] = useState<string | null>(null);
  const [encryptRecipient, setEncryptRecipient] = useState('');
  const {
    keychainMemoAvailable,
    probePending,
    ensureMemoKeyProbed,
    buildEncryptedMessage,
  } = useMessagingEncryptSend(viewerUsername);

  const viewer = viewerUsername?.trim() ?? '';
  const memberOptions = useMemo(() => {
    const needle = viewer.toLowerCase();
    return members
      .map((account) => account.trim())
      .filter((account) => account.length > 0 && account.toLowerCase() !== needle);
  }, [members, viewer]);

  const markdownBody = useMemo(
    () => buildMessagingMarkdownFromLexical(bodyLexicalJson, contentBaseUrl),
    [bodyLexicalJson, contentBaseUrl],
  );

  const resolvedEncryptRecipient = useMemo(() => {
    if (channelKind === 'direct') {
      return (peer ?? encryptRecipient).trim();
    }
    return encryptRecipient.trim();
  }, [channelKind, encryptRecipient, peer]);

  const busy = pending || pendingEncrypted;
  const canSend = canSendMessageBody(markdownBody) && !busy;
  const lockDisabled = busy || probePending || disabled;

  const resetEditor = useCallback(() => {
    setBodyLexicalJson('');
    setEditorKey((key) => key + 1);
  }, []);

  const sendPlain = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!canSendMessageBody(trimmed)) {
        return;
      }
      if (disabled) {
        onRequireLogin?.();
        return;
      }
      resetEditor();
      await onSendPlain(trimmed);
    },
    [disabled, onRequireLogin, onSendPlain, resetEditor],
  );

  const sendEncryptedInline = useCallback(
    async (plaintext: string, recipient: string, oneWayConsent: boolean) => {
      const result = await buildEncryptedMessage({
        body: plaintext,
        recipient,
        viewerUsername: viewer,
        oneWayConsent,
      });
      if (!result.ok) {
        if (result.error === 'consent_required') {
          setEncryptModalOpen(true);
        }
        return;
      }
      const ok = await onSendEncrypted(result.input);
      if (ok !== false) {
        resetEditor();
        setEncryptEnabled(false);
      }
    },
    [buildEncryptedMessage, onSendEncrypted, resetEditor, viewer],
  );

  const requestSend = useCallback(() => {
    if (!canSendMessageBody(markdownBody)) {
      return;
    }
    if (disabled) {
      onRequireLogin?.();
      return;
    }

    if (encryptEnabled) {
      const recipient = resolvedEncryptRecipient;
      if (!recipient) {
        setEncryptModalOpen(true);
        return;
      }
      if (channelKind !== 'direct' || !keychainMemoAvailable) {
        setEncryptModalOpen(true);
        return;
      }
      void (async () => {
        const memoOk = await ensureMemoKeyProbed();
        if (!memoOk) {
          setEncryptModalOpen(true);
          return;
        }
        await sendEncryptedInline(markdownBody, recipient, false);
      })();
      return;
    }

    if (shouldShowPlainSendDisclaimer(hasPriorMessages)) {
      setPendingPlainBody(markdownBody);
      setPlainDisclaimerOpen(true);
      return;
    }
    void sendPlain(markdownBody);
  }, [
    channelKind,
    disabled,
    encryptEnabled,
    ensureMemoKeyProbed,
    hasPriorMessages,
    keychainMemoAvailable,
    markdownBody,
    onRequireLogin,
    resolvedEncryptRecipient,
    sendEncryptedInline,
    sendPlain,
  ]);

  const handleEncryptToggle = useCallback(() => {
    if (lockDisabled) {
      return;
    }
    if (!keychainMemoAvailable) {
      setKeychainGateOpen(true);
      return;
    }
    void (async () => {
      const memoOk = await ensureMemoKeyProbed();
      if (!memoOk) {
        setEncryptEnabled(true);
        return;
      }
      setEncryptEnabled((value) => !value);
    })();
  }, [ensureMemoKeyProbed, keychainMemoAvailable, lockDisabled]);

  return (
    <>
      <div className={MESSAGING_COLUMN_FOOTER_SHELL_CLASS}>
        {encryptEnabled && channelKind === 'group' ? (
          <select
            value={encryptRecipient}
            onChange={(event) => setEncryptRecipient(event.target.value)}
            className="mb-2 w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm"
          >
            <option value="">{t('messaging_encrypt_select_recipient')}</option>
            {memberOptions.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        ) : null}
        <div className="relative w-full min-w-0 pl-5">
          <LexicalPostEditor
            key={editorKey}
            messagingCompact
            compactBottomInset
            composeTrailingInset
            bodyPlaceholder={t('messaging_write_message')}
            onBodyChange={setBodyLexicalJson}
          />
          <div className="pointer-events-none absolute end-1.5 top-1/2 z-[65] flex -translate-y-1/2 items-center gap-0.5">
            <button
              type="button"
              title={
                encryptEnabled
                  ? t('messaging_encrypt_toggle_encrypted')
                  : t('messaging_encrypt_toggle_public')
              }
              aria-label={
                encryptEnabled
                  ? t('messaging_encrypt_toggle_encrypted')
                  : t('messaging_encrypt_toggle_public')
              }
              aria-pressed={encryptEnabled}
              disabled={lockDisabled}
              onClick={handleEncryptToggle}
              className={[
                'pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-circle',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                'disabled:cursor-not-allowed',
                encryptEnabled
                  ? lockDisabled
                    ? 'text-accent/40'
                    : 'text-accent'
                  : 'text-fg-tertiary hover:text-fg-secondary',
              ].join(' ')}
            >
              {encryptEnabled ? (
                <LockClosedIcon className="size-7" />
              ) : (
                <LockOpenIcon className="size-7" />
              )}
            </button>
            <button
              type="button"
              title={t('messaging_send')}
              aria-label={t('messaging_send')}
              disabled={!canSend}
              onClick={requestSend}
              className={[
                'pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-circle bg-accent text-accent-fg',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ].join(' ')}
            >
              <SendArrowIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <PlainSendDisclaimerModal
        open={plainDisclaimerOpen}
        onClose={() => {
          setPlainDisclaimerOpen(false);
          setPendingPlainBody(null);
        }}
        onConfirm={() => {
          const value = pendingPlainBody ?? markdownBody;
          setPlainDisclaimerOpen(false);
          setPendingPlainBody(null);
          void sendPlain(value);
        }}
      />

      <EncryptedSendModal
        open={encryptModalOpen}
        onClose={() => setEncryptModalOpen(false)}
        channelKind={channelKind}
        peer={peer}
        members={members}
        viewerUsername={viewerUsername}
        body={markdownBody}
        pending={pendingEncrypted}
        onSendEncrypted={async (input) => {
          const ok = await onSendEncrypted(input);
          if (ok !== false) {
            resetEditor();
            setEncryptEnabled(false);
            setEncryptModalOpen(false);
          }
        }}
      />

      <AppModal
        open={keychainGateOpen}
        onClose={() => setKeychainGateOpen(false)}
        panelClassName="p-4"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-section font-weight-strong text-fg">
            {t('messaging_encrypt_keychain_required_title')}
          </h2>
          <AppModalCloseButton onClose={() => setKeychainGateOpen(false)} ariaLabel={t('close')} />
        </div>
        <p className="text-body-sm text-muted">{t('messaging_encrypt_keychain_required_body')}</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-btn border border-border px-3 py-2 text-body-sm"
            onClick={() => setKeychainGateOpen(false)}
          >
            {t('close')}
          </button>
        </div>
      </AppModal>
    </>
  );
}
