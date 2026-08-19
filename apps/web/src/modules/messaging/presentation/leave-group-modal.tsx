'use client';

import { useEffect, useId, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import type { ChannelDetail, ChannelLeavePolicy } from '../domain/messaging.types';

export type LeaveGroupModalProps = {
  open: boolean;
  onClose: () => void;
  channel: ChannelDetail | null;
  leavePolicy: ChannelLeavePolicy;
  pending?: boolean;
  onConfirm: (input: {
    successorAdmin?: string;
    deleteMyMessages: boolean;
  }) => void | Promise<void>;
};

export function LeaveGroupModal({
  open,
  onClose,
  channel,
  leavePolicy,
  pending = false,
  onConfirm,
}: LeaveGroupModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [deleteMyMessages, setDeleteMyMessages] = useState(false);
  const [successorAdmin, setSuccessorAdmin] = useState('');

  useEffect(() => {
    if (!open) {
      setDeleteMyMessages(false);
      setSuccessorAdmin('');
    }
  }, [open]);

  const title = channel?.display_title ?? channel?.title ?? channel?.channel_id ?? '';
  const canConfirm =
    leavePolicy.can_leave &&
    (!leavePolicy.requires_successor || successorAdmin.trim().length > 0);

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId} panelClassName="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-section font-weight-strong text-fg">
          {t('messaging_leave_group')}
        </h2>
        <AppModalCloseButton onClose={onClose} ariaLabel={t('close')} />
      </div>
      <p className="text-body-sm text-muted">
        {t('messaging_leave_group_confirm').replace('{title}', title)}
      </p>
      {leavePolicy.requires_successor ? (
        <div className="mt-4">
          <label className="block">
            <span className="mb-1 block text-body-sm font-weight-label text-fg">
              {t('messaging_leave_select_admin')}
            </span>
            <select
              value={successorAdmin}
              onChange={(event) => setSuccessorAdmin(event.target.value)}
              className="w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg"
            >
              <option value="">{t('messaging_leave_select_admin_placeholder')}</option>
              {leavePolicy.eligible_successors.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
          </label>
          {!successorAdmin.trim() ? (
            <p className="mt-2 text-caption text-muted">
              {t('messaging_leave_select_admin_required')}
            </p>
          ) : null}
        </div>
      ) : null}
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-body-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
          checked={deleteMyMessages}
          onChange={(event) => setDeleteMyMessages(event.target.checked)}
        />
        <span className="text-fg">{t('messaging_leave_delete_messages')}</span>
      </label>
      {deleteMyMessages ? (
        <p className="mt-2 text-caption text-muted">
          {t('messaging_leave_delete_messages_hint')}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-btn px-4 py-2 text-body-sm text-fg hover:bg-surface-control"
          onClick={onClose}
          disabled={pending}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className="rounded-btn bg-error px-4 py-2 text-body-sm font-weight-label text-error-fg disabled:opacity-50"
          disabled={!canConfirm || pending}
          onClick={() =>
            void onConfirm({
              successorAdmin: successorAdmin.trim() || undefined,
              deleteMyMessages,
            })
          }
        >
          {t('messaging_leave_confirm')}
        </button>
      </div>
    </AppModal>
  );
}
