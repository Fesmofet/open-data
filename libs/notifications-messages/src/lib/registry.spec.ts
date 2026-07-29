import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import { minimalNotificationEventPayload } from '../testing/minimal-payloads';
import { buildNotificationMessage } from './registry';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('buildNotificationMessage', () => {
  it('builds follow message', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'follow',
      payload: { following: 'bob', action: 'follow' },
    });
    expect(msg.key).toBe('notification_following_username');
    expect(msg.params['username']).toBe('alice');
  });

  it('builds transfer_in message', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'transfer_in',
      actor: 'sender',
      payload: {
        from: 'sender',
        to: 'bob',
        amount: '1.000',
        symbol: 'HIVE',
        memo: null,
      },
    });
    expect(msg.key).toBe('notification_transfer_username_amount');
    expect(msg.href).toContain('/transfers');
  });

  it('returns generic for unknown handling gaps', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'trx_processed',
      actor: null,
      payload: {},
    });
    expect(msg.key).toBe('notification_generic_default_message');
  });

  it('covers every declared event type without throwing', () => {
    for (const type of NOTIFICATION_EVENT_TYPES) {
      const event = {
        ...baseEnvelope,
        type,
        payload: minimalNotificationEventPayload(type),
      } as Parameters<typeof buildNotificationMessage>[0];
      expect(() => buildNotificationMessage(event)).not.toThrow();
    }
  });
});

