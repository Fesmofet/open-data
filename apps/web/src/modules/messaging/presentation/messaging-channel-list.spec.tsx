/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';

jest.mock('@/shared/presentation', () => ({
  profileSectionTabClass: (active: boolean) => (active ? 'active' : 'inactive'),
  UserAvatar: () => null,
}));

jest.mock('@/shared/presentation/layout', () => ({
  HORIZONTAL_TAB_NAV_SUB_ROW_CLASS: 'sub-row',
  horizontalTabNavScrollShellClass: () => 'scroll-shell',
}));

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { MessagingChannelList } from './messaging-channel-list';
import type { ChannelListItem } from '../domain/messaging.types';

const messages = {
  messages: 'Messages',
  messaging_search_chats: 'Search chats',
  messaging_all: 'All',
  messaging_unread: 'Unread',
  messaging_no_channels: 'No conversations yet',
  messaging_new_message: 'New message',
  messaging_list_filter_aria: 'Filters',
} as Messages;

function renderList(channels: ChannelListItem[], onNewMessage?: () => void) {
  return render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <MessagingChannelList
        channels={channels}
        activeChannelId={null}
        onSelectChannel={() => undefined}
        onNewMessage={onNewMessage}
      />
    </I18nProvider>,
  );
}

describe('MessagingChannelList', () => {
  const channels: ChannelListItem[] = [
    {
      channel_id: 'a',
      kind: 'direct',
      display_title: 'WAIVIO Community',
      list_title: 'WAIVIO Community',
      peer: 'alice',
      members: ['alice', 'bob'],
      last_message_at_unix: 100,
      unread_count: 3,
      image: null,
      last_message_preview: 'hi',
    },
    {
      channel_id: 'b',
      kind: 'group',
      display_title: 'Quiet',
      list_title: 'Quiet',
      peer: null,
      members: ['alice'],
      last_message_at_unix: 90,
      unread_count: 0,
      image: null,
      last_message_preview: null,
    },
  ];

  it('Unread tab shows only channels with unread_count > 0', () => {
    renderList(channels);
    act(() => {
      screen.getByRole('button', { name: 'Unread' }).click();
    });
    expect(screen.getByText('WAIVIO Community')).toBeInTheDocument();
    expect(screen.queryByText('Quiet')).not.toBeInTheDocument();
  });

  it('renders New message as footer accent button', () => {
    renderList(channels, jest.fn());
    const button = screen.getByRole('button', { name: 'New message' });
    expect(button.className).toContain('bg-accent');
    expect(button.className).toContain('w-full');
    const messagesHeading = screen.getByRole('heading', { name: 'Messages' });
    expect(
      messagesHeading.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
