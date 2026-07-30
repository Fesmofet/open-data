import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import {
  buildNotificationMessage,
  GENERIC_NOTIFICATION_KEY,
  renderTelegramBody,
} from '@opden-data-layer/notifications-messages';
import { minimalNotificationEventPayload } from '@opden-data-layer/notifications-messages/testing';
import { EN_NOTIFICATION_DICTIONARY } from './en-dictionary';

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/;

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('EN_NOTIFICATION_DICTIONARY', () => {
  it.each(NOTIFICATION_EVENT_TYPES)(
    'covers %s message key with renderable Telegram copy',
    (type) => {
      const event = {
        ...baseEnvelope,
        type,
        payload: minimalNotificationEventPayload(type),
      } as Parameters<typeof buildNotificationMessage>[0];

      const message = buildNotificationMessage(event);
      if (message.key === GENERIC_NOTIFICATION_KEY) {
        expect(EN_NOTIFICATION_DICTIONARY[message.key]).toBeDefined();
        return;
      }

      expect(EN_NOTIFICATION_DICTIONARY[message.key]).toBeDefined();

      const body = renderTelegramBody(message, EN_NOTIFICATION_DICTIONARY);
      expect(body).not.toMatch(PLACEHOLDER_RE);
      expect(body).not.toBe('You have a new notification');
    },
  );
});
