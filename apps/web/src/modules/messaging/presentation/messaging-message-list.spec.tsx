/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

jest.mock('@/shared/presentation/navigation', () => ({
  OptimisticNavLink: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { MessagingMessageList } from './messaging-message-list';
import type { MessageItem } from '../domain/messaging.types';

const messages = {
  messaging_loading_older: 'Loading older messages...',
} as Messages;

describe('MessagingMessageList', () => {
  it('renders outgoing message with accent-soft styling', () => {
    const items: MessageItem[] = [
      {
        message_id: '1',
        channel_id: 'dm-1',
        author: 'alice',
        body: 'hello',
        overflow_ref: null,
        reply_to: null,
        quote_json: null,
        attachments: null,
        mentions: [],
        created_at_unix: 1_694_000_000,
      },
    ];

    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingMessageList messages={items} viewerUsername="alice" />
      </I18nProvider>,
    );

    const bubble = screen.getByText('hello').closest('div');
    expect(bubble?.className).toContain('bg-accent-soft');
    expect(bubble?.className).not.toContain('bg-accent text-accent-fg');
  });

  it('renders incoming message with surface styling', () => {
    const items: MessageItem[] = [
      {
        message_id: '1',
        channel_id: 'dm-1',
        author: 'bob',
        body: 'hello',
        overflow_ref: null,
        reply_to: null,
        quote_json: null,
        attachments: null,
        mentions: [],
        created_at_unix: 1_694_000_000,
      },
    ];

    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingMessageList messages={items} viewerUsername="alice" />
      </I18nProvider>,
    );

    const bubble = screen.getByText('hello').closest('div');
    expect(bubble?.className).toContain('border-border');
    expect(bubble?.className).toContain('bg-surface');
  });

  it('links incoming author name to profile when showAuthorNames is enabled', () => {
    const items: MessageItem[] = [
      {
        message_id: '1',
        channel_id: 'obj-1',
        author: 'flowmaster',
        body: 'test',
        overflow_ref: null,
        reply_to: null,
        quote_json: null,
        attachments: null,
        mentions: [],
        created_at_unix: 1_694_000_000,
      },
    ];

    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <MessagingMessageList
          messages={items}
          viewerUsername="alice"
          showAuthorNames
        />
      </I18nProvider>,
    );

    const link = screen.getByRole('link', { name: 'flowmaster' });
    expect(link).toHaveAttribute('href', '/@flowmaster');
  });
});
