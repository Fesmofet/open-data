'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

export type DeleteMessageModalProps = {
  open: boolean;
  onClose: () => void;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteMessageModal({
  open,
  onClose,
  pending = false,
  onConfirm,
}: DeleteMessageModalProps) {
  const { t } = useI18n();
  const titleId = 'delete-message-title';

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId} panelClassName="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-section font-weight-strong text-fg">
          {t('messaging_delete_confirm_title')}
        </h2>
        <AppModalCloseButton onClose={onClose} ariaLabel={t('close')} />
      </div>
      <p className="mb-4 text-body-sm text-muted">{t('messaging_delete_confirm_body')}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-btn px-4 py-2 text-body-sm text-fg hover:bg-surface-control disabled:opacity-50"
          disabled={pending}
          onClick={onClose}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className="rounded-btn bg-error px-4 py-2 text-body-sm font-weight-label text-error-fg disabled:opacity-50"
          disabled={pending}
          onClick={() => void onConfirm()}
        >
          {t('messaging_action_delete')}
        </button>
      </div>
    </AppModal>
  );
}
