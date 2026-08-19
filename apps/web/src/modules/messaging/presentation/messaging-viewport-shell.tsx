import type { ReactNode } from 'react';

import { MESSAGING_VIEWPORT_SHELL_CLASS } from './messaging-layout.constants';

export type MessagingViewportShellProps = {
  children: ReactNode;
};

export function MessagingViewportShell({ children }: MessagingViewportShellProps) {
  return <div className={MESSAGING_VIEWPORT_SHELL_CLASS}>{children}</div>;
}
