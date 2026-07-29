import {
  NOTIFICATION_EVENT_TYPES,
  type NotificationEvent,
} from './notification-payloads';
import { notificationEventSchema } from './notification-event.schema';

describe('NotificationEvent contract', () => {
  it('accepts a minimal valid trx_processed event', () => {
    const event: NotificationEvent = {
      type: 'trx_processed',
      occurredAt: '2026-04-16T10:00:00.000Z',
      blockNum: 1,
      trxId: 'abc',
      objectId: null,
      actor: null,
      payload: {},
    };
    expect(notificationEventSchema.safeParse(event).success).toBe(true);
  });

  it('includes all event type literals', () => {
    expect(NOTIFICATION_EVENT_TYPES.length).toBeGreaterThan(5);
    expect(NOTIFICATION_EVENT_TYPES).toContain('follow');
    expect(NOTIFICATION_EVENT_TYPES).toContain('transfer_in');
  });

  it('rejects unknown notification type', () => {
    const parsed = notificationEventSchema.safeParse({
      type: 'activationCampaign',
      occurredAt: '2026-04-16T10:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: null,
      payload: {},
    });
    expect(parsed.success).toBe(false);
  });
});
