'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell } from '@/shared/presentation';

import type { MessageActionFlags } from '../domain/resolve-message-actions';
import { MessageActionsMenu } from './message-actions-menu';

export type MessageActionsSheetProps = {
  open: boolean;
  onClose: () => void;
  actions: MessageActionFlags;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onCopy?: () => void;
};

export function MessageActionsSheet({
  open,
  onClose,
  actions,
  onEdit,
  onDelete,
  onReply,
  onCopy,
}: MessageActionsSheetProps) {
  const { t } = useI18n();

  const run = (fn?: () => void) => {
    onClose();
    fn?.();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="sheet"
      ariaLabel={t('messaging_action_more_aria')}
      scrollBody={false}
      header={
        <div className="border-b border-border px-gutter pb-3 pt-2">
          <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border" aria-hidden />
        </div>
      }
    >
      <div className="px-gutter pb-6">
        <MessageActionsMenu
          actions={actions}
          onReply={() => run(onReply)}
          onCopy={() => run(onCopy)}
          onEdit={() => run(onEdit)}
          onDelete={() => run(onDelete)}
          className="w-full border-0 shadow-none"
        />
      </div>
    </ModalShell>
  );
}
