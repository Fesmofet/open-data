import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { DirectRecipientStrategy } from './recipient-strategies';

describe('DirectRecipientStrategy', () => {
  const strategy = new DirectRecipientStrategy();

  it('routes engine_delegate to delegatee', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'engine_delegate',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'wiv01',
      payload: {
        from: 'wiv01',
        to: 'flowmaster',
        amount: '0.001',
        symbol: 'WAIV',
      },
    } as AnyNotificationEvent);
    expect(recipients).toEqual(['flowmaster']);
  });

  it('routes engine_undelegate to actor', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'engine_undelegate',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'wiv01',
      payload: {
        from: 'wiv01',
        to: 'flowmaster',
        amount: '0.002',
        symbol: 'WAIV',
      },
    } as AnyNotificationEvent);
    expect(recipients).toEqual(['wiv01']);
  });
});
