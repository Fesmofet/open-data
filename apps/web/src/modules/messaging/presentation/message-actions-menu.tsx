'use client';

import type { ReactNode } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { MessageActionFlags } from '../domain/resolve-message-actions';

export type MessageActionsMenuProps = {
  actions: MessageActionFlags;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  className?: string;
};

function MenuButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        'block w-full px-3 py-2 text-start text-body-sm',
        danger ? 'text-error hover:bg-error/10' : 'text-fg hover:bg-surface-muted',
      ].join(' ')}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function MessageActionsMenu({
  actions,
  onEdit,
  onDelete,
  onReply,
  onCopy,
  className = '',
}: MessageActionsMenuProps) {
  const { t } = useI18n();
  const items: ReactNode[] = [];

  if (actions.edit && onEdit) {
    items.push(
      <MenuButton key="edit" label={t('messaging_action_edit')} onClick={onEdit} />,
    );
  }
  if (actions.copy && onCopy) {
    items.push(
      <MenuButton key="copy" label={t('messaging_action_copy')} onClick={onCopy} />,
    );
  }
  if (actions.reply && onReply) {
    items.push(
      <MenuButton key="reply" label={t('messaging_action_reply')} onClick={onReply} />,
    );
  }
  if (actions.delete && onDelete) {
    items.push(
      <MenuButton
        key="delete"
        label={t('messaging_action_delete')}
        onClick={onDelete}
        danger
      />,
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={[
        'min-w-[9rem] overflow-hidden rounded-btn border border-border bg-surface py-1 shadow-md',
        className,
      ].join(' ')}
      role="menu"
    >
      {items}
    </div>
  );
}
