import {
  applyNotificationParams,
  formatNotification,
  notificationIconType,
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

  it('maps update_vote_cast → notification_upvoted_username_post', () => {
    const result = formatNotification(
      item({
        type: 'update_vote_cast',
        actor: 'bob',
        payload: { vote: 'for', updateId: 'u1' },
      }),
    );
    expect(result.key).toBe('notification_upvoted_username_post');
    expect(result.params).toEqual({ username: 'bob' });
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

describe('notificationIconType', () => {
  it.each([
    ['follow', 'follow'],
    ['update_vote_cast', 'vote'],
    ['object_created', 'object'],
  ] as const)('type %s → icon %s', (type, expected) => {
    const base = item({ type });
    const withPayload =
      type === 'object_created'
        ? { ...base, objectId: 'o1', payload: { updateType: 'name' } }
        : type === 'update_vote_cast'
          ? { ...base, payload: { vote: 'for', updateId: 'u1' } }
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
