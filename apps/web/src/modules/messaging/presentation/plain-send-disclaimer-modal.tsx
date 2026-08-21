'use client';

import { useId, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import {
  dismissPlainSendDisclaimer,
} from '../domain/messaging.helpers';

export type PlainSendDisclaimerModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PlainSendDisclaimerModal({
  open,
  onClose,
  onConfirm,
}: PlainSendDisclaimerModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId} panelClassName="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-section font-weight-strong text-fg">
          {t('messaging_plain_send_disclaimer_title')}
        </h2>
        <AppModalCloseButton onClose={onClose} ariaLabel={t('close')} />
      </div>
      <p className="text-body-sm text-muted">{t('messaging_plain_send_disclaimer_body')}</p>
      <label className="mt-4 flex items-center gap-2 text-body-sm text-fg">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(event) => setDontShowAgain(event.target.checked)}
        />
        {t('messaging_plain_send_dont_show_again')}
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-btn border border-border px-3 py-2 text-body-sm"
          onClick={onClose}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className="rounded-btn bg-accent px-3 py-2 text-body-sm font-weight-label text-accent-fg"
          onClick={() => {
            if (dontShowAgain) {
              dismissPlainSendDisclaimer();
            }
            onConfirm();
          }}
        >
          {t('messaging_send')}
        </button>
      </div>
    </AppModal>
  );
}
