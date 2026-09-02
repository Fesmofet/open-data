/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { Messages } from '@/i18n/types';

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

import { ObjectActivityFeedList } from './object-activity-feed-list';
import type { MessageItem } from '../domain/messaging.types';

const messages = {
  object_activity_empty: 'No activity yet.',
  object_activity_encrypted_unsupported: 'Encrypted messages are not supported on object activity.',
  object_activity_original_date_caption: 'Originally {datetime}',
  messaging_loading_older: 'Loading older messages...',
} as Messages;

function renderList(items: MessageItem[]) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectActivityFeedList messages={items} viewerUsername="alice" />
    </I18nProvider>,
  );
}

const baseMessage: MessageItem = {
  message_id: 'm1',
  channel_id: 'obj-ch-1',
  author: 'bob',
  body: 'hello',
  encrypted_body: null,
  encryption: null,
  overflow_ref: null,
  reply_to: null,
  quote_json: null,
  attachments: null,
  mentions: [],
  created_at_unix: 1_700_000_000,
  original_created_at_unix: null,
};

describe('ObjectActivityFeedList', () => {
  it('shows originally caption when stamp is present', () => {
    renderList([
      {
        ...baseMessage,
        original_created_at_unix: 1_262_304_000,
      },
    ]);

    expect(screen.getByText(/Originally/i)).toBeInTheDocument();
    expect(screen.getByText(/2010/i)).toBeInTheDocument();
  });

  it('shows created time only when stamp is absent', () => {
    renderList([baseMessage]);

    expect(screen.queryByText(/Originally/i)).not.toBeInTheDocument();
  });
});
