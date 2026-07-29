import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import { buildNotificationMessage } from '@opden-data-layer/notifications-messages';
import { minimalNotificationEventPayload } from '@opden-data-layer/notifications-messages/testing';
import { EN_NOTIFICATION_DICTIONARY } from './en-dictionary';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('EN_NOTIFICATION_DICTIONARY', () => {
  it('defines en strings for every message-builder key', () => {
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
      const value = EN_NOTIFICATION_DICTIONARY[key];
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});
