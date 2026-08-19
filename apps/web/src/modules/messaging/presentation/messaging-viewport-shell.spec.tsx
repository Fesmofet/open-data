/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';

import {
  MESSAGING_PROFILE_SIDE_RAIL_SHELL_CLASS,
  MESSAGING_VIEWPORT_SHELL_CLASS,
} from './messaging-layout.constants';
import { MessagingViewportShell } from './messaging-viewport-shell';

describe('MessagingViewportShell', () => {
  it('uses default viewport class', () => {
    const { container } = render(
      <MessagingViewportShell>
        <div>Child</div>
      </MessagingViewportShell>,
    );
    expect(container.firstElementChild?.className).toContain(MESSAGING_VIEWPORT_SHELL_CLASS);
    expect(container.firstElementChild?.className).not.toContain(
      '--shell-messaging-submenu-chrome',
    );
  });

  it('uses full viewport height for profile side rails', () => {
    const { container } = render(
      <MessagingViewportShell variant="sideRail">
        <div>Child</div>
      </MessagingViewportShell>,
    );
    expect(container.firstElementChild?.className).toContain(
      MESSAGING_PROFILE_SIDE_RAIL_SHELL_CLASS,
    );
    expect(container.firstElementChild?.className).toContain(MESSAGING_VIEWPORT_SHELL_CLASS);
    expect(container.firstElementChild?.className).not.toContain('pt-[var(--shell-messaging-submenu-chrome');
  });
});
