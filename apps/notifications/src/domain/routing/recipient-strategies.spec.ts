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

  it('routes engine_transfer_out to sender', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'engine_transfer_out',
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
        memo: null,
      },
    } as AnyNotificationEvent);
    expect(recipients).toEqual(['wiv01']);
  });

  it('drops transfer_out for self-transfer', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'transfer_out',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'alice',
      payload: {
        from: 'alice',
        to: 'Alice',
        amount: '1.000',
        symbol: 'HIVE',
        memo: null,
      },
    } as AnyNotificationEvent);
    expect(recipients).toEqual([]);
  });

  it('drops engine_transfer_out for self-transfer', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'engine_transfer_out',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'alice',
      payload: {
        from: 'alice',
        to: 'Alice',
        amount: '0.001',
        symbol: 'WAIV',
        memo: null,
      },
    } as AnyNotificationEvent);
    expect(recipients).toEqual([]);
  });

  it('routes engine_swap to account', async () => {
    const recipients = await strategy.resolveRecipients({
      type: 'engine_swap',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'nervi',
      payload: {
        account: 'nervi',
        symbolOut: 'SWAP.HIVE',
        symbolIn: 'WAIV',
        symbolOutQuantity: '1',
        symbolInQuantity: '2',
      },
    } as AnyNotificationEvent);
    expect(recipients).toEqual(['nervi']);
  });
});
