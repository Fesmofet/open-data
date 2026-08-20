'use client';

import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { SendEncryptedMessageInput } from '../domain/messaging.types';
import { MESSAGING_COLUMN_FOOTER_SHELL_CLASS } from './messaging-layout.constants';
import { canSendMessageBody } from '../domain/messaging.helpers';
import { EncryptedSendModal } from './encrypted-send-modal';
import { LockClosedIcon, SendArrowIcon } from './messaging-icons';
import {
  PlainSendDisclaimerModal,
  shouldShowPlainSendDisclaimer,
} from './plain-send-disclaimer-modal';

export type MessagingComposeBarProps = {
  channelKind: 'direct' | 'group' | 'object';
  peer?: string | null;
  members?: string[];
  viewerUsername: string | null;
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
  disabled = false,
  pending = false,
  pendingEncrypted = false,
  onSendPlain,
  onSendEncrypted,
  onRequireLogin,
}: MessagingComposeBarProps) {
  const { t } = useI18n();
  const [body, setBody] = useState('');
  const [plainDisclaimerOpen, setPlainDisclaimerOpen] = useState(false);
  const [encryptOpen, setEncryptOpen] = useState(false);
  const [pendingPlainBody, setPendingPlainBody] = useState<string | null>(null);

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
      setBody('');
      await onSendPlain(trimmed);
    },
    [disabled, onRequireLogin, onSendPlain],
  );

  const requestPlainSend = useCallback(() => {
    if (!canSendMessageBody(body)) {
      return;
    }
    if (disabled) {
      onRequireLogin?.();
      return;
    }
    if (shouldShowPlainSendDisclaimer()) {
      setPendingPlainBody(body);
      setPlainDisclaimerOpen(true);
      return;
    }
    void sendPlain(body);
  }, [body, disabled, onRequireLogin, sendPlain]);

  const requestEncryptedSend = useCallback(() => {
    if (!canSendMessageBody(body)) {
      return;
    }
    if (disabled) {
      onRequireLogin?.();
      return;
    }
    setEncryptOpen(true);
  }, [body, disabled, onRequireLogin]);

  const busy = pending || pendingEncrypted;

  return (
    <>
      <div className={MESSAGING_COLUMN_FOOTER_SHELL_CLASS}>
        <div className="flex min-h-[2.5rem] items-end gap-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('messaging_type_message')}
            rows={1}
            disabled={busy}
            className="min-h-[2.5rem] flex-1 resize-none rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg placeholder:text-muted"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                requestPlainSend();
              }
            }}
          />
          <button
            type="button"
            title={t('messaging_send')}
            aria-label={t('messaging_send')}
            disabled={busy || !canSendMessageBody(body)}
            onClick={requestPlainSend}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg disabled:opacity-50"
          >
            <SendArrowIcon className="size-5" />
          </button>
          <button
            type="button"
            title={t('messaging_encrypt_send_title')}
            aria-label={t('messaging_encrypt_send_title')}
            disabled={busy || !canSendMessageBody(body)}
            onClick={requestEncryptedSend}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-fg disabled:opacity-50"
          >
            <LockClosedIcon className="size-5" />
          </button>
        </div>
      </div>

      <PlainSendDisclaimerModal
        open={plainDisclaimerOpen}
        onClose={() => {
          setPlainDisclaimerOpen(false);
          setPendingPlainBody(null);
        }}
        onConfirm={() => {
          const value = pendingPlainBody ?? body;
          setPlainDisclaimerOpen(false);
          setPendingPlainBody(null);
          void sendPlain(value);
        }}
      />

      <EncryptedSendModal
        open={encryptOpen}
        onClose={() => setEncryptOpen(false)}
        channelKind={channelKind}
        peer={peer}
        members={members}
        viewerUsername={viewerUsername}
        body={body}
        pending={pendingEncrypted}
        onSendEncrypted={async (input) => {
          const ok = await onSendEncrypted(input);
          if (ok !== false) {
            setBody('');
            setEncryptOpen(false);
          }
        }}
      />
    </>
  );
}
