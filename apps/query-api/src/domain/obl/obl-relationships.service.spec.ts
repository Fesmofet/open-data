import type { OblInvoice, OblPayment } from '@opden-data-layer/core';
import { OblRelationshipsService } from './obl-relationships.service';
import type { OblRepository } from '../../repositories/obl.repository';

function invoice(id: string, debtor: string, creditor: string): OblInvoice {
  return {
    invoice_id: id,
    contract_id: null,
    issuer: creditor,
    debtor,
    creditor,
    amount_usd: '10.00000000',
    final_amount_usd: null,
    details: {},
    state: 'confirmed',
    pair_low: 'alice',
    pair_high: 'bob',
    created_event_seq: BigInt(100),
    transaction_id: 'tx',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function payment(id: string): OblPayment {
  return {
    payment_id: id,
    payer: 'bob',
    receiver: 'alice',
    amount_usd: '5.00000000',
    declared_amount_usd: '5.00000000',
    method: 'offchain',
    token_symbol: null,
    token_amount: null,
    rate_usd: null,
    state: 'confirmed',
    ref: null,
    pair_low: 'alice',
    pair_high: 'bob',
    created_event_seq: BigInt(110),
    transaction_id: 'tx',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('OblRelationshipsService', () => {
  it('lists relationships without per-counterparty full ledger fetch', async () => {
    const obl = {
      listCounterpartiesPaginated: jest.fn().mockResolvedValue(['bob']),
      summarizeContractsForAccountPairs: jest.fn().mockResolvedValue(
        new Map([['alice:bob', { total: 1, asProvider: 1, asClient: 0 }]]),
      ),
      findLedgerStartedSeqsForPairs: jest.fn().mockResolvedValue(new Map([['alice:bob', null]])),
      latestContractActivitySeqForPairs: jest
        .fn()
        .mockResolvedValue(new Map([['alice:bob', BigInt(200)]])),
      listInvoicesForPairs: jest
        .fn()
        .mockResolvedValue([invoice('inv-1', 'bob', 'alice')]),
      listPaymentsForPairs: jest.fn().mockResolvedValue([payment('pay-1')]),
    } as unknown as OblRepository;

    const service = new OblRelationshipsService(obl);
    const result = await service.listForAccount('alice', {
      account: 'alice',
      limit: 20,
      offset: 0,
    });

    const row = result.items[0];
    expect(row?.counterparty).toBe('bob');
    expect(row?.contractCount).toBe(1);
    expect(row?.lastActivityEventSeq).toBe('200');
    expect(obl.listCounterpartiesPaginated).toHaveBeenCalledWith('alice', 21, 0);
    expect(obl.summarizeContractsForAccountPairs).toHaveBeenCalledTimes(1);
    expect(obl.listInvoicesForPairs).toHaveBeenCalledTimes(1);
    expect(obl.listPaymentsForPairs).toHaveBeenCalledTimes(1);
  });
});
