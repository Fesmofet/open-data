'use client';

import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { canSendMessageBody } from '../domain/messaging.helpers';

export type MessagingComposeBarProps = {
  disabled?: boolean;
  pending?: boolean;
  onSend: (body: string) => void | Promise<void>;
  onRequireLogin?: () => void;
};

export function MessagingComposeBar({
  disabled = false,
  pending = false,
  onSend,
  onRequireLogin,
}: MessagingComposeBarProps) {
  const { t } = useI18n();
  const [body, setBody] = useState('');

  const submit = useCallback(async () => {
    if (!canSendMessageBody(body)) {
      return;
    }
    if (disabled) {
      onRequireLogin?.();
      return;
    }
    const value = body;
    setBody('');
    await onSend(value);
  }, [body, disabled, onRequireLogin, onSend]);

  return (
    <div className="border-t border-border bg-bg px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('messaging_type_message')}
          rows={1}
          disabled={pending}
          className="min-h-[2.5rem] flex-1 resize-none rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg placeholder:text-muted"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <button
          type="button"
          disabled={pending || !canSendMessageBody(body)}
          onClick={() => void submit()}
          className="rounded-full bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
        >
          {t('messaging_send')}
        </button>
      </div>
    </div>
  );
}
