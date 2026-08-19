import type { ReactNode } from 'react';

import {
  MESSAGING_PROFILE_SIDE_RAIL_SHELL_CLASS,
  MESSAGING_VIEWPORT_SHELL_CLASS,
} from './messaging-layout.constants';

export type MessagingViewportShellProps = {
  children: ReactNode;
  /** Profile side rails: full column height, top-aligned with center column row. */
  variant?: 'default' | 'sideRail';
};

export function MessagingViewportShell({
  children,
  variant = 'default',
}: MessagingViewportShellProps) {
  const className =
    variant === 'sideRail'
      ? MESSAGING_PROFILE_SIDE_RAIL_SHELL_CLASS
      : MESSAGING_VIEWPORT_SHELL_CLASS;
  return <div className={className}>{children}</div>;
}
