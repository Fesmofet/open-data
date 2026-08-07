'use client';

import type { ReactNode } from 'react';

import { ModalShell, ModalShellCloseButton } from './modal-shell';
import { APP_MODAL_Z_INDEX } from './modal-shell.constants';

export { APP_MODAL_Z_INDEX };

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  panelClassName?: string;
  zIndex?: number;
};

/**
 * Compact centered dialog built on {@link ModalShell}.
 * For tall or wide overlays use `ModalShell` directly.
 */
export function AppModal({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  panelClassName = '',
  zIndex = APP_MODAL_Z_INDEX,
}: AppModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy={labelledBy}
      describedBy={describedBy}
      zIndex={zIndex}
      panelClassName={panelClassName}
      maxWidthClass="max-w-md"
      scrollBody={false}
    >
      {children}
    </ModalShell>
  );
}

export { ModalShellCloseButton as AppModalCloseButton };
