import type { OblInvoice } from '@opden-data-layer/core';
import type { OdlEventContext } from '../../odl-shared';
import type { OblRepository } from '../../../repositories/obl.repository';
import { DisputeResolveHandler } from './dispute-resolve.handler';

const invoice: OblInvoice = {
  invoice_id: 'inv-1',
  contract_id: null,
  issuer: 'alice',
  debtor: 'bob',
  creditor: 'alice',
  amount_usd: '10.00000000',
  final_amount_usd: null,
  details: {},
  state: 'confirmed',
  pair_low: 'alice',
  pair_high: 'bob',
  created_event_seq: BigInt(10),
  transaction_id: 'tx-inv',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
};

function ctx(): OdlEventContext {
  return {
    action: 'dispute_resolve',
    creator: 'bob',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'tx-resolve',
    timestamp: '2026-01-01T00:00:00.000Z',
    eventSeq: BigInt(30),
    eventIdIndexMap: new Map(),
  };
}

describe('DisputeResolveHandler', () => {
  it('rejects when invoice is not disputed', async () => {
    const runInTransaction = jest.fn();
    const handler = new DisputeResolveHandler({
      findDispute: jest.fn().mockResolvedValue({
        dispute_id: 'd-1',
        invoice_id: 'inv-1',
        status: 'open',
      }),
      findInvoice: jest.fn().mockResolvedValue(invoice),
      findContract: jest.fn(),
      runInTransaction,
      resolveDispute: jest.fn(),
      updateInvoice: jest.fn(),
    } as unknown as OblRepository);

    await handler.handle(
      { dispute_id: 'd-1', resolver: 'bob', final_amount_usd: '8' },
      ctx(),
    );

    expect(runInTransaction).not.toHaveBeenCalled();
  });
});
