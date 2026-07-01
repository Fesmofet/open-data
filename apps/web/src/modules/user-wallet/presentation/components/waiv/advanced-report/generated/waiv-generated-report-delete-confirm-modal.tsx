'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell } from '@/shared/presentation/components/modal-shell';

type WaivGeneratedReportDeleteConfirmModalProps = {
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function WaivGeneratedReportDeleteConfirmModal({
  open,
  deleting,
  onClose,
  onConfirm,
}: WaivGeneratedReportDeleteConfirmModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const bodyId = useId();

  return (
    <ModalShell
      open={open}
      onClose={deleting ? () => undefined : onClose}
      closeOnBackdrop={!deleting}
      labelledBy={titleId}
      describedBy={bodyId}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            className="rounded-button border border-border bg-surface-control px-4 py-2 text-body-sm disabled:opacity-50"
            disabled={deleting}
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className="rounded-button border border-danger px-4 py-2 text-body-sm text-danger disabled:opacity-50"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? t('activity_loading') : t('delete')}
          </button>
        </div>
      }
    >
      <div className="space-y-3 p-card-padding">
        <h2 id={titleId} className="text-heading-sm font-weight-strong">
          {t('generated_report_delete_title')}
        </h2>
        <p id={bodyId} className="text-body-sm text-muted">
          {t('generated_report_delete_body')}
        </p>
      </div>
    </ModalShell>
  );
}
