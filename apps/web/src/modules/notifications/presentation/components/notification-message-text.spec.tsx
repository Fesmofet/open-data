/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { NotificationMessageText } from './notification-message-text';

describe('NotificationMessageText', () => {
  it('renders placeholder values as accent links when paramHrefs provided', () => {
    render(
      <NotificationMessageText
        template="{username} commented on your post"
        params={{ username: 'alice' }}
        paramHrefs={{ username: '/@alice' }}
      />,
    );
    const link = screen.getByRole('link', { name: 'alice' });
    expect(link).toHaveAttribute('href', '/@alice');
    expect(link).toHaveClass('text-accent');
  });
});
