import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { buildMessagingMessage } from './messaging';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('buildMessagingMessage', () => {
  it('maps message_direct to author profile param href', () => {
    const msg = buildMessagingMessage({
      ...baseEnvelope,
      type: 'message_direct',
      payload: {
        channelId: 'dm-1',
        messageId: 'msg-1',
        author: 'bob',
        encrypted: false,
      },
    } as AnyNotificationEvent);
    expect(msg?.key).toBe('notification_message_direct');
    expect(msg?.params).toEqual({ author: 'bob' });
    expect(msg?.paramHrefs?.['author']).toBe('/@bob');
  });

  it('maps message_group with channel title fallback to channelId', () => {
    const msg = buildMessagingMessage({
      ...baseEnvelope,
      type: 'message_group',
      payload: {
        channelId: 'grp-1',
        messageId: 'msg-2',
        author: 'alice',
        channelTitle: null,
        encrypted: true,
      },
    } as AnyNotificationEvent);
    expect(msg?.key).toBe('notification_message_group');
    expect(msg?.params).toEqual({ channelTitle: 'grp-1' });
  });

  it('maps bell_object_message with object page href', () => {
    const msg = buildMessagingMessage({
      ...baseEnvelope,
      type: 'bell_object_message',
      objectId: 'obj-1',
      payload: {
        channelId: 'obj-ch-1',
        messageId: 'msg-3',
        author: 'carol',
        encrypted: false,
        objectName: 'My Shop',
      },
    } as AnyNotificationEvent);
    expect(msg?.key).toBe('notification_bell_object_message');
    expect(msg?.params).toEqual({ author: 'carol', objectName: 'My Shop' });
    expect(msg?.href).toBe('/object/obj-1');
  });
});
