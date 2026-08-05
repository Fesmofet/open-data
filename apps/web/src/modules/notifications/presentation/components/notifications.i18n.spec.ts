import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import { buildNotificationMessage } from '@opden-data-layer/notifications-messages';
import { minimalNotificationEventPayload } from '@opden-data-layer/notifications-messages/testing';
import * as enUS from '../../../../i18n/locales/en-US.json';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('Notifications UI i18n keys (en-US)', () => {
  it('defines shell keys for bell and page', () => {
    const keys = [
      'notifications',
      'notifications_empty_message',
      'notification_following_username',
      'like_post_notify_priority',
      'like_post_notify_other',
      'notification_generic_default_message',
      'see_all',
    ] as const;

    for (const key of keys) {
      const value = enUS[key];
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it('defines en-US strings for every message-builder key', () => {
    const keys = new Set<string>();
    for (const type of NOTIFICATION_EVENT_TYPES) {
      const message = buildNotificationMessage({
        ...baseEnvelope,
        type,
        payload: minimalNotificationEventPayload(type),
      } as Parameters<typeof buildNotificationMessage>[0]);
      keys.add(message.key);
    }

    for (const key of keys) {
      const value = enUS[key as keyof typeof enUS];
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});
