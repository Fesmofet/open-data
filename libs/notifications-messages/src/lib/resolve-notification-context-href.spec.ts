import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';

import { inboxPath } from './links';
import { resolveNotificationContextHref } from './resolve-notification-context-href';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('inboxPath', () => {
  it('builds inbox URL for a DM channel', () => {
    expect(inboxPath('alice', 'dm-1')).toBe('/@alice/messages?channel=dm-1');
  });

  it('percent-encodes username and channelId', () => {
    expect(inboxPath('a b', 'dm/1')).toBe('/@a%20b/messages?channel=dm%2F1');
  });
});

describe('resolveNotificationContextHref', () => {
  it('direct message with recipient resolves to inbox', () => {
    const event = {
      ...baseEnvelope,
      type: 'message_direct',
      payload: {
        channelId: 'dm-1',
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
      },
    } as AnyNotificationEvent;

    expect(
      resolveNotificationContextHref(
        event,
        {
          key: 'notification_message_direct',
          params: { author: 'bob' },
          href: null,
          icon: 'bell',
          actor: 'bob',
        },
        'flowmaster',
      ),
    ).toBe('/@flowmaster/messages?channel=dm-1');
  });

  it('group message with recipient resolves to inbox', () => {
    const event = {
      ...baseEnvelope,
      type: 'message_group',
      payload: {
        channelId: 'grp-1',
        messageId: 'msg-2',
        author: 'alice',
        channelTitle: null,
        encrypted: true,
      },
    } as AnyNotificationEvent;

    expect(
      resolveNotificationContextHref(
        event,
        {
          key: 'notification_message_group',
          params: { channelTitle: 'grp-1' },
          href: null,
          icon: 'bell',
          actor: 'alice',
        },
        'flowmaster',
      ),
    ).toBe('/@flowmaster/messages?channel=grp-1');
  });

  it('reply context stays the comment permalink when recipient is present', () => {
    const event = {
      ...baseEnvelope,
      type: 'reply',
      payload: {
        author: 'littlechef',
        permlink: 'c1',
        parentAuthor: 'alice',
        parentPermlink: 'p1',
        isReplyToComment: true,
      },
    } as AnyNotificationEvent;

    expect(
      resolveNotificationContextHref(
        event,
        {
          key: 'notification_reply_username_comment',
          params: { username: 'littlechef' },
          href: '/@littlechef/c1',
          icon: 'reply',
          actor: 'littlechef',
        },
        'alice',
      ),
    ).toBe('/@littlechef/c1');
  });

  it('direct message without recipient does not invent an inbox', () => {
    const event = {
      ...baseEnvelope,
      type: 'message_direct',
      payload: {
        channelId: 'dm-1',
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
      },
    } as AnyNotificationEvent;

    expect(
      resolveNotificationContextHref(event, {
        key: 'notification_message_direct',
        params: { author: 'bob' },
        href: null,
        icon: 'bell',
        actor: 'bob',
      }),
    ).toBeNull();
  });

  it('direct message without channelId does not invent an inbox', () => {
    const event = {
      ...baseEnvelope,
      type: 'message_direct',
      payload: {
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
      },
    } as AnyNotificationEvent;

    expect(
      resolveNotificationContextHref(
        event,
        {
          key: 'notification_message_direct',
          params: { author: 'bob' },
          href: null,
          icon: 'bell',
          actor: 'bob',
        },
        'alice',
      ),
    ).toBeNull();
  });

  it('blank recipient is treated as missing', () => {
    const event = {
      ...baseEnvelope,
      type: 'message_direct',
      payload: {
        channelId: 'dm-1',
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
      },
    } as AnyNotificationEvent;

    expect(
      resolveNotificationContextHref(
        event,
        {
          key: 'notification_message_direct',
          params: { author: 'bob' },
          href: null,
          icon: 'bell',
          actor: 'bob',
        },
        '   ',
      ),
    ).toBeNull();
  });
});
