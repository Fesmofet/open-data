/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';

import type { UserNotificationItem } from '../../infrastructure/notifications-ws-client';
import { NotificationRow } from './notification-row';

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        notification_reply_username_comment: '{username} has replied to your comment',
        notification_transfer_username_amount: '{username} transferred {amount} to {to}',
        notification_message_direct: 'You have a new message from {author}',
        import_update: 'Import completed for {cid}',
      };
      return map[key] ?? key;
    },
    locale: 'en-US',
  }),
}));

jest.mock('@/shared/utils/format-relative-time', () => ({
  formatRelativeFeedTime: () => '1 minute ago',
}));

jest.mock('@/shared/presentation', () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <span data-testid={`avatar-${username}`}>{username}</span>
  ),
}));

function item(overrides: Partial<UserNotificationItem> = {}): UserNotificationItem {
  return {
    id: 'n1',
    type: 'reply',
    occurredAt: '2026-05-19T10:00:00.000Z',
    blockNum: 1,
    trxId: null,
    objectId: null,
    actor: 'littlechef',
    payload: {},
    ...overrides,
  };
}

function findOverlayLink(container: HTMLElement): HTMLAnchorElement | null {
  return container.querySelector('a.absolute.inset-0');
}

describe('NotificationRow', () => {
  it('reply row exposes context overlay and actor profile as separate links', () => {
    const { container } = render(
      <NotificationRow
        item={item({
          type: 'reply',
          actor: 'littlechef',
          payload: {
            author: 'littlechef',
            permlink: 'c1',
            parentAuthor: 'alice',
            parentPermlink: 'p1',
            isReplyToComment: true,
          },
        })}
      />,
    );

    const overlay = findOverlayLink(container);
    expect(overlay).toHaveAttribute('href', '/@littlechef/c1');

    const avatarLink = screen.getByTestId('avatar-littlechef').closest('a');
    expect(avatarLink).toHaveAttribute('href', '/@littlechef');

    const usernameLinks = screen.getAllByRole('link', { name: 'littlechef' });
    const inlineUsernameLink = usernameLinks.find((el) =>
      el.classList.contains('text-accent'),
    );
    expect(inlineUsernameLink).toHaveAttribute('href', '/@littlechef');

    expect(overlay?.contains(inlineUsernameLink!)).toBe(false);
    expect(overlay?.contains(avatarLink)).toBe(false);
  });

  it('transfer row overlay goes to the wallet, not the sender profile', () => {
    const { container } = render(
      <NotificationRow
        item={item({
          type: 'transfer_in',
          actor: 'wiv01',
          payload: {
            from: 'wiv01',
            to: 'alice',
            amount: '0.001',
            symbol: 'HIVE',
            memo: null,
          },
        })}
      />,
    );

    const overlay = findOverlayLink(container);
    expect(overlay).toHaveAttribute('href', '/@alice/transfers?type=transfer');

    const avatarLink = screen.getByTestId('avatar-wiv01').closest('a');
    expect(avatarLink).toHaveAttribute('href', '/@wiv01');
  });

  it('direct message row with viewer overlays the inbox', () => {
    const { container } = render(
      <NotificationRow
        viewerUsername="alice"
        item={item({
          type: 'message_direct',
          actor: 'bob',
          payload: {
            channelId: 'dm-1',
            messageId: 'msg-1',
            author: 'bob',
            encrypted: false,
          },
        })}
      />,
    );

    const overlay = findOverlayLink(container);
    expect(overlay).toHaveAttribute('href', '/@alice/messages?channel=dm-1');

    const avatarLink = screen.getByTestId('avatar-bob').closest('a');
    expect(avatarLink).toHaveAttribute('href', '/@bob');
  });

  it('row without context href has no overlay navigation', () => {
    const { container } = render(
      <NotificationRow
        item={item({
          type: 'message_direct',
          actor: 'bob',
          payload: {
            channelId: 'dm-1',
            messageId: 'msg-1',
            author: 'bob',
            encrypted: false,
          },
        })}
      />,
    );

    expect(findOverlayLink(container)).toBeNull();
    expect(screen.getByTestId('avatar-bob').closest('a')).toHaveAttribute('href', '/@bob');
  });

  it('row without actor shows type icon instead of avatar profile link', () => {
    const { container } = render(
      <NotificationRow
        item={item({
          type: 'batch_import_completed',
          actor: null,
          payload: { cid: 'QmTest' },
        })}
      />,
    );

    expect(findOverlayLink(container)).toBeNull();
    expect(screen.queryByRole('link', { name: /QmTest/i })).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('overlay click invokes onNavigate; modifier-click does not', () => {
    const onNavigate = jest.fn();
    const { container } = render(
      <NotificationRow
        onNavigate={onNavigate}
        item={item({
          type: 'reply',
          actor: 'littlechef',
          payload: {
            author: 'littlechef',
            permlink: 'c1',
            parentAuthor: 'alice',
            parentPermlink: 'p1',
            isReplyToComment: true,
          },
        })}
      />,
    );

    const overlay = findOverlayLink(container);
    expect(overlay).not.toBeNull();

    fireEvent.click(overlay!);
    expect(onNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(overlay!, { ctrlKey: true });
    expect(onNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(overlay!, { metaKey: true });
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
