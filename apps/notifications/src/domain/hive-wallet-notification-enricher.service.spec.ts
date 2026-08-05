import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import {
  enrichHiveWalletNotificationEvent,
  needsHiveWalletEnrichment,
  vestsAmountToHiveLabel,
} from './hive-wallet-notification-enricher.service';

const chain = {
  totalVestingShares: '1000000000 VESTS',
  totalVestingFundSteem: '500000 HIVE',
};

describe('hive-wallet-notification-enricher', () => {
  it('detects hive wallet events that need enrichment', () => {
    expect(
      needsHiveWalletEnrichment([
        {
          type: 'vote_like',
          occurredAt: '2026-01-01T00:00:00.000Z',
          blockNum: 1,
          trxId: null,
          objectId: null,
          actor: 'a',
          payload: { voter: 'a', author: 'b', permlink: 'p', weight: 1 },
        } as AnyNotificationEvent,
      ]),
    ).toBe(false);

    expect(
      needsHiveWalletEnrichment([
        {
          type: 'power_up',
          occurredAt: '2026-01-01T00:00:00.000Z',
          blockNum: 1,
          trxId: null,
          objectId: null,
          actor: 'wiv01',
          payload: { from: 'wiv01', to: 'wiv01', amount: '0.001' },
        } as AnyNotificationEvent,
      ]),
    ).toBe(true);
  });

  it('converts vests to hive label', () => {
    expect(vestsAmountToHiveLabel('200000000 VESTS', chain)).toBe('100000.000 HIVE');
  });

  it('appends HIVE suffix for power_up', () => {
    const enriched = enrichHiveWalletNotificationEvent(
      {
        type: 'power_up',
        occurredAt: '2026-01-01T00:00:00.000Z',
        blockNum: 1,
        trxId: null,
        objectId: null,
        actor: 'wiv01',
        payload: { from: 'wiv01', to: 'wiv01', amount: '0.001' },
      } as AnyNotificationEvent,
      chain,
    );
    expect(enriched.type).toBe('power_up');
    if (enriched.type === 'power_up') {
      expect(enriched.payload.amount).toBe('0.001 HIVE');
    }
  });

  it('converts power_down vests amount to hive', () => {
    const enriched = enrichHiveWalletNotificationEvent(
      {
        type: 'power_down',
        occurredAt: '2026-01-01T00:00:00.000Z',
        blockNum: 1,
        trxId: null,
        objectId: null,
        actor: 'wiv01',
        payload: { account: 'wiv01', amount: '323272000 VESTS' },
      } as AnyNotificationEvent,
      chain,
    );
    if (enriched.type === 'power_down') {
      expect(enriched.payload.amount).toBe('161636.000 HIVE');
    }
  });

  it('leaves hp undelegation unchanged', () => {
    const event = {
      type: 'hp_delegation',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'wiv01',
      payload: { delegator: 'wiv01', delegatee: 'flowmaster', amount: '0' },
    } as AnyNotificationEvent;
    expect(enrichHiveWalletNotificationEvent(event, chain)).toEqual(event);
  });
});
