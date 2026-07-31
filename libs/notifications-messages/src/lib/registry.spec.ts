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

  it('builds update_vote_cast message with update detail href', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'update_vote_cast',
      objectId: 'obj-1',
      actor: 'voter',
      payload: {
        updateId: 'upd-1',
        vote: 'for',
        updateType: 'name',
        objectName: 'Shop',
        authorPermlink: 'obj-1',
      },
    });
    expect(msg.key).toBe('notification_update_vote_cast');
    expect(msg.href).toBe('/object/obj-1/updates/upd-1');
    expect(msg.icon).toBe('object');
  });

  it('builds update_vote_cast with fallback update type when updateType is missing', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'update_vote_cast',
      objectId: 'obj-1',
      actor: 'voter',
      payload: {
        updateId: 'upd-1',
        vote: 'for',
        updateType: 'name',
        objectName: 'Shop',
        authorPermlink: 'obj-1',
      },
    });
    const legacy = buildNotificationMessage({
      ...baseEnvelope,
      type: 'update_vote_cast',
      objectId: 'obj-1',
      actor: 'voter',
      payload: {
        updateId: 'upd-1',
        vote: 'for',
        updateType: '',
        objectName: null,
        authorPermlink: 'obj-1',
      },
    });
    expect(legacy.params['update']).toBe('update');
    expect(msg.params['update']).toBe('name');
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

