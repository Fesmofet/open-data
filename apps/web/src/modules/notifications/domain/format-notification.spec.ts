import {
  applyNotificationParams,
  formatNotification,
  notificationIconType,
  resolveNotificationHref,
} from './format-notification';
import type { UserNotificationItem } from '../infrastructure/notifications-ws-client';

function item(overrides: Partial<UserNotificationItem> = {}): UserNotificationItem {
  return {
    id: 'n1',
    type: 'follow',
    occurredAt: '2026-05-19T10:00:00.000Z',
    blockNum: 1,
    trxId: null,
    objectId: null,
    actor: 'alice',
    payload: { following: 'bob', action: 'follow' },
    ...overrides,
  };
}

describe('formatNotification', () => {
  it('maps follow → notification_following_username with actor param', () => {
    const result = formatNotification(
      item({ type: 'follow', actor: 'alice', payload: { following: 'bob', action: 'follow' } }),
    );
    expect(result.key).toBe('notification_following_username');
    expect(result.params).toEqual({ username: 'alice' });
  });

  it('maps update_vote_cast → notification_update_vote_cast with update detail href', () => {
    const result = formatNotification(
      item({
        type: 'update_vote_cast',
        objectId: 'obj-1',
        actor: 'bob',
        payload: {
          vote: 'for',
          updateId: 'u1',
          updateType: 'name',
          objectName: 'My Shop',
          authorPermlink: 'obj-1',
        },
      }),
    );
    expect(result.key).toBe('notification_update_vote_cast');
    expect(result.params).toEqual({
      user: 'bob',
      update: 'name',
      objectName: 'My Shop',
    });
    expect(result.href).toBe('/object/obj-1/updates/u1');
    expect(result.paramHrefs?.['objectName']).toBe('/object/obj-1/updates/u1');
  });

  it('maps object_created via message builder', () => {
    const result = formatNotification(
      item({
        type: 'object_created',
        objectId: 'obj-1',
        payload: { updateType: 'name' },
      }),
    );
    expect(result.key).toBe('notification_object_update');
    expect(result.params?.update).toBe('name');
  });

  it('uses ? when actor is missing on follow', () => {
    const result = formatNotification(
      item({
        type: 'follow',
        actor: null,
        payload: { following: 'bob', action: 'follow' },
      }),
    );
    expect(result.params).toEqual({ username: '?' });
  });
});

describe('resolveNotificationHref', () => {
  it('builds inbox href for message_direct when viewer is known', () => {
    const formatted = formatNotification(
      item({
        type: 'message_direct',
        payload: {
          channelId: 'dm-1',
          messageId: 'msg-1',
          author: 'bob',
          encrypted: false,
        },
      }),
    );
    const notification = item({
      type: 'message_direct',
      payload: {
        channelId: 'dm-1',
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
      },
    });
    expect(resolveNotificationHref(notification, formatted, 'alice')).toBe(
      '/@alice/messages?channel=dm-1',
    );
  });

  it('returns formatted href for bell_object_message without viewer', () => {
    const formatted = formatNotification(
      item({
        type: 'bell_object_message',
        objectId: 'obj-1',
        payload: {
          channelId: 'obj-ch-1',
          messageId: 'msg-1',
          author: 'bob',
          encrypted: false,
          objectName: 'Shop',
        },
      }),
    );
    const notification = item({
      type: 'bell_object_message',
      objectId: 'obj-1',
      payload: {
        channelId: 'obj-ch-1',
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
        objectName: 'Shop',
      },
    });
    expect(resolveNotificationHref(notification, formatted)).toBe('/object/obj-1/reviews/activity');
  });
});

describe('notificationIconType', () => {
  it.each([
    ['follow', 'follow'],
    ['update_vote_cast', 'object'],
    ['object_created', 'object'],
  ] as const)('type %s → icon %s', (type, expected) => {
    const base = item({ type });
    const withPayload =
      type === 'object_created'
        ? { ...base, objectId: 'o1', payload: { updateType: 'name' } }
        : type === 'update_vote_cast'
          ? {
              ...base,
              objectId: 'o1',
              payload: {
                vote: 'for',
                updateId: 'u1',
                updateType: 'name',
                objectName: 'Shop',
                authorPermlink: 'o1',
              },
            }
          : base;
    expect(notificationIconType(withPayload)).toBe(expected);
  });
});

describe('applyNotificationParams', () => {
  it('substitutes placeholders in template', () => {
    expect(
      applyNotificationParams('{username} started following you', {
        username: 'alice',
      }),
    ).toBe('alice started following you');
  });

  it('returns template unchanged when params omitted', () => {
    expect(applyNotificationParams('You have a new notification')).toBe(
      'You have a new notification',
    );
  });
});
